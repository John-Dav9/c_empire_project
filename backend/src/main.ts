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

  // Lit les origines frontend autorisées depuis la variable d'env (plusieurs valeurs séparées par virgule)
  // Ex: FRONTEND_ORIGIN=https://c-empire.vercel.app,https://c-empire-preview.vercel.app
  const frontendOrigins = (
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const isProduction = process.env.NODE_ENV === 'production';

  // ✅ CORS configuré EN PREMIER — doit précéder tous les autres middlewares pour traiter les preflight OPTIONS
  app.enableCors({
    origin: isProduction
      // En prod : seules les origines listées dans FRONTEND_ORIGIN sont autorisées
      ? frontendOrigins
      // En dev : accepte tout localhost/127.0.0.1 sur n'importe quel port (4200, 4201, etc.)
      // Cela évite les erreurs CORS quand Angular tourne sur un port différent de 4200
      : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          if (
            !origin || // Requêtes sans Origin (Postman, Swagger, curl)
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || // Tout localhost/127.0.0.1
            frontendOrigins.includes(origin) // Origines explicitement configurées
          ) {
            callback(null, true);
          } else {
            callback(new Error(`CORS: origine non autorisée — ${origin}`));
          }
        },
    credentials: true, // Nécessaire pour envoyer les cookies et headers Authorization
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Logger des requêtes en dev uniquement (trop verbeux en prod)
  if (!isProduction) {
    app.use((req: Request, _res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  // ✅ Préservation du corps brut (rawBody) pour vérification des signatures webhook
  // Stripe et autres providers signent le corps brut — le parser JSON standard l'efface
  app.use(
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = Buffer.from(buf); // Disponible dans req.rawBody pour WebhookVerifier
      },
    }),
  );

  // ✅ Toutes les routes sont préfixées par /api (ex: /api/auth/signin, /api/cshop/products)
  app.setGlobalPrefix('api');

  // ✅ Sert les fichiers uploadés (images produits, avatars, etc.) comme fichiers statiques
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // ✅ Filtre global d'exceptions → format de réponse d'erreur standardisé pour tous les endpoints
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ✅ Validation globale des DTOs entrants
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Supprime les propriétés non déclarées dans les DTOs
      forbidNonWhitelisted: true, // Retourne une erreur 400 si des propriétés inconnues sont envoyées
      transform: true,            // Transforme les types automatiquement (string → number, etc.)
    }),
  );

  // ✅ Documentation interactive Swagger — disponible uniquement en dev à /api/docs
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle("C'EMPIRE API")
      .setDescription(
        "API multi-services C'EMPIRE : Shop, Grill, Express, Clean, Events, Todo",
      )
      .setVersion('1.0')
      // Active l'authentification Bearer JWT dans l'interface Swagger
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
        persistAuthorization: true, // Garde le token JWT entre les rechargements de page Swagger
      },
    });

    console.log('📚 Swagger UI: http://localhost:3000/api/docs');
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api`);
}
void bootstrap(); // Démarre l'application (void supprime le warning "floating promise")
