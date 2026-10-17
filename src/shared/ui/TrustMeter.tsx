import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { RiskLevel } from '../../core/domain/models';

interface TrustMeterProps {
  score: number;
  riskLevel: RiskLevel;
  
  showDetails?: boolean;
}

export const TrustMeter: React.FC<TrustMeterProps> = ({ score, riskLevel, showDetails = true }) => {
  // SVG gauge calculations (circumference for r=70 is 439.8)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  // We'll show an arc of 270 degrees (75% circle)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(100, Math.max(0, score))) / 100;

  const getColor = () => {
    if (score <= 35 || riskLevel === 'DANGER') {
      return {
        text: 'text-rose-500',
        stroke: '#ef4444',
        glow: 'glow-rose',
        bgBadge: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        label: 'DANGER CRITIQUE',
        desc: 'Forte probabilité d’escroquerie ou site trompeur.'
      };
    }
    if (score <= 70 || riskLevel === 'WARNING') {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        glow: 'glow-amber',
        bgBadge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        label: 'VIGILANCE REQUISE',
        desc: 'Des signaux suspects ou des garanties manquantes ont été identifiés.'
      };
    }
    return {
      text: 'text-emerald-400',
      stroke: '#10b981',
      glow: 'glow-emerald',
      bgBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      label: 'FIABILITÉ ÉTABLIE',
      desc: 'Les indicateurs de confiance et de sécurité sont conformes.'
    };
  };

  const theme = getColor();

  const getIcon = () => {
    if (score <= 35 || riskLevel === 'DANGER') return <ShieldAlert className="w-6 h-6 text-rose-500 inline mr-1.5" />;
    if (score <= 70 || riskLevel === 'WARNING') return <AlertTriangle className="w-6 h-6 text-amber-400 inline mr-1.5" />;
    return <ShieldCheck className="w-6 h-6 text-emerald-400 inline mr-1.5" />;
  };

  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className={`relative w-44 h-44 flex items-center justify-center rounded-full ${theme.glow}`}>
        <svg className="w-44 h-44 transform -rotate-135" viewBox="0 0 160 160">
          {/* Background track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="12"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active progress track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={theme.stroke}
            strokeWidth="12"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span className={`text-5xl font-black tracking-tight ${theme.text}`}>
              {score}
            </span>
            <span className="text-slate-400 font-semibold text-lg ml-0.5">/100</span>
          </div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mt-0.5">
            Indice de Confiance
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 flex flex-col items-center max-w-sm">
          <div className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold border ${theme.bgBadge} mb-1.5 tracking-wide`}>
            {getIcon()}
            {theme.label}
          </div>
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            {theme.desc}
          </p>
        </div>
      )}
    </div>
  );
};
