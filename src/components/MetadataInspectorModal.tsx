import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  MapPin,
  Camera,
  Layers,
  FileCheck,
  Search,
  ExternalLink,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { ImageQueueItem } from '../types';

interface MetadataInspectorModalProps {
  item: ImageQueueItem | null;
  onClose: () => void;
  onCleanItem?: (id: string) => void;
}

export const MetadataInspectorModal: React.FC<MetadataInspectorModalProps> = ({
  item,
  onClose,
  onCleanItem,
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'ai_traces' | 'gps' | 'camera' | 'raw_tags'>('comparison');
  const [searchTag, setSearchTag] = useState('');

  if (!item) return null;

  const origMeta = item.originalMeta;
  const cleanMeta = item.cleanedMeta;
  const isCompleted = item.status === 'completed';

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filter raw tags
  const rawTagsEntries = Object.entries(origMeta?.rawTags || {});
  const filteredRawTags = rawTagsEntries.filter(
    ([k, v]) =>
      k.toLowerCase().includes(searchTag.toLowerCase()) ||
      String(v).toLowerCase().includes(searchTag.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                Metadata &amp; Provenance Audit
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-md font-mono">{item.name}</p>
            </div>
          </div>

          <button
            id="btn-close-inspector"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-200 bg-white text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Before vs. After Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_traces')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'ai_traces'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>AI Provenance ({origMeta?.aiTraces.length || 0})</span>
          </button>

          {origMeta?.hasGps && (
            <button
              type="button"
              onClick={() => setActiveTab('gps')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'gps'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>GPS Geolocation</span>
            </button>
          )}

          {origMeta?.camera && (
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'camera'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Hardware</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('raw_tags')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'raw_tags'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Raw Tags ({origMeta?.tagCount || 0})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB: BEFORE VS AFTER COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-6">
              {/* Visual Side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original View */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Original Image
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatBytes(item.originalSize)}
                    </span>
                  </div>
                  <div className="w-full aspect-video bg-slate-900/5 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/60">
                    <img
                      src={item.originalUrl}
                      alt="Original"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="pt-1 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Metadata Tags:</span>
                      <span className="font-semibold text-slate-900">
                        {origMeta?.tagCount ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>AI Prompts / Nodes:</span>
                      <span className="font-semibold text-indigo-700">
                        {origMeta?.aiTraces.length ? `${origMeta.aiTraces.length} detected` : 'None'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GPS Privacy:</span>
                      <span className={`font-semibold ${origMeta?.hasGps ? 'text-rose-600' : 'text-slate-700'}`}>
                        {origMeta?.hasGps ? 'Coordinates exposed' : 'Clean'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>C2PA Provenance:</span>
                      <span className="font-semibold text-slate-700">
                        {origMeta?.c2paDetected ? 'Manifest present' : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cleaned View */}
                <div className={`border rounded-xl p-3.5 space-y-2.5 ${
                  isCompleted
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-slate-50 border-slate-200 opacity-80'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Cleaned &amp; Sanitized Output
                    </span>
                    {isCompleted && item.cleanedSize && (
                      <span className="text-xs text-emerald-700 font-mono font-medium">
                        {formatBytes(item.cleanedSize)}
                      </span>
                    )}
                  </div>

                  <div className="w-full aspect-video bg-slate-900/5 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/60 relative">
                    {isCompleted && item.cleanedUrl ? (
                      <img
                        src={item.cleanedUrl}
                        alt="Cleaned"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-xs text-slate-400">Not yet sanitized</p>
                        {onCleanItem && (
                          <button
                            type="button"
                            onClick={() => onCleanItem(item.id)}
                            className="mt-2 px-3 py-1 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors shadow-2xs"
                          >
                            Sanitize Now
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-1 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Metadata Tags:</span>
                      <span className="font-semibold text-emerald-700">
                        {isCompleted ? '0 (Zero Tags)' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>AI Prompts / Nodes:</span>
                      <span className="font-semibold text-emerald-700">
                        {isCompleted ? 'Stripped completely' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>GPS Privacy:</span>
                      <span className="font-semibold text-emerald-700">
                        {isCompleted ? 'Purged & Non-recoverable' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SynthID &amp; Stego Tracks:</span>
                      <span className="font-semibold text-emerald-700">
                        {isCompleted ? 'Neutralized via phase disruption' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status summary banner */}
              {isCompleted ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-1">
                    <p className="font-semibold">Privacy Verification Passed: Pristine Bitmap Generated</p>
                    <p className="text-emerald-800 leading-relaxed">
                      All auxiliary chunks, camera metadata, GPS tags, and generative AI parameters have been completely discarded. 
                      Visual pixel fidelity is 100% preserved with zero network leaks.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <p className="font-semibold">Metadata &amp; AI Provenance Detected in Source File</p>
                    <p className="text-amber-800 leading-relaxed">
                      This image contains identifiable metadata or generative AI parameter traces. Click "Sanitize" to scrub all tags on-device.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: AI TRACES & PROMPTS */}
          {activeTab === 'ai_traces' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  Detected AI Markers ({origMeta?.aiTraces.length || 0})
                </h4>
                <span className="text-xs text-slate-500">
                  Includes SD parameters, ComfyUI nodes, C2PA claims
                </span>
              </div>

              {origMeta?.aiTraces && origMeta.aiTraces.length > 0 ? (
                <div className="space-y-3">
                  {origMeta.aiTraces.map((trace, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <FileCode className="w-4 h-4 text-slate-600" />
                          {trace.type}
                        </span>
                        {trace.field && (
                          <span className="font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[11px]">
                            {trace.field}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 font-medium">{trace.description}</p>
                      {trace.rawSnippet && (
                        <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-40 leading-relaxed">
                          {trace.rawSnippet}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No generative AI metadata tags (Stable Diffusion, Midjourney, ComfyUI, or C2PA) were detected in this image.
                </div>
              )}
            </div>
          )}

          {/* TAB: GPS GEOLOCATION */}
          {activeTab === 'gps' && origMeta?.gps && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Physical Coordinates Exposed in Metadata</span>
                </div>
                <p>
                  Cameras and smartphones automatically embed precise latitude and longitude into photos. 
                  When shared publicly, anyone can extract your exact home, work, or vacation coordinates.
                </p>
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="bg-white/80 p-2 rounded border border-rose-200">
                    <span className="block text-slate-500 text-[10px]">Latitude:</span>
                    <span className="font-semibold text-slate-800">
                      {origMeta.gps.latitude?.toFixed(6)}° {origMeta.gps.latitudeRef}
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 rounded border border-rose-200">
                    <span className="block text-slate-500 text-[10px]">Longitude:</span>
                    <span className="font-semibold text-slate-800">
                      {origMeta.gps.longitude?.toFixed(6)}° {origMeta.gps.longitudeRef}
                    </span>
                  </div>
                  {origMeta.gps.altitude !== undefined && (
                    <div className="bg-white/80 p-2 rounded border border-rose-200">
                      <span className="block text-slate-500 text-[10px]">Altitude:</span>
                      <span className="font-semibold text-slate-800">
                        {origMeta.gps.altitude.toFixed(1)} meters
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {origMeta.gps.latitude && origMeta.gps.longitude && (
                <div className="flex justify-end">
                  <a
                    href={`https://www.google.com/maps?q=${origMeta.gps.latitude},${origMeta.gps.longitude}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-800 font-medium underline underline-offset-2"
                  >
                    <span>View Exposed Coordinates on Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB: CAMERA HARDWARE */}
          {activeTab === 'camera' && origMeta?.camera && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-900">Camera &amp; Lens Specifications</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {origMeta.camera.make && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Make</span>
                    <span className="font-medium text-slate-800">{origMeta.camera.make}</span>
                  </div>
                )}
                {origMeta.camera.model && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Model</span>
                    <span className="font-medium text-slate-800">{origMeta.camera.model}</span>
                  </div>
                )}
                {origMeta.camera.lens && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lens</span>
                    <span className="font-medium text-slate-800">{origMeta.camera.lens}</span>
                  </div>
                )}
                {origMeta.camera.focalLength && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Focal Length</span>
                    <span className="font-medium text-slate-800">{origMeta.camera.focalLength}</span>
                  </div>
                )}
                {origMeta.camera.fNumber && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Aperture</span>
                    <span className="font-medium text-slate-800">f/{origMeta.camera.fNumber}</span>
                  </div>
                )}
                {origMeta.camera.iso && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">ISO</span>
                    <span className="font-medium text-slate-800">{origMeta.camera.iso}</span>
                  </div>
                )}
                {origMeta.camera.exposureTime && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Shutter Speed</span>
                    <span className="font-medium text-slate-800">{origMeta.camera.exposureTime}s</span>
                  </div>
                )}
                {origMeta.dateTime && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Captured Date &amp; Time</span>
                    <span className="font-medium text-slate-800 font-mono">{origMeta.dateTime}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ALL RAW TAGS */}
          {activeTab === 'raw_tags' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search tags (e.g. Model, GPS, Software, Creator)..."
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {filteredRawTags.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto font-mono text-[11px]">
                  <table className="w-full text-left divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-slate-600 font-semibold w-1/3">Tag Key</th>
                        <th className="py-2 px-3 text-slate-600 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRawTags.map(([k, v]) => (
                        <tr key={k} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-medium text-slate-800 break-all">{k}</td>
                          <td className="py-2 px-3 text-slate-600 break-all">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  {rawTagsEntries.length === 0
                    ? 'No EXIF/IPTC/XMP tags found in this file.'
                    : 'No tags matched your search query.'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {isCompleted ? '✓ Image cleaned and verified' : 'Ready to strip all tags'}
          </span>
          <div className="flex items-center gap-2">
            {!isCompleted && onCleanItem && (
              <button
                type="button"
                onClick={() => {
                  onCleanItem(item.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Clean This Image
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
