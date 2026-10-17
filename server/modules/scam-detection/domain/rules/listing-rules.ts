import { RiskFlag, SafeSignal } from '../../../../shared/domain/risk-assessment.vo';
import { evaluateTextRisk, normalizeTextForScan } from './text-heuristics';
import type { MarketplaceRouteInfo } from './phishing-rules';

export interface ListingContextInput {
  title?: string;
  description?: string;
  price?: number | null;
  category?: string;
  sellerUsername?: string;
  sellerRatingsCount?: number | null;
  sellerRating?: number | null;
  accountAgeMonths?: number | null;
  photosCount?: number | null;
  hasPlatformDelivery?: boolean | null;
  paymentMethodRequested?: 'platform_secure' | 'paypal_friends' | 'wire' | 'coupons' | 'cash_hand' | 'courier_cash';
  isIdentityVerified?: boolean | null;
}

export interface ScrapedListingData {
  title?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  category?: string | null;
  condition?: string | null;
  brand?: string | null;
  model?: string | null;
  sellerName?: string | null;
  sellerUserId?: string | null;
  sellerType?: 'PARTICULIER' | 'PRO' | null;
  sellerSiren?: string | null;
  sellerRating?: number | null;
  sellerRatingsCount?: number | null;
  accountAgeMonths?: number | null;
  sellerRegisteredAt?: string | null;
  isPhoneVerified?: boolean | null;
  isIdentityVerified?: boolean | null;
  sellerTotalAds?: number | null;
  sellerReplyText?: string | null;
  photosCount?: number | null;
  location?: string | null;
  publishedAt?: string | null;
  hasSecurePaymentOption?: boolean | null;
  antiBotBlocked?: boolean;
}

export interface MarketPriceBenchmark {
  id: string;
  label: string;
  category: string;
  pattern: RegExp;
  minRealisticPrice: number;
  typicalUsedPrice: number;
  highScamRate: boolean;
}

export interface ListingCheckPoint {
  id: string;
  category: 'PRICE' | 'CONTENT' | 'PAYMENT' | 'SELLER' | 'PHOTOS' | 'CATEGORY' | 'SCAMWATCH';
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'INFO';
  detail: string;
}

export interface ListingInspectionSummary {
  isMarketplaceListing: boolean;
  platform: string;
  listingId: string | null;
  detectedTitle: string | null;
  detectedDescription?: string | null;
  detectedCategory: string | null;
  detectedPrice: number | null;
  marketBenchmark: {
    productName: string;
    minRealisticPrice: number;
    typicalUsedPrice: number;
    discountVsTypicalPercent: number;
  } | null;
  sellerUsername: string | null;
  sellerRatingsCount: number | null;
  sellerRating: number | null;
  accountAgeMonths?: number | null;
  photosCount: number | null;
  extractedPhones: string[];
  extractedEmails: string[];
  dataCompleteness: 'FULL' | 'PARTIAL_URL_ONLY' | 'ENRICHED_BY_USER';
  antiBotBlocked: boolean;
  checkPoints: ListingCheckPoint[];
}

