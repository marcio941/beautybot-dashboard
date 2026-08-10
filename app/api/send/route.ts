import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const leadId = body?.leadId;
    const texto = typeof body?.texto === "string" ? body.texto.trim() : "";
    const isFollowUp = body?.followUp === true;

    if (!leadId || !texto) {
      return NextResponse.json({ error: "Informe o lead e o texto da mensagem." }, { status: 400 });
    }

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("conta_id")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfil?.conta_id) {
      return NextResponse.json({ error: "Conta do usuário não encontrada." }, { status: 404 });
    }

    const { data: conta, error: contaError } = await supabase
      .from("contas")
      .select("whatsapp_instance")
      .eq("id", perfil.conta_id)
      .single();

    if (contaError || !conta?.whatsapp_instance) {
      return NextResponse.json({ error: "Instância do WhatsApp não configurada para essa conta." }, { status: 400 });
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, phone")
      .eq("id", leadId)
      .eq("conta_id", perfil.conta_id)
      .single();

    if (leadError || !lead?.phone) {
      return NextResponse.json({ error: "Lead não encontrado ou sem telefone cadastrado." }, { status: 404 });
    }

    const sendRes = await fetch(`${EVOLUTION_URL}/message/sendText/${conta.whatsapp_instance}`, {
      method: "POST",
      headers: {
        "apikey": EVOLUTION_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number: lead.phone, text: texto }),
      cache: "no-store",
    });

    if (!sendRes.ok) {
      throw new Error(`Falha ao enviar mensagem via WhatsApp (status ${sendRes.status}).`);
    }

    const { data: mensagem, error: insertError } = await supabase
      .from("mensagens")
      .insert({ conta_id: perfil.conta_id, lead_id: leadId, remetente: "humano", texto })
      .select("id, remetente, texto, created_at")
      .single();

    if (insertError) {
      console.error("Erro ao registrar mensagem enviada:", insertError);
      return NextResponse.json({ error: "Mensagem enviada, mas houve falha ao registrar no histórico." }, { status: 500 });
    }

    let followUp = null;
    if (isFollowUp) {
      const { data: fup, error: fupError } = await supabase
        .from("follow_ups")
        .insert({ conta_id: perfil.conta_id, lead_id: leadId, mensagem: texto, canal: "whatsapp" })
        .select("id, mensagem, enviado_em, canal")
        .single();

      if (fupError) {
        console.error("Erro ao registrar follow-up:", fupError);
        return NextResponse.json({ error: "Mensagem enviada, mas houve falha ao registrar o follow-up." }, { status: 500 });
      }
      followUp = fup;
    }

    return NextResponse.json({ success: true, mensagem, followUp });
  } catch (err: any) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: err.message || "Erro ao enviar mensagem." }, { status: 500 });
  }
}
