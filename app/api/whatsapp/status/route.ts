import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || "";

export async function GET() {
  try {
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

    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${conta.whatsapp_instance}`, {
      method: "GET",
      headers: { "apikey": EVOLUTION_KEY },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Evolution API error: ${res.status}`);

    const data = await res.json();

    return NextResponse.json({ state: data?.instance?.state ?? data?.state ?? "unknown" });
  } catch (err: any) {
    console.error("WhatsApp status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
