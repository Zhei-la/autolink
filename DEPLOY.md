# 오토링크 배포 가이드 (Step 7)

이 단계까지 오시면 코드는 완성된 상태예요. 이제 인터넷에 올리는 일만 남았습니다.

**모바일에서 진행 가능합니다.** PC가 없어도 됩니다.

전체 소요 시간: **약 30~40분**

---

## 큰 그림

```
[1] Supabase 셋업 (이미 완료) ✅
       ↓
[2] GitHub 레포 만들고 코드 올리기   (10분)
       ↓
[3] Railway 가입 + GitHub 연결        (5분)
       ↓
[4] Railway에 환경변수 입력            (5분)
       ↓
[5] 배포 완료 + URL 받기              (자동, 5분)
       ↓
[6] Supabase에 새 URL 등록             (3분)
       ↓
[7] 작동 확인                          (5분)
```

---

## Part A. GitHub 레포 만들기 (모바일 웹)

### A-1. GitHub 가입 / 로그인

이미 `Zhei-la` 계정이 있으시니 그걸 사용하시면 됩니다.

### A-2. 새 레포 만들기

1. https://github.com/new 접속 (모바일 브라우저)
2. 입력:
   - **Repository name**: `autolink`
   - **Private** 선택 (지금은 비공개)
   - "Add a README file" 체크 ✓
   - "Add .gitignore" → **Node** 선택
3. **"Create repository"** 클릭

### A-3. 코드 업로드

이 단계가 가장 까다로워요. **3가지 방법** 중 골라서 진행:

#### 방법 1: GitHub 모바일 앱에서 직접 (가장 쉬움)

GitHub 모바일 앱에는 파일 업로드 기능이 제한적이에요. 이 방법은 **권장 X**.

#### 방법 2: 모바일 브라우저로 GitHub 웹 사용 (추천)

1. 새로 만든 `autolink` 레포에 들어가서
2. 우측 상단 **"Add file"** → **"Upload files"** 클릭
3. 첨부해드린 `autolink-full.tar.gz` 파일을 PC에서 압축 풀어서 (또는 모바일 압축 앱) → 폴더 통째로 드래그앤드롭
   - **모바일에서 압축 풀기**: 안드로이드는 `ZArchiver`, iOS는 `iZip` 같은 앱 추천
4. 파일이 업로드되면 하단 **"Commit changes"** 클릭

> ⚠ **모바일에서 압축 풀기 어렵다면** → 다음 방법 3을 보세요.

#### 방법 3: 누군가 PC를 빌려 한 번만 진행 (가장 안정적)

지인이나 카페 PC에서 5분만:
1. PC에서 압축 파일 받음
2. 압축 풀고 → GitHub Desktop 또는 git 명령어로 push
3. 끝나면 그 다음부터는 모바일에서 Railway 진행 가능

루피님이 평소에 다른 프로젝트(ThreadsAuto 등) GitHub에 push하시던 방식 그대로면 됩니다.

---

## Part B. Railway 배포

### B-1. Railway 가입

1. https://railway.app 접속 (모바일)
2. **"Login with GitHub"** 클릭
3. GitHub 인증 → Railway 대시보드 진입

### B-2. 새 프로젝트 만들기

1. **"+ New Project"** 클릭
2. **"Deploy from GitHub repo"** 선택
3. `Zhei-la/autolink` 레포 선택
4. Railway가 자동으로 Next.js 인식 → 빌드 시작

### B-3. 환경변수 입력 (가장 중요!)

빌드가 시작되면서 에러가 날 거예요. 환경변수가 없어서 그래요. 정상이에요.

1. 좌측 사이드바에서 프로젝트 선택
2. **"Variables"** 탭 클릭
3. **"+ New Variable"** 또는 **"Raw Editor"** 클릭
4. 다음을 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://이미받으신값.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... (긴 anon 키)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (긴 service_role 키)
NEXT_PUBLIC_SITE_URL=https://your-railway-url.up.railway.app
```

> 마지막 `NEXT_PUBLIC_SITE_URL`은 Railway가 도메인을 만들어준 뒤에 정확한 값을 넣을 수 있어요. 일단 임시로 `http://localhost:3000` 넣어두고, 도메인 받은 후 다시 수정.

