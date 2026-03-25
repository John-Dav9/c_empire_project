import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core'; // Token pour enregistrer un guard globalement
import { APP_INTERCEPTOR } from '@nestjs/core'; // Token pour enregistrer un intercepteur globalement
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Vérifie le JWT sur chaque route protégée
import { RolesGuard } from './core/roles/roles.guard'; // Vérifie le rôle (admin, super_admin, etc.)
import { PermissionsGuard } from './core/permissions/permissions.guard'; // Vérifie les permissions fines
import { AuditInterceptor } from './core/audit/audit.interceptor'; // Journalise les actions sensibles

// Modules fonctionnels
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './core/notifications/notifications.module';
import { TodoModule } from './todo/todo.module';
import { CexpressModule } from './express/express.module';
import { GrillModule } from './grill/grill.module';
import { SharedModule } from './shared/shared.module';
import { CshopModule } from './shop/shop.module';
import { PaymentsModule } from './core/payments/payments.module';
import { CEventModule } from './events/events.module';
import { CCleanModule } from './clean/clean.module';
import { HealthController } from './health/health.controller';
import { User } from './auth/entities/user.entity'; // Entité listée explicitement pour TypeORM
import { Profile } from './auth/entities/profile.entity';
import { RolesModule } from './core/roles/roles.module';
import { AdminModule } from './admin/admin.module';
import { SectorsModule } from './core/sectors/sectors.module';
import { TasksModule } from './tasks/tasks.module';
import { HighlightsModule } from './core/highlights/highlights.module';
import { SiteSettingsModule } from './core/site-settings/site-settings.module';

@Module({
  imports: [
    // ✅ Config .env — rend les variables d'environnement accessibles via process.env partout
    ConfigModule.forRoot({
      isGlobal: true, // Pas besoin d'importer ConfigModule dans chaque sous-module
      envFilePath: process.env.ENV_FILE || join(process.cwd(), '.env'),
    }),

    // ✅ Rate limiting — limite le nombre de requêtes par IP pour éviter les abus
    ThrottlerModule.forRoot([
      {
        name: 'default', // Profil normal : 100 requêtes max par minute
        ttl: 60000, // Fenêtre de 60 secondes (en ms)
        limit: 100, // Nombre max de requêtes dans la fenêtre
      },
      // Profil strict pour les routes sensibles (auth, payments) — appliqué avec @Throttle('strict')
      {
        name: 'strict',
        ttl: 60000,
        limit: 10, // Seulement 10 tentatives par minute (ex: signin, forgot-password)
      },
    ]),

    // ✅ Event emitter — découplage entre PaymentsModule et les modules métier
    // Exemple : après un paiement réussi, PaymentsService émet 'payment.success'
    // et chaque module (OrderService, GrillOrdersService, etc.) réagit indépendamment via @OnEvent
    EventEmitterModule.forRoot(),

    // ✅ Connexion PostgreSQL via TypeORM — unique point de connexion à la base de données
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Profile], // Entités explicites (les autres sont chargées via autoLoadEntities)
      autoLoadEntities: true, // Charge automatiquement toutes les entités déclarées dans les modules
      // En dev : synchronize=true crée/modifie les tables automatiquement
      // En prod : synchronize=false — les migrations sont gérées manuellement pour éviter la perte de données
      synchronize: process.env.NODE_ENV !== 'production',
    }),

    AuthModule,
    UsersModule,
    PaymentsModule,
    NotificationsModule,
    CEventModule,
    CshopModule,
    TodoModule,
    CCleanModule,
    CexpressModule,
    GrillModule,
    SharedModule,
    RolesModule,
    AdminModule,
    SectorsModule,
    HighlightsModule,
    SiteSettingsModule,
    TasksModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    // Guards appliqués à TOUTES les routes dans l'ordre suivant :
    // 1. JwtAuthGuard — décode et valide le token JWT (marque les routes @Public() pour les exclure)
    // 2. RolesGuard — vérifie que l'utilisateur a le rôle requis (@Roles('admin', 'super_admin'))
    // 3. PermissionsGuard — vérifie les permissions granulaires si définies
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // Intercepteur global — journalise toutes les requêtes mutantes (POST/PATCH/DELETE)
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
