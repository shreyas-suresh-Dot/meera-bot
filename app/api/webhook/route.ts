import { draftNote, scoreNote } from "@/app/lib/gemini";
import { sendTelegramMessage } from "@/app/lib/telegram";
import { upsertDraft, upsertNote } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secret = request.headers.get("x-telegram-bot-api-secret-token");

    if (secret && process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("Forbidden", { status: 403 });
    }

    const update = body as {
      channel_post?: { chat?: { id?: number }; message_id?: number; text?: string };
      message?: { chat?: { id?: number }; message_id?: number; text?: string; reply_to_message?: { message_id?: number } };
      callback_query?: { data?: string; message?: { chat?: { id?: number }; message_id?: number } };
    };

    const channelPost = update?.channel_post || update?.message;

    if (!channelPost) {
      return Response.json({ ok: true, ignored: true, reason: "no_channel_post_or_message" }, { status: 200 });
    }

    const chatId = channelPost.chat?.id;
    const messageId = channelPost.message_id;
    const text = channelPost.text || "";

    if (!chatId || !messageId || !text) {
      return Response.json({ ok: true, ignored: true, reason: "missing_chat_or_text" }, { status: 200 });
    }

    if (!process.env.TELEGRAM_CHANNEL_CHAT_ID) {
      return Response.json({ ok: false, error: "TELEGRAM_CHANNEL_CHAT_ID missing" }, { status: 500 });
    }

    if (String(chatId) !== String(process.env.TELEGRAM_CHANNEL_CHAT_ID)) {
      return Response.json({
        ok: false,
        error: "channel_mismatch",
        expected: String(process.env.TELEGRAM_CHANNEL_CHAT_ID),
        received: String(chatId),
      }, { status: 200 });
    }

    const result = await scoreNote(text);

    await upsertNote({
      telegram_chat_id: chatId,
      telegram_message_id: messageId,
      content: text,
      score: result.score,
      status: result.status,
      rejection_reason: result.status === "reject" ? result.reason : null,
    });

    if (result.status === "reject") {
      await sendTelegramMessage(
        chatId,
        `Rejected: ${result.reason}`
      );
      return Response.json({ ok: true, status: "rejected" });
    }

    const keywords = result.keywords || [];
    const draft = await draftNote(text, keywords);

    const draftText = `${draft}\n\nReply APPROVE or REJECT to this message`;

    await upsertDraft({
      note_id: null,
      telegram_message_id: messageId,
      draft_text: draftText,
      status: "pending",
    });

    await sendTelegramMessage(chatId, draftText);

    return Response.json({ ok: true, status: "drafted" });
  } catch (error: unknown) {
    console.error("Webhook error", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
