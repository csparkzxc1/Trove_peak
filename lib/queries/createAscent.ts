import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadAscentPhoto } from '@/lib/storage';
import type { Peak } from '@/lib/types';

export type CreateAscentInput = {
  userId: string;
  peak: Peak;
  photoUri: string;
  photoMimeType: string;
  ascendedAt: Date;
  gpsLat: number | null;
  gpsLng: number | null;
  notes: string | null;
};

async function resolveRealPeakId(peak: Peak): Promise<string> {
  if (!peak.id.startsWith('seed-')) return peak.id;
  // 시드 ID는 실제 DB의 UUID가 아니므로 slug로 조회한다.
  const { data, error } = await supabase
    .from('peaks')
    .select('id')
    .eq('slug', peak.slug)
    .maybeSingle();
  if (error || !data) {
    throw new Error(
      `봉우리 '${peak.name_ko}'가 데이터베이스에 없습니다. README 2-3의 시드 SQL을 먼저 실행해 주세요.`
    );
  }
  return data.id as string;
}

export function useCreateAscent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAscentInput) => {
      if (!isSupabaseConfigured) {
        throw new Error(
          '도감 기록은 Supabase 설정이 필요합니다. .env.local에 키를 추가해 주세요.'
        );
      }
      const peakId = await resolveRealPeakId(input.peak);

      const uploaded = await uploadAscentPhoto({
        userId: input.userId,
        uri: input.photoUri,
        mimeType: input.photoMimeType,
      });

      const { data, error } = await supabase
        .from('ascents')
        .insert({
          user_id: input.userId,
          peak_id: peakId,
          photo_url: uploaded.publicUrl,
          ascended_at: input.ascendedAt.toISOString(),
          gps_lat: input.gpsLat,
          gps_lng: input.gpsLng,
          notes: input.notes,
          is_public: true,
        })
        .select('id, peak_id, ascended_at')
        .single();

      if (error || !data) {
        throw new Error(`기록을 저장하지 못했습니다: ${error?.message ?? '알 수 없는 오류'}`);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ascents'] });
    },
  });
}
