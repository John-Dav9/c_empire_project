import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_GUARD } from '@nestjs/core';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './core/roles/roles.guard';
import { PermissionsGuard } from './core/permissions/permissions.guard';
import { AuditInterceptor } from './core/audit/audit.interceptor';

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
import { User } from './auth/entities/user.entity';
import { Profile } from './auth/entities/profile.entity';
import { RolesModule } from './core/roles/roles.module';
import { AdminModule } from './admin/admin.module';
import { SectorsModule } from './core/sectors/sectors.module';
import { TasksModule } from './tasks/tasks.module';
import { HighlightsModule } from './core/highlights/highlights.module';
import { SiteSettingsModule } from './core/site-settings/site-settings.module';

@Module({
  imports: [
    // ✅ Config .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV_FILE || join(process.cwd(), '.env'),
    }),

    // ✅ Rate limiting : 100 requêtes / 60s par IP (global)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // ms
        limit: 100,
      },
      // Limite plus stricte pour les routes sensibles (auth, payments)
      {
        name: 'strict',
        ttl: 60000,
        limit: 10,
      },
    ]),

    // ✅ Event emitter (découplage PaymentsModule ↔ modules métier)
    EventEmitterModule.forRoot(),

    // ✅ Seule connexion DB
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Profile],
      autoLoadEntities: true,
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
    // Guards globaux dans le bon ordre: JWT → Rôles → Permissions
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
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
