import React, { useState } from 'react'
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { Sun, CheckSquare, ListPlus, FileText, ExternalLink, CalendarDays, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { useApp, getProyectoNombre } from '../context/AppContext'
import EstadoSelect from '../components/EstadoSelect'
import PrioridadBadge from '../components/PrioridadBadge'

function RequisitoItem({ requisito, hoy, todayStr, proyectoNombre }) {
  const col = { accent: '#7c6cfc' }
  const checklist = requisito.checklist || []
  const itemsCompletados = checklist.filter(item => item.completado).length
  const dueDays = requisito.fechaVencimiento ? differenceInDays(parseISO(requisito.fechaVencimiento), hoy) : -1

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-700/20 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0"
            style={{ backgroundColor: `${col.accent}10`, color: col.accent, borderColor: `${col.accent}30` }}
          >
            {proyectoNombre}
          </span>
          <h3 className="text-sm font-medium text-slate-200 truncate">
            {requisito.titulo}
          </h3>
          <PrioridadBadge prioridad={requisito.prioridad} />

          {dueDays < 0 && requisito.fechaVencimiento && (
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-medium">
              Vencida hace {Math.abs(dueDays)} {Math.abs(dueDays) === 1 ? 'día' : 'días'}
            </span>
          )}
          {dueDays > 0 && dueDays <= 7 && (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-medium">En {dueDays} {dueDays === 1 ? 'día' : 'días'}</span>
          )}
          {requisito.enMiDia && requisito.fechaVencimiento !== todayStr && (dueDays < 0 || dueDays > 7) && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">Fijada</span>
          )}
        </div>

        <div className="flex gap-2.5 text-[10px] text-slate-500 pl-1">
          <span>👤 {requisito.responsable || 'Sin asignar'}</span>
          {checklist.length > 0 && (
            <span className="flex items-center gap-1"><CheckSquare size={10} /> {itemsCompletados}/{checklist.length} sub-tareas</span>
          )}
          {requisito.notas?.trim() && (
            <span className="flex items-center gap-1"><FileText size={10} /> Notas</span>
          )}
          {requisito.fechaVencimiento && requisito.fechaVencimiento !== todayStr && (
            <span className="text-slate-400">🗓️ Vence: {requisito.fechaVencimiento}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto shrink-0">
        <EstadoSelect requisito={requisito} />
        {requisito.linkDocumento && (
          <a href={requisito.linkDocumento} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-accent-cyan transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  )
}

function SeccionColapsable({ titulo, icon: Icon, colorClass, count, emptyText, items, defaultOpen, hoy, todayStr, state }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="space-y-4 pt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 font-display font-bold text-base px-1 w-full text-left ${colorClass}`}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <Icon size={16} />
        <h2>{titulo}</h2>
        <span className="text-xs font-mono font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded-md ml-1">
          {count}
        </span>
      </button>

      {open && (
        <div className="space-y-2.5">
          {items.length === 0 ? (
            <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center text-slate-500 text-xs italic">
              {emptyText}
            </div>
          ) : (
            items.map(r => (
              <RequisitoItem key={r.id} requisito={r} hoy={hoy} todayStr={todayStr} proyectoNombre={getProyectoNombre(state, r.proyectoId)} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function MiDia() {
  const { state, dispatch } = useApp()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const hoy = startOfDay(new Date())

  const requisitosHoy = state.requisitos.filter(r => {
    if (r.estado === 'Done') return false
    return r.fechaVencimiento === todayStr || r.enMiDia
  })

  const requisitosVencidos = state.requisitos.filter(r => {
    if (r.estado === 'Done') return false
    if (r.fechaVencimiento === todayStr) return false
    if (!r.fechaVencimiento) return false
    return differenceInDays(parseISO(r.fechaVencimiento), hoy) < 0
  })

  const requisitosProximos7Dias = state.requisitos.filter(r => {
    if (r.estado === 'Done') return false
    if (r.fechaVencimiento === todayStr || r.enMiDia) return false
    const dueDays = r.fechaVencimiento ? differenceInDays(parseISO(r.fechaVencimiento), hoy) : -1
    return dueDays > 0 && dueDays <= 7
  })

  const requisitosDisponibles = state.requisitos.filter(r => {
    if (r.estado === 'Done') return false
    if (r.fechaVencimiento === todayStr || r.enMiDia) return false
    const dueDays = r.fechaVencimiento ? differenceInDays(parseISO(r.fechaVencimiento), hoy) : -1
    const esProximos7Dias = dueDays > 0 && dueDays <= 7
    return !esProximos7Dias
  })

  const handleAsignarAMiDia = (id) => {
    if (!id) return
    dispatch({ type: 'UPDATE_REQUISITO', payload: { id, enMiDia: true } })
  }

  const fechaBonita = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).replace(/^\w/, (c) => c.toUpperCase())

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto space-y-10 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <Sun size={20} className="text-amber-400 fill-amber-400/10" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Mi Agenda</h1>
            <p className="text-sm text-slate-500 mt-0.5">{fechaBonita}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-2 rounded-xl max-w-xs w-full sm:w-auto">
          <ListPlus size={14} className="text-slate-400 shrink-0" />
          <select
            onChange={(e) => { handleAsignarAMiDia(e.target.value); e.target.value = ""; }}
            defaultValue=""
            className="bg-transparent text-xs font-medium text-slate-300 outline-none cursor-pointer w-full"
          >
            <option value="" disabled className="bg-surface-700 text-slate-400">Añadir requisito a Hoy...</option>
            {requisitosDisponibles.map(r => (
              <option key={r.id} value={r.id} className="bg-surface-700 text-slate-200">
                [{getProyectoNombre(state, r.proyectoId)}] {r.titulo}
              </option>
            ))}
            {requisitosDisponibles.length === 0 && (
              <option disabled className="bg-surface-700 text-slate-500">No hay requisitos extra en el backlog</option>
            )}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-base px-1">
          <Sun size={16} className="fill-amber-400/10" />
          <h2>Mi Día</h2>
          <span className="text-xs font-mono font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded-md ml-1">
            {requisitosHoy.length}
          </span>
        </div>
        <div className="space-y-2.5">
          {requisitosHoy.length === 0 ? (
            <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center text-slate-500 text-xs italic">
              No tienes requisitos para hoy. Agrega uno desde el buscador superior.
            </div>
          ) : (
            requisitosHoy.map(r => (
              <RequisitoItem key={r.id} requisito={r} hoy={hoy} todayStr={todayStr} proyectoNombre={getProyectoNombre(state, r.proyectoId)} />
            ))
          )}
        </div>
      </div>

      <SeccionColapsable
        titulo="Requisitos Vencidos"
        icon={AlertTriangle}
        colorClass="text-red-400"
        count={requisitosVencidos.length}
        emptyText="No hay requisitos vencidos."
        items={requisitosVencidos}
        defaultOpen={false}
        hoy={hoy}
        todayStr={todayStr}
        state={state}
      />

      <SeccionColapsable
        titulo="Próximos 7 Días"
        icon={CalendarDays}
        colorClass="text-cyan-400"
        count={requisitosProximos7Dias.length}
        emptyText="No hay requisitos programados para el resto de la semana."
        items={requisitosProximos7Dias}
        defaultOpen={false}
        hoy={hoy}
        todayStr={todayStr}
        state={state}
      />
    </div>
  )
}
