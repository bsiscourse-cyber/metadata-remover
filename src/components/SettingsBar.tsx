import React, { useState } from 'react';
import { Settings2, ShieldAlert, EyeOff, ChevronDown, ChevronUp, FileType, SlidersHorizontal } from 'lucide-react';
import { SanitizeOptions, OutputFormat, FilenameFormat } from '../types';

interface SettingsBarProps {
  options: SanitizeOptions;
  setOptions: React.Dispatch<React.SetStateAction<SanitizeOptions>>;
}

export const SettingsBar: React.FC<SettingsBarProps> = ({ options, setOptions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({ ...prev, outputFormat: e.target.value as OutputFormat }));
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({ ...prev, quality: parseFloat(e.target.value) }));
  };

  const handleDeepCleanToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({ ...prev, deepCleanWatermarks: e.target.checked }));
  };

  const handleStrengthChange = (strength: SanitizeOptions['watermarkCleanStrength']) => {
    setOptions((prev) => ({ ...prev, watermarkCleanStrength: strength }));
  };

  const handleFilenameFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({ ...prev, filenameFormat: e.target.value as FilenameFormat }));
  };

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Primary Bar */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-800">Export &amp; Sanitization Controls</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Output Format */}
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="text-slate-500 font-medium">Output:</span>
            <select
              id="select-output-format"
              value={options.outputFormat}
              onChange={handleFormatChange}
              className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            >
              <option value="preserve">Keep Original Format</option>
              <option value="jpeg">JPEG Format</option>
              <option value="png">PNG (Lossless)</option>
              <option value="webp">WebP (Modern)</option>
            </select>
          </div>

          {/* Stego Neutralizer Quick Toggle */}
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              id="checkbox-ai-watermark"
              type="checkbox"
              checked={options.deepCleanWatermarks}
              onChange={handleDeepCleanToggle}
              className="rounded text-slate-900 focus:ring-slate-500 w-3.5 h-3.5 accent-slate-900"
            />
            <EyeOff className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-medium">Anti-Stego Neutralizer</span>
          </label>

          {/* Expand Advanced */}
          <button
            id="btn-toggle-advanced-settings"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <span>{isExpanded ? 'Fewer Controls' : 'Fine-Tune'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Advanced Settings */}
      {isExpanded && (
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200/70 text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Quality Slider (for JPG/WebP) */}
          <div className="space-y-1">
            <div className="flex justify-between font-medium">
              <span className="text-slate-600">Export Quality:</span>
              <span className="font-semibold text-slate-900 font-mono">{Math.round(options.quality * 100)}%</span>
            </div>
            <input
              id="slider-quality"
              type="range"
              min="0.7"
              max="1.0"
              step="0.01"
              disabled={options.outputFormat === 'png'}
              value={options.quality}
              onChange={handleQualityChange}
              className="w-full accent-slate-800 cursor-pointer disabled:opacity-40"
            />
            <p className="text-[11px] text-slate-500">
              {options.outputFormat === 'png'
                ? 'PNG uses lossless pixel encoding.'
                : 'Higher preserves original fidelity; lower reduces bytes.'}
            </p>
          </div>

          {/* Stego Neutralization Intensity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-600">Neutralization Strength:</span>
            </div>
            <div className="flex rounded-md p-0.5 bg-slate-200/80 border border-slate-300/60">
              {(['gentle', 'balanced', 'aggressive'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!options.deepCleanWatermarks}
                  onClick={() => handleStrengthChange(s)}
                  className={`flex-1 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                    options.watermarkCleanStrength === s && options.deepCleanWatermarks
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Disrupts pixel frequency watermarks (SynthID/stego) below human perceptual threshold.
            </p>
          </div>

          {/* Output Filename Sanitizer */}
          <div className="space-y-1">
            <label htmlFor="select-filename-format" className="font-medium text-slate-600 block">
              Filename Format:
            </label>
            <select
              id="select-filename-format"
              value={options.filenameFormat}
              onChange={handleFilenameFormatChange}
              className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:ring-1 focus:ring-slate-400"
            >
              <option value="suffix_cleaned">image_cleaned.jpg (Append _cleaned)</option>
              <option value="prefix_clean">clean_image.jpg (Prepend clean_)</option>
              <option value="random_hash">img_x8a92f.jpg (Random anonymous hash)</option>
              <option value="preserve">image.jpg (Keep original filename)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Anonymous hash strips camera-identifying prefixes (e.g. IMG_ or DSC_).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
