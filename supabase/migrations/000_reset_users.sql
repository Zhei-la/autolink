-- =====================================================================
-- ★ 선택 실행 ★  기존 가입자 전체 초기화 (발주자 결정: 초기화)
--
-- auth.users 를 지우면 profiles → pages → blocks → click_events ... 가 CASCADE 로 함께 삭제됨.
-- 운영자 본인 계정은 남기고 싶으면 아래 이메일을 본인 것으로 바꿔서 실행.
-- 되돌릴 수 없으니 실행 전에 한 번 더 확인!
-- =====================================================================

DELETE FROM auth.users
WHERE email IS DISTINCT FROM 'loopy9923@gmail.com';

-- 남은 계정 확인
SELECT id, email, created_at FROM auth.users;
