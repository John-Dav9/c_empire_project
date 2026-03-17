import { IsEnum, IsUUID } from 'class-validator';
import { UserRole } from 'src/auth/enums/user-role.enum';

export class UpdateUserRoleDto {
  @IsUUID()
  userId: string;

  @IsEnum(UserRole)
  role: UserRole;
}