export const MARKET_PRICE_BENCHMARKS: MarketPriceBenchmark[] = [
  {
    id: 'iphone-16-pro-max',
    label: 'Apple iPhone 16 Pro Max',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*16\s*pro\s*max\b/i,
    minRealisticPrice: 850,
    typicalUsedPrice: 1080,
    highScamRate: true,
  },
  {
    id: 'iphone-16-pro',
    label: 'Apple iPhone 16 Pro',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*16\s*pro\b(?!\s*max)/i,
    minRealisticPrice: 730,
    typicalUsedPrice: 920,
    highScamRate: true,
  },
  {
    id: 'iphone-16',
    label: 'Apple iPhone 16 / 16 Plus',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*16\b(?!\s*pro)/i,
    minRealisticPrice: 540,
    typicalUsedPrice: 700,
    highScamRate: true,
  },
  {
    id: 'iphone-15-pro-max',
    label: 'Apple iPhone 15 Pro Max',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*15\s*pro\s*max\b/i,
    minRealisticPrice: 640,
    typicalUsedPrice: 830,
    highScamRate: true,
  },
  {
    id: 'iphone-15-pro',
    label: 'Apple iPhone 15 Pro',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*15\s*pro\b(?!\s*max)/i,
    minRealisticPrice: 530,
    typicalUsedPrice: 710,
    highScamRate: true,
  },
  {
    id: 'iphone-15',
    label: 'Apple iPhone 15',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*15\b(?!\s*pro)/i,
    minRealisticPrice: 410,
    typicalUsedPrice: 550,
    highScamRate: true,
  },
  {
    id: 'iphone-14-pro',
    label: 'Apple iPhone 14 Pro / Pro Max',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*14\s*pro(\s*max)?\b/i,
    minRealisticPrice: 400,
    typicalUsedPrice: 560,
    highScamRate: true,
  },
  {
    id: 'iphone-13-pro',
    label: 'Apple iPhone 13 Pro / Pro Max',
    category: 'Smartphones & Téléphonie',
    pattern: /\biphone\s*13\s*pro(\s*max)?\b/i,
    minRealisticPrice: 300,
    typicalUsedPrice: 430,
    highScamRate: true,
  },
  {
    id: 'galaxy-s24-ultra',
    label: 'Samsung Galaxy S24 Ultra',
    category: 'Smartphones & Téléphonie',
    pattern: /\b(galaxy\s*)?s24\s*ultra\b/i,
    minRealisticPrice: 580,
    typicalUsedPrice: 790,
    highScamRate: true,
  },
  {
    id: 'airpods-max',
    label: 'Apple AirPods Max',
    category: 'Audio & Casques (Cible n°1 de clones)',
    pattern: /\bair\s*pods?\s*max\b/i,
    minRealisticPrice: 240,
    typicalUsedPrice: 350,
    highScamRate: true,
  },
  {
    id: 'airpods-pro',
    label: 'Apple AirPods Pro (1/2)',
    category: 'Audio & Écouteurs (Cible n°1 de clones)',
    pattern: /\bair\s*pods?\s*pro\b/i,
    minRealisticPrice: 105,
    typicalUsedPrice: 165,
    highScamRate: true,
  },
  {
    id: 'ps5-pro',
    label: 'Sony PlayStation 5 Pro (PS5 Pro)',
    category: 'Consoles & Jeux Vidéo',
    pattern: /\b(ps5|playstation\s*5)\s*pro\b/i,
    minRealisticPrice: 500,
    typicalUsedPrice: 660,
    highScamRate: true,
  },
  {
    id: 'ps5',
    label: 'Sony PlayStation 5 (PS5)',
    category: 'Consoles & Jeux Vidéo',
    pattern: /\b(ps5|playstation\s*5)\b(?!\s*(pro|manette|jeu|boite))/i,
    minRealisticPrice: 250,
    typicalUsedPrice: 360,
    highScamRate: true,
  },
  {
    id: 'switch-oled',
    label: 'Nintendo Switch OLED',
    category: 'Consoles & Jeux Vidéo',
    pattern: /\bswitch\s*oled\b/i,
    minRealisticPrice: 155,
    typicalUsedPrice: 220,
    highScamRate: true,
  },
  {
    id: 'macbook-pro-m',
    label: 'Apple MacBook Pro (Puce M1/M2/M3/M4)',
    category: 'Informatique & Ordinateurs',
    pattern: /\bmacbook\s*pro\s*(m[1234]|14|16)\b/i,
    minRealisticPrice: 780,
    typicalUsedPrice: 1180,
    highScamRate: true,
  },
  {
    id: 'macbook-air-m2-m3',
    label: 'Apple MacBook Air (M2 / M3)',
    category: 'Informatique & Ordinateurs',
    pattern: /\bmacbook\s*air\s*m[234]\b/i,
    minRealisticPrice: 590,
    typicalUsedPrice: 820,
    highScamRate: true,
  },
  {
    id: 'macbook-air-m1',
    label: 'Apple MacBook Air M1',
    category: 'Informatique & Ordinateurs',
    pattern: /\bmacbook\s*air\s*m1\b/i,
    minRealisticPrice: 400,
    typicalUsedPrice: 550,
    highScamRate: true,
  },
  {
    id: 'rtx-4090',
    label: 'Carte Graphique NVIDIA RTX 4090',
    category: 'Informatique & Composants',
    pattern: /\brtx\s*4090\b/i,
    minRealisticPrice: 1050,
    typicalUsedPrice: 1480,
    highScamRate: true,
  },
  {
    id: 'rtx-4080',
    label: 'Carte Graphique NVIDIA RTX 4080',
    category: 'Informatique & Composants',
    pattern: /\brtx\s*4080\b/i,
    minRealisticPrice: 620,
    typicalUsedPrice: 850,
    highScamRate: true,
  },
  {
    id: 'thermomix-tm6',
    label: 'Vorwerk Thermomix TM6',
    category: 'Électroménager Premium',
    pattern: /\b(thermomix\s*tm\s*6|tm6\s*thermomix|\btm6\b)\b/i,
    minRealisticPrice: 650,
    typicalUsedPrice: 920,
    highScamRate: true,
  },
  {
    id: 'dyson-airwrap',
    label: 'Dyson Airwrap Complete',
    category: 'Beauté & Coiffure Premium',
    pattern: /\bdyson\s*air\s*wrap\b/i,
    minRealisticPrice: 220,
    typicalUsedPrice: 350,
    highScamRate: true,
  },
  {
    id: 'dyson-v15',
    label: 'Aspirateur Dyson V15 Detect',
    category: 'Électroménager Premium',
    pattern: /\bdyson\s*v15\b/i,
    minRealisticPrice: 260,
    typicalUsedPrice: 410,
    highScamRate: true,
  },
  {
    id: 'rolex',
    label: 'Montre Rolex (Submariner / Datejust / GMT)',
    category: 'Horlogerie & Luxe',
    pattern: /\brolex\s*(submariner|datejust|daytona|gmt|oyster)?\b/i,
    minRealisticPrice: 3800,
    typicalUsedPrice: 6800,
    highScamRate: true,
  },
  {
    id: 'louis-vuitton-bag',
    label: 'Sac Louis Vuitton (Neverfull / Speedy / Pochette)',
    category: 'Maroquinerie de Luxe',
    pattern: /\b(sac|cabas|pochette)\s*(louis\s*vuitton|lv\s*neverfull|neverfull|speedy)\b|\blouis\s*vuitton\s*(neverfull|speedy|alma|multi\s*pochette)\b/i,
    minRealisticPrice: 420,
    typicalUsedPrice: 780,
    highScamRate: true,
  },
  {
    id: 'chanel-bag',
    label: 'Sac Chanel (Timeless / Classique / Boy / 2.55)',
    category: 'Maroquinerie de Luxe',
    pattern: /\bsac\s*chanel\b|\bchanel\s*(timeless|boy|2\.55|classique)\b/i,
    minRealisticPrice: 1600,
    typicalUsedPrice: 3400,
    highScamRate: true,
  },
  {
    id: 'moncler-maya',
    label: 'Doudoune Moncler (Maya / Tibb / Veste)',
    category: 'Mode & Streetwear Luxe (Vinted)',
    pattern: /\b(doudoune|veste)?\s*moncler(\s*maya)?\b/i,
    minRealisticPrice: 290,
    typicalUsedPrice: 520,
    highScamRate: true,
  },
  {
    id: 'jordan-4-travis',
    label: 'Nike Air Jordan 4 / Travis Scott',
    category: 'Sneakers & Streetwear (Forte contrefaçon)',
    pattern: /\b(jordan\s*4|travis\s*scott|aj4\s*retro|jordan\s*1\s*travis)\b/i,
    minRealisticPrice: 130,
    typicalUsedPrice: 260,
    highScamRate: true,
  },
];

