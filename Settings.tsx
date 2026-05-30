"use client";
import { useState } from "react";

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900 }}>
      <div style={{ marginBottom: 36 }}>
        <div className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "#F5F0E8" }}>
          Configurações
        </div>
        <div style={{ color: "#5A5248", fontSize: 13, marginTop: 4 }}>
          Configure a integração com Evolution API, N8N e Claude AI
        </div>
      </div>

      {/* Section: Evolution API */}
      <Section title="Evolution API" icon="⚡" subtitle="Conexão WhatsApp Business">
        <Field label="URL da Evolution API" placeholder="https://sua-evolution-api.com" defaultValue="https://api.bellastetica.com" />
        <Field label="API Key" placeholder="sk-..." defaultValue="evo_••••••••••••••••" type="password" />
        <Field label="Nome da Instância" placeholder="bella-estetica-wp" defaultValue="bella-estetica-wp" />
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <StatusBadge active label="Conectado" />
          <span style={{ color: "#5A5248", fontSize: 12 }}>Última sincronização: agora há pouco</span>
          <button style={btnStyle}>Testar Conexão</button>
        </div>
      </Section>

      {/* Section: N8N */}
      <Section title="N8N Workflow" icon="🔄" subtitle="Automação de fluxos">
        <Field label="URL do N8N" placeholder="https://seu-n8n.app.n8n.cloud" defaultValue="https://bella.app.n8n.cloud" />
        <Field label="Webhook URL (receber mensagens)" placeholder="https://..." defaultValue="https://bella.app.n8n.cloud/webhook/whatsapp-in" />
        <Field label="Webhook URL (enviar resposta)" placeholder="https://..." defaultValue="https://bella.app.n8n.cloud/webhook/send-message" />
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <StatusBadge active label="Ativo" />
          <button style={btnStyle}>Ver Fluxos no N8N</button>
        </div>
      </Section>

      {/* Section: Claude AI */}
      <Section title="Claude AI (Anthropic)" icon="🤖" subtitle="Motor de inteligência artificial">
        <Field label="Anthropic API Key" placeholder="sk-ant-..." type="password" defaultValue="sk-ant-••••••••••••••" />
        <Field label="Modelo" placeholder="claude-sonnet-4-20250514" defaultValue="claude-sonnet-4-20250514" />
        <Field label="Temperatura (0.0 – 1.0)" placeholder="0.7" defaultValue="0.7" />
        <Field label="Máximo de tokens por resposta" placeholder="500" defaultValue="500" />
      </Section>

      {/* Section: Clinic */}
      <Section title="Dados da Clínica" icon="✦" subtitle="Informações exibidas para clientes">
        <Field label="Nome da Clínica" defaultValue="Clínica Bella Estética" />
        <Field label="Telefone de Contato" defaultValue="(11) 3000-0000" />
        <Field label="Endereço" defaultValue="Rua das Flores, 123 — São Paulo, SP" />
        <Field label="Horário de Funcionamento" defaultValue="Seg–Sex: 8h–19h | Sáb: 8h–14h" />
        <Field label="Mensagem de boas-vindas" defaultValue="Olá! 😊 Bem-vinda à Bella Estética! Sou a BeautyBot, sua assistente virtual. Como posso ajudar hoje?" />
        <Field label="Mensagem fora do horário" defaultValue="Nossa equipe está fora do horário de atendimento. Em breve uma consultora irá responder você!" />
      </Section>

      {/* N8N JSON Flow */}
      <Section title="Fluxo N8N — JSON para Importar" icon="📋" subtitle="Cole no N8N: File → Import from clipboard">
        <div
          style={{
            background: "#0A0A0F",
            border: "1px solid rgba(201,169,110,0.15)",
            borderRadius: 10,
            padding: "16px",
            fontFamily: "monospace",
            fontSize: 11,
            color: "#9A8F7E",
            lineHeight: 1.6,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {`{
  "name": "BeautyBot - WhatsApp Atendimento",
  "nodes": [
    {
      "name": "Webhook Evolution",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "whatsapp-in",
        "method": "POST"
      }
    },
    {
      "name": "Extrair Mensagem",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "phone": "={{ $json.data.key.remoteJid }}",
          "message": "={{ $json.data.message.conversation }}"
        }
      }
    },
    {
      "name": "Claude AI",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.anthropic.com/v1/messages",
        "method": "POST",
        "headers": {
          "x-api-key": "{{ $env.ANTHROPIC_KEY }}",
          "anthropic-version": "2023-06-01"
        },
        "body": {
          "model": "claude-sonnet-4-20250514",
          "max_tokens": 500,
          "messages": [{
            "role": "user",
            "content": "={{ $json.message }}"
          }]
        }
      }
    },
    {
      "name": "Enviar Resposta Evolution",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "={{ $env.EVOLUTION_URL }}/message/sendText/{{ $env.INSTANCE }}",
        "method": "POST",
        "body": {
          "number": "={{ $json.phone }}",
          "text": "={{ $json.content[0].text }}"
        }
      }
    }
  ]
}`}
        </div>
        <button
          onClick={() => navigator.clipboard?.writeText("flow-json")}
          style={{ ...btnStyle, marginTop: 10 }}
        >
          📋 Copiar JSON
        </button>
      </Section>

      {/* Save */}
      <div style={{ paddingBottom: 40 }}>
        <button
          onClick={handleSave}
          style={{
            background: saved
              ? "linear-gradient(135deg, #25D366 0%, #128C7E 100%)"
              : "linear-gradient(135deg, #C9A96E 0%, #8B5E3C 100%)",
            border: "none",
            color: saved ? "#fff" : "#0A0A0F",
            borderRadius: 10,
            padding: "12px 32px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
            transition: "background 0.3s",
          }}
        >
          {saved ? "✓ Configurações salvas!" : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(201,169,110,0.1)",
  border: "1px solid rgba(201,169,110,0.2)",
  color: "#C9A96E",
  borderRadius: 8,
  padding: "6px 16px",
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
};

function Section({ title, icon, subtitle, children }: { title: string; icon: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#12121A",
        border: "1px solid rgba(201,169,110,0.1)",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div className="font-display" style={{ fontSize: 20, color: "#F5F0E8", fontWeight: 400 }}>{title}</div>
      </div>
      <div style={{ color: "#5A5248", fontSize: 12, marginBottom: 20 }}>{subtitle}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, placeholder, defaultValue, type }: { label: string; placeholder?: string; defaultValue?: string; type?: string }) {
  return (
    <div>
      <label style={{ color: "#9A8F7E", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type || "text"}
        placeholder={placeholder}
        defaultValue={defaultValue}
        style={{
          width: "100%",
          background: "#0A0A0F",
          border: "1px solid rgba(201,169,110,0.15)",
          borderRadius: 8,
          padding: "10px 14px",
          color: "#F5F0E8",
          fontSize: 13,
          fontFamily: "DM Sans, sans-serif",
          outline: "none",
        }}
      />
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      style={{
        background: active ? "rgba(37,211,102,0.1)" : "rgba(90,82,72,0.3)",
        color: active ? "#25D366" : "#9A8F7E",
        border: `1px solid ${active ? "rgba(37,211,102,0.2)" : "rgba(90,82,72,0.3)"}`,
        borderRadius: 8,
        padding: "4px 12px",
        fontSize: 11,
        fontWeight: 500,
      }}
    >
      {active ? "● " : "○ "}{label}
    </span>
  );
}
