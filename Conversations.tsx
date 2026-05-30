"use client";
import { useState } from "react";

const contacts = [
  {
    id: 1,
    name: "Letícia Martins",
    phone: "5511999990001",
    lastMsg: "Qual o preço do botox?",
    time: "12min",
    unread: 2,
    status: "em atendimento ia",
  },
  {
    id: 2,
    name: "Mariana Rocha",
    phone: "5511999990002",
    lastMsg: "Quero agendar para sexta",
    time: "18min",
    unread: 1,
    status: "aguardando",
  },
  {
    id: 3,
    name: "Débora Assis",
    phone: "5511999990003",
    lastMsg: "Pode remarcar meu horário?",
    time: "2h",
    unread: 1,
    status: "aguardando",
  },
  {
    id: 4,
    name: "Sandra Pereira",
    phone: "5511999990004",
    lastMsg: "Confirmado! Obrigada ✨",
    time: "3h",
    unread: 0,
    status: "resolvido",
  },
  {
    id: 5,
    name: "Carla Souza",
    phone: "5511999990005",
    lastMsg: "Até amanhã 😊",
    time: "5h",
    unread: 0,
    status: "resolvido",
  },
];

const chatMessages: Record<number, Array<{ from: "client" | "ia" | "human"; text: string; time: string }>> = {
  1: [
    { from: "client", text: "Oi! Vi que vocês fazem botox", time: "11:30" },
    { from: "ia", text: "Olá! 😊 Sim, realizamos botox com profissional especializado. O procedimento é personalizado para cada cliente.", time: "11:30" },
    { from: "client", text: "Qual o preço?", time: "11:32" },
    { from: "ia", text: "O valor do botox varia de R$ 400 a R$ 800, dependendo da área e quantidade de toxina. Para uma avaliação personalizada e precisa, posso agendar uma consulta gratuita para você! 💫", time: "11:32" },
    { from: "client", text: "Qual o preço do botox?", time: "11:43" },
    { from: "ia", text: "Como mencionei, o valor varia conforme a região tratada. Posso agendar uma avaliação gratuita para você ter um orçamento exato. Temos horários disponíveis ainda esta semana! Que dia funciona melhor para você?", time: "11:43" },
  ],
  2: [
    { from: "client", text: "Oi, quero agendar para sexta-feira", time: "11:25" },
    { from: "ia", text: "Oi! Que ótimo 😊 Qual serviço você gostaria de agendar na sexta?", time: "11:25" },
    { from: "client", text: "Limpeza de pele", time: "11:26" },
    { from: "ia", text: "Perfeito! Temos horários disponíveis na sexta-feira:\n• 09:00 com Dra. Ana\n• 14:00 com Dra. Ana\n• 16:00 com Dr. Carlos\n\nQual prefere?", time: "11:26" },
    { from: "client", text: "Quero agendar para sexta", time: "11:43" },
  ],
  3: [
    { from: "client", text: "Boa tarde! Preciso remarcar meu horário de amanhã", time: "09:15" },
    { from: "ia", text: "Boa tarde! 😊 Claro, sem problema. Qual é o seu nome para eu localizar o agendamento?", time: "09:15" },
    { from: "client", text: "Débora Assis", time: "09:16" },
    { from: "ia", text: "Encontrei! Você tem agendado Microagulhamento amanhã às 11:00 com Dra. Ana. Para qual data você gostaria de remarcar?", time: "09:16" },
    { from: "client", text: "Pode remarcar meu horário?", time: "10:05" },
  ],
};

const statusColors: Record<string, string> = {
  "em atendimento ia": "#C9A96E",
  aguardando: "#D4829A",
  resolvido: "#5A5248",
};

