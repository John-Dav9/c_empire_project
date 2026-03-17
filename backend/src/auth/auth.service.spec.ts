import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ObjectLiteral, Repository } from 'typeorm';

import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { EmailService } from 'src/core/notifications/email/email.service';

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('AuthService', () => {
  const originalAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

  let userRepository: MockRepo<User>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let emailService: Partial<Record<keyof EmailService, jest.Mock>>;
  let service: AuthService;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };
    emailService = {
      isConfigured: jest.fn().mockReturnValue(false),
      sendPasswordResetEmail: jest.fn(),
    };

    service = new AuthService(
      userRepository as unknown as Repository<User>,
      jwtService as unknown as JwtService,
      emailService as unknown as EmailService,
    );
  });

  afterAll(() => {
    process.env.JWT_ACCESS_SECRET = originalAccessSecret;
    process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  });

  it('signup should create an account and return tokens', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'Secret123!',
      firstname: 'Jane',
      lastname: 'Doe',
      phone: '123',
    };

    userRepository.findOne!.mockResolvedValue(null);
    userRepository.create!.mockImplementation((value: Partial<User>) => value);
    userRepository
      .save!.mockResolvedValueOnce({
        id: 'user-1',
        email: dto.email,
        password: 'hashed-password',
        role: UserRole.CLIENT,
        isActive: true,
      })
      .mockResolvedValueOnce({
        id: 'user-1',
        email: dto.email,
        password: 'hashed-password',
        role: UserRole.CLIENT,
        isActive: true,
        refreshTokenHash: 'hashed-refresh-token',
      });
    jwtService
      .signAsync!.mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.signup(dto);

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).toEqual({
      userId: 'user-1',
      email: dto.email,
      role: UserRole.CLIENT,
    });
    expect(userRepository.save).toHaveBeenCalledTimes(2);
  });

  it('signin should reject invalid password', async () => {
    const hashedPassword = await bcrypt.hash('valid-password', 10);
    userRepository.findOne!.mockResolvedValue({
      id: 'u-1',
      email: 'user@example.com',
      password: hashedPassword,
      role: UserRole.CLIENT,
      isActive: true,
    });

    await expect(
      service.signin({ email: 'user@example.com', password: 'invalid' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requestPasswordReset should not expose token', async () => {
    const user = {
      id: 'u-1',
      email: 'user@example.com',
      password: 'hash',
      role: UserRole.CLIENT,
      isActive: true,
    } as User;
    userRepository.findOne!.mockResolvedValue(user);
    userRepository.save!.mockResolvedValue(user);

    const result = await service.requestPasswordReset({ email: user.email });

    expect(result).toEqual(
      expect.objectContaining({
        message:
          'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
        devResetUrl: expect.stringContaining('/auth/reset-password?token='),
      }),
    );
    expect(userRepository.save).toHaveBeenCalled();
  });

  it('requestPasswordReset should send an email when mail transport is configured', async () => {
    const user = {
      id: 'u-1',
      email: 'user@example.com',
      password: 'hash',
      role: UserRole.CLIENT,
      isActive: true,
    } as User;
    userRepository.findOne!.mockResolvedValue(user);
    userRepository.save!.mockResolvedValue(user);
    emailService.isConfigured = jest.fn().mockReturnValue(true);
    emailService.sendPasswordResetEmail = jest
      .fn()
      .mockResolvedValue(undefined);

    const result = await service.requestPasswordReset({ email: user.email });

    expect(result).toEqual({
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    });
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      user.email,
      expect.stringContaining('/auth/reset-password?token='),
      expect.any(Date),
    );
  });

  it('validateResetPasswordToken should report invalid for unknown token', async () => {
    userRepository.findOne!.mockResolvedValue(null);

    await expect(
      service.validateResetPasswordToken('missing-token'),
    ).resolves.toEqual({ valid: false });
  });

  it('refreshTokens should reject invalid token', async () => {
    jwtService.verifyAsync!.mockRejectedValue(
      new BadRequestException('invalid'),
    );

    await expect(
      service.refreshTokens({ refreshToken: 'bad-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
