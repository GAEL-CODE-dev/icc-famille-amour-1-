-- 001_init.sql
-- Schéma initial : administrateurs, membres, caisse, activités, prières, audit, sauvegardes.
-- Les objets peuvent être complétés après une migration interrompue sans effacer les données.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

DO $$ BEGIN
  CREATE TYPE admin_role AS ENUM ('super_admin', 'tresorier', 'secretaire');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cash_type AS ENUM ('cotisation', 'don', 'depense', 'autre');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_status AS ENUM ('planifiee', 'en_cours', 'terminee', 'annulee');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE backup_type AS ENUM ('full', 'diff', 'sync');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE backup_status AS ENUM ('en_cours', 'succes', 'echec');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  email CITEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'secretaire',
  actif BOOLEAN NOT NULL DEFAULT true,
  tentatives_echec INT NOT NULL DEFAULT 0,
  verrouille_jusqua TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_admins_updated_at ON admins;
CREATE TRIGGER trg_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  telephone TEXT,
  email CITEXT,
  adresse TEXT,
  date_naissance DATE,
  date_adhesion DATE NOT NULL DEFAULT CURRENT_DATE,
  statut TEXT NOT NULL DEFAULT 'actif',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_members_telephone_actif
  ON members (telephone)
  WHERE deleted_at IS NULL AND telephone IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_members_nom_prenom ON members (nom, prenom);

DROP TRIGGER IF EXISTS trg_members_updated_at ON members;
CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type cash_type NOT NULL,
  montant BIGINT NOT NULL CHECK (montant > 0),
  date_operation DATE NOT NULL DEFAULT CURRENT_DATE,
  categorie TEXT,
  description TEXT,
  member_id UUID REFERENCES members(id),
  created_by UUID NOT NULL REFERENCES admins(id),
  annulee BOOLEAN NOT NULL DEFAULT false,
  annulee_par UUID REFERENCES admins(id),
  annulee_le TIMESTAMPTZ,
  motif_annulation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_cash_date ON cash_transactions (date_operation);
CREATE INDEX IF NOT EXISTS ix_cash_member ON cash_transactions (member_id);
DROP TRIGGER IF EXISTS trg_cash_updated_at ON cash_transactions;
CREATE TRIGGER trg_cash_updated_at
  BEFORE UPDATE ON cash_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  type TEXT,
  description TEXT,
  lieu TEXT,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ,
  statut activity_status NOT NULL DEFAULT 'planifiee',
  created_by UUID NOT NULL REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_activities_date_debut ON activities (date_debut);
DROP TRIGGER IF EXISTS trg_activities_updated_at ON activities;
CREATE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS activity_attendance (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, member_id)
);

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON activity_attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON activity_attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS prayer_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  description TEXT,
  date_prog DATE NOT NULL,
  heure TIME,
  lieu_ou_mode TEXT,
  responsable_member_id UUID REFERENCES members(id),
  recurrence TEXT,
  created_by UUID NOT NULL REFERENCES admins(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_prayers_date ON prayer_programs (date_prog);
DROP TRIGGER IF EXISTS trg_prayers_updated_at ON prayer_programs;
CREATE TRIGGER trg_prayers_updated_at
  BEFORE UPDATE ON prayer_programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action TEXT NOT NULL,
  entite TEXT NOT NULL,
  entite_id UUID,
  ip TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_created_at ON audit_log (created_at);
CREATE INDEX IF NOT EXISTS ix_audit_admin ON audit_log (admin_id);

CREATE TABLE IF NOT EXISTS backup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type backup_type NOT NULL,
  statut backup_status NOT NULL DEFAULT 'en_cours',
  taille_octets BIGINT,
  checksum TEXT,
  debut TIMESTAMPTZ NOT NULL DEFAULT now(),
  fin TIMESTAMPTZ,
  message TEXT
);

CREATE INDEX IF NOT EXISTS ix_backup_runs_debut ON backup_runs (debut);

COMMIT;