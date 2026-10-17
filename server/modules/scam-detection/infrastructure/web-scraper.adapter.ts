import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { IWebScraperGateway, PageInspectionResult } from '../domain/inspection.ports';
import type { ScrapedListingData } from '../domain/rules/listing-rules';

interface BrowserFingerprintProfile {
  id: string;
  userAgent: string;
  accept: string;
  acceptLanguage: string;
  secChUa?: string;
  secChUaMobile?: string;
  secChUaPlatform?: string;
}

const BROWSER_PROFILES: BrowserFingerprintProfile[] = [
  {
    id: 'chrome-131-linux',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    acceptLanguage: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaMobile: '?0',
    secChUaPlatform: '"Linux"',
  },
  {
    id: 'chrome-131-win',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    acceptLanguage: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaMobile: '?0',
    secChUaPlatform: '"Windows"',
  },
  {
    id: 'chrome-131-mac',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    acceptLanguage: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    secChUaMobile: '?0',
    secChUaPlatform: '"macOS"',
  },
  {
    id: 'firefox-133-win',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    acceptLanguage: 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
  },
];

interface DomainSessionState {
  cookies: Map<string, string>;
  profileIndex: number;
  updatedAt: number;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&euro;/gi, '€')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function extractMetaContent(html: string, attrValue: string): string | null {
  const escaped = attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex1 = new RegExp(
    `<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const match1 = html.match(regex1);
  if (match1?.[1]) return decodeHtmlEntities(match1[1].trim());

  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escaped}["']`,
    'i'
  );
  const match2 = html.match(regex2);
  if (match2?.[1]) return decodeHtmlEntities(match2[1].trim());

  return null;
}

function parseNumericPrice(raw: unknown): number | null {
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .replace(/\s+/g, '')
    .replace(/€/g, '')
    .replace(/EUR/gi, '')
    .replace(',', '.');
  const match = cleaned.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
  if (!match) return null;
  const val = parseFloat(match[1]);
  return Number.isNaN(val) ? null : val;
}

function calculateMonthsSince(isoDateStr: string | undefined | null): number | null {
  if (!isoDateStr || typeof isoDateStr !== 'string') return null;
  const parsed = new Date(isoDateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.4375));
}

function extractListingFromJsonLd(html: string): Partial<ScrapedListingData> {
  const result: Partial<ScrapedListingData> = {};
  const scriptRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] && Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed];

      for (const node of items) {
        if (!node || typeof node !== 'object') continue;
        const type = String(node['@type'] || '').toLowerCase();

        if (
          type.includes('product') ||
          type.includes('offer') ||
          type.includes('vehicle') ||
          type.includes('residence') ||
          node.offers
        ) {
          if (node.name && !result.title) {
            result.title = decodeHtmlEntities(String(node.name));
          }
          if (node.description && !result.description) {
            result.description = decodeHtmlEntities(String(node.description));
          }
          if (node.category && !result.category) {
            result.category = String(node.category);
          }
          if (node.brand) {
            const bName = typeof node.brand === 'object' ? node.brand.name : String(node.brand);
            if (bName && !/^leboncoin$/i.test(bName)) {
              result.brand = bName;
            }
          }
          if (node.image) {
            const imgs = Array.isArray(node.image) ? node.image : [node.image];
            if (result.photosCount === undefined) {
              result.photosCount = imgs.length;
            }
          }

          const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers || node;
          if (offer && typeof offer === 'object') {
            const p = parseNumericPrice(offer.price ?? offer.lowPrice);
            if (p !== null && result.price === undefined) {
              result.price = p;
              result.currency = offer.priceCurrency || 'EUR';
            }
            if (offer.seller && typeof offer.seller === 'object') {
              result.sellerName = offer.seller.name || result.sellerName;
            }
          }

          if (node.aggregateRating && typeof node.aggregateRating === 'object') {
            const rv = parseFloat(node.aggregateRating.ratingValue);
            const rc = parseInt(node.aggregateRating.reviewCount || node.aggregateRating.ratingCount, 10);
            if (!Number.isNaN(rv)) result.sellerRating = rv;
            if (!Number.isNaN(rc)) result.sellerRatingsCount = rc;
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD blocks
    }
  }

  return result;
}

