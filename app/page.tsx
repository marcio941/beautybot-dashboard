'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Dashboard from '@/components/Dashboard'
import Appointments from '@/components/Appointments'
import Conversations from '@/components/Conversations'
import Services from '@/components/Services'
import Settings from '@/components/Settings'
import KanbanLeads from '@/components/KanbanLeads'
import FollowUps from '@/components/FollowUps'
import { useProfile } from '@/lib/hooks/useProfile'

const VIEWS: Record<string, React.ReactNode> = {}

export default function Home() {
  const { corDestaque } = useProfile()
  const [view, setView] = useState('dashboard')
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined)
  const [nomeOverride, setNomeOverride] = useState<string | null | undefined>(undefined)
  const [corOverride, setCorOverride] = useState<string | null | undefined>(undefined)
  const corAtual = (corOverride !== undefined ? corOverride : corDestaque) || '#227069'

  const renderView = () => {
    switch (view) {
      case 'dashboard':    return <Dashboard />
      case 'appointments': return <Appointments />
      case 'conversations':return <Conversations />
      case 'kanban':       return <KanbanLeads />
      case 'services':     return <Services />
      case 'followups':    return <FollowUps />
      case 'settings':     return <Settings onLogoChange={setLogoOverride} onNomeChange={setNomeOverride} onCorChange={setCorOverride} />
      default:             return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', '--accent': corAtual } as React.CSSProperties}>
      <Sidebar active={view} onNavigate={setView} logoOverride={logoOverride} nomeOverride={nomeOverride} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header logoOverride={logoOverride} />
        <main style={{ flex: 1, padding: '28px 30px' }}>
          {renderView()}
        </main>
      </div>
    </div>
  )
}
