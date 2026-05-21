// Supabase Edge Function (Deno).
// RevenueCat 웹훅 → profiles.is_pro / pro_expires_at 갱신.
//
// 환경 변수:
//   REVENUECAT_WEBHOOK_SECRET  — RevenueCat 대시보드의 Authorization 헤더 secret
//   SUPABASE_URL               — 자동 주입
//   SUPABASE_SERVICE_ROLE_KEY  — Supabase 콘솔 → API → service_role
//
// 배포:
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET=...
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
//   supabase functions deploy revenuecat-webhook --no-verify-jwt
//
// RevenueCat 대시보드 → Integrations → Webhooks:
//   URL:          https://<project>.functions.supabase.co/revenuecat-webhook
//   Auth header:  Bearer <REVENUECAT_WEBHOOK_SECRET>
//
// 처리 이벤트(RevenueCat docs 기준):
//   INITIAL_PURCHASE, RENEWAL, PRODUCT_CHANGE, UNCANCELLATION  → is_pro = true
//   EXPIRATION                                                  → is_pro = false
//   CANCELLATION                                                → no-op (만료 시점까지 유지)

// deno-lint-ignore-file no-explicit-any
declare const Deno: { env: { get(name: string): string | undefined } };

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
}

type RevenueCatEvent = {
  api_version: string;
  event: {
    type: string;
    app_user_id: string;
    original_app_user_id?: string;
    expiration_at_ms?: number | null;
    product_id?: string;
    period_type?: string;
  };
};

const ACTIVATING_TYPES = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
]);
const DEACTIVATING_TYPES = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, { status: 405 });
  }
  if (!WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
    return json({ error: '환경 변수가 누락되었습니다.' }, { status: 500 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${WEBHOOK_SECRET}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: RevenueCatEvent;
  try {
    payload = (await req.json()) as RevenueCatEvent;
  } catch {
    return json({ error: '잘못된 JSON 본문' }, { status: 400 });
  }
  const evt = payload.event;
  if (!evt?.type || !evt?.app_user_id) {
    return json({ error: 'event.type/app_user_id 누락' }, { status: 400 });
  }

  const userId = evt.app_user_id;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  if (ACTIVATING_TYPES.has(evt.type)) {
    const expiresAt =
      evt.expiration_at_ms && evt.expiration_at_ms > 0
        ? new Date(evt.expiration_at_ms).toISOString()
        : null; // lifetime/non-renewing: null = 무기한
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: true, pro_expires_at: expiresAt })
      .eq('id', userId);
    if (error) return json({ error: error.message }, { status: 500 });
  } else if (DEACTIVATING_TYPES.has(evt.type)) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: false, pro_expires_at: null })
      .eq('id', userId);
    if (error) return json({ error: error.message }, { status: 500 });
  }
  // CANCELLATION, BILLING_ISSUE, TRANSFER 등은 만료 이벤트가 따로 오므로 no-op.

  return json({ ok: true, type: evt.type, user: userId });
}

;(globalThis as any).Deno?.serve?.(handle);
addEventListener('fetch', (event: any) => {
  event.respondWith(handle(event.request as Request));
});