const HIGH_RISK_CATEGORIES: Array<{ pattern: RegExp; label: string; tip: string }> = [
  {
    pattern: /\b(telephones_objets_connectes|smartphone|iphone|samsung|airpods|tablette|ipad)\b/i,
    label: 'Téléphonie & Objets Connectés (Catégorie à haut risque de clones et faux paiements)',
    tip: "Vérifiez toujours le numéro de série / IMEI sur le site officiel d'Apple/Samsung et méfiez-vous des fausses factures PDF.",
  },
  {
    pattern: /\b(consoles|jeux_video|ps5|playstation|switch|xbox|carte\s*graphique|rtx|macbook|ordinateurs)\b/i,
    label: 'Consoles & Informatique (Forte concentration de fausses annonces)',
    tip: "Exigez une photo ou vidéo de l'appareil allumé avec votre nom écrit sur un papier à côté de l'écran.",
  },
  {
    pattern: /\b(locations_gites|location\s*saisonni[èe]re|locations_vacances|appartement\s*[àa]\s*louer|studio\s*meubl[ée])\b/i,
    label: 'Location Immobilière / Vacances (Risque d’arnaque à l’acompte et vol de dossier)',
    tip: 'Ne versez JAMAIS de caution ou d’acompte avant d’avoir visité le logement et signé le bail. Filigranez vos pièces d’identité (FiligraneFacile).',
  },
  {
    pattern: /\b(voitures|motos|caravaning|utilitaires|scooter|quad|tracteur)\b/i,
    label: 'Véhicules & Motos (Risque de faux transporteur / acompte de réservation)',
    tip: "Ne payez jamais d'acompte pour bloquer un véhicule ni de frais de livraison par transporteur.",
  },
  {
    pattern: /\b(montres_bijoux|maroquinerie|vuitton|chanel|hermes|rolex|moncler|jordan|luxe)\b/i,
    label: 'Mode, Luxe & Sneakers (Risque élevé de contrefaçons 1:1)',
    tip: "Sur Vinted ou Leboncoin, privilégiez l'option 'Vérification de l'article' (authentification physique par des experts) pour les articles de marque.",
  },
  {
    pattern: /\b(billets|concert|festival|spectacle|place\s*de\s*concert|billetterie)\b/i,
    label: 'Billetterie & Concerts (Risque de billets PDF vendus en multiples exemplaires)',
    tip: 'Un e-billet PDF peut être revendu 20 fois. Utilisez uniquement les plateformes officielles de revente (Reelax Tickets, TicketSwap, Passetonbillet).',
  },
  {
    pattern: /\b(animaux|chiot|chaton|bouledogue|spitz|maine\s*coon)\b/i,
    label: 'Animaux de compagnie (Arnaque fréquente au don contre frais de transport)',
    tip: "Les annonces de 'don de chiot/chaton de race contre frais de transporteur' sont 100% frauduleuses.",
  },
];

export function matchMarketBenchmark(textToSearch: string): MarketPriceBenchmark | null {
  const cleaned = normalizeTextForScan(textToSearch);
  for (const b of MARKET_PRICE_BENCHMARKS) {
    if (b.pattern.test(cleaned)) {
      return b;
    }
  }
  return null;
}

export function extractContactEntities(text: string): { phones: string[]; emails: string[] } {
  const normalized = normalizeTextForScan(text);

  const phoneRegex = /\b(?:(?:\+|00)33|0|\bO)\s*[67](?:[\s.\-_]*[0-9]{2}){4}\b/g;
  const rawPhones = normalized.match(phoneRegex) || [];
  const phones = Array.from(
    new Set(
      rawPhones.map((p) =>
        p
          .replace(/^O/i, '0')
          .replace(/[\s.\-_]/g, '')
          .replace(/^(\+33|0033)/, '0')
      )
    )
  );

  const emailRegex = /[a-zA-Z0-9._%+-]+\s*(?:@|\[at\]|arobase)\s*[a-zA-Z0-9.-]+\s*(?:\.|point)\s*[a-zA-Z]{2,}/gi;
  const rawEmails = normalized.match(emailRegex) || [];
  const emails = Array.from(
    new Set(
      rawEmails.map((e) =>
        e
          .replace(/\s*(\[at\]|arobase)\s*/i, '@')
          .replace(/\s*point\s*/i, '.')
          .toLowerCase()
      )
    )
  );

  return { phones, emails };
}

export interface EvaluateListingParams {
  routeInfo: MarketplaceRouteInfo;
  scraped: ScrapedListingData;
  userContext?: ListingContextInput;
}

