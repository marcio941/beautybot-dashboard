import { NextResponse } from "next/server";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";
const INSTANCE = process.env.EVOLUTION_INSTANCE || "";

export async function GET(
  request: Request,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = params.phone;
    const remoteJid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;

    const res = await fetch(`${EVOLUTION_URL}/chat/findMessages/${INSTANCE}`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        where: { key: { remoteJid } },
        limit: 20,
      }),
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Evolution API error: ${res.status}`);

    const data = await res.json();
    const messages = (data?.messages?.records || data || []).map((msg: any) => ({
      id: msg.key?.id,
      from: msg.key?.fromMe ? "bot" : "client",
      text:
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "[mídia]",
      time: msg.messageTimestamp
        ? new Date(msg.messageTimestamp * 1000).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    }));

    return NextResponse.json(messages);
  } catch (err: any) {
    console.error("Messages error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
