-- =====================================================================
-- 오토링크 DB 스키마
-- 이 파일을 Supabase SQL Editor에 통째로 붙여넣고 "RUN" 실행
-- =====================================================================

-- 안전을 위해 기존 테이블 삭제 (처음 적용 시 무시됨)
DROP TABLE IF EXISTS public.email_submissions CASCADE;
DROP TABLE IF EXISTS public.inquiry_submissions CASCADE;
DROP TABLE IF EXISTS public.click_events CASCADE;
DROP TABLE IF EXISTS public.blocks CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- =====================================================================
-- 1. profiles : 사용자 정보 (auth.users 확장)
-- =====================================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  name        TEXT,
  avatar_url  TEXT,
  plan        TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 회원가입 시 자동으로 profiles 행 만들기
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- 2. pages : 사용자가 만드는 링크 페이지
-- =====================================================================
CREATE TABLE public.pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL DEFAULT '내 링크 페이지',
  theme         JSONB NOT NULL DEFAULT '{
    "primaryColor": "#f97316",
    "bgColor": "#fafafa",
    "font": "pretendard",
    "buttonShape": "rounded"
  }'::jsonb,
  is_published  BOOLEAN DEFAULT TRUE,
  view_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  -- 슬러그 형식 검증: 영문 소문자/숫자/하이픈, 3~30자
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]{3,30}$')
);

CREATE INDEX idx_pages_user_id ON public.pages(user_id);
CREATE INDEX idx_pages_slug ON public.pages(slug);

-- =====================================================================
-- 3. blocks : 페이지 안의 블록들 (프로필/링크/상품 등)
-- =====================================================================
CREATE TABLE public.blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id      UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('profile', 'link', 'product_grid', 'inquiry', 'calendar', 'email', 'text', 'sns')),
  position     INTEGER NOT NULL DEFAULT 0,
  data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  click_count  INTEGER DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blocks_page_id ON public.blocks(page_id);
CREATE INDEX idx_blocks_position ON public.blocks(page_id, position);

-- =====================================================================
-- 4. click_events : 블록별 클릭 추적 (통계용)
-- =====================================================================
CREATE TABLE public.click_events (
  id          BIGSERIAL PRIMARY KEY,
  block_id    UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  -- 추가 메타 (선택)
  referrer    TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_block ON public.click_events(block_id);
CREATE INDEX idx_clicks_page ON public.click_events(page_id);
CREATE INDEX idx_clicks_date ON public.click_events(created_at DESC);

-- =====================================================================
-- 5. inquiry_submissions : 문의 양식 제출 내역
-- =====================================================================
CREATE TABLE public.inquiry_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id        UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  page_id         UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inquiry_block ON public.inquiry_submissions(block_id);

-- =====================================================================
-- 6. email_submissions : 이메일 수집 내역
-- =====================================================================
CREATE TABLE public.email_submissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id    UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  page_id     UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  consent     BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (block_id, email)
);

CREATE INDEX idx_email_block ON public.email_submissions(block_id);

-- =====================================================================
-- updated_at 자동 갱신 트리거
-- =====================================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER blocks_updated_at BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =====================================================================
-- RLS (Row Level Security) - 사용자가 자기 데이터만 접근하도록
-- =====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_submissions ENABLE ROW LEVEL SECURITY;

-- ----- profiles 정책 -----
CREATE POLICY "본인 프로필 조회"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "본인 프로필 수정"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ----- pages 정책 -----
-- 본인 페이지: 모든 작업 가능
CREATE POLICY "본인 페이지 모든 작업"
  ON public.pages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 공개된 페이지: 누구나 조회 가능 (방문자도)
CREATE POLICY "공개 페이지 조회"
  ON public.pages FOR SELECT USING (is_published = TRUE);

-- ----- blocks 정책 -----
-- 본인 페이지의 블록: 모든 작업 가능
CREATE POLICY "본인 페이지 블록 모든 작업"
  ON public.blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()
    )
  );

-- 공개된 페이지의 블록: 누구나 조회 가능
CREATE POLICY "공개 페이지 블록 조회"
  ON public.blocks FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = blocks.page_id AND pages.is_published = TRUE
    )
  );

-- ----- click_events 정책 -----
-- 누구나 클릭 이벤트 추가 가능 (방문자가 클릭하면 기록됨)
CREATE POLICY "클릭 이벤트 추가"
  ON public.click_events FOR INSERT WITH CHECK (TRUE);

-- 본인 페이지의 클릭 이벤트만 조회 가능 (통계용)
CREATE POLICY "본인 페이지 클릭 조회"
  ON public.click_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = click_events.page_id AND pages.user_id = auth.uid()
    )
  );

-- ----- inquiry_submissions 정책 -----
-- 누구나 문의 제출 가능
CREATE POLICY "문의 제출"
  ON public.inquiry_submissions FOR INSERT WITH CHECK (TRUE);

-- 본인 페이지의 문의만 조회 가능
CREATE POLICY "본인 페이지 문의 조회"
  ON public.inquiry_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = inquiry_submissions.page_id AND pages.user_id = auth.uid()
    )
  );

-- ----- email_submissions 정책 -----
-- 누구나 이메일 등록 가능
CREATE POLICY "이메일 수집 등록"
  ON public.email_submissions FOR INSERT WITH CHECK (TRUE);

-- 본인 페이지의 이메일만 조회 가능
CREATE POLICY "본인 페이지 이메일 조회"
  ON public.email_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pages
      WHERE pages.id = email_submissions.page_id AND pages.user_id = auth.uid()
    )
  );

-- =====================================================================
-- 클릭수 증가 함수 (RPC) - 동시성 안전
-- =====================================================================
CREATE OR REPLACE FUNCTION public.increment_block_clicks(
  p_block_id UUID,
  p_page_id  UUID
)
RETURNS VOID AS $$
BEGIN
  -- click_events에 기록
  INSERT INTO public.click_events (block_id, page_id)
  VALUES (p_block_id, p_page_id);

  -- blocks.click_count 1 증가
  UPDATE public.blocks
  SET click_count = click_count + 1
  WHERE id = p_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 페이지 조회수 증가 함수
CREATE OR REPLACE FUNCTION public.increment_page_view(p_page_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.pages
  SET view_count = view_count + 1
  WHERE id = p_page_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================
-- 완료. Supabase SQL Editor에서 "Success. No rows returned" 메시지가 뜨면 성공!
-- =====================================================================
