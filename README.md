# Trove Peaks · 트로브 봉우리

> **당신의 산은 도감이 됩니다.**
> *Your summits, beautifully archived.*

한국 등산인을 위한 봉우리 **컬렉션·도감 앱**.
블랙야크 BAC가 *운동 인증*이라면, Trove Peaks는 *컬렉션 미학*이다.
트랭글이 *트래킹 기록*이라면, Trove Peaks는 *박물관 도감*이다.

---

## Phase I 스코프 (이 리포의 현재 상태)

이번 빌드는 **“텅 빈 도감을 보여줄 수 있는 골격”** 까지를 목표로 한다.

- ✅ Expo SDK 54 + TypeScript strict + Expo Router(file-based)
- ✅ NativeWind v4 + 디자인 토큰(cream / navy / gold / 세리프 4종)
- ✅ 폰트 4종 로드 — Noto Serif KR, Cormorant Garamond, Pretendard, JetBrains Mono
- ✅ Supabase Auth (이메일/패스워드) + 세션 영속화(AsyncStorage)
- ✅ 도감 메인 — 진행률 블록, **100대 명산 시드 그리드**(정복/미정복 분기)
- ✅ 봉우리 상세 — 표고/지역/난이도/좌표, “정복하기” 진입
- ✅ **정복 등록 흐름** — 카메라/갤러리 사진 선택(EXIF GPS·시각 추출), 봉우리 검색 모달, 메모, Supabase Storage 업로드 + `ascents` insert
- ✅ **GPS 자동 봉우리 추천** — EXIF/현재 위치에서 5km 이내 가장 가까운 봉우리 제안(Haversine)
- ✅ **Claude Vision AI 식별** — Supabase Edge Function `identify-peak`로 봉우리 사진 자동 식별
- ✅ **인증 카드 + 공유** — 1:1 정사각형 박물관 어감 카드를 `react-native-view-shot`으로 캡처해 시스템 공유 시트(인스타·메시지)로 전송
- ✅ **백두대간 30선 필터** — 도감 메인에서 100대 명산(100) / 백두대간(30) 전환
- ✅ **PDF 도감 export** — `expo-print`로 표지·목차·봉우리 페이지 A4 PDF 생성 후 시스템 공유
- ✅ **친구 비교** — 닉네임 검색 + `collection_summary` 뷰로 우리 둘 다·친구만·나만 분리
- ✅ **공개/비공개 토글** — 등록 시 ascent 단위로 노출 여부 선택
- ✅ **누끼(스튜디오 모드)** — remove.bg Edge Function으로 배경 분리 → 어두운 박물관 카드 변형
- ✅ **인스타 스토리(9:16) 카드** — 피드(1:1) ↔ 스토리(9:16) 토글, 4 변형 조합(피드·스토리 × 클래식·스튜디오)
- ✅ 닉네임 일관성 — `profiles` 테이블을 진실의 원천으로 (트리거가 채운 `climber-xxxx`도 노출)
- ✅ **데이터 정합성 검증** — `npm run validate:peaks` (slug 중복·좌표·표고·지역·카운트 검사)
- ✅ **한국 지도 뷰** — 도감 메인의 GRID/MAP 토글, 정복(gold) vs 미정복(stone) 분기, 탭 → 봉우리 상세
- ✅ **기록 편집·삭제** — 봉우리 상세에서 메모·공개 토글 편집, 삭제 시 확인 알림
- ✅ TanStack Query, Zustand, react-native-svg, react-hook-form, zod
- ✅ TypeScript 에러 0, 웹 번들 검증 통과

앱은 **무료 베이스**로 운영한다(과금/구독 없음). Phase II는 사실상 마감 상태이며 다음은 운영 다듬기 — 사진 ascended_at 편집, 한국 지도 outline 보강, 봉우리 좌표 국토지리정보원 교차 검증, 도감 비어 있을 때의 온보딩.

---

## 1. 시작하기

```bash
git clone https://github.com/csparkzxc1/trove_peak.git
cd trove_peak
npm install
cp .env.example .env.local   # 아래 2번 절차로 값 채우기
npx expo start
```

- iOS 시뮬레이터: `i`
- Android 에뮬레이터: `a`
- 웹 미리보기(레이아웃 확인용): `w`

Supabase가 비어 있어도 앱은 동작한다. 시드 봉우리 **100개(산림청 100대 명산)** 가 로컬 폴백으로 표시되며, 로그인/회원가입 시 안내 알림이 뜬다.

---

## 2. Supabase 설정

### 2-1. 프로젝트 생성

