"use client";

import { useState, useEffect, useCallback } from "react";

interface ConnectionStatus {
  connected: boolean;
  lastSync: string | null;
}

interface QRData {
  base64?: string;
  code?: string;
  count?: number;
}

export default function Settings() {
  const [evolutionUrl, setEvolutionUrl] = useState(
    process.env.NEXT_PUBLIC_EVOLUTION_API_URL || ""
  );
  const [apiKey, setApiKey] = useState(
    process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || ""
  );
  const [instance, setInstance] = useState(
    process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || ""
  );
  const [n8nUrl, setN8nUrl] = useState(
    process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ""
  );

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastSync: null,
  });
  const [testingConnection, setTestingConnection] = useState(false);

  // QR Code states
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrPolling, setQrPolling] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<string>("unknown");

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch(
        `${evolutionUrl}/instance/fetchInstances`,
        {
          headers: { apikey: apiKey },
        }
      );
      if (response.ok) {
        setConnectionStatus({
          connected: true,
          lastSync: new Date().toLocaleTimeString("pt-BR"),
        });
      } else {
        setConnectionStatus({ connected: false, lastSync: null });
      }
    } catch {
      setConnectionStatus({ connected: false, lastSync: null });
    } finally {
      setTestingConnection(false);
    }
  };

  const checkInstanceStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${evolutionUrl}/instance/connectionState/${instance}`,
        { headers: { apikey: apiKey } }
      );
      if (response.ok) {
        const data = await response.json();
        const state = data?.instance?.state || data?.state || "unknown";
        setInstanceStatus(state);
        return state;
      }
    } catch {
      setInstanceStatus("unknown");
    }
    return "unknown";
  }, [evolutionUrl, instance, apiKey]);

  const generateQRCode = async () => {
    setQrLoading(true);
    setQrError(null);
    setQrData(null);

    try {
      // First check current state
      const state = await checkInstanceStatus();

      if (state === "open") {
        setQrError("Instância já está conectada! Desconecte antes de gerar um novo QR Code.");
        setQrLoading(false);
        return;
      }

      // Request QR Code
      const response = await fetch(
        `${evolutionUrl}/instance/connect/${instance}`,
        { headers: { apikey: apiKey } }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data?.base64 || data?.qrcode?.base64) {
        setQrData({
          base64: data.base64 || data.qrcode?.base64,
          code: data.code || data.qrcode?.code,
          count: data.count,
        });
        setQrPolling(true);
      } else {
        setQrError("QR Code não retornado. Tente novamente.");
      }
    } catch (err) {
      setQrError(
        err instanceof Error ? err.message : "Erro ao gerar QR Code"
      );
    } finally {
      setQrLoading(false);
    }
  };

  const disconnectInstance = async () => {
    if (!confirm("Tem certeza? Isso vai desconectar o WhatsApp atual.")) return;
    try {
      await fetch(`${evolutionUrl}/instance/logout/${instance}`, {
        method: "DELETE",
        headers: { apikey: apiKey },
      });
      setInstanceStatus("close");
      setQrData(null);
      setQrPolling(false);
      alert("Instância desconectada com sucesso.");
    } catch {
      alert("Erro ao desconectar. Tente pelo painel do N8N.");
    }
  };

  // Poll connection status while QR is shown
  useEffect(() => {
    if (!qrPolling) return;

    const interval = setInterval(async () => {
      const state = await checkInstanceStatus();
      if (state === "open") {
        setQrPolling(false);
        setQrData(null);
        setConnectionStatus({
          connected: true,
          lastSync: new Date().toLocaleTimeString("pt-BR"),
        });
        alert("✅ WhatsApp conectado com sucesso!");
      }
    }, 3000);

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      setQrPolling(false);
      setQrError("QR Code expirado. Gere um novo.");
      setQrData(null);
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [qrPolling, checkInstanceStatus]);

  // Check instance status on mount
  useEffect(() => {
    if (evolutionUrl && apiKey && instance) {
      checkInstanceStatus();
    }
  }, [checkInstanceStatus, evolutionUrl, apiKey, instance]);

  const statusColor =
    instanceStatus === "open"
      ? "#22c55e"
      : instanceStatus === "close"
      ? "#ef4444"
      : "#f59e0b";

  const statusLabel =
    instanceStatus === "open"
      ? "Conectado"
      : instanceStatus === "close"
      ? "Desconectado"
      : "Verificando...";

  return (
    <div style={{ padding: "32px", maxWidth: "700px", color: "#f1f5f9" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>
        Configurações
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "32px" }}>
        Configure a integração com Evolution API, N8N e Gemini AI
      </p>

      {/* Evolution API Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ fontSize: "20px" }}>⚡</span>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", margin: 0 }}>Evolution API</h2>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Conexão WhatsApp Business</p>
          </div>
        </div>

        <label style={labelStyle}>URL DA EVOLUTION API</label>
        <input
          style={inputStyle}
          value={evolutionUrl}
          onChange={(e) => setEvolutionUrl(e.target.value)}
          placeholder="https://n8n-evolution.tkukfu.easypanel.host"
        />

        <label style={labelStyle}>API KEY</label>
        <input
          style={inputStyle}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Sua API Key"
        />

        <label style={labelStyle}>NOME DA INSTÂNCIA</label>
        <input
          style={inputStyle}
          value={instance}
          onChange={(e) => setInstance(e.target.value)}
          placeholder="marcio"
        />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: connectionStatus.connected ? "#22c55e" : "#ef4444",
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              {connectionStatus.connected
                ? `Última sincronização: ${connectionStatus.lastSync}`
                : "Não testado"}
            </span>
          </div>
          <button
            onClick={testConnection}
            disabled={testingConnection}
            style={secondaryBtnStyle}
          >
            {testingConnection ? "Testando..." : "Testar Conexão"}
          </button>
        </div>
      </div>

      {/* QR Code Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📱</span>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "600", margin: 0 }}>Número do WhatsApp</h2>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Conectar ou trocar número da instância</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: statusColor,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "13px", color: statusColor, fontWeight: "500" }}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* QR Code Display */}
        {qrData?.base64 && (
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
              Abra o WhatsApp no celular → Aparelhos conectados → Conectar aparelho → Escanear QR Code
            </p>
            <div
              style={{
                display: "inline-block",
                padding: "16px",
                backgroundColor: "#fff",
                borderRadius: "12px",
              }}
            >
              <img
                src={
                  qrData.base64.startsWith("data:")
                    ? qrData.base64
                    : `data:image/png;base64,${qrData.base64}`
                }
                alt="QR Code WhatsApp"
                style={{ width: "220px", height: "220px", display: "block" }}
              />
            </div>
            {qrPolling && (
              <p style={{ fontSize: "13px", color: "#f59e0b", marginTop: "12px" }}>
                ⏳ Aguardando leitura do QR Code... (expira em 2 minutos)
              </p>
            )}
          </div>
        )}

        {qrError && (
          <div
            style={{
              backgroundColor: "#1e1e2e",
              border: "1px solid #ef4444",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#ef4444",
            }}
          >
            ⚠️ {qrError}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={generateQRCode}
            disabled={qrLoading || qrPolling}
            style={{
              ...primaryBtnStyle,
              opacity: qrLoading || qrPolling ? 0.6 : 1,
              cursor: qrLoading || qrPolling ? "not-allowed" : "pointer",
            }}
          >
            {qrLoading
              ? "Gerando..."
              : qrData
              ? "🔄 Gerar Novo QR Code"
              : "📲 Gerar QR Code"}
          </button>

          {instanceStatus === "open" && (
            <button onClick={disconnectInstance} style={dangerBtnStyle}>
              Desconectar Número
            </button>
          )}

          <button onClick={checkInstanceStatus} style={secondaryBtnStyle}>
            Verificar Status
          </button>
        </div>

        <p style={{ fontSize: "12px", color: "#64748b", marginTop: "16px" }}>
          💡 Para trocar de número: clique em "Desconectar Número" e depois "Gerar QR Code" para escanear com o novo aparelho.
        </p>
      </div>

      {/* N8N Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ fontSize: "20px" }}>🔄</span>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", margin: 0 }}>N8N Workflow</h2>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>Automação de fluxos</p>
          </div>
        </div>

        <label style={labelStyle}>WEBHOOK URL</label>
        <input
          style={inputStyle}
          value={n8nUrl}
          onChange={(e) => setN8nUrl(e.target.value)}
          placeholder="https://n8n-n8n-webhook.tkukfu.easypanel.host/webhook/evolution-marcio"
        />
      </div>
    </div>
  );
}

// Styles
const cardStyle: React.CSSProperties = {
  backgroundColor: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "20px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: "600",
  color: "#64748b",
  letterSpacing: "0.08em",
  marginBottom: "6px",
  marginTop: "16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#1e293b",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#f1f5f9",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: "#7c3aed",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px 18px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#94a3b8",
  border: "1px solid #334155",
  borderRadius: "8px",
  padding: "9px 16px",
  fontSize: "13px",
  cursor: "pointer",
};

const dangerBtnStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  color: "#ef4444",
  border: "1px solid #ef4444",
  borderRadius: "8px",
  padding: "9px 16px",
  fontSize: "13px",
  cursor: "pointer",
};
