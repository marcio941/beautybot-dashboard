import { NextResponse } from "next/server";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";
const INSTANCE = process.env.EVOLUTION_INSTANCE || "";

export async function GET() {
  try {
    const res = await fetch(`${EVOLUTION_URL}/chat/findChats/${INSTANCE}`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Evolution API error: ${res.status}`);

    const data = await res.json();

    const conversations = (Array.isArray(data) ? data : []).map((chat: any) => ({
      id: chat.id,
      phone: chat.id?.replace("@s.whatsapp.net", ""),
      name: chat.name || chat.pushName || chat.id?.replace("@s.whatsapp.net", ""),
      lastMsg: chat.lastMessage?.message?.conversation || chat.lastMessage?.message?.extendedTextMessage?.text || "...",
      time: chat.lastMessage?.messageTimestamp
        ? new Date(chat.lastMessage.messageTimestamp * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        : "",
      unread: chat.unreadCount || 0,
    }));

    return NextResponse.json(conversations);
  } catch (err: any) {
    console.error("Conversations error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
