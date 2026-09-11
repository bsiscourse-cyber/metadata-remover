import React from 'react';
import { X, ShieldCheck, Lock, WifiOff, Cpu, EyeOff, Database } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Privacy Architecture &amp; Steganography Neutralization
              </h3>
              <p className="text-xs text-slate-500">
                How your photos and creative assets are protected on-device
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-600 leading-relaxed max-h-[75vh] overflow-y-auto">
          {/* Card 1: 100% Client-Side */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Zero-Server Architecture (100% On-Device)</span>
            </div>
            <p>
              Your images are never sent across the network. All reading, metadata parsing, EXIF stripping, and image re-encoding happen inside your browser using the HTML5 Canvas API and Web Workers.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-emerald-700 font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Fully functional offline — you can disconnect your Internet and test it!</span>
            </div>
          </div>

          {/* Card 2: What Gets Stripped */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Database className="w-4 h-4 text-slate-700" />
              <span>What Metadata is Removed?</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>EXIF &amp; TIFF:</strong> Camera make, model, serial number, lens, aperture, shutter speed, ISO, timestamps.</li>
              <li><strong>GPS Geolocation:</strong> Latitude, longitude, altitude, and heading references.</li>
              <li><strong>AI Generation Prompts:</strong> Stable Diffusion (A1111/Fooocus) prompt parameters, ComfyUI node graphs, Midjourney seeds.</li>
              <li><strong>C2PA Content Credentials:</strong> JUMBF manifest blocks and provenance tracking.</li>
              <li><strong>XMP &amp; IPTC:</strong> Copyright tags, author credits, document IDs, editing software histories.</li>
              <li><strong>Color Profiles &amp; Embedded Thumbnails:</strong> Stripped to reduce unnecessary byte bloat and tracing.</li>
            </ul>
          </div>

          {/* Card 3: AI Watermark & Stego Neutralization */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <EyeOff className="w-4 h-4 text-slate-700" />
              <span>Invisible AI Fingerprints &amp; Watermarks</span>
            </div>
            <p>
              Certain generative AI models (such as Google Imagen / SynthID, DALL-E, and Meta) embed invisible mathematical signatures directly into the pixel frequency domain (DCT/wavelet coefficients) that survive basic visual cropping.
            </p>
            <p>
              When <strong>Sub-Pixel Jitter</strong> is enabled, our algorithm injects an imperceptible sub-pixel phase jitter (PSNR &gt; 50dB, SSIM &gt; 0.999) and re-quantizes the pixel matrix. This disrupts the fragile bit-parity required by AI watermark decoders while preserving 100% of the visible artwork quality for human eyes.
            </p>
          </div>

          {/* Card 4: Verification */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span>How You Can Verify It Yourself</span>
            </div>
            <p>
              Open your browser's Developer Tools (<kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">F12</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-[10px]">Cmd+Option+I</kbd>), switch to the <strong>Network</strong> tab, and upload any photo. You will observe exactly <strong>0 requests</strong> made. All processing is strictly confined to your local device memory.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
