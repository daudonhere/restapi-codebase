import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Enable UUID extension
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // ============================
  // tb_engine
  // ============================
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.tb_engine (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        path VARCHAR(255) NOT NULL,
        installed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // ============================
  // tb_role
  // ============================
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.tb_role (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      name VARCHAR NOT NULL UNIQUE,
      is_system BOOLEAN DEFAULT FALSE,
      description TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      CONSTRAINT tb_role_pkey PRIMARY KEY (id)
    );
  `);

  // INDEX: unique name (case-insensitive)
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_role_name_lower
    ON public.tb_role (LOWER(name));
  `);

  // SEEDER ROLES DEFAULT
  pgm.sql(`
    INSERT INTO public.tb_role (name, is_system, description)
    VALUES
      ('superadmin', TRUE, 'full access to the system'),
      ('administrator', TRUE, 'manage users and system settings'),
      ('user', TRUE, 'standard access for users')
    ON CONFLICT (name) DO NOTHING;
  `);

  // ============================
  // tb_user
  // ============================
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.tb_user (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      fullname VARCHAR,
      avatar TEXT,
      email VARCHAR NOT NULL UNIQUE,
      phone VARCHAR,
      password TEXT NOT NULL,
      frequency VARCHAR,
      code VARCHAR,
      pin VARCHAR,
      passphrase TEXT,
      source VARCHAR,
      is_verified BOOLEAN NOT NULL DEFAULT FALSE,
      login_at TIMESTAMP,
      ip_address VARCHAR,
      user_agent TEXT,
      is_delete BOOLEAN NOT NULL DEFAULT FALSE,
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      CONSTRAINT tb_user_pkey PRIMARY KEY (id)
    );
  `);

  // INDEX: unique phone if not null
  pgm.sql(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_phone_not_null
    ON public.tb_user (phone)
    WHERE phone IS NOT NULL;
  `);

  // ============================
  // tb_activity
  // ============================
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.tb_activity (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      user_id uuid,
      module VARCHAR(100) NOT NULL,
      action VARCHAR(150) NOT NULL,
      endpoint TEXT NOT NULL,
      method VARCHAR(10) NOT NULL,
      status_code INTEGER NOT NULL,
      status VARCHAR(20) NOT NULL,
      ip_address VARCHAR(100),
      user_agent TEXT,
      before_data JSONB,
      after_data JSONB,
      description TEXT,
      created_at TIMESTAMP DEFAULT now(),
      CONSTRAINT tb_activity_pkey PRIMARY KEY (id),
      CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
        REFERENCES public.tb_user(id)
        ON DELETE SET NULL
    );
  `);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.tb_activity(user_id);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_activity_module ON public.tb_activity(module);`);
  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.tb_activity(created_at);`);

  // ============================
  // tb_token
  // ============================
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.tb_token (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL,
      token TEXT NOT NULL,
      type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      expired_at TIMESTAMP,
      CONSTRAINT tb_token_pkey PRIMARY KEY (id),
      CONSTRAINT fk_token_user FOREIGN KEY (user_id)
        REFERENCES public.tb_user(id)
        ON DELETE CASCADE
    );
  `);

  // ============================
  // tb_user_role
  // ============================
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS public.tb_user_role (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      role_id uuid NOT NULL,
      user_id uuid NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      CONSTRAINT tb_user_role_pkey PRIMARY KEY (id),
      CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.tb_user(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_role FOREIGN KEY (role_id)
        REFERENCES public.tb_role(id)
        ON DELETE CASCADE
    );
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DROP TABLE IF EXISTS public.tb_user_role;
    DROP TABLE IF EXISTS public.tb_token;
    DROP TABLE IF EXISTS public.tb_activity;
    DROP TABLE IF EXISTS public.tb_role;
    DROP TABLE IF EXISTS public.tb_user;
    DROP TABLE IF EXISTS public.tb_engine CASCADE;
  `);
}
