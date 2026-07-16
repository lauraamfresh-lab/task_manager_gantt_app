import React, { useState, useMemo, useRef } from 'react'
import { format, parseISO, differenceInDays, addDays, startOfWeek, startOfDay, getISOWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  LayoutList, BarChart2, Users, Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  ArrowUp, ArrowDown, CheckSquare, Square, FileText, ExternalLink, Sun, Filter,
  Tag, Calendar, ChevronLeft, AlertTriangle
} from 'lucide-react'
import {
  useApp, uid, ESTADO_CONFIG, RESPONSABLES_OPCIONES, getResponsableColor,
  getProjectColor, getProyectoNombre
} from '../context/AppContext'
import RequisitoModal from '../components/RequisitoModal'
import ProjectModal from '../components/ProjectModal'
import EstadoSelect from '../components/EstadoSelect'
import PrioridadBadge from '../components/PrioridadBadge'

const TABS = [
  { id: 'lista', label: 'Lista', icon: LayoutList },
  { id: 'timeline', label: 'Timeline', icon: BarChart2 },
  { id: 'carga', label: 'Carga de trabajo', icon: Users },
]

// ─────────────────────────── Vista: Lista ───────────────────────────

function VencimientoLabel({ fecha }) {
  if (!fecha) return <span className="text-xs text-slate-600 font-mono">Sin fecha</span>
  let label = fecha
  let cls = 'text-slate-400'
  try {
    const d = parseISO(fecha)
    const dias = differenceInDays(d, startOfDay(new Date()))
    label = format(d, 'dd MMM')
    if (dias < 0) cls = 'text-red-400 font-semibold'
    else if (dias <= 3) cls = 'text-amber-400 font-semibold'
  } catch { /* noop */ }
  return <span className={`text-xs font-mono ${cls}`}>{label}</span>
}

