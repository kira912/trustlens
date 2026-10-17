import React from 'react';
import { MessageSquareWarning, ShieldCheck, Copy, Check } from 'lucide-react';
import { useTextScanner } from '../hooks/useTextScanner';
import { TrustMeter } from '../../../shared/ui/TrustMeter';
import { RedFlagList } from '../../../shared/ui/RedFlagList';

export const TextScanner: React.FC = () => {
  const { textInput, setTextInput, loading, result, copied, analyzeText, copyAdvice } = useTextScanner();

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <MessageSquareWarning className="w-4 h-4" />
          <span>Scanner de Messages & Détecteur de Scripts d'Escroquerie</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Analysez un message suspect reçu
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
          Collez ici le message envoyé par un vendeur ou acheteur. Notre moteur détecte les scripts de faux transporteurs, les coupons recharge et les détournements de messagerie.
        </p>

        <div className="space-y-3">
          <textarea
            rows={4}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Collez ici le texte suspect..."
            className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{textInput.length} caractères saisis</span>
            <button
              type="button"
              onClick={() => analyzeText()}
              disabled={loading || !textInput.trim()}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyse des motifs...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Détecter les signaux suspects</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <h3 className="text-lg font-bold text-white">Rapport de Détection Textuelle</h3>
            <button
              onClick={copyAdvice}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Conseils copiés !' : 'Copier les conseils'}</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <TrustMeter score={result.score} riskLevel={result.riskLevel} />
            <div className="flex-1 w-full">
              <RedFlagList
                redFlags={result.redFlags}
                warningFlags={result.warningFlags}
                safeFlags={result.safeFlags}
                recommendations={result.recommendations}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
