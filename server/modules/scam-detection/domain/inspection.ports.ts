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

export const RDAP_GATEWAY = 'RDAP_GATEWAY';
export const WEB_SCRAPER_GATEWAY = 'WEB_SCRAPER_GATEWAY';

export interface IRdapGateway {
  lookupDomain(domain: string): Promise<RdapDomainInfo | null>;
}

export interface IWebScraperGateway {
  inspectUrl(url: string): Promise<PageInspectionResult>;
}
