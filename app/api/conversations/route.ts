import { NextResponse } from "next/server";

const N8N_PROXY = "https://n8n-n8n-webhook.tkukfu.easypanel.host/webhook/10892952-8a56-4612-8a9d-6601fb38b2be";

export async function GET() {
  try {
    const res = await fetch(N8N_PROXY, { cache: "no-store" });
    const data = await res.json();

    const chats = Array.isArray(data) ? data : [data];

    const conversations = chats.map((chat: any) => ({
      phone: chat.remoteJid?.replace("@s.whatsapp.net", ""),
      name: chat.pushName || chat.remoteJid?.replace("@s.whatsapp.net", ""),
      lastMsg: chat.lastMessage?.message?.conversation || "...",
      time: chat.lastMessage?.messageTimestamp
        ? new Date(chat.lastMessage.messageTimestamp * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "",
      unread: chat.unreadCount || 0,
    }));

    return NextResponse.json(conversations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}