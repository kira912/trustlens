export type RiskLevel = 'SAFE' | 'WARNING' | 'DANGER' | 'UNKNOWN';

export interface RedFlag {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  detail?: string;
  snippet?: string;
}

export interface WarningFlag {
  type: string;
  severity: 'MEDIUM' | 'LOW';
  title: string;
  detail?: string;
  snippet?: string;
}

export interface SafeFlag {
  title: string;
  detail: string;
}

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
  paymentMethodRequested?:
    | 'platform_secure'
    | 'paypal_friends'
    | 'wire'
    | 'coupons'
    | 'cash_hand'
    | 'courier_cash';
  isIdentityVerified?: boolean | null;
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

export interface UrlAnalysisResponse {
  url: string;
  hostname: string;
  score: number;
  riskLevel: RiskLevel;
  rdap: {
    domain: string;
    registrationDate: string | null;
    expirationDate: string | null;
    ageDays: string | number | null;
    registrar: string;
  } | null;
  inspection: {
    reachable: boolean;
    statusCode?: number;
    finalUrl?: string;
    isHttps?: boolean;
    title?: string;
    hasLegalNotice?: boolean;
    hasSirenOrSiret?: boolean;
    extractedSiren?: string | null;
    hasContactEmail?: boolean;
    hasPhone?: boolean;
    isShopify?: boolean;
    hasUrgencyBanner?: boolean;
    antiBotBlocked?: boolean;
    error?: string;
  };
  listingAnalysis?: ListingInspectionSummary | null;
  matchingReportsCount: number;
  redFlags: RedFlag[];
  warningFlags: WarningFlag[];
  safeFlags: SafeFlag[];
  recommendations: string[];
}

export interface TextAnalysisResponse {
  score: number;
  riskLevel: RiskLevel;
  redFlags: RedFlag[];
  warningFlags: WarningFlag[];
  safeFlags: SafeFlag[];
  recommendations: string[];
}

export interface CompanyResult {
  siren: string;
  siretSiege?: string;
  nomComplet: string;
  activitePrincipale?: string;
  dateCreation?: string;
  ageAnnees: number;
  etatAdministratif: string;
  isCessée: boolean;
  adresse: string;
  dirigeants: string[];
  trustScore: number;
  redFlags: string[];
  positivePoints: string[];
}

export interface SirenSearchResponse {
  query: string;
  count: number;
  companies: CompanyResult[];
}

export interface ScamReport {
  id: string;
  targetType: 'phone' | 'iban' | 'email' | 'username' | 'url';
  targetValue: string;
  platform: string;
  sellerAlias?: string;
  scamType: string;
  description: string;
  reportedAt: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  upvotes: number;
}

export interface CreateReportPayload {
  targetType: 'phone' | 'iban' | 'email' | 'username' | 'url';
  targetValue: string;
  platform: string;
  sellerAlias: string;
  scamType: string;
  description: string;
}

export interface SystemStats {
  totalReports: number;
  totalScans: number;
  threatsNeutralized: number;
}

export interface ScanRecord {
  id: string;
  scanType: string;
  query: string;
  score: number;
  riskLevel: RiskLevel;
  summary: string;
  createdAt: string;
}
