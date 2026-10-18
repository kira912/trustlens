import { Injectable } from '@nestjs/common';
import type { IEmailReputationGateway, EmailReputationResult } from '../domain/inspection.ports';

const DISPOSABLE_DOMAINS = new Set([
  'yopmail.com',
  'yopmail.fr',
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'sharklasers.com',
  'throwawaymail.com',
  'gmx.com',
  'temp-mail.org',
  'fakeinbox.com',
  'maildrop.cc',
]);

const FREE_PROVIDERS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'hotmail.fr',
  'yahoo.com',
  'yahoo.fr',
  'orange.fr',
  'free.fr',
  'sfr.fr',
  'wanadoo.fr',
  'laposte.net',
  'icloud.com',
  'protonmail.com',
  'proton.me',
]);

@Injectable()
export class EmailReputationAdapter implements IEmailReputationGateway {
  async checkEmailReputation(rawEmail: string): Promise<EmailReputationResult> {
    const email = rawEmail.trim().toLowerCase();
    const details: string[] = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        email,
        reputation: 'SUSPICIOUS',
        suspicious: true,
        disposable: false,
        spam: false,
        freeProvider: false,
        deliverable: false,
        details: ['Format d’adresse email invalide'],
      };
    }

    const [, domain] = email.split('@');
    const isDisposable = DISPOSABLE_DOMAINS.has(domain);
    const isFree = FREE_PROVIDERS.has(domain);

    if (isDisposable) {
      details.push(`Domaine d'email jetable temporaire détecté (@${domain}). Utilisé fréquemment pour créer de faux comptes.`);
    } else if (isFree) {
      details.push(`Fournisseur d'email grand public gratuit (@${domain}).`);
    } else {
      details.push(`Domaine d'email professionnel / personnalisé (@${domain}).`);
    }

    // Call EmailRep.io public API
    let apiData: any = null;
    try {
      const apiKey = process.env.EMAILREP_API_KEY;
      const headers: Record<string, string> = {
        'User-Agent': 'TrustLens-AntiScam/2.0',
        Accept: 'application/json',
      };
      if (apiKey) {
        headers['Key'] = apiKey;
      }

      const response = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
        headers,
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        apiData = await response.json();
      }
    } catch {
      // Fallback to static heuristics if EmailRep API is unreachable or rate limited
    }

    let reputation: EmailReputationResult['reputation'] = 'UNKNOWN';
    let suspicious = isDisposable;
    let spam = false;
    let deliverable = true;
    let domainAgeDays: number | null = null;
    let dataBreachesCount = 0;

    if (apiData) {
      if (apiData.reputation) {
        if (apiData.reputation === 'high') reputation = 'HIGH';
        else if (apiData.reputation === 'medium') reputation = 'MEDIUM';
        else if (apiData.reputation === 'low') reputation = 'LOW';
        else reputation = 'SUSPICIOUS';
      }

      if (apiData.suspicious) {
        suspicious = true;
        details.push('Comportement suspect ou anomalies détectées par EmailRep.io.');
      }

      if (apiData.details?.spam) {
        spam = true;
        details.push('Adresse répertoriée dans des bases de données de spammers.');
      }

      if (apiData.details?.credentials_leaked) {
        details.push('Identifiants associés à cette adresse divulgués dans des fuites de données.');
      }

      if (typeof apiData.details?.days_since_first_seen === 'number') {
        domainAgeDays = apiData.details.days_since_first_seen;
        if (domainAgeDays > 365) {
          details.push(`Activité observée depuis plus de ${Math.floor(domainAgeDays / 365)} an(s).`);
        } else if (domainAgeDays < 30) {
          details.push("Adresse email récemment aperçue sur le réseau (moins de 30 jours).");
        }
      }

      if (apiData.details?.data_breach) {
        dataBreachesCount = 1;
      }
    } else {
      reputation = isDisposable ? 'SUSPICIOUS' : isFree ? 'MEDIUM' : 'HIGH';
    }

    return {
      email,
      reputation,
      suspicious,
      disposable: isDisposable,
      spam,
      freeProvider: isFree,
      deliverable,
      domainAgeDays,
      dataBreachesCount,
      details,
    };
  }
}
