import { useQuery } from '@tanstack/react-query';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { PEAKS_SEED } from '@/constants/peaks-seed';
import type { Peak, PeakWithAscent } from '@/lib/types';

function seedAsPeaks(): Peak[] {
  return PEAKS_SEED.map((p, i) => ({
    ...p,
    id: `seed-${p.slug}`,
    description: p.description ?? null,
    created_at: new Date(2024, 0, i + 1).toISOString(),
  }));
}

export function usePeaks() {
  return useQuery<Peak[]>({
    queryKey: ['peaks'],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return seedAsPeaks();
      }
      const { data, error } = await supabase
        .from('peaks')
        .select('*')
        .order('elevation_m', { ascending: false });
      if (error) {
        return seedAsPeaks();
      }
      return (data ?? []) as Peak[];
    },
    staleTime: 60_000,
  });
}

export function usePeakBySlug(slug: string | undefined) {
  return useQuery<Peak | null>({
    queryKey: ['peak', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      if (!slug) return null;
      const fallback = seedAsPeaks().find((p) => p.slug === slug) ?? null;
      if (!isSupabaseConfigured) return fallback;
      const { data, error } = await supabase
        .from('peaks')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error || !data) return fallback;
      return data as Peak;
    },
  });
}

export function usePeakById(id: string | undefined) {
  return useQuery<Peak | null>({
    queryKey: ['peak-by-id', id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) return null;
      const seedHit = seedAsPeaks().find((p) => p.id === id || p.slug === id) ?? null;
      if (!isSupabaseConfigured || id.startsWith('seed-')) return seedHit;
      const { data, error } = await supabase
        .from('peaks')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return seedHit;
      return data as Peak;
    },
  });
}

export function decoratePeaksWithAscents(
  peaks: Peak[],
  ascents: { peak_id: string; id: string; ascended_at: string }[]
): PeakWithAscent[] {
  const byPeak = new Map<string, { id: string; ascended_at: string }>();
  for (const a of ascents) byPeak.set(a.peak_id, { id: a.id, ascended_at: a.ascended_at });
  return peaks.map((p) => ({ ...p, ascent: byPeak.get(p.id) ?? null }));
}
