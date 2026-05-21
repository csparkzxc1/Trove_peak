import { supabase } from './supabase';

export const ASCENT_BUCKET = 'ascent-photos';

function inferExtension(mimeType: string, uri: string): string {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('heic')) return 'heic';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  const m = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return m?.[1]?.toLowerCase() ?? 'jpg';
}

export async function uploadAscentPhoto(args: {
  userId: string;
  uri: string;
  mimeType: string;
}): Promise<{ path: string; publicUrl: string }> {
  const ext = inferExtension(args.mimeType, args.uri);
  const path = `${args.userId}/${Date.now()}.${ext}`;

  const response = await fetch(args.uri);
  if (!response.ok) {
    throw new Error('사진 파일을 읽지 못했습니다.');
  }
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from(ASCENT_BUCKET)
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: args.mimeType,
      upsert: false,
    });
  if (error) {
    throw new Error(`사진 업로드에 실패했습니다: ${error.message}`);
  }

  const { data } = supabase.storage.from(ASCENT_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
