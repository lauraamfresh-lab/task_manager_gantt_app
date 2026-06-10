import React, { useState } from 'react'
import { format, parseISO, differenceInDays, addDays, startOfWeek } from 'date-fns'
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react'
import { useTask, getProjectColor } from '../context/TaskContext'

export default function Gantt() {
  const { state } = useTask()
  const [showCompleted, setShowCompleted] = useState(false) // ◄ Estado para colapsar hechas

  // 1. Separar tareas activas y completadas
  const tareasActivas = state.tareas.filter(t => t.estado !== 'Done' && t.fechaInicio && t.fechaVencimiento)
  const tareasCompletadas = state.tareas.filter(t => t.estado === 'Done' && t.fechaInicio && t.fechaVencimiento)

  // Configuración de la escala de tiempo (4 semanas desde el inicio de la semana actual)
  const fechaInicioGantt = startOfWeek(new Date(), { weekStartsOn: 1 })
  const totalDias = 28
  const diasArray = Array.from({ length: totalDias }, (_, i) => addDays(fechaInicioGantt, i))

  // Renderizador de una fila del Gantt (reutilizable)
  const renderGanttRow = (tarea) => {
    const col = getProjectColor(tarea.proyecto)
    
    try {
      const inicioTask = parseISO(tarea.fechaInicio)
      const finTask = parseISO(tarea.fechaVencimiento)
      
      // Calcular posiciones
      let startOffset = differenceInDays(inicioTask, fechaInicioGantt)
      let duration = differenceInDays(finTask, inicioTask) + 1

      // Ajustar límites visuales si se salen de la escala
      if (startOffset < 0) {
        duration += startOffset
        startOffset = 0
      }
      if (startOffset + duration > totalDias) {
        duration = totalDias - startOffset
      }
      if (duration <= 0) return null

      return (
        <div key={tarea.id} className={`grid grid-cols-[220px_1fr] items-center border-b border-white/4 py-2 hover:bg-surface-600/20 ${tarea.estado === 'Done' ? 'opacity-50' : ''}`}>
          {/* Nombre de la tarea y proyecto */}
          <div className="px-4 truncate flex flex-col">
            <span className="text-xs font-medium text-slate-200 truncate">{tarea.titulo}</span>
            <span className="text-[10px] text-slate-500 truncate" style={{ color: col.accent }}>{tarea.proyecto}</span>
          </div>

          {/* Grid de días con la barra temporal */}
          <div className="relative h-7 grid grid-cols-28 full-w">
            <div 
              className="absolute h-5 top-1 rounded-lg flex items-center px-2 text-[10px] font-bold text-white shadow-sm truncate select-none transition-all"
              style={{ 
                gridColumnStart: startOffset + 1, 
                gridColumnEnd: startOffset + 1 + duration,
                backgroundColor: col.accent,
                opacity: tarea.estado === 'Done' ? 0.4 : 0.85
              }}
              title={`${tarea.titulo} (${tarea.fechaInicio} al ${tarea.fechaVencimiento})`}
            >
              <span className="truncate">{tarea.estado === 'Done' ? '✓ ' : ''}{tarea.titulo}</span>
            </div>
          </div>
        </div>
      )
    } catch {
      return null
    }
  }

  return (
    <div className="p-8 animate-fade-in max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Calendar size={28} className="text-accent-violet" /> Vista de Gantt
        </h1>
        <p className="text-sm text-slate-500 mt-1">Cronograma táctico de tareas planificadas.</p>
      </div>

      <div className="bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {/* ENCABEZADO DEL GANTT (Días/Semanas) */}
        <div className="grid grid-cols-[220px_1fr] bg-surface-800/60 border-b border-white/5 items-center">
          <div className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Planificación</div>
          <div className="grid grid-cols-28 text-center text-[10px] font-mono text-slate-500 py-2">
            {diasArray.map((dia, idx) => (
              <div key={idx} className={`border-r border-white/5 last:border-0 ${format(dia, 'e') === '6' || format(dia, 'e') === '7' ? 'bg-white/2' : ''}`}>
                <div className="font-semibold text-slate-400">{format(dia, 'dd')}</div>
                <div>{format(dia, 'eee').substring(0, 1)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CUERPO 1: TAREAS ACTIVAS */}
        <div className="divide-y divide-white/4">
          {tareasActivas.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">No hay tareas activas programadas en este rango.</div>
          ) : (
            tareasActivas.map(renderGanttRow)
          )}
        </div>

        {/* CUERPO 2: MENÚ COLAPSABLE DE COMPLETADAS */}
        {tareasCompletadas.length > 0 && (
          <div className="border-t border-white/10 bg-surface-850/40">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors select-none text-left bg-surface-800/30"
            >
              {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Mostrar tareas históricas hechas en el Gantt ({tareasCompletadas.length})</span>
            </button>

            {showCompleted && (
              <div className="divide-y divide-white/4 border-t border-white/5 bg-surface-900/20 animate-fade-in">
                {tareasCompletadas.map(renderGanttRow)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}