import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { GlobalExceptionFilter } from './core/filters/http-exception.filter';

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

  // ✅ Raw body pour webhooks
  app.use(
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    }),
  );

  // ✅ Préfixe API
  app.setGlobalPrefix('api');

  // ✅ Static uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // ✅ Global exception filter (réponses d'erreur standardisées)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ✅ Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ✅ CORS
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Swagger/OpenAPI (désactivé en production)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle("C'EMPIRE API")
      .setDescription(
        "API multi-services C'EMPIRE : Shop, Grill, Express, Clean, Events, Todo",
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .addTag('auth', 'Authentification & gestion des tokens')
      .addTag('profiles', 'Profils utilisateurs')
      .addTag('admin', 'Administration')
      .addTag('shop', 'C\'Shop — E-commerce')
      .addTag('grill', "C'Grill — Restauration")
      .addTag('express', "C'Express — Livraisons")
      .addTag('clean', "C'Clean — Nettoyage")
      .addTag('events', "C'Event — Événements")
      .addTag('todo', "C'Todo — Services à la demande")
      .addTag('payments', 'Paiements multi-provider')
      .addTag('highlights', 'Campagnes & actualités')
      .addTag('settings', 'Configuration du site')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    console.log('📚 Swagger UI: http://localhost:3000/api/docs');
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}
void bootstrap();
