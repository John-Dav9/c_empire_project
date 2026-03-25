/**
 * Migration manuelle : met à jour l'enum orders_deliveryoption_enum
 * pour remplacer 'other' par 'free' et ajouter 'relay' / 'warehouse'.
 *
 * À exécuter UNE SEULE FOIS avant de relancer le serveur :
 *   npm run migrate:delivery-options
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();
  console.log('✅ Connecté à PostgreSQL');

  try {
    await client.query('BEGIN');

    console.log('🔄 Étape 1 — Conversion de la colonne en text...');
    await client.query(`
      ALTER TABLE orders
        ALTER COLUMN "deliveryOption" TYPE text
        USING "deliveryOption"::text;
    `);

    console.log('🔄 Étape 2 — Migration "other" → "free"...');
    const res = await client.query(`
      UPDATE orders SET "deliveryOption" = 'free' WHERE "deliveryOption" = 'other'
    `);
    console.log(`   ${res.rowCount ?? 0} ligne(s) mise(s) à jour.`);

    console.log("🔄 Étape 3 — Suppression de l'ancien enum...");
    await client.query(`DROP TYPE IF EXISTS orders_deliveryoption_enum CASCADE;`);

    console.log('🔄 Étape 4 — Création du nouvel enum...');
    await client.query(`
      CREATE TYPE orders_deliveryoption_enum
        AS ENUM ('cexpress', 'free', 'relay', 'warehouse');
    `);

    console.log('🔄 Étape 5 — Reconversion de la colonne vers le nouvel enum...');
    await client.query(`
      ALTER TABLE orders
        ALTER COLUMN "deliveryOption" TYPE orders_deliveryoption_enum
        USING "deliveryOption"::orders_deliveryoption_enum;
    `);

    await client.query(`
      ALTER TABLE orders
        ALTER COLUMN "deliveryOption" SET DEFAULT 'free';
    `);

    await client.query('COMMIT');
    console.log('\n✅ Migration réussie ! Relancez le serveur maintenant.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur — rollback effectué :', err);
    throw err;
  } finally {
    await client.end();
  }
}

void migrate();
