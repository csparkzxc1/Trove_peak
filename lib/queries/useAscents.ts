import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

type AscentRow = { id: string; peak_id: string; ascended_at: string };

export function useMyAscents() {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  return useQuery<AscentRow[]>({
    queryKey: ['ascents', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!isSupabaseConfigured || !userId) return [];
      const { data, error } = await supabase
        .from('ascents')
        .select('id, peak_id, ascended_at')
        .eq('user_id', userId)
        .order('ascended_at', { ascending: false });
      if (error) return [];
      return (data ?? []) as AscentRow[];
    },
    staleTime: 30_000,
  });
}
