import { Injectable } from '@nestjs/common';
import type { IPhoneReputationGateway, PhoneReputationResult } from '../domain/inspection.ports';

// Prefixes defined by ARCEP for authorized commercial prospecting in France
const ARCEP_PROSPECTING_PREFIXES = [
  '0937', '0938', '0939',
  '0162', '0163',
  '0270', '0271',
  '0377', '0378',
  '0424', '0425',
  '0536', '0537',
];

// Surcharged / SVA numbers
const SURCHARGED_PREFIXES = ['0890', '0891', '0892', '0893', '0897', '0898', '0899'];

// Ranges allocated to virtual / VoIP providers (e.g., OnOff, Twilio, Ringover)
const VOIP_VIRTUAL_PREFIXES = ['0756', '0757', '0644', '0970', '0971', '0972', '0973', '0974', '0975'];

@Injectable()
export class PhoneReputationAdapter implements IPhoneReputationGateway {
  async checkPhoneReputation(rawPhone: string): Promise<PhoneReputationResult> {
    const cleaned = rawPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    const details: string[] = [];

    let national = cleaned;
    let countryCode = 'FR';
    let e164 = cleaned;

    if (cleaned.startsWith('+33')) {
      national = '0' + cleaned.slice(3);
      countryCode = 'FR';
      e164 = cleaned;
    } else if (cleaned.startsWith('0033')) {
      national = '0' + cleaned.slice(4);
      countryCode = 'FR';
      e164 = '+33' + cleaned.slice(4);
    } else if (/^0[1-9]\d{8}$/.test(cleaned)) {
      countryCode = 'FR';
      e164 = '+33' + cleaned.slice(1);
    }

    const prefix4 = national.slice(0, 4);
    const prefix2 = national.slice(0, 2);

    const isArcepProspecting = ARCEP_PROSPECTING_PREFIXES.includes(prefix4);
    const isSurcharged = SURCHARGED_PREFIXES.includes(prefix4) || (countryCode === 'FR' && /^3\d{3}$/.test(national));
    const isVirtualVoip = VOIP_VIRTUAL_PREFIXES.includes(prefix4);

    let lineType: PhoneReputationResult['lineType'] = 'UNKNOWN';

    if (isArcepProspecting) {
      lineType = 'PROSPECTING_PRO';
      details.push(`Numéro réservé par l'ARCEP pour le démarchage commercial autorisé (tranche ${prefix4}).`);
    } else if (isSurcharged) {
      lineType = 'SPECIAL_RATE';
      details.push(`Numéro surtaxé / SVA à tarification majorée (${prefix4}). Risque d'arnaque au rappel payant (Ping Call).`);
    } else if (isVirtualVoip) {
      lineType = 'VOIP';
      details.push(`Ligne virtuelle / VoIP (tranche ${prefix4}). Souvent attribuée par des opérateurs de cartes SIM virtuelles ou SMS jetables.`);
    } else if (prefix2 === '06' || prefix2 === '07') {
      lineType = 'MOBILE';
      details.push('Numéro mobile standard.');
    } else if (['01', '02', '03', '04', '05', '09'].includes(prefix2)) {
      lineType = 'LANDLINE';
      details.push('Numéro fixe géographique ou national.');
    }

    // Call external API (NumVerify) if API key is provided in env
    let carrier: string | undefined = undefined;
    const numverifyKey = process.env.NUMVERIFY_API_KEY;
    if (numverifyKey && e164) {
      try {
        const response = await fetch(`http://apilayer.net/api/validate?access_key=${numverifyKey}&number=${encodeURIComponent(e164)}`, {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.carrier) carrier = data.carrier;
          if (data.line_type) {
            const extType = String(data.line_type).toUpperCase();
            if (extType.includes('VOIP')) lineType = 'VOIP';
          }
        }
      } catch {
        // Ignore API timeout/error
      }
    }

    return {
      phone: rawPhone,
      e164Format: e164,
      countryCode,
      lineType,
      carrier,
      isArcepProspecting,
      isSurcharged,
      isDisposableOrVoip: isVirtualVoip,
      details,
    };
  }
}
