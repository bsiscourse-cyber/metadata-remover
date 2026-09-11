/**
 * Generates sample image Files with embedded EXIF / AI prompts
 * for quick testing and demonstration.
 */

export async function createSampleAiImage(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const ctx = canvas.getContext('2d')!;

  // Draw an AI-style visual graphic
  const grad = ctx.createRadialGradient(384, 384, 50, 384, 384, 450);
  grad.addColorStop(0, '#6366f1');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#09090b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 768, 768);

  // Geometric abstract patterns
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  for (let r = 50; r <= 320; r += 45) {
    ctx.beginPath();
    ctx.arc(384, 384, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Neon glowing accents
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SYNTHETIC AI ARTWORK', 384, 360);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px monospace';
  ctx.fillText('Model: Stable Diffusion XL / ComfyUI / C2PA Provenance', 384, 410);
  ctx.fillText('Seed: 8492019481 | CFG: 7.0 | Sampler: Euler_a', 384, 440);

  // Convert canvas to raw PNG
  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  const arrayBuffer = await blob.arrayBuffer();

  // Inject real PNG tEXt chunks for Stable Diffusion parameters and C2PA
  const modifiedBuffer = injectPngTextChunks(arrayBuffer, [
    {
      keyword: 'parameters',
      text: 'masterpiece, 8k, futuristic cybernetic android with bioluminescent neon circuits, cinematic lighting, hyperdetailed, ray tracing\nNegative prompt: deformed, low quality, watermark, blur, artifact, duplicate\nSteps: 28, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 8492019481, Size: 768x768, Model hash: 31e35c80d0, Model: sd_xl_base_1.0, Clip skip: 2',
    },
    {
      keyword: 'Software',
      text: 'Automatic1111 WebUI v1.8.0',
    },
    {
      keyword: 'c2pa',
      text: 'urn:c2pa:manifest:uuid:89f41b9e-6447-49d7-8531-ai-provenance-signature',
    },
  ]);

  return new File([modifiedBuffer], 'ai_generated_portrait_sdxl.png', { type: 'image/png' });
}

export async function createSamplePhotoGps(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d')!;

  // Draw a scenic photo style
  const sky = ctx.createLinearGradient(0, 0, 0, 400);
  sky.addColorStop(0, '#38bdf8');
  sky.addColorStop(1, '#bae6fd');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 800, 400);

  // Landscape mountains
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.moveTo(0, 450);
  ctx.lineTo(200, 260);
  ctx.lineTo(450, 420);
  ctx.lineTo(650, 290);
  ctx.lineTo(800, 480);
  ctx.lineTo(800, 600);
  ctx.lineTo(0, 600);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PACIFIC COAST HIGHWAY', 400, 200);

  ctx.fillStyle = '#334155';
  ctx.font = '15px monospace';
  ctx.fillText('Lat: 37.7749° N, Lon: -122.4194° W (San Francisco, CA)', 400, 240);
  ctx.fillText('Camera: iPhone 15 Pro Max, 24mm f/1.78, ISO 64', 400, 270);

  // Generate PNG and embed text chunks mimicking smartphone EXIF data
  const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
  const arrayBuffer = await blob.arrayBuffer();

  const modifiedBuffer = injectPngTextChunks(arrayBuffer, [
    {
      keyword: 'Make',
      text: 'Apple',
    },
    {
      keyword: 'Model',
      text: 'iPhone 15 Pro Max',
    },
    {
      keyword: 'Software',
      text: 'iOS 17.4 Camera App',
    },
    {
      keyword: 'GPSPosition',
      text: '37.7749 N, 122.4194 W (San Francisco)',
    },
  ]);

  return new File([modifiedBuffer], 'travel_vacation_photo_gps.png', { type: 'image/png' });
}

/**
 * Inserts valid PNG `tEXt` chunks right before the IEND chunk
 * so that ExifReader and any PNG inspector reads them natively.
 */
function injectPngTextChunks(
  pngBuffer: ArrayBuffer,
  chunks: { keyword: string; text: string }[]
): ArrayBuffer {
  const bytes = new Uint8Array(pngBuffer);

  // Find IEND chunk (last 12 bytes of PNG usually)
  let iendIndex = -1;
  for (let i = bytes.length - 12; i >= 0; i--) {
    if (
      bytes[i] === 0x49 &&
      bytes[i + 1] === 0x45 &&
      bytes[i + 2] === 0x4e &&
      bytes[i + 3] === 0x44
    ) {
      iendIndex = i - 4; // Length field starts 4 bytes earlier
      break;
    }
  }

  if (iendIndex === -1) {
    return pngBuffer; // Not a standard PNG, return as is
  }

  const encodedChunks: Uint8Array[] = [];

  for (const chunk of chunks) {
    const keyBytes = new TextEncoder().encode(chunk.keyword);
    const textBytes = new TextEncoder().encode(chunk.text);
    const dataLen = keyBytes.length + 1 + textBytes.length; // keyword + null byte + text

    const chunkBytes = new Uint8Array(12 + dataLen);
    const view = new DataView(chunkBytes.buffer);

    // 1. Length
    view.setUint32(0, dataLen, false);

    // 2. Type 'tEXt' (0x74, 0x45, 0x58, 0x74)
    chunkBytes[4] = 0x74;
    chunkBytes[5] = 0x45;
    chunkBytes[6] = 0x58;
    chunkBytes[7] = 0x74;

    // 3. Keyword
    chunkBytes.set(keyBytes, 8);
    // Null separator
    chunkBytes[8 + keyBytes.length] = 0;
    // 4. Text
    chunkBytes.set(textBytes, 9 + keyBytes.length);

    // 5. CRC32
    const crc = computeCrc32(chunkBytes.subarray(4, 8 + dataLen));
    view.setUint32(8 + dataLen, crc, false);

    encodedChunks.push(chunkBytes);
  }

  // Combine before IEND + new chunks + IEND
  const totalExtraBytes = encodedChunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(bytes.length + totalExtraBytes);

  result.set(bytes.subarray(0, iendIndex), 0);

  let offset = iendIndex;
  for (const chunk of encodedChunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  result.set(bytes.subarray(iendIndex), offset);

  return result.buffer;
}

// Standard CRC32 table & calculator for PNG chunks
const crcTable: number[] = (() => {
  const cTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    cTable[n] = c;
  }
  return cTable;
})();

function computeCrc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
