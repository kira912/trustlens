import { pgTable, text, integer, bigint, index } from 'drizzle-orm/pg-core';

export const scamReportsTable = pgTable(
  'scam_reports',
  {
    id: text('id').primaryKey(),
    targetType: text('target_type').notNull(),
    targetValue: text('target_value').notNull(),
    platform: text('platform').notNull(),
    sellerAlias: text('seller_alias'),
    scamType: text('scam_type').notNull(),
    description: text('description').notNull(),
    severity: text('severity').notNull().default('HIGH'),
    upvotes: integer('upvotes').notNull().default(1),
    reportedAt: text('reported_at').notNull(),
  },
  (table) => [
    index('idx_scam_type').on(table.targetType),
    index('idx_scam_value').on(table.targetValue),
  ]
);

export const scanHistoryTable = pgTable(
  'scan_history',
  {
    id: text('id').primaryKey(),
    scanType: text('scan_type').notNull(),
    query: text('query').notNull(),
    score: integer('score').notNull(),
    riskLevel: text('risk_level').notNull(),
    summary: text('summary'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_scan_history_date').on(table.createdAt)]
);

export const domainCacheTable = pgTable('domain_cache', {
  domain: text('domain').primaryKey(),
  ageDays: integer('age_days'),
  registrationDate: text('registration_date'),
  expirationDate: text('expiration_date'),
  registrar: text('registrar'),
  isHttps: integer('is_https'),
  cachedAt: bigint('cached_at', { mode: 'number' }).notNull(),
});
