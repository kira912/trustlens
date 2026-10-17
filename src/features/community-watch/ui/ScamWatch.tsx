import React from 'react';
import { ShieldAlert, Search, PlusCircle, ThumbsUp, Calendar, AlertOctagon, Phone, Mail, Globe, CreditCard, User, X } from 'lucide-react';
import { useScamWatch } from '../hooks/useScamWatch';

const FILTER_TYPES = [
  { id: 'all', label: 'Tous' },
  { id: 'phone', label: 'Téléphones' },
  { id: 'url', label: 'Faux Sites & URLs' },
  { id: 'iban', label: 'IBANs Fraudeurs' },
  { id: 'email', label: 'Emails' },
  { id: 'username', label: 'Pseudos' },
];

function renderTypeIcon(type: string) {
  switch (type) {
    case 'phone':
      return <Phone className="w-4 h-4 text-emerald-400" />;
    case 'email':
      return <Mail className="w-4 h-4 text-indigo-400" />;
    case 'url':
      return <Globe className="w-4 h-4 text-cyan-400" />;
    case 'iban':
      return <CreditCard className="w-4 h-4 text-amber-400" />;
    default:
      return <User className="w-4 h-4 text-rose-400" />;
  }
}

export const ScamWatch: React.FC = () => {
  const {
    reports,
    loading,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    showModal,
    setShowModal,
    formState,
    updateForm,
    submitting,
    formMessage,
    fetchReports,
    upvote,
    submitReport,
  } = useScamWatch();

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              <span>Base Communautaire de Vigilance (PostgreSQL)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              ScamWatch : Vérifiez un numéro, IBAN ou pseudo
            </h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-rose-600/20 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Signaler une arnaque</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchReports();
          }}
          className="flex gap-2 mb-4"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un numéro (07...), un IBAN, un email ou un pseudo suspect..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3 rounded-xl text-xs sm:text-sm shrink-0"
          >
            Filtrer
          </button>
        </form>

        <div className="flex flex-wrap gap-2 text-xs">
          {FILTER_TYPES.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedType(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedType === f.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-slate-400 font-semibold px-1">
          {reports.length} signalement(s) vérifié(s) dans la base
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-xs text-slate-400">Chargement de la base ScamWatch...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-400 border border-slate-800">
            <AlertOctagon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <div className="font-semibold text-white">Aucun signalement trouvé pour cette recherche.</div>
            <p className="text-xs mt-1">Restez vigilant même si l'élément n'apparaît pas encore dans la base.</p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800/80 hover:border-slate-700 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    {renderTypeIcon(report.targetType)}
                  </div>
                  <div>
                    <span className="font-mono text-sm font-bold text-white break-all">{report.targetValue}</span>
                    {report.sellerAlias && (
                      <span className="text-xs text-slate-400 ml-2">(Pseudo: {report.sellerAlias})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded text-[11px] font-semibold">
                    {report.platform}
                  </span>
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {report.scamType}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{report.description}</p>

              <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Signalé le {new Date(report.reportedAt).toLocaleDateString('fr-FR')}</span>
                </div>

                <button
                  onClick={() => upvote(report.id)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs"
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Utile ({report.upvotes})</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-7 relative shadow-2xl">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Signaler un escroc ou une annonce frauduleuse
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Votre signalement protège immédiatement d'autres acheteurs.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitReport();
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type d'élément</label>
                  <select
                    value={formState.targetType}
                    onChange={(e) => updateForm('targetType', e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="phone">Numéro de téléphone</option>
                    <option value="url">Lien / URL de site</option>
                    <option value="iban">IBAN / Coordonnées bancaires</option>
                    <option value="email">Adresse Email</option>
                    <option value="username">Pseudo revendeur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plateforme</label>
                  <select
                    value={formState.platform}
                    onChange={(e) => updateForm('platform', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                  >
                    <option value="Leboncoin">Leboncoin</option>
                    <option value="Vinted">Vinted</option>
                    <option value="Facebook Marketplace">Facebook Marketplace</option>
                    <option value="Amazon">Amazon Marketplace</option>
                    <option value="Boutique Indépendante">Boutique Indépendante</option>
                    <option value="WhatsApp / SMS">WhatsApp / SMS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Coordonnée suspecte *</label>
                <input
                  type="text"
                  required
                  value={formState.targetValue}
                  onChange={(e) => updateForm('targetValue', e.target.value)}
                  placeholder="Ex: +33 7 56... ou https://vinted-livraison..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Pseudo du vendeur (si connu)</label>
                <input
                  type="text"
                  value={formState.sellerAlias}
                  onChange={(e) => updateForm('sellerAlias', e.target.value)}
                  placeholder="Ex: Mode_Fashion_75"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Type d'arnaque</label>
                <select
                  value={formState.scamType}
                  onChange={(e) => updateForm('scamType', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="Faux transporteur / Coupons">Faux transporteur DHL/FedEx avec coupons Transcash</option>
                  <option value="Phishing / Fausse page de paiement">Faux site de paiement ou fausse page Vinted/Leboncoin</option>
                  <option value="Acompte / Virement sans colis">Demande d'acompte virement sans envoyer l'objet</option>
                  <option value="PayPal Entre Proches">Demande insistante de PayPal entre proches</option>
                  <option value="Contrefaçon avérée">Article de contrefaçon vendu pour du vrai</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description du mode opératoire *</label>
                <textarea
                  required
                  rows={3}
                  value={formState.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Expliquez ce que le vendeur a demandé..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              {formMessage && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs">
                  {formMessage}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-600/20"
                >
                  {submitting ? 'Envoi...' : 'Publier le signalement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
