import { RiskAssessment, RiskFlag, SafeSignal } from '../../../../shared/domain/risk-assessment.vo';

export interface HeuristicPattern {
  pattern: RegExp;
  weight: number;
  label: string;
  detail?: string;
}

/**
 * Normalizes obfuscated text (accents, zero-width chars, emoji digits, spaced digits)
 * so scammers cannot bypass regex detection with "t r a n s c a s h" or "0️⃣6️⃣" or "zéro six"
 */
export function normalizeTextForScan(raw: string): string {
  let normalized = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/0️⃣/g, '0')
    .replace(/1️⃣/g, '1')
    .replace(/2️⃣/g, '2')
    .replace(/3️⃣/g, '3')
    .replace(/4️⃣/g, '4')
    .replace(/5️⃣/g, '5')
    .replace(/6️⃣/g, '6')
    .replace(/7️⃣/g, '7')
    .replace(/8️⃣/g, '8')
    .replace(/9️⃣/g, '9');

  // Convert French spoken phone prefixes ("zéro six", "zero sept")
  normalized = normalized
    .replace(/\b(z[eé]ro)\s*(six|6)\b/gi, '06')
    .replace(/\b(z[eé]ro)\s*(sept|7)\b/gi, '07');

  return normalized;
}

export const SUSPICIOUS_PAYMENTS: HeuristicPattern[] = [
  {
    pattern: /\b(trans\s*cash|pcs|pcs\s*mastercard|neosurf|paysafecard|toneo\s*first|toneo|mandat\s*cash|western\s*union|moneygram|ria\s*transfer|coupon\s*recharge|ticket\s*recharge)\b/i,
    weight: 55,
    label: 'Paiement par coupon / recharge intraçable (PCS, Transcash, Neosurf, Western Union)',
    detail: '100% des demandes de coupons prépayés ou transferts cash sur Leboncoin/Vinted sont des escroqueries.',
  },
  {
    pattern: /\b(paypal\s*(entre\s*amis|entre\s*proches|famille\s*et\s*amis|sans\s*frais|gift|friends?))\b/i,
    weight: 40,
    label: "Demande de paiement PayPal 'Entre proches' (supprime toute garantie acheteur)",
    detail: "Le mode 'Entre proches' désactive tout recours ou remboursement PayPal en cas de colis non envoyé.",
  },
  {
    pattern: /\b(virement\s*(imm[ée]diat|instantan[ée]|bancaire|sepa|iban)\s*(avant\s*envoi|d'?abord|uniquement|obligatoire)|paiement\s*uniquement\s*par\s*virement)\b/i,
    weight: 30,
    label: "Exigence d'un virement bancaire direct sans passer par le tiers de confiance",
    detail: "Un virement bancaire instantané est irrévocable et n'offre aucune protection si le vendeur disparaît.",
  },
  {
    pattern: /\b(crypto|bitcoin|btc|usdt|ethereum|eth|monero|binance\s*pay)\b/i,
    weight: 45,
    label: 'Demande de paiement en cryptomonnaie (irréversible et intraçable)',
  },
  {
    pattern: /(enveloppe.*(argent|billet|liquide|esp[èe]ces)|(argent|billet).*liquide.*(enveloppe|livreur|courrier|transporteur))/i,
    weight: 50,
    label: "Promesse d'enveloppe d'argent liquide confiée à un transporteur/livreur",
    detail: "Aucun transporteur (DHL, FedEx, La Poste) ne remet d'argent liquide en échange d'un colis.",
  },
  {
    pattern: /\b(acompte|arrhes|r[ée]servation)\s*(de\s*[0-9]+\s*€|par\s*virement|avant\s*visite|pour\s*bloquer|pour\s*r[ée]server)/i,
    weight: 40,
    label: "Demande d'acompte ou frais de réservation avant même de voir le bien",
    detail: 'Technique typique des fausses locations immobilières, voitures fantômes ou animaux sur Leboncoin.',
  },
];

export const SUSPICIOUS_CARRIERS: HeuristicPattern[] = [
  {
    pattern: /(livreur|transporteur|coursier).*(dhl|fedex|gls|dpd|chronopost|ups|colissimo)|(dhl|fedex|gls|dpd|chronopost|ups).*(livreur|transporteur|passera|viendra|r[ée]cup[ée]rer|domicile)/i,
    weight: 40,
    label: 'Arnaque classique au faux coursier / transporteur à domicile (DHL/FedEx/GLS/UPS)',
  },
  {
    pattern: /(frais\s*d'?assurance|frais\s*de\s*mandat|d[ée]bloquer\s*(les\s*)?fonds|taxe\s*de\s*transfert|activer\s*(votre\s*)?compte|frais\s*de\s*douane\s*[àa]\s*avancer)/i,
    weight: 45,
    label: "Faux frais d'assurance, de déblocage ou taxe inventée à avancer",
  },
  {
    pattern: /(en\s*d[ée]placement|actuellement\s*[àa]\s*l'?[ée]tranger|mission\s*humanitaire|militaire\s*en\s*mission|en\s*c[ôo]te\s*d'?ivoire|malentendant\s*ne\s*peut\s*pas\s*appeler)/i,
    weight: 28,
    label: "Prétexte d'indisponibilité géographique ou professionnelle (scénario préfabriqué)",
  },
];

export const PLATFORM_CHECKOUT_BYPASS: HeuristicPattern[] = [
  {
    pattern: /(ne\s*cliquez\s*pas\s*sur\s*acheter|n'?achetez\s*pas\s*directement|ne\s*pas\s*payer\s*sur\s*(le\s*site|vinted|leboncoin)|pas\s*de\s*paiement\s*(leboncoin|vinted|s[ée]curis[ée])|refuse\s*le\s*paiement\s*(leboncoin|vinted))/i,
    weight: 45,
    label: "Refus explicite du paiement sécurisé Leboncoin / Vinted ('Ne cliquez pas sur acheter')",
    detail: "Le vendeur tente volontairement de désactiver la Protection Acheteur pour encaisser l'argent sans envoyer l'article.",
  },
  {
    pattern: /(contactez[\s-]*moi\s*avant\s*(tout\s*)?achat|[ée]crivez[\s-]*moi\s*avant\s*d'?acheter|valider\s*la\s*commande\s*par\s*sms\s*ou\s*mail)/i,
    weight: 30,
    label: "Injonction à contacter le vendeur avant d'utiliser le bouton d'achat officiel",
    detail: 'Souvent utilisé par les comptes frauduleux sur Vinted/Leboncoin pour envoyer un faux lien de paiement par message.',
  },
  {
    pattern: /(scanner\s*le\s*qr\s*code|qr\s*code\s*pour\s*valider|lien\s*de\s*r[ée]ception\s*des\s*fonds|confirmer\s*votre\s*carte\s*bancaire\s*pour\s*recevoir)/i,
    weight: 50,
    label: 'Piège au QR Code ou faux formulaire bancaire de réception de fonds',
    detail: "Vous n'avez JAMAIS besoin de saisir les numéros de votre carte bancaire ni un code 3D-Secure pour RECEVOIR de l'argent.",
  },
];

export const OUT_OF_PLATFORM: HeuristicPattern[] = [
  {
    pattern: /(contactez[\s-]*moi\s*par\s*(mail|email|courriel)|[ée]crivez[\s-]*moi\s*[àa]\s*l'?adresse|[a-zA-Z0-9._%+-]+\s*(@|\[at\]|arobase)\s*(gmail|hotmail|yahoo|outlook|proton|icloud|wanadoo|orange|sfr|free)\s*(\.|point)\s*[a-z]+)/i,
    weight: 30,
    label: 'Tentative de détournement hors plateforme par email direct',
  },
  {
    pattern: /(par\s*(sms|whatsapp|t[ée]l[ée]phone|telegram|snapchat|insta|instagram)|discutons\s*sur\s*whatsapp|(?:(?:\+|00)33|0|\bO)\s*[67](?:[\s.\-_]*[0-9]{2}){4})/i,
    weight: 28,
    label: 'Demande de continuer sur WhatsApp / SMS / Réseaux hors de la messagerie sécurisée',
    detail: 'Dès que vous quittez la messagerie Leboncoin ou Vinted, le support ne peut plus couvrir vos échanges ni bloquer le phishing.',
  },
  {
    pattern: /(compte\s*(bloqu[ée]|restreint|en\s*attente)|limite\s*de\s*transaction|mon\s*iban\s*ne\s*passe\s*pas|probl[èe]me\s*avec\s*le\s*porte[\s-]*monnaie)/i,
    weight: 25,
    label: 'Prétexte de problème technique ou porte-monnaie bloqué sur la plateforme',
  },
];

export const COUNTERFEIT_AND_CLONE_PATTERNS: HeuristicPattern[] = [
  {
    pattern: /\b(qualit[ée]\s*1\s*[:/]\s*1|copie\s*1\s*[:/]\s*1|master\s*copy|grade\s*aaa\+?|\br[ée]plique\b|identique\s*[àa]\s*l'?original|inspir[ée]\s*de\s*la\s*marque|sans\s*num[ée]ro\s*de\s*s[ée]rie|provenance\s*duba[ïi])\b/i,
    weight: 45,
    label: 'Indicateur explicite de contrefaçon / réplique illégale (1:1, Grade AAA, copie)',
    detail: 'La vente de contrefaçons est illégale et vous expose à la saisie douanière ainsi qu’à la perte de votre argent.',
  },
  {
    pattern: /(cadeau\s*sans\s*facture|re[çc]u\s*en\s*cadeau\s*donc\s*pas\s*de\s*facture|facture\s*perdue\s*mais\s*authentique|vendu\s*sans\s*bo[îi]te\s*ni\s*facture\s*urgent)/i,
    weight: 20,
    label: "Absence suspecte de facture et boîte justifiée par un 'cadeau' (risque de recel ou contrefaçon)",
  },
];

export const URGENCY_TRIGGERS: HeuristicPattern[] = [
  {
    pattern: /(tr[èe]s\s*urgent|urgentissime|vendu\s*au\s*premier\s*qui\s*paie|d[ée]cision\s*imm[ée]diate|besoin\s*d'?argent\s*vite|part\s*vite|cause\s*d[ée]part\s*[àa]\s*l'?[ée]tranger\s*urgent)/i,
    weight: 18,
    label: 'Pression temporelle anormale / précipitation de la vente',
  },
  {
    pattern: /(prix\s*brad[ée]|cadeau\s*de\s*mariage|double\s*emploi\s*neuf\s*sous\s*blister|jamais\s*ouvert\s*moiti[ée]\s*prix)/i,
    weight: 15,
    label: 'Justification stéréotypée pour un prix dérisoire (trop beau pour être vrai)',
  },
];

export function evaluateTextRisk(rawText: string): RiskAssessment {
  const text = normalizeTextForScan(rawText);
  let penalty = 0;
  const redFlags: RiskFlag[] = [];
  const warningFlags: RiskFlag[] = [];
  const safeFlags: SafeSignal[] = [];

  for (const item of SUSPICIOUS_PAYMENTS) {
    if (item.pattern.test(text)) {
      penalty += item.weight;
      redFlags.push({
        type: 'PAYMENT_RISK',
        severity: 'CRITICAL',
        title: item.label,
        detail: item.detail,
        snippet: text.match(item.pattern)?.[0] || '',
      });
    }
  }

  for (const item of SUSPICIOUS_CARRIERS) {
    if (item.pattern.test(text)) {
      penalty += item.weight;
      redFlags.push({
        type: 'CARRIER_SCAM',
        severity: 'HIGH',
        title: item.label,
        detail: item.detail,
        snippet: text.match(item.pattern)?.[0] || '',
      });
    }
  }

  for (const item of PLATFORM_CHECKOUT_BYPASS) {
    if (item.pattern.test(text)) {
      penalty += item.weight;
      redFlags.push({
        type: 'CHECKOUT_BYPASS',
        severity: 'HIGH',
        title: item.label,
        detail: item.detail,
        snippet: text.match(item.pattern)?.[0] || '',
      });
    }
  }

  for (const item of COUNTERFEIT_AND_CLONE_PATTERNS) {
    if (item.pattern.test(text)) {
      penalty += item.weight;
      if (item.weight >= 35) {
        redFlags.push({
          type: 'COUNTERFEIT_RISK',
          severity: 'HIGH',
          title: item.label,
          detail: item.detail,
          snippet: text.match(item.pattern)?.[0] || '',
        });
      } else {
        warningFlags.push({
          type: 'COUNTERFEIT_WARNING',
          severity: 'MEDIUM',
          title: item.label,
          detail: item.detail,
          snippet: text.match(item.pattern)?.[0] || '',
        });
      }
    }
  }

  for (const item of OUT_OF_PLATFORM) {
    if (item.pattern.test(text)) {
      penalty += item.weight;
      warningFlags.push({
        type: 'COMMUNICATION_BYPASS',
        severity: 'MEDIUM',
        title: item.label,
        detail: item.detail,
        snippet: text.match(item.pattern)?.[0] || '',
      });
    }
  }

  for (const item of URGENCY_TRIGGERS) {
    if (item.pattern.test(text)) {
      penalty += item.weight;
      warningFlags.push({
        type: 'PSYCHOLOGICAL_PRESSURE',
        severity: 'LOW',
        title: item.label,
        snippet: text.match(item.pattern)?.[0] || '',
      });
    }
  }

  const linkMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
  for (const link of linkMatches) {
    if (/bit\.ly|tinyurl|is\.gd|cutt\.ly|t\.co|rb\.gy|shorturl|tiny\.cc/i.test(link)) {
      penalty += 35;
      redFlags.push({
        type: 'SUSPICIOUS_LINK',
        severity: 'HIGH',
        title: `Lien raccourci suspect (${link}) : souvent utilisé pour masquer un site de phishing`,
        snippet: link,
      });
    }
  }

  // Compound synergy: if both communication bypass AND urgency/payment risk co-occur, amplify penalty
  if (redFlags.length >= 1 && warningFlags.length >= 1) {
    penalty += 12;
  } else if (warningFlags.length >= 2) {
    penalty += 10;
  }

  const hasBypassOrPaymentScam = redFlags.some((f) =>
    ['PAYMENT_RISK', 'CHECKOUT_BYPASS', 'CARRIER_SCAM'].includes(f.type)
  );

  if (
    !hasBypassOrPaymentScam &&
    /(remise\s*en\s*main\s*propre|paiement\s*s[ée]curis[ée]|syst[èe]me\s*de\s*paiement\s*(vinted|leboncoin)|protection\s*acheteur)/i.test(text)
  ) {
    safeFlags.push({
      title: 'Mention du système de protection officiel ou remise en main propre',
      detail: 'Le texte fait référence aux mécanismes de protection standard sans tenter de les contourner.',
    });
    penalty = Math.max(0, penalty - 12);
  }

  if (
    !hasBypassOrPaymentScam &&
    /(facture\s*d'?origine\s*disponible|lettre\s*de\s*cession|num[ée]ro\s*de\s*s[ée]rie\s*v[ée]rifiable|contr[ôo]le\s*technique\s*ok)/i.test(text)
  ) {
    safeFlags.push({
      title: "Preuve d'authenticité / document officiel mentionné",
      detail: "Disponibilité annoncée d'une facture vérifiable ou document légal.",
    });
    penalty = Math.max(0, penalty - 8);
  }

  const score = RiskAssessment.clampScore(100 - penalty, 5);
  const riskLevel = RiskAssessment.computeLevel(score, redFlags.length, warningFlags.length);
  const recommendations = buildTextRecommendations(riskLevel);

  return new RiskAssessment(score, riskLevel, redFlags, warningFlags, safeFlags, recommendations);
}

function buildTextRecommendations(riskLevel: string): string[] {
  if (riskLevel === 'DANGER') {
    return [
      '🛑 NE TRANSMETTEZ AUCUN ARGENT ET AUCUNE COORDONNÉE BANCAIRE.',
      '❌ Refusez impérativement tout paiement hors plateforme (Transcash, PCS, PayPal entre proches, virement direct).',
      '🛡️ Signalez immédiatement cette annonce ou ce profil auprès de Leboncoin / Vinted.',
    ];
  }
  if (riskLevel === 'WARNING') {
    return [
      '⚠️ Restez exclusivement dans la messagerie et le système de paiement sécurisé officiel.',
      "🔍 Exigez une preuve concrète (ex: photo de l'objet avec un papier manuscrit indiquant votre prénom et la date du jour).",
      '🤝 Privilégiez si possible une remise en main propre dans un lieu public fréquenté.',
    ];
  }
  return [
    '✅ Les signaux textuels analysés ne présentent pas de script d’arnaque connu.',
    "💡 Conseil : finalisez toujours la transaction via le bouton d'achat officiel avec Protection Acheteur.",
  ];
}
