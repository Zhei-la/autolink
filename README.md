# 오토링크 (AutoLink)

자동화하는 링크 페이지 — 인스타·스레드·유튜브 댓글 자동 응대 + 미니 홈페이지를 한 번에.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth + RLS)
- Railway (배포)

## 로컬 실행

```bash
npm install
cp .env.example .env.local
# .env.local 안의 값 채우기 (Supabase에서 받은 키)
npm run dev
```

브라우저에서 http://localhost:3000

## 배포

`DEPLOY.md` 참고.

## 폴더 구조

```
src/
  app/                    Next.js App Router 페이지
    page.tsx              랜딩
    login/                로그인
    dashboard/            내 페이지 목록
    edit/[pageId]/        편집기 + 통계 + 설정
    p/[slug]/             공개 페이지 (방문자용)
    api/                  REST API (클릭 추적·폼 제출)
    auth/                 OAuth 콜백·로그아웃
  components/
    ui/                   Button, Input
    blocks/               BlockPreview (8가지 블록 렌더링)
    editor/               BlockList, BlockEditModal, PageSettingsForm
  lib/
    supabase/             Supabase 클라이언트 (브라우저/서버/미들웨어)
    db/                   DB Server Actions (페이지·블록 CRUD)
    utils.ts              헬퍼 함수
  types/                  TypeScript 타입 정의
  middleware.ts           세션 갱신 + 보호 경로 리다이렉트
supabase/
  schema.sql              DB 스키마 (Supabase에 적용)
  SETUP.md                Supabase 셋업 가이드
DEPLOY.md                 배포 가이드 (GitHub + Railway)
```

## 주요 기능 (Phase 1)

- ✅ 회원가입·로그인 (구글 OAuth + 이메일)
- ✅ 페이지 만들기 (URL 슬러그 자동/수동)
- ✅ 8가지 블록 (프로필·링크·상품그리드·문의·달력·이메일·텍스트·SNS)
- ✅ 블록 추가/수정/삭제/이동/복제/활성화 토글
- ✅ 페이지 디자인 (포인트 색깔·배경색·공개 토글)
- ✅ 공개 페이지 (`/p/[slug]`) — 누구나 접속 가능
- ✅ 클릭 추적 + 페이지 방문 카운트
- ✅ 통계 화면 (블록별 클릭 순위)
- ✅ 문의·이메일 수집

## 다음 단계 (Phase 2)

- 6가지 디자인 템플릿 (1인 사업자형, 강사·코치형, 쇼핑몰형, 뷰티샵형, 전자책 판매형, 이벤트형)
- 스레드 자동화 (먼저)
- 인스타 자동화 (Meta App Review 후)
- 유튜브 댓글 자동 답글
- 유료 플랜 + 토스페이먼츠 결제

---

Made by Zheiia
