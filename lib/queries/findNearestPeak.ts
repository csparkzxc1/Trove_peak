import type { Peak } from '@/lib/types';
import { haversineMeters, type Coords } from '@/lib/location';

export type NearestPeak = {
  peak: Peak;
  distanceMeters: number;
};

export function findNearestPeak(
  origin: Coords,
  peaks: Peak[],
  options: { maxMeters?: number } = {}
): NearestPeak | null {
  const max = options.maxMeters ?? 5_000;
  let best: NearestPeak | null = null;
  for (const p of peaks) {
    const d = haversineMeters(origin, { latitude: p.latitude, longitude: p.longitude });
    if (d > max) continue;
    if (!best || d < best.distanceMeters) {
      best = { peak: p, distanceMeters: d };
    }
  }
  return best;
}
