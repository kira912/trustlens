import React from 'react';
import { Building2, Search, CheckCircle2, XCircle, AlertTriangle, MapPin, Calendar, UserCheck } from 'lucide-react';
import { useSiretSearch } from '../hooks/useSiretSearch';

export const SiretChecker: React.FC = () => {
  const { query, setQuery, loading, data, error, searchSiret } = useSiretSearch();

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5 sm:p-7 border border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Building2 className="w-4 h-4" />
          <span>Vérificateur Officiel SIRET / SIREN (Base Insee & Gouv.fr)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Vérifiez la légalité d'un revendeur professionnel
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
          Un vendeur professionnel doit obligatoirement avoir une immatriculation légale en France ou dans l'UE. Vérifiez en direct si son numéro SIRET est réel, actif, ou s'il s'agit d'une société radiée.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchSiret();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Entrez un numéro SIREN (9 chiffres), SIRET (14 chiffres) ou raison sociale..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Interrogation Insee...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Vérifier l'immatriculation</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="text-sm text-slate-400 flex items-center justify-between">
            <span>{data.count} entreprise(s) trouvée(s) pour "{data.query}"</span>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
              Registre National des Entreprises (RNE)
            </span>
          </div>

          {data.companies.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-400 border border-slate-800">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <div className="font-semibold text-white">Aucune entreprise trouvée</div>
              <p className="text-xs mt-1">
                Le numéro ou nom fourni ne figure pas au registre officiel.
              </p>
            </div>
          ) : (
            data.companies.map((company, index) => (
              <div key={index} className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{company.nomComplet}</h3>
                      {company.isCessée ? (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          ENTREPRISE RADIÉE (CESSÉE)
                        </span>
                      ) : (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ACTIVE & DÉCLARÉE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>SIREN : <strong className="text-slate-200 font-mono">{company.siren}</strong></span>
                      {company.siretSiege && <span>SIRET Siège : <strong className="text-slate-200 font-mono">{company.siretSiege}</strong></span>}
                      {company.activitePrincipale && <span>Code NAF : <strong className="text-slate-200 font-mono">{company.activitePrincipale}</strong></span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">Score Légalité</span>
                    <span className={`text-2xl font-black ${company.trustScore >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {company.trustScore}/100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Adresse du Siège Social</span>
                    </div>
                    <div className="text-slate-200 font-medium">{company.adresse}</div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Date de Création / Ancienneté</span>
                    </div>
                    <div className="text-slate-200 font-medium">
                      {company.dateCreation ? `${company.dateCreation} (${company.ageAnnees} an(s) d'existence)` : 'Non communiquée'}
                    </div>
                  </div>
                </div>

                {company.dirigeants && company.dirigeants.length > 0 && (
                  <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Dirigeant(s) officiel(s) : <strong className="text-slate-200">{company.dirigeants.join(', ')}</strong></span>
                  </div>
                )}

                {company.redFlags.length > 0 && (
                  <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300">
                    {company.redFlags.map((rf, i) => (
                      <div key={i} className="font-semibold">• {rf}</div>
                    ))}
                  </div>
                )}
                {company.positivePoints.length > 0 && (
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300">
                    {company.positivePoints.map((pp, i) => (
                      <div key={i}>✓ {pp}</div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
