import { Inject, Injectable } from '@nestjs/common';
import { eq, and, gt } from 'drizzle-orm';
import { SqliteService } from '../../../shared/infrastructure/database/sqlite.service';
import { domainCacheTable } from '../../../shared/infrastructure/database/schema';
import type { IRdapGateway, RdapDomainInfo } from '../domain/inspection.ports';

@Injectable()
export class RdapGatewayAdapter implements IRdapGateway {
  constructor(@Inject(SqliteService) private readonly db: SqliteService) {}

  async lookupDomain(domain: string): Promise<RdapDomainInfo | null> {
    const rootDomain = domain.split('.').slice(-2).join('.');
    const cached = await this.getFromCache(rootDomain);
    if (cached) return cached;

    try {
      const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(rootDomain)}`, {
        headers: { Accept: 'application/rdap+json, application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) return null;

      const data = await response.json();
      let registrationDate: string | null = null;
      let expirationDate: string | null = null;

      if (Array.isArray(data.events)) {
        for (const ev of data.events) {
          if (ev.eventAction === 'registration') registrationDate = ev.eventDate;
          if (ev.eventAction === 'expiration') expirationDate = ev.eventDate;
        }
      }

      let ageDays: number | null = null;
      if (registrationDate) {
        const regTime = new Date(registrationDate).getTime();
        ageDays = Math.max(0, Math.floor((Date.now() - regTime) / (1000 * 60 * 60 * 24)));
      }

      let registrar = 'Inconnu';
      if (Array.isArray(data.entities)) {
        for (const entity of data.entities) {
          if (entity.roles && entity.roles.includes('registrar')) {
            registrar =
              entity.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] ||
              entity.handle ||
              'Registrar Déclaré';
          }
        }
      }

      const result: RdapDomainInfo = {
        domain: rootDomain,
        registrationDate,
        expirationDate,
        ageDays,
        registrar,
      };

      await this.saveToCache(rootDomain, result);
      return result;
    } catch {
      return null;
    }
  }

  private async getFromCache(domain: string): Promise<RdapDomainInfo | null> {
    try {
      await this.db.ensureReady();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      if (this.db.isPostgres && this.db.pgOrm) {
        const rows = await this.db.pgOrm
          .select()
          .from(domainCacheTable)
          .where(and(eq(domainCacheTable.domain, domain), gt(domainCacheTable.cachedAt, oneDayAgo)))
          .limit(1);

        const row = rows[0];
        if (!row) return null;
        return {
          domain: row.domain,
          ageDays: row.ageDays,
          registrationDate: row.registrationDate,
          expirationDate: row.expirationDate,
          registrar: row.registrar || 'Inconnu',
        };
      }

      if (this.db.sqliteClient) {
        const row = this.db.sqliteClient
          .prepare(
            `SELECT domain, age_days, registration_date, expiration_date, registrar
             FROM domain_cache WHERE domain = ? AND cached_at > ?`
          )
          .get(domain, oneDayAgo);

        if (!row) return null;
        return {
          domain: row.domain,
          ageDays: row.age_days !== null ? Number(row.age_days) : null,
          registrationDate: row.registration_date,
          expirationDate: row.expiration_date,
          registrar: row.registrar || 'Inconnu',
        };
      }
    } catch {
      // Ignore cache lookup errors
    }
    return null;
  }

  private async saveToCache(domain: string, data: RdapDomainInfo): Promise<void> {
    try {
      await this.db.ensureReady();
      const record = {
        domain,
        ageDays: data.ageDays ?? null,
        registrationDate: data.registrationDate ?? null,
        expirationDate: data.expirationDate ?? null,
        registrar: data.registrar ?? null,
        isHttps: 1,
        cachedAt: Date.now(),
      };

      if (this.db.isPostgres && this.db.pgOrm) {
        await this.db.pgOrm
          .insert(domainCacheTable)
          .values(record)
          .onConflictDoUpdate({
            target: domainCacheTable.domain,
            set: record,
          });
      } else if (this.db.sqliteClient) {
        this.db.sqliteClient
          .prepare(
            `INSERT INTO domain_cache (domain, age_days, registration_date, expiration_date, registrar, is_https, cached_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(domain) DO UPDATE SET
               age_days = excluded.age_days,
               registration_date = excluded.registration_date,
               expiration_date = excluded.expiration_date,
               registrar = excluded.registrar,
               is_https = excluded.is_https,
               cached_at = excluded.cached_at`
          )
          .run(
            record.domain,
            record.ageDays,
            record.registrationDate,
            record.expirationDate,
            record.registrar,
            record.isHttps,
            record.cachedAt
          );
      }
    } catch {
      // Ignore cache write errors
    }
  }
}
