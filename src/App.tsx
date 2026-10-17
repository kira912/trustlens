import React, { useState, useCallback } from 'react';
import { Navbar } from './shared/ui/Navbar';
import { BottomNav } from './shared/ui/BottomNav';
import { SeoFaqSection } from './shared/ui/SeoFaqSection';
import { UrlScanner } from './features/scanner/ui/UrlScanner';
import { TextScanner } from './features/scanner/ui/TextScanner';
import { ScamOMeter } from './features/scamometer/ui/ScamOMeter';
import { SiretChecker } from './features/company-registry/ui/SiretChecker';
import { ScamWatch } from './features/community-watch/ui/ScamWatch';
import { Guides } from './features/guides/ui/Guides';
import { useSeoHead } from './core/seo/useSeoHead';
import { SEO_META_BY_TAB } from './core/seo/seo.config';
import { Globe, MessageSquareWarning, Zap } from 'lucide-react';

function getInitialTab(): string {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return tab && SEO_META_BY_TAB[tab] ? tab : 'scan';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [scannerSubTab, setScannerSubTab] = useState<'url' | 'text'>('url');

  useSeoHead(activeTab);

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const currentSeo = SEO_META_BY_TAB[activeTab] || SEO_META_BY_TAB.scan;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans pb-20 md:pb-8 selection:bg-indigo-600 selection:text-white">
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {activeTab === 'scan' ? (
          <section aria-labelledby="main-hero-heading" className="text-center pt-2 pb-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bouclier Anti-Arnaque Marketplace — Vérification Gratuite en Direct</span>
            </div>

            <h1 id="main-hero-heading" className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
              Vérifiez si un vendeur ou site{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
                marketplace est fiable
              </span>
              .
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {currentSeo.subtitle}
            </p>

            <div className="flex justify-center pt-3">
              <div className="inline-flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl">
                <button
                  type="button"
                  onClick={() => setScannerSubTab('url')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    scannerSubTab === 'url' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Analyser un Lien / Boutique</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScannerSubTab('text')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    scannerSubTab === 'text' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquareWarning className="w-4 h-4" />
                  <span>Analyser un Message / Discussion</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          <header className="pt-2 pb-1 border-b border-slate-800/80">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {currentSeo.h1}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {currentSeo.subtitle}
            </p>
          </header>
        )}

        {activeTab === 'scan' && (scannerSubTab === 'url' ? <UrlScanner /> : <TextScanner />)}
        {activeTab === 'scamometer' && <ScamOMeter />}
        {activeTab === 'siret' && <SiretChecker />}
        {activeTab === 'scamwatch' && <ScamWatch />}
        {activeTab === 'guides' && <Guides />}

        <SeoFaqSection onNavigate={handleTabChange} />
      </main>

      <footer className="mt-auto border-t border-slate-800/80 glass-panel py-8 px-4 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="font-bold text-white text-sm mb-2">TrustLens — Anti-Arnaque Marketplace</div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Plateforme gratuite d'analyse de fiabilité pour protéger vos achats sur Leboncoin, Vinted, Facebook Marketplace et les boutiques e-commerce.
              </p>
            </div>
            <div>
              <div className="font-bold text-white text-sm mb-2">Outils de Vérification</div>
              <ul className="space-y-1.5">
                <li>
                  <a href="/" onClick={(e) => { e.preventDefault(); handleTabChange('scan'); }} className="hover:text-white">
                    Scanner d'URL & Détecteur de Phishing
                  </a>
                </li>
                <li>
                  <a href="/?tab=scamometer" onClick={(e) => { e.preventDefault(); handleTabChange('scamometer'); }} className="hover:text-white">
                    Simulateur de Risque Scam-O-Meter
                  </a>
                </li>
                <li>
                  <a href="/?tab=siret" onClick={(e) => { e.preventDefault(); handleTabChange('siret'); }} className="hover:text-white">
                    Vérification SIRET / SIREN Officielle (Insee)
                  </a>
                </li>
                <li>
                  <a href="/?tab=scamwatch" onClick={(e) => { e.preventDefault(); handleTabChange('scamwatch'); }} className="hover:text-white">
                    Base Communautaire ScamWatch
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white text-sm mb-2">Prévention & Recours Officiels</div>
              <ul className="space-y-1.5">
                <li>
                  <a href="/?tab=guides" onClick={(e) => { e.preventDefault(); handleTabChange('guides'); }} className="hover:text-white">
                    Guide : Arnaque Faux Livreur DHL & Coupons Transcash
                  </a>
                </li>
                <li>
                  <a href="/?tab=guides" onClick={(e) => { e.preventDefault(); handleTabChange('guides'); }} className="hover:text-white">
                    Guide : Litige PayPal Entre Proches & Chargeback
                  </a>
                </li>
                <li>
                  <a href="/sitemap.xml" target="_blank" rel="noopener" className="hover:text-white">
                    Plan du site (Sitemap XML)
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>© {new Date().getFullYear()} TrustLens Security — Architecture NestJS • Drizzle ORM • PostgreSQL</div>
            <div>Données officielles : API Recherche Entreprises (Gouv.fr) & Protocole ICANN RDAP</div>
          </div>
        </div>
      </footer>

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
};
