export function getSupabaseUrl() {
  return process.env.SUPABASE_URL || "";
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export async function upsertNote(payload: Record<string, unknown>) {
  const url = `${getSupabaseUrl()}/rest/v1/notes?on_conflict=telegram_message_id`;
  const key = getSupabaseServiceRoleKey();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert note failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function upsertDraft(payload: Record<string, unknown>) {
  const url = `${getSupabaseUrl()}/rest/v1/drafts?on_conflict=telegram_message_id`;
  const key = getSupabaseServiceRoleKey();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase insert draft failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function updateDraftDecision(telegramMessageId: number, status: "approved" | "rejected", decisionReason?: string) {
  const key = getSupabaseServiceRoleKey();
  const url = `${getSupabaseUrl()}/rest/v1/drafts?telegram_message_id=eq.${telegramMessageId}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      status,
      decided_at: new Date().toISOString(),
      decision_reason: decisionReason || null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase update draft failed: ${res.status} ${text}`);
  }

  return res.json();
}
