export type Peak = {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  elevation_m: number;
  latitude: number;
  longitude: number;
  region: string;
  region_short: string | null;
  difficulty: '하' | '중' | '상' | '최상' | null;
  list_korea_100: boolean;
  list_baekdudaegan: boolean;
  description: string | null;
  created_at: string;
};

export type Ascent = {
  id: string;
  user_id: string;
  peak_id: string;
  photo_url: string | null;
  photo_processed_url: string | null;
  card_url: string | null;
  ascended_at: string;
  gps_lat: number | null;
  gps_lng: number | null;
  course_distance_m: number | null;
  course_duration_min: number | null;
  weather: unknown;
  notes: string | null;
  is_public: boolean;
  created_at: string;
};

export type PeakWithAscent = Peak & {
  ascent: Pick<Ascent, 'id' | 'ascended_at'> | null;
};
