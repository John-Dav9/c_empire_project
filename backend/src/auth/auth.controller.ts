import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { SignupDto } from 'src/dto/signup.dto';
import { SigninDto } from 'src/dto/signin.dto';
import { ForgotPasswordDto } from 'src/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/dto/reset-password.dto';
import { Roles } from 'src/core/roles/roles.decorator';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { RefreshTokenDto } from 'src/dto/refresh-token.dto';
import type { AuthUser } from 'src/interfaces/auth-user.interface';
import { UserRole } from './enums/user-role.enum';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @Get('reset-password/validate')
  validateResetPasswordToken(@Query('token') token: string) {
    return this.authService.validateResetPasswordToken(token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin-only')
  adminOnly(@CurrentUser() user: AuthUser) {
    return {
      message: 'Bienvenue sur une route réservée aux administrateurs.',
      user,
    };
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }
}
