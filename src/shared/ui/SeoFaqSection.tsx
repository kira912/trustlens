import React from 'react';
import { HelpCircle, ShieldCheck, Lock, Building2, AlertTriangle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    icon: ShieldCheck,
    question: 'Comment savoir si un vendeur Leboncoin ou Vinted est fiable ?',
    answer:
      "Pour vérifier la fiabilité d'un vendeur sur une marketplace, contrôlez l'ancienneté de son profil, la cohérence de ses avis clients, son badge d'identité vérifiée et exigez le paiement sécurisé intégré. En cas de doute, collez le lien de l'annonce ou son message dans le scanner TrustLens.",
  },
  {
    icon: AlertTriangle,
    question: "Comment fonctionne l'arnaque au faux livreur DHL / FedEx avec coupons Transcash ?",
    answer:
      "L'escroc prétend habiter loin et envoyer un transporteur (DHL, FedEx, GLS, Chronopost) vous remettre une enveloppe d'argent liquide. Vous recevez ensuite un faux mail réclamant des recharges PCS, Transcash ou Neosurf pour « débloquer l'assurance ». Règle absolue : aucun transporteur ne livre d'argent liquide.",
  },
  {
    icon: Lock,
    question: "Pourquoi ne jamais accepter un paiement PayPal « Entre proches » avec un inconnu ?",
    answer:
      "L'option PayPal « Entre proches » (ou « Envoyer de l'argent à un ami ») supprime 100 % de la garantie Protection des Achats. Si le vendeur n'envoie rien ou expédie un colis vide, PayPal refusera tout remboursement.",
  },
  {
    icon: Building2,
    question: 'Comment vérifier qu’une boutique en ligne ou un vendeur pro existe légalement ?',
    answer:
      "La loi oblige tout site marchand professionnel à publier son numéro SIREN (9 chiffres) ou SIRET (14 chiffres) dans ses mentions légales. Utilisez l'outil « Vérif SIRET (Gouv) » de TrustLens pour interroger le Registre National des Entreprises (Insee) et vérifier que l'entreprise n'est pas radiée.",
  },
];

export const SeoFaqSection: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  return (
    <section
      aria-labelledby="seo-faq-heading"
      className="pt-8 border-t border-slate-800/80 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Questions Fréquentes & Sécurité E-Commerce
          </span>
          <h2 id="seo-faq-heading" className="text-xl sm:text-2xl font-bold text-white">
            Tout savoir pour vérifier un revendeur et éviter les arnaques en ligne
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href="/?tab=siret"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('siret');
            }}
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
          >
            Vérifier un SIRET
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="/?tab=scamwatch"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('scamwatch');
            }}
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
          >
            Annuaire ScamWatch
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="/?tab=guides"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('guides');
            }}
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
          >
            Guides Anti-Arnaque
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FAQ_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <article
              key={idx}
              className="glass-card rounded-2xl p-5 border border-slate-800/80 space-y-2"
            >
              <h3 className="text-sm sm:text-base font-bold text-white flex items-start gap-2.5">
                <Icon className="w-4 h-4 text-indigo-400 shrink-0 mt-1" />
                <span>{item.question}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-6">
                {item.answer}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};
