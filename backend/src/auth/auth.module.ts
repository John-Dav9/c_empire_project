import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport/dist/passport.module';
import { JwtStrategy } from 'src/strategies/jwt.strategy';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Profile } from './entities/profile.entity';
import { EmailModule } from 'src/core/notifications/email/email.module';

@Module({
  imports: [
    // On lie l'entité User à TypeORM
    TypeOrmModule.forFeature([User, Profile]),
    ConfigModule,
    EmailModule,

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_SECRET');
        if (!secret) {
          throw new Error('JWT_ACCESS_SECRET is required');
        }
        return {
          secret,
          signOptions: {
            expiresIn: '15m',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
