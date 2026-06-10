import React from 'react'
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns'
import { Sun, CheckSquare, ListPlus, Trash2, FileText, ExternalLink, CalendarDays } from 'lucide-react'
import { useTask, ESTADOS, ESTADO_CONFIG, getProjectColor } from '../context/TaskContext'

function EstadoSelect({ tarea }) {
  const { dispatch } = useTask()
  const cfg = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG['To Do']

  return (
    <select
      value={tarea.estado}
      onChange={e => dispatch({ type: 'UPDATE_ESTADO', payload: { id: tarea.id, estado: e.target.value } })}
      className={`text-xs font-medium rounded-full px-3 py-1.5 border cursor-pointer focus:outline-none transition-all ${cfg.bg} ${cfg.color} ${cfg.border} bg-transparent`}
    >
      {ESTADOS.map(s => (
        <option key={s} value={s} className="bg-surface-700 text-slate-200">
          {s}
        </option>
      ))}
    </select>
  )
}

// Componente reutilizable para renderizar cada fila de tarea de forma limpia
function TareaItem({ tarea, hoy, todayStr, onQuitar }) {
  const col = getProjectColor(tarea.proyecto)
  const checklist = tarea.checklist || []
  const itemsCompletados = checklist.filter(item => item.completado).length
  const dueDays = tarea.fechaVencimiento ? differenceInDays(parseISO(tarea.fechaVencimiento), hoy) : -1

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-700/20 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all">
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge del Proyecto */}
          <span 
            className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0"
            style={{ backgroundColor: `${col.accent}10`, color: col.accent, borderColor: `${col.accent}30` }}
          >
            {tarea.proyecto}
          </span>
          <h3 className="text-sm font-medium text-slate-200 truncate">
            {tarea.titulo}
          </h3>

          {/* Tags de tiempo contextuales */}
          {tarea.fechaVencimiento === todayStr && (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">Hoy</span>
          )}
          {dueDays > 0 && dueDays <= 7 && (
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-medium">En {dueDays} {dueDays === 1 ? 'día' : 'días'}</span>
          )}
          {tarea.enMiDia && tarea.fechaVencimiento !== todayStr && (dueDays < 0 || dueDays > 7) && (
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">Fijada</span>
          )}
        </div>

        {/* Detalles inferiores */}
        <div className="flex gap-2.5 text-[10px] text-slate-500 pl-1">
          <span>👤 {tarea.etiqueta || 'Sin asignar'}</span>
          {checklist.length > 0 && (
            <span className="flex items-center gap-1"><CheckSquare size={10} /> {itemsCompletados}/{checklist.length} sub-tareas</span>
          )}
          {tarea.notas?.trim() && (
            <span className="flex items-center gap-1"><FileText size={10} /> Notas</span>
          )}
          {tarea.fechaVencimiento && tarea.fechaVencimiento !== todayStr && (
            <span className="text-slate-400">🗓️ Vence: {tarea.fechaVencimiento}</span>
          )}
        </div>
      </div>

      {/* Zona de control derecha */}
      <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto shrink-0">
        <EstadoSelect tarea={tarea} />
        
        <div className="flex items-center gap-1">
          {tarea.linkDocumento && (
            <a href={tarea.linkDocumento} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-500 hover:text-accent-violet hover:bg-white/5 transition-all">
              <ExternalLink size={14} />
            </a>
          )}
          <button 
            onClick={() => onQuitar(tarea)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            title="Ocultar de esta vista"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MiDia() {
  const { state, dispatch } = useTask()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const hoy = startOfDay(new Date())

  // 1. SECCIÓN HOY: Vencen hoy O añadidas manualmente (Excluye terminadas)
  const tareasHoy = state.tareas.filter(t => {
    if (t.estado === 'Done') return false
    return t.fechaVencimiento === todayStr || t.enMiDia
  })

  // 2. SECCIÓN PRÓXIMOS 7 DÍAS: Vencen en la semana (Excluye terminadas y lo que ya está en Hoy)
  const tareasProximos7Dias = state.tareas.filter(t => {
    if (t.estado === 'Done') return false
    if (t.fechaVencimiento === todayStr || t.enMiDia) return false // Evita duplicados si se fijó manual

    const dueDays = t.fechaVencimiento ? differenceInDays(parseISO(t.fechaVencimiento), hoy) : -1
    return dueDays > 0 && dueDays <= 7
  })

  // 3. BACKLOG SELECTOR: Tareas que no pertenecen a ninguna de las listas anteriores
  const tareasDisponibles = state.tareas.filter(t => {
    if (t.estado === 'Done') return false
    if (t.fechaVencimiento === todayStr || t.enMiDia) return false

    const dueDays = t.fechaVencimiento ? differenceInDays(parseISO(t.fechaVencimiento), hoy) : -1
    const esProximos7Dias = dueDays > 0 && dueDays <= 7
    return !esProximos7Dias
  })

  const handleAsignarAMiDia = (taskId) => {
    if (!taskId) return
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, enMiDia: true } })
  }

  const handleQuitarDeMiDia = (tarea) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id: tarea.id, enMiDia: false } })
  }

  const fechaBonita = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  }).replace(/^\w/, (c) => c.toUpperCase())

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto space-y-10 text-slate-100">
      
      {/* Cabecera Principal */}
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

        {/* Buscador / Selector rápido */}
        <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-2 rounded-xl max-w-xs w-full sm:w-auto">
          <ListPlus size={14} className="text-slate-400 shrink-0" />
          <select
            onChange={(e) => { handleAsignarAMiDia(e.target.value); e.target.value = ""; }}
            defaultValue=""
            className="bg-transparent text-xs font-medium text-slate-300 outline-none cursor-pointer w-full"
          >
            <option value="" disabled className="bg-surface-700 text-slate-400">Añadir tarea a Hoy...</option>
            {tareasDisponibles.map(t => (
              <option key={t.id} value={t.id} className="bg-surface-700 text-slate-200">
                [{t.proyecto}] {t.titulo}
              </option>
            ))}
            {tareasDisponibles.length === 0 && (
              <option disabled className="bg-surface-700 text-slate-500">No hay tareas extras en el backlog</option>
            )}
          </select>
        </div>
      </div>

      {/* SECCIÓN 1: MI DÍA (HOY + MANUALES) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-display font-bold text-base px-1">
          <Sun size={16} className="fill-amber-400/10" />
          <h2>Mi Día</h2>
          <span className="text-xs font-mono font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded-md ml-1">
            {tareasHoy.length}
          </span>
        </div>

        <div className="space-y-2.5">
          {tareasHoy.length === 0 ? (
            <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center text-slate-500 text-xs italic">
              No tienes tareas para hoy. Agrega una desde el buscador superior.
            </div>
          ) : (
            tareasHoy.map(tarea => (
              <TareaItem 
                key={tarea.id} 
                tarea={tarea} 
                hoy={hoy} 
                todayStr={todayStr} 
                onQuitar={handleQuitarDeMiDia} 
              />
            ))
          )}
        </div>
      </div>

      {/* SECCIÓN 2: PRÓXIMOS 7 DÍAS */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 text-cyan-400 font-display font-bold text-base px-1">
          <CalendarDays size={16} />
          <h2>Próximos 7 Días</h2>
          <span className="text-xs font-mono font-normal text-slate-500 bg-white/5 px-2 py-0.5 rounded-md ml-1">
            {tareasProximos7Dias.length}
          </span>
        </div>

        <div className="space-y-2.5">
          {tareasProximos7Dias.length === 0 ? (
            <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center text-slate-500 text-xs italic">
              No hay tareas programadas para el resto de la semana.
            </div>
          ) : (
            tareasProximos7Dias.map(tarea => (
              <TareaItem 
                key={tarea.id} 
                tarea={tarea} 
                hoy={hoy} 
                todayStr={todayStr} 
                onQuitar={handleQuitarDeMiDia} 
              />
            ))
          )}
        </div>
      </div>

    </div>
  )
}