/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { SettingsBar } from './components/SettingsBar';
import { BatchControlBar } from './components/BatchControlBar';
import { ImageCard } from './components/ImageCard';
import { MetadataInspectorModal } from './components/MetadataInspectorModal';
import { PrivacyModal } from './components/PrivacyModal';
import { ImageQueueItem, SanitizeOptions } from './types';
import { extractMetadata } from './utils/metadataParser';
import { cleanImage, generateSanitizedFilename } from './utils/imageCleaner';
import { createBatchZip, triggerDownload } from './utils/zipExporter';
import { Shield, EyeOff, CheckCircle2, Layers, Cpu, Check, ArrowRight, WifiOff, FileText, Database, ShieldAlert } from 'lucide-react';

export default function App() {
  const [queue, setQueue] = useState<ImageQueueItem[]>([]);
  const [options, setOptions] = useState<SanitizeOptions>({
    outputFormat: 'preserve',
    quality: 0.95,
    deepCleanWatermarks: true,
    watermarkCleanStrength: 'balanced',
    stripColorProfile: true,
    filenameFormat: 'suffix_cleaned',
    normalizeOrientation: true,
  });

  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const [inspectorItem, setInspectorItem] = useState<ImageQueueItem | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [bytesProcessed, setBytesProcessed] = useState(0);

  // Add files to queue and analyze their metadata
  const handleFilesAdded = useCallback(async (files: File[]) => {
    const newItems: ImageQueueItem[] = files.map((file) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const originalUrl = URL.createObjectURL(file);
      const dotIdx = file.name.lastIndexOf('.');
      const format = dotIdx !== -1 ? file.name.substring(dotIdx + 1).toUpperCase() : 'IMG';

      return {
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalUrl,
        format,
        width: 0,
        height: 0,
        status: 'analyzing',
        progress: 0,
      };
    });

    // Append to queue
    setQueue((prev) => [...prev, ...newItems]);

    // Inspect metadata for each item in parallel
    for (const item of newItems) {
      // Get dimensions
      const img = new Image();
      img.src = item.originalUrl;
      img.onload = () => {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, width: img.naturalWidth, height: img.naturalHeight } : q
          )
        );
      };

      // Extract metadata & AI traces
      try {
        const metadata = await extractMetadata(item.file);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, originalMeta: metadata, status: 'ready' } : q
          )
        );
      } catch (err) {
        console.warn(`Failed to inspect metadata for ${item.name}`, err);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: 'ready',
                  originalMeta: {
                    tagCount: 0,
                    hasGps: false,
                    aiTraces: [],
                    rawTags: {},
                    c2paDetected: false,
                  },
                }
              : q
          )
        );
      }
    }
  }, []);

  // Clipboard paste listener (Ctrl+V anywhere on the page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const imageFiles = Array.from(e.clipboardData.files).filter((file) =>
          file.type.startsWith('image/')
        );
        if (imageFiles.length > 0) {
          handleFilesAdded(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFilesAdded]);

  // Clean a single image
  const handleCleanSingle = async (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;

    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'processing', progress: 50 } : q))
    );

    try {
      const result = await cleanImage(item.file, options);
      setBytesProcessed((prev) => prev + item.originalSize);

      setQueue((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          return {
            ...q,
            status: 'completed',
            progress: 100,
            cleanedBlob: result.cleanedBlob,
            cleanedUrl: result.cleanedUrl,
            cleanedSize: result.cleanedSize,
            cleanedFormat: result.cleanedFormat,
            cleanedMeta: result.cleanedMeta,
            processingTimeMs: result.processingTimeMs,
          };
        })
      );

      // If inspector is open for this item, keep it updated
      setInspectorItem((prev) => {
        if (prev && prev.id === id) {
          return {
            ...prev,
            status: 'completed',
            cleanedBlob: result.cleanedBlob,
            cleanedUrl: result.cleanedUrl,
            cleanedSize: result.cleanedSize,
            cleanedFormat: result.cleanedFormat,
            cleanedMeta: result.cleanedMeta,
            processingTimeMs: result.processingTimeMs,
          };
        }
        return prev;
      });
    } catch (err: any) {
      console.error(`Failed to clean image ${item.name}`, err);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === id
            ? { ...q, status: 'error', error: err.message || 'Cleaning failed' }
            : q
        )
      );
    }
  };

  // Clean all pending images in batch
  const handleProcessAll = async () => {
    if (isProcessingBatch) return;
    setIsProcessingBatch(true);

    const pending = queue.filter((q) => q.status === 'ready' || q.status === 'queued');

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'processing' } : q))
      );

      try {
        const result = await cleanImage(item.file, options);
        setBytesProcessed((prev) => prev + item.originalSize);

        setQueue((prev) =>
          prev.map((q) => {
            if (q.id !== item.id) return q;
            return {
              ...q,
              status: 'completed',
              progress: 100,
              cleanedBlob: result.cleanedBlob,
              cleanedUrl: result.cleanedUrl,
              cleanedSize: result.cleanedSize,
              cleanedFormat: result.cleanedFormat,
              cleanedMeta: result.cleanedMeta,
              processingTimeMs: result.processingTimeMs,
            };
          })
        );
      } catch (err: any) {
        console.error(`Error processing batch item ${item.name}:`, err);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'error', error: err.message || 'Failed' } : q
          )
        );
      }
    }

    setIsProcessingBatch(false);
  };

  // Download a single cleaned image
  const handleDownloadSingle = (item: ImageQueueItem) => {
    if (!item.cleanedBlob) return;
    const ext = item.cleanedFormat ? item.cleanedFormat.toLowerCase() : 'jpg';
    const filename = generateSanitizedFilename(item.name, ext, options.filenameFormat);
    triggerDownload(item.cleanedBlob, filename);
  };

  // Download all completed images as a ZIP archive
  const handleDownloadZip = async () => {
    if (isZipping) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zipBlob = await createBatchZip(queue, options, (progress) => {
        setZipProgress(progress);
      });
      const dateStr = new Date().toISOString().slice(0, 10);
      triggerDownload(zipBlob, `sanitized_images_${dateStr}.zip`);
    } catch (err) {
      console.error('Failed to create batch zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Remove single item from queue
  const handleRemoveSingle = (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (item) {
      URL.revokeObjectURL(item.originalUrl);
      if (item.cleanedUrl) URL.revokeObjectURL(item.cleanedUrl);
    }
    setQueue((prev) => prev.filter((q) => q.id !== id));
    if (inspectorItem?.id === id) setInspectorItem(null);
  };

  // Clear all items in queue
  const handleClearQueue = () => {
    queue.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.cleanedUrl) URL.revokeObjectURL(item.cleanedUrl);
    });
    setQueue([]);
    setInspectorItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Header */}
      <Header
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        bytesProcessed={bytesProcessed}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Upload & Drop Area */}
        <section>
          <DropZone
            onFilesAdded={handleFilesAdded}
            isLoadingSample={isLoadingSample}
            setIsLoadingSample={setIsLoadingSample}
          />
        </section>

        {/* Global Configuration & Settings */}
        <section>
          <SettingsBar options={options} setOptions={setOptions} />
        </section>

        {/* Batch Queue & Processing Controls */}
        {queue.length > 0 && (
          <section className="space-y-4">
            <BatchControlBar
              items={queue}
              isProcessingBatch={isProcessingBatch}
              isZipping={isZipping}
              zipProgress={zipProgress}
              onProcessAll={handleProcessAll}
              onDownloadZip={handleDownloadZip}
              onClearQueue={handleClearQueue}
            />

            {/* Queue List of Image Cards */}
            <div className="space-y-2.5">
              {queue.map((item) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  onCleanSingle={handleCleanSingle}
                  onRemoveSingle={handleRemoveSingle}
                  onInspect={(i) => setInspectorItem(i)}
                  onDownloadSingle={handleDownloadSingle}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State / Transparent Architecture & Field Guide */}
        {queue.length === 0 && (
          <section className="pt-2 pb-8 space-y-6">
            {/* Technical Pipeline Explanation */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-bold text-slate-900">
                  How On-Device Decoupling Works
                </h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4 max-w-2xl">
                Unlike server-based image utilities that upload your files to remote cloud storage, Anonymouse Use decouples image data strictly inside your browser’s local sandbox.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-mono">1</span>
                    <span>Direct Memory Ingestion</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    The raw file is read into a temporary in-memory TypedArray. No data packets are transmitted across the network.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-mono">2</span>
                    <span>Canvas Rasterization</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Browser canvas decouples raw raster pixels. Header segments (EXIF, IPTC, XMP, JUMBF metadata) are discarded completely.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-mono">3</span>
                    <span>Stego Neutralization &amp; Export</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Sub-pixel micro-jitter dissolves mathematical frequency watermarks (SynthID/invisible stego) without visible degradation.
                  </p>
                </div>
              </div>
            </div>

            {/* Sanitization Inventory: What Goes vs What Stays */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purged */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <EyeOff className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Permanently Removed from Files
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold mt-0.5">✕</span>
                    <span><strong>Geospatial Coordinates:</strong> Exact GPS latitude, longitude, altitude, and geohash tags embedded by phones and drones.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold mt-0.5">✕</span>
                    <span><strong>Hardware Fingerprints:</strong> Camera make, model, lens serial number, shutter count, firmware version, and owner name.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold mt-0.5">✕</span>
                    <span><strong>Generative AI Prompts:</strong> Stable Diffusion (A1111/Fooocus) prompt parameters, ComfyUI node graphs, seeds, and sampler settings.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold mt-0.5">✕</span>
                    <span><strong>Content Authenticity Manifests:</strong> C2PA JUMBF containers, digital signatures, and provenance chain tracking blocks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold mt-0.5">✕</span>
                    <span><strong>Author &amp; Editing History:</strong> Photoshop / Lightroom document IDs, edit timestamps, layer histories, and IPTC credits.</span>
                  </li>
                </ul>
              </div>

              {/* Preserved */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Preserved with Full Visual Fidelity
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Full Pixel Dimensions:</strong> Exact original width, height, and aspect ratio are maintained.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Alpha Transparency:</strong> PNG and WebP transparency channels remain intact with zero clipping.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>High-Quality Re-Encoding:</strong> Configurable lossless (PNG) or adjustable quality compression (JPEG/WebP) up to 100%.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Orientation Normalization:</strong> EXIF orientation rotation flags are permanently baked into pixels so photos never appear sideways.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Single or Batch ZIP:</strong> Export individual files directly or download your entire batch packed into a single clean ZIP archive.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Offline Verification Notice */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <WifiOff className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="text-slate-700">
                  <strong>Verification test:</strong> Open your browser’s Developer Tools (<kbd className="px-1 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">F12</kbd> &rarr; Network tab) or turn off your Wi-Fi. Notice that zero bytes leave your device.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-xs font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700 whitespace-nowrap shrink-0"
              >
                Read Technical Audit &rarr;
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-5 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Anonymouse Use • Private &amp; Open Client-Side Utility</span>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Client-side Canvas Rasterizer</span>
            <span>•</span>
            <span>Batch ZIP Packaging</span>
            <span>•</span>
            <span>Zero Network Leaks</span>
          </div>
        </div>
      </footer>

      {/* Metadata Inspector Modal */}
      <MetadataInspectorModal
        item={inspectorItem}
        onClose={() => setInspectorItem(null)}
        onCleanItem={(id) => handleCleanSingle(id)}
      />

      {/* Privacy Architecture Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
