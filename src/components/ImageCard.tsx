import React from 'react';
import {
  FileText,
  MapPin,
  FileCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  Loader2,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { ImageQueueItem } from '../types';
import { generateSanitizedFilename } from '../utils/imageCleaner';

interface ImageCardProps {
  item: ImageQueueItem;
  onCleanSingle: (id: string) => void;
  onRemoveSingle: (id: string) => void;
  onInspect: (item: ImageQueueItem) => void;
  onDownloadSingle: (item: ImageQueueItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  onCleanSingle,
  onRemoveSingle,
  onInspect,
  onDownloadSingle,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isCompleted = item.status === 'completed';
  const isProcessing = item.status === 'processing';
  const isAnalyzing = item.status === 'analyzing';

  const origTags = item.originalMeta?.tagCount ?? 0;
  const hasGps = item.originalMeta?.hasGps ?? false;
  const aiTraces = item.originalMeta?.aiTraces ?? [];
  const hasCamera = Boolean(item.originalMeta?.camera?.make || item.originalMeta?.camera?.model);

  return (
    <div
      id={`image-card-${item.id}`}
      className={`bg-white rounded-xl border transition-all p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isCompleted
          ? 'border-emerald-200/90 bg-emerald-50/15 shadow-2xs'
          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
      }`}
    >
      {/* Left side: Thumbnail + details */}
      <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
        {/* Thumbnail with overlay status */}
        <div className="relative w-16 h-16 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 group">
          <img
            src={isCompleted && item.cleanedUrl ? item.cleanedUrl : item.originalUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {isCompleted && (
            <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-sm" />
            </div>
          )}
          {(isProcessing || isAnalyzing) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* File information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 truncate" title={item.name}>
              {item.name}
            </h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono shrink-0">
              {item.format.toUpperCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mt-1 font-mono">
            <span className="text-slate-600">
              {item.width > 0 ? `${item.width}×${item.height}px` : 'Raster'}
            </span>
            <span>•</span>
            <span>Orig: {formatBytes(item.originalSize)}</span>
            {isCompleted && item.cleanedSize && (
              <>
                <span>→</span>
                <span className="font-semibold text-emerald-700">
                  Clean: {formatBytes(item.cleanedSize)}
                </span>
                {item.processingTimeMs !== undefined && (
                  <span className="text-[11px] text-slate-400">
                    ({item.processingTimeMs}ms)
                  </span>
                )}
              </>
            )}
          </div>

          {/* Detected Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {isAnalyzing ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Analyzing metadata...
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Sanitized (EXIF &amp; Traces Removed)
              </span>
            ) : (
              <>
                {aiTraces.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    <FileCode className="w-3 h-3 text-slate-600" />
                    AI Parameters ({aiTraces.length})
                  </span>
                )}

                {hasGps && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    GPS Tag
                  </span>
                )}

                {hasCamera && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    <Camera className="w-3 h-3 text-slate-600" />
                    Camera EXIF
                  </span>
                )}

                {origTags > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    <FileText className="w-3 h-3 text-amber-600" />
                    {origTags} Tags
                  </span>
                )}

                {origTags === 0 && aiTraces.length === 0 && !hasGps && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    No EXIF headers found
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        {/* Inspect Metadata Button */}
        <button
          id={`btn-inspect-${item.id}`}
          type="button"
          onClick={() => onInspect(item)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          title="Inspect Before & After Metadata"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Inspect</span>
        </button>

        {/* Clean Individual Button */}
        {!isCompleted && (
          <button
            id={`btn-clean-single-${item.id}`}
            type="button"
            disabled={isProcessing || isAnalyzing}
            onClick={() => onCleanSingle(item.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Shield className="w-3.5 h-3.5" />
            )}
            <span>{isProcessing ? 'Sanitizing...' : 'Sanitize'}</span>
          </button>
        )}

        {/* Download Individual Button */}
        {isCompleted && (
          <button
            id={`btn-download-single-${item.id}`}
            type="button"
            onClick={() => onDownloadSingle(item)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium shadow-2xs transition-colors"
            title="Download Cleaned Image"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        )}

        {/* Remove from queue */}
        <button
          id={`btn-remove-${item.id}`}
          type="button"
          onClick={() => onRemoveSingle(item.id)}
          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Remove from queue"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
