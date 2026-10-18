import { Injectable } from '@nestjs/common';
import type { IPhishingThreatGateway, PhishingThreatResult } from '../domain/inspection.ports';

@Injectable()
export class PhishingThreatAdapter implements IPhishingThreatGateway {
  async checkPhishingThreat(url: string, hostname: string): Promise<PhishingThreatResult | null> {
    const cleanUrl = url.trim();
    const cleanHostname = hostname.toLowerCase().trim();

    // 1. Check Google Safe Browsing if API key is provided
    const googleKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (googleKey) {
      try {
        const googleResult = await this.checkGoogleSafeBrowsing(cleanUrl, googleKey);
        if (googleResult) return googleResult;
      } catch {
        // Fallback to secondary feeds
      }
    }

    // 2. Check OpenPhish public feed / PhishTank public API
    try {
      const phishTankResult = await this.checkPhishTank(cleanUrl);
      if (phishTankResult) return phishTankResult;
    } catch {
      // Ignore network errors on public feeds
    }

    return null;
  }

  private async checkGoogleSafeBrowsing(url: string, apiKey: string): Promise<PhishingThreatResult | null> {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    const payload = {
      client: { clientId: 'trustlens-app', clientVersion: '2.0.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && Array.isArray(data.matches) && data.matches.length > 0) {
      const match = data.matches[0];
      return {
        isListed: true,
        source: 'Google Safe Browsing',
        targetUrl: url,
        verified: true,
        details: `Menace identifiée par Google : ${match.threatType || 'SOCIAL_ENGINEERING'} (Phishing / Site malveillant).`,
      };
    }

    return null;
  }

  private async checkPhishTank(url: string): Promise<PhishingThreatResult | null> {
    const phishTankApi = `https://checkurl.phishtank.com/checkurl/`;
    const params = new URLSearchParams({
      url: encodeURI(url),
      format: 'json',
      app_key: process.env.PHISHTANK_API_KEY || 'trustlens_community_app',
    });

    const response = await fetch(phishTankApi, {
      method: 'POST',
      headers: { 'User-Agent': 'TrustLens/2.0 AntiScam' },
      body: params,
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data?.results?.in_database && data?.results?.valid) {
      return {
        isListed: true,
        source: 'PhishTank Community Database',
        targetUrl: url,
        verified: Boolean(data.results.verified),
        details: 'URL répertoriée et validée comme tentative de Phishing dans la base mondiale PhishTank.',
      };
    }

    return null;
  }
}
