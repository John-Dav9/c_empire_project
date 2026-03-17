import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { TaskPriority } from '../enums/task.enums';

export class CreateTaskDto {
  @IsString()
  @Length(2, 200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsUUID()
  assignedToId: string;

  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @IsOptional()
  dueDate?: Date;
}