function RequisitoRow({ requisito, i, total, onEdit }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [nuevoItemText, setNuevoItemText] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemText, setEditingItemText] = useState('')

  const checklist = requisito.checklist || []
  const notas = requisito.notas || ''
  const itemsCompletados = checklist.filter(it => it.completado).length

  let diasDuracion = '—'
  if (requisito.fechaInicio && requisito.fechaVencimiento) {
    try {
      const diff = differenceInDays(parseISO(requisito.fechaVencimiento), parseISO(requisito.fechaInicio))
      diasDuracion = diff >= 0 ? `${diff}d` : '0d'
    } catch { /* noop */ }
  }

  const updateChecklist = (updated) => dispatch({ type: 'UPDATE_REQUISITO_CHECKLIST', payload: { id: requisito.id, checklist: updated } })
  const toggleItem = (itemId) => updateChecklist(checklist.map(it => it.id === itemId ? { ...it, completado: !it.completado } : it))
  const addItem = (e) => {
    e.preventDefault()
    if (!nuevoItemText.trim()) return
    updateChecklist([...checklist, { id: uid(), texto: nuevoItemText.trim(), completado: false }])
    setNuevoItemText('')
  }
  const deleteItem = (itemId) => updateChecklist(checklist.filter(it => it.id !== itemId))
  const startEdit = (item) => { setEditingItemId(item.id); setEditingItemText(item.texto) }
  const saveEdit = (itemId) => {
    if (!editingItemText.trim()) return
    updateChecklist(checklist.map(it => it.id === itemId ? { ...it, texto: editingItemText.trim() } : it))
    setEditingItemId(null)
  }

  return (
    <>
      <div
        className={`group grid grid-cols-[1fr_100px_130px_100px_80px_70px_90px] items-center px-4 py-3 transition-colors hover:bg-surface-600/30 cursor-pointer ${
          i < total - 1 ? 'border-b border-white/4' : ''
        } ${requisito.estado === 'Done' ? 'opacity-50' : ''} ${expanded ? 'bg-surface-600/20' : 'bg-surface-700/80'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col pr-4 truncate">
          <span className={`text-sm font-medium truncate flex items-center gap-2 ${requisito.estado === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
            {requisito.titulo}
            {requisito.enMiDia && <Sun size={12} className="text-amber-400 fill-amber-400/20 shrink-0" />}
          </span>
          <div className="flex gap-2 mt-1 pl-5 flex-wrap">
            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md font-medium shrink-0">
              👤 {requisito.responsable || 'Sin asignar'}
            </span>
            {checklist.length > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <CheckSquare size={10} /> {itemsCompletados}/{checklist.length}
              </span>
            )}
            {notas.trim().length > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <FileText size={10} /> Notas
              </span>
            )}
            {(requisito.dependencias || []).length > 0 && (
              <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                🔗 {requisito.dependencias.length} dependencia{requisito.dependencias.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <div onClick={e => e.stopPropagation()}><PrioridadBadge prioridad={requisito.prioridad} /></div>
        <div onClick={e => e.stopPropagation()}><EstadoSelect requisito={requisito} /></div>
        <VencimientoLabel fecha={requisito.fechaVencimiento} />
        <span className="text-xs text-slate-500 font-mono">
          {requisito.fechaInicio ? format(parseISO(requisito.fechaInicio), 'dd MMM') : '—'}
        </span>
        <span className="text-xs text-slate-400 font-mono font-medium">{diasDuracion}</span>

        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, enMiDia: !requisito.enMiDia } })}
            className={`p-1.5 rounded-lg transition-all ${requisito.enMiDia ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}
            title={requisito.enMiDia ? 'Quitar de Mi Día' : 'Añadir a Mi Día'}
          >
            <Sun size={13} />
          </button>
          {requisito.linkDocumento && (
            <a href={requisito.linkDocumento} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-slate-500 hover:text-accent-violet hover:bg-accent-violet/10 transition-all">
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={() => onEdit(requisito)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-500 transition-all"><Pencil size={13} /></button>
          <button
            onClick={() => { if (window.confirm('¿Eliminar este requisito?')) dispatch({ type: 'DELETE_REQUISITO', payload: requisito.id }) }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="bg-surface-800/40 border-b border-white/5 px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-6" onClick={e => e.stopPropagation()}>
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <CheckSquare size={13} /> Checklist <span className="text-[10px] font-normal normal-case text-slate-500">(doble clic para editar)</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center justify-between group/item py-0.5">
                  <div className="flex items-center gap-2 text-sm text-slate-300 flex-1">
                    <button onClick={() => toggleItem(item.id)} className="shrink-0">
                      {item.completado ? <CheckSquare size={16} className="text-accent-violet" /> : <Square size={16} className="text-slate-600" />}
                    </button>
                    {editingItemId === item.id ? (
                      <input
                        type="text"
                        value={editingItemText}
                        onChange={e => setEditingItemText(e.target.value)}
                        onBlur={() => saveEdit(item.id)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(item.id)}
                        autoFocus
                        className="bg-surface-600 text-sm text-slate-200 px-1.5 py-0.5 rounded border border-accent-violet/40 focus:outline-none w-full"
                      />
                    ) : (
                      <span onDoubleClick={() => startEdit(item)} className={`cursor-text select-none ${item.completado ? 'line-through text-slate-500' : ''}`}>
                        {item.texto}
                      </span>
                    )}
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 p-1 shrink-0"><Trash2 size={12} /></button>
                </div>
              ))}
              {checklist.length === 0 && <p className="text-xs text-slate-600 italic py-1">No hay elementos en la lista.</p>}
            </div>
            <form onSubmit={addItem} className="flex gap-2 pt-1">
              <input type="text" placeholder="Añadir elemento..." value={nuevoItemText} onChange={e => setNuevoItemText(e.target.value)} className="bg-surface-700 text-xs text-slate-200 border border-white/5 rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:border-accent-violet/50" />
              <button type="submit" className="bg-surface-600 hover:bg-surface-500 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium">Añadir</button>
            </form>
          </div>

          <div className="space-y-4 flex flex-col">
            {requisito.descripcion && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase text-violet-400">📄 Descripción</h4>
                <div className="bg-violet-950/20 border border-violet-500/10 rounded-xl p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {requisito.descripcion}
                </div>
              </div>
            )}
            <div className="space-y-2 flex flex-col flex-1">
              <h4 className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5"><FileText size={13} /> Notas</h4>
              <textarea
                value={notas}
                onChange={e => dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, notas: e.target.value } })}
                placeholder="Escribe comentarios o detalles... (se guarda automáticamente)"
                className="w-full flex-1 min-h-[80px] bg-surface-700/60 text-xs text-slate-300 placeholder-slate-600 border border-white/5 rounded-xl p-3 focus:outline-none focus:border-accent-violet/50 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ProyectoGroupLista({ proyecto, requisitos, index, total, onAdd, onEdit, onEditProject }) {
  const { state, dispatch } = useApp()
  const col = getProjectColor(proyecto.nombre, state.proyectos)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortField, setSortField] = useState('none')
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortAsc) setSortAsc(false)
      else setSortField('none')
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const ordenar = (lista) => {
    if (sortField === 'none') return lista
    return [...lista].sort((a, b) => {
      const valA = a[sortField] || ''
      const valB = b[sortField] || ''
      if (sortField === 'fechaInicio' || sortField === 'fechaVencimiento') {
        if (!valA) return 1
        if (!valB) return -1
        return sortAsc ? parseISO(valA) - parseISO(valB) : parseISO(valB) - parseISO(valA)
      }
      return sortAsc ? String(valA).localeCompare(valB) : String(valB).localeCompare(valA)
    })
  }

  const activos = ordenar(requisitos.filter(r => r.estado !== 'Done'))
  const completados = ordenar(requisitos.filter(r => r.estado === 'Done'))

  const handleDeleteProject = (e) => {
    e.stopPropagation()
    if (window.confirm(`¿Seguro que deseas eliminar el proyecto "${proyecto.nombre}"?\n\n⚠️ Se borrarán permanentemente todos sus requisitos y bugs asociados.`)) {
      dispatch({ type: 'DELETE_PROJECT', payload: proyecto.id })
    }
  }

  const SortHeader = ({ field, label }) => (
    <button onClick={() => handleSort(field)} className={`flex items-center gap-1 hover:text-slate-300 ${sortField === field ? 'text-accent-violet' : ''}`}>
      {label} {sortField === field && (sortAsc ? '↑' : '↓')}
    </button>
  )

  return (
    <div className="mb-6 bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div onClick={() => setIsCollapsed(!isCollapsed)} className="px-5 py-3.5 bg-surface-800/60 border-b border-white/5 flex justify-between items-center cursor-pointer select-none">
        <div className="flex items-center gap-2.5">
          {isCollapsed ? <ChevronRight size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.accent }} />
          <h3 className="font-display font-bold text-slate-200 text-base">{proyecto.nombre}</h3>
          <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
            {activos.length} activos {completados.length > 0 && `· ${completados.length} hechos`}
          </span>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'up' } })} disabled={index === 0} className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" title="Mover arriba"><ArrowUp size={16} /></button>
          <button onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'down' } })} disabled={index === total - 1} className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" title="Mover abajo"><ArrowDown size={16} /></button>
          <button onClick={() => onAdd(proyecto.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-600 transition-colors" title="Añadir requisito"><Plus size={16} strokeWidth={2.5} /></button>
          <button onClick={() => onEditProject(proyecto)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-600 transition-colors" title="Editar proyecto"><Pencil size={16} strokeWidth={2.5} /></button>
          <button onClick={handleDeleteProject} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Eliminar proyecto"><Trash2 size={16} strokeWidth={2.5} /></button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="grid grid-cols-[1fr_100px_130px_100px_80px_70px_90px] px-4 py-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider bg-surface-800/30 border-b border-white/5">
            <span>Título</span>
            <span>Prioridad</span>
            <span>Estado</span>
            <SortHeader field="fechaVencimiento" label="Vence" />
            <SortHeader field="fechaInicio" label="Inicio" />
            <span>Duración</span>
            <span className="text-right pr-2">Acciones</span>
          </div>

          {activos.length === 0 && completados.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No hay requisitos en este proyecto todavía.</div>
          ) : (
            <div>
              {activos.map((r, i) => <RequisitoRow key={r.id} requisito={r} i={i} total={activos.length} onEdit={onEdit} />)}
            </div>
          )}

          {completados.length > 0 && (
            <div className="bg-[#0e1424]/40">
              <button onClick={() => setShowCompleted(!showCompleted)} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 py-2.5 px-5 w-full text-left">
                {showCompleted ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                Mostrar completados ({completados.length})
              </button>
              {showCompleted && completados.map((r, i) => <RequisitoRow key={r.id} requisito={r} i={i} total={completados.length} onEdit={onEdit} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function VistaLista() {
  const { state } = useApp()
  const [modal, setModal] = useState(null)
  const [projectModal, setProjectModal] = useState(false)
  const [editProjectObj, setEditProjectObj] = useState(null)

  const requisitosPorProyecto = (proyectoId) => state.requisitos.filter(r => r.proyectoId === proyectoId)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setProjectModal(true)} className="flex items-center gap-1.5 text-xs font-semibold bg-accent-violet/15 text-accent-violet border border-accent-violet/30 px-3 py-2 rounded-xl hover:bg-accent-violet/25 transition-colors">
          <Plus size={14} /> Nuevo proyecto
        </button>
      </div>

      {state.proyectos.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 border border-dashed border-white/10 rounded-2xl">
          Todavía no hay proyectos. Crea el primero para empezar.
        </div>
      ) : (
        state.proyectos.map((p, index) => (
          <ProyectoGroupLista
            key={p.id}
            proyecto={p}
            requisitos={requisitosPorProyecto(p.id)}
            index={index}
            total={state.proyectos.length}
            onAdd={(proyectoId) => setModal({ proyectoId })}
            onEdit={(requisito) => setModal({ requisito })}
            onEditProject={(proyecto) => { setEditProjectObj(proyecto); setProjectModal(true) }}
          />
        ))
      )}

      {modal && (
        <RequisitoModal editRequisito={modal.requisito} initialProyectoId={modal.proyectoId} onClose={() => setModal(null)} />
      )}

      {projectModal && (
        <ProjectModal editProject={editProjectObj} onClose={() => { setProjectModal(false); setEditProjectObj(null) }} />
      )}
    </div>
  )
}

// ─────────────────────────── Vista: Timeline ───────────────────────────

function ResponsableSelect({ requisito }) {
  const { dispatch } = useApp()
  const tagColor = getResponsableColor(requisito.responsable)
  return (
    <select
      value={requisito.responsable || ''}
      onChange={(e) => dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, responsable: e.target.value } })}
      onClick={(e) => e.stopPropagation()}
      title="Cambiar responsable"
      className="text-[10px] font-semibold rounded-full pl-2 pr-1 py-1 border cursor-pointer focus:outline-none transition-all bg-transparent shrink-0"
      style={{ color: tagColor.accent, borderColor: `${tagColor.accent}60` }}
    >
      <option value="" className="bg-surface-700 text-slate-200">Sin asignar</option>
      {RESPONSABLES_OPCIONES.map((opt) => (
        <option key={opt} value={opt} className="bg-surface-700 text-slate-200">{opt}</option>
      ))}
    </select>
  )
}

function VistaTimeline() {
  const { state, dispatch } = useApp()
  const requisitosData = useMemo(() => state?.requisitos || [], [state?.requisitos])
  const proyectosData = useMemo(() => state?.proyectos || [], [state?.proyectos])

  const [proyectoFiltrado, setProyectoFiltrado] = useState('Todos')
  const [responsableFiltrado, setResponsableFiltrado] = useState('Todos')
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)
  const [mostrarBacklog, setMostrarBacklog] = useState(true)
  const [modalBacklog, setModalBacklog] = useState(null)

  const [vistaMode, setVistaMode] = useState('mes')
  const [fechaInicioVista, setFechaInicioVista] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

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

  const pasaFiltros = (r) => {
    const pasaProyecto = proyectoFiltrado === 'Todos' || r.proyectoId === proyectoFiltrado
    const pasaResponsable = responsableFiltrado === 'Todos' || r.responsable === responsableFiltrado
    return pasaProyecto && pasaResponsable
  }

  const validRequisitos = useMemo(() => {
    return requisitosData.filter(r => {
      if (!r.fechaInicio || !r.fechaVencimiento) return false
      if (!pasaFiltros(r)) return false
      try {
        const tStart = parseISO(r.fechaInicio)
        let tEnd = parseISO(r.fechaVencimiento)
        if (tEnd <= tStart) tEnd = addDays(tStart, 1)
        return tStart <= maxDate && tEnd >= minDate
      } catch { return false }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requisitosData, proyectoFiltrado, responsableFiltrado, minDate, maxDate])

  const backlogRequisitos = useMemo(() => {
    return requisitosData.filter(r => r.estado !== 'Done' && (!r.fechaInicio || !r.fechaVencimiento) && pasaFiltros(r))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requisitosData, proyectoFiltrado, responsableFiltrado])

  const navegarTimeline = (direccion) => {
    const delta = vistaMode === 'semana' ? 7 : vistaMode === 'mes' ? 30 : 90
    setFechaInicioVista(prev => addDays(prev, direccion * delta))
  }

  const getPercentagePosition = (dateObj) => {
    const diff = differenceInDays(dateObj, minDate)
    return Math.min(100, Math.max(0, (diff / totalDays) * 100))
  }

  const todayPosition = useMemo(() => {
    const today = new Date()
    const maxDateWithDays = addDays(minDate, totalDays)
    if (today >= minDate && today <= maxDateWithDays) return getPercentagePosition(today)
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
      result.push({
        weekNumber: getISOWeek(weekStart),
        showBoundary: weekStart > minDate,
        boundaryPos: getPercentagePosition(weekStart),
        left: getPercentagePosition(clampedStart),
        right: getPercentagePosition(clampedEnd)
      })
      cursor = addDays(cursor, 7)
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate, totalDays])

  const requisitosActivos = useMemo(() => [...validRequisitos].filter(r => r.estado !== 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)), [validRequisitos])
  const requisitosCompletados = useMemo(() => [...validRequisitos].filter(r => r.estado === 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)), [validRequisitos])

  const timelineRef = useRef(null)

  const handleDragStartBarra = (e, requisito) => {
    const rect = timelineRef.current.getBoundingClientRect()
    const grabXPercent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const grabDate = addDays(minDate, Math.round(grabXPercent * totalDays))
    const grabOffsetDays = differenceInDays(grabDate, parseISO(requisito.fechaInicio))
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: requisito.id, grabOffsetDays }))
  }

  const handleDragOverGantt = (e) => e.preventDefault()

  const handleDropGantt = (e) => {
    e.preventDefault()
    let payload
    try { payload = JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return }
    if (!payload || !payload.id) return

    const requisito = requisitosData.find(r => r.id === payload.id)
    if (!requisito || !requisito.fechaInicio) return

    const rect = timelineRef.current.getBoundingClientRect()
    const dropXPercent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const dropDate = addDays(minDate, Math.round(dropXPercent * totalDays))
    const newStart = addDays(dropDate, -payload.grabOffsetDays)

    const originalStart = parseISO(requisito.fechaInicio)
    const originalEnd = requisito.fechaVencimiento ? parseISO(requisito.fechaVencimiento) : addDays(originalStart, 1)
    const duracionDias = differenceInDays(originalEnd, originalStart)
    const newEnd = addDays(newStart, duracionDias)

    dispatch({
      type: 'UPDATE_REQUISITO',
      payload: {
        id: requisito.id,
        fechaInicio: format(newStart, 'yyyy-MM-dd'),
        fechaVencimiento: format(newEnd, 'yyyy-MM-dd')
      }
    })
  }

  const renderFilaGantt = (requisito) => {
    const start = parseISO(requisito.fechaInicio)
    let end = requisito.fechaVencimiento ? parseISO(requisito.fechaVencimiento) : addDays(start, 1)
    if (end <= start) end = addDays(start, 1)

    const barLeft = getPercentagePosition(start)
    const barRight = getPercentagePosition(end)
    const barWidth = Math.max(1.5, barRight - barLeft)

    const cfg = ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']
    const tagColor = getResponsableColor(requisito.responsable)
    const proyectoNombre = getProyectoNombre(state, requisito.proyectoId)
    const projColor = getProjectColor(proyectoNombre, proyectosData)

    return (
      <div key={requisito.id} className="grid grid-cols-[480px_1fr] items-center hover:bg-white/[0.02] transition-colors min-h-[56px] py-2 relative z-10 border-b border-white/[0.02]">
        <div className="px-5 pr-4 flex items-center justify-between gap-3 border-r border-white/5 h-full">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase text-center w-24 shrink-0 truncate tracking-wider ${projColor?.bg || 'bg-slate-500/10'} ${projColor?.border || 'border-slate-500/30'} ${projColor?.text || 'text-slate-400'}`} title={proyectoNombre}>
              {proyectoNombre}
            </span>
            <PrioridadBadge prioridad={requisito.prioridad} size={10} />
            <span className={`text-sm font-medium pr-2 break-words flex-1 leading-relaxed ${requisito.estado === 'Done' ? 'line-through text-slate-500 opacity-60' : 'text-slate-300'}`}>
              {requisito.titulo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <ResponsableSelect requisito={requisito} />
            <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0 uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {requisito.estado === 'In Progress' ? 'Progreso' : requisito.estado}
            </span>
          </div>
        </div>

        <div className="relative h-full w-full flex items-center px-4">
          <div
            draggable
            onDragStart={(e) => handleDragStartBarra(e, requisito)}
            className="absolute h-6 rounded-lg flex items-center px-2 shadow-md border cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-150"
            style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: `${tagColor.accent}20`, borderColor: `${tagColor.accent}60`, borderWidth: '1px' }}
            title={`${requisito.titulo} · Arrastra para reprogramar`}
          >
            <div className="absolute left-0 top-0 bottom-0 opacity-40" style={{ width: requisito.estado === 'Done' ? '100%' : requisito.estado === 'In Progress' ? '50%' : '0%', backgroundColor: tagColor.accent }} />
            {barWidth > 12 && (
              <span className="text-[10px] font-semibold text-white/95 truncate z-10 font-mono">{requisito.responsable || 'Sin asignar'}</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-1.5 rounded-xl">
          <Calendar size={13} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400 mr-1">Vista:</span>
          <select value={vistaMode} onChange={(e) => { setVistaMode(e.target.value); setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 })) }} className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer">
            <option value="semana" className="bg-surface-700">Semana</option>
            <option value="mes" className="bg-surface-700">Mes</option>
            <option value="tres_meses" className="bg-surface-700">3 Meses</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-1.5 rounded-xl">
          <Filter size={13} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400 mr-1">Proyecto:</span>
          <select value={proyectoFiltrado} onChange={(e) => setProyectoFiltrado(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer">
            <option value="Todos" className="bg-surface-700">Todos</option>
            {proyectosData.map(p => <option key={p.id} value={p.id} className="bg-surface-700">{p.nombre}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-1.5 rounded-xl">
          <Tag size={13} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400 mr-1">Responsable:</span>
          <select value={responsableFiltrado} onChange={(e) => setResponsableFiltrado(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer">
            <option value="Todos" className="bg-surface-700">Todos</option>
            {RESPONSABLES_OPCIONES.map(tag => <option key={tag} value={tag} className="bg-surface-700">{tag}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-800/90 border border-white/5 p-1 rounded-xl ml-auto">
          <button type="button" onClick={() => navegarTimeline(-1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronLeft size={14} strokeWidth={2.5} /></button>
          <button type="button" onClick={() => setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-2.5 py-1 text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 rounded-md transition-colors">Hoy</button>
          <button type="button" onClick={() => navegarTimeline(1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronRight size={14} strokeWidth={2.5} /></button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-300 pr-2.5 pl-1">
            <Calendar size={13} className="text-violet-400" />
            <span className="lowercase">{format(minDate, 'dd MMM', { locale: es }).replace('.', '')} – {format(maxDate, 'dd MMM yyyy', { locale: es }).replace('.', '')}</span>
          </div>
        </div>
      </div>

      {backlogRequisitos.length > 0 && (
        <div className="mb-4 border border-amber-500/20 bg-amber-500/[0.04] rounded-2xl overflow-hidden">
          <button onClick={() => setMostrarBacklog(!mostrarBacklog)} className="w-full flex items-center justify-between px-4 py-3 text-left">
            <span className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
              <AlertTriangle size={14} /> Backlog · sin fecha ({backlogRequisitos.length})
            </span>
            {mostrarBacklog ? <ChevronDown size={14} className="text-amber-400" /> : <ChevronRight size={14} className="text-amber-400" />}
          </button>
          {mostrarBacklog && (
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {backlogRequisitos.map(r => (
                <button key={r.id} onClick={() => setModalBacklog(r)} className="text-xs bg-surface-800 border border-white/10 hover:border-amber-500/40 text-slate-300 px-3 py-2 rounded-xl flex items-center gap-2 transition-colors">
                  <span className="font-medium">{r.titulo}</span>
                  <span className="text-slate-500">· {getProyectoNombre(state, r.proyectoId)}</span>
                  {!r.responsable && <span className="text-rose-400">· sin asignar</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-slate-500 mb-3">
        💡 Arrastra las barras para reprogramar fechas, o cambia el responsable desde el desplegable. Los requisitos del backlog (arriba) no tienen fecha todavía — haz clic en uno para asignársela.
      </p>

      <div className="border border-white/5 rounded-2xl bg-surface-700/30 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: `${Math.max(1100, 480 + markers.length * 52)}px` }} onDragOver={handleDragOverGantt} onDrop={handleDropGantt}>
            <div ref={timelineRef} className="absolute inset-0 left-[480px] pointer-events-none flex justify-between z-0">
              {markers.map((_, idx) => <div key={idx} className="w-px h-full border-l border-white/[0.03]" />)}
              {semanas.map((sem, idx) => sem.showBoundary && (
                <div key={`sem-${idx}`} className="absolute top-0 bottom-0 w-px bg-indigo-400/40 z-10" style={{ left: `${sem.boundaryPos}%` }} />
              ))}
              {todayPosition !== null && (
                <div className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500/50 z-20" style={{ left: `${todayPosition}%` }} />
              )}
            </div>

            <div className="grid grid-cols-[480px_1fr] bg-surface-800/90 border-b border-white/5 items-stretch text-xs font-medium uppercase tracking-wider text-slate-500 z-10 relative">
              <div className="px-5 border-r border-white/5 flex items-center h-7 text-[10px]">Semana del año</div>
              <div className="relative h-7">
                {semanas.map((sem, idx) => (
                  <div key={idx} className="absolute top-0 bottom-0 flex items-center justify-center border-l border-indigo-400/30 first:border-l-0 overflow-hidden" style={{ left: `${sem.left}%`, width: `${sem.right - sem.left}%` }}>
                    <span className="text-[9px] font-bold text-indigo-300 tracking-wider truncate px-1">Sem {sem.weekNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[480px_1fr] bg-surface-800/90 border-b border-white/10 items-center text-xs font-medium uppercase tracking-wider text-slate-500 h-12 z-10 relative">
              <div className="px-5 border-r border-white/5 h-full flex items-center">Requisitos planificados</div>
              <div className="relative h-full flex justify-between items-center px-4 font-mono text-[10px] text-slate-400">
                {markers.map((date, i) => (
                  <span key={i} className="transform -translate-x-1/2 whitespace-nowrap lowercase">{format(date, 'dd MMM', { locale: es }).replace('.', '')}</span>
                ))}
                {todayPosition !== null && (
                  <span className="absolute bg-rose-500 text-white font-sans text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md top-1 transform -translate-x-1/2 z-30" style={{ left: `${todayPosition}%` }}>Hoy</span>
                )}
              </div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {validRequisitos.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">No se encontraron requisitos planificados en el rango de fechas actual.</div>
              ) : (
                <>
                  {requisitosActivos.map(renderFilaGantt)}
                  {requisitosCompletados.length > 0 && (
                    <div className="bg-[#0e1424]/40">
                      <div className="grid grid-cols-[480px_1fr] items-center min-h-[44px] border-b border-white/[0.04]">
                        <div className="px-5 h-full flex items-center">
                          <button type="button" onClick={() => setMostrarCompletadas(!mostrarCompletadas)} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 py-1.5 px-2.5 rounded-lg bg-surface-800/60 border border-white/5">
                            {mostrarCompletadas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span>Mostrar completados ({requisitosCompletados.length})</span>
                          </button>
                        </div>
                        <div className="h-full w-full" />
                      </div>
                      {mostrarCompletadas && <div className="divide-y divide-white/[0.02]">{requisitosCompletados.map(renderFilaGantt)}</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalBacklog && (
        <RequisitoModal editRequisito={modalBacklog} onClose={() => setModalBacklog(null)} />
      )}
    </div>
  )
}

// ─────────────────────────── Vista: Carga de trabajo ───────────────────────────

function VistaCarga() {
  const { state } = useApp()

  const porResponsable = useMemo(() => {
    const map = {}
    for (const nombre of RESPONSABLES_OPCIONES) map[nombre] = { count: 0, dias: 0 }
    map['Sin asignar'] = { count: 0, dias: 0 }

    state.requisitos.filter(r => r.estado !== 'Done').forEach(r => {
      const key = r.responsable || 'Sin asignar'
      if (!map[key]) map[key] = { count: 0, dias: 0 }
      map[key].count += 1
      if (r.fechaInicio && r.fechaVencimiento) {
        try {
          const dias = differenceInDays(parseISO(r.fechaVencimiento), parseISO(r.fechaInicio))
          if (dias > 0) map[key].dias += dias
        } catch { /* noop */ }
      }
    })
    return map
  }, [state.requisitos])

  const maxCount = Math.max(1, ...Object.values(porResponsable).map(v => v.count))

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-xs text-slate-500 mb-2">Requisitos activos (sin contar los ya completados) por responsable, y días de trabajo planificados.</p>
      {Object.entries(porResponsable).map(([nombre, { count, dias }]) => {
        const color = getResponsableColor(nombre === 'Sin asignar' ? '' : nombre)
        return (
          <div key={nombre} className="bg-surface-700/30 border border-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.accent }} />
                {nombre}
              </span>
              <span className="text-xs text-slate-500 font-mono">{count} requisito{count !== 1 ? 's' : ''} · {dias}d planificados</span>
            </div>
            <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color.accent }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────── Pantalla principal ───────────────────────────

export default function Planificacion() {
  const [tab, setTab] = useState('lista')
  const { state } = useApp()

  const stats = useMemo(() => {
    const activos = state.requisitos.filter(r => r.estado !== 'Done')
    return {
      planificados: activos.filter(r => r.fechaInicio && r.fechaVencimiento).length,
      sinFecha: activos.filter(r => !r.fechaInicio || !r.fechaVencimiento).length,
      sinAsignar: activos.filter(r => !r.responsable).length,
    }
  }, [state.requisitos])

  return (
    <div className="p-8 animate-fade-in bg-[#0b0f19] min-h-screen text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <LayoutList size={18} className="text-accent-violet" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">Planificación</h1>
            <p className="text-sm text-slate-500 mt-0.5">Proyectos, fechas, asignaciones y carga de trabajo en un solo sitio</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {stats.planificados} planificados</span>
          <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-amber-400" /> {stats.sinFecha} sin fecha</span>
          <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2 h-2 rounded-full bg-rose-400" /> {stats.sinAsignar} sin asignar</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-surface-800/90 border border-white/5 p-1 rounded-xl w-fit mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === id ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'lista' && <VistaLista />}
      {tab === 'timeline' && <VistaTimeline />}
      {tab === 'carga' && <VistaCarga />}
    </div>
  )
}
