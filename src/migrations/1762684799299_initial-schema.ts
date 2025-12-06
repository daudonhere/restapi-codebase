import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  pgm.sql(`
    CREATE TABLE tb_engine (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL UNIQUE,
        path VARCHAR(255) NOT NULL,
        installed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE public.tb_role (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      name character varying NOT NULL UNIQUE,
      is_system boolean DEFAULT false,
      description text,
      created_at timestamp without time zone DEFAULT now(),
      updated_at timestamp without time zone DEFAULT now(),
      CONSTRAINT tb_role_pkey PRIMARY KEY (id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_role_name_lower
    ON public.tb_role (LOWER(name));

    CREATE TABLE public.tb_user (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      fullname character varying,
      avatar text,
      email character varying NOT NULL UNIQUE,
      phone character varying,
      password text NOT NULL,
      frequency character varying,
      code character varying,
      pin character varying,
      passphrase text,
      source character varying,
      is_verified boolean NOT NULL DEFAULT false,
      login_at timestamp without time zone,
      ip_address character varying,
      user_agent text,
      is_delete boolean NOT NULL DEFAULT false,
      deleted_at timestamp without time zone,
      created_at timestamp without time zone DEFAULT now(),
      updated_at timestamp without time zone DEFAULT now(),
      CONSTRAINT tb_user_pkey PRIMARY KEY (id)
    );

    CREATE UNIQUE INDEX idx_unique_phone_not_null
    ON public.tb_user (phone)
    WHERE phone IS NOT NULL;

    CREATE TABLE public.tb_activity (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      user_id uuid,
      module character varying(100) NOT NULL,
      action character varying(150) NOT NULL,
      endpoint text NOT NULL,
      method character varying(10) NOT NULL,
      status_code integer NOT NULL,
      status character varying(20) NOT NULL,
      ip_address character varying(100),
      user_agent text,
      before_data jsonb,
      after_data jsonb,
      description text,
      created_at timestamp without time zone DEFAULT now(),
      CONSTRAINT tb_activity_pkey PRIMARY KEY (id),
      CONSTRAINT fk_activity_user FOREIGN KEY (user_id)
        REFERENCES public.tb_user(id)
        ON DELETE SET NULL
    );

    CREATE INDEX idx_activity_user_id ON public.tb_activity(user_id);
    CREATE INDEX idx_activity_module ON public.tb_activity(module);
    CREATE INDEX idx_activity_created_at ON public.tb_activity(created_at);

    CREATE TABLE public.tb_token (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL,
      token text NOT NULL,
      type character varying(20) NOT NULL,
      created_at timestamp without time zone DEFAULT now(),
      expired_at timestamp without time zone,
      CONSTRAINT tb_token_pkey PRIMARY KEY (id),
      CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES public.tb_user(id) ON DELETE CASCADE
    );

    CREATE TABLE public.tb_user_role (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      role_id uuid NOT NULL,
      user_id uuid NOT NULL,
      created_at timestamp without time zone DEFAULT now(),
      updated_at timestamp without time zone DEFAULT now(),
      CONSTRAINT tb_user_role_pkey PRIMARY KEY (id),
      CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.tb_user(id) ON DELETE CASCADE,
      CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES public.tb_role(id) ON DELETE CASCADE
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