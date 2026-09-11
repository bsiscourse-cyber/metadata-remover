import React from 'react';
import { Lock, Cpu, HelpCircle, Shield, WifiOff } from 'lucide-react';

interface HeaderProps {
  onOpenPrivacyModal: () => void;
  bytesProcessed: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenPrivacyModal, bytesProcessed }) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold tracking-tight text-slate-900">
              Anonymouse Use
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Runs 100% in Browser Memory
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Purge EXIF camera info, GPS coordinates, AI generation parameters, and C2PA provenance tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100/80 border border-slate-200 text-xs text-slate-600 font-mono">
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            <span>Outbound: 0 B</span>
          </div>

          <button
            id="btn-privacy-audit"
            type="button"
            onClick={onOpenPrivacyModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>How It Works &amp; Audit Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
