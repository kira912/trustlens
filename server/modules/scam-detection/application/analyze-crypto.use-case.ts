import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CRYPTO_SCAM_GATEWAY } from '../domain/inspection.ports';
import type { ICryptoScamGateway } from '../domain/inspection.ports';
import { SCAM_REPORT_REPOSITORY } from '../../community-watch/domain/scam-report.repository';
import type { IScamReportRepository } from '../../community-watch/domain/scam-report.repository';
import { RiskAssessment, RiskFlag, SafeSignal } from '../../../shared/domain/risk-assessment.vo';

@Injectable()
export class AnalyzeCryptoUseCase {
  constructor(
    @Inject(CRYPTO_SCAM_GATEWAY) private readonly cryptoGateway: ICryptoScamGateway,
    @Inject(SCAM_REPORT_REPOSITORY) private readonly reportRepo: IScamReportRepository
  ) {}

  async execute(address?: string) {
    if (!address || typeof address !== 'string' || !address.trim()) {
      throw new BadRequestException('Adresse crypto requise');
    }

    const cleanAddress = address.trim();
    const rep = await this.cryptoGateway.checkCryptoAddress(cleanAddress);

    if (!rep.isValidFormat) {
      throw new BadRequestException('Format d’adresse cryptomonnaie (BTC/ETH/SOL) invalide');
    }

    let score = 100;
    const redFlags: RiskFlag[] = [];
    const warningFlags: RiskFlag[] = [];
    const safeFlags: SafeSignal[] = [];

    if (rep.isFlaggedScam) {
      score -= 80;
      redFlags.push({
        type: 'CRYPTO_BLACK_LISTED',
        severity: 'CRITICAL',
        title: `Adresse répertoriée dans la liste noire mondiale (${rep.source || 'CryptoScamDB'})`,
        detail: `Motif : ${rep.scamCategory || 'Phishing / Escroquerie'}. N'envoyez aucun fonds vers ce portefeuille.`,
      });
    } else {
      safeFlags.push({
        title: `Format d'adresse ${rep.chain} valide & absente de la liste noire mondiale`,
        detail: 'L’adresse respecte les normes de la blockchain et n’a pas fait l’objet de blocage global.',
      });
    }

    // Check community watch DB
    const reports = await this.reportRepo.findAll(cleanAddress, 'iban'); // or crypto
    if (reports.length > 0) {
      score -= 70;
      redFlags.push({
        type: 'COMMUNITY_REPORTED',
        severity: 'CRITICAL',
        title: `🚨 Adresse signalée ${reports.length} fois dans la base ScamWatch`,
        detail: `Dernier motif : ${reports[0].scamType} — "${reports[0].description}"`,
      });
    } else {
      safeFlags.push({
        title: 'Aucun signalement ScamWatch sur ce portefeuille',
        detail: 'Ce portefeuille n’a pas été signalé par les utilisateurs de la communauté TrustLens.',
      });
    }

    const finalScore = RiskAssessment.clampScore(score, 0);
    const riskLevel =
      finalScore < 40 || redFlags.length > 0
        ? 'DANGER'
        : finalScore < 76 || warningFlags.length >= 1
        ? 'WARNING'
        : 'SAFE';

    const recommendations =
      riskLevel === 'DANGER'
        ? [
            '🛑 N’EFFECTUEZ AUCUN VIREMENT OU TRANSFERT VERS CETTE ADRESSE CRYPTO.',
            '💸 Les transactions blockchain sont irréversibles. Une fois les fonds envoyés, ils ne pourront pas être récupérés.',
            '🛡️ Signalez cette adresse si un individu vous a demandé de lui transférer de la crypto.',
          ]
        : riskLevel === 'WARNING'
        ? [
            '⚠️ Assurez-vous d’avoir vérifié l’identité du destinataire par un canal de communication sécurisé.',
            '🔗 Méfiez-vous des faux supports techniques ou des opportunités d’investissement garantissant des gains rapides.',
          ]
        : [
            '✅ L’adresse présente des indicateurs de conformité normaux.',
            '💡 N’oubliez pas de tester l’adresse avec un envoi symbolique minime avant tout transfert conséquent.',
          ];

    await this.reportRepo.recordScan(
      'iban',
      `${rep.chain}: ${cleanAddress.slice(0, 8)}...${cleanAddress.slice(-6)}`,
      finalScore,
      riskLevel,
      redFlags.length > 0 ? redFlags[0].title : warningFlags.length > 0 ? warningFlags[0].title : 'Adresse Crypto vérifiée'
    );

    return {
      address: cleanAddress,
      chain: rep.chain,
      score: finalScore,
      riskLevel,
      matchingReportsCount: reports.length,
      redFlags,
      warningFlags,
      safeFlags,
      recommendations,
      details: rep.details,
    };
  }
}
