import React, { useState, useMemo } from 'react'
import { ClipboardList, ChevronDown, ChevronRight, Check, Circle, Calendar, User, BarChart2, AlertTriangle, CheckCircle2, Clock, Layers, Plus, Trash2, Edit2 } from 'lucide-react'
import { format, parseISO, differenceInDays, addDays, startOfWeek, getISOWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { useApp, getProjectColor, ESTADO_CONFIG, getResponsableColor } from '../context/AppContext'

// ─── Mini-Gantt por proyecto (usa la misma entidad Requisito que Planificación) ───

function MiniGantt({ requisitos }) {
  const [vistaMode, setVistaMode] = useState('mes')
  const [fechaInicioVista, setFechaInicioVista] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)

  const timelineBounds = useMemo(() => {
    const min = fechaInicioVista
    let diasAAnadir = 31
    if (vistaMode === 'semana') diasAAnadir = 7
    else if (vistaMode === 'tres_meses') diasAAnadir = 90
    const max = addDays(min, diasAAnadir)
    const totalDays = Math.max(1, differenceInDays(max, min))
    const markers = []
    for (let i = 0; i <= totalDays; i++) markers.push(addDays(min, i))
    return { minDate: min, maxDate: max, totalDays, markers }
  }, [fechaInicioVista, vistaMode])

  const { minDate, maxDate, totalDays, markers } = timelineBounds
  const getPerc = (dateObj) => Math.min(100, Math.max(0, (differenceInDays(dateObj, minDate) / totalDays) * 100))

  const todayPosition = useMemo(() => {
    const today = new Date()
    if (today >= minDate && today <= addDays(minDate, totalDays)) return getPerc(today)
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate, totalDays])

  const semanas = useMemo(() => {
    const result = []
    const limite = addDays(minDate, totalDays)
    let cursor = startOfWeek(minDate, { weekStartsOn: 1 })
    while (cursor <= limite) {
      const weekStart = cursor
      const weekEndExclusivo = addDays(weekStart, 7)
      const clampedStart = weekStart < minDate ? minDate : weekStart
      const clampedEnd = weekEndExclusivo > limite ? limite : weekEndExclusivo
      result.push({ weekNumber: getISOWeek(weekStart), showBoundary: weekStart > minDate, boundaryPos: getPerc(weekStart), left: getPerc(clampedStart), right: getPerc(clampedEnd) })
      cursor = addDays(cursor, 7)
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate, totalDays])

  const validRequisitos = useMemo(() => requisitos.filter(r => {
    if (!r.fechaInicio || !r.fechaVencimiento) return false
    try {
      const tStart = parseISO(r.fechaInicio)
      let tEnd = parseISO(r.fechaVencimiento)
      if (tEnd <= tStart) tEnd = addDays(tStart, 1)
      return tStart <= maxDate && tEnd >= minDate
    } catch { return false }
  }), [requisitos, minDate, maxDate])

  const requisitosActivos = useMemo(() => [...validRequisitos].filter(r => r.estado !== 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)), [validRequisitos])
  const requisitosCompletados = useMemo(() => [...validRequisitos].filter(r => r.estado === 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)), [validRequisitos])

  const navegarTimeline = (dir) => {
    const delta = vistaMode === 'semana' ? 7 : vistaMode === 'mes' ? 30 : 90
    setFechaInicioVista(prev => addDays(prev, dir * delta))
  }

  const renderFila = (requisito) => {
    const start = parseISO(requisito.fechaInicio)
    let end = requisito.fechaVencimiento ? parseISO(requisito.fechaVencimiento) : addDays(start, 1)
    if (end <= start) end = addDays(start, 1)
    const barLeft = getPerc(start)
    const barRight = getPerc(end)
    const barWidth = Math.max(1.5, barRight - barLeft)
    const cfg = ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']
    const tagColor = getResponsableColor(requisito.responsable)

    return (
      <div key={requisito.id} className="grid grid-cols-[300px_1fr] items-center hover:bg-white/[0.02] transition-colors min-h-[48px] py-1.5 relative z-10 border-b border-white/[0.02]">
        <div className="px-4 pr-3 flex items-center justify-between gap-3 border-r border-white/5 h-full">
          <span className={`text-xs font-medium pr-2 break-words flex-1 leading-relaxed ${requisito.estado === 'Done' ? 'line-through text-slate-500 opacity-60' : 'text-slate-300'}`}>{requisito.titulo}</span>
          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0 uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border}`}>{requisito.estado === 'In Progress' ? 'Progreso' : requisito.estado}</span>
        </div>
        <div className="relative h-full w-full flex items-center px-3">
          <div
            className="absolute h-5 rounded-lg flex items-center px-2 shadow-md border cursor-default overflow-hidden transition-all duration-150"
            style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: `${tagColor.accent}20`, borderColor: `${tagColor.accent}60`, borderWidth: '1px' }}
            title={`${requisito.titulo} [${requisito.responsable || 'Sin asignar'}]`}
          >
            <div className="absolute left-0 top-0 bottom-0 opacity-40" style={{ width: requisito.estado === 'Done' ? '100%' : requisito.estado === 'In Progress' ? '50%' : '0%', backgroundColor: tagColor.accent }} />
            {barWidth > 14 && <span className="text-[9px] font-semibold text-white/95 truncate z-10 font-mono">{requisito.responsable || 'Sin asignar'}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-surface-800/70 border border-white/5 px-2.5 py-1.5 rounded-lg">
          <BarChart2 size={12} className="text-slate-500" />
          <span className="text-[10px] font-medium text-slate-400 mr-1">Vista:</span>
          <select value={vistaMode} onChange={(e) => { setVistaMode(e.target.value); setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 })) }} className="bg-transparent text-[11px] font-semibold text-slate-200 outline-none cursor-pointer">
            <option value="semana" className="bg-surface-700">Semana</option>
            <option value="mes" className="bg-surface-700">Mes</option>
            <option value="tres_meses" className="bg-surface-700">3 Meses</option>
          </select>
        </div>
        <div className="flex items-center gap-1 bg-surface-800/70 border border-white/5 p-1 rounded-lg">
          <button onClick={() => navegarTimeline(-1)} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronRight size={13} className="rotate-180" /></button>
          <button onClick={() => setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-2 py-0.5 text-[10px] font-semibold text-slate-200 bg-white/5 hover:bg-white/10 rounded transition-colors">Hoy</button>
          <button onClick={() => navegarTimeline(1)} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronRight size={13} /></button>
          <span className="text-[10px] font-mono text-slate-400 px-1.5 lowercase">{format(minDate, 'dd MMM', { locale: es }).replace('.', '')} – {format(maxDate, 'dd MMM yy', { locale: es }).replace('.', '')}</span>
        </div>
      </div>

      <div className="border border-white/5 rounded-xl bg-surface-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: `${Math.max(700, 300 + markers.length * 42)}px` }}>
            <div className="absolute inset-0 left-[300px] pointer-events-none flex justify-between z-0">
              {markers.map((_, idx) => <div key={idx} className="w-px h-full border-l border-white/[0.03]" />)}
              {semanas.map((sem, idx) => sem.showBoundary && <div key={`sem-${idx}`} className="absolute top-0 bottom-0 w-px bg-indigo-400/40 z-10" style={{ left: `${sem.boundaryPos}%` }} />)}
              {todayPosition !== null && <div className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500/50 z-20" style={{ left: `${todayPosition}%` }} />}
            </div>

            <div className="grid grid-cols-[300px_1fr] bg-surface-800/80 border-b border-white/5 items-stretch text-[10px] font-medium uppercase tracking-wider text-slate-500 z-10 relative">
              <div className="px-4 border-r border-white/5 flex items-center h-6">Semana del año</div>
              <div className="relative h-6">
                {semanas.map((sem, idx) => (
                  <div key={idx} className="absolute top-0 bottom-0 flex items-center justify-center border-l border-indigo-400/30 first:border-l-0 overflow-hidden" style={{ left: `${sem.left}%`, width: `${sem.right - sem.left}%` }}>
                    <span className="text-[8px] font-bold text-indigo-300 tracking-wider truncate px-1">Sem {sem.weekNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[300px_1fr] bg-surface-800/80 border-b border-white/10 items-center text-[10px] font-medium uppercase tracking-wider text-slate-500 h-9 z-10 relative">
              <div className="px-4 border-r border-white/5 h-full flex items-center">Requisito</div>
              <div className="relative h-full flex justify-between items-center px-3 font-mono text-[9px] text-slate-500">
                {markers.map((date, i) => <span key={i} className="transform -translate-x-1/2 whitespace-nowrap lowercase">{format(date, 'dd MMM', { locale: es }).replace('.', '')}</span>)}
                {todayPosition !== null && <span className="absolute bg-rose-500 text-white text-[8px] font-bold px-1 py-0.5 rounded top-1 transform -translate-x-1/2 z-30" style={{ left: `${todayPosition}%` }}>Hoy</span>}
              </div>
            </div>

            <div className="divide-y divide-white/[0.03]">
              {validRequisitos.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">Sin requisitos con fechas en este período.</div>
              ) : (
                <>
                  {requisitosActivos.map(r => renderFila(r))}
                  {requisitosCompletados.length > 0 && (
                    <div className="bg-[#0e1424]/30">
                      <div className="grid grid-cols-[300px_1fr] items-center min-h-[36px] border-b border-white/[0.03]">
                        <div className="px-4 h-full flex items-center">
                          <button onClick={() => setMostrarCompletadas(!mostrarCompletadas)} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded bg-surface-800/60 border border-white/5">
                            {mostrarCompletadas ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            Completados ({requisitosCompletados.length})
                          </button>
                        </div>
                        <div />
                      </div>
                      {mostrarCompletadas && <div className="divide-y divide-white/[0.02]">{requisitosCompletados.map(r => renderFila(r))}</div>}
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

// ─── Fila de requisito (con drag & drop hacia fases) ───

function RequisitoRow({ r, fases }) {
  const [expanded, setExpanded] = useState(false)
  const faseName = (fases || []).find(f => f.id === r.faseId)?.nombre
  const isOverdue = r.fechaVencimiento && r.estado !== 'Done' && new Date(r.fechaVencimiento) < new Date()

  const handleDragStart = (e) => e.dataTransfer.setData('text/plain', r.id)

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`border-b border-white/[0.04] last:border-0 cursor-grab active:cursor-grabbing hover:bg-white/[0.01] transition-all ${r.estado === 'Done' ? 'opacity-60' : ''}`}
    >
      <div className="grid grid-cols-[1fr_120px_110px_90px] items-center px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2.5 pr-3 min-w-0">
          <div className="shrink-0">
            {r.estado === 'Done' ? <Check size={14} className="text-emerald-400" /> : <Circle size={14} className="text-slate-500" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className={`text-sm font-medium truncate ${r.estado === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{r.titulo}</p>
              {faseName && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30 shrink-0">{faseName}</span>}
            </div>
            {r.descripcion && <p className="text-[10px] text-slate-500 truncate mt-0.5">{r.descripcion}</p>}
          </div>
          {expanded ? <ChevronDown size={13} className="text-slate-500 shrink-0" /> : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
        </div>

        <div>
          {r.estado === 'Done' ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"><Check size={9} /> Completado</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium"><Clock size={9} /> {r.estado === 'In Progress' ? 'En progreso' : 'Pendiente'}</span>
          )}
        </div>

        <div>
          {r.fechaVencimiento ? (
            <span className={`text-xs font-mono flex items-center gap-1 ${isOverdue ? 'text-rose-400' : 'text-slate-400'}`}>
              {isOverdue && <AlertTriangle size={10} />}
              {r.fechaVencimiento}
            </span>
          ) : <span className="text-xs text-slate-600">—</span>}
        </div>

        <div>
          {r.responsable ? (
            <span className="text-xs text-slate-300 flex items-center gap-1"><User size={11} className="text-slate-500" /> {r.responsable}</span>
          ) : <span className="text-xs text-slate-600">—</span>}
        </div>
      </div>

      {expanded && r.descripcion && (
        <div className="px-12 pb-3 animate-fade-in">
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap bg-surface-800/40 rounded-lg p-3 border border-white/5">{r.descripcion}</p>
          {faseName && <p className="text-[10px] mt-1 text-violet-400 font-medium">Asignado a: {faseName}</p>}
        </div>
      )}
    </div>
  )
}

// ─── Bloque de Fase: colapsable, con descripción editable y "ocultar completados" propio ───

function FaseBlock({ fase, requisitos, onDrop, onDragOver, isBacklog = false, onEdit, onDelete, onEditDescripcion }) {
  const [isCollapsed, setIsCollapsed] = useState(isBacklog)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(fase?.nombre || '')
  const [ocultarCompletados, setOcultarCompletados] = useState(false)
  const [descripcion, setDescripcion] = useState(fase?.descripcion || '')

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (editName.trim() && onEdit) {
      onEdit(fase.id, { nombre: editName.trim() })
      setIsEditing(false)
    }
  }

  const handleBlurDescripcion = () => {
    if (onEditDescripcion) onEditDescripcion(fase.id, descripcion)
  }

  const fechaVencimientoFase = useMemo(() => {
    if (!requisitos || requisitos.length === 0) return 'N/A'
    const fechas = requisitos.map(r => r.fechaVencimiento ? new Date(r.fechaVencimiento) : null).filter(f => f && !isNaN(f.getTime()))
    if (fechas.length === 0) return 'Sin definir'
    return format(new Date(Math.max(...fechas.map(d => d.getTime()))), 'dd/MM/yyyy')
  }, [requisitos])

  const completadosCount = requisitos.filter(r => r.estado === 'Done').length
  const requisitosVisibles = ocultarCompletados ? requisitos.filter(r => r.estado !== 'Done') : requisitos

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, isBacklog ? null : fase.id)}
      className={`p-4 rounded-xl border transition-all ${isBacklog ? 'border-dashed border-white/10 bg-slate-950/20' : 'border-white/5 bg-surface-800/40 hover:border-white/10 shadow-md'}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/5 mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-slate-400 hover:text-slate-200 transition-colors bg-white/5 p-0.5 rounded">
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex items-center gap-2">
              <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className="bg-slate-900 text-xs px-2 py-1 rounded outline-none border border-violet-500/50 text-white w-32" />
              <button type="submit" className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-1 rounded hover:bg-emerald-500/30">Guardar</button>
              <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] bg-slate-500/20 text-slate-400 px-1.5 py-1 rounded hover:bg-slate-500/30">Cancelar</button>
            </form>
          ) : (
            <span className={`text-xs font-bold ${isBacklog ? 'text-slate-400' : 'text-slate-200'}`}>
              {isBacklog ? '📦 Requisitos sin asignar (Backlog)' : fase.nombre}
            </span>
          )}

          {!isEditing && (
            <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
              {requisitos.length} {requisitos.length === 1 ? 'req' : 'reqs'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {completadosCount > 0 && (
            <button
              onClick={() => setOcultarCompletados(!ocultarCompletados)}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${ocultarCompletados ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
            >
              {ocultarCompletados ? 'Mostrar completados' : 'Ocultar completados'}
            </button>
          )}

          {!isBacklog && !isEditing && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-violet-400 font-mono">
                <Clock size={11} />
                <span>Vence: {fechaVencimientoFase}</span>
              </div>
              <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                <button onClick={() => setIsEditing(true)} className="p-1 text-slate-500 hover:text-violet-400 hover:bg-white/5 rounded transition-colors" title="Editar fase"><Edit2 size={12} /></button>
                <button onClick={() => onDelete(fase.id)} className="p-1 text-slate-500 hover:text-rose-400 hover:bg-white/5 rounded transition-colors" title="Eliminar fase"><Trash2 size={12} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 animate-fade-in">
          {!isBacklog && (
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              onBlur={handleBlurDescripcion}
              placeholder="¿Qué se entrega en esta fase? (se guarda automáticamente)"
              rows={2}
              className="w-full bg-surface-900/60 text-xs text-slate-300 placeholder-slate-600 border border-white/5 rounded-lg p-2.5 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
            />
          )}

          <div className="space-y-1.5 min-h-[44px] flex flex-col justify-start">
            {requisitosVisibles.length === 0 ? (
              <p className="text-[11px] text-slate-500 italic text-center py-2">
                {requisitos.length > 0 ? 'Todos los requisitos de esta fase están completados.' : (isBacklog ? 'Arrastra requisitos aquí para organizarlos en esta fase' : 'Arrastra requisitos aquí para organizarlos en esta fase')}
              </p>
            ) : (
              requisitosVisibles.map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 bg-surface-900/60 border border-white/[0.03] p-2 rounded-lg flex-wrap">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {r.estado === 'Done' ? <Check size={12} className="text-emerald-400 shrink-0" /> : <Circle size={12} className="text-slate-600 shrink-0" />}
                    <span className={`text-xs truncate ${r.estado === 'Done' ? 'line-through text-slate-500 opacity-60' : 'text-slate-300'}`}>{r.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.estado === 'Done' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium"><Check size={8} /> Completado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium"><Clock size={8} /> {r.estado === 'In Progress' ? 'Progreso' : 'Pendiente'}</span>
                    )}
                    {r.responsable && <span className="text-[9px] text-slate-400 flex items-center gap-1"><User size={9} className="text-slate-500" /> {r.responsable}</span>}
                    {r.fechaVencimiento && <span className="text-[9px] font-mono text-slate-500">{r.fechaVencimiento}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta de informe por proyecto ───

function ProjectReportCard({ proyecto, requisitos }) {
  const [collapsed, setCollapsed] = useState(true)
  const [showGantt, setShowGantt] = useState(false)
  const [showFases, setShowFases] = useState(true)
  const [showRequerimientos, setShowRequerimientos] = useState(false)
  const [mostrarAsignados, setMostrarAsignados] = useState(false)
  const [nuevaFaseNombre, setNuevaFaseNombre] = useState('')
  const [creandoFase, setCreandoFase] = useState(false)
  const [ocultarCompletados, setOcultarCompletados] = useState(false)
  const [sortBy, setSortBy] = useState(null)
  const { state, dispatch } = useApp()
  const col = getProjectColor(proyecto.nombre, state.proyectos)

  const total = requisitos.length
  const completados = requisitos.filter(r => r.estado === 'Done').length
  const progress = total > 0 ? Math.round((completados / total) * 100) : 0

  const vencidos = requisitos.filter(r => r.fechaVencimiento && r.estado !== 'Done' && new Date(r.fechaVencimiento) < new Date()).length

  const fasesProyecto = useMemo(() => (state.fases || []).filter(f => f.proyectoId === proyecto.id), [state.fases, proyecto.id])

  const requisitosProcesados = useMemo(() => {
    let list = [...requisitos]
    if (ocultarCompletados) list = list.filter(r => r.estado !== 'Done')
    if (sortBy === 'estado') {
      list.sort((a, b) => (a.estado === b.estado ? 0 : a.estado === 'Done' ? 1 : -1))
    } else if (sortBy === 'fecha') {
      list.sort((a, b) => {
        if (!a.fechaVencimiento) return 1
        if (!b.fechaVencimiento) return -1
        return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento)
      })
    } else if (sortBy === 'responsable') {
      list.sort((a, b) => (a.responsable || 'Sin asignar').localeCompare(b.responsable || 'Sin asignar'))
    }
    return list
  }, [requisitos, ocultarCompletados, sortBy])

  const activeFaseIds = useMemo(() => new Set(fasesProyecto.map(f => f.id)), [fasesProyecto])
  const requisitosSinAsignar = useMemo(() => requisitosProcesados.filter(r => !r.faseId || !activeFaseIds.has(r.faseId)), [requisitosProcesados, activeFaseIds])
  const requisitosAsignados = useMemo(() => requisitosProcesados.filter(r => r.faseId && activeFaseIds.has(r.faseId)), [requisitosProcesados, activeFaseIds])

  const handleDragOver = (e) => e.preventDefault()
  const handleDropRequisito = (e, targetFaseId) => {
    e.preventDefault()
    const requisitoId = e.dataTransfer.getData('text/plain')
    if (requisitoId) dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisitoId, faseId: targetFaseId } })
  }

  const handleCrearFase = (e) => {
    e.preventDefault()
    if (!nuevaFaseNombre.trim()) return
    dispatch({ type: 'ADD_FASE', payload: { nombre: nuevaFaseNombre.trim(), proyectoId: proyecto.id, descripcion: '' } })
    setNuevaFaseNombre('')
    setCreandoFase(false)
  }

  const handleEditFase = (faseId, cambios) => dispatch({ type: 'UPDATE_FASE', payload: { id: faseId, ...cambios } })
  const handleEditDescripcionFase = (faseId, descripcion) => dispatch({ type: 'UPDATE_FASE', payload: { id: faseId, descripcion } })
  const handleDeleteFase = (faseId) => {
    if (window.confirm('¿Eliminar esta fase? Los requisitos volverán al backlog.')) dispatch({ type: 'DELETE_FASE', payload: faseId })
  }

  return (
    <div className="bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 bg-surface-800/60 border-b border-white/5 flex flex-wrap justify-between items-center gap-3 cursor-pointer select-none" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-slate-400 shrink-0">{collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}</div>
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.accent }} />
          <h2 className="font-display font-bold text-slate-100 text-base truncate">{proyecto.nombre}</h2>
          {vencidos > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle size={9} /> {vencidos} vencido{vencidos !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap" onClick={e => e.stopPropagation()}>
          <button
            onClick={(e) => { e.stopPropagation(); setOcultarCompletados(!ocultarCompletados) }}
            className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${ocultarCompletados ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
          >
            {ocultarCompletados ? 'Mostrar completados' : 'Ocultar completados'}
          </button>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Requisitos</p>
            <p className="text-sm font-bold text-slate-200 font-mono">{completados}/{total}</p>
          </div>
          <div className="w-24">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Progreso</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: progress === 100 ? '#34d399' : col.accent }} />
            </div>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3 animate-fade-in">
          <div className="bg-surface-800/20 p-4 border border-white/5 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 cursor-pointer select-none" onClick={() => setShowFases(!showFases)}>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                {showFases ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <Layers size={14} className="text-violet-400" /> Planificar fases del proyecto (arrastra requisitos abajo)
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowFases(true); setCreandoFase(!creandoFase) }}
                className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded"
              >
                <Plus size={12} /> Crear fase
              </button>
            </div>

            {showFases && (
              <>
                {creandoFase && (
                  <form onSubmit={handleCrearFase} className="flex items-center gap-2 max-w-sm animate-fade-in">
                    <input
                      type="text"
                      placeholder="Ej: Fase 1, MVP..."
                      value={nuevaFaseNombre}
                      onChange={(e) => setNuevaFaseNombre(e.target.value)}
                      className="bg-surface-900 text-xs px-2.5 py-1.5 rounded border border-white/10 outline-none text-slate-200 focus:border-violet-500 flex-1"
                      autoFocus
                    />
                    <button type="submit" className="text-xs font-semibold px-2.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors">Guardar</button>
                  </form>
                )}

                <div className="flex flex-col gap-3">
                  {fasesProyecto.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic text-center py-2">Aún no hay fases creadas para este proyecto.</p>
                  ) : (
                    fasesProyecto.map(fase => {
                      const requisitosDeFase = requisitos.filter(r => r.faseId === fase.id)
                      return (
                        <FaseBlock
                          key={fase.id}
                          fase={fase}
                          requisitos={requisitosDeFase}
                          onDrop={handleDropRequisito}
                          onDragOver={handleDragOver}
                          onEdit={handleEditFase}
                          onEditDescripcion={handleEditDescripcionFase}
                          onDelete={handleDeleteFase}
                        />
                      )
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-surface-800/20 border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors" onClick={() => setShowRequerimientos(!showRequerimientos)}>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                {showRequerimientos ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <ClipboardList size={14} className="text-violet-400" /> Requisitos ({total})
              </span>
            </div>

            {showRequerimientos && (
              <div className="px-4 pb-4 animate-fade-in">
                {requisitos.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-2 py-4 text-center">Sin requisitos para este proyecto.</p>
                ) : (
                  <div className="rounded-xl border border-white/5 overflow-hidden bg-surface-700/20">
                    <div className="grid grid-cols-[1fr_120px_110px_90px] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-surface-800/40 border-b border-white/5 select-none">
                      <div>Requisito</div>
                      <div className={`cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1 ${sortBy === 'estado' ? 'text-accent-violet font-bold' : ''}`} onClick={() => setSortBy(sortBy === 'estado' ? null : 'estado')}>Estado {sortBy === 'estado' && '↕'}</div>
                      <div className={`cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1 ${sortBy === 'fecha' ? 'text-accent-violet font-bold' : ''}`} onClick={() => setSortBy(sortBy === 'fecha' ? null : 'fecha')}><Calendar size={9} /> Vencimiento {sortBy === 'fecha' && '↕'}</div>
                      <div className={`cursor-pointer hover:text-slate-300 transition-colors flex items-center gap-1 ${sortBy === 'responsable' ? 'text-accent-violet font-bold' : ''}`} onClick={() => setSortBy(sortBy === 'responsable' ? null : 'responsable')}><User size={9} /> Responsable {sortBy === 'responsable' && '↕'}</div>
                    </div>
                    {requisitosSinAsignar.length === 0 && requisitosAsignados.length === 0 ? (
                      <p className="text-xs text-slate-500 italic px-2 py-4 text-center">No hay requisitos que coincidan con los filtros.</p>
                    ) : (
                      <>
                        {requisitosSinAsignar.length === 0 ? (
                          <p className="text-xs text-slate-500 italic px-2 py-3 text-center">Todos los requisitos están asignados a una fase.</p>
                        ) : (
                          requisitosSinAsignar.map(r => <RequisitoRow key={r.id} r={r} fases={fasesProyecto} />)
                        )}

                        {requisitosAsignados.length > 0 && (
                          <div className="bg-[#0e1424]/30">
                            <div className="flex items-center px-4 py-2 border-t border-white/[0.03]">
                              <button
                                onClick={() => setMostrarAsignados(!mostrarAsignados)}
                                className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded bg-surface-800/60 border border-white/5"
                              >
                                {mostrarAsignados ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                Asignados a fase ({requisitosAsignados.length})
                              </button>
                            </div>
                            {mostrarAsignados && <div>{requisitosAsignados.map(r => <RequisitoRow key={r.id} r={r} fases={fasesProyecto} />)}</div>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() => setShowGantt(!showGantt)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded-lg bg-surface-800/50 border border-white/5 hover:border-white/10"
            >
              <BarChart2 size={13} className="text-accent-violet" />
              {showGantt ? 'Ocultar Gantt del proyecto' : 'Ver Gantt del proyecto'}
              {showGantt ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {showGantt && <MiniGantt requisitos={requisitos} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Vista principal de Informes ───

export default function Reports() {
  const { state } = useApp()
  const proyectosConTipo = state.proyectos.filter(p => p.tipo === 'Proyecto')

  const totalRequisitos = state.requisitos.length
  const completadosGlobal = state.requisitos.filter(r => r.estado === 'Done').length
  const vencidosGlobal = state.requisitos.filter(r => r.fechaVencimiento && r.estado !== 'Done' && new Date(r.fechaVencimiento) < new Date()).length
  const progressGlobal = totalRequisitos > 0 ? Math.round((completadosGlobal / totalRequisitos) * 100) : 0

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto space-y-8 text-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <ClipboardList size={18} className="text-accent-violet" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Informes de Proyecto</h1>
          <p className="text-sm text-slate-500 mt-0.5">Requisitos, estado, plazos, responsables y Gantt por proyecto</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-700/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Proyectos</p>
          <p className="text-2xl font-bold font-mono text-slate-100">{proyectosConTipo.length}</p>
        </div>
        <div className="bg-surface-700/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Requisitos</p>
          <p className="text-2xl font-bold font-mono text-slate-100">{totalRequisitos}</p>
        </div>
        <div className="bg-surface-700/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Completados</p>
          <p className="text-2xl font-bold font-mono text-emerald-400">{completadosGlobal}</p>
        </div>
        <div className={`bg-surface-700/30 border rounded-xl p-4 text-center ${vencidosGlobal > 0 ? 'border-rose-500/20' : 'border-white/5'}`}>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Vencidos</p>
          <p className={`text-2xl font-bold font-mono ${vencidosGlobal > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{vencidosGlobal}</p>
        </div>
      </div>

      {totalRequisitos > 0 && (
        <div className="bg-surface-700/20 border border-white/5 rounded-xl px-5 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">Progreso global de requisitos</span>
              <span className="font-mono">{progressGlobal}%</span>
            </div>
            <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressGlobal}%`, background: progressGlobal === 100 ? '#34d399' : 'linear-gradient(90deg, #7c6cfc, #22d3ee)' }}
              />
            </div>
          </div>
          {progressGlobal === 100 && <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />}
        </div>
      )}

      <div className="space-y-4">
        {proyectosConTipo.length === 0 ? (
          <div className="py-12 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 text-sm">
            No hay proyectos creados aún. Crea uno desde "Planificación".
          </div>
        ) : (
          proyectosConTipo.map(p => {
            const requisitosDelProyecto = state.requisitos.filter(r => r.proyectoId === p.id)
            return <ProjectReportCard key={p.id} proyecto={p} requisitos={requisitosDelProyecto} />
          })
        )}
      </div>
    </div>
  )
}
