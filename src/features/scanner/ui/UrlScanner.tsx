import React from 'react';
import {
  Search,
  Globe,
  Shield,
  ExternalLink,
  Calendar,
  Lock,
  AlertCircle,
  ShoppingBag,
  Tag,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  SlidersHorizontal,
  TrendingDown,
  Camera,
} from 'lucide-react';
import { useUrlScanner } from '../hooks/useUrlScanner';
import { TrustMeter } from '../../../shared/ui/TrustMeter';
import { RedFlagList } from '../../../shared/ui/RedFlagList';

export const UrlScanner: React.FC = () => {
  const {
    urlInput,
    setUrlInput,
    detectedMarketplace,
    showListingForm,
    setShowListingForm,
    listingTitle,
    setListingTitle,
    listingPrice,
    setListingPrice,
    listingDescription,
    setListingDescription,
    sellerUsername,
    setSellerUsername,
    sellerRatingsCount,
    setSellerRatingsCount,
    photosCount,
    setPhotosCount,
    paymentMethodRequested,
    setPaymentMethodRequested,
    loading,
    result,
    error,
    scanUrl,
  } = useUrlScanner();

  const isListingMode = detectedMarketplace.isListing || showListingForm || Boolean(result?.listingAnalysis);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Analyseur d'Annonce (Leboncoin / Vinted) & Détecteur de Phishing</span>
          </div>
          {detectedMarketplace.isListing && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
              <ShoppingBag className="w-3.5 h-3.5" />
              Annonce {detectedMarketplace.platform} détectée
            </span>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Vérifiez une annonce Leboncoin, Vinted ou une boutique
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
          Collez le lien d'une annonce Leboncoin / Vinted ou d'un site e-commerce. Notre algorithme extrait automatiquement les données de l'annonce et du profil vendeur, croise la cote Argus du produit, analyse la description et vérifie la base ScamWatch.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            scanUrl();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Ex: https://www.leboncoin.fr/ad/telephones_objets_connectes/... ou https://www.vinted.fr/items/..."
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Inspection en cours...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Analyser l'annonce</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowListingForm((prev) => !prev)}
              className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                isListingMode
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                {showListingForm || detectedMarketplace.isListing
                  ? 'Inspection approfondie de l’annonce activée (Prix, Cote, Description, Vendeur)'
                  : '+ Ajouter les détails d’une annonce Leboncoin / Vinted (Prix, Description, Vendeur)'}
              </span>
            </button>
          </div>

          {(showListingForm || detectedMarketplace.isListing) && (
            <div className="bg-slate-900/75 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-indigo-300 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    <span>Paramètres d'Audit de l'Annonce {detectedMarketplace.platform || 'Marketplace'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {result?.listingAnalysis && !result.listingAnalysis.antiBotBlocked && result.listingAnalysis.dataCompleteness !== 'PARTIAL_URL_ONLY'
                      ? "✅ Données de l'annonce et du profil vendeur extraites automatiquement. Vous pouvez modifier un champ ou simuler le mode de paiement demandé par le vendeur."
                      : "Les champs ci-dessous sont remplis automatiquement lors du scan si l'annonce est accessible, ou peuvent être complétés manuellement."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-indigo-400" />
                    Titre / Modèle exact du produit
                  </label>
                  <input
                    type="text"
                    value={listingTitle}
                    onChange={(e) => setListingTitle(e.target.value)}
                    placeholder="Ex: iPhone 15 Pro Max 256Go, PS5 Standard, AirPods Pro 2..."
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Prix affiché (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="Ex: 290"
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  Description de l'annonce ou message du vendeur
                </label>
                <textarea
                  rows={3}
                  value={listingDescription}
                  onChange={(e) => setListingDescription(e.target.value)}
                  placeholder="Collez ici le texte de l'annonce (ex: 'Neuf sous blister avec facture, ne cliquez pas sur acheter, contactez-moi sur WhatsApp...')"
                  className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-indigo-400" />
                    Pseudo du vendeur
                  </label>
                  <input
                    type="text"
                    value={sellerUsername}
                    onChange={(e) => setSellerUsername(e.target.value)}
                    placeholder="Ex: alex_deals75"
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nombre d'avis vendeur
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sellerRatingsCount}
                    onChange={(e) => setSellerRatingsCount(e.target.value)}
                    placeholder="Ex: 0 (si aucun avis)"
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-indigo-400" />
                    Nombre de photos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={photosCount}
                    onChange={(e) => setPhotosCount(e.target.value)}
                    placeholder="Ex: 1"
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Paiement demandé
                  </label>
                  <select
                    value={paymentMethodRequested}
                    onChange={(e) => setPaymentMethodRequested(e.target.value as any)}
                    className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="platform_secure">Paiement sécurisé Leboncoin/Vinted</option>
                    <option value="cash_hand">Remise en main propre</option>
                    <option value="paypal_friends">PayPal 'Entre proches'</option>
                    <option value="wire">Virement bancaire direct</option>
                    <option value="coupons">Coupons (Transcash, PCS, Neosurf)</option>
                    <option value="courier_cash">Livreur DHL/FedEx avec cash</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Erreur d'analyse</div>
            <div className="text-xs text-rose-300/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
              <TrustMeter score={result.score} riskLevel={result.riskLevel} />
              <div className="flex-1 w-full space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      {result.listingAnalysis?.isMarketplaceListing
                        ? `Annonce ${result.listingAnalysis.platform.toUpperCase()} inspectée`
                        : 'Cible analysée'}
                    </span>
                    <h3 className="text-lg font-bold text-white flex items-center gap-1.5 break-all">
                      {result.listingAnalysis?.detectedTitle || result.hostname}
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Signalements ScamWatch</span>
                    <span
                      className={`text-sm font-bold ${
                        result.matchingReportsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {result.matchingReportsCount} correspondance(s)
                    </span>
                  </div>
                </div>

                {result.listingAnalysis?.isMarketplaceListing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 flex items-center gap-1 mb-1">
                        <Tag className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Prix & Cote Occasion</span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {result.listingAnalysis.detectedPrice !== null
                          ? `${result.listingAnalysis.detectedPrice} €`
                          : 'Non renseigné'}
                      </div>
                      {result.listingAnalysis.marketBenchmark ? (
                        <div className="text-[11px] text-amber-300 mt-0.5 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 shrink-0" />
                          <span>
                            Cote moy. : ~{result.listingAnalysis.marketBenchmark.typicalUsedPrice} € (Plancher :{' '}
                            {result.listingAnalysis.marketBenchmark.minRealisticPrice} €)
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {result.listingAnalysis.detectedCategory || 'Catégorie générale'}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 flex items-center gap-1 mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Profil Vendeur</span>
                      </div>
                      <div className="text-sm font-bold text-white truncate">
                        {result.listingAnalysis.sellerUsername || 'Non renseigné'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {result.listingAnalysis.sellerRatingsCount !== null
                          ? `${result.listingAnalysis.sellerRatingsCount} évaluation(s)${
                              result.listingAnalysis.sellerRating
                                ? ` (${result.listingAnalysis.sellerRating}/5)`
                                : ''
                            }`
                          : 'Nombre d’avis non renseigné'}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 flex items-center gap-1 mb-1">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Niveau d'Inspection</span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {result.listingAnalysis.dataCompleteness === 'PARTIAL_URL_ONLY' ? (
                          <span className="text-amber-300">URL Seule (Incomplet)</span>
                        ) : (
                          <span className="text-emerald-400">Audit Multi-Critères Complet</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Domaine : {result.hostname} (Officiel)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 flex items-center gap-1 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ancienneté du Domaine (RDAP)</span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {result.rdap?.ageDays !== null && result.rdap?.ageDays !== undefined
                          ? `${result.rdap.ageDays} jours (${Math.floor(Number(result.rdap.ageDays) / 30)} mois)`
                          : 'Donnée masquée ou registrar privé'}
                      </div>
                      {result.rdap?.registrar && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Registrar : {result.rdap.registrar}
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-slate-400 flex items-center gap-1 mb-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Certificat SSL & HTTPS</span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        {result.inspection?.isHttps ? (
                          <span className="text-emerald-400">Chiffrement SSL Valide</span>
                        ) : (
                          <span className="text-rose-400">Non chiffré (Danger)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Statut HTTP : {result.inspection?.statusCode || 'Inconnu'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {result.listingAnalysis?.checkPoints && result.listingAnalysis.checkPoints.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  <span>Grille de Contrôle Algorithmique de l'Annonce ({result.listingAnalysis.checkPoints.length} vérifications)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {result.listingAnalysis.checkPoints.map((cp) => {
                    const statusConfig =
                      cp.status === 'PASS'
                        ? {
                            icon: CheckCircle2,
                            color: 'text-emerald-400',
                            bg: 'bg-emerald-950/25 border-emerald-500/25',
                            badge: 'CONFORME',
                          }
                        : cp.status === 'FAIL'
                        ? {
                            icon: XCircle,
                            color: 'text-rose-400',
                            bg: 'bg-rose-950/30 border-rose-500/30',
                            badge: 'DANGER',
                          }
                        : cp.status === 'WARN'
                        ? {
                            icon: AlertTriangle,
                            color: 'text-amber-400',
                            bg: 'bg-amber-950/25 border-amber-500/25',
                            badge: 'VIGILANCE',
                          }
                        : {
                            icon: Info,
                            color: 'text-indigo-400',
                            bg: 'bg-slate-900/70 border-slate-800',
                            badge: 'INFO',
                          };
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={cp.id}
                        className={`p-3 rounded-xl border ${statusConfig.bg} flex items-start gap-2.5 text-xs`}
                      >
                        <StatusIcon className={`w-4 h-4 ${statusConfig.color} shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-200">{cp.label}</span>
                            <span className={`text-[10px] font-bold ${statusConfig.color}`}>
                              {statusConfig.badge}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{cp.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <RedFlagList
            redFlags={result.redFlags}
            warningFlags={result.warningFlags}
            safeFlags={result.safeFlags}
            recommendations={result.recommendations}
          />
        </div>
      )}
    </div>
  );
};
