"use client";
import { useState } from "react";

const appointments = [
  { id: 1, name: "Juliana Mendes", phone: "(11) 99999-1111", service: "Limpeza de Pele", professional: "Dra. Ana", date: "29/05", time: "09:00", duration: "60min", value: "R$ 180", status: "confirmado", source: "whatsapp" },
  { id: 2, name: "Carla Souza", phone: "(11) 99999-2222", service: "Preenchimento Labial", professional: "Dra. Ana", date: "29/05", time: "10:30", duration: "45min", value: "R$ 350", status: "confirmado", source: "whatsapp" },
  { id: 3, name: "Fernanda Lima", phone: "(11) 99999-3333", service: "Botox", professional: "Dr. Carlos", date: "29/05", time: "11:00", duration: "30min", value: "R$ 500", status: "pendente", source: "whatsapp" },
  { id: 4, name: "Ana Paula", phone: "(11) 99999-4444", service: "Microagulhamento", professional: "Dra. Ana", date: "29/05", time: "14:00", duration: "90min", value: "R$ 280", status: "confirmado", source: "whatsapp" },
  { id: 5, name: "Beatriz Costa", phone: "(11) 99999-5555", service: "Depilação a Laser", professional: "Dr. Carlos", date: "29/05", time: "15:30", duration: "60min", value: "R$ 220", status: "cancelado", source: "manual" },
  { id: 6, name: "Roberta Alves", phone: "(11) 99999-6666", service: "Limpeza de Pele", professional: "Dra. Ana", date: "30/05", time: "09:00", duration: "60min", value: "R$ 180", status: "confirmado", source: "whatsapp" },
  { id: 7, name: "Marina Santos", phone: "(11) 99999-7777", service: "Peeling Químico", professional: "Dr. Carlos", date: "30/05", time: "10:00", duration: "45min", value: "R$ 240", status: "pendente", source: "whatsapp" },
];

const statusMap: Record<string, { bg: string; color: string; label: string }> = {
  confirmado: { bg: "rgba(201,169,110,0.12)", color: "#C9A96E", label: "Confirmado" },
  pendente: { bg: "rgba(212,130,154,0.12)", color: "#D4829A", label: "Pendente" },
  cancelado: { bg: "rgba(90,82,72,0.3)", color: "#9A8F7E", label: "Cancelado" },
};

export default function Appointments() {
  const [filter, setFilter] = useState("todos");
  const [showModal, setShowModal] = useState(false);

  const filtered = filter === "todos" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "#F5F0E8" }}>
            Agendamentos
          </div>
          <div style={{ color: "#5A5248", fontSize: 13, marginTop: 4 }}>
            {appointments.length} agendamentos encontrados
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "linear-gradient(135deg, #C9A96E 0%, #8B5E3C 100%)",
            border: "none",
            color: "#0A0A0F",
            borderRadius: 10,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          + Novo Agendamento
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "todos", label: "Todos" },
          { key: "confirmado", label: "Confirmados" },
          { key: "pendente", label: "Pendentes" },
          { key: "cancelado", label: "Cancelados" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? "rgba(201,169,110,0.15)" : "transparent",
              border: `1px solid ${filter === f.key ? "rgba(201,169,110,0.4)" : "rgba(201,169,110,0.1)"}`,
              color: filter === f.key ? "#C9A96E" : "#5A5248",
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: "#12121A",
          border: "1px solid rgba(201,169,110,0.1)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(201,169,110,0.08)" }}>
              {["Cliente", "Serviço", "Profissional", "Data / Hora", "Duração", "Valor", "Origem", "Status", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "14px 20px",
                    textAlign: "left",
                    color: "#5A5248",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((apt, i) => (
              <tr
                key={apt.id}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(201,169,110,0.05)" : "none",
                  transition: "background 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(201,169,110,0.03)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
              >
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 500 }}>{apt.name}</div>
                  <div style={{ color: "#5A5248", fontSize: 11, marginTop: 2 }}>{apt.phone}</div>
                </td>
                <td style={{ padding: "14px 20px", color: "#9A8F7E", fontSize: 12 }}>{apt.service}</td>
                <td style={{ padding: "14px 20px", color: "#9A8F7E", fontSize: 12 }}>{apt.professional}</td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ color: "#F5F0E8", fontSize: 12 }}>{apt.date}</div>
                  <div style={{ color: "#5A5248", fontSize: 11 }}>{apt.time}</div>
                </td>
                <td style={{ padding: "14px 20px", color: "#9A8F7E", fontSize: 12 }}>{apt.duration}</td>
                <td style={{ padding: "14px 20px", color: "#C9A96E", fontSize: 12, fontWeight: 500 }}>{apt.value}</td>
                <td style={{ padding: "14px 20px" }}>
                  {apt.source === "whatsapp" ? (
                    <span style={{ color: "#25D366", fontSize: 11 }}>📱 WhatsApp</span>
                  ) : (
                    <span style={{ color: "#9A8F7E", fontSize: 11 }}>🖥️ Manual</span>
                  )}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      background: statusMap[apt.status].bg,
                      color: statusMap[apt.status].color,
                      padding: "3px 10px",
                      borderRadius: 10,
                      fontWeight: 500,
                    }}
                  >
                    {statusMap[apt.status].label}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <button
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(201,169,110,0.2)",
                      color: "#9A8F7E",
                      borderRadius: 6,
                      padding: "4px 10px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#12121A",
              border: "1px solid rgba(201,169,110,0.2)",
              borderRadius: 20,
              padding: 32,
              width: 480,
              maxWidth: "90vw",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display" style={{ fontSize: 24, color: "#F5F0E8", marginBottom: 24 }}>
              Novo Agendamento
            </div>
            {[
              { label: "Nome do Cliente", placeholder: "Ex: Juliana Mendes" },
              { label: "Telefone (WhatsApp)", placeholder: "(11) 99999-0000" },
              { label: "Serviço", placeholder: "Selecione o serviço" },
              { label: "Data", placeholder: "DD/MM/AAAA" },
              { label: "Horário", placeholder: "09:00" },
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: 16 }}>
                <label style={{ color: "#9A8F7E", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  {field.label}
                </label>
                <input
                  placeholder={field.placeholder}
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
            ))}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(201,169,110,0.15)",
                  color: "#9A8F7E",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                Cancelar
              </button>
              <button
                style={{
                  flex: 2,
                  background: "linear-gradient(135deg, #C9A96E 0%, #8B5E3C 100%)",
                  border: "none",
                  color: "#0A0A0F",
                  borderRadius: 10,
                  padding: "12px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
