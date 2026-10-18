import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PHONE_REPUTATION_GATEWAY } from '../domain/inspection.ports';
import type { IPhoneReputationGateway } from '../domain/inspection.ports';
import { SCAM_REPORT_REPOSITORY } from '../../community-watch/domain/scam-report.repository';
import type { IScamReportRepository } from '../../community-watch/domain/scam-report.repository';
import { RiskAssessment, RiskFlag, SafeSignal } from '../../../shared/domain/risk-assessment.vo';

@Injectable()
export class AnalyzePhoneUseCase {
  constructor(
    @Inject(PHONE_REPUTATION_GATEWAY) private readonly phoneGateway: IPhoneReputationGateway,
    @Inject(SCAM_REPORT_REPOSITORY) private readonly reportRepo: IScamReportRepository
  ) {}

  async execute(phone?: string) {
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      throw new BadRequestException('Numéro de téléphone requis');
    }

    const cleanPhone = phone.trim();
    const rep = await this.phoneGateway.checkPhoneReputation(cleanPhone);

    let score = 100;
    const redFlags: RiskFlag[] = [];
    const warningFlags: RiskFlag[] = [];
    const safeFlags: SafeSignal[] = [];

    if (rep.isSurcharged) {
      score -= 50;
      redFlags.push({
        type: 'SURCHARGED_NUMBER',
        severity: 'HIGH',
        title: 'Numéro surtaxé / SVA à coût élevé',
        detail: "Risque d'arnaque au rappel payant (Ping Call). Ne rappelez jamais ce numéro si vous ne connaissez pas l'émetteur.",
      });
    }

    if (rep.isDisposableOrVoip) {
      score -= 30;
      warningFlags.push({
        type: 'VOIP_NUMBER',
        severity: 'MEDIUM',
        title: 'Ligne virtuelle / VoIP anonyme',
        detail: "Le numéro est issu d'une plage attribuée aux cartes SIM virtuelles ou SMS temporaires jetables.",
      });
    }

    if (rep.isArcepProspecting) {
      score -= 15;
      warningFlags.push({
        type: 'PROSPECTING_NUMBER',
        severity: 'LOW',
        title: 'Numéro de démarchage commercial (Plage ARCEP)',
        detail: 'Ce numéro appartient à une tranche réglementée réservée au démarchage téléphonique.',
      });
    }

    if (rep.lineType === 'MOBILE' || rep.lineType === 'LANDLINE') {
      safeFlags.push({
        title: `Ligne ${rep.lineType === 'MOBILE' ? 'mobile' : 'fixe'} standard (${rep.countryCode})`,
        detail: rep.carrier ? `Opérateur détecté : ${rep.carrier}` : 'Format de numéro conforme aux standards nationaux.',
      });
    }

    // Check community watch DB
    const reports = await this.reportRepo.findAll(cleanPhone, 'phone');
    if (reports.length > 0) {
      score -= 60;
      redFlags.push({
        type: 'COMMUNITY_REPORTED',
        severity: 'CRITICAL',
        title: `🚨 Signalé ${reports.length} fois dans la base ScamWatch`,
        detail: `Dernier motif : ${reports[0].scamType} — "${reports[0].description}"`,
      });
    } else {
      safeFlags.push({
        title: 'Aucun signalement communautaire recensé',
        detail: 'Ce numéro ne fait l’objet d’aucun signalement actif dans la base communautaire.',
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
            '🛑 Ne rappelez pas ce numéro et ne communiquez aucun code SMS reçu.',
            '📱 Bloquez le numéro sur votre téléphone et signalez-le sur 33700.fr.',
            '🛡️ Déposez un signalement sur l’onglet ScamWatch pour protéger la communauté.',
          ]
        : riskLevel === 'WARNING'
        ? [
            '⚠️ Restez vigilant : ne transmettez aucune donnée bancaire ou personnelle par téléphone.',
            '🔎 Si le correspondant affirme être votre banque ou un livreur, raccrochez et rappelez l’organisme via son site officiel.',
          ]
        : [
            '✅ Numéro conforme sans alerte majeure.',
            '💡 Gardez en mémoire qu’un vrai conseiller bancaire ne vous demandera jamais vos mots de passe ou passcodes.',
          ];

    await this.reportRepo.recordScan(
      'phone',
      cleanPhone,
      finalScore,
      riskLevel,
      redFlags.length > 0 ? redFlags[0].title : warningFlags.length > 0 ? warningFlags[0].title : 'Numéro vérifié'
    );

    return {
      phone: cleanPhone,
      e164Format: rep.e164Format,
      lineType: rep.lineType,
      carrier: rep.carrier,
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
