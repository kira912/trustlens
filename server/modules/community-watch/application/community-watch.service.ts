import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SCAM_REPORT_REPOSITORY } from '../domain/scam-report.repository';
import type { IScamReportRepository, CreateScamReportProps } from '../domain/scam-report.repository';

@Injectable()
export class CommunityWatchService {
  constructor(
    @Inject(SCAM_REPORT_REPOSITORY)
    private readonly repository: IScamReportRepository
  ) {}

  async getReports(query?: string, type?: string, platform?: string) {
    const reports = await this.repository.findAll(query, type, platform);
    return { total: reports.length, reports };
  }

  async createReport(dto: CreateScamReportProps) {
    if (!dto.targetType || !dto.targetValue || !dto.scamType || !dto.description) {
      throw new BadRequestException('Tous les champs obligatoires doivent être renseignés.');
    }
    const created = await this.repository.create(dto);
    return { message: 'Signalement enregistré avec succès.', report: created };
  }

  async upvoteReport(id: string) {
    const upvotes = await this.repository.incrementUpvote(id);
    if (upvotes === null) {
      throw new NotFoundException('Signalement introuvable.');
    }
    return { success: true, upvotes };
  }

  async getStats() {
    return this.repository.getStats();
  }

  async getRecentScans(limit = 6) {
    const clampedLimit = Math.min(20, Math.max(1, Number(limit) || 6));
    return { scans: await this.repository.getRecentScans(clampedLimit) };
  }
}