1. [supabase.com](https://supabase.com) → New Project
2. 대시보드 → Project Settings → **API**
   - `URL` → `.env.local`의 `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 2-2. 스키마 적용

SQL Editor에 아래를 그대로 붙여 실행한다.

```sql
-- 봉우리 마스터
create table peaks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ko text not null,
  name_en text,
  elevation_m int not null,
  latitude double precision not null,
  longitude double precision not null,
  region text not null,
  region_short text,
  difficulty text check (difficulty in ('하','중','상','최상')),
  list_korea_100 boolean default false,
  list_baekdudaegan boolean default false,
  description text,
  created_at timestamptz default now()
);

-- 사용자별 등정 기록
create table ascents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  peak_id uuid not null references peaks(id) on delete restrict,
  photo_url text,
  cutout_url text,
  card_url text,
  ascended_at timestamptz not null,
  gps_lat double precision,
  gps_lng double precision,
  course_distance_m int,
  course_duration_min int,
  weather jsonb,
  notes text,
  is_public boolean default true,
  created_at timestamptz default now()
);

create index ascents_user_idx on ascents(user_id, ascended_at desc);

-- 이전 스키마(photo_processed_url, is_public default false)를 이미 적용했다면:
-- alter table ascents rename column photo_processed_url to cutout_url;
-- alter table ascents alter column is_public set default true;

alter table peaks enable row level security;
alter table ascents enable row level security;

create policy "peaks readable by all"
  on peaks for select using (true);

create policy "own ascents"
  on ascents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "public ascents readable"
  on ascents for select
  using (is_public = true);
```

> 비고: 원본 브리프에는 `earthdistance` GIST 인덱스가 포함되어 있으나, Supabase에서 해당 익스텐션은 추가 활성화가 필요하다(Database → Extensions에서 `earthdistance`, `cube` 활성화 후 `create index peaks_geo_idx on peaks using gist (ll_to_earth(latitude, longitude));`). Phase II의 GPS 검색에서 사용 예정.

### 2-3. 시드 데이터 (100대 명산)

100대 명산 시드는 `constants/peaks-seed.ts`에 전부 들어 있다. Supabase에 동일하게 채워 넣으려면 아래 한 줄 스크립트로 SQL을 생성한 뒤 SQL Editor에 붙여넣는다.

```bash
node --input-type=module -e "import('./constants/peaks-seed.ts').then(m => { \
  console.log('insert into peaks (slug, name_ko, name_en, elevation_m, latitude, longitude, region, region_short, difficulty, list_korea_100, list_baekdudaegan) values'); \
  console.log(m.PEAKS_SEED.map(p => \`  ('\${p.slug}','\${p.name_ko}','\${p.name_en}',\${p.elevation_m},\${p.latitude},\${p.longitude},'\${p.region}','\${p.region_short}','\${p.difficulty}',\${p.list_korea_100},\${p.list_baekdudaegan})\`).join(',\n') + ';'); \
});" > seed-peaks.sql
```

좌표는 정상부 근사값(대부분 ±500m 이내). 운영 데이터로 가기 전에 국가지점번호/국토지리정보원과 교차 검증을 권장한다.

### 2-4. Auth 설정

- Authentication → Providers → **Email** 활성화
- 개발 중에는 “Confirm email” 토글을 끄면 가입 즉시 로그인 가능

### 2-5. Storage 버킷 (정복 사진)

대시보드 → Storage → **New bucket**.

- 이름: `ascent-photos`
- Public bucket: 체크 (개발용. 운영에선 signed URL로 전환 권장)

SQL Editor에서 정책 적용:

```sql
-- 본인 폴더에만 업로드 허용 (path 패턴: <user_id>/<filename>)
create policy "users insert own ascent photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ascent-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 사진 수정/삭제
create policy "users mutate own ascent photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ascent-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "users delete own ascent photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ascent-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 공개 읽기 (public bucket이면 자동, 명시적으로 추가)
create policy "public read ascent photos"
  on storage.objects for select
  using (bucket_id = 'ascent-photos');
