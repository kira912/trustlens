import { Inject, Injectable } from '@nestjs/common';
import { eq, desc, sql, and, like, inArray, count } from 'drizzle-orm';
import { SqliteService } from '../../../shared/infrastructure/database/sqlite.service';
import {
  scamReportsTable,
  scanHistoryTable,
} from '../../../shared/infrastructure/database/schema';
import type {
  IScamReportRepository,
  CreateScamReportProps,
  ScanRecord,
  SystemStats,
} from '../domain/scam-report.repository';
import { ScamReportEntity, TargetType } from '../domain/scam-report.entity';

@Injectable()
export class SqliteScamReportRepository implements IScamReportRepository {
  constructor(@Inject(SqliteService) private readonly db: SqliteService) {}

  async findAll(query?: string, type?: string, platform?: string): Promise<ScamReportEntity[]> {
    await this.db.ensureReady();

    let rows: Array<{
      id: string;
      targetType: string;
      targetValue: string;
      platform: string;
      sellerAlias: string | null;
      scamType: string;
      description: string;
      severity: string;
      upvotes: number;
      reportedAt: string;
    }> = [];

    if (this.db.isPostgres && this.db.pgOrm) {
      const conditions = [];

      if (type && type !== 'all') {
        conditions.push(eq(scamReportsTable.targetType, type));
      }

      if (platform) {
        conditions.push(
          like(sql`LOWER(${scamReportsTable.platform})`, `%${platform.toLowerCase()}%`)
        );
      }

      rows = await this.db.pgOrm
        .select()
        .from(scamReportsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(scamReportsTable.reportedAt));
    } else if (this.db.sqliteClient) {
      const clauses: string[] = [];
      const params: any[] = [];

      if (type && type !== 'all') {
        clauses.push('target_type = ?');
        params.push(type);
      }
      if (platform) {
        clauses.push('LOWER(platform) LIKE ?');
        params.push(`%${platform.toLowerCase()}%`);
      }

      const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
      const rawRows = this.db.sqliteClient
        .prepare(
          `SELECT id, target_type, target_value, platform, seller_alias, scam_type, description, severity, upvotes, reported_at
           FROM scam_reports ${whereSql} ORDER BY reported_at DESC`
        )
        .all(...params);

      rows = rawRows.map((r: any) => ({
        id: r.id,
        targetType: r.target_type,
        targetValue: r.target_value,
        platform: r.platform,
        sellerAlias: r.seller_alias,
        scamType: r.scam_type,
        description: r.description,
        severity: r.severity,
        upvotes: Number(r.upvotes),
        reportedAt: r.reported_at,
      }));
    }

    if (query && query.trim()) {
      const search = query.toLowerCase().trim();
      rows = rows.filter((r) => {
        const val = r.targetValue.toLowerCase();
        const phoneMatch = ScamReportEntity.matchesPhoneSearch(val, search);
        return (
          val.includes(search) ||
          phoneMatch ||
          (r.sellerAlias && r.sellerAlias.toLowerCase().includes(search)) ||
          r.scamType.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search)
        );
      });
    }

