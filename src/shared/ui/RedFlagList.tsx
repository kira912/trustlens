import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { RedFlag, WarningFlag, SafeFlag } from '../../core/domain/models';

interface RedFlagListProps {
  redFlags: RedFlag[];
  warningFlags: WarningFlag[];
  safeFlags: SafeFlag[];
  recommendations?: string[];
}

export const RedFlagList: React.FC<RedFlagListProps> = ({
  redFlags = [],
  warningFlags = [],
  safeFlags = [],
  recommendations = []
}) => {
  return (
    <div className="space-y-5">
      {/* Critical Red Flags */}
      {redFlags.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
            <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wide">
              Drapeaux Rouges Éliminatoires ({redFlags.length})
            </h4>
          </div>
          <div className="space-y-2.5">
            {redFlags.map((flag, idx) => (
              <div key={idx} className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-3 text-xs sm:text-sm">
                <div className="font-semibold text-rose-200 flex items-start justify-between gap-2">
                  <span>{flag.title}</span>
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0">
                    {flag.severity}
                  </span>
                </div>
                {flag.detail && (
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    {flag.detail}
                  </p>
                )}
                {flag.snippet && (
                  <div className="mt-2 bg-black/40 px-2.5 py-1.5 rounded font-mono text-[11px] text-rose-300 border border-rose-500/20">
                    Élément détecté : "{flag.snippet}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning Flags */}
      {warningFlags.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
              Points de Vigilance ({warningFlags.length})
            </h4>
          </div>
          <div className="space-y-2.5">
            {warningFlags.map((flag, idx) => (
              <div key={idx} className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3 text-xs sm:text-sm">
                <div className="font-semibold text-amber-200 flex items-start justify-between gap-2">
                  <span>{flag.title}</span>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0">
                    Attention
                  </span>
                </div>
                {flag.detail && (
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                    {flag.detail}
                  </p>
                )}
                {flag.snippet && (
                  <div className="mt-2 bg-black/40 px-2.5 py-1.5 rounded font-mono text-[11px] text-amber-300 border border-amber-500/20">
                    Détecté : "{flag.snippet}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safe Flags */}
      {safeFlags.length > 0 && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
              Garanties & Signaux Positifs ({safeFlags.length})
            </h4>
          </div>
          <div className="space-y-2">
            {safeFlags.map((flag, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-emerald-200">{flag.title}</span>
                  {flag.detail && <p className="text-xs text-slate-400 mt-0.5">{flag.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-4 sm:p-5">
          <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span>🛡️</span> Plan d'Action Recommandé
          </h4>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200">
                <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
