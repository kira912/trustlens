import { Module, Controller, Get, Inject } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseModule } from './shared/infrastructure/database/database.module';
import { SqliteService } from './shared/infrastructure/database/sqlite.service';
import { CommunityWatchModule } from './modules/community-watch/community-watch.module';
import { CompanyRegistryModule } from './modules/company-registry/company-registry.module';
import { ScamDetectionModule } from './modules/scam-detection/scam-detection.module';

@Controller('api')
export class HealthController {
  constructor(@Inject(SqliteService) private readonly db: SqliteService) {}

  @Get('health')
  check() {
    return {
      status: 'ok',
      service: 'TrustLens NestJS Clean Architecture API',
      version: '2.0.0',
      database: this.db.isPostgres ? 'PostgreSQL (Drizzle ORM)' : 'SQLite Local Fallback',
      environment: process.env.VERCEL ? 'vercel-serverless' : 'standalone',
      time: new Date().toISOString(),
    };
  }
}

const distPath = path.join(process.cwd(), 'dist');
const shouldServeStatic = !process.env.VERCEL && fs.existsSync(distPath);

@Module({
  imports: [
    ...(shouldServeStatic
      ? [
          ServeStaticModule.forRoot({
            rootPath: distPath,
            exclude: ['/api/(.*)'],
          }),
        ]
      : []),
    DatabaseModule,
    CommunityWatchModule,
    CompanyRegistryModule,
    ScamDetectionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
