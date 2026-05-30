import { NextResponse } from "next/server";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";
const INSTANCE = process.env.EVOLUTION_INSTANCE || "";

export async function POST(request: Request) {
  try {
    const { phone, text } = await request.json();
    const number = phone.includes("@") ? phone.replace("@s.whatsapp.net", "") : phone;

    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number, text }),
    });

    if (!res.ok) throw new Error(`Evolution API error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
