import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Repository } from 'typeorm';
import { User } from './auth/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from './auth/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>('UserRepository');

  // Vérifier si l'admin existe déjà
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@cempire.com' },
  });

  if (existingAdmin) {
    console.log("✅ L'administrateur principal existe déjà.");
    await app.close();
    return;
  }

  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_DEFAULT_PASSWORD is required to seed admin');
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = userRepository.create({
    email: 'admin@cempire.com',
    password: hashedPassword,
    firstname: 'Super',
    lastname: 'Admin',
    phone: '',
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  });

  await userRepository.save(admin);

  console.log('✅ Administrateur principal créé avec succès !');
  console.log('📧 Email: admin@cempire.com');
  console.log('🔑 Mot de passe: fourni via ADMIN_DEFAULT_PASSWORD');

  await app.close();
}

void bootstrap();
