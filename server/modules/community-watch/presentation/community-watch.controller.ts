import { Controller, Get, Post, Body, Param, Query, Inject } from '@nestjs/common';
import { CommunityWatchService } from '../application/community-watch.service';
import type { CreateScamReportProps } from '../domain/scam-report.repository';

@Controller('api')
export class CommunityWatchController {
  constructor(
    @Inject(CommunityWatchService)
    private readonly service: CommunityWatchService
  ) {}

  @Get('scam-reports')
  getReports(
    @Query('q') q?: string,
    @Query('type') type?: string,
    @Query('platform') platform?: string
  ) {
    return this.service.getReports(q, type, platform);
  }

  @Post('scam-reports')
  createReport(@Body() body: CreateScamReportProps) {
    return this.service.createReport(body);
  }

  @Post('scam-reports/:id/upvote')
  upvote(@Param('id') id: string) {
    return this.service.upvoteReport(id);
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('scans/recent')
  getRecentScans(@Query('limit') limit?: string) {
    return this.service.getRecentScans(limit ? parseInt(limit, 10) : 6);
  }
}
