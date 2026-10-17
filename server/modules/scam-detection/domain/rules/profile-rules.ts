import { RiskAssessment, RiskFlag, SafeSignal } from '../../../../shared/domain/risk-assessment.vo';

export interface ProfileEvaluationInput {
  platform?: string;
  username?: string;
  accountAgeMonths?: number;
  salesCount?: number;
  rating?: number;
  ratingsCount?: number;
  isIdentityVerified?: boolean;
  isPhoneVerified?: boolean;
  priceDiscountPercent?: number;
  paymentRequested?: string;
  matchingReportsCount?: number;
  matchedScamType?: string;
}

export function evaluateProfileRisk(input: ProfileEvaluationInput): RiskAssessment {
  const {
    accountAgeMonths = 0,
    rating = 5,
    ratingsCount = 0,
    isIdentityVerified = false,
    isPhoneVerified = false,
    priceDiscountPercent = 0,
    paymentRequested = 'platform_secure',
    matchingReportsCount = 0,
    matchedScamType = '',
  } = input;

  let score = 100;
  const redFlags: RiskFlag[] = [];
  const warningFlags: RiskFlag[] = [];
  const safeFlags: SafeSignal[] = [];

  if (matchingReportsCount > 0) {
    score -= 50;
    redFlags.push({
      type: 'KNOWN_SCAMMER',
      severity: 'CRITICAL',
      title: `Pseudo signalé ${matchingReportsCount} fois pour escroquerie`,
      detail: `Ce vendeur correspond à un signalement pour : ${matchedScamType}`,
    });
  }

  if (paymentRequested === 'coupons') {
    score -= 60;
    redFlags.push({
      type: 'PAYMENT_COUPON',
      severity: 'CRITICAL',
      title: 'Exigence de coupons recharge (Transcash, PCS, Neosurf)',
      detail: '100% des demandes de paiement par coupon sur marketplace sont des arnaques pures.',
    });
  } else if (paymentRequested === 'cash_delivery') {
    score -= 40;
    redFlags.push({
      type: 'FAKE_COURIER_CASH',
      severity: 'HIGH',
      title: 'Promesse de faux transporteur avec argent en enveloppe',
      detail: "Arnaque classique : aucun transporteur officiel ne livre d'enveloppe de cash.",
    });
  } else if (paymentRequested === 'paypal_friends') {
    score -= 30;
    redFlags.push({
      type: 'PAYPAL_FRIENDS',
      severity: 'HIGH',
      title: "Paiement PayPal 'Entre proches' demandé",
      detail: 'Annule intégralement la Protection des Achats PayPal.',
    });
  } else if (paymentRequested === 'wire') {
    score -= 20;
    warningFlags.push({
      type: 'DIRECT_WIRE',
      severity: 'MEDIUM',
      title: 'Virement bancaire direct exigé hors plateforme',
      detail: "Un virement bancaire classique n'offre aucune garantie de réception du colis.",
    });
  } else {
    safeFlags.push({
      title: 'Paiement sécurisé via le système officiel de la plateforme',
      detail: "L'argent reste séquestré jusqu'à validation de la bonne réception.",
    });
  }

  if (accountAgeMonths < 1) {
    score -= 25;
    warningFlags.push({
      type: 'NEW_ACCOUNT',
      severity: 'MEDIUM',
      title: 'Compte créé très récemment (moins de 30 jours)',
      detail: 'Les escrocs créent continuellement de nouveaux comptes jetables.',
    });
  } else if (accountAgeMonths >= 12 && ratingsCount >= 10) {
    safeFlags.push({
      title: `Compte ancien et actif (${accountAgeMonths} mois d'ancienneté)`,
      detail: 'Présence établie dans la durée avec historique de ventes.',
    });
  }

  if (isIdentityVerified) {
    safeFlags.push({
      title: "Pièce d'identité officielle vérifiée par la plateforme",
      detail: "Gage de confiance majeur réduisant drastiquement le risque d'usurpation.",
    });
  } else {
    score -= 5;
  }

  if (isPhoneVerified) {
    safeFlags.push({
      title: 'Numéro de téléphone vérifié par SMS',
      detail: 'Le vendeur a lié un numéro de téléphone vérifié.',
    });
  }

  if (ratingsCount === 0) {
    score -= 15;
    warningFlags.push({
      type: 'ZERO_RATINGS',
      severity: 'LOW',
      title: 'Aucune évaluation acheteur précédente',
      detail: 'Vendeur débutant ou profil non éprouvé.',
    });
  } else if (rating < 3.5) {
    score -= 35;
    redFlags.push({
      type: 'BAD_RATING',
      severity: 'HIGH',
      title: `Note moyenne très défavorable (${rating}/5)`,
      detail: 'De nombreux acheteurs se sont plaints de transactions problématiques.',
    });
  }

  if (priceDiscountPercent >= 60) {
    score -= 30;
    redFlags.push({
      type: 'UNREALISTIC_PRICE',
      severity: 'HIGH',
      title: `Prix anormalement bas (${priceDiscountPercent}% sous la cote du marché)`,
      detail: 'Cache quasi systématiquement une contrefaçon ou un colis fantôme.',
    });
  } else if (priceDiscountPercent >= 35) {
    warningFlags.push({
      type: 'LOW_PRICE',
      severity: 'LOW',
      title: 'Prix très attractif',
      detail: "Vérifiez scrupuleusement la présence de photos réelles et d'une facture d'achat.",
    });
  }

  const finalScore = RiskAssessment.clampScore(score, 5);
  const riskLevel = RiskAssessment.computeLevel(finalScore, redFlags.length, warningFlags.length);
  const recommendations =
    riskLevel === 'DANGER'
      ? [
          '🛑 NE CONCLUEZ PAS CETTE TRANSACTION.',
          "🚨 Le profil accumule des signaux d'escroquerie notoires.",
        ]
      : riskLevel === 'WARNING'
      ? [
          '⚠️ Restez strictement dans la protection de la marketplace.',
          "📸 Demandez au vendeur une vidéo de l'objet fonctionnel ou une photo personnalisée.",
        ]
      : [
          '✅ Le profil semble légitime et dispose d’antécédents rassurants.',
          "📦 Filmez l'ouverture du colis pour avoir une preuve irréfutable en cas de litige.",
        ];

  return new RiskAssessment(finalScore, riskLevel, redFlags, warningFlags, safeFlags, recommendations);
}
