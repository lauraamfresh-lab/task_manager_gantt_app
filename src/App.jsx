import React, { useState } from 'react'
import { TaskProvider } from './context/TaskContext'
import Sidebar from './components/Sidebar'
import MiDia from './views/MiDia'
import ProyectosYTareas from './views/ProyectosYTareas'
import Gantt from './views/Gantt'
import BugsTracker from './views/BugsTracker'
import Historias from './views/Historias'
import Reports from './views/Reports'

function Layout() {
  const [view, setView] = useState('midia')

  const views = {
    midia: <MiDia />,
    proyectos: <ProyectosYTareas />,
    gantt: <Gantt />,
    bugs: <BugsTracker />,
    historias: <Historias />,
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
    <TaskProvider>
      <Layout />
    </TaskProvider>
  )
}