export function extractLeboncoinProfileInfoFromHtml(html: string): Partial<ScrapedListingData> {
  const result: Partial<ScrapedListingData> = {};
  const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch?.[1]) return result;

  try {
    const nextData = JSON.parse(nextDataMatch[1]);
    const profileInfo = nextData?.props?.pageProps?.profileInfo;
    if (!profileInfo || typeof profileInfo !== 'object') return result;

    if (profileInfo.name) {
      result.sellerName = String(profileInfo.name);
    }
    if (profileInfo.user_id) {
      result.sellerUserId = String(profileInfo.user_id);
    }
    if (profileInfo.account_type) {
      result.sellerType = profileInfo.account_type === 'pro' ? 'PRO' : 'PARTICULIER';
    }
    if (profileInfo.registered_at) {
      result.sellerRegisteredAt = String(profileInfo.registered_at);
      result.accountAgeMonths = calculateMonthsSince(profileInfo.registered_at);
    }
    if (typeof profileInfo.total_ads === 'number') {
      result.sellerTotalAds = profileInfo.total_ads;
    }
    if (profileInfo.reply?.text) {
      result.sellerReplyText = String(profileInfo.reply.text);
    }

    if (Array.isArray(profileInfo.badges)) {
      const badgeNames = profileInfo.badges.map((b: any) => String(b?.name || '').toLowerCase());
      result.isPhoneVerified = badgeNames.some((n: string) => n.includes('phone'));
      result.isIdentityVerified = badgeNames.some(
        (n: string) => n.includes('identity') || n.includes('kyc') || n.includes('idverified')
      );
    }

    if (profileInfo.feedback && typeof profileInfo.feedback === 'object') {
      if (typeof profileInfo.feedback.received_count === 'number') {
        result.sellerRatingsCount = profileInfo.feedback.received_count;
      }
      if (typeof profileInfo.feedback.overall_score === 'number') {
        // Leboncoin stores overall_score on a 0..1 scale (e.g. 0.98 -> 4.9 / 5)
        const normalizedRating =
          profileInfo.feedback.overall_score <= 1
            ? Math.round(profileInfo.feedback.overall_score * 5 * 10) / 10
            : Math.round(profileInfo.feedback.overall_score * 10) / 10;
        result.sellerRating = normalizedRating;
      }
    } else {
      // A valid Leboncoin profileInfo without a `feedback` field has 0 evaluations
      result.sellerRatingsCount = 0;
      result.sellerRating = null;
    }
  } catch {
    // Ignore parse errors
  }

  return result;
}

