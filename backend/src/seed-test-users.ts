import { NestFactory } from '@nestjs/core';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import { User } from './auth/entities/user.entity';
import { UserRole } from './auth/enums/user-role.enum';
import { EmployeeSpecialty } from './auth/enums/employee-specialty.enum';

interface TestAccount {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: UserRole;
  specialty?: EmployeeSpecialty;
}

function getDefaultPassword(): string {
  const password = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!password) {
    throw new Error(
      'ADMIN_DEFAULT_PASSWORD doit être défini dans .env avant de lancer le seed des comptes de test.',
    );
  }
  return password;
}

const DEFAULT_PASSWORD = getDefaultPassword();

const TEST_ACCOUNTS: TestAccount[] = [
  // ── Admins ──────────────────────────────────────────────────────────────
  {
    email: 'admin@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Super',
    lastname: 'Admin',
    role: UserRole.SUPER_ADMIN,
  },
  {
    email: 'manager@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Manager',
    lastname: 'Admin',
    role: UserRole.ADMIN,
  },
  // ── Clients ─────────────────────────────────────────────────────────────
  {
    email: 'client@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Marie',
    lastname: 'Client',
    role: UserRole.CLIENT,
  },
  // ── Employés par spécialité ──────────────────────────────────────────────
  {
    email: 'livreur@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Paul',
    lastname: 'Livreur',
    role: UserRole.EMPLOYEE,
    specialty: EmployeeSpecialty.LIVREUR,
  },
  {
    email: 'evenementialiste@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Sophie',
    lastname: 'Evenements',
    role: UserRole.EMPLOYEE,
    specialty: EmployeeSpecialty.EVENEMENTIALISTE,
  },
  {
    email: 'coursier@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Luc',
    lastname: 'Coursier',
    role: UserRole.EMPLOYEE,
    specialty: EmployeeSpecialty.COURSIER,
  },
  {
    email: 'nettoyeur@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Awa',
    lastname: 'Clean',
    role: UserRole.EMPLOYEE,
    specialty: EmployeeSpecialty.NETTOYEUR,
  },
  {
    email: 'bricoleur@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Moussa',
    lastname: 'Todo',
    role: UserRole.EMPLOYEE,
    specialty: EmployeeSpecialty.BRICOLEUR,
  },
  {
    email: 'relais@cempire.com',
    password: DEFAULT_PASSWORD,
    firstname: 'Boutique',
    lastname: 'Relais',
    role: UserRole.EMPLOYEE,
    specialty: EmployeeSpecialty.POINT_RELAIS,
  },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get<Repository<User>>('UserRepository');

  console.log('\n🔧 Initialisation des comptes de test...\n');

  for (const account of TEST_ACCOUNTS) {
    const existing = await userRepo.findOne({ where: { email: account.email } });
    const hashed = await bcrypt.hash(account.password, 10);

    if (existing) {
      existing.password = hashed;
      existing.role = account.role;
      existing.specialty = account.specialty ?? null;
      existing.isActive = true;
      await userRepo.save(existing);
      console.log(`♻️  [MIS A JOUR] ${account.email} — rôle: ${account.role}`);
    } else {
      const user = userRepo.create({
        email: account.email,
        password: hashed,
        firstname: account.firstname,
        lastname: account.lastname,
        phone: '',
        role: account.role,
        specialty: account.specialty ?? null,
        isActive: true,
      });
      await userRepo.save(user);
      console.log(`✅ [CRÉÉ]      ${account.email} — rôle: ${account.role}`);
    }
  }

  console.log('\n📋 Récapitulatif des comptes de test :');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email                          Rôle            Spécialité');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const a of TEST_ACCOUNTS) {
    const emailPad = a.email.padEnd(33);
    const rolePad = a.role.padEnd(16);
    const spec = a.specialty ?? '-';
    console.log(`  ${emailPad}${rolePad}${spec}`);
  }
  console.log('  (mot de passe : celui défini dans ADMIN_DEFAULT_PASSWORD)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await app.close();
}

void bootstrap();
