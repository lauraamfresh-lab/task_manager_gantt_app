import React, { useState, useMemo } from 'react'
import { format, parseISO, differenceInDays, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart2, Filter, Tag } from 'lucide-react'
import { useTask, ESTADO_CONFIG, getEtiquetaColor, ETIQUETAS_OPCIONES } from '../context/TaskContext'

export default function Gantt() {
  const { state } = useTask()
  
  const [proyectoFiltrado, setProyectoFiltrado] = useState('Todos')
  const [etiquetaFiltrada, setEtiquetaFiltrada] = useState('Todas') 
  
  // 1. FILTRADO MULTICRITERIO (Proyecto + Etiqueta)
  const validTareas = useMemo(() => {
    return state.tareas.filter(t => {
      if (!t.fechaInicio) return false
      
      const pasaProyecto = proyectoFiltrado === 'Todos' || t.proyecto === proyectoFiltrado
      const pasaEtiqueta = etiquetaFiltrada === 'Todas' || t.etiqueta === etiquetaFiltrada
      
      return pasaProyecto && pasaEtiqueta
    })
  }, [state.tareas, proyectoFiltrado, etiquetaFiltrada])

  // 2. LÍMITES TEMPORALES DEL TIMELINE
  const timelineBounds = useMemo(() => {
    if (validTareas.length === 0) {
      return { minDate: new Date(), maxDate: addDays(new Date(), 7), totalDays: 7, markers: [] }
    }

    const starts = validTareas.map(t => parseISO(t.fechaInicio).getTime())
    const ends = validTareas.map(t => t.fechaVencimiento ? parseISO(t.fechaVencimiento).getTime() : parseISO(t.fechaInicio).getTime() + 86400000)

    let min = addDays(new Date(Math.min(...starts)), -3)
    let max = addDays(new Date(Math.max(...ends)), 5)
    if (max <= min) max = addDays(min, 7)

    const totalDays = Math.max(1, differenceInDays(max, min))
    const markers = []
    const divisiones = Math.min(8, totalDays) 
    const step = Math.max(1, Math.floor(totalDays / divisiones))
    
    for (let i = 0; i <= totalDays; i += step) {
      markers.push(addDays(min, i))
    }

    return { minDate: min, maxDate: max, totalDays, markers }
  }, [validTareas])

  const { minDate, totalDays, markers } = timelineBounds

  const getPercentagePosition = (dateObj) => {
    const diff = differenceInDays(dateObj, minDate)
    return Math.min(100, Math.max(0, (diff / totalDays) * 100))
  }

  const todayPosition = useMemo(() => {
    const today = new Date()
    const maxDate = addDays(minDate, totalDays)
    if (today >= minDate && today <= maxDate) {
      return getPercentagePosition(today)
    }
    return null
  }, [minDate, totalDays])

  // 3. LISTA PLANA DE TAREAS ORDENADAS POR FECHA DE INICIO
  const sortedTareas = useMemo(() => {
    return [...validTareas].sort((a, b) => parseISO(a.fechaInicio).getTime() - parseISO(b.fechaInicio).getTime())
  }, [validTareas])

  return (
    <div className="p-8 animate-fade-in bg-[#0b0f19] min-h-screen text-slate-100">
      
      {/* Header Superior con Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <BarChart2 size={18} className="text-accent-violet" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">Diagrama de Gantt</h1>
            <p className="text-sm text-slate-500 mt-0.5">Seguimiento visual de tareas ordenadas por inicio</p>
          </div>
        </div>

        {/* Panel de Filtros Doble */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro Proyecto */}
          <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-1.5 rounded-xl">
            <Filter size={13} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400 mr-1">Proyecto:</span>
            <select 
              value={proyectoFiltrado} 
              onChange={(e) => setProyectoFiltrado(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-surface-700">Todos</option>
              {state.proyectos.map(p => <option key={p} value={p} className="bg-surface-700">{p}</option>)}
            </select>
          </div>

          {/* Filtro Etiqueta */}
          <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-1.5 rounded-xl">
            <Tag size={13} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400 mr-1">Etiqueta:</span>
            <select 
              value={etiquetaFiltrada} 
              onChange={(e) => setEtiquetaFiltrada(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
            >
              <option value="Todas" className="bg-surface-700">Todas las etiquetas</option>
              {ETIQUETAS_OPCIONES.map(tag => <option key={tag} value={tag} className="bg-surface-700">{tag}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* LEYENDA INFORMATIVA DE COLORES */}
      <div className="flex flex-wrap gap-4 mb-6 bg-surface-800/40 border border-white/5 p-3 rounded-xl text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1">Colores por etiqueta:</span>
        {ETIQUETAS_OPCIONES.map(tag => {
          const colorCfg = getEtiquetaColor(tag)
          return (
            <div key={tag} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorCfg.accent }} />
              <span className="text-slate-300 font-medium">{tag}</span>
            </div>
          )
        })}
      </div>

      {/* TIMELINE GANTT */}
      <div className="border border-white/5 rounded-2xl bg-surface-700/30 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[950px] relative">
            
            {/* Rejilla de Fondo / Línea de Hoy */}
            <div className="absolute inset-0 left-[360px] pointer-events-none flex justify-between z-0">
              {markers.map((_, idx) => <div key={idx} className="w-px h-full border-l border-white/[0.03]" />)}
              {todayPosition !== null && (
                <div className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500/50 z-20" style={{ left: `${todayPosition}%` }} />
              )}
            </div>

            {/* Cabecera fechas */}
            <div className="grid grid-cols-[360px_1fr] bg-surface-800/90 border-b border-white/10 items-center text-xs font-medium uppercase tracking-wider text-slate-500 h-12 z-10 relative">
              <div className="px-5 border-r border-white/5 h-full flex items-center">Tareas Planificadas</div>
              <div className="relative h-full flex justify-between items-center px-4 font-mono text-[10px] text-slate-400">
                {markers.map((date, i) => (
                  <span key={i} className="transform -translate-x-1/2 whitespace-nowrap">
                    {format(date, 'dd MMM', { locale: es })}
                  </span>
                ))}
                {todayPosition !== null && (
                  <span className="absolute bg-rose-500 text-white font-sans text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md top-1 transform -translate-x-1/2 z-30" style={{ left: `${todayPosition}%` }}>
                    Hoy
                  </span>
                )}
              </div>
            </div>

            {/* Renderizado de Datos (Flujo Plano Alineado) */}
            <div className="divide-y divide-white/[0.04]">
              {sortedTareas.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">No se encontraron tareas coincidentes con los filtros actuales.</div>
              ) : (
                sortedTareas.map(tarea => {
                  const start = parseISO(tarea.fechaInicio)
                  let end = tarea.fechaVencimiento ? parseISO(tarea.fechaVencimiento) : addDays(start, 1)
                  if (end <= start) end = addDays(start, 1)

                  const barLeft = getPercentagePosition(start)
                  const barRight = getPercentagePosition(end)
                  const barWidth = Math.max(1.5, barRight - barLeft)

                  const cfg = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG['To Do']
                  const tagColor = getEtiquetaColor(tarea.etiqueta)
                  
                  return (
                    <div key={tarea.id} className="grid grid-cols-[360px_1fr] items-center hover:bg-white/[0.02] transition-colors h-12 relative z-10 border-b border-white/[0.02]">
                      <div className="px-5 pr-4 flex items-center justify-between gap-3 border-r border-white/5 h-full truncate">
                        <div className="flex items-center gap-3 truncate flex-1">
                          
                          {/* 1. Identificador de Proyecto (Ancho fijo e inamovible) */}
                          <span 
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 uppercase tracking-wider text-center truncate w-24 shrink-0" 
                            title={tarea.proyecto}
                          >
                            {tarea.proyecto}
                          </span>

                          {/* 2. Identificador de Etiqueta (Ancho fijo e inamovible) */}
                          <span 
                            className="text-[9px] font-semibold py-0.5 rounded border uppercase text-center w-7 shrink-0" 
                            style={{ backgroundColor: `${tagColor.accent}20`, borderColor: tagColor.accent, color: tagColor.accent }}
                          >
                            {tarea.etiqueta ? tarea.etiqueta.substring(0,2) : '—'}
                          </span>

                          {/* 3. Título de la tarea (Se adapta al espacio restante perfectamente alineado) */}
                          <span className={`text-sm font-medium truncate ${tarea.estado === 'Done' ? 'line-through text-slate-500 opacity-60' : 'text-slate-300'}`}>
                            {tarea.titulo}
                          </span>
                        </div>
                        
                        <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0 uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {tarea.estado === 'In Progress' ? 'Progreso' : tarea.estado}
                        </span>
                      </div>

                      {/* Barra de Tiempo en el Timeline */}
                      <div className="relative h-full w-full flex items-center px-4">
                        <div 
                          className="absolute h-6 rounded-lg flex items-center px-2 shadow-md border cursor-default overflow-hidden transition-all duration-150"
                          style={{ 
                            left: `${barLeft}%`, 
                            width: `${barWidth}%`,
                            backgroundColor: `${tagColor.accent}20`, 
                            borderColor: `${tagColor.accent}60`,
                            borderWidth: '1px'
                          }}
                          title={`${tarea.titulo} [Proyecto: ${tarea.proyecto}] [Etiqueta: ${tarea.etiqueta || 'Ninguna'}]`}
                        >
                          <div 
                            className="absolute left-0 top-0 bottom-0 opacity-40"
                            style={{ 
                              width: tarea.estado === 'Done' ? '100%' : tarea.estado === 'In Progress' ? '50%' : '0%',
                              backgroundColor: tagColor.accent
                            }}
                          />
                          {barWidth > 12 && (
                            <span className="text-[10px] font-semibold text-white/95 truncate z-10 font-mono">
                              {tarea.etiqueta || 'Sin etiqueta'}
                            </span>
                          )}
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