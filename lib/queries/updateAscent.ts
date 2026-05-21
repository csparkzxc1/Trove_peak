import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type UpdateAscentInput = {
  ascentId: string;
  notes: string | null;
  isPublic: boolean;
  ascendedAt: Date;
};

export function useUpdateAscent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAscentInput) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase 설정이 필요합니다.');
      }
      const { error } = await supabase
        .from('ascents')
        .update({
          notes: input.notes,
          is_public: input.isPublic,
          ascended_at: input.ascendedAt.toISOString(),
        })
        .eq('id', input.ascentId);
      if (error) {
        throw new Error(`기록을 수정하지 못했습니다: ${error.message}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  });
}

export function useDeleteAscent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ascentId: string) => {
      if (!isSupabaseConfigured) {
        throw new Error('Supabase 설정이 필요합니다.');
      }
      const { error } = await supabase.from('ascents').delete().eq('id', ascentId);
      if (error) {
        throw new Error(`기록을 삭제하지 못했습니다: ${error.message}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ascents'] }),
  });
}
