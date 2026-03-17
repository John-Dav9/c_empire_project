import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_DEFAULT_PASSWORD is required');
  }

  try {
    const response = await authService.signin({
      email: 'admin@cempire.com',
      password,
    });
    console.log(`SIGNIN_OK role=${response.user.role}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown signin error';
    console.log(`SIGNIN_FAIL message=${message}`);
  } finally {
    await app.close();
  }
}

void bootstrap();
