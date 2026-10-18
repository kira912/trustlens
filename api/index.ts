import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../server/app.module';
import { GlobalExceptionFilter } from '../server/shared/infrastructure/http/http-exception.filter';

let cachedServer: any = null;

async function bootstrapServerless() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn'],
    });
    app.enableCors();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  try {
    const server = await bootstrapServerless();
    return server(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Erreur lors de l’initialisation du serveur d’API',
        message: err?.message || String(err),
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
        timestamp: new Date().toISOString(),
      })
    );
  }
}
