import {
  CanActivate,
  Controller,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { CartController } from '../src/shop/cart/cart.controller';
import { CartService } from '../src/shop/cart/cart.service';
import { OrderController } from '../src/shop/order/order.controller';
import { OrderService } from '../src/shop/order/order.service';
import { PaymentsController } from '../src/core/payments/payments.controller';
import { PaymentsService } from '../src/core/payments/payments.service';
import { ReviewController } from '../src/shop/review/review.controller';
import { ReviewService } from '../src/shop/review/review.service';
import { JwtAuthGuard } from '../src/guards/jwt-auth.guard';
import { RolesGuard } from '../src/core/roles/roles.guard';
import { IS_PUBLIC_KEY } from '../src/auth/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../src/core/permissions/permissions.decorator';
import { ROLES_KEY } from '../src/core/roles/roles.decorator';
import { UserRole } from '../src/auth/enums/user-role.enum';

type TestUser = {
  userId: string;
  id: string;
  sub: string;
  email: string;
  role: UserRole;
};

@Injectable()
class TestJwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: TestUser;
    }>();
    const authHeader = String(request.headers.authorization || '').trim();
    if (authHeader !== 'Bearer test-token') {
      throw new UnauthorizedException();
    }

    request.user = {
      userId: 'user-1',
      id: 'user-1',
      sub: 'user-1',
      email: 'user@example.com',
      role: UserRole.CLIENT,
    };
    return true;
  }
}

@Injectable()
class TestRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: TestUser }>();
    return requiredRoles.includes(request.user?.role ?? '');
  }
}

@Injectable()
class TestPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    return (
      String(request.headers.authorization || '').trim() === 'Bearer test-token'
    );
  }
}

describe('HTTP integration (e2e)', () => {
  let app: INestApplication;

  const authService = {
    signup: jest.fn(),
    signin: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    validateResetPasswordToken: jest.fn(),
    refreshTokens: jest.fn(),
  };
  const cartService = {
    getUserCart: jest.fn(),
    addToCart: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
  };
  const orderService = {
    checkout: jest.fn(),
    findUserOrders: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };
  const paymentsService = {
    initPayment: jest.fn(),
    verify: jest.fn(),
    handleWebhook: jest.fn(),
  };
  const reviewService = {
    create: jest.fn(),
    findByProduct: jest.fn(),
    findUserReviews: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setVisibility: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    authService.signup.mockResolvedValue({
      message: 'Compte créé avec succès.',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { userId: 'user-1', email: 'user@example.com', role: 'client' },
    });
    authService.signin.mockResolvedValue({
      message: 'Connexion réussie.',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { userId: 'user-1', email: 'user@example.com', role: 'client' },
    });
    authService.requestPasswordReset.mockResolvedValue({
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    });
    authService.resetPassword.mockResolvedValue({
      message: 'Mot de passe réinitialisé avec succès.',
    });
    authService.validateResetPasswordToken.mockResolvedValue({ valid: true });
    cartService.getUserCart.mockResolvedValue({
      id: 'cart-1',
      totalAmount: 24000,
      items: [
        {
          id: 'cart-item-1',
          productId: '11111111-1111-4111-8111-111111111111',
          productName: 'Produit A',
          unitPrice: 12000,
          quantity: 2,
        },
      ],
    });
    cartService.addToCart.mockResolvedValue({
      id: 'cart-1',
      totalAmount: 12000,
      items: [
        {
          id: 'cart-item-1',
          productId: '11111111-1111-4111-8111-111111111111',
          productName: 'Produit A',
          unitPrice: 12000,
          quantity: 1,
        },
      ],
    });
    orderService.checkout.mockResolvedValue({
      id: 'order-1',
      totalAmount: 12000,
      deliveryFee: 0,
      status: 'pending',
    });
    paymentsService.initPayment.mockResolvedValue({
      paymentId: 'payment-1',
      providerTransactionId: 'txn-1',
      provider: 'stripe',
      amount: 12000,
      currency: 'XAF',
      redirectUrl: null,
      instructions: null,
    });
    reviewService.findByProduct.mockResolvedValue([
      { id: 'review-1', productId: 'product-1', rating: 5, comment: 'Top' },
    ]);

    const moduleBuilder = Test.createTestingModule({
      controllers: [
        AuthController,
        CartController,
        OrderController,
        PaymentsController,
        ReviewController,
      ],
      providers: [
        Reflector,
        { provide: AuthService, useValue: authService },
        { provide: CartService, useValue: cartService },
        { provide: OrderService, useValue: orderService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: ReviewService, useValue: reviewService },
        { provide: APP_GUARD, useClass: TestPermissionsGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(TestRolesGuard);

    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('handles auth public endpoints over HTTP', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        firstname: 'Test',
        lastname: 'User',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.accessToken).toBe('access-token');
      });

    await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.message).toBe('Connexion réussie.');
      });

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({
        email: 'user@example.com',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.message).toContain('Si un compte existe');
      });

    await request(app.getHttpServer())
      .get('/api/auth/reset-password/validate')
      .query({ token: 'reset-token' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.valid).toBe(true);
      });

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: 'reset-token',
        newPassword: 'NewPassword123!',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.message).toBe('Mot de passe réinitialisé avec succès.');
      });
  });

  it('protects cart routes and validates payloads', async () => {
    await request(app.getHttpServer()).get('/api/cshop/cart').expect(401);

    await request(app.getHttpServer())
      .get('/api/cshop/cart')
      .set('Authorization', 'Bearer test-token')
      .expect(200)
      .expect(({ body }) => {
        expect(body.id).toBe('cart-1');
        expect(body.items).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .post('/api/cshop/cart/add')
      .set('Authorization', 'Bearer test-token')
      .send({ productId: '11111111-1111-4111-8111-111111111111' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/cshop/cart/add')
      .set('Authorization', 'Bearer test-token')
      .send({
        productId: '11111111-1111-4111-8111-111111111111',
        quantity: 1,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.items).toHaveLength(1);
      });
  });

  it('supports checkout and payment init through Nest HTTP', async () => {
    await request(app.getHttpServer())
      .post('/api/cshop/orders/checkout')
      .set('Authorization', 'Bearer test-token')
      .send({
        deliveryOption: 'other',
        cartItemIds: ['11111111-1111-4111-8111-111111111111'],
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.id).toBe('order-1');
      });

    expect(orderService.checkout).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        deliveryOption: 'other',
      }),
    );

    await request(app.getHttpServer())
      .post('/api/payments/init')
      .set('Authorization', 'Bearer test-token')
      .send({
        referenceType: 'shop_order',
        referenceId: 'order-1',
        provider: 'stripe',
        currency: 'XAF',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.paymentId).toBe('payment-1');
      });

    await request(app.getHttpServer())
      .post('/api/payments/verify')
      .set('Authorization', 'Bearer test-token')
      .send({
        providerTransactionId: 'txn-1',
      })
      .expect(201);

    expect(paymentsService.verify).toHaveBeenCalledWith('txn-1');
  });

  it('serves public reviews without authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/cshop/reviews/product/product-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body[0].comment).toBe('Top');
      });

    expect(reviewService.findByProduct).toHaveBeenCalledWith('product-1');
  });

  it('rejects invalid webhook signatures over HTTP', async () => {
    paymentsService.handleWebhook.mockRejectedValueOnce(
      new UnauthorizedException('Invalid webhook signature'),
    );

    await request(app.getHttpServer())
      .post('/api/payments/webhook/stripe')
      .send({
        providerTransactionId: 'txn-1',
      })
      .expect(401);
  });
});
