import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAX_CLOCK_SKEW_SECONDS = 300;
const encoder = new TextEncoder();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function base64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function sign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const secret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!secret || !serviceRoleKey || !supabaseUrl) return json({ error: "function_not_configured" }, 500);

  const timestamp = req.headers.get("x-payment-timestamp") ?? "";
  const receivedSignature = req.headers.get("x-payment-signature") ?? "";
  const timestampNumber = Number(timestamp);
  if (!/^\d+$/.test(timestamp) || !Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > MAX_CLOCK_SKEW_SECONDS) {
    return json({ error: "invalid_or_expired_timestamp" }, 401);
  }

  const rawBody = await req.text();
  const expectedSignature = await sign(secret, `${timestamp}.${rawBody}`);
  if (!constantTimeEqual(expectedSignature, receivedSignature)) return json({ error: "invalid_signature" }, 401);

  let event: any;
  try { event = JSON.parse(rawBody); } catch { return json({ error: "invalid_json" }, 400); }
  if (event?.type !== "payment.succeeded") return json({ received: true, ignored: true });

  const data = event.data ?? {};
  const providerReference = data.provider_reference;
  const amount = Number(data.amount);
  const transactionType = data.transaction_type ?? "service_payment";
  if (typeof providerReference !== "string" || providerReference.length < 3 || !Number.isFinite(amount) || amount < 0 || data.currency !== "DZD" || !["service_payment", "platform_fee", "artisan_payout"].includes(transactionType)) {
    return json({ error: "invalid_payment_payload" }, 422);
  }
  if (data.request_id !== undefined && data.request_id !== null && !isUuid(data.request_id)) return json({ error: "invalid_request_id" }, 422);
  if (data.payer_id !== undefined && data.payer_id !== null && !isUuid(data.payer_id)) return json({ error: "invalid_payer_id" }, 422);
  if (data.artisan_id !== undefined && data.artisan_id !== null && !isUuid(data.artisan_id)) return json({ error: "invalid_artisan_id" }, 422);

  const response = await fetch(`${supabaseUrl}/rest/v1/financial_transactions?on_conflict=provider_reference`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify({
      request_id: data.request_id ?? null,
      payer_id: data.payer_id ?? null,
      artisan_id: data.artisan_id ?? null,
      amount,
      currency: "DZD",
      transaction_type: transactionType,
      status: "completed",
      provider_reference: providerReference,
    }),
  });

  if (!response.ok) {
    console.error("financial_transactions insert failed", response.status, await response.text());
    return json({ error: "transaction_persistence_failed" }, 502);
  }
  const rows = await response.json();
  return json({ received: true, duplicate: Array.isArray(rows) && rows.length === 0, transaction: rows?.[0] ?? null });
});