```

### 2-6. 친구 비교 (profiles + collection_summary)

닉네임 검색과 친구의 컬렉션 비교를 위해 공개 `profiles` 테이블과 `collection_summary` 뷰가 필요하다. SQL Editor에 그대로 실행:

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text unique not null,
  created_at timestamptz default now()
);

create index profiles_nickname_lower_idx on profiles (lower(nickname));

alter table profiles enable row level security;

create policy "profiles readable by all"
  on profiles for select using (true);

create policy "own profile mutable"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 회원가입 시 user_metadata.nickname을 그대로 가져와 profiles에 채움
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, nickname)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      'climber-' || substring(new.id::text from 1 for 8)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 공개 ascent만 집계한 컬렉션 요약 뷰 (사진·노트는 노출 안 함)
create or replace view collection_summary as
  select
    pr.id   as user_id,
    pr.nickname,
    coalesce(
      array_agg(a.peak_id) filter (where a.id is not null and a.is_public = true),
      array[]::uuid[]
    )       as collected_peak_ids,
    count(a.id) filter (where a.is_public = true) as collected_count
  from profiles pr
  left join ascents a on a.user_id = pr.id
  group by pr.id, pr.nickname;

grant select on collection_summary to anon, authenticated;
```

> 기존 사용자가 있다면 한 번 백필이 필요하다:
> ```sql
> insert into profiles (id, nickname)
> select id, coalesce(raw_user_meta_data->>'nickname', 'climber-' || substring(id::text from 1 for 8))
>   from auth.users
>   on conflict do nothing;
> ```

이 시점부터 `ascents.is_public`은 새 기록 기본값이 `true`로 들어간다(친구 비교가 의미 있으려면 공개 ascent가 필요). 사용자가 비공개로 두고 싶다면 향후 UI에서 토글 노출.

### 2-7. Edge Function · Claude Vision 식별

`supabase/functions/identify-peak/index.ts`는 사용자가 올린 봉우리 사진을 Claude Vision API에 보내 어느 봉우리인지 식별한다.

