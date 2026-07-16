import React, { useState } from 'react'
import { AppProvider } from './context/AppContext'
import Sidebar from './components/Sidebar'
import MiDia from './views/MiDia'
import Planificacion from './views/Planificacion'
import BugsTracker from './views/BugsTracker'
import Reports from './views/Reports'

function Layout() {
  const [view, setView] = useState('midia')

  const views = {
    midia: <MiDia />,
    planificacion: <Planificacion />,
    bugs: <BugsTracker />,
    reports: <Reports />,
  }

  return (
    <div className="flex min-h-screen bg-surface-900">
      <Sidebar activeView={view} onChangeView={setView} />
      <main className="flex-1 overflow-auto">
        {views[view]}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  )
}
