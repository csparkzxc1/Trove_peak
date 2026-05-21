import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export type ProfileRow = {
  id: string;
  nickname: string;
  is_pro: boolean;
  pro_expires_at: string | null;
};

export type CollectionSummary = {
  user_id: string;
  nickname: string;
  collected_peak_ids: string[];
  collected_count: number;
};

export function useMyProfile() {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  return useQuery<ProfileRow | null>({
    queryKey: ['my-profile', userId],
    enabled: Boolean(isSupabaseConfigured && userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, is_pro, pro_expires_at')
        .eq('id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return data as ProfileRow;
    },
    staleTime: 60_000,
  });
}

export function useEntitlements() {
  const profile = useMyProfile();
  const now = Date.now();
  const expiresAt = profile.data?.pro_expires_at
    ? new Date(profile.data.pro_expires_at).getTime()
    : null;
  const isPro =
    profile.data?.is_pro === true && (expiresAt === null || expiresAt > now);
  return {
    isPro,
    expiresAt,
    isLoading: profile.isLoading,
  };
}

export function useSearchProfiles(query: string) {
  const q = query.trim();
  return useQuery<ProfileRow[]>({
    queryKey: ['profiles', 'search', q.toLowerCase()],
    enabled: isSupabaseConfigured && q.length >= 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname')
        .ilike('nickname', `%${q}%`)
        .order('nickname', { ascending: true })
        .limit(10);
      if (error) return [];
      return (data ?? []) as ProfileRow[];
    },
    staleTime: 30_000,
  });
}

export function useCollectionSummary(nickname: string | undefined | null) {
  return useQuery<CollectionSummary | null>({
    queryKey: ['collection_summary', nickname],
    enabled: Boolean(isSupabaseConfigured && nickname),
    queryFn: async () => {
      if (!nickname) return null;
      const { data, error } = await supabase
        .from('collection_summary')
        .select('user_id, nickname, collected_peak_ids, collected_count')
        .eq('nickname', nickname)
        .maybeSingle();
      if (error || !data) return null;
      return data as CollectionSummary;
    },
    staleTime: 30_000,
  });
}
