export const OFFICIAL_PLATFORMS: Record<string, string[]> = {
  vinted: ['vinted.fr', 'vinted.com', 'vinted.be', 'vinted.es', 'vinted.it', 'vinted.de', 'vinted.nl', 'vinted.pl'],
  leboncoin: ['leboncoin.fr'],
  amazon: ['amazon.fr', 'amazon.com', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it'],
  ebay: ['ebay.fr', 'ebay.com', 'ebay.co.uk', 'ebay.de'],
  etsy: ['etsy.com'],
  backmarket: ['backmarket.fr', 'backmarket.com'],
  rakuten: ['rakuten.com', 'fr.shopping.rakuten.com'],
  aliexpress: ['aliexpress.com', 'fr.aliexpress.com'],
  paypal: ['paypal.com', 'paypal.me'],
  mondialrelay: ['mondialrelay.fr', 'mondialrelay.be'],
  laposte: ['laposte.fr', 'chronopost.fr'],
  dhl: ['dhl.com', 'dhl.fr'],
  facebook: ['facebook.com', 'fb.com'],
  paruvendu: ['paruvendu.fr'],
};

export const PHISHING_KEYWORDS = [
  'vinted',
  'leboncoin',
  'lbc',
  'chronopost',
  'mondialrelay',
  'mondial-relay',
  'colissimo',
  'paiement-securise',
  'securise-paiement',
  'service-livraison',
  'authentification',
  'verif-compte',
  'validation-colis',
  'reception-fonds',
  'dhl-express',
  'ups-tracking',
  'paypal-security',
  'remboursement',
];

export type MarketplaceUrlKind = 'LISTING' | 'PROFILE' | 'OFFICIAL_HOME' | 'EXTERNAL';

export interface MarketplaceRouteInfo {
  isMarketplace: boolean;
  platform: string | null;
  kind: MarketplaceUrlKind;
  listingId: string | null;
  slugTitle: string | null;
  urlCategory: string | null;
  usernameFromUrl: string | null;
}

export interface PhishingCheckResult {
  isOfficial?: boolean;
  platform?: string;
  isPhishingRisk: boolean;
  matchedTarget?: string | null;
  reason?: string | null;
  routeInfo?: MarketplaceRouteInfo;
}

/**
 * Normalizes leetspeak and common homoglyphs used in typosquatting domains
 * e.g. "l3b0nc0in" -> "leboncoin", "v1nted" -> "vinted", "rnondialrelay" -> "mondialrelay"
 */
function deobfuscateDomainToken(input: string): string {
  return input
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1|l|!/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w');
}

/**
 * Bounded Damerau-Levenshtein distance for catching 1-2 character typosquatting
 */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return 99;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[m][n];
}

/**
 * Parses a URL to determine if it points to a specific marketplace listing (annonce) or seller profile
 */
