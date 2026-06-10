import React, { useState, useMemo } from 'react'
import { format, parseISO, differenceInDays, addDays, startOfWeek, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Layers } from 'lucide-react'
import { useTask, getProjectColor } from '../context/TaskContext'

const DIAS_A_MOSTRAR = 32 // Amplitud de la ventana del Gantt
const ANCHO_CELDA = 44    // Ancho en píxeles de cada celda de día

export default function Gantt() {
  const { state } = useTask()
  
  // Control de navegación temporal (inicia en el lunes de la semana actual)
  const [fechaInicioVista, setFechaInicioVista] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  // Generar el array de días que se mostrarán en la cabecera
  const diasTimeline = useMemo(() => {
    return Array.from({ length: DIAS_A_MOSTRAR }, (_, i) => addDays(fechaInicioVista, i))
  }, [fechaInicioVista])

  const fechaFinVista = diasTimeline[diasTimeline.length - 1]

  // Agrupar tareas válidas por proyecto
  const proyectosConTareas = useMemo(() => {
    const agrupado = {}
    
    // Inicializar con todos los proyectos existentes para mantener consistencia
    state.proyectos.forEach(p => { agrupado[p] = [] })

    // Filtrar y asignar tareas con fechas válidas
    state.tareas.forEach(tarea => {
      if (tarea.fechaInicio && tarea.fechaVencimiento) {
        if (agrupado[tarea.proyecto]) {
          agrupado[tarea.proyecto].push(tarea)
        } else {
          agrupado[tarea.proyecto] = [tarea]
        }
      }
    })

    return Object.entries(agrupado)
  }, [state.proyectos, state.tareas])

  // Navegación temporal
  const moverSemanas = (semanas) => {
    setFechaInicioVista(prev => addDays(prev, semanas * 7))
  }
  const irAHoy = () => {
    setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  return (
    <div className="p-8 animate-fade-in max-w-7xl mx-auto h-full flex flex-col">
      
      {/* CABECERA Y CONTROLES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Cronograma Gantt</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sincronización visual absoluta de tus tiempos y flujos de trabajo operativos.
          </p>
        </div>
        
        {/* Navegador de fechas */}
        <div className="flex items-center gap-2 bg-surface-800/90 border border-white/5 p-1.5 rounded-xl self-end sm:self-auto">
          <button onClick={() => moverSemanas(-2)} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700 transition-colors" title="2 semanas atrás">
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button onClick={irAHoy} className="px-3 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded-lg border border-white/5 transition-all">
            Hoy
          </button>
          <button onClick={() => moverSemanas(2)} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-700 transition-colors" title="2 semanas adelante">
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
          
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          
          <span className="text-xs font-mono font-medium text-slate-400 px-2 flex items-center gap-1.5">
            <Calendar size={13} className="text-accent-violet" />
            {format(fechaInicioVista, 'dd MMM', { locale: es })} — {format(fechaFinVista, 'dd MMM yyyy', { locale: es })}
          </span>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL GANTT */}
      <div className="bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col flex-1">
        
        {/* SCROLL HORIZONTAL DE LA TABLA */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-max">
            
            {/* Cabecera del Gantt (Meses y Días) */}
            <div className="grid grid-cols-[280px_1fr] border-b border-white/5 bg-surface-800/80 sticky top-0 z-10 backdrop-blur-md">
              <div className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-r border-white/5">
                <Layers size={14} className="text-slate-500" /> Proyectos y Tareas
              </div>
              
              {/* Grid de días */}
              <div className="flex">
                {diasTimeline.map((dia, idx) => {
                  const esHoy = format(dia, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  const esLunes = dia.getDay() === 1
                  
                  return (
                    <div 
                      key={idx} 
                      style={{ width: `${ANCHO_CELDA}px` }} 
                      className={`h-14 flex flex-col items-center justify-center text-center shrink-0 border-r border-white/4 relative ${
                        esHoy ? 'bg-accent-violet/10 font-bold' : ''
                      } ${esLunes ? 'border-l-2 border-l-slate-600/40' : ''}`}
                    >
                      <span className={`text-[10px] uppercase font-semibold tracking-tight ${esHoy ? 'text-accent-violet' : 'text-slate-500'}`}>
                        {format(dia, 'eeeeee', { locale: es })}
                      </span>
                      <span className={`text-xs font-mono mt-0.5 ${esHoy ? 'text-white bg-accent-violet px-1.5 py-0.5 rounded-md text-[11px]' : 'text-slate-300'}`}>
                        {format(dia, 'd')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* CUERPO DEL CRONOGRAMA */}
            <div className="divide-y divide-white/5">
              {proyectosConTareas.map(([proyecto, tareas]) => {
                // Obtenemos el set de color sincronizado desde el Context
                const colorProyecto = getProjectColor(proyecto)

                return (
                  <div key={proyecto} className="transition-colors hover:bg-white/[0.01]">
                    
                    {/* FILA DEL PROYECTO MAESTRO */}
                    <div className="grid grid-cols-[280px_1fr] items-center bg-surface-800/20 py-2.5 border-b border-white/4">
                      <div className="px-5 flex items-center gap-2.5 truncate border-r border-white/5 h-full">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorProyecto.accent }} />
                        <h3 className="text-sm font-bold text-slate-200 truncate" title={proyecto}>
                          {proyecto}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                          {tareas.length}
                        </span>
                      </div>
                      
                      {/* Fondo de celdas vacío para la fila del proyecto */}
                      <div className="flex h-6">
                        {diasTimeline.map((_, i) => (
                          <div key={i} style={{ width: `${ANCHO_CELDA}px` }} className="shrink-0 border-r border-white/[0.02]" />
                        ))}
                      </div>
                    </div>

                    {/* FILAS DE LAS TAREAS */}
                    {tareas.length === 0 ? (
                      <div className="grid grid-cols-[280px_1fr] items-center text-xs py-2 text-slate-600 italic">
                        <div className="pl-10 border-r border-white/5">Sin rango temporal definido...</div>
                        <div className="flex h-6" />
                      </div>
                    ) : (
                      tareas.map(tarea => {
                        const inicioTask = parseISO(tarea.fechaInicio)
                        const finTask = parseISO(tarea.fechaVencimiento)

                        // Calcular posiciones relativas a la línea de tiempo visible
                        const shiftDias = differenceInDays(inicioTask, fechaInicioVista)
                        const duracionDias = differenceInDays(finTask, inicioTask) + 1

                        // Determinar visibilidad e intersección en pantalla
                        const fueraDeVistaIzquierda = shiftDias + duracionDias <= 0
                        const fueraDeVistaDerecha = shiftDias >= DIAS_A_MOSTRAR
                        const esVisible = !fueraDeVistaIzquierda && !fueraDeVistaDerecha

                        // Ajustar coordenadas para que no rompan el Flexbox absoluto
                        const leftOffset = Math.max(0, shiftDias) * ANCHO_CELDA
                        const celdasVisibles = esVisible 
                          ? Math.min(duracionDias + Math.min(0, shiftDias), DIAS_A_MOSTRAR - Math.max(0, shiftDias))
                          : 0
                        const widthBarra = celdasVisibles * ANCHO_CELDA

                        return (
                          <div key={tarea.id} className="grid grid-cols-[280px_1fr] items-center py-2 hover:bg-surface-600/10 transition-colors group">
                            
                            {/* Columna Izquierda: Detalle Breve */}
                            <div className="pl-10 pr-4 text-xs font-medium text-slate-400 truncate border-r border-white/5 flex flex-col">
                              <span className={`truncate group-hover:text-slate-200 transition-colors ${tarea.estado === 'Done' ? 'line-through text-slate-600' : ''}`}>
                                {tarea.titulo}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 tracking-tight mt-0.5">
                                {format(inicioTask, 'dd/MM')} al {format(finTask, 'dd/MM')}
                              </span>
                            </div>

                            {/* Columna Derecha: Renderizado del Bloque del Gantt */}
                            <div className="flex relative items-center h-8 w-full bg-grid-pattern">
                              
                              {/* Líneas tenues de fondo por cada día */}
                              <div className="absolute inset-0 flex pointer-events-none">
                                {diasTimeline.map((_, i) => (
                                  <div key={i} style={{ width: `${ANCHO_CELDA}px` }} className="h-full shrink-0 border-r border-white/[0.03]" />
                                ))}
                              </div>

                              {/* Barra Dinámica de la Tarea Sincronizada */}
                              {esVisible && widthBarra > 0 && (
                                <div
                                  style={{
                                    marginLeft: `${leftOffset}px`,
                                    width: `${widthBarra}px`
                                  }}
                                  className={`absolute h-6 flex items-center px-2.5 rounded-lg border text-[11px] font-semibold tracking-wide shadow-md transition-all select-none truncate ${
                                    tarea.estado === 'Done' ? 'opacity-40 filter grayscale' : ''
                                  } ${colorProyecto.bg} ${colorProyecto.border} ${colorProyecto.text}`}
                                  title={`${tarea.titulo} (${tarea.proyecto}) - Estado: ${tarea.estado}`}
                                >
                                  <span className="truncate w-full block text-left">
                                    {tarea.titulo}
                                  </span>
                                </div>
                              )}
                            </div>

                          </div>
                        )
                      })
                    )}

                  </div>
                )
              })}
            </div>

          </div>
        </div>
        
      </div>
    </div>
  )
}