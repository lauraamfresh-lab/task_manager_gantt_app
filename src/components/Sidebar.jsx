import React from 'react'
import { Sun, LayoutList, BarChart2, Zap, BookOpen, ClipboardList } from 'lucide-react'
import { LayoutDashboard, FolderKanban, Calendar, Bug } from 'lucide-react'

const VIEWS = [
  { id: 'midia',     label: 'Mi Día',               icon: Sun },
  { id: 'proyectos', label: 'Proyectos y Tareas',   icon: LayoutList },
  { id: 'gantt',     label: 'Gantt',                icon: BarChart2 },
  { id: 'bugs',      label: 'Bugs / Errores',       icon: Bug },
  { id: 'historias', label: 'Historias / Reqs',     icon: BookOpen },
  { id: 'reports',   label: 'Informes',             icon: ClipboardList },
]

export default function Sidebar({ activeView, onChangeView }) {
  return (
    <aside className="flex flex-col w-60 min-h-screen bg-surface-800 border-r border-white/5 px-4 py-6 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center shadow-lg glow-violet">
          <Zap size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-display font-700 text-lg gradient-text tracking-tight">ProjectFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        {VIEWS.map(({ id, label, icon: Icon }) => {
          const active = activeView === id
          return (
            <button
              key={id}
              onClick={() => onChangeView(id)}
              className={`
                flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30 glow-violet'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-600'
                }
              `}
            >
              <Icon size={17} strokeWidth={active ? 2.5 : 2} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Bottom: user */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center text-xs font-bold text-white">
            LA
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Laura</p>
            <p className="text-xs text-slate-500">Administradora</p>
          </div>
        </div>
      </div>
    </aside>
  )
}