import { Injectable, OnModuleInit } from '@nestjs/common';
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import * as schema from './schema';

export interface LowLevelSqliteStatement {
  run(...params: any[]): any;
  all(...params: any[]): any[];
  get(...params: any[]): any;
}

export interface LowLevelSqliteClient {
  run(sqlText: string): void;
  exec(sqlText: string): void;
  prepare(sqlText: string): LowLevelSqliteStatement;
}

function createLowLevelSqliteClient(dbPath: string): LowLevelSqliteClient | null {
  try {
    const req = createRequire(import.meta.url);
    const isBun = typeof (globalThis as any).Bun !== 'undefined';

    if (isBun) {
      const bunSqliteMod = 'bun:' + 'sqlite';
      const { Database } = req(bunSqliteMod);
      const rawDb = new Database(dbPath);
      return {
        run: (q: string) => rawDb.run(q),
        exec: (q: string) => rawDb.exec(q),
        prepare: (q: string) => {
          const stmt = rawDb.prepare(q);
          return {
            run: (...params: any[]) => stmt.run(...params),
            all: (...params: any[]) => stmt.all(...params),
            get: (...params: any[]) => stmt.get(...params),
          };
        },
      };
    }

    const nodeSqliteMod = 'node:' + 'sqlite';
    const { DatabaseSync } = req(nodeSqliteMod);
    const rawDb = new DatabaseSync(dbPath);
    return {
      run: (q: string) => rawDb.exec(q),
      exec: (q: string) => rawDb.exec(q),
      prepare: (q: string) => {
        const stmt = rawDb.prepare(q);
        return {
          run: (...params: any[]) => {
            stmt.setReturnArrays(false);
            return stmt.run(...params);
          },
          all: (...params: any[]) => {
            stmt.setReturnArrays(false);
            return stmt.all(...params);
          },
          get: (...params: any[]) => {
            stmt.setReturnArrays(false);
            return stmt.get(...params);
          },
        };
      },
    };
  } catch (err) {
    console.warn('SQLite fallback non disponible dans cet environnement:', err);
    return null;
  }
}

function resolveSqliteFallbackPath(): string {
  if (process.env.SQLITE_DB_PATH) {
    return process.env.SQLITE_DB_PATH;
  }

  const isServerless = Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NOW_REGION
  );

  if (isServerless) {
    return path.join(os.tmpdir(), 'trustlens.db');
  }

  try {
    const dataDir = path.join(process.cwd(), 'server', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'trustlens.db');
  } catch {
    return path.join(os.tmpdir(), 'trustlens.db');
  }
}

export function getPostgresConnectionString(): string | null {
  const url =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_UNPOOLED;
  return url && url.trim().length > 0 ? url.trim() : null;
}

const SCHEMA_DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS scam_reports (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_value TEXT NOT NULL,
    platform TEXT NOT NULL,
    seller_alias TEXT,
    scam_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'HIGH',
    upvotes INTEGER NOT NULL DEFAULT 1,
    reported_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_scam_type ON scam_reports(target_type);`,
  `CREATE INDEX IF NOT EXISTS idx_scam_value ON scam_reports(target_value);`,
  `CREATE TABLE IF NOT EXISTS scan_history (
    id TEXT PRIMARY KEY,
    scan_type TEXT NOT NULL,
    query TEXT NOT NULL,
    score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    summary TEXT,
    created_at TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_scan_history_date ON scan_history(created_at DESC);`,
  `CREATE TABLE IF NOT EXISTS domain_cache (
    domain TEXT PRIMARY KEY,
    age_days INTEGER,
    registration_date TEXT,
    expiration_date TEXT,
    registrar TEXT,
    is_https INTEGER,
    cached_at BIGINT NOT NULL
  );`,
];

@Injectable()
export class SqliteService implements OnModuleInit {
  public readonly isPostgres: boolean;
  public readonly pgOrm: PostgresJsDatabase<typeof schema> | null = null;
  public readonly sqliteClient: LowLevelSqliteClient | null = null;
  private readonly pgClient: ReturnType<typeof postgres> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    const pgUrl = getPostgresConnectionString();

    if (pgUrl) {
      this.isPostgres = true;
      try {
        const needsSsl =
          pgUrl.includes('sslmode=require') ||
          pgUrl.includes('neon.tech') ||
          pgUrl.includes('vercel-storage.com') ||
          pgUrl.includes('supabase.co') ||
          Boolean(process.env.VERCEL);

        this.pgClient = postgres(pgUrl, {
          ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
          max: process.env.VERCEL ? 3 : 10,
          idle_timeout: 20,
          connect_timeout: 10,
          prepare: false,
        });
        this.pgOrm = drizzle(this.pgClient, { schema });
      } catch (err) {
        console.error('Erreur lors de l’initialisation du client PostgreSQL:', err);
      }
    } else {
      this.isPostgres = false;
      const dbPath = resolveSqliteFallbackPath();
      this.sqliteClient = createLowLevelSqliteClient(dbPath);
      this.initSqliteFallback();
    }
  }

  async onModuleInit() {
    await this.ensureReady();
  }

  async ensureReady(): Promise<void> {
    if (!this.isPostgres) {
      return;
    }
    if (!this.initPromise) {
      this.initPromise = this.initPostgresSchema().catch((err) => {
        console.error('Erreur lors de la préparation de la base PostgreSQL:', err);
        this.initPromise = null;
      });
    }
    await this.initPromise;
  }

  private async initPostgresSchema(): Promise<void> {
    if (!this.pgClient) return;
    for (const ddl of SCHEMA_DDL_STATEMENTS) {
      try {
        await this.pgClient.unsafe(ddl);
      } catch (err) {
        console.warn('Avertissement DDL PostgreSQL (statement ignoré):', err);
      }
    }
  }

  private initSqliteFallback(): void {
    if (!this.sqliteClient) return;
    try {
      this.sqliteClient.run('PRAGMA journal_mode = WAL;');
      this.sqliteClient.run('PRAGMA synchronous = NORMAL;');
    } catch {
      // Ignore PRAGMA errors on restricted filesystems
    }
    for (const ddl of SCHEMA_DDL_STATEMENTS) {
      try {
        this.sqliteClient.run(ddl);
      } catch (err) {
        console.warn('Avertissement DDL SQLite:', err);
      }
    }
  }
}
