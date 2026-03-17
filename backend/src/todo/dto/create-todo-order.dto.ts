// src/sectors/c-todo/dto/create-todo-order.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTodoOrderDto {
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  phone?: string;

  @IsUUID()
  todoServiceId: string;

  @IsNotEmpty()
  serviceTitle: string;

  @IsOptional()
  instructions?: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  scheduledAt: Date;
}
