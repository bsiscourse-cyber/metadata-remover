import React from 'react';
import { Play, Download, Trash2, CheckCircle2, AlertTriangle, FileCode, MapPin, Loader2 } from 'lucide-react';
import { ImageQueueItem } from '../types';

interface BatchControlBarProps {
  items: ImageQueueItem[];
  isProcessingBatch: boolean;
  isZipping: boolean;
  zipProgress: number;
  onProcessAll: () => void;
  onDownloadZip: () => void;
  onClearQueue: () => void;
}

export const BatchControlBar: React.FC<BatchControlBarProps> = ({
  items,
  isProcessingBatch,
  isZipping,
  zipProgress,
  onProcessAll,
  onDownloadZip,
  onClearQueue,
}) => {
  if (items.length === 0) return null;

  const totalItems = items.length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const pendingCount = items.filter((i) => i.status === 'ready' || i.status === 'queued').length;
  const isAllCompleted = completedCount === totalItems && totalItems > 0;

  // Aggregate stats
  let totalTagsDetected = 0;
  let totalGpsDetected = 0;
  let totalAiTracesDetected = 0;

  for (const item of items) {
    if (item.originalMeta) {
      totalTagsDetected += item.originalMeta.tagCount;
      if (item.originalMeta.hasGps) totalGpsDetected++;
      totalAiTracesDetected += item.originalMeta.aiTraces.length;
    }
  }

  return (
    <div className="w-full bg-slate-900 text-white rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      {/* Metrics breakdown */}
      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Queue:</span>
          <span className="text-white font-semibold">{completedCount} / {totalItems}</span>
        </div>

        {totalTagsDetected > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-amber-300 text-[11px]">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{totalTagsDetected} metadata tags</span>
          </div>
        )}

        {totalAiTracesDetected > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-300 text-[11px]">
            <FileCode className="w-3 h-3 text-slate-400" />
            <span>{totalAiTracesDetected} AI provenance tags</span>
          </div>
        )}

        {totalGpsDetected > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-rose-300 text-[11px]">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>{totalGpsDetected} GPS geolocations</span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Process All button */}
        {pendingCount > 0 && (
          <button
            id="btn-batch-process-all"
            type="button"
            disabled={isProcessingBatch}
            onClick={onProcessAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
          >
            {isProcessingBatch ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
                <span>Sanitizing ({pendingCount} left)...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Sanitize All ({pendingCount})</span>
              </>
            )}
          </button>
        )}

        {/* Download ZIP button */}
        {completedCount > 0 && (
          <button
            id="btn-batch-download-zip"
            type="button"
            disabled={isZipping}
            onClick={onDownloadZip}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Packaging ZIP ({zipProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download All ({completedCount} Clean)</span>
              </>
            )}
          </button>
        )}

        {/* Clear queue button */}
        <button
          id="btn-batch-clear-queue"
          type="button"
          disabled={isProcessingBatch || isZipping}
          onClick={onClearQueue}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700/80 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
