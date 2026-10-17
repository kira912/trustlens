import { Inject, Injectable } from '@nestjs/common';
import { evaluateProfileRisk } from '../domain/rules/profile-rules';
import type { ProfileEvaluationInput } from '../domain/rules/profile-rules';
import { SCAM_REPORT_REPOSITORY } from '../../community-watch/domain/scam-report.repository';
import type { IScamReportRepository } from '../../community-watch/domain/scam-report.repository';

@Injectable()
export class AnalyzeProfileUseCase {
  constructor(
    @Inject(SCAM_REPORT_REPOSITORY) private readonly reportRepo: IScamReportRepository
  ) {}

  async execute(dto: ProfileEvaluationInput) {
    let matchingReportsCount = 0;
    let matchedScamType = '';

    if (dto.username && dto.username.trim()) {
      const matched = await this.reportRepo.findAll(dto.username.trim());
      matchingReportsCount = matched.length;
      matchedScamType = matched[0]?.scamType || '';
    }

    const assessment = evaluateProfileRisk({
      ...dto,
      matchingReportsCount,
      matchedScamType,
    });

    return {
      platform: dto.platform || 'Général',
      username: dto.username || '',
      ...assessment,
    };
  }
}
