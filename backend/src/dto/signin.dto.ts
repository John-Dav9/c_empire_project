import { Transform } from 'class-transformer';
import { IsEmail, MinLength } from 'class-validator';

export class SigninDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}
