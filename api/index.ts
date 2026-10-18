import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../server/app.module';
import { GlobalExceptionFilter } from '../server/shared/infrastructure/http/http-exception.filter';

let cachedServer: any = null;
let initError: any = null;

async function bootstrapServerless() {
  if (cachedServer) return cachedServer;
  if (initError) throw initError;

  try {
    console.log('[Serverless] Démarrage du serveur NestJS...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });
    app.enableCors();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
    console.log('[Serverless] Initialisation réussie de NestJS.');
    return cachedServer;
  } catch (err) {
    console.error('[Serverless Error] Échec lors de l’initialisation de NestJS:', err);
    initError = err;
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const server = await bootstrapServerless();
    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      server(req, res, (err: any) => {
        if (err) {
          console.error('[Serverless Handler] Erreur Express:', err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  } catch (err: any) {
    console.error('[Serverless Fatal Error]:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Erreur d’initialisation de l’API Serverless',
          message: err?.message || String(err),
          name: err?.name,
          stack: err?.stack,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }
}