export function parseMarketplaceRoute(parsedUrl: URL, officialPlatform?: string): MarketplaceRouteInfo {
  const pathname = decodeURIComponent(parsedUrl.pathname || '/');
  const cleanHost = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');

  const platform =
    officialPlatform ||
    Object.entries(OFFICIAL_PLATFORMS).find(([, domains]) =>
      domains.some((d) => cleanHost === d || cleanHost.endsWith('.' + d))
    )?.[0] ||
    null;

  if (!platform) {
    return {
      isMarketplace: false,
      platform: null,
      kind: 'EXTERNAL',
      listingId: null,
      slugTitle: null,
      urlCategory: null,
      usernameFromUrl: null,
    };
  }

  // 1. LEBONCOIN route patterns:
  // - /ad/<category>/<id> (current format, e.g. /ad/telephones_objets_connectes/2849102938)
  // - /offre/<category>/<id>
  // - /<category>/<id>.htm or /vi/<id>.htm
  // - /profile/<id> or /boutique/<id>/<slug>
  if (platform === 'leboncoin') {
    const adMatch = pathname.match(/^\/(?:ad|offre)\/([^/]+)\/([0-9a-zA-Z_-]+)/i);
    if (adMatch) {
      const urlCategory = adMatch[1].replace(/_/g, ' ');
      const listingId = adMatch[2];
      const slugTitle = parsedUrl.searchParams.get('title') || parsedUrl.searchParams.get('q') || null;
      return {
        isMarketplace: true,
        platform: 'leboncoin',
        kind: 'LISTING',
        listingId,
        slugTitle,
        urlCategory,
        usernameFromUrl: null,
      };
    }

    const legacyMatch = pathname.match(/^\/([^/]+)\/([0-9]{7,12})\.htm/i);
    if (legacyMatch) {
      return {
        isMarketplace: true,
        platform: 'leboncoin',
        kind: 'LISTING',
        listingId: legacyMatch[2],
        slugTitle: null,
        urlCategory: legacyMatch[1].replace(/_/g, ' '),
        usernameFromUrl: null,
      };
    }

    const profileMatch = pathname.match(/^\/(?:profile|boutique|user)\/([^/]+)/i);
    if (profileMatch) {
      return {
        isMarketplace: true,
        platform: 'leboncoin',
        kind: 'PROFILE',
        listingId: null,
        slugTitle: null,
        urlCategory: null,
        usernameFromUrl: profileMatch[1],
      };
    }
  }

  // 2. VINTED route patterns:
  // - /items/<id>-<slug> (e.g. /items/482910392-iphone-15-pro-max-neuf)
  // - /<category>/<id>-<slug>
  // - /member/<id>-<username>
  if (platform === 'vinted') {
    const itemMatch = pathname.match(/\/(?:items|articles|vetements|femmes|hommes|enfants|maison|divertissement)\/([0-9]+)(?:-([^/?#]+))?/i);
    if (itemMatch) {
      const listingId = itemMatch[1];
      const rawSlug = itemMatch[2] || '';
      const slugTitle = rawSlug ? rawSlug.replace(/[-_]+/g, ' ').trim() : null;
      return {
        isMarketplace: true,
        platform: 'vinted',
        kind: 'LISTING',
        listingId,
        slugTitle,
        urlCategory: 'mode & high-tech',
        usernameFromUrl: null,
      };
    }

    const memberMatch = pathname.match(/\/member\/([0-9]+)(?:-([^/?#]+))?/i);
    if (memberMatch) {
      return {
        isMarketplace: true,
        platform: 'vinted',
        kind: 'PROFILE',
        listingId: null,
        slugTitle: null,
        urlCategory: null,
        usernameFromUrl: memberMatch[2] || memberMatch[1],
      };
    }
  }

  // 3. EBAY / RAKUTEN / FACEBOOK MARKETPLACE / PARUVENDU / BACKMARKET listing patterns
  if (['ebay', 'rakuten', 'facebook', 'paruvendu', 'backmarket', 'etsy'].includes(platform)) {
    const isListingPath =
      /\/(?:itm|offer|fp|p|listing|marketplace\/item|annonces)\/([^/?#]+)/i.test(pathname) ||
      pathname.split('/').filter(Boolean).length >= 2;

    if (isListingPath) {
      const segments = pathname.split('/').filter(Boolean);
      const lastSeg = segments[segments.length - 1] || '';
      const slugTitle = lastSeg.replace(/[-_]+/g, ' ').replace(/\.[a-z]+$/i, '').trim();
      return {
        isMarketplace: true,
        platform,
        kind: 'LISTING',
        listingId: segments.find((s) => /^[0-9]{6,}$/.test(s)) || lastSeg.slice(0, 24),
        slugTitle: slugTitle.length > 3 ? slugTitle : null,
        urlCategory: segments[0]?.replace(/[-_]/g, ' ') || null,
        usernameFromUrl: null,
      };
    }
  }

  // Fallback: if on leboncoin or vinted and pathname has >1 non-empty segment that isn't a static page
  if (['leboncoin', 'vinted'].includes(platform) && pathname.length > 4 && pathname !== '/') {
    const segments = pathname.split('/').filter(Boolean);
    const lastSeg = segments[segments.length - 1] || '';
    return {
      isMarketplace: true,
      platform,
      kind: 'LISTING',
      listingId: lastSeg,
      slugTitle: lastSeg.replace(/[-_]+/g, ' ').trim(),
      urlCategory: segments.length > 1 ? segments[0].replace(/[-_]+/g, ' ') : null,
      usernameFromUrl: null,
    };
  }

  return {
    isMarketplace: true,
    platform,
    kind: 'OFFICIAL_HOME',
    listingId: null,
    slugTitle: null,
    urlCategory: null,
    usernameFromUrl: null,
  };
}

export function evaluateDomainPhishing(hostname: string, fullUrl?: string): PhishingCheckResult {
  const cleanHost = hostname.toLowerCase().replace(/^www\./, '');
  const hostLabels = cleanHost.split('.');
  const secondLevelDomain = hostLabels.length >= 2 ? hostLabels[hostLabels.length - 2] : cleanHost;

  // 1. Check IDN / Punycode homograph attack (e.g. xn--leboncon-r1a.fr)
  if (cleanHost.includes('xn--')) {
    return {
      isPhishingRisk: true,
      matchedTarget: 'IDN Homograph',
      reason: `Le domaine utilise un encodage Punycode ('${cleanHost}') typique des attaques par caractères spéciaux imitant une marque officielle.`,
    };
  }

  // 2. Check exact official platforms
  for (const [platform, officialDomains] of Object.entries(OFFICIAL_PLATFORMS)) {
    if (officialDomains.some((d) => cleanHost === d || cleanHost.endsWith('.' + d))) {
      let routeInfo: MarketplaceRouteInfo | undefined;
      if (fullUrl) {
        try {
          routeInfo = parseMarketplaceRoute(new URL(fullUrl), platform);
        } catch {
          // ignore
        }
      }
      return { isOfficial: true, platform, isPhishingRisk: false, routeInfo };
    }
  }

  // 3. Check brand impersonation (exact substring, subdomain spoofing, or typosquatting/leetspeak)
  const deobfuscatedHost = deobfuscateDomainToken(cleanHost);
  const deobfuscatedSld = deobfuscateDomainToken(secondLevelDomain);

  for (const [platform] of Object.entries(OFFICIAL_PLATFORMS)) {
    const deobfuscatedBrand = deobfuscateDomainToken(platform);

    if (cleanHost.includes(platform) || deobfuscatedHost.includes(deobfuscatedBrand)) {
      return {
        isPhishingRisk: true,
        matchedTarget: platform,
        reason: `Le nom de domaine imite ou contient '${platform}' ('${cleanHost}') mais N'EST PAS le domaine officiel. Il s'agit d'un site pirate (phishing) conçu pour voler vos identifiants ou coordonnées bancaires.`,
      };
    }

    // Check edit distance against SLD Tokens for typosquatting (e.g. "leboncion", "vintde", "mondialrealy")
    if (platform.length >= 5) {
      const sldTokens = secondLevelDomain.split('-');
      for (const token of sldTokens) {
        if (token.length >= 5) {
          const dist = Math.min(
            editDistance(token, platform),
            editDistance(deobfuscateDomainToken(token), deobfuscatedBrand)
          );
          if (dist >= 1 && dist <= 2) {
            return {
              isPhishingRisk: true,
              matchedTarget: platform,
              reason: `Détection de typosquatting : '${token}' dans '${cleanHost}' imite visuellement la marque '${platform}' (erreur volontaire d'orthographe pour tromper l'œil).`,
            };
          }
        }
      }
    }

    // Also check full SLD edit distance
    if (platform.length >= 6 && secondLevelDomain.length >= 5) {
      const dist = Math.min(
        editDistance(secondLevelDomain, platform),
        editDistance(deobfuscatedSld, deobfuscatedBrand)
      );
      if (dist >= 1 && dist <= 2) {
        return {
          isPhishingRisk: true,
          matchedTarget: platform,
          reason: `Détection de typosquatting : '${secondLevelDomain}' ressemble fortement à '${platform}'.`,
        };
      }
    }
  }

  // 4. Check suspicious phishing keywords in domain
  for (const keyword of PHISHING_KEYWORDS) {
    if (cleanHost.includes(keyword)) {
      return {
        isPhishingRisk: true,
        matchedTarget: keyword,
        reason: `Le nom de domaine utilise un mot-clé de sécurité/livraison trompeur ('${keyword}') souvent lié aux faux paiements Leboncoin/Vinted.`,
      };
    }
  }

  // 5. Check free static hosting / tunnel domains combined with marketplace path keywords
  if (fullUrl) {
    const isEphemeralHost = /\.(ngrok-free\.app|ngrok\.io|trycloudflare\.com|pages\.dev|vercel\.app|netlify\.app|web\.app|firebaseapp\.com|weebly\.com|wixsite\.com|duckdns\.org)$/i.test(cleanHost);
    if (isEphemeralHost && /(vinted|leboncoin|paiement|colis|mondial|chronopost|verif|banque|carte)/i.test(fullUrl)) {
      return {
        isPhishingRisk: true,
        matchedTarget: 'Hébergement éphémère de phishing',
        reason: `Ce lien utilise un hébergeur gratuit/éphémère ('${cleanHost}') avec un chemin imitant un paiement ou service de livraison.`,
      };
    }
  }

  return { isPhishingRisk: false, matchedTarget: null, reason: null };
}
