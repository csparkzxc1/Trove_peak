// RN/Web 모두 호환되는 Uint8Array → base64 변환.
// expo-file-system 의존성을 피하기 위해 수동 구현.
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i] ?? 0;
    const b2 = i + 1 < bytes.length ? bytes[i + 1] ?? 0 : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] ?? 0 : 0;
    result +=
      CHARS.charAt(b1 >> 2) +
      CHARS.charAt(((b1 & 3) << 4) | (b2 >> 4)) +
      (i + 1 < bytes.length ? CHARS.charAt(((b2 & 15) << 2) | (b3 >> 6)) : '=') +
      (i + 2 < bytes.length ? CHARS.charAt(b3 & 63) : '=');
  }
  return result;
}

export async function uriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('사진 파일을 읽지 못했습니다.');
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') ?? 'image/jpeg';
  return { base64: bytesToBase64(new Uint8Array(arrayBuffer)), mimeType };
}
