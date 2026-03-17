// src/core/roles/roles.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { RolesGuard } from './roles.guard';
import { User } from 'src/auth/entities/user.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User])],
  providers: [RolesService, RolesGuard],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
