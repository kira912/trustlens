import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { COMPANY_GATEWAY } from '../domain/company.entity';
import type { ICompanyGateway } from '../domain/company.entity';
import { SCAM_REPORT_REPOSITORY } from '../../community-watch/domain/scam-report.repository';
import type { IScamReportRepository } from '../../community-watch/domain/scam-report.repository';

@Injectable()
export class VerifySirenUseCase {
  constructor(
    @Inject(COMPANY_GATEWAY) private readonly gateway: ICompanyGateway,
    @Inject(SCAM_REPORT_REPOSITORY) private readonly reportRepo: IScamReportRepository
  ) {}

  async execute(query?: string) {
    if (!query || !query.trim()) {
      throw new BadRequestException('Paramètre q (nom ou SIREN) requis');
    }

    const companies = await this.gateway.searchCompanies(query);

    if (companies.length > 0) {
      const top = companies[0];
      await this.reportRepo.recordScan(
        'siret',
        `${top.nomComplet} (${top.siren})`,
        top.trustScore,
        top.isCessée ? 'DANGER' : 'SAFE',
        top.etatAdministratif
      );
    }

    return {
      query,
      count: companies.length,
      companies,
    };
  }
}
