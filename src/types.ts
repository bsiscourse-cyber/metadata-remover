export interface DetectedAITrace {
  type: 'Stable Diffusion' | 'Midjourney' | 'ComfyUI' | 'DALL-E' | 'C2PA / Content Credentials' | 'SynthID / Stego Pattern' | 'Generic AI';
  description: string;
  field?: string;
  rawSnippet?: string;
}

export interface ImageMetadataReport {
  tagCount: number;
  hasGps: boolean;
  gps?: {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    latitudeRef?: string;
    longitudeRef?: string;
  };
  camera?: {
    make?: string;
    model?: string;
    lens?: string;
    focalLength?: string;
    iso?: string;
    exposureTime?: string;
    fNumber?: string;
  };
  software?: string;
  dateTime?: string;
  aiTraces: DetectedAITrace[];
  rawTags: Record<string, string>;
  c2paDetected: boolean;
}

export type OutputFormat = 'preserve' | 'jpeg' | 'png' | 'webp';
export type FilenameFormat = 'suffix_cleaned' | 'prefix_clean' | 'random_hash' | 'preserve';

export interface SanitizeOptions {
  outputFormat: OutputFormat;
  quality: number; // 0.7 - 1.0
  deepCleanWatermarks: boolean; // Disrupt invisible frequency-domain watermarks
  watermarkCleanStrength: 'gentle' | 'balanced' | 'aggressive';
  stripColorProfile: boolean;
  filenameFormat: FilenameFormat;
  normalizeOrientation: boolean;
}

export type ItemStatus = 'queued' | 'analyzing' | 'ready' | 'processing' | 'completed' | 'error';

export interface ImageQueueItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalUrl: string;
  format: string;
  width: number;
  height: number;
  status: ItemStatus;
  progress: number;
  error?: string;
  
  // Metadata reports
  originalMeta?: ImageMetadataReport;
  cleanedMeta?: ImageMetadataReport;
  
  // Processed output
  cleanedBlob?: Blob;
  cleanedUrl?: string;
  cleanedSize?: number;
  cleanedFormat?: string;
  processingTimeMs?: number;
}
