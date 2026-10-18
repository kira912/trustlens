import { Module } from '@nestjs/common';
import {
  RDAP_GATEWAY,
  WEB_SCRAPER_GATEWAY,
  PHISHING_THREAT_GATEWAY,
  EMAIL_REPUTATION_GATEWAY,
  PHONE_REPUTATION_GATEWAY,
  CRYPTO_SCAM_GATEWAY,
} from './domain/inspection.ports';
import { RdapGatewayAdapter } from './infrastructure/rdap-gateway.adapter';
import { WebScraperAdapter } from './infrastructure/web-scraper.adapter';
import { PhishingThreatAdapter } from './infrastructure/phishing-threat.adapter';
import { EmailReputationAdapter } from './infrastructure/email-reputation.adapter';
import { PhoneReputationAdapter } from './infrastructure/phone-reputation.adapter';
import { CryptoScamAdapter } from './infrastructure/crypto-scam.adapter';

import { AnalyzeUrlUseCase } from './application/analyze-url.use-case';
import { AnalyzeTextUseCase } from './application/analyze-text.use-case';
import { AnalyzeProfileUseCase } from './application/analyze-profile.use-case';
import { AnalyzePhoneUseCase } from './application/analyze-phone.use-case';
import { AnalyzeEmailUseCase } from './application/analyze-email.use-case';
import { AnalyzeCryptoUseCase } from './application/analyze-crypto.use-case';

import { ScamDetectionController } from './presentation/scam-detection.controller';
import { CommunityWatchModule } from '../community-watch/community-watch.module';

@Module({
  imports: [CommunityWatchModule],
  controllers: [ScamDetectionController],
  providers: [
    AnalyzeUrlUseCase,
    AnalyzeTextUseCase,
    AnalyzeProfileUseCase,
    AnalyzePhoneUseCase,
    AnalyzeEmailUseCase,
    AnalyzeCryptoUseCase,
    {
      provide: RDAP_GATEWAY,
      useClass: RdapGatewayAdapter,
    },
    {
      provide: WEB_SCRAPER_GATEWAY,
      useClass: WebScraperAdapter,
    },
    {
      provide: PHISHING_THREAT_GATEWAY,
      useClass: PhishingThreatAdapter,
    },
    {
      provide: EMAIL_REPUTATION_GATEWAY,
      useClass: EmailReputationAdapter,
    },
    {
      provide: PHONE_REPUTATION_GATEWAY,
      useClass: PhoneReputationAdapter,
    },
    {
      provide: CRYPTO_SCAM_GATEWAY,
      useClass: CryptoScamAdapter,
    },
  ],
})
export class ScamDetectionModule {}

