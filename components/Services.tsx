"use client";
import { useState } from "react";

const services = [
  { id: 1, name: "Limpeza de Pele", category: "Facial", duration: "60min", price: 180, active: true, bookings: 48 },
  { id: 2, name: "Preenchimento Labial", category: "Injetáveis", duration: "45min", price: 350, active: true, bookings: 32 },
  { id: 3, name: "Botox", category: "Injetáveis", duration: "30min", price: 500, active: true, bookings: 61 },
  { id: 4, name: "Microagulhamento", category: "Facial", duration: "90min", price: 280, active: true, bookings: 27 },
  { id: 5, name: "Depilação a Laser", category: "Corporal", duration: "60min", price: 220, active: true, bookings: 54 },
  { id: 6, name: "Peeling Químico", category: "Facial", duration: "45min", price: 240, active: false, bookings: 19 },
  { id: 7, name: "Drenagem Linfática", category: "Corporal", duration: "60min", price: 160, active: true, bookings: 38 },
  { id: 8, name: "Radiofrequência", category: "Corporal", duration: "50min", price: 200, active: true, bookings: 22 },
];

const categories = ["Todos", "Facial", "Injetáveis", "Corporal"];
const categoryColors: Record<string, string> = {
  Facial: "#C9A96E",
  Injetáveis: "#D4829A",
  Corporal: "#7A9EC9",
};

export default function Services() {
  const [cat, setCat] = useState("Todos");

  const filtered = cat === "Todos" ? services : services.filter((s) => s.category === cat);

  return (
    <div style={{ padding: "36px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div className="font-display" style={{ fontSize: 32, fontWeight: 300, color: "#F5F0E8" }}>
            Serviços
          </div>
          <div style={{ color: "#5A5248", fontSize: 13, marginTop: 4 }}>
            Gerencie os serviços oferecidos pela clínica
          </div>
        </div>
        <button
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
          + Novo Serviço
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              background: cat === c ? "rgba(201,169,110,0.15)" : "transparent",
              border: `1px solid ${cat === c ? "rgba(201,169,110,0.4)" : "rgba(201,169,110,0.1)"}`,
              color: cat === c ? "#C9A96E" : "#5A5248",
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {filtered.map((svc) => (
          <div
            key={svc.id}
            style={{
              background: "#12121A",
              border: "1px solid rgba(201,169,110,0.1)",
              borderRadius: 16,
              padding: "22px",
              opacity: svc.active ? 1 : 0.5,
              transition: "border-color 0.2s, transform 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.3)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.1)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <span
                style={{
                  fontSize: 10,
                  background: `${categoryColors[svc.category]}18`,
                  color: categoryColors[svc.category] || "#C9A96E",
                  padding: "3px 10px",
                  borderRadius: 8,
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                }}
              >
                {svc.category}
              </span>
              <div
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 10,
                  background: svc.active ? "rgba(201,169,110,0.2)" : "rgba(90,82,72,0.3)",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 3px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: svc.active ? "#C9A96E" : "#5A5248",
                    marginLeft: svc.active ? "auto" : 0,
                    transition: "margin 0.2s",
                  }}
                />
              </div>
            </div>
            <div className="font-display" style={{ fontSize: 20, color: "#F5F0E8", fontWeight: 400, marginBottom: 6 }}>
              {svc.name}
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ color: "#9A8F7E", fontSize: 12 }}>⏱ {svc.duration}</div>
              <div style={{ color: "#C9A96E", fontSize: 12, fontWeight: 500 }}>R$ {svc.price}</div>
            </div>
            <div
              style={{
                borderTop: "1px solid rgba(201,169,110,0.08)",
                paddingTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#5A5248", fontSize: 11 }}>
                <span style={{ color: "#9A8F7E", fontWeight: 500 }}>{svc.bookings}</span> agendamentos
              </div>
              <button
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,169,110,0.15)",
                  color: "#9A8F7E",
                  borderRadius: 6,
                  padding: "4px 12px",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Prompt config */}
      <div
        style={{
          marginTop: 32,
          background: "linear-gradient(135deg, rgba(201,169,110,0.06) 0%, rgba(201,169,110,0.02) 100%)",
          border: "1px solid rgba(201,169,110,0.15)",
          borderRadius: 16,
          padding: "24px 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <div className="font-display" style={{ fontSize: 18, color: "#C9A96E", fontWeight: 400 }}>
            Prompt da IA — BeautyBot
          </div>
        </div>
        <div style={{ color: "#9A8F7E", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Configure como a IA vai apresentar e recomendar os serviços aos clientes no WhatsApp.
        </div>
        <textarea
          defaultValue={`Você é a BeautyBot, assistente virtual da Clínica Bella Estética. Seja sempre gentil, feminina e profissional. Quando um cliente perguntar sobre serviços, apresente os disponíveis de forma atraente, mencione o tempo de duração e o valor. Incentive o agendamento. Não forneça orçamentos exatos para injetáveis — convide para avaliação gratuita.`}
          rows={4}
          style={{
            width: "100%",
            background: "#0A0A0F",
            border: "1px solid rgba(201,169,110,0.15)",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#F5F0E8",
            fontSize: 12,
            fontFamily: "DM Sans, sans-serif",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.6,
          }}
        />
        <button
          style={{
            marginTop: 12,
            background: "linear-gradient(135deg, #C9A96E 0%, #8B5E3C 100%)",
            border: "none",
            color: "#0A0A0F",
            borderRadius: 8,
            padding: "9px 20px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Salvar Prompt
        </button>
      </div>
    </div>
  );
}
