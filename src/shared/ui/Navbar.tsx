import React, { useEffect, useState } from 'react';
import { Shield, Download, Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'scan', label: 'Scanner', href: '/' },
  { id: 'scamometer', label: 'Scam-O-Meter', href: '/?tab=scamometer' },
  { id: 'siret', label: 'Vérif SIRET (Gouv)', href: '/?tab=siret' },
  { id: 'scamwatch', label: 'ScamWatch', href: '/?tab=scamwatch' },
  { id: 'guides', label: 'Guides & Pièges', href: '/?tab=guides' },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('scan');
          }}
          aria-label="TrustLens Accueil — Détecteur d'arnaques marketplace"
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white font-sans">
                Trust<span className="text-emerald-400">Lens</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Anti-Arnaque & Vérification Marketplace
            </p>
          </div>
        </a>

        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              aria-current={activeTab === item.id ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <div
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>En direct</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Mode hors-ligne</span>
              </>
            )}
          </div>

          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs hover:opacity-95 shadow-lg shadow-emerald-500/20 animate-pulse-glow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Installer l'App</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
