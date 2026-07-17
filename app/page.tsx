'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import Appointments from '@/components/Appointments'
import Conversations from '@/components/Conversations'
import Services from '@/components/Services'
import Settings from '@/components/Settings'

const VIEWS: Record<string, React.ReactNode> = {}

export default function Home() {
  const [view, setView] = useState('dashboard')

  const renderView = () => {
    switch (view) {
      case 'dashboard':    return <Dashboard />
      case 'appointments': return <Appointments />
      case 'conversations':return <Conversations />
      case 'services':     return <Services />
      case 'settings':     return <Settings />
      default:             return <Dashboard />
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar active={view} onNavigate={setView} />
      <main style={{ flex: 1, padding: '28px 30px', minWidth: 0 }}>
        {renderView()}
      </main>
    </div>
  )
}