function extractListingFromNextData(html: string): Partial<ScrapedListingData> {
  const result: Partial<ScrapedListingData> = {};
  const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!nextDataMatch?.[1]) return result;

  try {
    const nextData = JSON.parse(nextDataMatch[1]);
    const pageProps = nextData?.props?.pageProps;
    if (!pageProps) return result;

    // 1. Leboncoin SSR ad structure
    const ad = pageProps.ad || pageProps.initialProps?.ad || pageProps.adData;
    if (ad && typeof ad === 'object') {
      if (ad.subject) result.title = String(ad.subject);
      if (ad.body) result.description = String(ad.body);
      if (Array.isArray(ad.price) && ad.price.length > 0) {
        result.price = Number(ad.price[0]);
      } else if (typeof ad.price === 'number') {
        result.price = ad.price;
      } else if (typeof ad.price_cents === 'number') {
        result.price = Math.round(ad.price_cents / 100);
      }
      if (ad.category_name) result.category = String(ad.category_name);
      if (ad.brand && !/^leboncoin$/i.test(String(ad.brand))) {
        result.brand = String(ad.brand);
      }

      if (ad.images?.nb_images !== undefined) {
        result.photosCount = Number(ad.images.nb_images);
      } else if (Array.isArray(ad.images?.urls)) {
        result.photosCount = ad.images.urls.length;
      }

      if (ad.owner && typeof ad.owner === 'object') {
        result.sellerName = ad.owner.name || null;
        result.sellerUserId = ad.owner.user_id || null;
        result.sellerType = ad.owner.type === 'pro' ? 'PRO' : 'PARTICULIER';
        if (ad.owner.siren) {
          result.sellerSiren = String(ad.owner.siren);
        }
      }

      if (ad.location?.city_label || ad.location?.city) {
        result.location = ad.location.city_label || ad.location.city;
      }
      if (ad.index_date || ad.first_publication_date) {
        result.publishedAt = ad.index_date || ad.first_publication_date;
      }

      // Extract rich attributes from Leboncoin ad.attributes
      if (Array.isArray(ad.attributes)) {
        const attrMap = new Map<string, { value: string; label: string }>();
        for (const attr of ad.attributes) {
          if (attr && typeof attr.key === 'string') {
            attrMap.set(attr.key, {
              value: String(attr.value ?? ''),
              label: String(attr.value_label ?? attr.value ?? ''),
            });
          }
        }

        const conditionAttr = attrMap.get('condition');
        if (conditionAttr?.label) {
          result.condition = conditionAttr.label;
        }

        const brandAttr =
          attrMap.get('brand') || attrMap.get('phone_brand') || attrMap.get('u_car_brand');
        if (brandAttr?.label && !result.brand) {
          result.brand = brandAttr.label;
        }

        const modelAttr =
          attrMap.get('phone_model') || attrMap.get('model') || attrMap.get('u_car_model');
        if (modelAttr?.label) {
          result.model = modelAttr.label;
        }

        const purchaseCta = attrMap.get('purchase_cta_visible');
        const shippable = attrMap.get('shippable');
        if (purchaseCta?.value === 'true' || shippable?.value === 'true') {
          result.hasSecurePaymentOption = true;
        }
      }
    }

    // 2. Leboncoin SSR Seller Profile page structure (/profile/<userId>/offers)
    if (pageProps.profileInfo && typeof pageProps.profileInfo === 'object') {
      const profData = extractLeboncoinProfileInfoFromHtml(html);
      Object.assign(result, profData);
      if (!result.title && profData.sellerName) {
        result.title = `Profil Leboncoin : ${profData.sellerName}`;
      }
    }

    // 3. Vinted SSR item structure
    const item = pageProps.item || pageProps.itemDto;
    if (item && typeof item === 'object') {
      if (item.title) result.title = String(item.title);
      if (item.description) result.description = String(item.description);
      const itemPrice = parseNumericPrice(item.price?.amount ?? item.price ?? item.total_item_price);
      if (itemPrice !== null) result.price = itemPrice;
      if (item.brand_title) result.brand = String(item.brand_title);
      if (item.status) result.condition = String(item.status);
      if (Array.isArray(item.photos)) result.photosCount = item.photos.length;
      if (item.user) {
        result.sellerName = item.user.login || null;
        if (typeof item.user.feedback_reputation === 'number') {
          result.sellerRating = Math.round(item.user.feedback_reputation * 5 * 10) / 10;
        }
        if (typeof item.user.feedback_count === 'number') {
          result.sellerRatingsCount = item.user.feedback_count;
        }
      }
    }
  } catch {
    // Ignore parse errors
  }

  return result;
}

/**
 * Determines whether the HTML response is an actual anti-bot / Captcha block page
 * vs. a legitimate SSR page that merely includes the DataDome/Cloudflare client telemetry script.
 */
