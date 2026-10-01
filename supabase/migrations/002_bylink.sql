-- =====================================================================
-- By링크 마이그레이션 002 : 페이지 주소(아이디)에 밑줄(_)·마침표(.) 허용
-- ※ 001_admin_and_tracking.sql 을 먼저 실행한 뒤 실행하세요.
-- Supabase SQL Editor 에 통째로 붙여넣고 RUN. 여러 번 실행해도 안전.
--
-- 리틀리 아이디(daegeon_dnc, byran.mk)를 그대로 옮기려면 필요해요.
-- 기존 규칙([a-z0-9-])보다 넓히기만 하므로 이미 있는 주소는 모두 그대로 유효합니다.
-- =====================================================================

ALTER TABLE public.pages DROP CONSTRAINT IF EXISTS slug_format;
ALTER TABLE public.pages ADD CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9_.-]{3,30}$');

-- 블록 타입 목록 재확인 (001 과 같음 — 001 을 빠뜨린 경우 대비)
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type IN (
  'profile', 'link', 'product_grid', 'inquiry', 'calendar', 'email', 'text', 'sns',
  'notice', 'image_banner', 'video', 'group_buy', 'link_collection', 'spacer'
));

-- 참고: By링크의 새 설정(프로필 레이아웃, 카드 크기, 강조, 예약 공개, 디자인 탭)은
-- 모두 기존 JSONB 칸(pages.theme, blocks.data)에 저장되므로 컬럼 추가가 필요 없습니다.
-- =====================================================================
-- 완료. "Success. No rows returned" 뜨면 성공.
-- =====================================================================
