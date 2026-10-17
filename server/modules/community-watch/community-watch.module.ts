import { Module } from '@nestjs/common';
import { SCAM_REPORT_REPOSITORY } from './domain/scam-report.repository';
import { SqliteScamReportRepository } from './infrastructure/sqlite-scam-report.repository';
import { CommunityWatchService } from './application/community-watch.service';
import { CommunityWatchController } from './presentation/community-watch.controller';

@Module({
  controllers: [CommunityWatchController],
  providers: [
    CommunityWatchService,
    {
      provide: SCAM_REPORT_REPOSITORY,
      useClass: SqliteScamReportRepository,
    },
  ],
  exports: [SCAM_REPORT_REPOSITORY, CommunityWatchService],
})
export class CommunityWatchModule {}