export function isGenuineAntiBotChallenge(
  html: string,
  statusCode: number,
  hasExtractedListingData: boolean
): boolean {
  // If we already extracted real listing content (title + price/description/seller), it is NOT blocked!
  if (hasExtractedListingData && statusCode >= 200 && statusCode < 400) {
    return false;
  }

  if (statusCode === 403 || statusCode === 429 || statusCode === 503) {
    return !hasExtractedListingData;
  }

  // Genuine challenge pages are typically small interstitial documents containing a captcha iframe or challenge script,
  // NOT full 500KB+ Next.js pages with <script id="datadome" data-nscript="beforeInteractive">.
  const hasExplicitChallengeIframeOrObject =
    /(?:geo|ct)\.captcha-delivery\.com\/(?:captcha|interstitial)|dd=\s*\{\s*['"]rt['"]\s*:\s*['"][ci]['"]|cf-browser-verification|Attention Required! \| Cloudflare|Just a moment\.\.\.|Veuillez activer JS et d[ée]sactiver votre bloqueur/i.test(
      html
    );

  if (hasExplicitChallengeIframeOrObject && !hasExtractedListingData) {
    return true;
  }

  return false;
}

export function parseListingDataFromHtml(html: string, statusCode: number): ScrapedListingData {
  const jsonLd = extractListingFromJsonLd(html);
  const nextData = extractListingFromNextData(html);

  const ogTitle = extractMetaContent(html, 'og:title') || extractMetaContent(html, 'twitter:title');
  const ogDesc = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description');
  const metaPrice =
    parseNumericPrice(extractMetaContent(html, 'product:price:amount')) ??
    parseNumericPrice(extractMetaContent(html, 'og:price:amount')) ??
    parseNumericPrice(extractMetaContent(html, 'twitter:data1'));

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawHtmlTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null;

  const hasExtractedListingData = Boolean(
    nextData.title ||
      nextData.description ||
      nextData.price !== undefined ||
      nextData.sellerName ||
      jsonLd.title ||
      jsonLd.price !== undefined
  );

  const isAntiBotHtml = isGenuineAntiBotChallenge(html, statusCode, hasExtractedListingData);

  // Clean platform suffix from title ("iPhone 15 Pro - Téléphones - leboncoin" -> "iPhone 15 Pro")
  const rawTitle = nextData.title || jsonLd.title || ogTitle || rawHtmlTitle;
  const cleanedTitle =
    rawTitle && !/^(?:leboncoin\.fr|vinted\.fr|just a moment|attention required)/i.test(rawTitle.trim())
      ? rawTitle.replace(/\s*[-|•]\s*(leboncoin|vinted|ebay).*$/i, '').trim()
      : null;

  // Fallback regex for price in title or meta description (e.g. "iPhone 15 Pro - 650 €")
  let fallbackPrice: number | null = null;
  if (rawTitle || ogDesc) {
    const priceInMeta = `${rawTitle || ''} ${ogDesc || ''}`.match(
      /\b([1-9][0-9]{0,4}(?:[.,][0-9]{1,2})?)\s*€/
    );
    if (priceInMeta) {
      fallbackPrice = parseNumericPrice(priceInMeta[1]);
    }
  }

  return {
    title: isAntiBotHtml ? null : cleanedTitle,
    description: isAntiBotHtml ? null : nextData.description || jsonLd.description || ogDesc || null,
    price: isAntiBotHtml ? null : nextData.price ?? jsonLd.price ?? metaPrice ?? fallbackPrice,
    currency: jsonLd.currency || 'EUR',
    category: nextData.category || jsonLd.category || null,
    condition: nextData.condition || null,
    brand: nextData.brand || jsonLd.brand || extractMetaContent(html, 'product:brand') || null,
    model: nextData.model || null,
    sellerName: nextData.sellerName || jsonLd.sellerName || null,
    sellerUserId: nextData.sellerUserId || null,
    sellerType: nextData.sellerType || null,
    sellerSiren: nextData.sellerSiren || null,
    sellerRating: nextData.sellerRating ?? jsonLd.sellerRating ?? null,
    sellerRatingsCount: nextData.sellerRatingsCount ?? jsonLd.sellerRatingsCount ?? null,
    accountAgeMonths: nextData.accountAgeMonths ?? null,
    sellerRegisteredAt: nextData.sellerRegisteredAt ?? null,
    isPhoneVerified: nextData.isPhoneVerified ?? null,
    isIdentityVerified: nextData.isIdentityVerified ?? null,
    sellerTotalAds: nextData.sellerTotalAds ?? null,
    sellerReplyText: nextData.sellerReplyText ?? null,
    photosCount: nextData.photosCount ?? jsonLd.photosCount ?? null,
    location: nextData.location || null,
    publishedAt: nextData.publishedAt || null,
    hasSecurePaymentOption: nextData.hasSecurePaymentOption ?? null,
    antiBotBlocked: isAntiBotHtml,
  };
}

@Injectable()
export class WebScraperAdapter implements IWebScraperGateway {
  private readonly domainSessions = new Map<string, DomainSessionState>();
  private readonly inspectionCache = new Map<string, { expiresAt: number; result: PageInspectionResult }>();
  private static readonly SESSION_TTL_MS = 20 * 60 * 1000; // 20 minutes
  private static readonly CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

  private getBaseDomain(hostname: string): string {
    const parts = hostname.toLowerCase().replace(/^www\./, '').split('.');
    return parts.length >= 2 ? parts.slice(-2).join('.') : hostname.toLowerCase();
  }

  private getOrCreateSession(baseDomain: string, forceRotate = false): DomainSessionState {
    const existing = this.domainSessions.get(baseDomain);
    const now = Date.now();

    if (existing && !forceRotate && now - existing.updatedAt < WebScraperAdapter.SESSION_TTL_MS) {
      return existing;
    }

    const nextProfileIndex = existing
      ? (existing.profileIndex + 1) % BROWSER_PROFILES.length
      : Math.floor(Math.random() * BROWSER_PROFILES.length);

    const session: DomainSessionState = {
      cookies: new Map<string, string>(),
      profileIndex: nextProfileIndex,
      updatedAt: now,
    };
    this.domainSessions.set(baseDomain, session);
    return session;
  }

  private storeResponseCookies(session: DomainSessionState, response: Response): void {
    const rawSetCookies: string[] =
      typeof (response.headers as any).getSetCookie === 'function'
        ? (response.headers as any).getSetCookie()
        : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie')!]
        : [];

    for (const cookieStr of rawSetCookies) {
      const firstPair = cookieStr.split(';')[0]?.trim();
      if (!firstPair) continue;
      const eqIdx = firstPair.indexOf('=');
      if (eqIdx > 0) {
        const name = firstPair.slice(0, eqIdx).trim();
        const val = firstPair.slice(eqIdx + 1).trim();
        if (name && val) {
          session.cookies.set(name, val);
        }
      }
    }
    session.updatedAt = Date.now();
  }

  private formatCookieHeader(session: DomainSessionState): string | undefined {
    if (session.cookies.size === 0) return undefined;
    return Array.from(session.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  private buildBrowserHeaders(
    profile: BrowserFingerprintProfile,
    session: DomainSessionState,
    options: { referer?: string; secFetchSite?: 'none' | 'same-origin' | 'cross-site' } = {}
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': profile.userAgent,
      Accept: profile.accept,
      'Accept-Language': profile.acceptLanguage,
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Cache-Control': 'max-age=0',
      'Upgrade-Insecure-Requests': '1',
      DNT: '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': options.secFetchSite || (options.referer ? 'same-origin' : 'none'),
      'Sec-Fetch-User': '?1',
    };

    if (profile.secChUa) {
      headers['Sec-Ch-Ua'] = profile.secChUa;
      headers['Sec-Ch-Ua-Mobile'] = profile.secChUaMobile || '?0';
      headers['Sec-Ch-Ua-Platform'] = profile.secChUaPlatform || '"Linux"';
    }

    if (options.referer) {
      headers['Referer'] = options.referer;
    }

    const cookieHeader = this.formatCookieHeader(session);
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    return headers;
  }

  /**
   * Simulates a human user arriving on the marketplace homepage first to initialize
   * legitimate session cookies (`datadome`, `cnfdVisitorId`, `__Secure-Install`, etc.)
   * before navigating to an internal listing URL.
   */
  private async ensureMarketplaceSessionWarmup(
    parsedUrl: URL,
    session: DomainSessionState
  ): Promise<void> {
    const baseDomain = this.getBaseDomain(parsedUrl.hostname);
    if (!['leboncoin.fr', 'vinted.fr', 'vinted.com'].includes(baseDomain)) {
      return;
    }

    if (session.cookies.has('datadome') || session.cookies.size >= 2) {
      return;
    }

    const profile = BROWSER_PROFILES[session.profileIndex];
    const originUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/`;

    try {
      const warmupRes = await fetch(originUrl, {
        headers: this.buildBrowserHeaders(profile, session, {
          referer: 'https://www.google.fr/',
          secFetchSite: 'cross-site',
        }),
        signal: AbortSignal.timeout(3500),
        redirect: 'follow',
      });
      this.storeResponseCookies(session, warmupRes);
      // Consume body to free socket cleanly
      await warmupRes.arrayBuffer().catch(() => {});
      // Small human-like navigation pause (60-140ms)
      await new Promise((r) => setTimeout(r, 60 + Math.floor(Math.random() * 80)));
    } catch {
      // Ignore warm-up network errors and proceed with main request
    }
  }

  /**
   * Real Headless Chrome fallback with `--disable-blink-features=AutomationControlled`
   * Used only if standard HTTP navigation with session cookies is challenged by a Captcha/403.
   */
  private async fetchWithHeadlessBrowserFallback(
    targetUrl: string,
    profile: BrowserFingerprintProfile
  ): Promise<string | null> {
    return new Promise((resolve) => {
      const args = [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--user-data-dir=/tmp/trustlens-browser-session',
        '--window-size=1920,1080',
        '--lang=fr-FR',
        `--user-agent=${profile.userAgent}`,
        '--dump-dom',
        targetUrl,
      ];

      let resolved = false;
      const finish = (val: string | null) => {
        if (!resolved) {
          resolved = true;
          resolve(val);
        }
      };

      try {
        const child = spawn('google-chrome', args, {
          stdio: ['ignore', 'pipe', 'ignore'],
        });

        const chunks: Buffer[] = [];
        const timer = setTimeout(() => {
          child.kill('SIGKILL');
          finish(null);
        }, 6500);

        child.stdout.on('data', (chunk: Buffer) => chunks.push(chunk));
        child.on('error', () => {
          clearTimeout(timer);
          finish(null);
        });
        child.on('close', () => {
          clearTimeout(timer);
          const html = Buffer.concat(chunks).toString('utf-8');
          finish(html.length > 200 ? html : null);
        });
      } catch {
        finish(null);
      }
    });
  }

  /**
   * Automatically enriches a Leboncoin listing with seller reputation, rating, review count,
   * account registration age, and verification badges from `/profile/<userId>/offers`.
   */
  private async enrichLeboncoinSellerProfile(
    sellerUserId: string,
    adUrl: string,
    session: DomainSessionState
  ): Promise<Partial<ScrapedListingData>> {
    const profileUrl = `https://www.leboncoin.fr/profile/${encodeURIComponent(sellerUserId)}/offers`;
    const profile = BROWSER_PROFILES[session.profileIndex];

    try {
      const response = await fetch(profileUrl, {
        headers: this.buildBrowserHeaders(profile, session, {
          referer: adUrl,
          secFetchSite: 'same-origin',
        }),
        signal: AbortSignal.timeout(3500),
        redirect: 'follow',
      });

      this.storeResponseCookies(session, response);
      if (!response.ok) return {};

      const html = await response.text();
      return extractLeboncoinProfileInfoFromHtml(html);
    } catch {
      return {};
    }
  }

  async inspectUrl(targetUrl: string): Promise<PageInspectionResult> {
    const cached = this.inspectionCache.get(targetUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const baseDomain = this.getBaseDomain(parsedUrl.hostname);
      const isLeboncoin = baseDomain === 'leboncoin.fr';
      const isMarketplace = ['leboncoin.fr', 'vinted.fr', 'vinted.com'].includes(baseDomain);

      let session = this.getOrCreateSession(baseDomain);
      await this.ensureMarketplaceSessionWarmup(parsedUrl, session);

      const profile = BROWSER_PROFILES[session.profileIndex];
      const referer = isLeboncoin
        ? 'https://www.leboncoin.fr/recherche'
        : isMarketplace
        ? `${parsedUrl.protocol}//${parsedUrl.hostname}/`
        : 'https://www.google.fr/';

      let response = await fetch(targetUrl, {
        headers: this.buildBrowserHeaders(profile, session, {
          referer,
          secFetchSite: isMarketplace ? 'same-origin' : 'cross-site',
        }),
        signal: AbortSignal.timeout(6000),
        redirect: 'follow',
      });

      this.storeResponseCookies(session, response);
      let finalUrl = response.url || targetUrl;
      let statusCode = response.status;
      let html = await response.text();
      let listingData = parseListingDataFromHtml(html, statusCode);

      // Stage 2: If blocked by anti-bot (403/429 or captcha challenge), rotate browser profile & re-warm session
      if (listingData.antiBotBlocked && isMarketplace) {
        session = this.getOrCreateSession(baseDomain, true);
        await this.ensureMarketplaceSessionWarmup(parsedUrl, session);
        const rotatedProfile = BROWSER_PROFILES[session.profileIndex];

        const retryRes = await fetch(targetUrl, {
          headers: this.buildBrowserHeaders(rotatedProfile, session, {
            referer,
            secFetchSite: 'same-origin',
          }),
          signal: AbortSignal.timeout(6000),
          redirect: 'follow',
        });

        this.storeResponseCookies(session, retryRes);
        finalUrl = retryRes.url || finalUrl;
        statusCode = retryRes.status;
        html = await retryRes.text();
        listingData = parseListingDataFromHtml(html, statusCode);
      }

      // Stage 3: If HTTP fetch is still blocked by DataDome/Cloudflare captcha, fall back to stealth headless Chrome
      if (listingData.antiBotBlocked && isMarketplace) {
        const renderedDom = await this.fetchWithHeadlessBrowserFallback(
          targetUrl,
          BROWSER_PROFILES[session.profileIndex]
        );
        if (renderedDom) {
          const fallbackListing = parseListingDataFromHtml(renderedDom, 200);
          if (!fallbackListing.antiBotBlocked && (fallbackListing.title || fallbackListing.price !== null)) {
            html = renderedDom;
            statusCode = 200;
            listingData = fallbackListing;
          }
        }
      }

      // Stage 4: For Leboncoin listings where we have the seller's user_id, enrich with seller profile data
      if (
        isLeboncoin &&
        !listingData.antiBotBlocked &&
        listingData.sellerUserId &&
        listingData.sellerRatingsCount === null
      ) {
        const sellerProfileData = await this.enrichLeboncoinSellerProfile(
          listingData.sellerUserId,
          finalUrl,
          session
        );
        listingData = {
          ...listingData,
          sellerName: listingData.sellerName || sellerProfileData.sellerName || null,
          sellerRating: listingData.sellerRating ?? sellerProfileData.sellerRating ?? null,
          sellerRatingsCount:
            listingData.sellerRatingsCount ?? sellerProfileData.sellerRatingsCount ?? null,
          accountAgeMonths: listingData.accountAgeMonths ?? sellerProfileData.accountAgeMonths ?? null,
          sellerRegisteredAt:
            listingData.sellerRegisteredAt ?? sellerProfileData.sellerRegisteredAt ?? null,
          isPhoneVerified: listingData.isPhoneVerified ?? sellerProfileData.isPhoneVerified ?? null,
          isIdentityVerified:
            listingData.isIdentityVerified ?? sellerProfileData.isIdentityVerified ?? null,
          sellerTotalAds: listingData.sellerTotalAds ?? sellerProfileData.sellerTotalAds ?? null,
          sellerReplyText: listingData.sellerReplyText ?? sellerProfileData.sellerReplyText ?? null,
        };
      }

      const isHttps = finalUrl.startsWith('https://');
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : '';

      const hasLegalNotice =
        /\b(mentions\s*l[ée]gales|termes\s*et\s*conditions|cgv|conditions\s*g[ée]n[ée]rales)\b/i.test(
          html
        );
      const hasSirenOrSiret =
        Boolean(listingData.sellerSiren) ||
        /\b(siren|siret|rcs)\s*[:#]?\s*([0-9\s]{9,17})\b/i.test(html);
      const sirenMatch = html.match(
        /\b(siren|siret)\s*[:#]?\s*([0-9]{3}\s*[0-9]{3}\s*[0-9]{3}(?:\s*[0-9]{5})?)\b/i
      );
      const extractedSiren =
        listingData.sellerSiren || (sirenMatch ? sirenMatch[2].replace(/\s+/g, '') : null);

      const hasContactEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(html);
      const hasPhone = /\b(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}\b/.test(html);
      const isShopify = /cdn\.shopify\.com|\.myshopify\.com/i.test(html);
      const hasUrgencyBanner =
        /\b(commandez\s*dans\s*les|offre\s*expire\s*dans|plus\s*que\s*[0-9]+\s*en\s*stock)\b/i.test(
          html
        );

      const result: PageInspectionResult = {
        reachable: statusCode < 500,
        statusCode,
        finalUrl,
        isHttps,
        title,
        hasLegalNotice,
        hasSirenOrSiret,
        extractedSiren,
        hasContactEmail,
        hasPhone,
        isShopify,
        hasUrgencyBanner,
        antiBotBlocked: listingData.antiBotBlocked,
        listingData,
      };

      if (!listingData.antiBotBlocked && result.reachable) {
        this.inspectionCache.set(targetUrl, {
          expiresAt: Date.now() + WebScraperAdapter.CACHE_TTL_MS,
          result,
        });
      }

      return result;
    } catch (err: any) {
      return {
        reachable: false,
        error: err.message || 'Impossible de joindre le site web',
      };
    }
  }
}
