import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigins = (
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  // ✅ Raw body si tu en as besoin (webhooks)
  app.use(
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }),
  );

  // ✅ Préfixe API
  app.setGlobalPrefix('api');

  // Static uploads (images secteurs, etc.)
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ CORS (ok en dev)
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}
void bootstrap();