1) Anthropic 콘솔에서 API 키 발급
2) 키를 Supabase Functions 환경 변수로 등록:

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
# 모델 변경(선택): 기본은 claude-sonnet-4-6
supabase secrets set CLAUDE_VISION_MODEL=claude-opus-4-7
```

3) 함수 배포:

```bash
supabase functions deploy identify-peak
```

배포 후 앱의 `/add` 화면에서 “AI로 식별” 버튼이 실제로 동작한다. 배포 전에는 호출 시 친절한 에러를 띄운다.

> 비용: 사진 1장당 Sonnet 기준 약 $0.005~0.02. Vision 토큰은 해상도가 높을수록 비싸므로 클라이언트에서 `expo-image-picker`의 `quality: 0.85`로 압축해 보낸다.

### 2-8. Edge Function · 누끼(배경 분리)

`supabase/functions/remove-bg/index.ts`는 [remove.bg API](https://www.remove.bg)로 봉우리 사진에서 배경을 분리하고, 결과 PNG를 `ascent-photos` 버킷에 저장한 뒤 `ascents.cutout_url`을 갱신한다. 배포·키 등록 절차:

```bash
supabase secrets set REMOVEBG_API_KEY=...
supabase functions deploy remove-bg
```

이 기능은 *선택*이다. 키가 없거나 함수가 배포되지 않으면 봉우리 상세 화면의 “스튜디오 모드 만들기” 버튼이 친절한 에러를 띄울 뿐, 다른 흐름엔 영향이 없다.

> 비용: remove.bg는 사진 1장당 약 $0.20(또는 매월 50장 무료 플랜). 무료 운영을 유지하려면 사용자에게 “스튜디오 모드” 버튼 노출 자체를 가리거나, 추후 클라이언트 WASM(@imgly/background-removal) 변형을 검토.

---

## 3. 디렉터리 구조

```
trove-peaks/
├── app/                          # Expo Router (file-based)
│   ├── (auth)/                   # 비로그인 영역
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # 로그인 후 메인
│   │   ├── index.tsx             # 도감
│   │   ├── add.tsx               # 정복 등록 (사진/봉우리/AI식별)
│   │   └── profile.tsx           # 프로필
│   ├── peak/[id].tsx             # 봉우리 상세
│   ├── friend/[nickname].tsx     # 친구 도감·비교
│   ├── _layout.tsx               # 루트 (폰트, Provider, splash)
│   └── index.tsx                 # auth 분기
├── components/
│   ├── ui/                       # Text, Button, Card, Divider, MonoLabel, TextField
│   ├── PeakCard.tsx
│   ├── ProgressBlock.tsx
│   ├── MountainSvg.tsx
│   ├── BrandWordmark.tsx
│   ├── PeakPicker.tsx            # 봉우리 검색 모달
│   └── AscentCard.tsx            # 1:1 인증 카드 (공유용)
├── lib/
│   ├── supabase.ts               # 클라이언트 + isSupabaseConfigured 가드
│   ├── fonts.ts                  # expo-font 매핑
│   ├── imagePicker.ts            # 카메라/갤러리 + EXIF 파싱
│   ├── storage.ts                # Supabase Storage 업로드
│   ├── location.ts               # GPS 권한 + Haversine
│   ├── base64.ts                 # Uint8Array → base64 (RN/Web 호환)
│   ├── share.ts                  # view-shot 캡처 + expo-sharing
│   ├── pdfExport.ts              # 도감 PDF (expo-print)
│   ├── queries/                  # TanStack Query 훅
│   └── types.ts
├── stores/
│   └── auth.ts                   # Zustand (Supabase session)
├── constants/
│   ├── peaks-seed.ts             # 100대 명산 시드 (로컬 폴백)
│   └── theme.ts                  # COLORS / FONT 토큰
├── supabase/functions/
│   └── identify-peak/            # Claude Vision Edge Function (Deno)
├── assets/
│   └── fonts/                    # Pretendard ttf
└── tailwind.config.js            # cream / navy / gold + serif 4종
```

---

## 4. 디자인 원칙

세부 사항은 `tailwind.config.js`와 `constants/theme.ts` 참조.

### Do

- 박물관·도서관 어감의 차분한 큐레이션 톤
- 세리프 헤드라인 + Pretendard 본문 + JetBrains Mono 메타
- Cream(#FAF6EE) 배경, Navy(#0F2E4C) 텍스트, Gold(#C9A961) 액센트
- 숫자는 항상 mono (`1,947m`, `23/100`)
- 여백 넉넉, 미묘한 종이 질감

### Don’t

- 형광색 / 무지개 그라데이션 / 보라 그라데이션
- 이모지로 정보 전달
- “축하해요! 🎉” “대박!” 같은 감탄사
- Material/iOS 기본 컴포넌트 그대로
- 게이미피케이션 비주얼 (XP바, 별, 트로피)

### 톤 예시

| 상황 | 사용 문구 |
|------|----------|
| 정복 완료 | “한라산이 당신의 도감에 추가되었습니다.” |
| 진행률 | “23번째 봉우리. 컬렉션이 조금씩 차오릅니다.” |
| 빈 상태 | “도감이 비어 있습니다. 첫 봉우리를 기다리는 중.” |
| 오류 | “기록을 저장하지 못했습니다. 다시 시도해 주세요.” |

---

## 5. 스크립트

```bash
npm run start        # expo start
npm run ios          # iOS 시뮬레이터
npm run android      # Android 에뮬레이터
npm run web          # 웹 미리보기
npm run typecheck       # tsc --noEmit
npm run validate:peaks  # 시드 정합성 검사 (slug·좌표·표고·카운트)
```

---

## 6. Phase II 로드맵

- ✅ 갤러리/카메라 사진 선택 (`expo-image-picker`) + EXIF GPS·시각 자동 반영
- ✅ Supabase Storage 사진 업로드 + `ascents` insert (수동 봉우리 선택)
- ✅ GPS 현재 위치 자동 봉우리 매칭 (`expo-location` + Haversine)
- ✅ Claude Vision으로 봉우리 식별 (Edge Function `identify-peak`)
- ✅ 산림청 100대 명산 풀 데이터(100개) 시드
- ✅ 박물관 어감의 인증 카드 자동 생성 (1:1, view-shot 캡처)
- ✅ 인스타그램·시스템 공유 시트 (expo-sharing, 웹은 PNG 다운로드)
- ✅ 백두대간 별도 컬렉션 뷰 + 30선 풀 시드
- ✅ PDF 도감 export (`expo-print`, A4, 표지+목차+봉우리 페이지)
- ✅ 친구 비교 (닉네임 검색 + 공개 컬렉션 요약 뷰)
- ✅ 공개/비공개 토글 (등록 시 선택)
- ✅ 누끼 처리 (remove.bg Edge Function, 옵셔널)
- ✅ 데이터 정합성 검증 (`npm run validate:peaks` 스크립트)
- ✅ 한국 지도 뷰 (도감 메인 MAP 모드)
- ✅ 정복 기록 편집/삭제
- ❌ 유료 전환 — 무료 베이스로 운영
- ⏳ 좌표 국토지리정보원 교차 검증, 사진/촬영일 편집, 온보딩

---

## 7. 라이선스 & 폰트

- Pretendard — © Kil Hyung-jin, [SIL Open Font License 1.1](https://github.com/orioncactus/pretendard/blob/main/LICENSE)
- Noto Serif KR, Cormorant Garamond, JetBrains Mono — Google Fonts (OFL)

코드 자체의 라이선스는 별도 명시 전까지 모회사 **(주)트로브 / Trove Inc.** 내부 자산이다.
