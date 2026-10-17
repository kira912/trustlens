import { Module } from '@nestjs/common';
import { COMPANY_GATEWAY } from './domain/company.entity';
import { InseeApiAdapter } from './infrastructure/insee-api.adapter';
import { VerifySirenUseCase } from './application/verify-siren.use-case';
import { CompanyController } from './presentation/company.controller';
import { CommunityWatchModule } from '../community-watch/community-watch.module';

@Module({
  imports: [CommunityWatchModule],
  controllers: [CompanyController],
  providers: [
    VerifySirenUseCase,
    {
      provide: COMPANY_GATEWAY,
      useClass: InseeApiAdapter,
    },
  ],
})
export class CompanyRegistryModule {}
