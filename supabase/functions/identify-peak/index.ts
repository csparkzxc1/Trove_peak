// Supabase Edge Function (Deno).
// Claude Vision API에 사용자가 찍은 봉우리 사진을 보내 어느 봉우리인지 식별한다.
//
// 배포:
//   1) supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   2) supabase functions deploy identify-peak --no-verify-jwt=false
//
// 요청 본문 (POST application/json):
//   {
//     imageBase64: string,             // "iVBORw0..." (data URL prefix 없이)
//     mimeType: "image/jpeg" | "image/png" | "image/webp",
//     candidates?: { slug, name_ko, name_en?, distance_m? }[],  // GPS로 좁힌 후보
//     gpsLat?: number,
//     gpsLng?: number,
//   }
//
// 응답: { match: { slug: string | null, name_ko: string, confidence: number, reason: string } }

// deno-lint-ignore-file no-explicit-any
declare const Deno: { env: { get(name: string): string | undefined } };

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = Deno.env.get('CLAUDE_VISION_MODEL') ?? 'claude-sonnet-4-6';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Candidate = {
  slug: string;
  name_ko: string;
  name_en?: string | null;
  distance_m?: number | null;
};

type Body = {
  imageBase64: string;
  mimeType: string;
  candidates?: Candidate[];
  gpsLat?: number | null;
  gpsLng?: number | null;
};

function buildPrompt(body: Body): string {
  const lines: string[] = [];
  lines.push(
    '당신은 대한민국 100대 명산 식별 전문가입니다. 첨부된 사진은 사용자가 정상부 혹은 능선에서 찍은 사진입니다.'
  );
  lines.push(
    '사진에 보이는 산세, 정상석/표지석의 글자, 능선의 윤곽, 식생, 운해, 일출/일몰 등을 종합해 어떤 봉우리인지 판단해 주세요.'
  );
  if (body.gpsLat != null && body.gpsLng != null) {
    lines.push(
      `참고: 사진의 GPS 좌표는 약 (${body.gpsLat.toFixed(4)}, ${body.gpsLng.toFixed(4)}) 입니다.`
    );
  }
  if (body.candidates && body.candidates.length > 0) {
    lines.push('아래는 GPS 인근의 후보 봉우리 목록입니다. 가능하면 이 중에서 선택하세요:');
    for (const c of body.candidates) {
      const dist = c.distance_m != null ? ` · 약 ${Math.round(c.distance_m)}m` : '';
      lines.push(`  - ${c.name_ko}${c.name_en ? ` (${c.name_en})` : ''} [slug=${c.slug}]${dist}`);
    }
    lines.push('후보 중에 확신이 가는 봉우리가 없으면 slug를 null로 두고 자유 텍스트로 답해 주세요.');
  }
  lines.push('');
  lines.push('반드시 다음 JSON 한 줄로만 응답하세요. 다른 설명, 마크다운, 코드펜스 금지.');
  lines.push(
    '{"slug": <문자열 또는 null>, "name_ko": "<봉우리 이름>", "confidence": <0~1 실수>, "reason": "<한 줄 근거>"}'
  );
  return lines.join('\n');
}

function parseClaudeJson(text: string): { slug: string | null; name_ko: string; confidence: number; reason: string } {
  // 모델이 가끔 코드펜스를 붙이는 경우에 대비.
  const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  return {
    slug: typeof parsed.slug === 'string' ? parsed.slug : null,
    name_ko: typeof parsed.name_ko === 'string' ? parsed.name_ko : '식별 실패',
    confidence: Number.isFinite(parsed.confidence) ? Number(parsed.confidence) : 0,
    reason: typeof parsed.reason === 'string' ? parsed.reason : '',
  };
}

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...CORS, 'content-type': 'application/json' },
    });
  }
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.' }),
      { status: 500, headers: { ...CORS, 'content-type': 'application/json' } }
    );
  }

  // Plus 게이팅: 본인의 profiles.is_pro = true 여야 한다.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: '인증 헤더가 필요합니다.' }), {
      status: 401,
      headers: { ...CORS, 'content-type': 'application/json' },
    });
  }
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) {
    return new Response(JSON.stringify({ error: '사용자를 확인하지 못했습니다.' }), {
      status: 401,
      headers: { ...CORS, 'content-type': 'application/json' },
    });
  }
  const { data: profileRow } = await client
    .from('profiles')
    .select('is_pro, pro_expires_at')
    .eq('id', userData.user.id)
    .maybeSingle();
  const proExp = profileRow?.pro_expires_at
    ? new Date(profileRow.pro_expires_at as string).getTime()
    : null;
  const isPro =
    profileRow?.is_pro === true && (proExp === null || proExp > Date.now());
  if (!isPro) {
    return new Response(
      JSON.stringify({ error: 'AI 식별은 TROVE PLUS 정회원 기능입니다.' }),
      { status: 402, headers: { ...CORS, 'content-type': 'application/json' } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: '잘못된 JSON 본문입니다.' }), {
      status: 400,
      headers: { ...CORS, 'content-type': 'application/json' },
    });
  }

  if (!body.imageBase64 || !body.mimeType) {
    return new Response(
      JSON.stringify({ error: 'imageBase64와 mimeType이 필요합니다.' }),
      { status: 400, headers: { ...CORS, 'content-type': 'application/json' } }
    );
  }

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: body.mimeType,
                data: body.imageBase64,
              },
            },
            { type: 'text', text: buildPrompt(body) },
          ],
        },
      ],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    return new Response(
      JSON.stringify({ error: `Claude API 오류 ${claudeRes.status}`, detail: errText }),
      { status: 502, headers: { ...CORS, 'content-type': 'application/json' } }
    );
  }

  const data = (await claudeRes.json()) as any;
  const text: string =
    data?.content?.find((c: any) => c.type === 'text')?.text ?? '';
  try {
    const match = parseClaudeJson(text);
    return new Response(JSON.stringify({ match, raw: text }), {
      headers: { ...CORS, 'content-type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: '모델 응답을 JSON으로 해석하지 못했습니다.',
        raw: text,
      }),
      { status: 502, headers: { ...CORS, 'content-type': 'application/json' } }
    );
  }
}

// deno-lint-ignore no-explicit-any
;(globalThis as any).Deno?.serve?.(handle);
// Backwards compat for older deploy runtimes:
addEventListener('fetch', (event: any) => {
  event.respondWith(handle(event.request as Request));
});
