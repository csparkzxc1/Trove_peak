import * as ImagePicker from 'expo-image-picker';

export type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
  exifLat: number | null;
  exifLng: number | null;
  exifTakenAt: string | null;
  mimeType: string;
};

function parseExif(exif: Record<string, unknown> | null | undefined): {
  lat: number | null;
  lng: number | null;
  takenAt: string | null;
} {
  if (!exif) return { lat: null, lng: null, takenAt: null };

  const rawLat = exif.GPSLatitude;
  const rawLng = exif.GPSLongitude;
  const latRef = (exif.GPSLatitudeRef as string | undefined) ?? 'N';
  const lngRef = (exif.GPSLongitudeRef as string | undefined) ?? 'E';

  const toNumber = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const lat = toNumber(rawLat);
  const lng = toNumber(rawLng);
  const signedLat = lat !== null ? (latRef === 'S' ? -lat : lat) : null;
  const signedLng = lng !== null ? (lngRef === 'W' ? -lng : lng) : null;

  const taken =
    (exif.DateTimeOriginal as string | undefined) ??
    (exif.DateTime as string | undefined) ??
    null;
  let takenAtIso: string | null = null;
  if (taken && typeof taken === 'string') {
    // EXIF: "2025:09:14 11:32:08" → "2025-09-14T11:32:08"
    const normalized = taken.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3').replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) takenAtIso = parsed.toISOString();
  }

  return { lat: signedLat, lng: signedLng, takenAt: takenAtIso };
}

function buildPicked(asset: ImagePicker.ImagePickerAsset): PickedPhoto {
  const exif = parseExif(asset.exif);
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    exifLat: exif.lat,
    exifLng: exif.lng,
    exifTakenAt: exif.takenAt,
    mimeType: asset.mimeType ?? 'image/jpeg',
  };
}

export async function pickFromCamera(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error('카메라 권한이 필요합니다.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    exif: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return buildPicked(result.assets[0]);
}

export async function pickFromGallery(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('사진 라이브러리 접근 권한이 필요합니다.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    exif: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  return buildPicked(result.assets[0]);
}
