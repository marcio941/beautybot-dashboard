"use client";

const stats = [
  { label: "Agendamentos Hoje", value: "12", change: "+3", positive: true, icon: "📅" },
  { label: "Mensagens Recebidas", value: "47", change: "+18%", positive: true, icon: "💬" },
  { label: "Conversões IA", value: "89%", change: "+5%", positive: true, icon: "🤖" },
  { label: "Receita do Mês", value: "R$ 18.4k", change: "+12%", positive: true, icon: "✨" },
];

const recentAppointments = [
  { name: "Juliana Mendes", service: "Limpeza de Pele", time: "09:00", status: "confirmado", avatar: "J" },
  { name: "Carla Souza", service: "Preenchimento Labial", time: "10:30", status: "confirmado", avatar: "C" },
  { name: "Fernanda Lima", service: "Botox", time: "11:00", status: "pendente", avatar: "F" },
  { name: "Ana Paula", service: "Microagulhamento", time: "14:00", status: "confirmado", avatar: "A" },
  { name: "Beatriz Costa", service: "Depilação a Laser", time: "15:30", status: "cancelado", avatar: "B" },
];

const recentMessages = [
  { name: "Mariana R.", msg: "Quero agendar para sexta-feira", time: "há 5min", unread: true },
  { name: "Letícia M.", msg: "Qual o preço do botox?", time: "há 12min", unread: true },
  { name: "Sandra P.", msg: "Confirmado! Obrigada ✨", time: "há 1h", unread: false },
  { name: "Débora A.", msg: "Pode remarcar meu horário?", time: "há 2h", unread: true },
];

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  confirmado: { bg: "rgba(201,169,110,0.12)", color: "#C9A96E", label: "Confirmado" },
  pendente: { bg: "rgba(212,130,154,0.12)", color: "#D4829A", label: "Pendente" },
  cancelado: { bg: "rgba(90,82,72,0.3)", color: "#9A8F7E", label: "Cancelado" },
};

