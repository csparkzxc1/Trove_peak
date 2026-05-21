import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

export async function getCurrentCoords(): Promise<Coords> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) {
    throw new Error('위치 권한이 필요합니다.');
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
}

const EARTH_RADIUS_M = 6371_000;

export function haversineMeters(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}
