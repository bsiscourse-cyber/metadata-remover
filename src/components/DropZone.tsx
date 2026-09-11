import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, MapPin, FileCode, CheckCircle, SlidersHorizontal } from 'lucide-react';
import { createSampleAiImage, createSamplePhotoGps } from '../utils/sampleImages';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  isLoadingSample: boolean;
  setIsLoadingSample: (loading: boolean) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesAdded,
  isLoadingSample,
  setIsLoadingSample,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((file: File) =>
        file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|tiff|heic)$/i.test(file.name)
      );
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files);
      onFilesAdded(validFiles);
      e.target.value = '';
    }
  };

  const handleLoadSampleAi = async () => {
    try {
      setIsLoadingSample(true);
      const sampleFile = await createSampleAiImage();
      onFilesAdded([sampleFile]);
    } catch (err) {
      console.error('Failed to load sample AI image', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleLoadSamplePhoto = async () => {
    try {
      setIsLoadingSample(true);
      const sampleFile = await createSamplePhotoGps();
      onFilesAdded([sampleFile]);
    } catch (err) {
      console.error('Failed to load sample photo', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="w-full">
      <div
        id="dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all cursor-pointer group ${
          isDragOver
            ? 'border-slate-700 bg-slate-100/90 shadow-sm scale-[0.995]'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50/60 shadow-xs'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/avif,image/tiff,image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center justify-center space-y-2.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isDragOver ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80'
            }`}
          >
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              Drag and drop images here, or{' '}
              <span className="text-slate-900 underline underline-offset-4 decoration-slate-400 hover:decoration-slate-900 font-medium">
                choose files
              </span>
            </p>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Select one or multiple photos to sanitize. Paste directly from clipboard with <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-700">Ctrl+V</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-700">⌘V</kbd>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">JPG, PNG, WebP, AVIF, TIFF</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">No file size limit</span>
            <span className="text-slate-300">•</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">Batch multi-file queuing</span>
          </div>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <span className="font-medium text-slate-600">Want to test without personal photos?</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-sample-ai"
            type="button"
            disabled={isLoadingSample}
            onClick={handleLoadSampleAi}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium text-xs shadow-2xs disabled:opacity-50"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-600" />
            <span>Load AI Artwork (Prompt &amp; C2PA)</span>
          </button>

          <button
            id="btn-sample-photo"
            type="button"
            disabled={isLoadingSample}
            onClick={handleLoadSamplePhoto}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium text-xs shadow-2xs disabled:opacity-50"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-600" />
            <span>Load Camera Photo (EXIF &amp; GPS)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
