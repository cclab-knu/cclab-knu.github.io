# CCLab 사이트 — 자동 빌드 + 관리자(CMS) 세팅 가이드

이 zip 을 **저장소 루트**(지금 `index.html`·`_generator`·`assets`·`content` 가 보이는 폴더)에
덮어쓰기로 풀면 아래 파일이 추가됩니다.

```
.github/workflows/pages.yml   ← 자동 빌드 (이미 있으면 그대로 둬도 됨 / 확인용)
admin/index.html              ← 관리자 페이지 (CMS 앱 로더)
admin/config.yml              ← 관리자 설정 (우리 content/ 구조에 맞춤)
oauth-worker/worker.js        ← 로그인용 Cloudflare Worker 코드 (저장소에 안 올려도 됨)
```

세팅은 **A → B → C → D → E** 순서입니다. A만 해도 "커밋하면 자동 게시"가 됩니다.
CMS(웹에서 쓰기·삭제)는 B~E까지 해야 완성됩니다.

---

## A. 자동 빌드 켜기 ★ 가장 중요 (현재 구조에서 build 되게)

워크플로 파일(`.github/workflows/pages.yml`)은 이미 있고 내용도 정상입니다.
그동안 자동 빌드가 안 된 건 **Pages 소스가 "GitHub Actions"로 설정돼 있지 않기 때문**입니다.

1. GitHub 저장소 → **Settings → Pages**
2. **Build and deployment → Source** 를 **"GitHub Actions"** 로 변경.
   (지금은 "Deploy from a branch" 로 돼 있을 겁니다. 이걸 바꾸는 게 핵심입니다.)
3. 저장소 → **Settings → Actions → General → Actions permissions** 가
   "Allow all actions" (또는 최소한 활성화) 인지 확인.
4. 확인: 아무 커밋이나 하나 push → **Actions 탭**에 "Build and deploy CCLab site" 실행이
   초록색으로 끝나면 성공. 이후 `content/*.md` 만 커밋해도 사이트가 자동 갱신됩니다.

> 중요 — 워크플로는 반드시 **저장소 최상위**의 `.github/workflows/` 에 있어야 합니다.
> 만약 저장소 안에서 사이트가 `cclab-site/` 같은 **하위 폴더**에 들어가 있다면 자동 빌드가
> 동작하지 않습니다. 이 경우 알려주세요 — 폴더 기준으로 경로를 바꿔 드리겠습니다.
> (주소가 `choinoin.github.io/cclab-site/` 이고 저장소 이름이 `cclab-site` 이면 루트 구조가 맞습니다.)

여기까지만 해도: ✎글쓰기 폼으로 만든 글을 커밋·push → 자동 게시, 삭제 = 파일 삭제 후 커밋.

---

## B. 관리자 페이지 올리기

`admin/` 폴더(2개 파일)를 저장소에 커밋하면 `사이트주소/admin/` 으로 접속할 수 있게 됩니다.
아직 로그인은 안 됩니다 — C·D·E 를 마치면 됩니다.

---

## C. GitHub OAuth App 만들기 (1회)

1. GitHub → 오른쪽 위 프로필 → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. 입력:
   - **Application name**: `CCLab CMS` (아무거나)
   - **Homepage URL**: `https://choinoin.github.io/cclab-site/`
   - **Authorization callback URL**: `https://CCLAB-OAUTH.workers.dev/callback`
     (← D 에서 만들 Worker 주소 + `/callback`. 임시로 적고 D 후에 정확히 맞춰도 됩니다.)
3. 생성 후 **Client ID** 를 적어두고, **Generate a new client secret** 로 secret 도 하나 만들어 둡니다.
   (secret 은 한 번만 보이니 복사해 두세요.)

---

## D. 로그인용 Cloudflare Worker 배포 (1회, 무료)

브라우저가 GitHub에 안전하게 로그인하려면 토큰 교환을 해주는 작은 중계기가 필요합니다.
`oauth-worker/worker.js` 가 그 코드입니다.

