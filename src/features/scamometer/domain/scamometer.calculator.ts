import type { RiskLevel } from '../../../core/domain/models';

export interface ScamOMeterState {
  platform: string;
  profileAge: string;
  ratingsCount: string;
  hasVerifiedId: boolean;
  paymentMethod: string;
  deliveryMethod: string;
  priceLevel: string;
  communicationChannel: string;
}

export interface ScamOMeterDiagnosis {
  score: number;
  level: RiskLevel;
  redFlags: string[];
  warnings: string[];
  safePoints: string[];
}

export const INITIAL_SCAMOMETER_STATE: ScamOMeterState = {
  platform: 'leboncoin',
  profileAge: 'new',
  ratingsCount: 'zero',
  hasVerifiedId: false,
  paymentMethod: 'secure_platform',
  deliveryMethod: 'official_tracked',
  priceLevel: 'normal',
  communicationChannel: 'in_platform',
};

export function evaluateTransactionRisk(state: ScamOMeterState): ScamOMeterDiagnosis {
  let score = 100;
  const redFlags: string[] = [];
  const warnings: string[] = [];
  const safePoints: string[] = [];

  if (state.paymentMethod === 'coupons') {
    score -= 65;
    redFlags.push('Exigence de coupons recharge (PCS/Transcash/Neosurf) : ARNAQUE À 100%.');
  } else if (state.paymentMethod === 'courier_cash') {
    score -= 50;
    redFlags.push('Arnaque au faux livreur avec enveloppe de liquide et frais de déblocage.');
  } else if (state.paymentMethod === 'paypal_friends') {
    score -= 35;
    redFlags.push("Demande de paiement PayPal 'Entre proches' : AUCUNE protection en cas de litige.");
  } else if (state.paymentMethod === 'wire') {
    score -= 25;
    warnings.push("Virement bancaire préalable direct : aucun recours si le colis n'est jamais envoyé.");
  } else if (state.paymentMethod === 'hand_cash') {
    safePoints.push("Paiement en espèces lors d'une remise en main propre (sûr si vérification sur place).");
  } else {
    safePoints.push('Paiement via le tiers de confiance sécurisé de la marketplace.');
  }

  if (state.communicationChannel === 'outside') {
    score -= 25;
    warnings.push('Tentative d’incitation à quitter la messagerie officielle (vers WhatsApp ou email direct).');
  } else {
    safePoints.push('Échanges réalisés strictement au sein de la messagerie officielle.');
  }

  if (state.deliveryMethod === 'fake_courier') {
    score -= 40;
    redFlags.push('Arnaque au faux coursier DHL/FedEx inventé.');
  } else if (state.deliveryMethod === 'hand_delivery') {
    safePoints.push('Remise en main propre : permet de tester l’objet avant tout paiement.');
  } else {
    safePoints.push('Envoi suivi avec numéro de traçabilité certifié.');
  }

  if (state.priceLevel === 'too_cheap') {
    score -= 30;
    redFlags.push('Prix anormalement bas (-60% à -80%) : piège classique pour attirer les victimes.');
  } else if (state.priceLevel === 'attractive') {
    score -= 10;
    warnings.push("Prix attractif : exigez des preuves tangibles d'authenticité.");
  }

  if (state.profileAge === 'new') {
    score -= 15;
    warnings.push('Compte très récent (moins de 30 jours).');
  } else if (state.profileAge === 'veteran') {
    safePoints.push("Vendeur ancien établi sur la plateforme depuis plus d'un an.");
  }

  if (state.ratingsCount === 'zero') {
    score -= 15;
    warnings.push('Aucune évaluation ni vente précédente.');
  } else if (state.ratingsCount === 'many') {
    safePoints.push('Nombreuses évaluations acheteurs positives.');
  }

  if (state.hasVerifiedId) {
    safePoints.push("Pièce d'identité officiellement vérifiée par la plateforme.");
  }

  const finalScore = Math.max(0, Math.min(100, score));
  let level: RiskLevel = 'SAFE';
  if (finalScore <= 35 || redFlags.length >= 2) level = 'DANGER';
  else if (finalScore <= 70 || redFlags.length === 1 || warnings.length >= 2) level = 'WARNING';

  return { score: finalScore, level, redFlags, warnings, safePoints };
}
