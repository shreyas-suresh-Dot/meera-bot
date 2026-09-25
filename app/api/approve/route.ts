import { updateDraftDecision } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messageId = Number(body?.message_id || body?.callback_query?.message?.message_id || 0);
    const decision = String(body?.decision || "approved").toLowerCase();

    if (!messageId) {
      return Response.json({ ok: false, error: "message_id required" }, { status: 400 });
    }

    const finalDecision = decision === "rejected" ? "rejected" : "approved";
    await updateDraftDecision(messageId, finalDecision as "approved" | "rejected");

    return Response.json({ ok: true, status: finalDecision });
  } catch (error: unknown) {
    console.error("Approve route error", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