1. https://dash.cloudflare.com 가입/로그인 → **Workers & Pages → Create → Create Worker**
2. 이름 예: `cclab-oauth` → 생성 → **Edit code** 에 `oauth-worker/worker.js` 내용을 붙여넣고 **Deploy**.
   - 배포되면 주소가 생깁니다: 예) `https://cclab-oauth.<당신계정>.workers.dev`
3. 그 Worker → **Settings → Variables and Secrets** 에 두 개 등록:
   - `GITHUB_CLIENT_ID`  = (C 의 Client ID)
   - `GITHUB_CLIENT_SECRET` = (C 의 client secret) — 종류를 **Secret** 으로
4. C 의 **Authorization callback URL** 을 이 Worker 주소 + `/callback` 로 정확히 맞춥니다.
   예) `https://cclab-oauth.<당신계정>.workers.dev/callback`

> 대안: 직접 배포가 번거로우면, 공식 유지보수 워커 `sveltia/sveltia-cms-auth` 를 써도 됩니다.
> 환경변수 이름(`GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`)과 콜백 경로(`/callback`)는 동일합니다.

---

## E. config.yml 값 채우기

`admin/config.yml` 상단 두 줄을 실제 값으로 바꿔 커밋합니다.

```yaml
backend:
  name: github
  repo: choinoin/cclab-site                       # ← 실제 저장소 (owner/이름)
  branch: main
  base_url: https://cclab-oauth.<당신계정>.workers.dev   # ← D 의 Worker 주소 (끝에 /auth, /callback 붙이지 말 것)
```

커밋하면 끝. 이제 `사이트주소/admin/` 접속 → "GitHub으로 로그인" → 글 작성/수정/삭제가 됩니다.

---

## F. 편집자(글 쓸 사람) 추가

CMS에서 글을 쓸 수 있는 사람 = **저장소에 쓰기 권한이 있는 사람**입니다.
저장소 → **Settings → Collaborators → Add people** 로 연구실 멤버(각자 GitHub 계정)를 추가하세요.
추가된 사람은 `사이트주소/admin/` 에서 자기 GitHub 계정으로 로그인해 바로 편집할 수 있습니다.

---

## 평소 사용 흐름

1. `사이트주소/admin/` 접속 (처음 한 번만 로그인)
2. 왼쪽에서 **소식 / 강의자료 / 논문 / 구성원** 선택
3. **New** → 제목·날짜·본문 입력, 첨부 드래그 → **Publish**
4. 약 1분 뒤 사이트 자동 반영
   - 수정: 글 열고 고쳐서 다시 Publish
   - 삭제: 글 열고 **Delete** (버튼 한 번)

---

## 참고 / 문제 해결

- **교수 정보(pi.md)·졸업생(alumni.md)·사진갤러리(gallery.md)** 는 형식이 특수해서 CMS 컬렉션에
  넣지 않았습니다. 이 셋은 자주 안 바뀌므로 기존처럼 파일을 직접 편집하세요. 원하시면 이것도
  CMS 폼으로 넣어 드릴 수 있습니다(형식 변환 필요).
- 로그인 창이 떴다가 바로 닫히고 안 들어가지면: C 의 콜백 URL 과 D 의 Worker 주소가
  정확히 일치하는지(특히 `/callback`), config.yml 의 `base_url` 이 Worker 루트 주소인지 확인.
- Actions 가 빨간색(실패)이면 Actions 탭에서 로그를 열어 어떤 단계인지 알려주세요.
- 저장소가 **private 이면** GitHub Pages 가 유료 플랜에서만 게시됩니다(무료는 public 유지).
- 강의자료 게시판을 추가/변경하려면 `admin/config.yml` 의 `courses → board → options` 와
  `_generator/build.py` 의 `COURSE_BOARDS` 를 같이 맞추면 됩니다.
