import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelayPoint } from './relay-point.entity';
import { RelayPointService } from './relay-point.service';
import { RelayPointController } from './relay-point.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RelayPoint])],
  controllers: [RelayPointController],
  providers: [RelayPointService],
  exports: [RelayPointService],
})
export class RelayPointModule {}
