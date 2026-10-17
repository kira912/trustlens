import type { Config } from 'drizzle-kit';

export default {
  schema: './server/shared/infrastructure/database/schema.ts',
  out: './server/shared/infrastructure/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
  },
} satisfies Config;
