import React from 'react';
import { Sliders, AlertTriangle, CheckCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { useScamOMeter } from '../hooks/useScamOMeter';
import { TrustMeter } from '../../../shared/ui/TrustMeter';

export const ScamOMeter: React.FC = () => {
  const { state, updateField, resetAll, diagnostic } = useScamOMeter();

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Simulateur & Diagnostic Interactif de Risque</span>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Scam-O-Meter : Évaluez votre transaction en 30 secondes
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          Sélectionnez les caractéristiques de l'annonce et le comportement du revendeur pour calculer en temps réel l'indice de risque.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
              1. Plateforme ou marketplace
            </label>
            <select
              value={state.platform}
              onChange={(e) => updateField('platform', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="leboncoin">Leboncoin</option>
              <option value="vinted">Vinted</option>
              <option value="facebook">Facebook Marketplace</option>
              <option value="amazon">Amazon Marketplace</option>
              <option value="ebay">eBay</option>
              <option value="other_store">Boutique en ligne indépendante / Autre</option>
            </select>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              2. Moyen de paiement exigé ou proposé
            </label>
            <select
              value={state.paymentMethod}
              onChange={(e) => updateField('paymentMethod', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="secure_platform">Paiement sécurisé officiel de la plateforme (Recommandé)</option>
              <option value="hand_cash">Espèces en main propre après vérification de l'objet</option>
              <option value="wire">Virement bancaire direct préalable (hors plateforme)</option>
              <option value="paypal_friends">PayPal entre proches / ami (sans garantie acheteur)</option>
              <option value="courier_cash">Enveloppe d'argent liquide apportée par un transporteur</option>
              <option value="coupons">Recharge coupon (PCS, Transcash, Neosurf)</option>
            </select>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              3. Canal de communication
            </label>
            <select
              value={state.communicationChannel}
              onChange={(e) => updateField('communicationChannel', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="in_platform">Reste strictement dans la messagerie de l'application</option>
              <option value="outside">Demande de basculer sur WhatsApp, SMS ou par email direct</option>
            </select>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              4. Mode de livraison proposé
            </label>
            <select
              value={state.deliveryMethod}
              onChange={(e) => updateField('deliveryMethod', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="official_tracked">Colis suivi officiel (Mondial Relay, Chronopost, Colissimo)</option>
              <option value="hand_delivery">Remise en main propre dans un lieu public</option>
              <option value="fake_courier">Le vendeur dit mandater son propre coursier DHL / FedEx / GLS</option>
            </select>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              5. Prix de vente par rapport à la valeur normale
            </label>
            <select
              value={state.priceLevel}
              onChange={(e) => updateField('priceLevel', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
            >
              <option value="normal">Prix standard d'occasion (conforme au marché)</option>
              <option value="attractive">Prix avantageux (-30% à -40% sous la cote)</option>
              <option value="too_cheap">Prix dérisoire ou anormal (-60% à -80% du prix neuf)</option>
            </select>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-bold text-slate-300 block mb-2">
              6. Profil & Réputation du vendeur
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={state.profileAge}
                  onChange={(e) => updateField('profileAge', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="new">Compte récent (&lt; 1 mois)</option>
                  <option value="medium">Compte de 1 à 12 mois</option>
                  <option value="veteran">Compte ancien (&gt; 1 an)</option>
                </select>

                <select
                  value={state.ratingsCount}
                  onChange={(e) => updateField('ratingsCount', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                >
                  <option value="zero">0 avis (débutant)</option>
                  <option value="some">1 à 5 avis</option>
                  <option value="many">Plus de 10 avis positifs</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={state.hasVerifiedId}
                  onChange={(e) => updateField('hasVerifiedId', e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 bg-slate-950"
                />
                <span className="text-xs text-slate-300">Badge d'identité vérifiée par la marketplace</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <TrustMeter score={diagnostic.score} riskLevel={diagnostic.level} />
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              Verdict du Simulateur :{' '}
              {diagnostic.level === 'DANGER'
                ? '🛑 DANGER IMMINENT'
                : diagnostic.level === 'WARNING'
                ? '⚠️ TRANSACTION À RISQUE'
                : '✅ TRANSACTION SÉCURISÉE'}
            </h3>

            {diagnostic.redFlags.length > 0 && (
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Pièges mortels identifiés :
                </div>
                {diagnostic.redFlags.map((rf, i) => (
                  <div key={i} className="text-xs text-rose-200 font-medium">
                    • {rf}
                  </div>
                ))}
              </div>
            )}

            {diagnostic.warnings.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">Signaux d'alerte :</div>
                {diagnostic.warnings.map((w, i) => (
                  <div key={i} className="text-xs text-amber-200">
                    • {w}
                  </div>
                ))}
              </div>
            )}

            {diagnostic.safePoints.length > 0 && (
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Garanties valides :
                </div>
                {diagnostic.safePoints.map((s, i) => (
                  <div key={i} className="text-xs text-emerald-200">
                    • {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
