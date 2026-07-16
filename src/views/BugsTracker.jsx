import React, { useState } from 'react'
import { Bug, Plus, Trash2, Pencil, AlertCircle, ShieldAlert, CheckCircle2, Flame, User, ChevronDown, ChevronRight } from 'lucide-react'
import { useApp as useTask, getProjectColor } from '../context/AppContext'
import BugModal from '../components/BugModal'

export default function BugsTracker() {
  const { state, dispatch } = useTask()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBug, setEditingBug] = useState(null)
  const [showResolved, setShowResolved] = useState(false) // Control para desplegar resueltos

  const bugs = state.bugs || []

  // Separar bugs activos de los resueltos
  const activeBugs = bugs.filter(b => b.estado !== 'Resuelto')
  const resolvedBugs = bugs.filter(b => b.estado === 'Resuelto')

  // Agrupar únicamente los bugs activos por proyecto
  const groupedActiveBugs = activeBugs.reduce((acc, b) => {
    acc[b.proyecto] = acc[b.proyecto] || []
    acc[b.proyecto].push(b)
    return acc
  }, {})

  const PRIORIDAD_CONFIG = {
    Alta: { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', icon: <Flame size={12} /> },
    Media: { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', icon: <AlertCircle size={12} /> },
    Baja: { bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400', icon: <ShieldAlert size={12} /> },
  }

  const ESTADO_CONFIG = {
    Abierto: 'bg-red-500 text-white',
    'En Progreso': 'bg-amber-500 text-slate-950',
    Resuelto: 'bg-emerald-500 text-white'
  }

  // Componente interno para renderizar la tarjeta de cada Bug
  const BugCard = ({ bug }) => {
    const pColor = getProjectColor(bug.proyecto)
    const pConfig = PRIORIDAD_CONFIG[bug.prioridad] || PRIORIDAD_CONFIG.Media

    return (
      <div className="bg-surface-700/50 border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all group">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pColor.accent }} />
              {bug.proyecto}
            </span>
            <select
              value={bug.estado}
              onChange={e => dispatch({ type: 'UPDATE_BUG', payload: { id: bug.id, estado: e.target.value } })}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none ${ESTADO_CONFIG[bug.estado]}`}
            >
              <option value="Abierto" className="bg-surface-800 text-slate-200">Abierto</option>
              <option value="En Progreso" className="bg-surface-800 text-slate-200">En Progreso</option>
              <option value="Resuelto" className="bg-surface-800 text-slate-200">Resuelto</option>
            </select>
          </div>

          <h3 className={`font-semibold text-sm text-slate-200 line-clamp-1 mb-1 ${bug.estado === 'Resuelto' ? 'line-through text-slate-500' : ''}`}>
            {bug.titulo}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {bug.descripcion || 'Sin descripción adicional.'}
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/4 px-2 py-1 rounded-lg w-fit mb-4">
            <User size={12} className="text-slate-500" />
            <span>Contacto: <strong className="text-slate-300">{bug.reportadoPor || 'No asignado'}</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/4 pt-3 mt-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${pConfig.bg}`}>
            {pConfig.icon}
            {bug.prioridad}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditingBug(bug); setModalOpen(true); }} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-500 transition-all"><Pencil size={13} /></button>
            <button onClick={() => dispatch({ type: 'DELETE_BUG', payload: bug.id })} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in text-slate-100 flex justify-center">
      <div className="max-w-5xl w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Bug size={18} className="text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-100">Seguimiento de Errores</h1>
              <p className="text-sm text-slate-500 mt-0.5">{activeBugs.length} bugs activos</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingBug(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-all shadow-lg shadow-rose-950/20"
          >
            <Plus size={16} strokeWidth={2.5} /> Reportar Bug
          </button>
        </div>

        {/* LISTADO DE BUGS ACTIVOS AGRUPADOS POR PROYECTO */}
        <div className="space-y-8">
          {Object.keys(groupedActiveBugs).length === 0 && activeBugs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded-2xl bg-surface-800/10 text-center">
              <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
              <h3 className="text-sm font-medium text-slate-400">¡No hay bugs activos!</h3>
            </div>
          ) : (
            Object.entries(groupedActiveBugs).map(([proyecto, listaDeBugs]) => (
              <div key={proyecto} className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-semibold text-slate-300 font-display uppercase tracking-wider">{proyecto}</h2>
                  <span className="text-xs bg-white/5 text-slate-500 px-2 py-0.5 rounded-md font-mono">{listaDeBugs.length}</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {listaDeBugs.map(bug => <BugCard key={bug.id} bug={bug} />)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* SECCIÓN DESPLEGABLE DE BUGS RESUELTOS */}
        {resolvedBugs.length > 0 && (
          <div className="mt-12 border-t border-white/5 pt-6">
            <button 
              onClick={() => setShowResolved(!showResolved)} 
              className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showResolved ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Bugs Resueltos e Historial ({resolvedBugs.length})</span>
            </button>

            {showResolved && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 animate-fade-in">
                {resolvedBugs.map(bug => <BugCard key={bug.id} bug={bug} />)}
              </div>
            )}
          </div>
        )}

      </div>
      {modalOpen && <BugModal onClose={() => { setModalOpen(false); setEditingBug(null); }} editBug={editingBug} />}
    </div>
  )
}