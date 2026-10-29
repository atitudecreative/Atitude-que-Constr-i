-- Schema inicial da LP "Atitude que Constrói".
-- Valores monetários em centavos inteiros (BIGINT). Datas em timestamptz (UTC).

CREATE TABLE admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  name          text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  CONSTRAINT admin_users_email_lower CHECK (email = lower(email))
);
CREATE UNIQUE INDEX admin_users_email_key ON admin_users (email);

CREATE TABLE admin_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  ip_hash     text,
  user_agent  text
);
CREATE INDEX admin_sessions_user_idx ON admin_sessions (user_id);
CREATE INDEX admin_sessions_expires_idx ON admin_sessions (expires_at);

-- Cadastros do formulário "Receba atualizações da campanha".
-- Um registro por e-mail: novos envios atualizam o cadastro existente.
CREATE TABLE leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  email             text NOT NULL,
  phone             text,
  consent_marketing boolean NOT NULL CHECK (consent_marketing),
  consent_text      text NOT NULL,
  consent_at        timestamptz NOT NULL,
  source            text,
  utm               jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash           text,
  user_agent        text,
  webhook_status    text NOT NULL DEFAULT 'skipped' CHECK (webhook_status IN ('skipped', 'pending', 'sent', 'failed')),
  webhook_attempts  integer NOT NULL DEFAULT 0,
  webhook_last_error text,
  submissions       integer NOT NULL DEFAULT 1,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leads_email_lower CHECK (email = lower(email))
);
CREATE UNIQUE INDEX leads_email_key ON leads (email);
CREATE INDEX leads_created_idx ON leads (created_at DESC);

-- Prestação de contas (seção "Nosso progresso"). Linha única.
CREATE TABLE campaign_progress (
  id                 smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  published          boolean NOT NULL DEFAULT false,
  total_raised_cents bigint CHECK (total_raised_cents >= 0),
  payments_count     integer CHECK (payments_count >= 0),
  update_frequency   text,
  bricks_total       smallint NOT NULL DEFAULT 12 CHECK (bricks_total BETWEEN 1 AND 60),
  bricks_completed   smallint CHECK (bricks_completed >= 0),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT bricks_completed_le_total CHECK (bricks_completed IS NULL OR bricks_completed <= bricks_total)
);
INSERT INTO campaign_progress (id) VALUES (1);

-- Formas de contribuição (PIX, cartão, boleto).
CREATE TABLE contribution_methods (
  code        text PRIMARY KEY CHECK (code IN ('pix', 'cartao', 'boleto')),
  title       text NOT NULL,
  pending_description text NOT NULL,
  description text,
  pix_key     text,
  url         text,
  published   boolean NOT NULL DEFAULT false,
  sort_order  smallint NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES admin_users (id) ON DELETE SET NULL
);
INSERT INTO contribution_methods (code, title, pending_description, sort_order) VALUES
  ('pix', 'PIX', 'Chave, instruções e recorrência a validar.', 1),
  ('cartao', 'CARTÃO', 'Link, parcelamento e gateway pendentes.', 2),
  ('boleto', 'BOLETO', 'Emissão, vencimento e instruções pendentes.', 3);

-- Fotos do terreno (seção "O terreno"): 3 posições fixas, imagem guardada no banco.
CREATE TABLE gallery_photos (
  slot        smallint PRIMARY KEY CHECK (slot BETWEEN 1 AND 3),
  mime_type   text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  data        bytea NOT NULL,
  size_bytes  integer NOT NULL,
  sha256      text NOT NULL,
  alt_text    text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES admin_users (id) ON DELETE SET NULL
);

CREATE TABLE site_settings (
  id                 smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  show_status_bar    boolean NOT NULL DEFAULT true,
  lead_form_approved boolean NOT NULL DEFAULT false,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid REFERENCES admin_users (id) ON DELETE SET NULL
);
INSERT INTO site_settings (id) VALUES (1);

-- Janela fixa por chave para limitar requisições (funciona com várias instâncias).
CREATE TABLE rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL
);

CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  user_id    uuid REFERENCES admin_users (id) ON DELETE SET NULL,
  action     text NOT NULL,
  entity     text NOT NULL,
  entity_id  text,
  details    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);
