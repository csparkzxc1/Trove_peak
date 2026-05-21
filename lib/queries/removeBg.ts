import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type RemoveBgInput = {
  ascentId: string;
  photoUrl: string;
};

export function useRemoveBackground() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RemoveBgInput): Promise<{ cutoutUrl: string }> => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase 설정이 필요합니다.');
      }
      const { data, error } = await supabase.functions.invoke('remove-bg', {
        body: { ascent_id: input.ascentId, photo_url: input.photoUrl },
      });
      if (error) {
        throw new Error(`스튜디오 처리 실패: ${error.message}`);
      }
      const cutoutUrl = (data as any)?.cutout_url as string | undefined;
      if (!cutoutUrl) {
        throw new Error('cutout_url을 받지 못했습니다.');
      }
      return { cutoutUrl };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ascents'] });
    },
  });
}
