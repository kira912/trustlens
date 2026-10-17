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
  const server = await bootstrapServerless();
  return server(req, res);
}