    return rows.map(
      (r) =>
        new ScamReportEntity(
          r.id,
          r.targetType as TargetType,
          r.targetValue,
          r.platform,
          r.sellerAlias || '',
          r.scamType,
          r.description,
          r.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM',
          r.upvotes,
          r.reportedAt
        )
    );
  }

  async create(props: CreateScamReportProps): Promise<ScamReportEntity> {
    await this.db.ensureReady();

    const id = `report-${Date.now()}`;
    const reportedAt = new Date().toISOString();
    const record = {
      id,
      targetType: props.targetType,
      targetValue: props.targetValue.trim(),
      platform: props.platform || 'Autre',
      sellerAlias: (props.sellerAlias || '').trim(),
      scamType: props.scamType.trim(),
      description: props.description.trim(),
      severity: 'HIGH' as const,
      upvotes: 1,
      reportedAt,
    };

    if (this.db.isPostgres && this.db.pgOrm) {
      await this.db.pgOrm.insert(scamReportsTable).values(record);
    } else if (this.db.sqliteClient) {
      this.db.sqliteClient
        .prepare(
          `INSERT INTO scam_reports (id, target_type, target_value, platform, seller_alias, scam_type, description, severity, upvotes, reported_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          record.id,
          record.targetType,
          record.targetValue,
          record.platform,
          record.sellerAlias,
          record.scamType,
          record.description,
          record.severity,
          record.upvotes,
          record.reportedAt
        );
    }

    return new ScamReportEntity(
      record.id,
      record.targetType,
      record.targetValue,
      record.platform,
      record.sellerAlias,
      record.scamType,
      record.description,
      record.severity,
      record.upvotes,
      record.reportedAt
    );
  }

  async incrementUpvote(id: string): Promise<number | null> {
    await this.db.ensureReady();

    if (this.db.isPostgres && this.db.pgOrm) {
      const updated = await this.db.pgOrm
        .update(scamReportsTable)
        .set({ upvotes: sql`${scamReportsTable.upvotes} + 1` })
        .where(eq(scamReportsTable.id, id))
        .returning({ upvotes: scamReportsTable.upvotes });

      return updated[0] ? updated[0].upvotes : null;
    }

    if (this.db.sqliteClient) {
      this.db.sqliteClient
        .prepare(`UPDATE scam_reports SET upvotes = upvotes + 1 WHERE id = ?`)
        .run(id);
      const row = this.db.sqliteClient
        .prepare(`SELECT upvotes FROM scam_reports WHERE id = ?`)
        .get(id);
      return row ? Number(row.upvotes) : null;
    }

    return null;
  }

  async recordScan(
    scanType: string,
    query: string,
    score: number,
    riskLevel: string,
    summary: string
  ): Promise<void> {
    await this.db.ensureReady();

    const id = `scan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();

    if (this.db.isPostgres && this.db.pgOrm) {
      await this.db.pgOrm.insert(scanHistoryTable).values({
        id,
        scanType,
        query,
        score,
        riskLevel,
        summary: summary || '',
        createdAt,
      });
    } else if (this.db.sqliteClient) {
      this.db.sqliteClient
        .prepare(
          `INSERT INTO scan_history (id, scan_type, query, score, risk_level, summary, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(id, scanType, query, score, riskLevel, summary || '', createdAt);
    }
  }

  async getRecentScans(limit: number): Promise<ScanRecord[]> {
    await this.db.ensureReady();

    if (this.db.isPostgres && this.db.pgOrm) {
      const rows = await this.db.pgOrm
        .select()
        .from(scanHistoryTable)
        .orderBy(desc(scanHistoryTable.createdAt))
        .limit(limit);

      return rows.map((r) => ({
        id: r.id,
        scanType: r.scanType,
        query: r.query,
        score: r.score,
        riskLevel: r.riskLevel,
        summary: r.summary || '',
        createdAt: r.createdAt,
      }));
    }

    if (this.db.sqliteClient) {
      const rows = this.db.sqliteClient
        .prepare(
          `SELECT id, scan_type, query, score, risk_level, summary, created_at
           FROM scan_history ORDER BY created_at DESC LIMIT ?`
        )
        .all(limit);

      return rows.map((r: any) => ({
        id: r.id,
        scanType: r.scan_type,
        query: r.query,
        score: Number(r.score),
        riskLevel: r.risk_level,
        summary: r.summary || '',
        createdAt: r.created_at,
      }));
    }

    return [];
  }

  async getStats(): Promise<SystemStats> {
    await this.db.ensureReady();

    if (this.db.isPostgres && this.db.pgOrm) {
      const [reportsRes, scansRes, threatsRes] = await Promise.all([
        this.db.pgOrm.select({ value: count() }).from(scamReportsTable),
        this.db.pgOrm.select({ value: count() }).from(scanHistoryTable),
        this.db.pgOrm
          .select({ value: count() })
          .from(scanHistoryTable)
          .where(inArray(scanHistoryTable.riskLevel, ['DANGER', 'WARNING'])),
      ]);

      return {
        totalReports: Number(reportsRes[0]?.value ?? 0),
        totalScans: Number(scansRes[0]?.value ?? 0),
        threatsNeutralized: Number(threatsRes[0]?.value ?? 0),
      };
    }

    if (this.db.sqliteClient) {
      const totalReports = Number(
        this.db.sqliteClient.prepare(`SELECT COUNT(*) as value FROM scam_reports`).get()?.value ?? 0
      );
      const totalScans = Number(
        this.db.sqliteClient.prepare(`SELECT COUNT(*) as value FROM scan_history`).get()?.value ?? 0
      );
      const threats = Number(
        this.db.sqliteClient
          .prepare(
            `SELECT COUNT(*) as value FROM scan_history WHERE risk_level IN ('DANGER', 'WARNING')`
          )
          .get()?.value ?? 0
      );

      return {
        totalReports,
        totalScans,
        threatsNeutralized: threats,
      };
    }

    return {
      totalReports: 0,
      totalScans: 0,
      threatsNeutralized: 0,
    };
  }
}
