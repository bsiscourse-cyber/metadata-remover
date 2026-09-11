import ExifReader from 'exifreader';
import { ImageMetadataReport, DetectedAITrace } from '../types';

/**
 * Parses all embedded metadata and inspects for AI signatures,
 * prompt logs, C2PA manifests, and GPS coordinates.
 */
export async function extractMetadata(file: File | Blob): Promise<ImageMetadataReport> {
  const buffer = await file.arrayBuffer();
  
  let tags: any = {};
  try {
    tags = ExifReader.load(buffer, { expanded: true });
  } catch (err) {
    console.warn('ExifReader warning or unreadable header:', err);
  }

  const rawTags: Record<string, string> = {};
  const aiTraces: DetectedAITrace[] = [];
  let hasGps = false;
  let c2paDetected = false;

  // Check C2PA in binary buffer (JUMBF / c2pa / manifest box)
  try {
    const uint8 = new Uint8Array(buffer);
    const binaryHeader = new TextDecoder('latin1').decode(uint8.slice(0, Math.min(uint8.length, 65536)));
    if (binaryHeader.includes('c2pa') || binaryHeader.includes('jumb') || binaryHeader.includes('urn:c2pa')) {
      c2paDetected = true;
      aiTraces.push({
        type: 'C2PA / Content Credentials',
        description: 'C2PA Content Authenticity Manifest detected. Contains provenance and generation claims.',
        field: 'JUMBF Box',
      });
    }
  } catch (e) {
    // Ignore binary scan errors
  }

  // Camera & Device info
  let camera: ImageMetadataReport['camera'] | undefined;
  let make = '';
  let model = '';
  let lens = '';
  let software = '';
  let dateTime = '';

  // Extract from Expanded Tags
  if (tags.exif) {
    for (const [key, val] of Object.entries<any>(tags.exif)) {
      if (val && val.description) {
        rawTags[`EXIF:${key}`] = String(val.description);
      }
    }
    make = tags.exif.Make?.description || '';
    model = tags.exif.Model?.description || '';
    lens = tags.exif.LensModel?.description || '';
    software = tags.exif.Software?.description || '';
    dateTime = tags.exif.DateTimeOriginal?.description || tags.exif.DateTime?.description || '';
  }

  if (make || model || lens) {
    camera = {
      make: make || undefined,
      model: model || undefined,
      lens: lens || undefined,
      focalLength: tags.exif?.FocalLength?.description,
      iso: tags.exif?.ISOSpeedRatings?.description,
      exposureTime: tags.exif?.ExposureTime?.description,
      fNumber: tags.exif?.FNumber?.description,
    };
  }

  // Check Software tag for AI signatures
  if (software) {
    const swLower = software.toLowerCase();
    if (swLower.includes('midjourney')) {
      aiTraces.push({
        type: 'Midjourney',
        description: `Midjourney software tag found: "${software}"`,
        field: 'Software',
        rawSnippet: software,
      });
    } else if (swLower.includes('invokeai') || swLower.includes('automatic1111') || swLower.includes('fooocus') || swLower.includes('comfyui')) {
      aiTraces.push({
        type: 'Stable Diffusion',
        description: `AI Generation Software identified: "${software}"`,
        field: 'Software',
        rawSnippet: software,
      });
    }
  }

  // Extract GPS
  let gpsData: ImageMetadataReport['gps'] | undefined;
  if (tags.gps && (tags.gps.Latitude || tags.gps.Longitude)) {
    hasGps = true;
    const lat = typeof tags.gps.Latitude === 'number' ? tags.gps.Latitude : parseFloat(tags.gps.Latitude?.description);
    const lng = typeof tags.gps.Longitude === 'number' ? tags.gps.Longitude : parseFloat(tags.gps.Longitude?.description);
    const alt = tags.gps.Altitude?.description ? parseFloat(tags.gps.Altitude.description) : undefined;

    if (!isNaN(lat) && !isNaN(lng)) {
      gpsData = {
        latitude: lat,
        longitude: lng,
        altitude: alt,
        latitudeRef: tags.gps.LatitudeRef?.value?.[0] || 'N',
        longitudeRef: tags.gps.LongitudeRef?.value?.[0] || 'E',
      };
    }
  }

  // Extract PNG Text Chunks (Automatic1111 parameters, ComfyUI prompt/workflow)
  if (tags.pngText) {
    for (const [key, val] of Object.entries<any>(tags.pngText)) {
      const textVal = String(val.description || val.value || '');
      rawTags[`PNG:${key}`] = textVal;

      const lowerKey = key.toLowerCase();
      const lowerVal = textVal.toLowerCase();

      if (lowerKey === 'parameters' || lowerVal.includes('steps:') || lowerVal.includes('sampler:') || lowerVal.includes('negative prompt:')) {
        aiTraces.push({
          type: 'Stable Diffusion',
          description: 'Stable Diffusion Generation Parameters & Prompt log found.',
          field: `PNG:${key}`,
          rawSnippet: textVal.slice(0, 300) + (textVal.length > 300 ? '...' : ''),
        });
      } else if (lowerKey === 'prompt' || lowerKey === 'workflow') {
        aiTraces.push({
          type: 'ComfyUI',
          description: `ComfyUI Graph Node definition detected in "${key}" chunk.`,
          field: `PNG:${key}`,
          rawSnippet: textVal.slice(0, 300) + (textVal.length > 300 ? '...' : ''),
        });
      } else if (lowerVal.includes('dall-e') || lowerVal.includes('bing image creator')) {
        aiTraces.push({
          type: 'DALL-E',
          description: 'DALL-E or Bing Image Creator marker found.',
          field: `PNG:${key}`,
          rawSnippet: textVal.slice(0, 200),
        });
      }
    }
  }

  // Extract XMP
  if (tags.xmp) {
    for (const [key, val] of Object.entries<any>(tags.xmp)) {
      if (val && val.description) {
        rawTags[`XMP:${key}`] = String(val.description);
        const desc = String(val.description).toLowerCase();
        if (desc.includes('c2pa') || desc.includes('contentauthenticity')) {
          if (!c2paDetected) {
            c2paDetected = true;
            aiTraces.push({
              type: 'C2PA / Content Credentials',
              description: 'XMP Content Credentials schema detected.',
              field: `XMP:${key}`,
            });
          }
        }
      }
    }
  }

  // Extract IPTC
  if (tags.iptc) {
    for (const [key, val] of Object.entries<any>(tags.iptc)) {
      if (val && val.description) {
        rawTags[`IPTC:${key}`] = String(val.description);
      }
    }
  }

  // General tag count
  const tagCount = Object.keys(rawTags).length;

  return {
    tagCount,
    hasGps,
    gps: gpsData,
    camera,
    software: software || undefined,
    dateTime: dateTime || undefined,
    aiTraces,
    rawTags,
    c2paDetected,
  };
}
