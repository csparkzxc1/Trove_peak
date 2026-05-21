import { useMutation } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uriToBase64 } from '@/lib/base64';
import type { Peak } from '@/lib/types';

export type IdentifyInput = {
  photoUri: string;
  photoMimeType: string;
  gpsLat?: number | null;
  gpsLng?: number | null;
  candidates?: { slug: string; name_ko: string; name_en?: string | null; distance_m?: number | null }[];
};

export type IdentifyMatch = {
  slug: string | null;
  name_ko: string;
  confidence: number;
  reason: string;
};

export type IdentifyResult = {
  match: IdentifyMatch;
  matchedPeak: Peak | null;
};

export function useIdentifyPeak(allPeaks: Peak[] | undefined) {
  return useMutation({
    mutationFn: async (input: IdentifyInput): Promise<IdentifyResult> => {
      if (!isSupabaseConfigured) {
        throw new Error(
          'AI 식별은 Supabase + identify-peak Edge Function 배포 후 사용할 수 있습니다.'
        );
      }

      const { base64 } = await uriToBase64(input.photoUri);

      const { data, error } = await supabase.functions.invoke('identify-peak', {
        body: {
          imageBase64: base64,
          mimeType: input.photoMimeType,
          gpsLat: input.gpsLat ?? null,
          gpsLng: input.gpsLng ?? null,
          candidates: input.candidates ?? [],
        },
      });

      if (error) {
        throw new Error(`AI 식별 호출에 실패했습니다: ${error.message}`);
      }

      const match: IdentifyMatch = data?.match ?? {
        slug: null,
        name_ko: '식별 실패',
        confidence: 0,
        reason: '응답 없음',
      };

      const matchedPeak =
        match.slug && allPeaks ? allPeaks.find((p) => p.slug === match.slug) ?? null : null;

      return { match, matchedPeak };
    },
  });
}
