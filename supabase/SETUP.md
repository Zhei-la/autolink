# Supabase 셋업 가이드 (Step 2)

이 가이드를 따라 끝까지 하시면, `.env.local`에 채워야 할 3개 값을 손에 쥐고 다음 단계로 갈 수 있어요.

소요 시간: **약 10분**

---

## 1단계. Supabase 가입

1. https://supabase.com 접속
2. 우측 상단 **"Start your project"** 클릭
3. **"Continue with GitHub"** 추천 (다른 방법도 가능)
4. GitHub 인증 완료 → Supabase 대시보드 진입

---

## 2단계. 새 프로젝트 만들기

1. 대시보드에서 **"New project"** 클릭
2. Organization 선택 (개인 계정이면 본인 이름이 자동 선택됨)
3. 프로젝트 정보 입력:
   - **Project name**: `autolink` (이 이름은 루피님만 봄)
   - **Database Password**: 안전한 비밀번호 (꼭 따로 메모! 나중에 DB 직접 접속할 때 필요)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 빠름)
   - **Pricing Plan**: `Free` 그대로
4. **"Create new project"** 클릭
5. 프로젝트 셋업 완료까지 약 1~2분 대기 (자동으로 진행됨)

---

## 3단계. DB 스키마 적용 (가장 중요)

프로젝트가 만들어지면 좌측 사이드바가 보입니다.

1. 좌측 사이드바에서 **"SQL Editor"** (📝 아이콘) 클릭
2. 우측 상단 **"+ New query"** 클릭 → 빈 SQL 편집창 열림
3. `supabase/schema.sql` 파일 내용을 **전부 복사**해서 편집창에 **통째로 붙여넣기**
4. 우측 하단 **"Run"** 버튼 클릭 (또는 단축키 `Ctrl+Enter` / `Cmd+Enter`)
5. 하단에 **"Success. No rows returned"** 메시지 확인 → 성공!

> ⚠ 만약 에러가 뜨면 메시지 캡처해서 저한테 보내주세요. 보통 "이미 존재함" 같은 거라 무시해도 되지만 다른 에러면 같이 봐야 해요.

### 적용 확인 (선택)

좌측 사이드바 **"Table Editor"** (📊 아이콘) 클릭하면 다음 6개 테이블이 보여야 정상:

- `profiles`
- `pages`
- `blocks`
- `click_events`
- `inquiry_submissions`
- `email_submissions`

---

## 4단계. 카카오·구글 로그인 설정

### 4-1. 구글 로그인 (필수)

가장 빠르고 간단하니 이걸 먼저 셋업하세요.

1. 좌측 사이드바 **"Authentication"** → **"Providers"**
2. 목록에서 **"Google"** 찾기 → 클릭해서 펼치기
3. **"Enable Sign in with Google"** 토글 ON
4. 두 가지 값을 채워야 함:
   - **Client ID (for OAuth)**: 비움 (Supabase가 기본 제공하는 거 사용)
   - **Client Secret (for OAuth)**: 비움
5. **"Save"** 클릭

> 위 방식은 Supabase 기본 OAuth 앱을 쓰는 거라 빠르지만, 사용자에게 "Supabase 앱이 권한 요청"이라고 떠요. 정식 출시 직전에 본인 Google Cloud 프로젝트에서 OAuth 만들어 교체하면 돼요. 지금은 일단 진행.

### 4-2. 카카오 로그인 (선택, 나중에 추가 가능)

카카오는 약간 복잡해요. **지금은 스킵하고 일단 구글로 진행**, 나중에 추가합시다. (Supabase는 카카오를 기본 Provider로 지원하지 않아서 따로 OAuth 설정이 필요하거든요.)

### 4-3. 이메일 로그인은 자동으로 켜져 있음

별도 설정 없이도 이메일/비밀번호 가입은 가능합니다.

---

## 5단계. 리다이렉트 URL 등록

로그인 후 어디로 돌아올지 Supabase에 알려줘야 합니다.

1. **"Authentication"** → **"URL Configuration"**
2. **"Site URL"** 칸에:
   - 지금: `http://localhost:3000`
   - 나중에 배포 후: `https://autolink.kr` (또는 Railway 도메인)
3. **"Redirect URLs"** 칸에 한 줄씩 추가:
   - `http://localhost:3000/auth/callback`
   - 나중에 배포 후: `https://your-domain.com/auth/callback`
4. **"Save"** 클릭

---

## 6단계. API 키 받기 (가장 중요)

이게 `.env.local`에 들어갈 값들입니다.

1. 좌측 사이드바 **"Project Settings"** (⚙️ 아이콘) → **"API"**
2. 다음 3개 값을 메모장이나 카톡 나에게에 복사해두세요:

| 항목 | 어디에 쓸지 |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role / secret** key (👁️ 클릭해서 보기) | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠ **service_role 키는 절대 외부에 공개 X.** 서버에서만 씁니다. GitHub에 올라가지 않도록 `.env.local`에만 넣고, `.gitignore`에 `.env.local`이 있는지 다시 확인하세요. (이미 추가해둠)

---

## 7단계. .env.local에 값 채우기

`autolink/.env.local` 파일 열어서 값 채우기:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... (긴 문자열)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (또 다른 긴 문자열)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 8단계. 로컬에서 작동 확인

```bash
cd autolink
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 → 랜딩 페이지가 보이면 성공.

(아직 로그인은 안 만들어져 있어요. Step 3에서 만들 예정.)

---

## 막혔을 때

이 단계 중 어디서든 막히면 다음을 알려주세요:

1. 어느 단계에서 막혔는지 (예: "3-4단계, Run 눌렀는데 에러")
2. 에러 메시지 (캡처)
3. Supabase 대시보드 어디에 있는지 (URL 또는 캡처)

저한테 보내주시면 거기서부터 같이 해결하면 됩니다.

---

## 다음 단계 (Step 3)

Supabase 셋업이 끝나면 → **카카오·구글 로그인 페이지** 코드를 만들 거예요.

준비되시면 알려주세요!
