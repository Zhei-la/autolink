import 'server-only';
import { Pool, type QueryResultRow } from 'pg';

/**
 * By링크 DB — 바이란미디어(라운지)와 같은 Postgres 를 쓰되, 표 이름은 모두 bl_ 로 시작해서 라운지 데이터와 섞이지 않게 한다.
 * 회원은 라운지의 users 표(카카오 가입)를 그대로 쓴다.
 */

declare global {
  // eslint-disable-next-line no-var
  var __blPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __blSchema: Promise<void> | undefined;
}

function pool(): Pool {
  if (!global.__blPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL 환경변수가 없어요');
    global.__blPool = new Pool({
      connectionString: url,
      ssl: process.env.PGSSL === 'off' || /\.railway\.internal/.test(url) ? false : { rejectUnauthorized: false },
      max: 8,
      idleTimeoutMillis: 30000,
    });
    global.__blPool.on('error', (e) => console.error('[By링크 DB]', e.message));
  }
  return global.__blPool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS bl_accounts (
  user_id      INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  page_limit   INT NOT NULL DEFAULT 3,
  status       TEXT NOT NULL DEFAULT 'active',
  expires_at   TIMESTAMPTZ,
  admin_memo   TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bl_pages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9_.-]{3,30}$'),
  title        TEXT NOT NULL DEFAULT '내 링크 페이지',
  theme        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  view_count   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bl_pages_user ON bl_pages(user_id);

CREATE TABLE IF NOT EXISTS bl_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES bl_pages(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  click_count INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bl_blocks_page ON bl_blocks(page_id, position);

CREATE TABLE IF NOT EXISTS bl_page_views (
  id               BIGSERIAL PRIMARY KEY,
  page_id          UUID NOT NULL REFERENCES bl_pages(id) ON DELETE CASCADE,
  viewed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  visitor_hash     TEXT,
  referrer         TEXT,
  referrer_source  TEXT,
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  device_type      TEXT,
  is_inapp_browser BOOLEAN DEFAULT FALSE,
  inapp_app        TEXT,
  user_agent       TEXT
);
CREATE INDEX IF NOT EXISTS idx_bl_views_page ON bl_page_views(page_id, viewed_at DESC);

CREATE TABLE IF NOT EXISTS bl_click_events (
  id               BIGSERIAL PRIMARY KEY,
  block_id         UUID NOT NULL REFERENCES bl_blocks(id) ON DELETE CASCADE,
  page_id          UUID NOT NULL REFERENCES bl_pages(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  visitor_hash     TEXT,
  referrer         TEXT,
  referrer_source  TEXT,
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  device_type      TEXT,
  is_inapp_browser BOOLEAN DEFAULT FALSE,
  user_agent       TEXT
);
CREATE INDEX IF NOT EXISTS idx_bl_clicks_page ON bl_click_events(page_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bl_inquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id        UUID NOT NULL REFERENCES bl_blocks(id) ON DELETE CASCADE,
  page_id         UUID NOT NULL REFERENCES bl_pages(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bl_inq_page ON bl_inquiries(page_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bl_emails (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id   UUID NOT NULL REFERENCES bl_blocks(id) ON DELETE CASCADE,
  page_id    UUID NOT NULL REFERENCES bl_pages(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  consent    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (block_id, email)
);
CREATE INDEX IF NOT EXISTS idx_bl_emails_page ON bl_emails(page_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bl_images (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE SET NULL,
  mime       TEXT NOT NULL,
  data       BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

/** 표가 없으면 만든다 (서버가 켜진 뒤 첫 요청에서 한 번) */
export function ensureSchema(): Promise<void> {
  if (!global.__blSchema) {
    global.__blSchema = pool()
      .query(SCHEMA)
      .then(() => undefined)
      .catch((e) => {
        global.__blSchema = undefined;
        throw e;
      });
  }
  return global.__blSchema;
}

export async function q<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<T[]> {
  await ensureSchema();
  const res = await pool().query<T>(text, params);
  return res.rows;
}

export async function one<T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] || null;
}

/** 여러 쿼리를 한 번에 (실패하면 모두 되돌림) */
export async function tx<T>(fn: (run: (text: string, params?: any[]) => Promise<any[]>) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    const out = await fn(async (text, params = []) => (await client.query(text, params)).rows);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
