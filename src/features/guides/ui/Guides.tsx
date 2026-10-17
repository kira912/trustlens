import React, { useState } from 'react';
import { BookOpen, ShieldCheck, AlertOctagon, FileCheck, CheckCircle2 } from 'lucide-react';
import { ANTI_SCAM_GUIDES, PURCHASE_CHECKLIST } from '../domain/guides.data';

export const Guides: React.FC = () => {
  const [activeGuide, setActiveGuide] = useState<number>(0);
  const current = ANTI_SCAM_GUIDES[activeGuide];

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Centre d'Éducation & Prévention des Arnaques</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Les pièges les plus redoutables décryptés
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          Comprendre le fonctionnement des arnaques est le meilleur bouclier. Voici les 5 scénarios utilisés par 95% des escrocs sur les plateformes de seconde main.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {ANTI_SCAM_GUIDES.map((g, idx) => (
            <button
              key={g.id}
              onClick={() => setActiveGuide(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeGuide === idx
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{g.icon}</span>
              <span>{g.title}</span>
            </button>
          ))}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{current.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-white">{current.title}</h3>
                <p className="text-xs text-slate-400">{current.summary}</p>
              </div>
            </div>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase shrink-0">
              {current.badge}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Comment fonctionne le piège :
            </h4>
            <div className="space-y-2">
              {current.mechanism.map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              La Règle d'Or
            </h4>
            <p className="text-xs sm:text-sm text-emerald-200 font-semibold">{current.goldenRule}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-400" />
          La Checklist en 5 Points Avant Chaque Achat
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm mt-4">
          {PURCHASE_CHECKLIST.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
