import { Module } from '@nestjs/common';
import { RDAP_GATEWAY, WEB_SCRAPER_GATEWAY } from './domain/inspection.ports';
import { RdapGatewayAdapter } from './infrastructure/rdap-gateway.adapter';
import { WebScraperAdapter } from './infrastructure/web-scraper.adapter';
import { AnalyzeUrlUseCase } from './application/analyze-url.use-case';
import { AnalyzeTextUseCase } from './application/analyze-text.use-case';
import { AnalyzeProfileUseCase } from './application/analyze-profile.use-case';
import { ScamDetectionController } from './presentation/scam-detection.controller';
import { CommunityWatchModule } from '../community-watch/community-watch.module';

@Module({
  imports: [CommunityWatchModule],
  controllers: [ScamDetectionController],
  providers: [
    AnalyzeUrlUseCase,
    AnalyzeTextUseCase,
    AnalyzeProfileUseCase,
    {
      provide: RDAP_GATEWAY,
      useClass: RdapGatewayAdapter,
    },
    {
      provide: WEB_SCRAPER_GATEWAY,
      useClass: WebScraperAdapter,
    },
  ],
})
export class ScamDetectionModule {}