export default function Dashboard() {
  return (
    <div style={{ padding: "36px 40px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div
          className="font-display"
          style={{ fontSize: 32, fontWeight: 300, color: "#F5F0E8", letterSpacing: "-0.01em", lineHeight: 1.1 }}
        >
          Bom dia, Admin ✦
        </div>
        <div style={{ color: "#9A8F7E", fontSize: 13, marginTop: 4 }}>
          Quinta-feira, 29 de Maio de 2025 · Clínica Bella Estética
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "linear-gradient(135deg, #12121A 0%, #0E0E16 100%)",
              border: "1px solid rgba(201,169,110,0.1)",
              borderRadius: 16,
              padding: "20px 22px",
              transition: "border-color 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.3)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.1)")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span
                style={{
                  fontSize: 11,
                  color: s.positive ? "#C9A96E" : "#D4829A",
                  background: s.positive ? "rgba(201,169,110,0.1)" : "rgba(212,130,154,0.1)",
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontWeight: 500,
                }}
              >
                {s.change}
              </span>
            </div>
            <div className="font-display" style={{ fontSize: 28, fontWeight: 400, color: "#F5F0E8", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ color: "#5A5248", fontSize: 11, marginTop: 4, letterSpacing: "0.03em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        {/* Appointments table */}
        <div
          style={{
            background: "#12121A",
            border: "1px solid rgba(201,169,110,0.1)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(201,169,110,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="font-display" style={{ fontSize: 18, fontWeight: 400, color: "#F5F0E8" }}>
                Agendamentos de Hoje
              </div>
              <div style={{ color: "#5A5248", fontSize: 11, marginTop: 2 }}>5 procedimentos agendados</div>
            </div>
            <button
              style={{
                background: "rgba(201,169,110,0.1)",
                border: "1px solid rgba(201,169,110,0.2)",
                color: "#C9A96E",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Ver todos
            </button>
          </div>
          <div>
            {recentAppointments.map((apt, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 24px",
                  borderBottom: i < recentAppointments.length - 1 ? "1px solid rgba(201,169,110,0.05)" : "none",
                  transition: "background 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(201,169,110,0.03)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
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
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {apt.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 500 }}>{apt.name}</div>
                  <div style={{ color: "#5A5248", fontSize: 11, marginTop: 2 }}>{apt.service}</div>
                </div>
                <div style={{ color: "#9A8F7E", fontSize: 12 }}>{apt.time}</div>
                <span
                  style={{
                    fontSize: 11,
                    background: statusColors[apt.status].bg,
                    color: statusColors[apt.status].color,
                    padding: "3px 10px",
                    borderRadius: 10,
                    fontWeight: 500,
                  }}
                >
                  {statusColors[apt.status].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent WhatsApp messages */}
        <div
          style={{
            background: "#12121A",
            border: "1px solid rgba(201,169,110,0.1)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(201,169,110,0.08)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M11.999 1C5.925 1 1 5.925 1 12c0 1.982.52 3.843 1.429 5.453L1 23l5.695-1.406A10.96 10.96 0 0012 23c6.075 0 11-4.925 11-11S18.075 1 12 1z" />
            </svg>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 400, color: "#F5F0E8" }}>
              WhatsApp Recentes
            </div>
            <span
              style={{
                marginLeft: "auto",
                background: "#D4829A",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 10,
                padding: "2px 8px",
              }}
            >
              3 novos
            </span>
          </div>
          <div>
            {recentMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 20px",
                  borderBottom: i < recentMessages.length - 1 ? "1px solid rgba(201,169,110,0.05)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background: msg.unread ? "rgba(37,211,102,0.02)" : "transparent",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(201,169,110,0.03)")}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = msg.unread ? "rgba(37,211,102,0.02)" : "transparent")
                }
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #C9A96E, #7A6240)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0A0A0F",
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {msg.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <div style={{ color: "#F5F0E8", fontSize: 12, fontWeight: msg.unread ? 600 : 400 }}>{msg.name}</div>
                    <div style={{ color: "#5A5248", fontSize: 10 }}>{msg.time}</div>
                  </div>
                  <div
                    style={{
                      color: msg.unread ? "#9A8F7E" : "#5A5248",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {msg.msg}
                  </div>
                </div>
                {msg.unread && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#25D366",
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* IA Activity */}
          <div
            style={{
              margin: "12px 20px",
              background: "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.12)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div style={{ color: "#C9A96E", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>🤖 IA em atividade</div>
            <div style={{ color: "#9A8F7E", fontSize: 11, lineHeight: 1.5 }}>
              Respondendo Letícia M. sobre preços de botox automaticamente...
            </div>
          </div>
        </div>
      </div>

      {/* Flow overview strip */}
      <div
        style={{
          marginTop: 24,
          background: "#12121A",
          border: "1px solid rgba(201,169,110,0.1)",
          borderRadius: 16,
          padding: "20px 28px",
        }}
      >
        <div style={{ color: "#5A5248", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
          Fluxo de Atendimento
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[
            { label: "Cliente envia mensagem", icon: "📱", color: "#25D366" },
            { label: "Evolution API recebe", icon: "⚡", color: "#C9A96E" },
            { label: "N8N processa", icon: "🔄", color: "#C9A96E" },
            { label: "IA responde / agenda", icon: "🤖", color: "#D4829A" },
            { label: "Notificação enviada", icon: "✅", color: "#C9A96E" },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "rgba(201,169,110,0.04)",
                  border: `1px solid rgba(201,169,110,0.1)`,
                  borderRadius: 10,
                  padding: "12px 8px",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{step.icon}</div>
                <div style={{ color: "#9A8F7E", fontSize: 10, lineHeight: 1.4 }}>{step.label}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ color: "#5A5248", fontSize: 16, padding: "0 8px" }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
