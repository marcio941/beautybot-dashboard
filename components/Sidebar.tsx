"use client";
import { Page } from "@/app/page";

const navItems = [
  {
    id: "dashboard" as Page,
    label: "Visão Geral",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "appointments" as Page,
    label: "Agendamentos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: "conversations" as Page,
    label: "Conversas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    badge: 3,
  },
  {
    id: "services" as Page,
    label: "Serviços",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: "settings" as Page,
    label: "Configurações",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar({
  activePage,
  setActivePage,
}: {
  activePage: Page;
  setActivePage: (p: Page) => void;
}) {
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "linear-gradient(180deg, #0E0E16 0%, #0A0A0F 100%)",
        borderRight: "1px solid rgba(201,169,110,0.1)",
        display: "flex",
        flexDirection: "column",
        padding: "28px 0",
        position: "relative",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #C9A96E 0%, #8B5E3C 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            ✦
          </div>
          <div>
            <div
              className="font-display"
              style={{ color: "#C9A96E", fontSize: 18, fontWeight: 500, letterSpacing: "0.05em" }}
            >
              BeautyAI
            </div>
            <div style={{ color: "#5A5248", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Clínica Estética
            </div>
          </div>
        </div>

        {/* WhatsApp status */}
        <div
          style={{
            marginTop: 20,
            background: "rgba(37, 211, 102, 0.08)",
            border: "1px solid rgba(37, 211, 102, 0.2)",
            borderRadius: 8,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M11.999 1C5.925 1 1 5.925 1 12c0 1.982.52 3.843 1.429 5.453L1 23l5.695-1.406A10.96 10.96 0 0012 23c6.075 0 11-4.925 11-11S18.075 1 12 1zm0 20.001a8.96 8.96 0 01-4.786-1.38l-.344-.204-3.578.883.915-3.476-.225-.355A8.966 8.966 0 013 12c0-4.963 4.037-9 9-9s9 4.037 9 9-4.037 9.001-9 9.001z" />
            </svg>
          </span>
          <span style={{ color: "#25D366", fontSize: 11, fontWeight: 500 }}>WhatsApp Conectado</span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#25D366",
              marginLeft: "auto",
              animation: "pulse 2s infinite",
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px" }}>
        <div style={{ color: "#5A5248", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 12px 12px" }}>
          Menu
        </div>
        {navItems.map((item) => {
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: active
                  ? "linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(201,169,110,0.05) 100%)"
                  : "transparent",
                color: active ? "#C9A96E" : "#5A5248",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                letterSpacing: "0.02em",
                textAlign: "left",
                transition: "all 0.2s",
                position: "relative",
                borderLeft: active ? "2px solid #C9A96E" : "2px solid transparent",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    background: "#D4829A",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 10,
                    padding: "1px 7px",
                    minWidth: 20,
                    textAlign: "center",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "16px 24px 0", borderTop: "1px solid rgba(201,169,110,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #D4829A, #8B4A5E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#fff",
              fontWeight: 600,
            }}
          >
            A
          </div>
          <div>
            <div style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 500 }}>Admin</div>
            <div style={{ color: "#5A5248", fontSize: 10 }}>Gerente</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </aside>
  );
}
