import { NestFactory } from '@nestjs/core';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User } from './auth/entities/user.entity';
import { UserRole } from './auth/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>('UserRepository');

  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_DEFAULT_PASSWORD is required');
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const email = 'admin@cempire.com';

  const existingAdmin = await userRepository.findOne({ where: { email } });

  if (existingAdmin) {
    existingAdmin.password = hashedPassword;
    existingAdmin.role = UserRole.SUPER_ADMIN;
    existingAdmin.isActive = true;
    await userRepository.save(existingAdmin);
    console.log('Admin mis a jour: mot de passe reinitialise.');
  } else {
    const admin = userRepository.create({
      email,
      password: hashedPassword,
      firstname: 'Super',
      lastname: 'Admin',
      phone: '',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    await userRepository.save(admin);
    console.log('Admin cree: compte super_admin initialise.');
  }

  console.log('Email: admin@cempire.com');
  console.log('Password: fourni via ADMIN_DEFAULT_PASSWORD');
  await app.close();
}

void bootstrap();
