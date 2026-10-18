import { Injectable } from '@nestjs/common';
import type { ICryptoScamGateway, CryptoScamResult } from '../domain/inspection.ports';

@Injectable()
export class CryptoScamAdapter implements ICryptoScamGateway {
  async checkCryptoAddress(rawAddress: string): Promise<CryptoScamResult> {
    const address = rawAddress.trim();
    const details: string[] = [];

    let chain: CryptoScamResult['chain'] = 'UNKNOWN';
    let isValidFormat = false;

    // Detect chain format
    if (/^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/i.test(address) || /^bc1[a-z0-9]{38,59}$/i.test(address)) {
      chain = 'BTC';
      isValidFormat = true;
      details.push('Adresse Bitcoin (BTC) valide.');
    } else if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
      chain = 'ETH';
      isValidFormat = true;
      details.push('Adresse Ethereum / EVM (ETH, BSC, Polygon) valide.');
    } else if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !address.startsWith('0x')) {
      chain = 'SOL';
      isValidFormat = true;
      details.push('Adresse Solana (SOL) au format Base58 valide.');
    } else {
      details.push('Format d’adresse cryptomonnaie non reconnu.');
      return {
        address,
        chain: 'UNKNOWN',
        isValidFormat: false,
        isFlaggedScam: false,
        reportsCount: 0,
        details,
      };
    }

    let isFlaggedScam = false;
    let scamCategory: string | undefined = undefined;
    let reportsCount = 0;
    let source: string | undefined = undefined;

    // Check CryptoScamDB public API
    try {
      const response = await fetch(`https://api.cryptoscamdb.org/v1/check/${encodeURIComponent(address)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.result === 'blocked') {
          isFlaggedScam = true;
          reportsCount = data.entries?.length || 1;
          scamCategory = data.entries?.[0]?.category || 'Scam / Phishing';
          source = 'CryptoScamDB World Blacklist';
          details.push(`🚨 Adresse répertoriée dans la liste noire CryptoScamDB (${scamCategory}).`);
        }
      }
    } catch {
      // Ignore network timeout
    }

    if (!isFlaggedScam) {
      details.push('Aucun signalement malveillant automatisé dans la liste noire publique mondiale.');
    }

    return {
      address,
      chain,
      isValidFormat,
      isFlaggedScam,
      scamCategory,
      reportsCount,
      source,
      details,
    };
  }
}
