import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { EMAIL_REPUTATION_GATEWAY } from '../domain/inspection.ports';
import type { IEmailReputationGateway } from '../domain/inspection.ports';
import { SCAM_REPORT_REPOSITORY } from '../../community-watch/domain/scam-report.repository';
import type { IScamReportRepository } from '../../community-watch/domain/scam-report.repository';
import { RiskAssessment, RiskFlag, SafeSignal } from '../../../shared/domain/risk-assessment.vo';

@Injectable()
export class AnalyzeEmailUseCase {
  constructor(
    @Inject(EMAIL_REPUTATION_GATEWAY) private readonly emailGateway: IEmailReputationGateway,
    @Inject(SCAM_REPORT_REPOSITORY) private readonly reportRepo: IScamReportRepository
  ) {}

  async execute(email?: string) {
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new BadRequestException('Adresse email requise');
    }

    const cleanEmail = email.trim().toLowerCase();
    const rep = await this.emailGateway.checkEmailReputation(cleanEmail);

    let score = 100;
    const redFlags: RiskFlag[] = [];
    const warningFlags: RiskFlag[] = [];
    const safeFlags: SafeSignal[] = [];

    if (rep.disposable) {
      score -= 50;
      redFlags.push({
        type: 'DISPOSABLE_EMAIL',
        severity: 'HIGH',
        title: "Adresse email temporaire jetable",
        detail: "Cette adresse appartient à un service d'emails éphémères jetables fréquemment utilisé pour créer de faux profils anonymes.",
      });
    }

    if (rep.suspicious) {
      score -= 30;
      warningFlags.push({
        type: 'SUSPICIOUS_EMAIL',
        severity: 'MEDIUM',
        title: "Adresse à réputation suspecte (EmailRep.io)",
        detail: "Avis d'anomalie ou comportement suspect détecté dans les bases mondiales d'analyse d'emails.",
      });
    }

    if (rep.spam) {
      score -= 25;
      warningFlags.push({
        type: 'SPAM_REPUTATION',
        severity: 'MEDIUM',
        title: 'Adresse associée à des campagnes de Spam',
        detail: 'Cette adresse a été répertoriée dans des listes de spammers ou de sollicitations non désirées.',
      });
    }

    if (!rep.disposable && !rep.suspicious) {
      safeFlags.push({
        title: 'Domaine email valide et légitime',
        detail: rep.freeProvider ? 'Fournisseur d’email grand public reconnu.' : 'Domaine d’email d’organisation / entreprise.',
      });
    }

    // Check community watch DB
    const reports = await this.reportRepo.findAll(cleanEmail, 'email');
    if (reports.length > 0) {
      score -= 60;
      redFlags.push({
        type: 'COMMUNITY_REPORTED',
        severity: 'CRITICAL',
        title: `🚨 Signalée ${reports.length} fois dans la base ScamWatch`,
        detail: `Dernier motif : ${reports[0].scamType} — "${reports[0].description}"`,
      });
    } else {
      safeFlags.push({
        title: 'Aucun signalement communautaire recensé',
        detail: 'Cette adresse email ne fait l’objet d’aucun signalement actif dans la base ScamWatch.',
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
            '🛑 N’effectuez aucun virement ni transaction initiée par cet e-mail.',
            '✉️ Ne cliquez sur aucun lien ni pièce jointe provenant de cette adresse.',
            '🛡️ Signalez cette adresse si elle tente de vous extorquer des fonds.',
          ]
        : riskLevel === 'WARNING'
        ? [
            '⚠️ Soyez vigilant : vérifiez attentivement l’en-tête de l’e-mail et l’identité de l’expéditeur.',
            '🔗 Assurez-vous que le nom de domaine correspond exactement à l’organisme officiel.',
          ]
        : [
            '✅ Aucun indicateur de fraude majeur sur cette adresse email.',
            '💡 Pensez à toujours vérifier le domaine d’envoi réel avant de partager des informations confidentielles.',
          ];

    await this.reportRepo.recordScan(
      'email',
      cleanEmail,
      finalScore,
      riskLevel,
      redFlags.length > 0 ? redFlags[0].title : warningFlags.length > 0 ? warningFlags[0].title : 'Email vérifié'
    );

    return {
      email: cleanEmail,
      reputation: rep.reputation,
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
