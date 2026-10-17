import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (isIosDevice && !isStandalone) {
      const dismissed = localStorage.getItem('trustlens_ios_install_dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('trustlens_ios_install_dismissed', 'true');
    }
  };

  if (!showBanner) return null;

  return (
    <div className="md:hidden bg-gradient-to-r from-indigo-900/80 via-slate-900/90 to-emerald-950/80 border-b border-indigo-500/30 px-4 py-3 text-white relative">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white flex items-center gap-1.5">
              <span>Installez TrustLens sur votre téléphone</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <p className="text-slate-300 text-[11px]">
              {isIOS
                ? "Sur Safari : touchez 'Partager' puis 'Sur l'écran d'accueil'."
                : "Accès rapide depuis votre écran d'accueil."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installer</span>
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
