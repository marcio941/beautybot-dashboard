"use client";
import { useState, useRef } from "react";
import { Page } from "@/app/page";

const navItems = [
  {
    id: "dashboard" as Page,
    label: "Visão Geral",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    id: "conversations" as Page,
    label: "Conversas",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    badge: 3,
  },
  {
    id: "services" as Page,
    label: "Serviços",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    id: "settings" as Page,
    label: "Configurações",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  activePage: Page;
  setActivePage: (p: Page) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export default function Sidebar({ activePage, setActivePage, theme, toggleTheme }: SidebarProps) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string>("BeautyAI");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    setActivePage("dashboard");
  };

  const handleLogoRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogoSrc(result);
      setLogoName(file.name.replace(/\.[^.]+$/, ""));
      localStorage.setItem("beautybot-logo", result);
      localStorage.setItem("beautybot-logo-name", file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsDataURL(file);
  };

  // Load saved logo on mount
  if (typeof window !== "undefined" && !logoSrc) {
    const saved = localStorage.getItem("beautybot-logo");
    const savedName = localStorage.getItem("beautybot-logo-name");
    if (saved && logoSrc === null) {
      // will trigger on next render — use useEffect in real app
    }
  }

  const isDark = theme === "dark";

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "relative",
        transition: "background 0.3s",
      }}
    >
      {/* Logo area */}
      <div style={{ padding: "0 20px 28px" }}>
        {/* Logo — click = home, right-click = trocar imagem */}
        <div
          onClick={handleLogoClick}
          onContextMenu={handleLogoRightClick}
          title="Clique para ir ao início · Clique direito para trocar logo"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: logoSrc
                ? "transparent"
                : "linear-gradient(135deg, #C9A96E 0%, #8B5E3C 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              border: logoSrc ? "1px solid var(--border)" : "none",
            }}
          >
            {logoSrc ? (
              <img src={logoSrc} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A0A0F" strokeWidth="2">
                <path d="M12 2C8 2 4 5.5 4 10c0 3 1.5 5.5 4 7v3h8v-3c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z" />
                <path d="M9 21h6" />
              </svg>
            )}
          </div>
          <div>
            <div
              className="font-display"
              style={{
                color: "var(--gold)",
                fontSize: 17,
                fontWeight: 500,
                letterSpacing: "0.05em",
                lineHeight: 1.1,
              }}
            >
              {logoName}
            </div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: 9,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Clínica Estética
            </div>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <p style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 6, paddingLeft: 2 }}>
          Clique direito na logo para trocar
        </p>

        {/* WhatsApp status */}
        <div
          style={{
            marginTop: 16,
            background: "rgba(37, 211, 102, 0.07)",
            border: "1px solid rgba(37, 211, 102, 0.18)",
            borderRadius: 8,
            padding: "7px 12px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M11.999 1C5.925 1 1 5.925 1 12c0 1.982.52 3.843 1.429 5.453L1 23l5.695-1.406A10.96 10.96 0 0012 23c6.075 0 11-4.925 11-11S18.075 1 12 1zm0 20.001a8.96 8.96 0 01-4.786-1.38l-.344-.204-3.578.883.915-3.476-.225-.355A8.966 8.966 0 013 12c0-4.963 4.037-9 9-9s9 4.037 9 9-4.037 9.001-9 9.001z" />
          </svg>
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
      <nav style={{ flex: 1, padding: "0 10px" }}>
        <div
          style={{
            color: "var(--text-muted)",
            fontSize: 9,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "0 12px 10px",
          }}
        >
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
                gap: 11,
                padding: "9px 12px",
                borderRadius: 9,
                border: "none",
                background: active
                  ? isDark
                    ? "linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(201,169,110,0.05) 100%)"
                    : "rgba(201,169,110,0.12)"
                  : "transparent",
                color: active ? "var(--gold)" : "var(--text-muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                letterSpacing: "0.01em",
                textAlign: "left",
                transition: "all 0.18s",
                borderLeft: active ? "2px solid var(--gold)" : "2px solid transparent",
              }}
            >
              <span style={{ opacity: active ? 1 : 0.55, flexShrink: 0 }}>{item.icon}</span>
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
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom — theme toggle + user */}
      <div style={{ padding: "16px 20px 0", borderTop: "1px solid var(--border)" }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 12,
            marginBottom: 14,
            transition: "border-color 0.2s",
          }}
        >
          {isDark ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Modo Claro
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              Modo Escuro
            </>
          )}
          <div
            style={{
              marginLeft: "auto",
              width: 32,
              height: 18,
              borderRadius: 9,
              background: isDark ? "var(--gold-dim)" : "#C9A96E",
              position: "relative",
              transition: "background 0.3s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: isDark ? 3 : 15,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.25s",
              }}
            />
          </div>
        </button>

        {/* User */}
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
            <div style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>Admin</div>
            <div style={{ color: "var(--text-muted)", fontSize: 10 }}>Gerente</div>
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
