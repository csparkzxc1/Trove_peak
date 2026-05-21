// Supabase Edge Function (Deno).
// remove.bg API로 봉우리 사진의 배경을 분리해 PNG로 저장, ascents.cutout_url을 갱신한다.
//
// 환경 변수:
//   REMOVEBG_API_KEY   — https://www.remove.bg/dashboard 에서 발급한 키
//   SUPABASE_URL       — 자동 주입 (functions 런타임)
//   SUPABASE_ANON_KEY  — 자동 주입
//
// 배포:
//   supabase secrets set REMOVEBG_API_KEY=...
//   supabase functions deploy remove-bg
//
// 요청 (POST application/json, Authorization 헤더에 사용자 JWT 필요):
//   { ascent_id: string, photo_url: string }
// 응답:
//   { cutout_url: string }

// deno-lint-ignore-file no-explicit-any
declare const Deno: { env: { get(name: string): string | undefined } };

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const REMOVEBG_API_KEY = Deno.env.get('REMOVEBG_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const BUCKET = 'ascent-photos';

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...CORS, 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, { status: 405 });

  if (!REMOVEBG_API_KEY) {
    return json({ error: 'REMOVEBG_API_KEY 환경 변수가 설정되지 않았습니다.' }, { status: 500 });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: 'Supabase 환경 변수 누락' }, { status: 500 });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: '인증 헤더가 필요합니다.' }, { status: 401 });

  let body: { ascent_id?: string; photo_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: '잘못된 JSON 본문' }, { status: 400 });
  }
  if (!body.ascent_id || !body.photo_url) {
    return json({ error: 'ascent_id와 photo_url이 필요합니다.' }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // 사용자 검증.
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return json({ error: '사용자를 확인하지 못했습니다.' }, { status: 401 });
  }
  const userId = userData.user.id;

  // 1) 원본 사진을 다운로드.
  const photoRes = await fetch(body.photo_url);
  if (!photoRes.ok) {
    return json({ error: '원본 사진을 가져오지 못했습니다.' }, { status: 502 });
  }
  const photoBytes = new Uint8Array(await photoRes.arrayBuffer());

  // 2) remove.bg로 보냄.
  const formData = new FormData();
  formData.append(
    'image_file',
    new Blob([new Uint8Array(photoBytes)], { type: 'image/jpeg' }),
    'photo.jpg'
  );
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const bgRes = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': REMOVEBG_API_KEY },
    body: formData,
  });
  if (!bgRes.ok) {
    const detail = await bgRes.text();
    return json(
      { error: `remove.bg 오류 ${bgRes.status}`, detail },
      { status: 502 }
    );
  }
  const cutoutBytes = new Uint8Array(await bgRes.arrayBuffer());

  // 3) Storage에 업로드 (사용자 폴더로).
  const path = `${userId}/cutout-${body.ascent_id}.png`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, cutoutBytes, {
      contentType: 'image/png',
      upsert: true,
    });
  if (upErr) {
    return json({ error: `Storage 업로드 실패: ${upErr.message}` }, { status: 502 });
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const cutoutUrl = pub.publicUrl;

  // 4) ascents.cutout_url 업데이트 (RLS가 본인 ascent에만 허용).
  const { error: updErr } = await supabase
    .from('ascents')
    .update({ cutout_url: cutoutUrl })
    .eq('id', body.ascent_id);
  if (updErr) {
    return json({ error: `ascent 업데이트 실패: ${updErr.message}` }, { status: 502 });
  }

  return json({ cutout_url: cutoutUrl });
}

;(globalThis as any).Deno?.serve?.(handle);
addEventListener('fetch', (event: any) => {
  event.respondWith(handle(event.request as Request));
});
