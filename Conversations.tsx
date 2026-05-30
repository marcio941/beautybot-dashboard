"use client";
import { useState, useEffect, useRef } from "react";

interface Contact {
  id: string;
  phone: string;
  name: string;
  lastMsg: string;
  time: string;
  unread: number;
}

interface Message {
  id: string;
  from: "client" | "bot";
  text: string;
  time: string;
}

export default function Conversations() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected) fetchMessages(selected);
  }, [selected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (Array.isArray(data)) {
        setContacts(data);
        if (!selected && data.length > 0) setSelected(data[0].phone);
      }
    } catch (err) {
      console.error("Erro ao buscar conversas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(phone: string) {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/messages/${phone}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (err) {
      console.error("Erro ao buscar mensagens:", err);
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function sendMessage() {
    if (!inputMsg.trim() || !selected || sending) return;
    setSending(true);
    try {
      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selected, text: inputMsg }),
      });
      setInputMsg("");
      setTimeout(() => fetchMessages(selected!), 1000);
    } catch (err) {
      console.error("Erro ao enviar:", err);
    } finally {
      setSending(false);
    }
  }

  const selectedContact = contacts.find((c) => c.phone === selected);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{
        width: 320, minWidth: 320,
        borderRight: "1px solid rgba(201,169,110,0.08)",
        display: "flex", flexDirection: "column",
        background: "#0E0E16",
      }}>
        <div style={{ padding: "28px 20px 16px" }}>
          <div className="font-display" style={{ fontSize: 22, color: "#F5F0E8", fontWeight: 300 }}>
            Conversas
          </div>
          <div style={{
            marginTop: 12, background: "#12121A",
            border: "1px solid rgba(201,169,110,0.1)",
            borderRadius: 8, padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5A5248" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input placeholder="Buscar conversa..." style={{
              background: "transparent", border: "none", outline: "none",
              color: "#F5F0E8", fontSize: 12, fontFamily: "DM Sans, sans-serif", flex: 1,
            }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && (
            <div style={{ padding: "20px", textAlign: "center", color: "#5A5248", fontSize: 12 }}>
              Carregando conversas...
            </div>
          )}
          {!loading && contacts.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "#5A5248", fontSize: 12 }}>
              Nenhuma conversa encontrada
            </div>
          )}
          {contacts.map((c) => (
            <div key={c.phone} onClick={() => setSelected(c.phone)} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 20px", cursor: "pointer",
              background: selected === c.phone ? "rgba(201,169,110,0.06)" : "transparent",
              borderLeft: selected === c.phone ? "2px solid #C9A96E" : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "linear-gradient(135deg, #D4829A, #8B4A5E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 14, fontWeight: 600, flexShrink: 0,
              }}>
                {(c.name || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                  <div style={{ color: "#5A5248", fontSize: 10 }}>{c.time}</div>
                </div>
                <div style={{
                  color: "#5A5248", fontSize: 11, marginTop: 2,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {c.lastMsg}
                </div>
                {c.unread > 0 && (
                  <span style={{
                    background: "#25D366", color: "#fff", fontSize: 9,
                    fontWeight: 700, borderRadius: 10, padding: "1px 6px",
                    marginTop: 4, display: "inline-block",
                  }}>
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedContact ? (
          <>
            <div style={{
              padding: "18px 28px",
              borderBottom: "1px solid rgba(201,169,110,0.08)",
              display: "flex", alignItems: "center", gap: 14,
              background: "#0E0E16",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, #D4829A, #8B4A5E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700,
              }}>
                {(selectedContact.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 500 }}>
                  {selectedContact.name}
                </div>
                <div style={{ color: "#25D366", fontSize: 11, marginTop: 1 }}>
                  📱 {selectedContact.phone}
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                <button onClick={() => fetchMessages(selected!)} style={{
                  background: "rgba(201,169,110,0.1)",
                  border: "1px solid rgba(201,169,110,0.2)",
                  color: "#C9A96E", borderRadius: 8, padding: "6px 14px",
                  fontSize: 11, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                }}>
                  🔄 Atualizar
                </button>
                <button style={{
                  background: "rgba(212,130,154,0.1)",
                  border: "1px solid rgba(212,130,154,0.2)",
                  color: "#D4829A", borderRadius: 8, padding: "6px 14px",
                  fontSize: 11, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                }}>
                  ✋ Assumir
                </button>
              </div>
            </div>

            <div style={{
              flex: 1, overflowY: "auto", padding: "24px 28px",
              display: "flex", flexDirection: "column", gap: 12,
              background: "#0A0A0F",
            }}>
              {loadingMsgs && (
                <div style={{ textAlign: "center", color: "#5A5248", fontSize: 12, padding: 20 }}>
                  Carregando mensagens...
                </div>
              )}
              {!loadingMsgs && messages.length === 0 && (
                <div style={{ textAlign: "center", color: "#5A5248", fontSize: 12, padding: 20 }}>
                  Nenhuma mensagem encontrada
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={msg.id || i} style={{
                  display: "flex",
                  justifyContent: msg.from === "client" ? "flex-start" : "flex-end",
                }}>
                  <div style={{
                    maxWidth: "65%",
                    background: msg.from === "client"
                      ? "#12121A"
                      : "linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(201,169,110,0.08) 100%)",
                    border: msg.from === "client"
                      ? "1px solid rgba(201,169,110,0.08)"
                      : "1px solid rgba(201,169,110,0.2)",
                    borderRadius: msg.from === "client" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                    padding: "10px 14px",
                  }}>
                    {msg.from === "bot" && (
                      <div style={{
                        fontSize: 9, color: "#C9A96E", fontWeight: 600,
                        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4,
                      }}>
                        🤖 BeautyBot
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
              <div ref={messagesEndRef} />
            </div>

            <div style={{
              padding: "16px 28px",
              borderTop: "1px solid rgba(201,169,110,0.08)",
              background: "#0E0E16", display: "flex", gap: 12, alignItems: "center",
            }}>
              <input
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Digite uma mensagem manualmente..."
                style={{
                  flex: 1, background: "#12121A",
                  border: "1px solid rgba(201,169,110,0.15)",
                  borderRadius: 10, padding: "12px 16px",
                  color: "#F5F0E8", fontSize: 13,
                  fontFamily: "DM Sans, sans-serif", outline: "none",
                }}
              />
              <button onClick={sendMessage} disabled={sending} style={{
                background: sending ? "#5A5248" : "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                border: "none", color: "#fff", borderRadius: 10,
                padding: "12px 20px", fontSize: 13, fontWeight: 600,
                cursor: sending ? "not-allowed" : "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}>
                {sending ? "..." : "Enviar"}
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#5A5248", fontSize: 14,
          }}>
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}
