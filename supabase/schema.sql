-- ─────────────────────────────────────────────────────────────────
-- CAH B2B Dist — Supabase 초기 스키마
-- Supabase 대시보드 → SQL Editor 에서 실행
-- ─────────────────────────────────────────────────────────────────

-- 1. 견적요청 테이블
CREATE TABLE IF NOT EXISTS quote_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      TEXT UNIQUE NOT NULL,
  leader_id       TEXT NOT NULL,
  leader_name     TEXT,
  client_id       TEXT,

  -- 거래처 정보
  client_name     TEXT NOT NULL,
  client_phone    TEXT,
  client_ceo      TEXT,
  client_contact  TEXT,
  client_email    TEXT,
  client_biz_no   TEXT,

  -- 현장 정보
  site_name       TEXT,
  site_address    TEXT,
  site_detail     TEXT,
  site_floor      INTEGER,
  site_sido       TEXT,

  -- 시공 정보
  const_type      TEXT DEFAULT '시공포함',
  res_type        TEXT DEFAULT '거주세대',
  wish_date       DATE,

  -- 데이터 (JSON)
  items           JSONB NOT NULL DEFAULT '[]',
  grades          JSONB DEFAULT '{}',
  options         JSONB DEFAULT '{}',
  coupons         JSONB DEFAULT '[]',

  -- 메타
  memo            TEXT,
  status          TEXT DEFAULT '대기',
  source          TEXT DEFAULT 'dist-request',
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  linked_quote_id TEXT,

  CONSTRAINT valid_status CHECK (status IN ('대기', '확인', '완료'))
);

CREATE INDEX IF NOT EXISTS idx_qr_leader    ON quote_requests(leader_id);
CREATE INDEX IF NOT EXISTS idx_qr_client    ON quote_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_qr_status    ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_qr_submitted ON quote_requests(submitted_at DESC);

-- 2. 거래처 테이블
CREATE TABLE IF NOT EXISTS b2b_clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  biz_no          TEXT,
  address         TEXT,
  memo            TEXT,
  ceo             TEXT,
  email           TEXT,
  biz_type        TEXT,
  fax             TEXT,
  registered_by   TEXT NOT NULL,
  sales_rep       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bc_registered ON b2b_clients(registered_by);

-- 3. 배포링크 테이블
CREATE TABLE IF NOT EXISTS dist_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id     TEXT UNIQUE NOT NULL,
  leader_id   TEXT NOT NULL,
  leader_name TEXT,
  client_id   TEXT,
  client_name TEXT,
  link_url    TEXT NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dl_leader ON dist_links(leader_id);

-- 4. 쿠폰 적용 설정 테이블
CREATE TABLE IF NOT EXISTS coupon_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id   TEXT NOT NULL,
  client_id   TEXT NOT NULL,
  coupon_id   TEXT NOT NULL,
  coupon_name TEXT,
  enabled     BOOLEAN DEFAULT FALSE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(leader_id, client_id, coupon_id)
);

-- 5. 설정 테이블
CREATE TABLE IF NOT EXISTS config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 adm 설정 삽입
INSERT INTO config (key, value) VALUES (
  'adm',
  '{"b2bMarkup": 145, "bgMk": {}, "distDefault": {}}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- 6. 쿠폰 마스터 테이블 (Admin 관리)
CREATE TABLE IF NOT EXISTS coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id   TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'rate',  -- 'rate' | 'amt'
  rate        NUMERIC DEFAULT 0,
  amt         INTEGER DEFAULT 0,
  condition   TEXT,
  valid_from  DATE,
  valid_until DATE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_coupon_type CHECK (type IN ('rate', 'amt'))
);