export default function Conversations() {
  const [selected, setSelected] = useState<number>(1);
  const [inputMsg, setInputMsg] = useState("");

  const msgs = chatMessages[selected] || [];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Contacts list */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid rgba(201,169,110,0.08)",
          display: "flex",
          flexDirection: "column",
          background: "#0E0E16",
        }}
      >
        <div style={{ padding: "28px 20px 16px" }}>
          <div className="font-display" style={{ fontSize: 22, color: "#F5F0E8", fontWeight: 300 }}>
            Conversas
          </div>
          <div
            style={{
              marginTop: 12,
              background: "#12121A",
              border: "1px solid rgba(201,169,110,0.1)",
              borderRadius: 8,
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A5248" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              placeholder="Buscar conversa..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#F5F0E8",
                fontSize: 12,
                fontFamily: "DM Sans, sans-serif",
                flex: 1,
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {contacts.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 20px",
                cursor: "pointer",
                background: selected === c.id ? "rgba(201,169,110,0.06)" : "transparent",
                borderLeft: selected === c.id ? "2px solid #C9A96E" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #D4829A, #8B4A5E)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {c.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ color: "#5A5248", fontSize: 10 }}>{c.time}</div>
                </div>
                <div
                  style={{
                    color: "#5A5248",
                    fontSize: 11,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.lastMsg}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: 9,
                      color: statusColors[c.status],
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {c.status}
                  </span>
                  {c.unread > 0 && (
                    <span
                      style={{
                        background: "#25D366",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 10,
                        padding: "1px 6px",
                      }}
                    >
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Chat header */}
        {selected && (
          <>
            <div
              style={{
                padding: "18px 28px",
                borderBottom: "1px solid rgba(201,169,110,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 14,
                background: "#0E0E16",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #D4829A, #8B4A5E)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {contacts.find((c) => c.id === selected)?.name[0]}
              </div>
              <div>
                <div style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 500 }}>
                  {contacts.find((c) => c.id === selected)?.name}
                </div>
                <div style={{ color: "#25D366", fontSize: 11, marginTop: 1 }}>
                  📱 {contacts.find((c) => c.id === selected)?.phone}
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <button
                  style={{
                    background: "rgba(201,169,110,0.1)",
                    border: "1px solid rgba(201,169,110,0.2)",
                    color: "#C9A96E",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  🤖 IA Ativa
                </button>
                <button
                  style={{
                    background: "rgba(212,130,154,0.1)",
                    border: "1px solid rgba(212,130,154,0.2)",
                    color: "#D4829A",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  ✋ Assumir Atendimento
                </button>
                <button
                  style={{
                    background: "rgba(37,211,102,0.1)",
                    border: "1px solid rgba(37,211,102,0.2)",
                    color: "#25D366",
                    borderRadius: 8,
                    padding: "6px 14px",
                    fontSize: 11,
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  📅 Agendar
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                background: "#0A0A0F",
              }}
            >
              {msgs.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.from === "client" ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "65%",
                      background:
                        msg.from === "client"
                          ? "#12121A"
                          : msg.from === "ia"
                          ? "linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(201,169,110,0.08) 100%)"
                          : "rgba(37,211,102,0.1)",
                      border:
                        msg.from === "client"
                          ? "1px solid rgba(201,169,110,0.08)"
                          : msg.from === "ia"
                          ? "1px solid rgba(201,169,110,0.2)"
                          : "1px solid rgba(37,211,102,0.2)",
                      borderRadius: msg.from === "client" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                      padding: "10px 14px",
                    }}
                  >
                    {msg.from !== "client" && (
                      <div
                        style={{
                          fontSize: 9,
                          color: msg.from === "ia" ? "#C9A96E" : "#25D366",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {msg.from === "ia" ? "🤖 IA BeautyBot" : "👤 Atendente"}
                      </div>
                    )}
                    <div style={{ color: "#F5F0E8", fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                      {msg.text}
                    </div>
                    <div style={{ color: "#5A5248", fontSize: 10, marginTop: 4, textAlign: "right" }}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div
              style={{
                padding: "16px 28px",
                borderTop: "1px solid rgba(201,169,110,0.08)",
                background: "#0E0E16",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <input
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Digite uma mensagem manualmente..."
                style={{
                  flex: 1,
                  background: "#12121A",
                  border: "1px solid rgba(201,169,110,0.15)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  color: "#F5F0E8",
                  fontSize: 13,
                  fontFamily: "DM Sans, sans-serif",
                  outline: "none",
                }}
              />
              <button
                style={{
                  background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                  border: "none",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "12px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                Enviar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
