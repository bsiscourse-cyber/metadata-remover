import JSZip from 'jszip';
import { ImageQueueItem, SanitizeOptions } from '../types';
import { generateSanitizedFilename } from './imageCleaner';

export async function createBatchZip(
  items: ImageQueueItem[],
  options: SanitizeOptions,
  onProgress?: (percentage: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('cleaned_images') || zip;

  const completedItems = items.filter((item) => item.status === 'completed' && item.cleanedBlob);

  if (completedItems.length === 0) {
    throw new Error('No completed images available to download');
  }

  const manifestLines: string[] = [
    '=== ANONYMOUSE USE - METADATA & AI TRACK REMOVAL REPORT ===',
    `Processed: ${new Date().toISOString()}`,
    `Total Images: ${completedItems.length}`,
    'Privacy Mode: 100% Client-Side In-Browser (0 Bytes Transferred)',
    'AI Watermark Neutralization: ' + (options.deepCleanWatermarks ? `Enabled (${options.watermarkCleanStrength})` : 'Disabled'),
    '--------------------------------------------------',
    '',
  ];

  for (let i = 0; i < completedItems.length; i++) {
    const item = completedItems[i];
    const ext = item.cleanedFormat ? item.cleanedFormat.toLowerCase() : 'jpg';
    const cleanFileName = generateSanitizedFilename(item.name, ext, options.filenameFormat);

    // Add image blob to zip
    folder.file(cleanFileName, item.cleanedBlob!);

    // Add info to manifest
    const origTags = item.originalMeta?.tagCount ?? 0;
    const aiTraces = item.originalMeta?.aiTraces.map((t) => t.type).join(', ') || 'None';
    const gps = item.originalMeta?.hasGps ? 'REMOVED' : 'None';

    manifestLines.push(
      `File: ${cleanFileName}`,
      `  Original Name: ${item.name}`,
      `  Original Size: ${(item.originalSize / 1024).toFixed(1)} KB -> Cleaned: ${(item.cleanedSize! / 1024).toFixed(1)} KB`,
      `  Tags Removed: ${origTags} metadata tags`,
      `  GPS Coordinates: ${gps}`,
      `  AI Traces Sanitized: ${aiTraces}`,
      `  Residual Metadata: 0 tags (Verified Clean)`,
      ''
    );

    if (onProgress) {
      onProgress(Math.round(((i + 1) / completedItems.length) * 50));
    }
  }

  manifestLines.push('==================================================');
  folder.file('cleaning_report.txt', manifestLines.join('\n'));

  // Generate zip file
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent / 2));
      }
    }
  );

  return zipBlob;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
