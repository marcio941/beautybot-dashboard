"use client";

const stats = [
  { label: "Agendamentos Hoje", value: "12", change: "+3",   positive: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { label: "Mensagens Recebidas", value: "47", change: "+18%", positive: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  { label: "Conversões IA", value: "89%", change: "+5%",   positive: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
  { label: "Receita do Mês", value: "R$ 18.4k", change: "+12%", positive: true,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
];

const recentAppointments = [
  { name: "Juliana Mendes",  service: "Limpeza de Pele",      time: "09:00", status: "confirmado", avatar: "J" },
  { name: "Carla Souza",     service: "Preenchimento Labial",  time: "10:30", status: "confirmado", avatar: "C" },
  { name: "Fernanda Lima",   service: "Botox",                 time: "11:00", status: "pendente",   avatar: "F" },
  { name: "Ana Paula",       service: "Microagulhamento",      time: "14:00", status: "confirmado", avatar: "A" },
  { name: "Beatriz Costa",   service: "Depilação a Laser",     time: "15:30", status: "cancelado",  avatar: "B" },
];

const recentMessages = [
  { name: "Mariana R.", msg: "Quero agendar para sexta-feira",   time: "há 5min",  unread: true  },
  { name: "Letícia M.", msg: "Qual o preço do botox?",           time: "há 12min", unread: true  },
  { name: "Sandra P.",  msg: "Confirmado! Obrigada",             time: "há 1h",    unread: false },
  { name: "Débora A.",  msg: "Pode remarcar meu horário?",       time: "há 2h",    unread: true  },
];

const flowSteps = [
  { label: "Cliente envia mensagem",  color: "#25D366",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg> },
  { label: "Evolution API recebe",    color: "#C9A96E",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { label: "N8N processa",            color: "#C9A96E",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg> },
  { label: "IA responde",             color: "#D4829A",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4829A" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
  { label: "Resposta enviada",        color: "#C9A96E",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg> },
];

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  confirmado: { bg: "rgba(201,169,110,0.12)", color: "#C9A96E", label: "Confirmado" },
  pendente:   { bg: "rgba(212,130,154,0.12)", color: "#D4829A", label: "Pendente" },
  cancelado:  { bg: "rgba(90,82,72,0.25)",    color: "#9A8F7E", label: "Cancelado" },
};

export default function Dashboard() {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{ padding: "36px 40px", minHeight: "100vh", background: "var(--bg-deep)" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          className="font-display"
          style={{ fontSize: 30, fontWeight: 300, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}
        >
          {greeting}, Admin
        </div>
        <div style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4, textTransform: "capitalize" }}>
          {today} · Clínica Bella Estética
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              padding: "18px 20px",
              transition: "border-color 0.2s",
              cursor: "default",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{ color: "var(--gold)", opacity: 0.8 }}>{s.icon}</span>
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
            <div className="font-display" style={{ fontSize: 26, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        {/* Appointments */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 22px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="font-display" style={{ fontSize: 17, fontWeight: 400, color: "var(--text-primary)" }}>
                Agendamentos de Hoje
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>5 procedimentos</div>
            </div>
            <button
              style={{
                background: "rgba(201,169,110,0.08)",
                border: "1px solid var(--border)",
                color: "var(--gold)",
                borderRadius: 7,
                padding: "5px 13px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              Ver todos
            </button>
          </div>
          {recentAppointments.map((apt, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 22px",
                borderBottom: i < recentAppointments.length - 1 ? "1px solid var(--border)" : "none",
                transition: "background 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #D4829A, #8B4A5E)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {apt.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 500 }}>{apt.name}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 1 }}>{apt.service}</div>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>{apt.time}</div>
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

        {/* WhatsApp recentes */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M11.999 1C5.925 1 1 5.925 1 12c0 1.982.52 3.843 1.429 5.453L1 23l5.695-1.406A10.96 10.96 0 0012 23c6.075 0 11-4.925 11-11S18.075 1 12 1z" />
            </svg>
            <div className="font-display" style={{ fontSize: 17, fontWeight: 400, color: "var(--text-primary)" }}>
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

          <div style={{ flex: 1 }}>
            {recentMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "12px 18px",
                  borderBottom: i < recentMessages.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  background: msg.unread ? "rgba(37,211,102,0.025)" : "transparent",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)")}
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background = msg.unread ? "rgba(37,211,102,0.025)" : "transparent")
                }
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #C9A96E, #7A6240)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0A0A0F",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {msg.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: msg.unread ? 600 : 400 }}>
                      {msg.name}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 10 }}>{msg.time}</div>
                  </div>
                  <div
                    style={{
                      color: msg.unread ? "var(--text-secondary)" : "var(--text-muted)",
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
                      marginTop: 5,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* IA Activity */}
          <div
            style={{
              margin: "10px 16px 16px",
              background: "rgba(201,169,110,0.06)",
              border: "1px solid var(--border)",
              borderRadius: 9,
              padding: "11px 13px",
            }}
          >
            <div style={{ color: "var(--gold)", fontSize: 11, fontWeight: 600, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
              IA em atividade
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, lineHeight: 1.5 }}>
              Respondendo Letícia M. sobre preços de botox...
            </div>
          </div>
        </div>
      </div>

      {/* Flow strip */}
      <div
        style={{
          marginTop: 20,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "18px 24px",
        }}
      >
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 9,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Fluxo de Atendimento
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {flowSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "rgba(201,169,110,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "12px 8px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>{step.icon}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 10, lineHeight: 1.4 }}>{step.label}</div>
              </div>
              {i < flowSteps.length - 1 && (
                <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "0 6px" }}>›</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
