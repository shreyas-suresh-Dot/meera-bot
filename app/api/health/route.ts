export async function GET() {
  return Response.json({
    ok: true,
    app: "Skinstinct Content Engine",
    telegramChannelChatId: process.env.TELEGRAM_CHANNEL_CHAT_ID || null,
    telegramWebhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
  });
}
