'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import Appointments from '@/components/Appointments'
import Conversations from '@/components/Conversations'
import Services from '@/components/Services'
import Settings from '@/components/Settings'
import KanbanLeads from '@/components/KanbanLeads'
import FollowUps from '@/components/FollowUps'

const VIEWS: Record<string, React.ReactNode> = {}

export default function Home() {
  const [view, setView] = useState('dashboard')
  const [logoOverride, setLogoOverride] = useState<string | null | undefined>(undefined)

  const renderView = () => {
    switch (view) {
      case 'dashboard':    return <Dashboard />
      case 'appointments': return <Appointments />
      case 'conversations':return <Conversations />
      case 'kanban':       return <KanbanLeads />
      case 'services':     return <Services />
      case 'followups':    return <FollowUps />
      case 'settings':     return <Settings onLogoChange={setLogoOverride} />
      default:             return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={view} onNavigate={setView} logoOverride={logoOverride} />
      <main style={{ flex: 1, padding: '28px 30px', minWidth: 0 }}>
        {renderView()}
      </main>
    </div>
  )
}