export interface ListingEvaluationOutput {
  scorePenalty: number;
  redFlags: RiskFlag[];
  warningFlags: RiskFlag[];
  safeFlags: SafeSignal[];
  recommendations: string[];
  summary: ListingInspectionSummary;
}

export function evaluateMarketplaceListing(params: EvaluateListingParams): ListingEvaluationOutput {
  const { routeInfo, scraped, userContext } = params;
  const platformName = (routeInfo.platform || 'marketplace').toUpperCase();

  let penalty = 0;
  const redFlags: RiskFlag[] = [];
  const warningFlags: RiskFlag[] = [];
  const safeFlags: SafeSignal[] = [];
  const checkPoints: ListingCheckPoint[] = [];

  // Merge data sources: userContext > scraped > routeInfo (URL slug)
  const detectedTitle =
    userContext?.title?.trim() ||
    scraped.title?.trim() ||
    routeInfo.slugTitle ||
    null;

  const detectedDescription =
    userContext?.description?.trim() ||
    scraped.description?.trim() ||
    '';

  const detectedCategory =
    userContext?.category?.trim() ||
    scraped.category?.trim() ||
    routeInfo.urlCategory ||
    null;

  const detectedPrice =
    userContext?.price !== undefined && userContext?.price !== null && !Number.isNaN(Number(userContext.price))
      ? Number(userContext.price)
      : scraped.price !== undefined && scraped.price !== null && !Number.isNaN(Number(scraped.price))
      ? Number(scraped.price)
      : null;

  const sellerUsername =
    userContext?.sellerUsername?.trim() ||
    scraped.sellerName?.trim() ||
    routeInfo.usernameFromUrl ||
    null;

  const sellerRatingsCount =
    userContext?.sellerRatingsCount !== undefined && userContext?.sellerRatingsCount !== null
      ? Number(userContext.sellerRatingsCount)
      : scraped.sellerRatingsCount ?? null;

  const sellerRating =
    userContext?.sellerRating !== undefined && userContext?.sellerRating !== null
      ? Number(userContext.sellerRating)
      : scraped.sellerRating ?? null;

  const accountAgeMonths =
    userContext?.accountAgeMonths !== undefined && userContext?.accountAgeMonths !== null
      ? Number(userContext.accountAgeMonths)
      : scraped.accountAgeMonths ?? null;

  const photosCount =
    userContext?.photosCount !== undefined && userContext?.photosCount !== null
      ? Number(userContext.photosCount)
      : scraped.photosCount ?? null;

  const hasUserEnrichment = Boolean(
    userContext &&
      (userContext.title ||
        userContext.description ||
        (userContext.price !== undefined && userContext.price !== null) ||
        userContext.paymentMethodRequested ||
        userContext.sellerRatingsCount !== undefined)
  );

  const hasScrapedDetails = Boolean(
    scraped.description || (scraped.price !== null && scraped.price !== undefined)
  );

  const dataCompleteness: 'FULL' | 'PARTIAL_URL_ONLY' | 'ENRICHED_BY_USER' = hasUserEnrichment
    ? 'ENRICHED_BY_USER'
    : hasScrapedDetails
    ? 'FULL'
    : 'PARTIAL_URL_ONLY';

  const fullTextCorpus = [
    detectedTitle || '',
    scraped.brand || '',
    scraped.model || '',
    detectedDescription || '',
    detectedCategory || '',
  ]
    .filter(Boolean)
    .join(' — ');

  // Check if item is explicitly sold as broken / for parts / box only
  const isBrokenOrPartsOnly =
    /\b(pour\s*pi[èe]ces|hors\s*service|\bhs\b|ne\s*s'?allume\s*plus|[ée]cran\s*cass[ée]|bo[îi]te\s*vide\s*uniquement|vendu\s*en\s*l'?[ée]tat\s*hs)\b/i.test(
      fullTextCorpus
    ) || /\b(pour\s*pi[èe]ces|endommag[ée])\b/i.test(scraped.condition || '');

  // ---------------------------------------------------------------------------
  // CHECK 1: Category & Target Product Risk Analysis
  // ---------------------------------------------------------------------------
  const benchmark = matchMarketBenchmark(fullTextCorpus);
  let matchedHighRiskCat = HIGH_RISK_CATEGORIES.find((c) => c.pattern.test(fullTextCorpus));

  if (benchmark || matchedHighRiskCat) {
    const catLabel = benchmark ? `${benchmark.label} (${benchmark.category})` : matchedHighRiskCat!.label;
    checkPoints.push({
      id: 'category-risk',
      category: 'CATEGORY',
      label: 'Catégorie de produit analysée',
      status: 'WARN',
      detail: `${catLabel} — Catégorie fortement ciblée par les escrocs sur ${platformName}.`,
    });
  } else if (detectedCategory) {
    checkPoints.push({
      id: 'category-risk',
      category: 'CATEGORY',
      label: 'Catégorie de produit analysée',
      status: 'PASS',
      detail: `Catégorie "${detectedCategory}" à exposition modérée.`,
    });
  }

  // ---------------------------------------------------------------------------
  // CHECK 2: Dynamic Market Price & Argus Evaluation
  // ---------------------------------------------------------------------------
  let marketBenchmarkSummary: ListingInspectionSummary['marketBenchmark'] = null;

  if (detectedPrice !== null && detectedPrice >= 0) {
    if (detectedPrice <= 2 && (benchmark || matchedHighRiskCat)) {
      penalty += 22;
      warningFlags.push({
        type: 'BAIT_PRICE_1_EURO',
        severity: 'MEDIUM',
        title: `Prix d'appel artificiel (${detectedPrice} €) sur un produit recherché`,
        detail:
          "Les annonces affichées à 1 € ou 0 € servent souvent à contourner les filtres ou à imposer une négociation opaque par message.",
      });
      checkPoints.push({
        id: 'price-check',
        category: 'PRICE',
        label: 'Cohérence du prix annoncé',
        status: 'WARN',
        detail: `Prix affiché à ${detectedPrice} € (prix d'appel trompeur). Demandez le prix réel par écrit dans la messagerie.`,
      });
    } else if (benchmark && !isBrokenOrPartsOnly) {
      const discountVsTypical = Math.round(
        ((benchmark.typicalUsedPrice - detectedPrice) / benchmark.typicalUsedPrice) * 100
      );
      marketBenchmarkSummary = {
        productName: benchmark.label,
        minRealisticPrice: benchmark.minRealisticPrice,
        typicalUsedPrice: benchmark.typicalUsedPrice,
        discountVsTypicalPercent: discountVsTypical,
      };

      if (detectedPrice < benchmark.minRealisticPrice * 0.65) {
        // Extreme price anomaly (e.g. >55-60% below typical used market, way below minimum realistic floor)
        penalty += 50;
        redFlags.push({
          type: 'EXTREME_PRICE_ANOMALY',
          severity: 'CRITICAL',
          title: `Prix irréaliste (${detectedPrice} €) pour un ${benchmark.label} (-${discountVsTypical}% sous la cote)`,
          detail: `Sur le marché de l'occasion, un ${benchmark.label} fonctionnel se vend en moyenne ${benchmark.typicalUsedPrice} € (plancher réaliste : ~${benchmark.minRealisticPrice} €). À ${detectedPrice} €, il s'agit à 99% d'une arnaque ou d'une contrefaçon.`,
        });
        checkPoints.push({
          id: 'price-check',
          category: 'PRICE',
          label: 'Cohérence du prix vs Cote Occasion',
          status: 'FAIL',
          detail: `${detectedPrice} € annoncé contre ~${benchmark.typicalUsedPrice} € en moyenne (-${discountVsTypical}%). Anomalie critique de prix !`,
        });
      } else if (detectedPrice < benchmark.minRealisticPrice) {
        penalty += 28;
        warningFlags.push({
          type: 'SUSPICIOUS_LOW_PRICE',
          severity: 'MEDIUM',
          title: `Prix anormalement bas (${detectedPrice} €) sous le seuil plancher (~${benchmark.minRealisticPrice} €)`,
          detail: `Ce ${benchmark.label} est affiché ${discountVsTypical}% sous la cote moyenne (${benchmark.typicalUsedPrice} €). Risque élevé de clone (fausse facture) ou de vice caché.`,
        });
        checkPoints.push({
          id: 'price-check',
          category: 'PRICE',
          label: 'Cohérence du prix vs Cote Occasion',
          status: 'WARN',
          detail: `${detectedPrice} € est sous le prix plancher habituel (${benchmark.minRealisticPrice} €) pour un ${benchmark.label}.`,
        });
      } else {
        safeFlags.push({
          title: `Prix cohérent avec la cote de l'occasion (${detectedPrice} €)`,
          detail: `Le tarif demandé pour ce ${benchmark.label} correspond aux prix normaux constatés (cote moyenne : ~${benchmark.typicalUsedPrice} €).`,
        });
        checkPoints.push({
          id: 'price-check',
          category: 'PRICE',
          label: 'Cohérence du prix vs Cote Occasion',
          status: 'PASS',
          detail: `${detectedPrice} € est cohérent avec la cote d'occasion de ${benchmark.label} (~${benchmark.typicalUsedPrice} €).`,
        });
      }
    } else {
      checkPoints.push({
        id: 'price-check',
        category: 'PRICE',
        label: 'Prix de l’annonce relevé',
        status: 'INFO',
        detail: `Prix affiché : ${detectedPrice} €${isBrokenOrPartsOnly ? ' (mention HS / pour pièces détectée)' : ''}.`,
      });
    }
  } else {
    checkPoints.push({
      id: 'price-check',
      category: 'PRICE',
      label: 'Vérification du prix vs Cote du marché',
      status: 'INFO',
      detail: 'Prix non renseigné. Indiquez le prix de l’annonce ci-dessous pour calculer l’écart avec la cote officielle.',
    });
  }

  // ---------------------------------------------------------------------------
  // CHECK 3: Deep NLP Content & Specific Marketplace Scam Patterns
  // ---------------------------------------------------------------------------
  if (fullTextCorpus.trim().length > 0) {
    const textRisk = evaluateTextRisk(fullTextCorpus);

    for (const rf of textRisk.redFlags) {
      penalty += 40;
      redFlags.push(rf);
    }
    for (const wf of textRisk.warningFlags) {
      penalty += 22;
      warningFlags.push(wf);
    }
    for (const sf of textRisk.safeFlags) {
      safeFlags.push(sf);
    }

    // Special Check: Fake Apple/Samsung Sealed + Invoice Clone Scam (AirPods / iPhone / Dyson)
    if (
      /\b(air\s*pods?|iphone|galaxy|dyson)\b/i.test(fullTextCorpus) &&
      /\b(neuf\s*sous\s*blister|scell[ée]|jamais\s*ouvert)\b/i.test(fullTextCorpus) &&
      /\b(facture|garantie)\b/i.test(fullTextCorpus) &&
      (detectedPrice === null || (benchmark && detectedPrice < benchmark.typicalUsedPrice * 0.85))
    ) {
      penalty += 30;
      warningFlags.push({
        type: 'SEALED_CLONE_INVOICE_PATTERN',
        severity: 'MEDIUM',
        title: "Profil type d'arnaque au clone asiatique ('Neuf sous blister avec facture')",
        detail:
          "De très nombreux escrocs sur Vinted et Leboncoin vendent de fausses boîtes scellées (AirPods, iPhone, Dyson) accompagnées de fausses factures Apple/Fnac générées sur internet.",
      });
    }

    if (textRisk.redFlags.length > 0) {
      checkPoints.push({
        id: 'content-nlp',
        category: 'CONTENT',
        label: 'Analyse sémantique du titre et de la description',
        status: 'FAIL',
        detail: `${textRisk.redFlags.length} signal(aux) critique(s) détecté(s) dans le texte de l'annonce (${textRisk.redFlags[0].title}).`,
      });
    } else if (textRisk.warningFlags.length > 0) {
      checkPoints.push({
        id: 'content-nlp',
        category: 'CONTENT',
        label: 'Analyse sémantique du titre et de la description',
        status: 'WARN',
        detail: `${textRisk.warningFlags.length} point(s) de vigilance détecté(s) (${textRisk.warningFlags[0].title}).`,
      });
    } else if (detectedDescription.length >= 20) {
      checkPoints.push({
        id: 'content-nlp',
        category: 'CONTENT',
        label: 'Analyse sémantique du titre et de la description',
        status: 'PASS',
        detail: "Aucun script d'escroquerie, de contournement ou de pression psychologique détecté dans le texte.",
      });
    } else {
      checkPoints.push({
        id: 'content-nlp',
        category: 'CONTENT',
        label: 'Analyse du texte de l’annonce',
        status: 'INFO',
        detail: detectedTitle
          ? `Titre analysé ("${detectedTitle}"). Collez la description complète pour une analyse linguistique approfondie.`
          : 'Description non disponible automatiquement.',
      });
    }
  }

  // ---------------------------------------------------------------------------
  // CHECK 4: Payment & Platform Buyer Protection Evaluation
  // ---------------------------------------------------------------------------
  const paymentMethod = userContext?.paymentMethodRequested;
  if (paymentMethod === 'coupons') {
    penalty += 65;
    redFlags.push({
      type: 'LISTING_PAYMENT_COUPONS',
      severity: 'CRITICAL',
      title: 'Exigence de coupons prépayés (Transcash, PCS, Neosurf)',
      detail: 'Il s’agit d’une escroquerie certaine à 100%.',
    });
    checkPoints.push({
      id: 'payment-protection',
      category: 'PAYMENT',
      label: 'Mode de paiement & Protection Acheteur',
      status: 'FAIL',
      detail: 'Paiement par coupons recharge demandé : ARNAQUE GARANTIE.',
    });
  } else if (paymentMethod === 'courier_cash') {
    penalty += 55;
    redFlags.push({
      type: 'LISTING_FAKE_COURIER',
      severity: 'CRITICAL',
      title: 'Faux transporteur / Livreur avec enveloppe de cash',
      detail: "Scénario classique d'extorsion de frais d'assurance.",
    });
    checkPoints.push({
      id: 'payment-protection',
      category: 'PAYMENT',
      label: 'Mode de paiement & Protection Acheteur',
      status: 'FAIL',
      detail: 'Faux coursier DHL/FedEx/UPS détecté.',
    });
  } else if (paymentMethod === 'paypal_friends') {
    penalty += 40;
    redFlags.push({
      type: 'LISTING_PAYPAL_FRIENDS',
      severity: 'HIGH',
      title: "Paiement hors plateforme via PayPal 'Entre proches' exigé",
      detail: `Le vendeur contourne le système sécurisé ${platformName} et supprime toute garantie acheteur.`,
    });
    checkPoints.push({
      id: 'payment-protection',
      category: 'PAYMENT',
      label: 'Mode de paiement & Protection Acheteur',
      status: 'FAIL',
      detail: "PayPal 'Entre proches' demandé : aucune garantie de remboursement.",
    });
  } else if (paymentMethod === 'wire') {
    penalty += 32;
    warningFlags.push({
      type: 'LISTING_DIRECT_WIRE',
      severity: 'MEDIUM',
      title: 'Virement bancaire direct demandé hors plateforme',
      detail: 'Un virement SEPA ne permet aucun recours si le vendeur ne vous expédie rien.',
    });
    checkPoints.push({
      id: 'payment-protection',
      category: 'PAYMENT',
      label: 'Mode de paiement & Protection Acheteur',
      status: 'WARN',
      detail: 'Virement bancaire direct sans séquestre sécurisé.',
    });
  } else if (paymentMethod === 'platform_secure' || scraped.hasSecurePaymentOption === true) {
    safeFlags.push({
      title: `Paiement sécurisé ${platformName} avec séquestre actif`,
      detail: "L'argent est bloqué jusqu'à la confirmation de bonne réception du colis.",
    });
    checkPoints.push({
      id: 'payment-protection',
      category: 'PAYMENT',
      label: 'Mode de paiement & Protection Acheteur',
      status: 'PASS',
      detail: `Transaction couverte par la Protection Acheteur ${platformName}.`,
    });
  } else if (paymentMethod === 'cash_hand') {
    safeFlags.push({
      title: 'Remise en main propre prévue',
      detail: "Permet d'inspecter et tester l'objet avant de payer (privilégiez un lieu public en journée).",
    });
    checkPoints.push({
      id: 'payment-protection',
      category: 'PAYMENT',
      label: 'Mode de paiement & Remise',
      status: 'PASS',
      detail: 'Remise en main propre : testez soigneusement le produit sur place avant paiement.',
    });
  }

  // ---------------------------------------------------------------------------
  // CHECK 5: Seller Reputation & Account Signals
  // ---------------------------------------------------------------------------
  const ageSuffix =
    accountAgeMonths !== null
      ? accountAgeMonths < 1
        ? ', inscrit ce mois-ci'
        : accountAgeMonths < 12
        ? `, inscrit il y a ${accountAgeMonths} mois`
        : `, membre depuis ${Math.floor(accountAgeMonths / 12)} an(s)`
      : '';

  if (accountAgeMonths !== null && accountAgeMonths <= 1 && (benchmark || matchedHighRiskCat)) {
    penalty += 18;
    warningFlags.push({
      type: 'NEW_SELLER_HIGH_RISK_ITEM',
      severity: 'MEDIUM',
      title: `Compte vendeur très récent (${accountAgeMonths === 0 ? 'créé ce mois-ci' : '1 mois'}) sur une catégorie sensible`,
      detail: `Ce profil ${platformName} a été créé très récemment${
        scraped.sellerRegisteredAt ? ` (${scraped.sellerRegisteredAt})` : ''
      } et propose un article fortement ciblé par la fraude.`,
    });
  } else if (accountAgeMonths !== null && accountAgeMonths >= 24) {
    safeFlags.push({
      title: `Ancienneté du compte vendeur établie (${Math.floor(accountAgeMonths / 12)} ans sur ${platformName})`,
      detail: `Membre inscrit depuis ${scraped.sellerRegisteredAt || `${Math.floor(accountAgeMonths / 12)} ans`}${
        scraped.isPhoneVerified ? ' • Numéro de téléphone vérifié' : ''
      }${scraped.isIdentityVerified ? ' • Pièce d’identité vérifiée' : ''}.`,
    });
  }

  if (sellerRatingsCount !== null) {
    if (sellerRatingsCount === 0) {
      const zeroRatingWeight = benchmark || matchedHighRiskCat ? 22 : 12;
      penalty += zeroRatingWeight;
      warningFlags.push({
        type: 'SELLER_ZERO_REVIEWS',
        severity: 'MEDIUM',
        title: `Vendeur sans aucune évaluation (0 avis sur ${platformName})`,
        detail:
          benchmark || matchedHighRiskCat
            ? `Un profil vierge (0 avis${ageSuffix}) vendant un produit très ciblé (${benchmark?.label || 'catégorie sensible'}) présente un risque élevé de compte jetable.`
            : `Ce vendeur n’a encore aucun historique de vente vérifié (${ageSuffix.replace(/^, /, '') || '0 avis'}).`,
      });
      checkPoints.push({
        id: 'seller-reputation',
        category: 'SELLER',
        label: 'Historique et fiabilité du vendeur',
        status: 'WARN',
        detail: `0 évaluation sur ${platformName}${sellerUsername ? ` (profil : ${sellerUsername}${ageSuffix})` : ''}. Vigilance accrue requise.`,
      });
    } else if (sellerRating !== null && sellerRating < 3.7) {
      penalty += 35;
      redFlags.push({
        type: 'SELLER_BAD_RATING',
        severity: 'HIGH',
        title: `Note vendeur dégradée (${sellerRating}/5 sur ${sellerRatingsCount} avis)`,
        detail: 'Plusieurs acheteurs ont signalé des litiges ou non-conformités avec ce vendeur.',
      });
      checkPoints.push({
        id: 'seller-reputation',
        category: 'SELLER',
        label: 'Historique et fiabilité du vendeur',
        status: 'FAIL',
        detail: `Note inquiétante de ${sellerRating}/5 (${sellerRatingsCount} avis${ageSuffix}).`,
      });
    } else if (sellerRatingsCount >= 5 && (sellerRating === null || sellerRating >= 4.2)) {
      safeFlags.push({
        title: `Profil vendeur évalué positivement (${sellerRatingsCount} avis${sellerRating ? `, note ${sellerRating}/5` : ''})`,
        detail: `Le vendeur dispose d’un historique de transactions réussies sur ${platformName}${ageSuffix}.`,
      });
      checkPoints.push({
        id: 'seller-reputation',
        category: 'SELLER',
        label: 'Historique et fiabilité du vendeur',
        status: 'PASS',
        detail: `${sellerRatingsCount} évaluations positives${sellerRating ? ` (${sellerRating}/5)` : ''}${ageSuffix}.`,
      });
    } else {
      checkPoints.push({
        id: 'seller-reputation',
        category: 'SELLER',
        label: 'Historique et fiabilité du vendeur',
        status: 'INFO',
        detail: `${sellerRatingsCount} avis${sellerRating ? ` (${sellerRating}/5)` : ''}${
          sellerUsername ? ` — Vendeur : ${sellerUsername}` : ''
        }${ageSuffix}.`,
      });
    }
  } else {
    checkPoints.push({
      id: 'seller-reputation',
      category: 'SELLER',
      label: 'Historique et fiabilité du vendeur',
      status: 'INFO',
      detail: sellerUsername
        ? `Vendeur identifié : "${sellerUsername}"${
            scraped.sellerType === 'PRO'
              ? ` (Compte PRO${scraped.sellerSiren ? ` • SIREN ${scraped.sellerSiren}` : ''})`
              : ''
          }${ageSuffix}.`
        : 'Profil vendeur non extrait automatiquement.',
    });
  }

  // ---------------------------------------------------------------------------
  // CHECK 6: Visual Evidence & Photos Check
  // ---------------------------------------------------------------------------
  if (photosCount !== null) {
    if (photosCount <= 1 && (detectedPrice === null || detectedPrice >= 80 || benchmark)) {
      penalty += 15;
      warningFlags.push({
        type: 'SINGLE_OR_NO_PHOTO',
        severity: 'LOW',
        title: `Nombre de photos insuffisant (${photosCount} photo) pour vérifier l'état réel`,
        detail:
          "Les annonces frauduleuses utilisent souvent une seule photo récupérée sur Google ou le catalogue officiel. Demandez 3 photos sous différents angles.",
      });
      checkPoints.push({
        id: 'photos-check',
        category: 'PHOTOS',
        label: 'Preuves visuelles & Photos de l’annonce',
        status: 'WARN',
        detail: `Seulement ${photosCount} photo(s) présente(s). Demandez des photos supplémentaires avec un mot manuscrit.`,
      });
    } else if (photosCount >= 3) {
      safeFlags.push({
        title: `Plusieurs photos fournies dans l'annonce (${photosCount} photos)`,
        detail: "Permet de mieux contrôler l'état cosmétique et les détails de l'article.",
      });
      checkPoints.push({
        id: 'photos-check',
        category: 'PHOTOS',
        label: 'Preuves visuelles & Photos de l’annonce',
        status: 'PASS',
        detail: `${photosCount} photos disponibles sur l'annonce.`,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // CHECK 7: Compound Risk Synergy (High-risk item + Low price + Unproven seller)
  // ---------------------------------------------------------------------------
  const hasPriceFlag =
    redFlags.some((f) => f.type === 'EXTREME_PRICE_ANOMALY') ||
    warningFlags.some((f) => f.type === 'SUSPICIOUS_LOW_PRICE');
  const hasZeroReviews = sellerRatingsCount === 0;

  if (hasPriceFlag && hasZeroReviews) {
    penalty += 20;
    redFlags.push({
      type: 'COMPOUND_SCAM_SIGNATURE',
      severity: 'CRITICAL',
      title: 'Combinaison critique : Prix cassé + Vendeur à 0 évaluation',
      detail:
        'La corrélation entre un tarif anormalement bas et un compte sans historique (0 avis) correspond à plus de 94% des escroqueries constatées sur Leboncoin et Vinted.',
    });
  }

  // ---------------------------------------------------------------------------
  // CHECK 8: Anti-Bot / Partial Data Transparency (Never give a blind 100/100!)
  // ---------------------------------------------------------------------------
  if (dataCompleteness === 'PARTIAL_URL_ONLY') {
    // Ensure a bare URL scan where Leboncoin/Vinted blocked server scraping does NOT pretend the ad is 100% safe
    penalty = Math.max(penalty, 26);
    warningFlags.push({
      type: 'LISTING_CONTENT_REQUIRES_VERIFICATION',
      severity: 'MEDIUM',
      title: `Domaine ${platformName} officiel, mais le contenu de l'annonce nécessite une vérification approfondie`,
      detail: scraped.antiBotBlocked
        ? `La protection anti-robot de ${platformName} empêche la lecture automatique du prix et de la description complète. Un lien officiel ${platformName} peut héberger un vendeur malveillant : complétez le prix et le texte ci-dessous pour certifier l'annonce.`
        : `Le lien pointe bien vers la plateforme officielle ${platformName}, mais la fiabilité dépend du prix, de la description et du profil vendeur. Renseignez ces éléments dans l'inspecteur d'annonce ci-dessous.`,
    });
  }

  const { phones, emails } = extractContactEntities(fullTextCorpus);

  const recommendations: string[] = [];
  if (matchedHighRiskCat) {
    recommendations.push(`🎯 Conseil catégorie : ${matchedHighRiskCat.tip}`);
  }
  recommendations.push(
    `🔒 Payez uniquement via le bouton officiel "${
      routeInfo.platform === 'vinted' ? 'Acheter' : 'Acheter avec le paiement sécurisé'
    }" intégré à ${platformName}.`
  );
  recommendations.push(
    "📸 Demandez au vendeur une photo de l'article avec un bout de papier indiquant votre prénom et la date du jour."
  );
  recommendations.push(
    "🚫 Ne cliquez sur aucun lien SMS/email ni QR Code prétendant débloquer un paiement ou organiser une livraison."
  );

  return {
    scorePenalty: penalty,
    redFlags,
    warningFlags,
    safeFlags,
    recommendations,
    summary: {
      isMarketplaceListing: true,
      platform: routeInfo.platform || 'marketplace',
      listingId: routeInfo.listingId,
      detectedTitle,
      detectedDescription: detectedDescription || null,
      detectedCategory,
      detectedPrice,
      marketBenchmark: marketBenchmarkSummary,
      sellerUsername,
      sellerRatingsCount,
      sellerRating,
      accountAgeMonths,
      photosCount,
      extractedPhones: phones,
      extractedEmails: emails,
      dataCompleteness,
      antiBotBlocked: Boolean(scraped.antiBotBlocked),
      checkPoints,
    },
  };
}
