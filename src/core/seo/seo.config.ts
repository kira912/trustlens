export interface PageSeoMeta {
  title: string;
  description: string;
  canonicalPath: string;
  h1: string;
  subtitle: string;
}

export const SEO_META_BY_TAB: Record<string, PageSeoMeta> = {
  scan: {
    title: "TrustLens — Vérifier si un Vendeur Vinted, Leboncoin ou Site est Fiable (Détecteur d'Arnaque)",
    description:
      "Vérifiez gratuitement la fiabilité d'un vendeur ou d'une boutique en ligne : scanner d'URL anti-phishing, ancienneté de domaine RDAP et analyseur de messages suspects (DHL, Transcash, PayPal).",
    canonicalPath: '/',
    h1: 'Vérifiez la fiabilité d’un vendeur ou d’un site avant d’acheter',
    subtitle:
      "Analysez instantanément une boutique e-commerce, un lien Vinted / Leboncoin ou un message suspect pour détecter le phishing et les escroqueries en ligne.",
  },
  scamometer: {
    title: 'Scam-O-Meter — Simulateur de Risque & Diagnostic Transaction Marketplace | TrustLens',
    description:
      "Évaluez en 30 secondes si une annonce Leboncoin, Vinted ou Facebook Marketplace est sûre ou risquée grâce à notre calculateur de TrustScore en 6 critères.",
    canonicalPath: '/?tab=scamometer',
    h1: 'Scam-O-Meter : calculez l’indice de confiance de votre transaction',
    subtitle:
      "Répondez à 6 questions sur le profil du revendeur, le moyen de paiement exigé et le mode de livraison pour obtenir un diagnostic de sécurité immédiat.",
  },
  siret: {
    title: 'Vérifier un Numéro SIRET / SIREN en Direct (Registre Officiel Insee Gouv) | TrustLens',
    description:
      "Contrôlez gratuitement si un vendeur professionnel ou un site marchand est légalement déclaré et actif en France, ou s'il utilise un numéro SIRET radié ou usurpé.",
    canonicalPath: '/?tab=siret',
    h1: 'Vérification officielle SIRET / SIREN d’un vendeur professionnel',
    subtitle:
      "Interrogez en temps réel le Registre National des Entreprises (Insee / Gouv.fr) pour démasquer les fausses boutiques et les sociétés radiées.",
  },
  scamwatch: {
    title: 'ScamWatch — Rechercher ou Signaler un Numéro, IBAN ou Site d’Arnaque | TrustLens',
    description:
      "Consultez la base communautaire des escrocs signalés sur Leboncoin, Vinted et Internet. Vérifiez un numéro 06/07, un IBAN, un email ou déclarez une arnaque.",
    canonicalPath: '/?tab=scamwatch',
    h1: 'Base communautaire ScamWatch : recherchez ou signalez un escroc',
    subtitle:
      "Vérifiez si un numéro de téléphone, un IBAN, un pseudo ou un lien frauduleux a déjà été signalé par d'autres acheteurs.",
  },
  guides: {
    title: 'Guides Anti-Arnaque : Faux Livreur DHL, Coupons Transcash, PayPal & Recours | TrustLens',
    description:
      "Découvrez comment déjouer les 5 arnaques les plus fréquentes sur les sites de petites annonces et quelles démarches engager (Chargeback, plainte THÉSÉE, PHAROS).",
    canonicalPath: '/?tab=guides',
    h1: 'Guides de prévention et recours contre les arnaques en ligne',
    subtitle:
      "Apprenez à identifier instantanément les modes opératoires des fraudeurs et suivez la procédure officielle en cas de litige.",
  },
};
