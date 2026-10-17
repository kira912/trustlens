import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { RDAP_GATEWAY, WEB_SCRAPER_GATEWAY } from '../domain/inspection.ports';
import type { IRdapGateway, IWebScraperGateway } from '../domain/inspection.ports';
import { SCAM_REPORT_REPOSITORY } from '../../community-watch/domain/scam-report.repository';
import type { IScamReportRepository } from '../../community-watch/domain/scam-report.repository';
import { evaluateDomainPhishing } from '../domain/rules/phishing-rules';
import {
  evaluateMarketplaceListing,
  type ListingContextInput,
  type ListingInspectionSummary,
} from '../domain/rules/listing-rules';
import { RiskAssessment, RiskFlag, SafeSignal } from '../../../shared/domain/risk-assessment.vo';

@Injectable()
export class AnalyzeUrlUseCase {
  constructor(
    @Inject(RDAP_GATEWAY) private readonly rdapGateway: IRdapGateway,
    @Inject(WEB_SCRAPER_GATEWAY) private readonly webScraper: IWebScraperGateway,
    @Inject(SCAM_REPORT_REPOSITORY) private readonly reportRepo: IScamReportRepository
  ) {}

  async execute(rawUrl?: string, listingContext?: ListingContextInput) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new BadRequestException('URL requise');
    }

    const formattedUrl = /^https?:\/\//i.test(rawUrl.trim())
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;

    let parsed: URL;
    try {
      parsed = new URL(formattedUrl);
    } catch {
      throw new BadRequestException('Format d’URL invalide');
    }

    const hostname = parsed.hostname;
    let score = 100;
    const redFlags: RiskFlag[] = [];
    const warningFlags: RiskFlag[] = [];
    const safeFlags: SafeSignal[] = [];

    const phishingAnalysis = evaluateDomainPhishing(hostname, formattedUrl);
    const routeInfo = phishingAnalysis.routeInfo;
    const hasListingInput = Boolean(
      listingContext &&
        (listingContext.title ||
          listingContext.description ||
          (listingContext.price !== undefined && listingContext.price !== null) ||
          listingContext.sellerUsername ||
          listingContext.paymentMethodRequested)
    );
    const isMarketplaceAdOrProfile = Boolean(
      (routeInfo?.isMarketplace && (routeInfo.kind === 'LISTING' || routeInfo.kind === 'PROFILE')) ||
        (routeInfo?.isMarketplace && hasListingInput)
    );

    if (phishingAnalysis.isPhishingRisk) {
      score -= 80;
      redFlags.push({
        type: 'PHISHING_DOMAIN',
        severity: 'CRITICAL',
        title: "Usurpation d'identité de marque (Phishing détecté)",
        detail: phishingAnalysis.reason || undefined,
      });
    } else if (phishingAnalysis.isOfficial) {
      safeFlags.push({
        title: `Domaine officiel certifié (${phishingAnalysis.platform})`,
        detail: isMarketplaceAdOrProfile
          ? `Le lien pointe bien vers le vrai site ${phishingAnalysis.platform} (pas un faux site de phishing). Attention : cela ne garantit pas l'honnêteté du vendeur de l'annonce.`
          : `Ce site web est bien le portail officiel de ${phishingAnalysis.platform}.`,
      });
    }

    if (/\.(xyz|top|buzz|cc|rest|tk|cf|ga|gq|ml|icu|surf|shop|monster|click|sbs|cfd)$/i.test(hostname)) {
      score -= 25;
      warningFlags.push({
        type: 'SUSPICIOUS_TLD',
        severity: 'MEDIUM',
        title: 'Extension de domaine à haut risque',
        detail: `L'extension .${hostname.split('.').pop()} est très fréquemment utilisée par des sites éphémères frauduleux.`,
      });
    }

    const [rdapInfo, scrape] = await Promise.all([
      this.rdapGateway.lookupDomain(hostname),
      this.webScraper.inspectUrl(formattedUrl),
    ]);

    if (rdapInfo && rdapInfo.ageDays !== null) {
      if (rdapInfo.ageDays < 15) {
        score -= 45;
        redFlags.push({
          type: 'VERY_NEW_DOMAIN',
          severity: 'CRITICAL',
          title: `Domaine créé il y a seulement ${rdapInfo.ageDays} jour(s)`,
          detail: '92% des arnaques de faux revendeurs et faux paiements utilisent des domaines créés il y a moins de 30 jours.',
        });
      } else if (rdapInfo.ageDays < 90) {
        score -= 20;
        warningFlags.push({
          type: 'RECENT_DOMAIN',
          severity: 'MEDIUM',
          title: `Domaine récent (${rdapInfo.ageDays} jours)`,
          detail: "Le site a moins de 3 mois d'existence. Faites preuve de vigilance.",
        });
      } else if (rdapInfo.ageDays > 730 && rdapInfo.registrationDate && !isMarketplaceAdOrProfile) {
        safeFlags.push({
          title: `Ancienneté du domaine établie (${Math.floor(rdapInfo.ageDays / 365)} ans)`,
          detail: `Enregistré depuis le ${new Date(rdapInfo.registrationDate).toLocaleDateString('fr-FR')} auprès de ${rdapInfo.registrar}.`,
        });
      }
    }

    let listingSummary: ListingInspectionSummary | null = null;
    let customRecommendations: string[] | null = null;

    if (isMarketplaceAdOrProfile && routeInfo) {
      const scrapedListing = scrape.listingData || {
        antiBotBlocked: !scrape.reachable || Boolean(scrape.antiBotBlocked),
      };
      if (!scrape.reachable) {
        scrapedListing.antiBotBlocked = true;
      }

      const listingEval = evaluateMarketplaceListing({
        routeInfo,
        scraped: scrapedListing,
        userContext: listingContext,
      });

      score -= listingEval.scorePenalty;
      redFlags.push(...listingEval.redFlags);
      warningFlags.push(...listingEval.warningFlags);
      safeFlags.push(...listingEval.safeFlags);
      listingSummary = listingEval.summary;
      customRecommendations = listingEval.recommendations;
    } else if (scrape.reachable) {
      if (!scrape.isHttps) {
        score -= 30;
        redFlags.push({
          type: 'NO_HTTPS',
          severity: 'HIGH',
          title: 'Connexion non sécurisée (Pas de HTTPS)',
          detail: "Le site n'utilise pas de certificat SSL sécurisé.",
        });
      } else {
        safeFlags.push({
          title: 'Connexion chiffrée SSL / HTTPS valide',
          detail: 'Les flux de données sont chiffrés entre votre navigateur et le serveur.',
        });
      }

      if (!scrape.hasLegalNotice && !phishingAnalysis.isOfficial) {
        score -= 20;
        warningFlags.push({
          type: 'NO_LEGAL_NOTICE',
          severity: 'MEDIUM',
          title: 'Absence de mentions légales ou CGV explicites',
          detail: 'La législation oblige tout e-commerçant à mentionner son identité juridique et son SIRET.',
        });
      }

      if (scrape.hasSirenOrSiret) {
        safeFlags.push({
          title: "Présence de mentions d'immatriculation d'entreprise (SIRET/SIREN/RCS)",
          detail: scrape.extractedSiren
            ? `Numéro détecté : ${scrape.extractedSiren}`
            : "Numéro d'immatriculation présent sur la page.",
        });
      }

      if (scrape.isShopify) {
        warningFlags.push({
          type: 'SHOPIFY_STORE',
          severity: 'LOW',
          title: 'Boutique propulsée par Shopify',
          detail: 'Souvent utilisé par des boutiques légitimes mais aussi par des sites de dropshipping sans stock.',
        });
      }

      if (scrape.hasUrgencyBanner) {
        warningFlags.push({
          type: 'URGENCY_MARKETING',
          severity: 'LOW',
          title: "Compteurs d'urgence et pression d'achat détectés",
          detail: 'Présence de comptes à rebours incitant à acheter dans la précipitation.',
        });
      }
    } else {
      score -= 15;
      warningFlags.push({
        type: 'UNREACHABLE_SITE',
        severity: 'MEDIUM',
        title: 'Site inaccessible ou bloquant l’inspection',
        detail: `Impossible de charger la page automatiquement (${scrape.error}).`,
      });
    }

    const matchedReportsMap = new Map<string, { description: string; scamType: string; targetValue: string }>();

    if (phishingAnalysis.isOfficial && isMarketplaceAdOrProfile) {
      const searchKeys: Array<{ query: string; type?: string }> = [];
      if (routeInfo?.listingId && routeInfo.listingId.length >= 6) {
        searchKeys.push({ query: routeInfo.listingId, type: 'url' });
      }
      if (listingSummary?.sellerUsername && listingSummary.sellerUsername.length >= 3) {
        searchKeys.push({ query: listingSummary.sellerUsername, type: 'username' });
      }
      for (const phone of listingSummary?.extractedPhones || []) {
        searchKeys.push({ query: phone, type: 'phone' });
      }
      for (const email of listingSummary?.extractedEmails || []) {
        searchKeys.push({ query: email, type: 'email' });
      }

      for (const key of searchKeys) {
        const found = await this.reportRepo.findAll(key.query, key.type);
        for (const r of found) {
          matchedReportsMap.set(r.id, {
            description: r.description,
            scamType: r.scamType,
            targetValue: r.targetValue,
          });
        }
      }
    } else if (!phishingAnalysis.isOfficial) {
      const found = await this.reportRepo.findAll(hostname, 'url');
      for (const r of found) {
        matchedReportsMap.set(r.id, {
          description: r.description,
          scamType: r.scamType,
          targetValue: r.targetValue,
        });
      }
    }

    const matchingReports = Array.from(matchedReportsMap.values());
    if (matchingReports.length > 0) {
      score -= 55;
      redFlags.push({
        type: 'COMMUNITY_REPORTED',
        severity: 'CRITICAL',
        title: `🚨 Signalé ${matchingReports.length} fois dans la base communautaire ScamWatch (${matchingReports[0].targetValue})`,
        detail: `Motif : ${matchingReports[0].scamType} — "${matchingReports[0].description}"`,
      });
      if (listingSummary) {
        listingSummary.checkPoints.push({
          id: 'scamwatch-match',
          category: 'SCAMWATCH',
          label: 'Vérification Base Communautaire ScamWatch',
          status: 'FAIL',
          detail: `${matchingReports.length} signalement(s) trouvé(s) pour "${matchingReports[0].targetValue}".`,
        });
      }
    } else if (listingSummary) {
      listingSummary.checkPoints.push({
        id: 'scamwatch-match',
        category: 'SCAMWATCH',
        label: 'Vérification Base Communautaire ScamWatch',
        status: 'PASS',
        detail: 'Aucun signalement communautaire recensé sur cet identifiant ou vendeur.',
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
            "🛑 NE PAYEZ RIEN ET N'ENVOYEZ AUCUN DOCUMENT POUR CETTE ANNONCE.",
            '❌ Refusez tout paiement hors plateforme (coupons PCS/Transcash, PayPal entre proches, virement direct).',
            '🛡️ Signalez cette annonce sur la plateforme et dans l’onglet ScamWatch.',
          ]
        : customRecommendations && customRecommendations.length > 0
        ? customRecommendations
        : riskLevel === 'WARNING'
        ? [
            "⚠️ Vérifiez l'adresse physique et le numéro SIRET de l'entreprise avant de commander.",
            '💳 Privilégiez exclusivement le paiement sécurisé intégré avec protection acheteur.',
            '🔎 Demandez des photos supplémentaires prouvant que le vendeur possède réellement le bien.',
          ]
        : [
            '✅ Le lien et les éléments analysés présentent des indicateurs rassurants.',
            '💡 Finalisez toujours votre achat via le système de paiement sécurisé officiel de la plateforme.',
          ];

    const scanTargetLabel =
      isMarketplaceAdOrProfile && listingSummary?.detectedTitle
        ? `${hostname} (${listingSummary.detectedTitle.slice(0, 35)})`
        : hostname;

    await this.reportRepo.recordScan(
      'url',
      scanTargetLabel,
      finalScore,
      riskLevel,
      redFlags.length > 0
        ? redFlags[0].title
        : warningFlags.length > 0
        ? warningFlags[0].title
        : 'Analyse de conformité effectuée'
    );

    return {
      url: formattedUrl,
      hostname,
      score: finalScore,
      riskLevel,
      rdap: rdapInfo,
      inspection: scrape,
      listingAnalysis: listingSummary,
      matchingReportsCount: matchingReports.length,
      redFlags,
      warningFlags,
      safeFlags,
      recommendations,
    };
  }
}
