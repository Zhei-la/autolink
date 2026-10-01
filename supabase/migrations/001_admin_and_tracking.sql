-- =====================================================================
-- 오토링크 마이그레이션 001 : 관리자 + 계정 상태 + 방문 추적(page_views)
-- Supabase SQL Editor에 통째로 붙여넣고 RUN.
-- 여러 번 실행해도 안전하게(IF NOT EXISTS) 작성됨.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles : 계정 상태 / 만료일 / 페이지 상한 / 관리자 플래그
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status      TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS page_limit  INTEGER NOT NULL DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_memo  TEXT;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_status_check CHECK (status IN ('active', 'suspended', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 관리자 여부 (RLS 정책 안에서 profiles를 다시 조회하면 재귀되므로 SECURITY DEFINER 함수 사용)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

-- 관리자: 모든 프로필 조회/수정
DROP POLICY IF EXISTS "관리자 프로필 전체 조회" ON public.profiles;
CREATE POLICY "관리자 프로필 전체 조회"
  ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "관리자 프로필 전체 수정" ON public.profiles;
CREATE POLICY "관리자 프로필 전체 수정"
  ON public.profiles FOR UPDATE USING (public.is_admin());

-- 관리자: 모든 페이지 조회 (고객별 페이지 수 세기용)
DROP POLICY IF EXISTS "관리자 페이지 전체 조회" ON public.pages;
CREATE POLICY "관리자 페이지 전체 조회"
  ON public.pages FOR SELECT USING (public.is_admin());

-- 본인 프로필은 status / page_limit / is_admin / expires_at 을 스스로 못 바꾸게 트리거로 막음
CREATE OR REPLACE FUNCTION public.tg_protect_profile_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.status     := OLD.status;
    NEW.expires_at := OLD.expires_at;
    NEW.page_limit := OLD.page_limit;
    NEW.is_admin   := OLD.is_admin;
    NEW.admin_memo := OLD.admin_memo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profiles_protect_admin_fields ON public.profiles;
CREATE TRIGGER profiles_protect_admin_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_protect_profile_admin_fields();

-- 만료일 지난 계정은 조회 시점에 expired로 취급 (헬퍼)
CREATE OR REPLACE FUNCTION public.effective_status(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p.status = 'suspended' THEN 'suspended'
    WHEN p.status = 'expired' THEN 'expired'
    WHEN p.expires_at IS NOT NULL AND p.expires_at < NOW() THEN 'expired'
    ELSE 'active'
  END
  FROM public.profiles p WHERE p.id = p_user_id;
$$;

-- 공개 페이지: 소유자가 active 일 때만 노출
DROP POLICY IF EXISTS "공개 페이지 조회" ON public.pages;
CREATE POLICY "공개 페이지 조회"
  ON public.pages FOR SELECT
  USING (is_published = TRUE AND public.effective_status(user_id) = 'active');

-- ---------------------------------------------------------------------
-- 2. blocks : 예약 공개 / 뱃지 (5단계에서 UI 붙임, 컬럼은 지금 만들어 둠)
-- ---------------------------------------------------------------------
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS visible_from  TIMESTAMPTZ;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS visible_until TIMESTAMPTZ;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS badge_text    TEXT;

-- 블록 타입 제약 확장 (신규 블록 6종)
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'profile', 'link', 'product_grid', 'inquiry', 'calendar', 'email', 'text', 'sns',
  'notice', 'image_banner', 'video', 'group_buy', 'link_collection', 'spacer'
));

-- ---------------------------------------------------------------------
-- 3. page_views : 방문 이벤트 로그 (지금까지는 카운트만 있었음)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.page_views (
  id                BIGSERIAL PRIMARY KEY,
  page_id           UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  viewed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visitor_hash      TEXT,
  referrer          TEXT,
  referrer_source   TEXT,      -- instagram / threads / youtube / naver / kakao / direct / other
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  device_type       TEXT,      -- mobile / pc
  is_inapp_browser  BOOLEAN DEFAULT FALSE,
  inapp_app         TEXT,      -- instagram / kakao / threads / naver / null
  user_agent        TEXT
);

CREATE INDEX IF NOT EXISTS idx_page_views_page_date ON public.page_views(page_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor   ON public.page_views(page_id, visitor_hash);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "방문 이벤트 추가" ON public.page_views;
CREATE POLICY "방문 이벤트 추가"
  ON public.page_views FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "본인 페이지 방문 조회" ON public.page_views;
CREATE POLICY "본인 페이지 방문 조회"
  ON public.page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = page_views.page_id AND pages.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 4. click_events : 분해 축 컬럼 추가
-- ---------------------------------------------------------------------
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS visitor_hash     TEXT;
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS referrer_source  TEXT;
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS utm_source       TEXT;
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS utm_medium       TEXT;
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS utm_campaign     TEXT;
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS device_type      TEXT;
ALTER TABLE public.click_events ADD COLUMN IF NOT EXISTS is_inapp_browser BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clicks_page_date ON public.click_events(page_id, created_at DESC);

-- ---------------------------------------------------------------------
-- 5. RPC : 방문 기록 / 클릭 기록 (메타 포함)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_page_view(
  p_page_id          UUID,
  p_visitor_hash     TEXT,
  p_referrer         TEXT,
  p_referrer_source  TEXT,
  p_utm_source       TEXT,
  p_utm_medium       TEXT,
  p_utm_campaign     TEXT,
  p_device_type      TEXT,
  p_is_inapp         BOOLEAN,
  p_inapp_app        TEXT,
  p_user_agent       TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.page_views (
    page_id, visitor_hash, referrer, referrer_source,
    utm_source, utm_medium, utm_campaign,
    device_type, is_inapp_browser, inapp_app, user_agent
  ) VALUES (
    p_page_id, p_visitor_hash, p_referrer, p_referrer_source,
    p_utm_source, p_utm_medium, p_utm_campaign,
    p_device_type, COALESCE(p_is_inapp, FALSE), p_inapp_app, LEFT(p_user_agent, 500)
  );

  UPDATE public.pages SET view_count = view_count + 1 WHERE id = p_page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.record_block_click(
  p_block_id         UUID,
  p_page_id          UUID,
  p_visitor_hash     TEXT,
  p_referrer         TEXT,
  p_referrer_source  TEXT,
  p_utm_source       TEXT,
  p_utm_medium       TEXT,
  p_utm_campaign     TEXT,
  p_device_type      TEXT,
  p_is_inapp         BOOLEAN,
  p_user_agent       TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.click_events (
    block_id, page_id, visitor_hash, referrer, referrer_source,
    utm_source, utm_medium, utm_campaign, device_type, is_inapp_browser, user_agent
  ) VALUES (
    p_block_id, p_page_id, p_visitor_hash, p_referrer, p_referrer_source,
    p_utm_source, p_utm_medium, p_utm_campaign, p_device_type, COALESCE(p_is_inapp, FALSE), LEFT(p_user_agent, 500)
  );

  UPDATE public.blocks SET click_count = click_count + 1 WHERE id = p_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자 화면용: 고객 목록 + 페이지 수 (한 번에)
CREATE OR REPLACE FUNCTION public.admin_list_customers()
RETURNS TABLE (
  id UUID, email TEXT, name TEXT, status TEXT, expires_at TIMESTAMPTZ,
  page_limit INTEGER, is_admin BOOLEAN, created_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ, admin_memo TEXT, page_count BIGINT, total_views BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.email, p.name, p.status, p.expires_at,
    p.page_limit, p.is_admin, p.created_at, p.last_seen_at, p.admin_memo,
    COUNT(pg.id)                      AS page_count,
    COALESCE(SUM(pg.view_count), 0)   AS total_views
  FROM public.profiles p
  LEFT JOIN public.pages pg ON pg.user_id = p.id
  WHERE public.is_admin()
  GROUP BY p.id
  ORDER BY p.created_at DESC;
$$;

-- 마지막 접속 시각 갱신 (대시보드 진입 시 호출)
CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET last_seen_at = NOW() WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 6. 운영자 계정을 관리자로 지정  ★ 이메일을 본인 것으로 바꿔서 실행 ★
-- ---------------------------------------------------------------------
-- UPDATE public.profiles SET is_admin = TRUE WHERE email = 'loopy9923@gmail.com';

-- =====================================================================
-- 완료. "Success. No rows returned" 뜨면 성공.
-- =====================================================================
