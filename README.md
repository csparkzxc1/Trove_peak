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
- ✅ 도감 메인 — 진행률 블록, 12개 시드 봉우리 그리드(정복/미정복 분기)
- ✅ 봉우리 상세 — 표고/지역/난이도/좌표, “정복하기” placeholder 토스트
- ✅ TanStack Query, Zustand, react-native-svg, react-hook-form, zod
- ✅ TypeScript 에러 0, 웹 번들 검증 통과

다음 단계는 Phase II로 분리한다 — 카메라/GPS/AI 식별/누끼/카드/공유.

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

Supabase가 비어 있어도 앱은 동작한다. 시드 봉우리 12개가 로컬 폴백으로 표시되며, 로그인/회원가입 시 안내 알림이 뜬다.

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
  photo_processed_url text,
  card_url text,
  ascended_at timestamptz not null,
  gps_lat double precision,
  gps_lng double precision,
  course_distance_m int,
  course_duration_min int,
  weather jsonb,
  notes text,
  is_public boolean default false,
  created_at timestamptz default now()
);

create index ascents_user_idx on ascents(user_id, ascended_at desc);

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

### 2-3. 시드 데이터 12종

```sql
insert into peaks (slug, name_ko, name_en, elevation_m, latitude, longitude, region, region_short, difficulty, list_korea_100, list_baekdudaegan) values
  ('hallasan',   '한라산', 'Hallasan',   1947, 33.3617, 126.5292, '제주특별자치도',   '제주', '중', true, false),
  ('jirisan',    '지리산', 'Jirisan',    1915, 35.3372, 127.7307, '전라남도',         '전남', '상', true, true),
  ('seoraksan',  '설악산', 'Seoraksan',  1708, 38.1196, 128.4655, '강원특별자치도',   '강원', '상', true, true),
  ('deokyusan',  '덕유산', 'Deokyusan',  1614, 35.8602, 127.7466, '전북특별자치도',   '전북', '중', true, true),
  ('taebaeksan', '태백산', 'Taebaeksan', 1567, 37.0998, 128.9165, '강원특별자치도',   '강원', '중', true, true),
  ('odaesan',    '오대산', 'Odaesan',    1563, 37.7960, 128.5430, '강원특별자치도',   '강원', '중', true, true),
  ('gayasan',    '가야산', 'Gayasan',    1430, 35.8204, 128.1206, '경상남도',         '경남', '중', true, false),
  ('sobaeksan',  '소백산', 'Sobaeksan',  1439, 36.9583, 128.4905, '충청북도',         '충북', '중', true, true),
  ('woraksan',   '월악산', 'Woraksan',   1094, 36.8855, 128.1064, '충청북도',         '충북', '상', true, false),
  ('bukhansan',  '북한산', 'Bukhansan',   837, 37.6584, 126.9778, '서울특별시',       '서울', '중', true, false),
  ('gwanaksan',  '관악산', 'Gwanaksan',   632, 37.4423, 126.9628, '서울특별시',       '서울', '하', true, false),
  ('dobongsan',  '도봉산', 'Dobongsan',   740, 37.6906, 127.0140, '서울특별시',       '서울', '중', true, false);
```

### 2-4. Auth 설정

- Authentication → Providers → **Email** 활성화
- 개발 중에는 “Confirm email” 토글을 끄면 가입 즉시 로그인 가능

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
│   │   ├── add.tsx               # 등록 (Phase II placeholder)
│   │   └── profile.tsx           # 프로필
│   ├── peak/[id].tsx             # 봉우리 상세
│   ├── _layout.tsx               # 루트 (폰트, Provider, splash)
│   └── index.tsx                 # auth 분기
├── components/
│   ├── ui/                       # Text, Button, Card, Divider, MonoLabel, TextField
│   ├── PeakCard.tsx
│   ├── ProgressBlock.tsx
│   ├── MountainSvg.tsx
│   └── BrandWordmark.tsx
├── lib/
│   ├── supabase.ts               # 클라이언트 + isSupabaseConfigured 가드
│   ├── fonts.ts                  # expo-font 매핑
│   ├── queries/                  # TanStack Query 훅
│   └── types.ts
├── stores/
│   └── auth.ts                   # Zustand (Supabase session)
├── constants/
│   ├── peaks-seed.ts             # 12개 시드 (로컬 폴백)
│   └── theme.ts                  # COLORS / FONT 토큰
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
npm run typecheck    # tsc --noEmit
```

---

## 6. Phase II 로드맵

- 카메라 / 갤러리 선택 (`expo-camera`, `expo-image-picker`)
- GPS 자동 식별 (`expo-location` + Supabase `ll_to_earth` 근접 검색)
- Claude Vision으로 봉우리 OCR / 식별
- 누끼 처리 + 박물관 어감의 인증 카드 자동 생성
- 인스타그램 공유
- 산림청 100대 명산 풀 데이터(100개) 시드 CSV
- 친구 비교, PDF 도감 export, 유료 전환

---

## 7. 라이선스 & 폰트

- Pretendard — © Kil Hyung-jin, [SIL Open Font License 1.1](https://github.com/orioncactus/pretendard/blob/main/LICENSE)
- Noto Serif KR, Cormorant Garamond, JetBrains Mono — Google Fonts (OFL)

코드 자체의 라이선스는 별도 명시 전까지 모회사 **(주)트로브 / Trove Inc.** 내부 자산이다.
