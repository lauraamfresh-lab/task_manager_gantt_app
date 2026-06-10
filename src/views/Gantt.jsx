import React, { useState } from 'react'
import { useTask, getProjectColor } from '../context/TaskContext'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { 
  format, 
  startOfWeek, 
  addDays, 
  parseISO, 
  startOfDay
} from 'date-fns'
import { es } from 'date-fns/locale'

export default function GanttView() {
  const { state } = useTask()
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)
  
  // 1. Filtrar tareas válidas (Deben tener obligatoriamente fecha de inicio y vencimiento)
  const tareasValidas = state.tareas.filter(t => t.fechaInicio && t.fechaVencimiento)

  // Separar activas de completadas
  const tareasActivas = tareasValidas.filter(t => t.estado !== 'Done')
  const tareasCompletadas = tareasValidas.filter(t => t.estado === 'Done')

  // Configuración del rango del Gantt (4 semanas visibles desde el inicio de la semana actual)
  const fechaBase = startOfWeek(new Date(), { weekStartsOn: 1 })
  const totalDias = 28 
  const dias = Array.from({ length: totalDias }, (_, i) => addDays(fechaBase, i))

  // Función auxiliar para renderizar una fila del Gantt
  const renderFilaTarea = (tarea) => {
    const colorConfig = getProjectColor(tarea.proyecto)
    const inicioTarea = startOfDay(parseISO(tarea.fechaInicio))
    const finTarea = startOfDay(parseISO(tarea.fechaVencimiento))

    return (
      <div key={tarea.id} className="grid grid-cols-[220px_1fr] items-center py-3 hover:bg-white/[0.02] transition-colors rounded-lg px-1">
        {/* Información izquierda */}
        <div className="pr-4 truncate">
          <p className={`text-sm font-medium truncate ${tarea.estado === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {tarea.titulo}
          </p>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorConfig.accent }} />
            {tarea.proyecto}
            <span className="text-[10px] px-1.5 py-0.2 bg-white/5 rounded text-slate-400 border border-white/5 ml-1">
              {tarea.estado}
            </span>
          </span>
        </div>

        {/* Timeline de bloques en el Gantt */}
        <div className="grid h-7 relative bg-surface-700/20 rounded-md overflow-hidden" style={{ gridTemplateColumns: `repeat(${totalDias}, minmax(0, 1fr))` }}>
          {dias.map((dia, dIdx) => {
            const diaActual = startOfDay(dia)
            const estaEnRango = diaActual >= inicioTarea && diaActual <= finTarea

            return (
              <div 
                key={dIdx} 
                className={`border-l border-white/[0.03] h-full transition-all ${
                  estaEnRango ? `${colorConfig.bg} border-y ${colorConfig.border} ${tarea.estado === 'Done' ? 'opacity-40' : ''}` : ''
                }`}
                title={estaEnRango ? `${tarea.titulo} (${tarea.fechaInicio} al ${tarea.fechaVencimiento})` : ''}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-800 border border-white/10 rounded-2xl p-6 shadow-xl text-slate-100 overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px]">
        <h2 className="text-xl font-bold font-display mb-6 text-slate-200">Diagrama de Gantt</h2>
        
        {tareasValidas.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No hay tareas con fechas de inicio y vencimiento configuradas para mostrar en el Gantt.
          </div>
        ) : (
          <div className="space-y-1">
            {/* Cabecera de fechas del calendario */}
            <div className="grid grid-cols-[220px_1fr] border-b border-white/5 pb-2 font-semibold text-xs text-slate-400 uppercase tracking-wider">
              <div>Tarea / Proyecto</div>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${totalDias}, minmax(0, 1fr))` }}>
                {dias.map((dia, index) => (
                  <div key={index} className="text-center border-l border-white/5 last:border-r">
                    <span className="block text-[10px]">{format(dia, 'eee', { locale: es })}</span>
                    <span className="block text-xs font-bold text-slate-300">{format(dia, 'd')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Listado de tareas activas */}
            <div className="divide-y divide-white/5 pt-2">
              {tareasActivas.length > 0 ? (
                tareasActivas.map(renderFilaTarea)
              ) : (
                <div className="text-xs text-slate-500 py-3 pl-2 italic">No hay tareas pendientes en este rango.</div>
              )}
            </div>

            {/* Apartado Desplegable: Mostrar tareas completadas */}
            {tareasCompletadas.length > 0 && (
              <div className="pt-4 mt-2 border-t border-white/5">
                <button
                  onClick={() => setMostrarCompletadas(!mostrarCompletadas)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-surface-750 px-3 py-2 rounded-lg border border-white/5"
                >
                  {mostrarCompletadas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Mostrar tareas completadas ({tareasCompletadas.length})</span>
                </button>

                {mostrarCompletadas && (
                  <div className="divide-y divide-white/5 pt-2 mt-2 border-t border-white/5 bg-white/[0.01] rounded-xl p-2">
                    {tareasCompletadas.map(renderFilaTarea)}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}