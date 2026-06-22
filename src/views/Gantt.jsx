import React, { useState } from 'react'
import { useTask, getProjectColor, ESTADOS } from '../context/TaskContext'
import { format, parseISO, startOfWeek, addDays, isSameDay, isWithinInterval, differenceInDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Briefcase, Tag, AlertCircle } from 'lucide-react'

export default function Gantt() {
  const { state } = useTask()
  const { tareas } = state
  
  // Guardamos la fecha de referencia para la vista semanal/quincenal
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('weeks') // 'weeks' o 'biweek'

  // Filtrado por proyecto o etiqueta opcional
  const [selectedProyecto, setSelectedProyecto] = useState('Todos')
  const [selectedEtiqueta, setSelectedEtiqueta] = useState('Todas')

  // Obtener rangos de la cuadrícula de días según el modo de vista
  const startOfGrid = startOfWeek(currentDate, { weekStartsOn: 1 }) // Empezar en Lunes
  const totalDays = viewMode === 'weeks' ? 7 : 14
  
  const daysArray = Array.from({ length: totalDays }, (_, i) => addDays(startOfGrid, i))
  const endOfGrid = daysArray[daysArray.length - 1]

  // Cambiar de semana/quincena
  const handlePrev = () => setCurrentDate(addDays(currentDate, -totalDays))
  const handleNext = () => setCurrentDate(addDays(currentDate, totalDays))
  const handleToday = () => setCurrentDate(new Date())

  // Filtrar tareas que tengan fechas válidas y coincidan con los filtros selectores
  const filteredTasks = tareas.filter(tarea => {
    if (!tarea.fechaInicio || !tarea.fechaVencimiento) return false
    
    const matchesProyecto = selectedProyecto === 'Todos' || tarea.proyecto === selectedProyecto
    const matchesEtiqueta = selectedEtiqueta === 'Todas' || tarea.etiqueta === selectedEtiqueta
    
    if (!matchesProyecto || !matchesEtiqueta) return false

    // Verificar si la tarea se cruza de alguna manera con el rango visible en pantalla
    try {
      const tStart = parseISO(tarea.fechaInicio)
      const tEnd = parseISO(tarea.fechaVencimiento)
      
      return (
        isWithinInterval(tStart, { start: startOfGrid, end: endOfGrid }) ||
        isWithinInterval(tEnd, { start: startOfGrid, end: endOfGrid }) ||
        (tStart <= startOfGrid && tEnd >= endOfGrid)
      )
    } catch (e) {
      return false
    }
  })

  // Extraer las opciones de filtros únicas de forma segura
  const uniqueProyectos = ['Todos', ...(state.proyectos || [])]
  const uniqueEtiquetas = ['Todas', ...new Set(tareas.map(t => t.etiqueta).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Cabecera de controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-700/40 border border-white/5 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent-violet/10 rounded-xl text-accent-violet">
            <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-slate-100">Vista de Gantt</h1>
            <p className="text-xs text-slate-400">Cronograma de tareas en curso y dependencias temporales</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Selectores de filtros */}
          <select
            value={selectedProyecto}
            onChange={(e) => setSelectedProyecto(e.target.value)}
            className="bg-surface-600 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60"
          >
            {uniqueProyectos.map(p => (
              <option key={typeof p === 'string' ? p : p.nombre || 'sin-nombre'} value={typeof p === 'string' ? p : p.nombre}>
                {typeof p === 'string' ? p : p.nombre}
              </option>
            ))}
          </select>

          <select
            value={selectedEtiqueta}
            onChange={(e) => setSelectedEtiqueta(e.target.value)}
            className="bg-surface-600 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60"
          >
            {uniqueEtiquetas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden md:block" />

          {/* Selector de modo de vista */}
          <div className="bg-surface-600 p-0.5 rounded-xl border border-white/10 flex">
            <button
              onClick={() => setViewMode('weeks')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${viewMode === 'weeks' ? 'bg-accent-violet text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('biweek')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${viewMode === 'biweek' ? 'bg-accent-violet text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              14 Días
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden md:block" />

          {/* Navegación temporal */}
          <div className="flex items-center bg-surface-600 rounded-xl border border-white/10 overflow-hidden">
            <button onClick={handlePrev} className="p-2 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={handleToday} className="px-3 py-1 text-xs font-medium border-x border-white/5 text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-all">
              Hoy
            </button>
            <button onClick={handleNext} className="p-2 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor principal del diagrama de Gantt */}
      <div className="bg-surface-700/20 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Cabecera del Grid (Días) */}
            <div className="grid grid-cols-12 border-b border-white/5 bg-surface-800/40">
              <div className="col-span-4 p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider border-r border-white/5">
                Tareas / Contexto
              </div>
              <div className="col-span-8 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(0, 1fr))` }}>
                {daysArray.map((day, idx) => {
                  const isTodayActive = isSameDay(day, new Date())
                  return (
                    <div
                      key={idx}
                      className={`p-2 text-center border-r last:border-r-0 border-white/5 flex flex-col items-center justify-center min-h-[55px] ${isTodayActive ? 'bg-accent-violet/10' : ''}`}
                    >
                      <span className={`text-[10px] font-medium tracking-wide uppercase ${isTodayActive ? 'text-accent-violet' : 'text-slate-500'}`}>
                        {format(day, 'eee')}
                      </span>
                      <span className={`text-xs font-bold mt-0.5 rounded-full w-5 h-5 flex items-center justify-center ${isTodayActive ? 'bg-accent-violet text-white' : 'text-slate-300'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cuerpo del Gantt */}
            <div className="divide-y divide-white/5">
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-500">
                  <AlertCircle size={24} className="text-slate-600" />
                  <p className="text-sm">No hay tareas programadas en este rango de fechas visibles.</p>
                </div>
              ) : (
                filteredTasks.map(tarea => {
                  const tStart = parseISO(tarea.fechaInicio)
                  const tEnd = parseISO(tarea.fechaVencimiento)
                  
                  // Calcular los índices de inicio y fin relativos a nuestra cuadrícula
                  let startIdx = differenceInDays(tStart, startOfGrid)
                  let endIdx = differenceInDays(tEnd, startOfGrid)

                  // Ajustar límites para que no desborden la visualización externa
                  if (startIdx < 0) startIdx = 0
                  if (endIdx >= totalDays) endIdx = totalDays - 1
                  if (endIdx < startIdx) endIdx = startIdx

                  const spanLength = endIdx - startIdx + 1

                  // Obtener color dinámico invocando de forma segura la función global
                  const colorConfig = getProjectColor(tarea.proyecto, state.proyectos || [])

                  return (
                    <div key={tarea.id} className="grid grid-cols-12 items-center group hover:bg-white/[0.01] transition-colors">
                      {/* Información lateral de la tarea */}
                      <div className="col-span-4 p-4 border-r border-white/5 space-y-1.5 max-w-full overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${colorConfig?.bg || 'bg-emerald-500/20'} ${colorConfig?.text || 'text-emerald-400'} border ${colorConfig?.border || 'border-emerald-500/30'}`} />
                          <span className="text-[10px] font-semibold text-slate-400 truncate tracking-wide bg-surface-600/50 px-2 py-0.5 rounded-md border border-white/5">
                            {tarea.proyecto}
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors truncate pr-2">
                          {tarea.titulo}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Tag size={10} /> {tarea.etiqueta}
                          </span>
                          <span>•</span>
                          <span>{tarea.estado}</span>
                        </div>
                      </div>

                      {/* Timeline / Barra de progreso temporal */}
                      <div className="col-span-8 h-full grid relative items-center" style={{ gridTemplateColumns: `repeat(${totalDays}, minmax(0, 1fr))` }}>
                        {/* Líneas divisorias de fondo */}
                        {Array.from({ length: totalDays }).map((_, i) => (
                          <div key={i} className="absolute top-0 bottom-0 border-r border-white/[0.02] pointer-events-none" style={{ left: `${(i + 1) * (100 / totalDays)}%` }} />
                        ))}

                        {/* Barra del Gantt */}
                        <div
                          style={{
                            gridColumnStart: startIdx + 1,
                            gridColumnEnd: `span ${spanLength}`
                          }}
                          className="py-1 px-1 z-10"
                        >
                          <div
                            className={`h-7 rounded-lg ${colorConfig?.bg || 'bg-emerald-500/10'} border ${colorConfig?.border || 'border-emerald-500/30'} ${colorConfig?.text || 'text-emerald-400'} px-2.5 flex items-center justify-between shadow-sm relative overflow-hidden group/bar transition-all duration-200 hover:brightness-110`}
                          >
                            <span className="text-[10px] font-medium truncate select-none">
                              {tarea.titulo}
                            </span>
                            <span className="text-[9px] font-bold opacity-60 ml-2 whitespace-nowrap bg-black/10 px-1.5 py-0.5 rounded">
                              {differenceInDays(tEnd, tStart) + 1} d
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}