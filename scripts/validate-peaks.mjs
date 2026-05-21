#!/usr/bin/env node
// 시드 봉우리 정합성 검증 스크립트.
// 사용: npm run validate:peaks
//
// 검사 항목:
//   - slug 중복
//   - 좌표가 한반도 대략 범위(33~38.7°N, 124.5~132°E) 안인지
//   - 표고가 현실적인 범위(100~2000m)인지
//   - 시·도 이름이 표준 행정구역 리스트인지
//   - 100대 명산 / 백두대간 카운트가 100 / 30인지
//
// 좌표 정확도까지 검증하지는 않는다(국토지리정보원 데이터와의 교차 검증은
// 향후 별도 CSV 임포트로 진행).

const { PEAKS_SEED } = await import('../constants/peaks-seed.ts');

const BOUNDS = { minLat: 33.0, maxLat: 38.7, minLng: 124.5, maxLng: 132.0 };
const ELEV_MIN = 100;
const ELEV_MAX = 2100;

const KNOWN_REGIONS = new Set([
  '서울특별시',
  '부산광역시',
  '대구광역시',
  '인천광역시',
  '광주광역시',
  '대전광역시',
  '울산광역시',
  '세종특별자치시',
  '경기도',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전라남도',
  '전북특별자치도',
  '경상북도',
  '경상남도',
  '제주특별자치도',
]);

const errors = [];
const warns = [];

function err(slug, msg) {
  errors.push({ slug, msg });
}
function warn(slug, msg) {
  warns.push({ slug, msg });
}

// 1) slug 중복
{
  const seen = new Set();
  for (const p of PEAKS_SEED) {
    if (seen.has(p.slug)) err(p.slug, 'duplicate slug');
    seen.add(p.slug);
  }
}

// 2) 좌표/표고/지역
for (const p of PEAKS_SEED) {
  if (p.latitude < BOUNDS.minLat || p.latitude > BOUNDS.maxLat) {
    err(p.slug, `latitude ${p.latitude} 이(가) 한반도 범위(${BOUNDS.minLat}~${BOUNDS.maxLat}) 밖`);
  }
  if (p.longitude < BOUNDS.minLng || p.longitude > BOUNDS.maxLng) {
    err(p.slug, `longitude ${p.longitude} 이(가) 한반도 범위(${BOUNDS.minLng}~${BOUNDS.maxLng}) 밖`);
  }
  if (p.elevation_m < ELEV_MIN || p.elevation_m > ELEV_MAX) {
    warn(p.slug, `elevation ${p.elevation_m}m 이상치(${ELEV_MIN}~${ELEV_MAX}m 권장)`);
  }
  if (!KNOWN_REGIONS.has(p.region)) {
    warn(p.slug, `unknown region '${p.region}'`);
  }
}

// 3) 카운트
const total = PEAKS_SEED.length;
const k100 = PEAKS_SEED.filter((p) => p.list_korea_100).length;
const baek = PEAKS_SEED.filter((p) => p.list_baekdudaegan).length;

if (k100 !== 100) err('__lists__', `100대 명산 카운트 ${k100}, 기대값 100`);
if (baek !== 30) warn('__lists__', `백두대간 카운트 ${baek}, 기대값 30`);

// 4) name_ko/name_en 누락
for (const p of PEAKS_SEED) {
  if (!p.name_ko || p.name_ko.trim() === '') err(p.slug, 'name_ko 누락');
  if (!p.name_en || p.name_en.trim() === '') warn(p.slug, 'name_en 누락');
}

// 출력
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

console.log(bold('\nTrove Peaks · Data Validation\n'));
console.log(`  총 봉우리      ${total}`);
console.log(`  100대 명산    ${k100}`);
console.log(`  백두대간      ${baek}`);
console.log(
  `  ${red('오류')} ${errors.length}    ${yellow('경고')} ${warns.length}\n`
);

if (errors.length > 0) {
  console.log(bold(red('Errors:')));
  for (const e of errors) console.log(`  ${red('✕')} ${dim(e.slug.padEnd(20))} ${e.msg}`);
  console.log('');
}
if (warns.length > 0) {
  console.log(bold(yellow('Warnings:')));
  for (const w of warns) console.log(`  ${yellow('⚠')} ${dim(w.slug.padEnd(20))} ${w.msg}`);
  console.log('');
}

if (errors.length === 0 && warns.length === 0) {
  console.log(green('  ✓ All checks passed.\n'));
}

process.exit(errors.length > 0 ? 1 : 0);
