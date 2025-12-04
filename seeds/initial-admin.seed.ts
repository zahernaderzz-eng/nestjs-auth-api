import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env.development') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
});

const SUPER_ADMIN_PERMISSIONS = [
  {
    resource: 'users',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    resource: 'products',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    resource: 'category',
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    resource: 'settings',
    actions: ['read', 'create', 'update', 'delete'],
  },
];

async function seed() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Missing required environment variables: INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD',
    );
  }

  let connection: DataSource | null = null;

  try {
    connection = await AppDataSource.initialize();

    await connection.transaction(async (entityManager) => {
      const existingAdmin = await entityManager.query(
        `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
        [adminEmail],
      );

      if (existingAdmin.length > 0) {
        console.log('Super admin already exists');
        return;
      }

      let roleId: string;

      const existingRole = await entityManager.query(
        `SELECT id FROM role WHERE name = 'super_admin' LIMIT 1`,
      );

      if (existingRole.length > 0) {
        roleId = existingRole[0].id;
      } else {
        const [newRole] = await entityManager.query(
          `INSERT INTO role (name, permissions)
           VALUES ($1, $2)
           RETURNING id`,
          ['super_admin', JSON.stringify(SUPER_ADMIN_PERMISSIONS)],
        );
        roleId = newRole.id;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await entityManager.query(
        `INSERT INTO "user" (email, password, name, "roleId")
         VALUES ($1, $2, $3, $4)`,
        [adminEmail, hashedPassword, 'Super Admin', roleId],
      );

      console.log('Super admin created successfully');
    });
  } catch (error) {
    console.error('Seeding failed:', error.message);
    throw error;
  } finally {
    if (connection?.isInitialized) {
      await connection.destroy();
    }
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
