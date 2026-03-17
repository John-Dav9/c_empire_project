import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Repository } from 'typeorm';
import { User } from './auth/entities/user.entity';
import { Sector } from './core/sectors/entities/sector.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from './auth/enums/user-role.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>('UserRepository');
  const sectorRepository = app.get<Repository<Sector>>('SectorRepository');

  // Créer les secteurs de base
  const sectorsData = [
    { name: 'Grill Food', description: 'Service de restauration grill' },
    { name: 'Express', description: 'Service de livraison express' },
    { name: 'Clean', description: 'Service de nettoyage' },
    { name: 'Events', description: "Organisation d'évènements" },
    { name: 'Shop', description: 'Boutique en ligne' },
  ];

  console.log('🔨 Création des secteurs...');
  for (const sectorData of sectorsData) {
    const exists = await sectorRepository.findOne({
      where: { name: sectorData.name },
    });
    if (!exists) {
      const sector = sectorRepository.create(sectorData);
      await sectorRepository.save(sector);
      console.log(`✅ Secteur créé : ${sectorData.name}`);
    } else {
      console.log(`⚠️  Secteur existe déjà : ${sectorData.name}`);
    }
  }

  // Vérifier si l'admin existe déjà
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@cempire.com' },
  });

  if (!existingAdmin) {
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

    console.log('\n✅ Administrateur principal créé avec succès !');
    console.log('📧 Email: admin@cempire.com');
    console.log('🔑 Mot de passe: fourni via ADMIN_DEFAULT_PASSWORD');
  } else {
    console.log("\n✅ L'administrateur principal existe déjà.");
  }

  await app.close();
}

void bootstrap();
