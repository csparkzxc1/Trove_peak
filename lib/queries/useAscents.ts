import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export type AscentRow = {
  id: string;
  peak_id: string;
  ascended_at: string;
  photo_url: string | null;
  cutout_url: string | null;
  notes: string | null;
  is_public: boolean;
};

export function useMyAscents() {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  return useQuery<AscentRow[]>({
    queryKey: ['ascents', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!isSupabaseConfigured || !userId) return [];
      const { data, error } = await supabase
        .from('ascents')
        .select('id, peak_id, ascended_at, photo_url, cutout_url, notes, is_public')
        .eq('user_id', userId)
        .order('ascended_at', { ascending: false });
      if (error) return [];
      return (data ?? []) as AscentRow[];
    },
    staleTime: 30_000,
  });
}

export function useMyAscentForPeak(peakId: string | undefined) {
  const all = useMyAscents();
  return {
    ...all,
    data: peakId ? all.data?.find((a) => a.peak_id === peakId) ?? null : null,
  };
}