5. **"Deploy"** 또는 자동 재빌드 시작

### B-4. Railway 도메인 받기

1. **"Settings"** 탭 클릭
2. **"Networking"** 섹션
3. **"Generate Domain"** 클릭
4. `autolink-production.up.railway.app` 같은 URL 생성됨
5. 위 환경변수 `NEXT_PUBLIC_SITE_URL`을 이 URL로 업데이트

---

## Part C. Supabase에 새 도메인 등록

배포된 URL을 Supabase에도 알려줘야 OAuth 로그인이 작동해요.

1. Supabase 대시보드 → 프로젝트 선택
2. **Authentication** → **URL Configuration**
3. **Site URL**:
   - `https://autolink-production.up.railway.app` (Railway URL)
4. **Redirect URLs**에 한 줄 추가:
   - `https://autolink-production.up.railway.app/auth/callback`
5. **"Save"** 클릭

---

## Part D. 작동 확인

1. Railway URL 모바일에서 접속
2. 랜딩 페이지 보임 ✓
3. **"무료로 시작하기"** → 로그인 페이지
4. **"구글로 계속하기"** → 구글 로그인 → 대시보드 진입 ✓
5. **"+ 새 페이지"** → 제목·URL 입력 → 편집기 진입
6. 블록 추가/수정 → 저장 → 우상단 **"보기"** 클릭
7. 공개 페이지 (`/p/내URL`) 정상 작동 ✓
8. 다시 편집기 → **"📊 통계 보기"** → 클릭수 등 표시 ✓

---

## Part E. 도메인 연결 (선택, 나중에)

`autolink.kr` 같은 본인 도메인을 연결하려면:

1. Railway → Settings → Networking → **"+ Custom Domain"**
2. `autolink.kr` 입력
3. Railway가 알려주는 CNAME / A 레코드를 도메인 등록 업체(가비아·후이즈 등)에서 설정
4. 5분~몇 시간 후 자동 적용
5. Supabase Site URL과 Redirect URLs도 `autolink.kr`로 업데이트
6. Railway 환경변수 `NEXT_PUBLIC_SITE_URL`도 `https://autolink.kr`로

---

## 막혔을 때 자주 보는 에러

### Q. Railway 빌드가 실패해요
- Variables 모두 입력했는지 확인
- `NEXT_PUBLIC_SUPABASE_URL`이 올바른 URL 형식인지 (https://로 시작)
- Logs 탭에서 빨간 에러 메시지 확인 → 저한테 보내주세요

### Q. 로그인이 안 돼요 (구글 클릭 후 에러)
- Supabase **Site URL**과 **Redirect URLs**에 Railway 도메인 등록 확인
- `/auth/callback` 경로 빠뜨리지 않았는지 확인

### Q. 페이지를 만들었는데 공개 URL이 안 열려요
- Railway 환경변수 다시 확인
- Supabase에서 `pages` 테이블 들어가서 새 페이지가 생성됐는지 확인
- `is_published = true`로 되어있는지

### Q. 클릭 통계가 안 잡혀요
- 본인이 본인 페이지에서 클릭한 건 카운트되지만, 같은 IP에서 너무 빨리 여러 번은 무시될 수 있어요
- 시크릿 모드 또는 다른 폰에서 시도

---

## 다음 단계 (Phase 1.5)

Phase 1이 작동하기 시작하면 다음 작업:

- **6가지 디자인 템플릿 적용** (전자책에 있는 그 템플릿들)
- **스레드 자동화** (Meta App Review 없이 빠르게 가능)
- **인스타 자동화** (Meta App Review 2~4주 신청)
- **유료 플랜 (토스페이먼츠 결제 연동)**

---

## 도움 필요할 때

배포 중 어디서든 막히면 다음을 알려주세요:
1. 어느 Part 어느 단계
2. 에러 메시지 캡처
3. Railway / Supabase 화면 캡처

같이 해결해 드립니다.

수고하셨습니다! 🎉
