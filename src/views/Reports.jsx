import React, { useState, useMemo } from 'react'
import { ClipboardList, ChevronDown, ChevronRight, Check, Circle, Calendar, User, BarChart2, AlertTriangle, CheckCircle2, Clock, Layers, Plus, Trash2, Edit2 } from 'lucide-react'
import { format, parseISO, differenceInDays, addDays, startOfWeek, getISOWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTask, getProjectColor, ESTADO_CONFIG, getEtiquetaColor } from '../context/TaskContext'

// ─── Inline mini-Gantt (uses Gantt.jsx rendering logic, scoped to one project) ───

function MiniGantt({ tareas, proyectosData }) {
  const [vistaMode, setVistaMode] = useState('mes')
  const [fechaInicioVista, setFechaInicioVista] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)

  const timelineBounds = useMemo(() => {
    const min = fechaInicioVista
    let diasAAnadir = 31

    if (vistaMode === 'semana') { diasAAnadir = 7 }
    else if (vistaMode === 'tres_meses') { diasAAnadir = 90 }

    const max = addDays(min, diasAAnadir)
    const totalDays = Math.max(1, differenceInDays(max, min))

    // Un marcador por cada día del rango, para poder ver la fecha de todos los días
    const markers = []
    for (let i = 0; i <= totalDays; i++) {
      markers.push(addDays(min, i))
    }

    return { minDate: min, maxDate: max, totalDays, markers }
  }, [fechaInicioVista, vistaMode])

  const { minDate, maxDate, totalDays, markers } = timelineBounds

  const getPerc = (dateObj) => Math.min(100, Math.max(0, (differenceInDays(dateObj, minDate) / totalDays) * 100))

  const todayPosition = useMemo(() => {
    const today = new Date()
    if (today >= minDate && today <= addDays(minDate, totalDays)) return getPerc(today)
    return null
  }, [minDate, totalDays])

  // Agrupación por semanas del año (ISO) para el indicador visual de semana
  const semanas = useMemo(() => {
    const result = []
    const limite = addDays(minDate, totalDays)
    let cursor = startOfWeek(minDate, { weekStartsOn: 1 })

    while (cursor <= limite) {
      const weekStart = cursor
      const weekEndExclusivo = addDays(weekStart, 7)
      const clampedStart = weekStart < minDate ? minDate : weekStart
      const clampedEnd = weekEndExclusivo > limite ? limite : weekEndExclusivo

      result.push({
        weekNumber: getISOWeek(weekStart),
        showBoundary: weekStart > minDate,
        boundaryPos: getPerc(weekStart),
        left: getPerc(clampedStart),
        right: getPerc(clampedEnd)
      })

      cursor = addDays(cursor, 7)
    }
    return result
  }, [minDate, totalDays])

  const validTareas = useMemo(() => tareas.filter(t => {
    if (!t.fechaInicio || !t.fechaVencimiento) return false
    try {
      const tStart = parseISO(t.fechaInicio)
      let tEnd = parseISO(t.fechaVencimiento)
      if (tEnd <= tStart) tEnd = addDays(tStart, 1)
      return tStart <= maxDate && tEnd >= minDate
    } catch { return false }
  }), [tareas, minDate, maxDate])

  const tareasActivas = useMemo(() =>
    [...validTareas].filter(t => t.estado !== 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)),
    [validTareas]
  )
  const tareasCompletadas = useMemo(() =>
    [...validTareas].filter(t => t.estado === 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)),
    [validTareas]
  )

  const navegarTimeline = (dir) => {
    const delta = vistaMode === 'semana' ? 7 : vistaMode === 'mes' ? 30 : 90
    setFechaInicioVista(prev => addDays(prev, dir * delta))
  }

  const renderFila = (tarea) => {
    const start = parseISO(tarea.fechaInicio)
    let end = tarea.fechaVencimiento ? parseISO(tarea.fechaVencimiento) : addDays(start, 1)
    if (end <= start) end = addDays(start, 1)

    const barLeft = getPerc(start)
    const barRight = getPerc(end)
    const barWidth = Math.max(1.5, barRight - barLeft)

    const cfg = ESTADO_CONFIG[tarea.estado] || ESTADO_CONFIG['To Do']
    const tagColor = getEtiquetaColor(tarea.etiqueta)
    const projColor = getProjectColor(tarea.proyecto, proyectosData)

    return (
      <div key={tarea.id} className="grid grid-cols-[300px_1fr] items-center hover:bg-white/[0.02] transition-colors min-h-[48px] py-1.5 relative z-10 border-b border-white/[0.02]">
        <div className="px-4 pr-3 flex items-center justify-between gap-3 border-r border-white/5 h-full">
          <span className={`text-xs font-medium pr-2 break-words flex-1 leading-relaxed ${tarea.estado === 'Done' ? 'line-through text-slate-500 opacity-60' : 'text-slate-300'}`}>
            {tarea.titulo}
          </span>
          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0 uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {tarea.estado === 'In Progress' ? 'Progreso' : tarea.estado}
          </span>
        </div>

        <div className="relative h-full w-full flex items-center px-3">
          <div
            className="absolute h-5 rounded-lg flex items-center px-2 shadow-md border cursor-default overflow-hidden transition-all duration-150"
            style={{
              left: `${barLeft}%`,
              width: `${barWidth}%`,
              backgroundColor: `${tagColor.accent}20`,
              borderColor: `${tagColor.accent}60`,
              borderWidth: '1px'
            }}
            title={`${tarea.titulo} [${tarea.etiqueta || 'Sin etiqueta'}]`}
          >
            <div
              className="absolute left-0 top-0 bottom-0 opacity-40"
              style={{
                width: tarea.estado === 'Done' ? '100%' : tarea.estado === 'In Progress' ? '50%' : '0%',
                backgroundColor: tagColor.accent
              }}
            />
            {barWidth > 14 && (
              <span className="text-[9px] font-semibold text-white/95 truncate z-10 font-mono">
                {tarea.etiqueta || 'Sin etiqueta'}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Gantt controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-surface-800/70 border border-white/5 px-2.5 py-1.5 rounded-lg">
          <BarChart2 size={12} className="text-slate-500" />
          <span className="text-[10px] font-medium text-slate-400 mr-1">Vista:</span>
          <select
            value={vistaMode}
            onChange={(e) => { setVistaMode(e.target.value); setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 })) }}
            className="bg-transparent text-[11px] font-semibold text-slate-200 outline-none cursor-pointer"
          >
            <option value="semana" className="bg-surface-700">Semana</option>
            <option value="mes" className="bg-surface-700">Mes</option>
            <option value="tres_meses" className="bg-surface-700">3 Meses</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-surface-800/70 border border-white/5 p-1 rounded-lg">
          <button onClick={() => navegarTimeline(-1)} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <ChevronRight size={13} className="rotate-180" />
          </button>
          <button onClick={() => setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-2 py-0.5 text-[10px] font-semibold text-slate-200 bg-white/5 hover:bg-white/10 rounded transition-colors">
            Hoy
          </button>
          <button onClick={() => navegarTimeline(1)} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <ChevronRight size={13} />
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1.5 lowercase">
            {format(minDate, 'dd MMM', { locale: es }).replace('.', '')} – {format(maxDate, 'dd MMM yy', { locale: es }).replace('.', '')}
          </span>
        </div>
      </div>

      {/* Gantt table */}
      <div className="border border-white/5 rounded-xl bg-surface-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: `${Math.max(700, 300 + markers.length * 42)}px` }}>

            {/* Vertical guides + today line */}
            <div className="absolute inset-0 left-[300px] pointer-events-none flex justify-between z-0">
              {markers.map((_, idx) => <div key={idx} className="w-px h-full border-l border-white/[0.03]" />)}
              {semanas.map((sem, idx) => sem.showBoundary && (
                <div key={`sem-${idx}`} className="absolute top-0 bottom-0 w-px bg-indigo-400/40 z-10" style={{ left: `${sem.boundaryPos}%` }} />
              ))}
              {todayPosition !== null && (
                <div className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500/50 z-20" style={{ left: `${todayPosition}%` }} />
              )}
            </div>

            {/* Week-of-year indicator row */}
            <div className="grid grid-cols-[300px_1fr] bg-surface-800/80 border-b border-white/5 items-stretch text-[10px] font-medium uppercase tracking-wider text-slate-500 z-10 relative">
              <div className="px-4 border-r border-white/5 flex items-center h-6">Semana del año</div>
              <div className="relative h-6">
                {semanas.map((sem, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 flex items-center justify-center border-l border-indigo-400/30 first:border-l-0 overflow-hidden"
                    style={{ left: `${sem.left}%`, width: `${sem.right - sem.left}%` }}
                  >
                    <span className="text-[8px] font-bold text-indigo-300 tracking-wider truncate px-1">Sem {sem.weekNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[300px_1fr] bg-surface-800/80 border-b border-white/10 items-center text-[10px] font-medium uppercase tracking-wider text-slate-500 h-9 z-10 relative">
              <div className="px-4 border-r border-white/5 h-full flex items-center">Tarea</div>
              <div className="relative h-full flex justify-between items-center px-3 font-mono text-[9px] text-slate-500">
                {markers.map((date, i) => (
                  <span key={i} className="transform -translate-x-1/2 whitespace-nowrap lowercase">
                    {format(date, 'dd MMM', { locale: es }).replace('.', '')}
                  </span>
                ))}
                {todayPosition !== null && (
                  <span className="absolute bg-rose-500 text-white text-[8px] font-bold px-1 py-0.5 rounded top-1 transform -translate-x-1/2 z-30" style={{ left: `${todayPosition}%` }}>
                    Hoy
                  </span>
                )}
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.03]">
              {validTareas.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">Sin tareas con fechas en este período.</div>
              ) : (
                <>
                  {tareasActivas.map(t => renderFila(t))}
                  {tareasCompletadas.length > 0 && (
                    <div className="bg-[#0e1424]/30">
                      <div className="grid grid-cols-[300px_1fr] items-center min-h-[36px] border-b border-white/[0.03]">
                        <div className="px-4 h-full flex items-center">
                          <button
                            onClick={() => setMostrarCompletadas(!mostrarCompletadas)}
                            className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded bg-surface-800/60 border border-white/5"
                          >
                            {mostrarCompletadas ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            Completadas ({tareasCompletadas.length})
                          </button>
                        </div>
                        <div />
                      </div>
                      {mostrarCompletadas && (
                        <div className="divide-y divide-white/[0.02]">
                          {tareasCompletadas.map(t => renderFila(t))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Requirement row with Drag and Drop Support ───

function RequisitoRow({ h, tareas, sprints }) {
  const [expanded, setExpanded] = useState(false)

  const tareasVinculadas = tareas.filter(t =>
    t.historia && t.historia.trim() !== '' && t.titulo.toLowerCase().includes(h.titulo.toLowerCase().slice(0, 20))
  )

  const sprintName = (sprints || []).find(s => s.id === h.sprintId)?.nombre

  const isOverdue = h.fechaLimite && !h.completada && new Date(h.fechaLimite) < new Date()

  // Handler para iniciar arrastre del requerimiento
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', h.id)
  }

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      className={`border-b border-white/[0.04] last:border-0 cursor-grab active:cursor-grabbing hover:bg-white/[0.01] transition-all ${h.completada ? 'opacity-60' : ''}`}
    >
      <div
        className="grid grid-cols-[1fr_120px_110px_90px] items-center px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 pr-3 min-w-0">
          <div className="shrink-0">
            {h.completada
              ? <Check size={14} className="text-emerald-400" />
              : <Circle size={14} className="text-slate-500" />
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`text-sm font-medium truncate ${h.completada ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {h.titulo}
              </p>
              {sprintName && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 shrink-0">
                  {sprintName}
                </span>
              )}
            </div>
            {h.descripcion && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{h.descripcion}</p>
            )}
          </div>
          {expanded ? <ChevronDown size={13} className="text-slate-500 shrink-0" /> : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
        </div>

        <div>
          {h.completada ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <Check size={9} /> Completado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              <Clock size={9} /> Pendiente
            </span>
          )}
        </div>

        <div>
          {h.fechaLimite ? (
            <span className={`text-xs font-mono flex items-center gap-1 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
              {isOverdue && <AlertTriangle size={10} />}
              {h.fechaLimite}
            </span>
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}
        </div>

        <div>
          {h.responsable ? (
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <User size={11} className="text-slate-500" /> {h.responsable}
            </span>
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}
        </div>
      </div>

      {expanded && h.descripcion && (
        <div className="px-12 pb-3 animate-fade-in">
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap bg-surface-800/40 rounded-lg p-3 border border-white/5">
            {h.descripcion}
          </p>
          {sprintName && (
            <p className="text-[10px] mt-1 text-violet-400 font-medium">
              Asignado a: {sprintName}
            </p>
          )}
          {tareasVinculadas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tareasVinculadas.map(t => {
                const cfg = ESTADO_CONFIG[t.estado] || ESTADO_CONFIG['To Do']
                return (
                  <span key={t.id} className={`text-[10px] px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    {t.titulo}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Local Sprint Block for Requirements ───

// ─── Local Sprint Block for Requirements ───

function SprintBlock({ sprint, historiasSprint, onDrop, onDragOver, isBacklog = false, onEdit, onDelete }) {
  // El backlog inicia colapsado (true), los sprints normales inician abiertos (false)
  const [isCollapsed, setIsCollapsed] = useState(isBacklog)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(sprint.nombre)

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (editName.trim() && onEdit) {
      onEdit(sprint.id, editName.trim())
      setIsEditing(false)
    }
  }

  const fechaVencimientoSprint = useMemo(() => {
    if (!historiasSprint || historiasSprint.length === 0) return 'N/A'
    const fechas = historiasSprint
      .map(h => h.fechaLimite ? new Date(h.fechaLimite) : null)
      .filter(f => f && !isNaN(f.getTime()))
    
    if (fechas.length === 0) return 'Sin definir'
    const maxDate = new Date(Math.max(...fechas.map(d => d.getTime())))
    return format(maxDate, 'dd/MM/yyyy')
  }, [historiasSprint])

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, isBacklog ? null : sprint.id)}
      className={`p-4 rounded-xl border transition-all ${
        isBacklog 
          ? 'border-dashed border-white/10 bg-slate-950/20' 
          : 'border-white/5 bg-surface-800/40 hover:border-white/10 shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/5 mb-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="text-slate-400 hover:text-slate-200 transition-colors bg-white/5 p-0.5 rounded"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex items-center gap-2">
              <input 
                autoFocus 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                className="bg-slate-900 text-xs px-2 py-1 rounded outline-none border border-violet-500/50 text-white w-32" 
              />
              <button type="submit" className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-1 rounded hover:bg-emerald-500/30">Guardar</button>
              <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] bg-slate-500/20 text-slate-400 px-1.5 py-1 rounded hover:bg-slate-500/30">Cancelar</button>
            </form>
          ) : (
            <span className={`text-xs font-bold ${isBacklog ? 'text-slate-400' : 'text-slate-200'}`}>
              {isBacklog ? '📦 Requerimientos sin asignar (Backlog)' : sprint.nombre}
            </span>
          )}

          {!isEditing && (
            <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
              {historiasSprint.length} {historiasSprint.length === 1 ? 'req' : 'reqs'}
            </span>
          )}
        </div>

        {!isBacklog && !isEditing && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-violet-400 font-mono">
              <Clock size={11} />
              <span>Vence: {fechaVencimientoSprint}</span>
            </div>
            
            <div className="flex items-center gap-1 border-l border-white/10 pl-3">
              <button onClick={() => setIsEditing(true)} className="p-1 text-slate-500 hover:text-violet-400 hover:bg-white/5 rounded transition-colors" title="Editar Sprint">
                <Edit2 size={12} />
              </button>
              <button onClick={() => onDelete(sprint.id)} className="p-1 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded transition-colors" title="Eliminar Sprint">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="space-y-1.5 min-h-[44px] flex flex-col justify-start animate-fade-in">
          {historiasSprint.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic text-center py-2">
              Arrastra requerimientos aquí para organizarlos en este sprint
            </p>
          ) : (
            historiasSprint.map(h => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 bg-surface-900/60 border border-white/[0.03] p-2 rounded-lg flex-wrap"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {h.completada ? <Check size={12} className="text-emerald-400 shrink-0" /> : <Circle size={12} className="text-slate-600 shrink-0" />}
                  <span className={`text-xs truncate ${h.completada ? 'line-through text-slate-500 opacity-60' : 'text-slate-300'}`}>
                    {h.titulo}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {h.completada ? (
                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      <Check size={8} /> Completado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      <Clock size={8} /> Pendiente
                    </span>
                  )}
                  {h.responsable && (
                    <span className="text-[9px] text-slate-400 flex items-center gap-1">
                      <User size={9} className="text-slate-500" /> {h.responsable}
                    </span>
                  )}
                  {h.fechaLimite && <span className="text-[9px] font-mono text-slate-500">{h.fechaLimite}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Per-project report card (Strictly original UI + Sprint Panel) ───

function ProjectReportCard({ proyecto, historias, tareas }) {
  const [collapsed, setCollapsed] = useState(true)
  const [showGantt, setShowGantt] = useState(false)
  const [showSprints, setShowSprints] = useState(true)
  const [showRequerimientos, setShowRequerimientos] = useState(false)
  const [mostrarAsignados, setMostrarAsignados] = useState(false)
  const [nuevoSprintNombre, setNuevoSprintNombre] = useState('')
  const [creandoSprint, setCreandoSprint] = useState(false)
  const [ocultarCompletados, setOcultarCompletados] = useState(false)
  const [sortBy, setSortBy] = useState(null) // null, 'estado', 'fecha', 'responsable'
  const { state, dispatch } = useTask()
  const col = getProjectColor(proyecto, state.proyectos)

  const total = historias.length
  const completadas = historias.filter(h => h.completada).length
  const progress = total > 0 ? Math.round((completadas / total) * 100) : 0

  const tareasTotal = tareas.length
  const tareasDone = tareas.filter(t => t.estado === 'Done').length
  const tareasProgress = tareasTotal > 0 ? Math.round((tareasDone / tareasTotal) * 100) : 0

  const vencidas = historias.filter(h =>
    h.fechaLimite && !h.completada && new Date(h.fechaLimite) < new Date()
  ).length

  const sprintsProyecto = useMemo(() => 
    (state.sprints || []).filter(s => s.proyecto === proyecto),
    [state.sprints, proyecto]
  )

  const historiasProcesadas = useMemo(() => {
    let list = [...historias]
    if (ocultarCompletados) {
      list = list.filter(h => !h.completada)
    }
    if (sortBy === 'estado') {
      list.sort((a, b) => (a.completada === b.completada ? 0 : a.completada ? 1 : -1))
    } else if (sortBy === 'fecha') {
      list.sort((a, b) => {
        if (!a.fechaLimite) return 1
        if (!b.fechaLimite) return -1
        return new Date(a.fechaLimite) - new Date(b.fechaLimite)
      })
    } else if (sortBy === 'responsable') {
      list.sort((a, b) => {
        const respA = a.responsable || 'Sin asignar'
        const respB = b.responsable || 'Sin asignar'
        return respA.localeCompare(respB)
      })
    }
    return list
  }, [historias, ocultarCompletados, sortBy])

  const activeSprintIds = useMemo(() =>
    new Set(sprintsProyecto.map(s => s.id)),
    [sprintsProyecto]
  )

  const historiasSinAsignar = useMemo(() =>
    historiasProcesadas.filter(h => !h.sprintId || !activeSprintIds.has(h.sprintId)),
    [historiasProcesadas, activeSprintIds]
  )

  const historiasAsignadas = useMemo(() =>
    historiasProcesadas.filter(h => h.sprintId && activeSprintIds.has(h.sprintId)),
    [historiasProcesadas, activeSprintIds]
  )

  // --- HTML5 Native Drag and Drop de Requerimientos ---
  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDropRequisito = (e, targetSprintId) => {
    e.preventDefault()
    const historiaId = e.dataTransfer.getData('text/plain')
    if (historiaId && dispatch) {
      dispatch({
        type: 'UPDATE_HISTORIA_SPRINT', // Acción que debes contemplar en tu context para guardar h.sprintId
        payload: { historiaId, sprintId: targetSprintId }
      })
    }
  }

  const handleCrearSprint = (e) => {
    e.preventDefault()
    if (!nuevoSprintNombre.trim()) return
    dispatch({
      type: 'ADD_SPRINT',
      payload: {
        id: `sprint-${Date.now()}`,
        nombre: nuevoSprintNombre.trim(),
        proyecto: proyecto
      }
    })
    setNuevoSprintNombre('')
    setCreandoSprint(false)
  }

  const handleEditSprint = (sprintId, nuevoNombre) => {
    dispatch({
      type: 'UPDATE_SPRINT',
      payload: { id: sprintId, nombre: nuevoNombre }
    })
  }

  const handleDeleteSprint = (sprintId) => {
    if (window.confirm('¿Eliminar este Sprint? Los requerimientos volverán al Backlog.')) {
      dispatch({ type: 'DELETE_SPRINT', payload: sprintId })
    }
  }

  return (
    <div className="bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">

      {/* Card header */}
      <div
        className="px-5 py-4 bg-surface-800/60 border-b border-white/5 flex flex-wrap justify-between items-center gap-3 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-slate-400 shrink-0">
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.accent }} />
          <h2 className="font-display font-bold text-slate-100 text-base truncate">{proyecto}</h2>
          {vencidas > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle size={9} /> {vencidas} vencida{vencidas !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* KPI chips original style */}
        <div className="flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOcultarCompletados(!ocultarCompletados)
            }}
            className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${
              ocultarCompletados
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            {ocultarCompletados ? 'Mostrar Completados' : 'Ocultar Completados'}
          </button>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reqs</p>
            <p className="text-sm font-bold text-slate-200 font-mono">{completadas}/{total}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tareas</p>
            <p className="text-sm font-bold text-slate-200 font-mono">{tareasDone}/{tareasTotal}</p>
          </div>
          <div className="w-24">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Progreso Reqs</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#34d399' : col.accent }}
              />
            </div>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3 animate-fade-in">

          {/* Sprints Panel at top of project for planning mapping */}
          <div className="bg-surface-800/20 p-4 border border-white/5 rounded-xl space-y-3">
            <div
              className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 cursor-pointer select-none"
              onClick={() => setShowSprints(!showSprints)}
            >
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                {showSprints ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <Layers size={14} className="text-violet-400" /> Planificar Sprints por Proyecto (Arrastra requerimientos abajo)
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSprints(true)
                  setCreandoSprint(!creandoSprint)
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded"
              >
                <Plus size={12} />
                Crear Sprint
              </button>
            </div>

            {showSprints && (
              <>
                {creandoSprint && (
                  <form onSubmit={handleCrearSprint} className="flex items-center gap-2 max-w-sm animate-fade-in">
                    <input
                      type="text"
                      placeholder="Ej: Sprint 1, Fase MVP..."
                      value={nuevoSprintNombre}
                      onChange={(e) => setNuevoSprintNombre(e.target.value)}
                      className="bg-surface-900 text-xs px-2.5 py-1.5 rounded border border-white/10 outline-none text-slate-200 focus:border-violet-500 flex-1"
                      autoFocus
                    />
                    <button type="submit" className="text-xs font-semibold px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors">
                      Guardar
                    </button>
                  </form>
                )}

                <div className="flex flex-col gap-3">
                  {sprintsProyecto.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">
                      Aún no hay sprints creados para este proyecto.
                    </p>
                  ) : (
                    sprintsProyecto.map(sprint => {
                      const historiasDelSprint = historiasProcesadas.filter(h => h.sprintId === sprint.id)
                      return (
                        <SprintBlock
                          key={sprint.id}
                          sprint={sprint}
                          historiasSprint={historiasDelSprint}
                          onDrop={handleDropRequisito}
                          onDragOver={handleDragOver}
                          onEdit={handleEditSprint}
                          onDelete={handleDeleteSprint}
                        />
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Requirements table */}
          <div className="bg-surface-800/20 border border-white/5 rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
              onClick={() => setShowRequerimientos(!showRequerimientos)}
            >
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                {showRequerimientos ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <ClipboardList size={14} className="text-violet-400" /> Requerimientos ({total})
              </span>
            </div>

            {showRequerimientos && (
              <div className="px-4 pb-4 animate-fade-in">
                {historias.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-2 py-4 text-center">Sin requerimientos para este proyecto.</p>
                ) : (
                  <div className="rounded-xl border border-white/5 overflow-hidden bg-surface-700/20">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_120px_110px_90px] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-surface-800/40 border-b border-white/5 select-none">
                      <div>Requerimiento</div>
                      <div 
                        className={`cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1 ${sortBy === 'estado' ? 'text-accent-violet font-bold' : ''}`}
                        onClick={() => setSortBy(sortBy === 'estado' ? null : 'estado')}
                      >
                        Estado {sortBy === 'estado' && '↕'}
                      </div>
                      <div 
                        className={`cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1 ${sortBy === 'fecha' ? 'text-accent-violet font-bold' : ''}`}
                        onClick={() => setSortBy(sortBy === 'fecha' ? null : 'fecha')}
                      >
                        <Calendar size={9} /> Fecha Límite {sortBy === 'fecha' && '↕'}
                      </div>
                      <div 
                        className={`cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1 ${sortBy === 'responsable' ? 'text-accent-violet font-bold' : ''}`}
                        onClick={() => setSortBy(sortBy === 'responsable' ? null : 'responsable')}
                      >
                        <User size={9} /> Responsable {sortBy === 'responsable' && '↕'}
                      </div>
                    </div>
                    {historiasSinAsignar.length === 0 && historiasAsignadas.length === 0 ? (
                      <p className="text-xs text-slate-500 italic px-2 py-4 text-center">No hay requerimientos que coincidan con los filtros.</p>
                    ) : (
                      <>
                        {historiasSinAsignar.length === 0 ? (
                          <p className="text-xs text-slate-500 italic px-2 py-3 text-center">Todos los requerimientos están asignados a un sprint.</p>
                        ) : (
                          historiasSinAsignar.map(h => (
                            <RequisitoRow key={h.id} h={h} tareas={tareas} sprints={sprintsProyecto} />
                          ))
                        )}

                        {historiasAsignadas.length > 0 && (
                          <div className="bg-[#0e1424]/30">
                            <div className="flex items-center px-4 py-2 border-t border-white/[0.03]">
                              <button
                                onClick={() => setMostrarAsignados(!mostrarAsignados)}
                                className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded bg-surface-800/60 border border-white/5"
                              >
                                {mostrarAsignados ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Asignados a sprint ({historiasAsignadas.length})
                              </button>
                            </div>
                            {mostrarAsignados && (
                              <div>
                                {historiasAsignadas.map(h => (
                                  <RequisitoRow key={h.id} h={h} tareas={tareas} sprints={sprintsProyecto} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tasks progress bar */}
          {tareasTotal > 0 && (
            <div className="bg-surface-800/30 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="font-medium">Progreso de Tareas</span>
                  <span className="font-mono">{tareasDone} / {tareasTotal} completadas</span>
                </div>
                <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${tareasProgress}%`, backgroundColor: tareasProgress === 100 ? '#34d399' : col.accent }}
                  />
                </div>
              </div>
              <span className="text-lg font-bold font-mono shrink-0" style={{ color: tareasProgress === 100 ? '#34d399' : col.accent }}>
                {tareasProgress}%
              </span>
            </div>
          )}

          {/* Gantt toggle */}
          <div>
            <button
              onClick={() => setShowGantt(!showGantt)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded-lg bg-surface-800/50 border border-white/5 hover:border-white/10"
            >
              <BarChart2 size={13} className="text-accent-violet" />
              {showGantt ? 'Ocultar Gantt del proyecto' : 'Ver Gantt del proyecto'}
              {showGantt ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>

            {showGantt && (
              <MiniGantt tareas={tareas} proyectosData={state?.proyectos || []} />
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Main Reports view ───

export default function Reports() {
  const { state } = useTask()

  const proyectosConTipo = state.proyectos.filter(p => p.tipo === 'Proyecto')

  const totalHistorias = (state.historias || []).length
  const completadasGlobal = (state.historias || []).filter(h => h.completada).length
  const vencidasGlobal = (state.historias || []).filter(h =>
    h.fechaLimite && !h.completada && new Date(h.fechaLimite) < new Date()
  ).length
  const progressGlobal = totalHistorias > 0 ? Math.round((completadasGlobal / totalHistorias) * 100) : 0

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto space-y-8 text-slate-100">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <ClipboardList size={18} className="text-accent-violet" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Informes de Proyecto</h1>
          <p className="text-sm text-slate-500 mt-0.5">Requerimientos, estado, plazos, responsables y Gantt por proyecto</p>
        </div>
      </div>

      {/* Global KPIs strictly restored */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-700/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Proyectos</p>
          <p className="text-2xl font-bold font-mono text-slate-100">{proyectosConTipo.length}</p>
        </div>
        <div className="bg-surface-700/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Requerimientos</p>
          <p className="text-2xl font-bold font-mono text-slate-100">{totalHistorias}</p>
        </div>
        <div className="bg-surface-700/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Completados</p>
          <p className="text-2xl font-bold font-mono text-emerald-400">{completadasGlobal}</p>
        </div>
        <div className={`bg-surface-700/30 border rounded-xl p-4 text-center ${vencidasGlobal > 0 ? 'border-rose-500/20' : 'border-white/5'}`}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Vencidos</p>
          <p className={`text-2xl font-bold font-mono ${vencidasGlobal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{vencidasGlobal}</p>
        </div>
      </div>

      {/* Global progress bar */}
      {totalHistorias > 0 && (
        <div className="bg-surface-700/20 border border-white/5 rounded-xl px-5 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">Progreso global de requerimientos</span>
              <span className="font-mono">{progressGlobal}%</span>
            </div>
            <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressGlobal}%`,
                  background: progressGlobal === 100
                    ? '#34d399'
                    : 'linear-gradient(90deg, #7c6cfc, #22d3ee)'
                }}
              />
            </div>
          </div>
          {progressGlobal === 100 && (
            <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
          )}
        </div>
      )}

      {/* Per-project cards */}
      <div className="space-y-4">
        {proyectosConTipo.length === 0 ? (
          <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 text-sm">
            No hay proyectos creados aún. Crea uno desde "Proyectos y Tareas".
          </div>
        ) : (
          proyectosConTipo.map(p => {
            const historias = (state.historias || []).filter(h => h.proyecto === p.nombre)
            const tareas = (state.tareas || []).filter(t => t.proyecto === p.nombre)
            return (
              <ProjectReportCard
                key={p.nombre}
                proyecto={p.nombre}
                historias={historias}
                tareas={tareas}
              />
            )
          })
        )}
      </div>

    </div>
  )
}