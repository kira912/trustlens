export interface GuideArticle {
  id: number;
  title: string;
  badge: string;
  icon: string;
  summary: string;
  mechanism: string[];
  goldenRule: string;
}

export const ANTI_SCAM_GUIDES: GuideArticle[] = [
  {
    id: 0,
    title: "L'arnaque au faux livreur DHL / FedEx / GLS",
    badge: 'Arnaque n°1',
    icon: '📦',
    summary: "L'acheteur prétend être absent et dit envoyer un coursier avec une enveloppe d'argent liquide.",
    mechanism: [
      "L'escroc vous contacte dès la publication de votre annonce sans négocier le prix.",
      "Il prétend être en déplacement professionnel ou à l'étranger et propose d'envoyer un transporteur (DHL, FedEx, UPS).",
      "Il affirme que le livreur vous remettra l'argent en liquide directement en main propre dans une enveloppe.",
      "Puis, vous recevez un faux email aux couleurs de DHL vous demandant d'acheter des coupons Transcash ou PCS (50€ à 150€) pour 'activer l'assurance du transporteur'.",
      "Dès que vous transmettez les codes de recharge, l'escroc encaisse l'argent et coupe tout contact.",
    ],
    goldenRule:
      "Aucun transporteur officiel (DHL, FedEx, UPS, Chronopost) ne livre d'enveloppe d'argent liquide aux particuliers. Refusez immédiatement.",
  },
  {
    id: 1,
    title: "Le piège du paiement PayPal 'Entre Proches'",
    badge: 'Litiges fréquents',
    icon: '💸',
    summary: "Le vendeur insiste pour utiliser PayPal entre amis sous prétexte d'éviter les commissions.",
    mechanism: [
      'Le vendeur propose un objet très attractif (smartphone, console, vêtement de marque).',
      "Il exige de payer via PayPal, mais impérativement avec l'option 'Envoyer de l'argent à un ami' (ou 'Entre proches').",
      "Une fois le paiement effectué, le vendeur n'envoie jamais le colis ou bloque votre compte.",
      "Lorsque vous contactez PayPal pour ouvrir un litige, PayPal refuse systématiquement : l'option 'Entre proches' désactive 100% de la Protection des Achats PayPal.",
    ],
    goldenRule:
      "Pour tout achat à distance, utilisez exclusivement le mode 'Biens et Services' sur PayPal ou le paiement sécurisé natif de la plateforme.",
  },
  {
    id: 2,
    title: 'Le faux SMS ou email de confirmation de vente',
    badge: 'Phishing ciblé',
    icon: '📧',
    summary: "Vous recevez un message affirmant que votre article est payé et qu'il faut saisir votre carte pour recevoir les fonds.",
    mechanism: [
      'Vous publiez une annonce. Quelques minutes plus tard, un faux acheteur demande votre numéro de téléphone ou votre email.',
      'Vous recevez ensuite un SMS ou email imitant parfaitement Leboncoin, Vinted ou La Poste avec le logo officiel.',
      "Le message prétend : 'Votre article a été réglé ! Cliquez ici pour confirmer vos coordonnées et recevoir le virement'.",
      'Le lien renvoie vers un faux site qui vous demande votre numéro de carte bancaire, date d’expiration et cryptogramme.',
    ],
    goldenRule:
      "Une vraie vente sur Leboncoin ou Vinted apparaît DIRECTEMENT dans votre compte sur l'application officielle, JAMAIS uniquement par SMS ou email externe.",
  },
  {
    id: 3,
    title: "Compte piraté d'un vendeur ancien",
    badge: 'Technique avancée',
    icon: '👤',
    summary: "Des comptes créés il y a 5 ans avec des centaines d'avis positifs sont piratés pour inspirer confiance.",
    mechanism: [
      "Les escrocs rachètent des listes d'identifiants volés ou utilisent le phishing pour s'emparer de vieux comptes.",
      'Le compte affiche 5 étoiles et 50 avis positifs, ce qui baisse la garde des acheteurs.',
      'Soudainement, le compte met en vente 10 articles de luxe ou high-tech à des prix très bas.',
      'Le pirate refuse la remise en main propre et demande un paiement direct hors plateforme (virement instantané ou coupon).',
    ],
    goldenRule:
      "Même face à un compte 5 étoiles, si les articles vendus n'ont rien à voir avec son historique ou si le vendeur refuse le paiement sécurisé du site, fuyez.",
  },
  {
    id: 4,
    title: 'Que faire si vous avez été arnaqué ?',
    badge: 'Recours & Urgence',
    icon: '🛡️',
    summary: "Les démarches immédiates pour tenter de récupérer votre argent et bloquer l'escroc.",
    mechanism: [
      "1. Faire opposition bancaire immédiate auprès de votre banque pour bloquer d'autres débits éventuels.",
      "2. Demander la procédure de Rétrofacturation (Chargeback) auprès de votre banque.",
      "3. Déposer plainte en ligne sur la plateforme officielle du Ministère de l'Intérieur : THÉSÉE ou PERCEVAL sur www.service-public.fr.",
      "4. Signaler l'annonce sur PHAROS (internet-signalement.gouv.fr) et dans la base communautaire ScamWatch de TrustLens.",
    ],
    goldenRule:
      'Agissez dans les 24h. Plus vous signalez vite à votre banque, plus les chances de blocage des fonds sont élevées.',
  },
];

export const PURCHASE_CHECKLIST = [
  'Payer exclusivement par le système intégré de la marketplace.',
  'Ne jamais communiquer son numéro de téléphone ou son adresse email dans le chat.',
  'Se méfier des prix anormalement cassés (-50% sur de la tech neuve = alerte).',
  "Exiger une photo de l'objet avec un mot écrit à votre prénom si doute sur l'authenticité.",
  "Filmer systématiquement l'ouverture du carton à la réception du colis pour avoir une preuve irréfutable.",
];
