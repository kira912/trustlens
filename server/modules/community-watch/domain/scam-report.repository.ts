import { ScamReportEntity, TargetType } from './scam-report.entity';

export interface CreateScamReportProps {
  targetType: TargetType;
  targetValue: string;
  platform: string;
  sellerAlias?: string;
  scamType: string;
  description: string;
}

export interface ScanRecord {
  id: string;
  scanType: string;
  query: string;
  score: number;
  riskLevel: string;
  summary: string;
  createdAt: string;
}

export interface SystemStats {
  totalReports: number;
  totalScans: number;
  threatsNeutralized: number;
}

export const SCAM_REPORT_REPOSITORY = 'SCAM_REPORT_REPOSITORY';

export interface IScamReportRepository {
  findAll(query?: string, type?: string, platform?: string): Promise<ScamReportEntity[]>;
  create(props: CreateScamReportProps): Promise<ScamReportEntity>;
  incrementUpvote(id: string): Promise<number | null>;
  recordScan(scanType: string, query: string, score: number, riskLevel: string, summary: string): Promise<void>;
  getRecentScans(limit: number): Promise<ScanRecord[]>;
  getStats(): Promise<SystemStats>;
}
