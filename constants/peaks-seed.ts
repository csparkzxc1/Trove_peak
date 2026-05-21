import type { Peak } from '@/lib/types';

type PeakSeed = Omit<Peak, 'id' | 'created_at' | 'description'> & {
  description?: string | null;
};

type Difficulty = '하' | '중' | '상';

// 산림청이 2002년 지정한 100대 명산 기반 시드.
// [slug, name_ko, name_en, elevation_m, lat, lng, region, region_short, difficulty,
//  list_korea_100, list_baekdudaegan]
// 좌표는 주봉(정상) 기준의 근사값(대부분 ±500m 이내). 운영 데이터 임포트 시
// 국가지점번호/국토지리정보원 출처와 교차 검증을 권장한다.
type SeedRow = [
  string, string, string, number, number, number,
  string, string, Difficulty, boolean, boolean,
];

const RAW: SeedRow[] = [
  // 서울·경기·인천 (12)
  ['bukhansan', '북한산', 'Bukhansan', 837, 37.6584, 126.9778, '서울특별시', '서울', '중', true, false],
  ['dobongsan', '도봉산', 'Dobongsan', 740, 37.6906, 127.0140, '서울특별시', '서울', '중', true, false],
  ['gwanaksan', '관악산', 'Gwanaksan', 632, 37.4423, 126.9628, '서울특별시', '서울', '하', true, false],
  ['suraksan', '수락산', 'Suraksan', 638, 37.6878, 127.0823, '서울특별시', '서울', '하', true, false],
  ['buramsan', '불암산', 'Buramsan', 508, 37.6481, 127.0922, '서울특별시', '서울', '하', true, false],
  ['gwanggyosan', '광교산', 'Gwanggyosan', 582, 37.3326, 127.0212, '경기도', '경기', '하', true, false],
  ['cheonmasan', '천마산', 'Cheonmasan', 812, 37.6422, 127.2906, '경기도', '경기', '중', true, false],
  ['yongmunsan', '용문산', 'Yongmunsan', 1157, 37.5611, 127.5564, '경기도', '경기', '중', true, false],
  ['myeongjisan', '명지산', 'Myeongjisan', 1267, 37.9569, 127.3919, '경기도', '경기', '상', true, false],
  ['unaksan', '운악산', 'Unaksan', 935, 37.9269, 127.3389, '경기도', '경기', '중', true, false],
  ['yumyeongsan', '유명산', 'Yumyeongsan', 864, 37.5897, 127.4942, '경기도', '경기', '하', true, false],
  ['manisan', '마니산', 'Manisan', 472, 37.6133, 126.4486, '인천광역시', '인천', '하', true, false],

  // 강원 (18)
  ['seoraksan', '설악산', 'Seoraksan', 1708, 38.1196, 128.4655, '강원특별자치도', '강원', '상', true, true],
  ['odaesan', '오대산', 'Odaesan', 1563, 37.7960, 128.5430, '강원특별자치도', '강원', '중', true, true],
  ['chiaksan', '치악산', 'Chiaksan', 1288, 37.3697, 128.0531, '강원특별자치도', '강원', '중', true, true],
  ['dutasan', '두타산', 'Dutasan', 1353, 37.4181, 129.0469, '강원특별자치도', '강원', '상', true, true],
  ['hwaaksan', '화악산', 'Hwaaksan', 1468, 37.9961, 127.5114, '경기도', '경기', '상', true, false],
  ['gyebangsan', '계방산', 'Gyebangsan', 1577, 37.7325, 128.4742, '강원특별자치도', '강원', '중', true, true],
  ['gariwangsan', '가리왕산', 'Gariwangsan', 1561, 37.4486, 128.5697, '강원특별자치도', '강원', '상', true, true],
  ['balwangsan', '발왕산', 'Balwangsan', 1458, 37.6633, 128.6850, '강원특별자치도', '강원', '중', true, false],
  ['jeombongsan', '점봉산', 'Jeombongsan', 1424, 38.0397, 128.4250, '강원특별자치도', '강원', '상', true, true],
  ['bangtaesan', '방태산', 'Bangtaesan', 1444, 38.0125, 128.3061, '강원특별자치도', '강원', '상', true, false],
  ['baekdeoksan', '백덕산', 'Baekdeoksan', 1350, 37.3175, 128.2944, '강원특별자치도', '강원', '중', true, true],
  ['eungbongsan', '응봉산', 'Eungbongsan', 999, 37.0850, 129.2972, '강원특별자치도', '강원', '중', true, false],
  ['garisan', '가리산', 'Garisan', 1051, 37.8133, 127.9089, '강원특별자치도', '강원', '중', true, false],
  ['daeamsan', '대암산', 'Daeamsan', 1304, 38.2272, 128.1297, '강원특별자치도', '강원', '중', true, false],
  ['samaksan', '삼악산', 'Samaksan', 654, 37.8567, 127.6489, '강원특별자치도', '강원', '중', true, false],
  ['yonghwasan-cc', '용화산', 'Yonghwasan', 878, 38.0064, 127.6708, '강원특별자치도', '강원', '중', true, false],
  ['gongjaksan', '공작산', 'Gongjaksan', 887, 37.7144, 127.9533, '강원특별자치도', '강원', '하', true, false],
  ['taebaeksan', '태백산', 'Taebaeksan', 1567, 37.0998, 128.9165, '강원특별자치도', '강원', '중', true, true],

  // 충북·충남·세종·대전 (12)
  ['sobaeksan', '소백산', 'Sobaeksan', 1439, 36.9583, 128.4905, '충청북도', '충북', '중', true, true],
  ['woraksan', '월악산', 'Woraksan', 1094, 36.8855, 128.1064, '충청북도', '충북', '상', true, false],
  ['songnisan', '속리산', 'Songnisan', 1058, 36.5294, 127.8728, '충청북도', '충북', '중', true, true],
  ['gubyeongsan', '구병산', 'Gubyeongsan', 877, 36.4853, 127.8589, '충청북도', '충북', '중', true, false],
  ['doraksan', '도락산', 'Doraksan', 964, 36.8786, 128.3017, '충청북도', '충북', '중', true, false],
  ['geumsusan', '금수산', 'Geumsusan', 1016, 36.9989, 128.2569, '충청북도', '충북', '중', true, false],
  ['chilbosan', '칠보산', 'Chilbosan', 778, 36.7711, 127.9694, '충청북도', '충북', '중', true, false],
  ['minjujisan', '민주지산', 'Minjujisan', 1242, 36.0531, 127.7997, '충청북도', '충북', '상', true, false],
  ['gyeryongsan', '계룡산', 'Gyeryongsan', 845, 36.3517, 127.2208, '충청남도', '충남', '중', true, false],
  ['chilgapsan', '칠갑산', 'Chilgapsan', 561, 36.4256, 126.8403, '충청남도', '충남', '하', true, false],
  ['gwangdeoksan', '광덕산', 'Gwangdeoksan', 699, 36.6483, 126.9914, '충청남도', '충남', '하', true, false],
  ['deoksungsan', '덕숭산', 'Deoksungsan', 495, 36.6536, 126.6206, '충청남도', '충남', '하', true, false],
  ['daedunsan', '대둔산', 'Daedunsan', 878, 36.0828, 127.3344, '충청남도', '충남', '중', true, false],
  ['seodaesan', '서대산', 'Seodaesan', 904, 36.1672, 127.5306, '충청남도', '충남', '중', true, false],

  // 전북 (8)
  ['deogyusan', '덕유산', 'Deogyusan', 1614, 35.8602, 127.7466, '전북특별자치도', '전북', '중', true, true],
  ['naejangsan', '내장산', 'Naejangsan', 763, 35.4783, 126.8847, '전북특별자치도', '전북', '중', true, false],
  ['moaksan', '모악산', 'Moaksan', 794, 35.7344, 127.0997, '전북특별자치도', '전북', '하', true, false],
  ['maisan', '마이산', 'Maisan', 685, 35.7656, 127.4083, '전북특별자치도', '전북', '중', true, false],
  ['unjangsan', '운장산', 'Unjangsan', 1126, 35.9528, 127.4475, '전북특별자치도', '전북', '중', true, true],
  ['jeoksangsan', '적상산', 'Jeoksangsan', 1034, 35.9636, 127.7036, '전북특별자치도', '전북', '중', true, false],
  ['byeonsan', '내변산', 'Byeonsan', 508, 35.6294, 126.5814, '전북특별자치도', '전북', '하', true, false],
  ['seonunsan', '선운산', 'Seonunsan', 336, 35.4994, 126.5747, '전북특별자치도', '전북', '하', true, false],
  ['jangansan', '장안산', 'Jangansan', 1237, 35.6300, 127.5639, '전북특별자치도', '전북', '중', true, true],

  // 전남·광주 (8)
  ['jirisan', '지리산', 'Jirisan', 1915, 35.3372, 127.7307, '전라남도', '전남', '상', true, true],
  ['mudeungsan', '무등산', 'Mudeungsan', 1187, 35.1342, 126.9886, '광주광역시', '광주', '중', true, false],
  ['wolchulsan', '월출산', 'Wolchulsan', 809, 34.7600, 126.6883, '전라남도', '전남', '상', true, false],
  ['cheongwansan', '천관산', 'Cheongwansan', 723, 34.5392, 126.9197, '전라남도', '전남', '중', true, false],
  ['duryunsan', '두륜산', 'Duryunsan', 700, 34.4753, 126.6225, '전라남도', '전남', '중', true, false],
  ['baekunsan-gy', '백운산', 'Baekunsan (Gwangyang)', 1222, 35.0708, 127.6125, '전라남도', '전남', '중', true, true],
  ['jogyesan', '조계산', 'Jogyesan', 884, 35.0083, 127.3267, '전라남도', '전남', '중', true, false],
  ['chuwolsan', '추월산', 'Chuwolsan', 731, 35.4244, 126.9608, '전라남도', '전남', '중', true, false],
  ['gangcheonsan', '강천산', 'Gangcheonsan', 583, 35.4769, 127.0928, '전북특별자치도', '전북', '하', true, false],
  ['baegamsan', '백암산', 'Baegamsan', 741, 35.5097, 126.8744, '전북특별자치도', '전북', '중', true, false],
  ['palyeongsan', '팔영산', 'Palyeongsan', 609, 34.6553, 127.4286, '전라남도', '전남', '중', true, false],

  // 경북·대구 (10)
  ['juwangsan', '주왕산', 'Juwangsan', 720, 36.3933, 129.1769, '경상북도', '경북', '중', true, false],
  ['palgongsan', '팔공산', 'Palgongsan', 1192, 36.0050, 128.6936, '대구광역시', '대구', '중', true, false],
  ['gayasan', '가야산', 'Gayasan', 1430, 35.8204, 128.1206, '경상남도', '경남', '중', true, false],
  ['cheongnyangsan', '청량산', 'Cheongnyangsan', 870, 36.7956, 128.9061, '경상북도', '경북', '중', true, false],
  ['juheulsan', '주흘산', 'Juheulsan', 1108, 36.7556, 128.0683, '경상북도', '경북', '중', true, false],
  ['ilwolsan', '일월산', 'Ilwolsan', 1219, 36.7917, 129.0631, '경상북도', '경북', '중', true, false],
  ['naeyeonsan', '내연산', 'Naeyeonsan', 711, 36.2553, 129.2872, '경상북도', '경북', '중', true, false],
  ['biseulsan', '비슬산', 'Biseulsan', 1084, 35.7144, 128.5300, '대구광역시', '대구', '중', true, false],
  ['geumosan-gm', '금오산', 'Geumosan', 977, 36.0922, 128.3047, '경상북도', '경북', '중', true, false],
  ['tohamsan', '토함산', 'Tohamsan', 745, 35.7836, 129.3458, '경상북도', '경북', '중', true, false],
  ['hwangaksan', '황악산', 'Hwangaksan', 1111, 36.1789, 127.9006, '경상북도', '경북', '중', true, true],

  // 경남·울산·부산 (12)
  ['hwangmaesan', '황매산', 'Hwangmaesan', 1108, 35.5306, 128.0683, '경상남도', '경남', '중', true, false],
  ['hwangseoksan', '황석산', 'Hwangseoksan', 1190, 35.6361, 127.8158, '경상남도', '경남', '중', true, false],
  ['gajisan', '가지산', 'Gajisan', 1241, 35.6028, 129.0017, '경상남도', '경남', '상', true, false],
  ['sinbulsan', '신불산', 'Sinbulsan', 1159, 35.5478, 129.0494, '울산광역시', '울산', '중', true, false],
  ['cheonseongsan', '천성산', 'Cheonseongsan', 922, 35.4078, 129.0517, '경상남도', '경남', '중', true, false],
  ['hwawangsan', '화왕산', 'Hwawangsan', 757, 35.5414, 128.5108, '경상남도', '경남', '중', true, false],
  ['jaeyaksan', '재약산', 'Jaeyaksan', 1108, 35.5781, 128.9447, '경상남도', '경남', '중', true, false],
  ['mireuksan-ty', '미륵산', 'Mireuksan', 461, 34.8128, 128.4053, '경상남도', '경남', '하', true, false],
  ['geumjeongsan', '금정산', 'Geumjeongsan', 802, 35.2750, 129.0394, '부산광역시', '부산', '중', true, false],
  ['muhaksan', '무학산', 'Muhaksan', 761, 35.2167, 128.5489, '경상남도', '경남', '중', true, false],
  ['geumsan', '금산', 'Geumsan', 705, 34.7461, 127.9842, '경상남도', '경남', '중', true, false],
  ['saryangdo', '사량도지리산', 'Saryangdo Jirisan', 398, 34.8419, 128.2389, '경상남도', '경남', '중', true, false],

  // 충북 추가 (백두대간 보강)
  ['daeyasan', '대야산', 'Daeyasan', 931, 36.7253, 127.9914, '충청북도', '충북', '상', true, true],
  ['heuiyangsan', '희양산', 'Heuiyangsan', 999, 36.7531, 128.0531, '충청북도', '충북', '상', true, true],
  ['joryeongsan', '조령산', 'Joryeongsan', 1026, 36.7456, 128.0386, '충청북도', '충북', '중', true, true],
  ['baekhwasan', '백화산', 'Baekhwasan', 933, 36.2986, 127.9633, '충청북도', '충북', '중', true, false],
  ['hwanghaksan-gs', '황학산', 'Hwanghaksan', 1111, 36.7544, 127.9389, '충청북도', '충북', '중', true, false],

  // 제주
  ['hallasan', '한라산', 'Hallasan', 1947, 33.3617, 126.5292, '제주특별자치도', '제주', '중', true, false],

  // 정선·강원 백두대간 보강
  ['hambaeksan', '함백산', 'Hambaeksan', 1573, 37.1631, 128.9162, '강원특별자치도', '강원', '중', true, true],
  ['hwangbyeongsan', '황병산', 'Hwangbyeongsan', 1407, 37.7964, 128.6939, '강원특별자치도', '강원', '중', true, true],
  ['noinbong', '노인봉', 'Noinbong', 1338, 37.7406, 128.6403, '강원특별자치도', '강원', '중', true, true],
  ['cheongoksan', '청옥산', 'Cheongoksan', 1404, 37.4067, 129.0067, '강원특별자치도', '강원', '상', true, true],
  ['duwibong', '두위봉', 'Duwibong', 1466, 37.2244, 128.8492, '강원특별자치도', '강원', '중', true, false],

  // 기타 100대 명산
  ['yeoninsan', '연인산', 'Yeoninsan', 1068, 37.9389, 127.4172, '경기도', '경기', '중', true, false],
  ['myeongseongsan', '명성산', 'Myeongseongsan', 922, 38.1281, 127.2911, '경기도', '경기', '중', true, false],
];

export const PEAKS_SEED: PeakSeed[] = RAW.map(
  ([slug, name_ko, name_en, elevation_m, latitude, longitude, region, region_short, difficulty, list_korea_100, list_baekdudaegan]) => ({
    slug,
    name_ko,
    name_en,
    elevation_m,
    latitude,
    longitude,
    region,
    region_short,
    difficulty,
    list_korea_100,
    list_baekdudaegan,
    description: null,
  })
);

export const TOTAL_TARGET = 100;
