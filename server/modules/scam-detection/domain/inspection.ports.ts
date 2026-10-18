import type { ScrapedListingData } from './rules/listing-rules';

export interface RdapDomainInfo {
  domain: string;
  registrationDate: string | null;
  expirationDate: string | null;
  ageDays: number | null;
  registrar: string;
}

export interface PageInspectionResult {
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
  listingData?: ScrapedListingData;
  error?: string;
}

export interface PhishingThreatResult {
  isListed: boolean;
  source: string;
  targetUrl: string;
  verified: boolean;
  details?: string;
}

export interface EmailReputationResult {
  email: string;
  reputation: 'HIGH' | 'MEDIUM' | 'LOW' | 'SUSPICIOUS' | 'UNKNOWN';
  suspicious: boolean;
  disposable: boolean;
  spam: boolean;
  freeProvider: boolean;
  deliverable: boolean;
  domainAgeDays?: number | null;
  dataBreachesCount?: number;
  details: string[];
}

export interface PhoneReputationResult {
  phone: string;
  e164Format: string;
  countryCode: string;
  lineType: 'MOBILE' | 'LANDLINE' | 'VOIP' | 'PROSPECTING_PRO' | 'SPECIAL_RATE' | 'UNKNOWN';
  carrier?: string;
  isArcepProspecting: boolean;
  isSurcharged: boolean;
  isDisposableOrVoip: boolean;
  details: string[];
}

export interface CryptoScamResult {
  address: string;
  chain: 'BTC' | 'ETH' | 'SOL' | 'UNKNOWN';
  isValidFormat: boolean;
  isFlaggedScam: boolean;
  scamCategory?: string;
  reportsCount: number;
  source?: string;
  details: string[];
}

export const RDAP_GATEWAY = 'RDAP_GATEWAY';
export const WEB_SCRAPER_GATEWAY = 'WEB_SCRAPER_GATEWAY';
export const PHISHING_THREAT_GATEWAY = 'PHISHING_THREAT_GATEWAY';
export const EMAIL_REPUTATION_GATEWAY = 'EMAIL_REPUTATION_GATEWAY';
export const PHONE_REPUTATION_GATEWAY = 'PHONE_REPUTATION_GATEWAY';
export const CRYPTO_SCAM_GATEWAY = 'CRYPTO_SCAM_GATEWAY';

export interface IRdapGateway {
  lookupDomain(domain: string): Promise<RdapDomainInfo | null>;
}

export interface IWebScraperGateway {
  inspectUrl(url: string): Promise<PageInspectionResult>;
}

export interface IPhishingThreatGateway {
  checkPhishingThreat(url: string, hostname: string): Promise<PhishingThreatResult | null>;
}

export interface IEmailReputationGateway {
  checkEmailReputation(email: string): Promise<EmailReputationResult>;
}

export interface IPhoneReputationGateway {
  checkPhoneReputation(phone: string): Promise<PhoneReputationResult>;
}

export interface ICryptoScamGateway {
  checkCryptoAddress(address: string): Promise<CryptoScamResult>;
}

