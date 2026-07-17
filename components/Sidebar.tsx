'use client'

const NAV = [
  { id: 'dashboard',     icon: '▦', label: 'Visão Geral',     badge: 0 },
  { id: 'appointments',  icon: '🗓', label: 'Agendamentos',    badge: 0 },
  { id: 'conversations', icon: '💬', label: 'Conversas',       badge: 3 },
  { id: 'kanban',        icon: '📋', label: 'Kanban de Leads', badge: 0 },
  { id: 'services',      icon: '✨', label: 'Serviços',        badge: 0 },
  { id: 'followups',     icon: '🔁', label: 'Follow-ups',      badge: 0 },
  { id: 'settings',      icon: '⚙', label: 'Configurações',   badge: 0 },
]

interface Props {
  active: string
  onNavigate: (id: string) => void
}

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'linear-gradient(180deg, #2E8F87, #3AA79D)',
      color: '#fff', display: 'flex', flexDirection: 'column',
      padding: '26px 16px 20px',
      borderRadius: '0 22px 22px 0',
      position: 'sticky', top: 0, height: '100vh',
    }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 22px' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #fff', borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>✦</div>
        <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 22, fontWeight: 700, lineHeight: 0.9 }}>
          Beauty<small style={{ display: 'block', fontSize: 9, fontWeight: 600, letterSpacing: '0.4em', opacity: 0.85 }}>BOT</small>
        </h1>
      </div>

      {/* WPP Status */}
      <div style={{
        background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.3)',
        borderRadius: 12, padding: '9px 12px', fontSize: 12, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7CF5A8', boxShadow: '0 0 8px #7CF5A8', display: 'inline-block' }} />
        WhatsApp Conectado
      </div>

      {/* Nav */}
      <div style={{ fontSize: 10, letterSpacing: '0.25em', opacity: 0.7, padding: '0 10px 10px', fontWeight: 600 }}>MENU</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: isActive ? '#227069' : '#fff',
                background: isActive ? '#fff' : 'none',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                padding: '11px 12px', borderRadius: 12, textAlign: 'left', width: '100%',
                boxShadow: isActive ? '0 6px 16px rgba(15,55,50,.18)' : 'none',
                transition: 'all .15s',
              }}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{
                  background: '#F6BE4F', color: '#5c4308',
                  fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 8px',
                }}>{item.badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{
        marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 8px 0', borderTop: '1px solid rgba(255,255,255,.2)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: '#fff', color: '#227069',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14,
        }}>A</div>
        <div>
          <b style={{ fontSize: 13, display: 'block' }}>Admin</b>
          <span style={{ fontSize: 11, opacity: 0.8 }}>Clínica Bella Estética</span>
        </div>
      </div>
    </aside>
  )
}
