import React, { useState, useMemo, useRef } from 'react'
import { format, parseISO, isPast, isToday, differenceInDays, addDays, startOfWeek, getISOWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Plus, ExternalLink, Trash2, Pencil, ChevronDown, ChevronRight, CheckSquare, Square, FileText,
  Sun, ArrowUp, ArrowDown, Calendar, User, Check, Circle, ListChecks, BarChart2, Users,
  Filter, Tag, ChevronLeft, GitBranch, X
} from 'lucide-react'
import { useApp, ESTADOS, ESTADO_CONFIG, getEtiquetaColor, getProjectColor, ETIQUETAS_OPCIONES } from '../context/AppContext'
import EstadoSelect from '../components/EstadoSelect'
import PrioridadBadge from '../components/PrioridadBadge'
import RequisitoModal from '../components/RequisitoModal'
import ProjectModal from '../components/ProjectModal'
import MiniGantt from '../components/MiniGantt'

// ─────────────────────────────────────────────────────────────
// Sub-vista 1: LISTA (antes "Proyectos, Tareas y Reqs")
// ─────────────────────────────────────────────────────────────

function VencimientoLabel({ fecha }) {
  if (!fecha) return null
  try {
    const d = parseISO(fecha)
    const overdue = isPast(d) && !isToday(d)
    const todayFlag = isToday(d)
    return (
      <span className={`text-xs font-mono font-medium ${overdue ? 'text-rose-400' : todayFlag ? 'text-accent-cyan' : 'text-slate-400'}`}>
        {format(d, 'dd MMM')}
      </span>
    )
  } catch {
    return null
  }
}

function RequisitoRow({ requisito, i, listLength, onEdit, requisitosDelProyecto }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [nuevoItemText, setNuevoItemText] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemText, setEditingItemText] = useState('')

  const checklist = requisito.checklist || []
  const notas = requisito.notas || ''
  const itemsCompletados = checklist.filter(item => item.completado).length

  const dependenciasResueltas = (requisito.dependencias || [])
    .map(id => requisitosDelProyecto.find(r => r.id === id))
    .filter(Boolean)

  let diasDuracion = '—'
  if (requisito.fechaInicio && requisito.fechaVencimiento) {
    try {
      const diff = differenceInDays(parseISO(requisito.fechaVencimiento), parseISO(requisito.fechaInicio))
      diasDuracion = diff >= 0 ? `${diff}d` : '0d'
    } catch {}
  }

  const toggleChecklistItem = (itemId) => {
    const updatedChecklist = checklist.map(item => item.id === itemId ? { ...item, completado: !item.completado } : item)
    dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, checklist: updatedChecklist } })
  }

  const handleAddChecklist = (e) => {
    e.preventDefault()
    if (!nuevoItemText.trim()) return
    const newItem = { id: Date.now().toString(), texto: nuevoItemText.trim(), completado: false }
    dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, checklist: [...checklist, newItem] } })
    setNuevoItemText('')
  }

  const handleBorrarChecklist = (itemId) => {
    dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, checklist: checklist.filter(item => item.id !== itemId) } })
  }

  const startEditingItem = (item) => { setEditingItemId(item.id); setEditingItemText(item.texto) }
  const saveEditingItem = (itemId) => {
    if (!editingItemText.trim()) return
    dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, checklist: checklist.map(item => item.id === itemId ? { ...item, texto: editingItemText.trim() } : item) } })
    setEditingItemId(null)
  }

  return (
    <>
      <div
        className={`group grid grid-cols-[1fr_110px_130px_100px_80px_60px] items-center px-4 py-3 transition-colors hover:bg-surface-600/30 cursor-pointer ${
          i < listLength - 1 ? 'border-b border-white/4' : ''
        } ${requisito.estado === 'Done' ? 'opacity-50' : ''} ${expanded ? 'bg-surface-600/20' : 'bg-surface-700/80'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col pr-4 truncate">
          <span className={`text-sm font-medium truncate flex items-center gap-2 ${requisito.estado === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
            {requisito.titulo}
            {requisito.enMiDia && <Sun size={12} className="text-amber-400 fill-amber-400/20 shrink-0" />}
            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md font-medium shrink-0 normal-case no-underline">
              {requisito.responsable ? `👤 ${requisito.responsable}` : '👤 Sin asignar'}
            </span>
          </span>
          <div className="flex gap-2 mt-1 pl-5">
            {checklist.length > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <CheckSquare size={10} /> {itemsCompletados}/{checklist.length}
              </span>
            )}
            {notas.trim().length > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded"><FileText size={10} /> Notas</span>
            )}
            {requisito.descripcion?.trim().length > 0 && (
              <span className="text-[10px] text-violet-400 flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded font-medium">📄 Descripción</span>
            )}
            {dependenciasResueltas.length > 0 && (
              <span className="text-[10px] text-cyan-400 flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded font-medium">
                <GitBranch size={9} /> {dependenciasResueltas.length}
              </span>
            )}
          </div>
        </div>

        <div onClick={e => e.stopPropagation()}><PrioridadBadge requisito={requisito} /></div>
        <div onClick={e => e.stopPropagation()}><EstadoSelect requisito={requisito} /></div>
        <VencimientoLabel fecha={requisito.fechaVencimiento} />
        <span className="text-xs text-slate-400 font-mono font-medium">{diasDuracion}</span>

        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_EN_MI_DIA', payload: requisito.id })}
            className={`p-1.5 rounded-lg transition-all ${requisito.enMiDia ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}
            title={requisito.enMiDia ? "Quitar de Mi Día" : "Añadir a Mi Día"}
          >
            <Sun size={13} />
          </button>
          {requisito.linkDocumento && (
            <a href={requisito.linkDocumento} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg text-slate-500 hover:text-accent-violet hover:bg-accent-violet/10 transition-all">
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={() => onEdit(requisito)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-500 transition-all"><Pencil size={13} /></button>
          <button onClick={() => dispatch({ type: 'DELETE_REQUISITO', payload: requisito.id })} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={13} /></button>
        </div>
      </div>

      {expanded && (
        <div className="bg-surface-800/40 border-b border-white/5 px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-6" onClick={e => e.stopPropagation()}>
          <div className="space-y-4 flex flex-col">
            {requisito.descripcion?.trim() && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase text-violet-400 flex items-center gap-1.5">📄 Descripción</h4>
                <div className="bg-violet-950/20 border border-violet-500/10 rounded-xl p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {requisito.descripcion}
                </div>
              </div>
            )}
            {dependenciasResueltas.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase text-cyan-400 flex items-center gap-1.5"><GitBranch size={12} /> Depende de</h4>
                <div className="space-y-1">
                  {dependenciasResueltas.map(dep => (
                    <div key={dep.id} className="flex items-center gap-2 text-xs bg-surface-700/50 rounded-lg px-2.5 py-1.5">
                      {dep.estado === 'Done' ? <Check size={12} className="text-emerald-400" /> : <Circle size={12} className="text-slate-500" />}
                      <span className={dep.estado === 'Done' ? 'text-slate-500 line-through' : 'text-slate-300'}>{dep.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2 flex flex-col flex-1">
              <h4 className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5"><FileText size={13} /> Notas</h4>
              <textarea
                value={notas}
                onChange={e => dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, notas: e.target.value } })}
                placeholder="Escribe comentarios o detalles... (Se guarda automáticamente)"
                className="w-full flex-1 min-h-[80px] bg-surface-700/60 text-xs text-slate-300 placeholder-slate-600 border border-white/5 rounded-xl p-3 focus:outline-none focus:border-accent-violet/50 resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <CheckSquare size={13} /> Checklist <span className="text-[10px] font-normal normal-case text-slate-500">(Doble clic texto para editar)</span>
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center justify-between group/item py-0.5">
                  <div className="flex items-center gap-2 text-sm text-slate-300 flex-1">
                    <button onClick={() => toggleChecklistItem(item.id)} className="shrink-0">
                      {item.completado ? <CheckSquare size={16} className="text-accent-violet" /> : <Square size={16} className="text-slate-600" />}
                    </button>
                    {editingItemId === item.id ? (
                      <input
                        type="text"
                        value={editingItemText}
                        onChange={e => setEditingItemText(e.target.value)}
                        onBlur={() => saveEditingItem(item.id)}
                        onKeyDown={e => e.key === 'Enter' && saveEditingItem(item.id)}
                        autoFocus
                        className="bg-surface-600 text-sm text-slate-200 px-1.5 py-0.5 rounded border border-accent-violet/40 focus:outline-none w-full"
                      />
                    ) : (
                      <span onDoubleClick={() => startEditingItem(item)} className={`cursor-text select-none ${item.completado ? 'line-through text-slate-500' : ''}`}>
                        {item.texto}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleBorrarChecklist(item.id)} className="text-slate-600 hover:text-rose-400 opacity-0 group-hover/item:opacity-100 p-1 shrink-0"><Trash2 size={12} /></button>
                </div>
              ))}
              {checklist.length === 0 && <p className="text-xs text-slate-600 italic py-1">No hay elementos en la lista.</p>}
            </div>
            <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
              <input type="text" placeholder="Añadir elemento..." value={nuevoItemText} onChange={e => setNuevoItemText(e.target.value)} className="bg-surface-700 text-xs text-slate-200 border border-white/5 rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:border-accent-violet/50" />
              <button type="submit" className="bg-surface-600 hover:bg-surface-500 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium">Añadir</button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function ProyectoGroup({ proyecto, requisitos, index, totalProyectos, onAdd, onEdit, onEditProject, todosLosRequisitos }) {
  const { dispatch, state } = useApp()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortField, setSortField] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)

  const col = getProjectColor(proyecto, state.proyectos)
  const proyectoObj = state.proyectos.find(p => p.nombre === proyecto)
  const tipoProyecto = proyectoObj?.tipo

  let sorted = [...requisitos]
  if (sortField) {
    sorted.sort((a, b) => {
      const va = a[sortField] || ''
      const vb = b[sortField] || ''
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }

  const activas = sorted.filter(r => r.estado !== 'Done')
  const completadas = sorted.filter(r => r.estado === 'Done')

  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  const handleDeleteProject = () => {
    if (window.confirm(`¿Eliminar el proyecto "${proyecto}" y todos sus requisitos?`)) {
      dispatch({ type: 'DELETE_PROJECT', payload: proyecto })
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-700/40 overflow-hidden shadow-lg">
      <div
        className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-slate-500">{isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}</div>
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.accent }} />
          <h3 className="font-display font-bold text-slate-200 text-base truncate">{proyecto}</h3>
          <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md shrink-0">
            {activas.length} activos {completadas.length > 0 && `· ${completadas.length} hechos`}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'up' } })} disabled={index === 0} className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" title="Mover arriba"><ArrowUp size={16} /></button>
          <button onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'down' } })} disabled={index === totalProyectos - 1} className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" title="Mover abajo"><ArrowDown size={16} /></button>
          <button onClick={() => onAdd(proyecto)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-600 transition-colors" title="Añadir requisito"><Plus size={16} strokeWidth={2.5} /></button>
          <button onClick={() => onEditProject(proyecto)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-600 transition-colors" title="Editar proyecto"><Pencil size={16} strokeWidth={2.5} /></button>
          <button onClick={handleDeleteProject} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Eliminar proyecto"><Trash2 size={16} strokeWidth={2.5} /></button>
        </div>
      </div>

      {!isCollapsed && (
        requisitos.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 italic">No hay requisitos en este proyecto. ¡Crea uno nuevo!</div>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_110px_130px_100px_80px_60px] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-surface-800/20 border-b border-white/4 select-none">
              <div className="cursor-pointer hover:text-slate-300 flex items-center gap-1" onClick={() => handleSort('titulo')}>Requisito {sortField === 'titulo' ? (sortAsc ? '▲' : '▼') : ''}</div>
              <div>Prioridad</div>
              <div>Estado</div>
              <div className="cursor-pointer hover:text-slate-300 flex items-center gap-1" onClick={() => handleSort('fechaVencimiento')}>Vencim. {sortField === 'fechaVencimiento' ? (sortAsc ? '▲' : '▼') : ''}</div>
              <div>Duración</div>
              <div className="text-end">Acción</div>
            </div>

            <div>
              {activas.map((r, index) => (
                <RequisitoRow key={r.id} requisito={r} i={index} listLength={activas.length} onEdit={onEdit} requisitosDelProyecto={todosLosRequisitos} />
              ))}
              {activas.length === 0 && completadas.length > 0 && (
                <div className="p-4 text-center text-xs text-slate-500 italic">¡Todos los requisitos de este proyecto están completados! 🎉</div>
              )}
            </div>

            {completadas.length > 0 && (
              <div className="border-t border-white/4 bg-surface-800/10">
                <button onClick={() => setShowCompleted(!showCompleted)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors select-none text-left">
                  {showCompleted ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                  <span>Mostrar completados ({completadas.length})</span>
                </button>
                {showCompleted && (
                  <div className="border-t border-white/4 bg-surface-900/10 animate-fade-in">
                    {completadas.map((r, index) => (
                      <RequisitoRow key={r.id} requisito={r} i={index} listLength={completadas.length} onEdit={onEdit} requisitosDelProyecto={todosLosRequisitos} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}

function VistaLista({ onOpenProjectModal, onEditProject }) {
  const { state } = useApp()
  const [modal, setModal] = useState(null)

  const grouped = {}
  state.proyectos.forEach(p => { grouped[p.nombre] = [] })
  state.requisitos.forEach(r => { if (grouped[r.proyecto]) grouped[r.proyecto].push(r) })

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-slate-300 border-b border-white/10 pb-2">📁 Proyectos</h2>
        {state.proyectos.map((p, index) => p.tipo !== 'Proyecto' ? null : (
          <ProyectoGroup
            key={p.nombre} proyecto={p.nombre} requisitos={grouped[p.nombre] || []} index={index}
            totalProyectos={state.proyectos.length} todosLosRequisitos={state.requisitos}
            onAdd={(proj) => setModal({ proyecto: proj })}
            onEdit={(r) => setModal({ editRequisito: r })}
            onEditProject={onEditProject}
          />
        ))}
        {state.proyectos.filter(p => p.tipo === 'Proyecto').length === 0 && (
          <p className="text-xs text-slate-500 italic pl-2">No hay elementos en la categoría Proyectos.</p>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-display font-bold text-slate-300 border-b border-white/10 pb-2">⚙️ Operativa</h2>
        {state.proyectos.map((p, index) => p.tipo !== 'Operativa' ? null : (
          <ProyectoGroup
            key={p.nombre} proyecto={p.nombre} requisitos={grouped[p.nombre] || []} index={index}
            totalProyectos={state.proyectos.length} todosLosRequisitos={state.requisitos}
            onAdd={(proj) => setModal({ proyecto: proj })}
            onEdit={(r) => setModal({ editRequisito: r })}
            onEditProject={onEditProject}
          />
        ))}
        {state.proyectos.filter(p => p.tipo === 'Operativa').length === 0 && (
          <p className="text-xs text-slate-500 italic pl-2">No hay elementos en la categoría Operativa.</p>
        )}
      </div>

      {modal && !modal.editRequisito && <RequisitoModal initialProyecto={modal.proyecto} onClose={() => setModal(null)} />}
      {modal?.editRequisito && <RequisitoModal editRequisito={modal.editRequisito} onClose={() => setModal(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub-vista 2: TIMELINE (antes "Gantt"), ahora sobre Requisitos
// ─────────────────────────────────────────────────────────────

function ResponsableSelect({ requisito }) {
  const { dispatch } = useApp()
  const tagColor = getEtiquetaColor(requisito.responsable)
  return (
    <select
      value={requisito.responsable || ''}
      onChange={(e) => dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, responsable: e.target.value } })}
      onClick={(e) => e.stopPropagation()}
      title="Cambiar responsable"
      className="text-[10px] font-semibold rounded-full pl-2 pr-1 py-1 border cursor-pointer focus:outline-none transition-all bg-transparent shrink-0"
      style={{ color: tagColor.accent, borderColor: `${tagColor.accent}60` }}
    >
      {ETIQUETAS_OPCIONES.map((opt) => <option key={opt} value={opt} className="bg-surface-700 text-slate-200">{opt}</option>)}
    </select>
  )
}

function VistaTimeline() {
  const { state, dispatch } = useApp()
  const requisitosData = useMemo(() => state?.requisitos || [], [state?.requisitos])
  const proyectosData = useMemo(() => state?.proyectos || [], [state?.proyectos])

  const [proyectoFiltrado, setProyectoFiltrado] = useState('Todos')
  const [etiquetaFiltrada, setEtiquetaFiltrada] = useState('Todas')
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)
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

  const validRequisitos = useMemo(() => {
    return requisitosData.filter(r => {
      if (!r.fechaInicio?.trim() || !r.fechaVencimiento?.trim()) return false
      const pasaProyecto = proyectoFiltrado === 'Todos' || r.proyecto === proyectoFiltrado
      const pasaEtiqueta = etiquetaFiltrada === 'Todas' || r.responsable === etiquetaFiltrada
      if (!pasaProyecto || !pasaEtiqueta) return false
      try {
        const tStart = parseISO(r.fechaInicio)
        let tEnd = parseISO(r.fechaVencimiento)
        if (tEnd <= tStart) tEnd = addDays(tStart, 1)
        return tStart <= maxDate && tEnd >= minDate
      } catch { return false }
    })
  }, [requisitosData, proyectoFiltrado, etiquetaFiltrada, minDate, maxDate])

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
  }, [minDate, totalDays])

  const activas = useMemo(() => [...validRequisitos].filter(r => r.estado !== 'Done').sort((a, b) => parseISO(a.fechaInicio).getTime() - parseISO(b.fechaInicio).getTime()), [validRequisitos])
  const completadas = useMemo(() => [...validRequisitos].filter(r => r.estado === 'Done').sort((a, b) => parseISO(a.fechaInicio).getTime() - parseISO(b.fechaInicio).getTime()), [validRequisitos])

  const timelineRef = useRef(null)

  // mode: 'move' arrastra toda la barra; 'resize-left'/'resize-right' cambian solo un extremo
  const handleDragStartBarra = (e, requisito, mode = 'move') => {
    e.stopPropagation()
    const rect = timelineRef.current.getBoundingClientRect()
    const grabXPercent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const grabDate = addDays(minDate, Math.round(grabXPercent * totalDays))
    const grabOffsetDays = differenceInDays(grabDate, parseISO(requisito.fechaInicio))
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: requisito.id, grabOffsetDays, mode }))
  }

  const handleDragOverGantt = (e) => e.preventDefault()

  const handleDropGantt = (e) => {
    e.preventDefault()
    let payload
    try { payload = JSON.parse(e.dataTransfer.getData('text/plain')) } catch { return }
    if (!payload?.id) return
    const requisito = requisitosData.find(r => r.id === payload.id)
    if (!requisito || !requisito.fechaInicio) return

    const rect = timelineRef.current.getBoundingClientRect()
    const dropXPercent = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const dropDate = addDays(minDate, Math.round(dropXPercent * totalDays))

    const originalStart = parseISO(requisito.fechaInicio)
    const originalEnd = requisito.fechaVencimiento ? parseISO(requisito.fechaVencimiento) : addDays(originalStart, 1)

    if (payload.mode === 'resize-right') {
      // El extremo derecho sigue al cursor; el inicio no se toca. Mínimo 1 día de duración.
      let newEnd = dropDate
      if (newEnd <= originalStart) newEnd = addDays(originalStart, 1)
      dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, fechaVencimiento: format(newEnd, 'yyyy-MM-dd') } })
      return
    }

    if (payload.mode === 'resize-left') {
      // El extremo izquierdo sigue al cursor; el fin no se toca. Mínimo 1 día de duración.
      let newStart = dropDate
      if (newStart >= originalEnd) newStart = addDays(originalEnd, -1)
      dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, fechaInicio: format(newStart, 'yyyy-MM-dd') } })
      return
    }

    // mode === 'move': desplaza toda la barra conservando su duración
    const newStart = addDays(dropDate, -payload.grabOffsetDays)
    const duracionDias = differenceInDays(originalEnd, originalStart)
    const newEnd = addDays(newStart, duracionDias)

    dispatch({
      type: 'UPDATE_REQUISITO',
      payload: { id: requisito.id, fechaInicio: format(newStart, 'yyyy-MM-dd'), fechaVencimiento: format(newEnd, 'yyyy-MM-dd') }
    })
  }

  const renderFila = (requisito) => {
    const start = parseISO(requisito.fechaInicio)
    let end = requisito.fechaVencimiento ? parseISO(requisito.fechaVencimiento) : addDays(start, 1)
    if (end <= start) end = addDays(start, 1)

    const barLeft = getPercentagePosition(start)
    const barRight = getPercentagePosition(end)
    const barWidth = Math.max(1.5, barRight - barLeft)
    const cfg = ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']
    const tagColor = getEtiquetaColor(requisito.responsable)
    const projColor = getProjectColor(requisito.proyecto, proyectosData)

    return (
      <div key={requisito.id} className="grid grid-cols-[480px_1fr] items-center hover:bg-white/[0.02] transition-colors min-h-[56px] py-2 relative z-10 border-b border-white/[0.02]">
        <div className="px-5 pr-4 flex items-center justify-between gap-3 border-r border-white/5 h-full">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase text-center w-32 shrink-0 truncate tracking-wider ${projColor?.bg || 'bg-slate-500/10'} ${projColor?.border || 'border-slate-500/30'} ${projColor?.text || 'text-slate-400'}`} title={requisito.proyecto}>
              {requisito.proyecto}
            </span>
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
            onDragStart={(e) => handleDragStartBarra(e, requisito, 'move')}
            className="group/bar absolute h-6 rounded-lg flex items-center px-2 shadow-md border cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-150"
            style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: `${tagColor.accent}20`, borderColor: `${tagColor.accent}60`, borderWidth: '1px' }}
            title={`${requisito.titulo} [Proyecto: ${requisito.proyecto}] [Responsable: ${requisito.responsable || 'Ninguno'}] · Arrastra para reprogramar, tira de los extremos para cambiar la duración`}
          >
            <div className="absolute left-0 top-0 bottom-0 opacity-40" style={{ width: requisito.estado === 'Done' ? '100%' : requisito.estado === 'In Progress' ? '50%' : '0%', backgroundColor: tagColor.accent }} />
            {barWidth > 12 && <span className="text-[10px] font-semibold text-white/95 truncate z-10 font-mono">{requisito.responsable || 'Sin asignar'}</span>}

            <div
              draggable
              onDragStart={(e) => handleDragStartBarra(e, requisito, 'resize-left')}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white/30 hover:bg-white/60"
              title="Arrastra para cambiar la fecha de inicio"
            />
            <div
              draggable
              onDragStart={(e) => handleDragStartBarra(e, requisito, 'resize-right')}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white/30 hover:bg-white/60"
              title="Arrastra para cambiar la fecha de vencimiento"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4 justify-end">
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
            {proyectosData.map((p, index) => <option key={p.nombre || index} value={p.nombre} className="bg-surface-700">{p.nombre}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-surface-800 border border-white/5 px-3 py-1.5 rounded-xl">
          <Tag size={13} className="text-slate-400" />
          <span className="text-xs font-medium text-slate-400 mr-1">Responsable:</span>
          <select value={etiquetaFiltrada} onChange={(e) => setEtiquetaFiltrada(e.target.value)} className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer">
            <option value="Todas" className="bg-surface-700">Todos</option>
            {ETIQUETAS_OPCIONES.map(tag => <option key={tag} value={tag} className="bg-surface-700">{tag}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end mb-3">
        <div className="flex items-center gap-1.5 bg-surface-800/90 border border-white/5 p-1 rounded-xl">
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

      <p className="text-[11px] text-slate-500 mb-3 -mt-2">💡 Arrastra las barras para reprogramar fechas, o cambia el responsable directamente desde el desplegable de cada fila.</p>

      <div className="border border-white/5 rounded-2xl bg-surface-700/30 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: `${Math.max(1100, 480 + markers.length * 52)}px` }} onDragOver={handleDragOverGantt} onDrop={handleDropGantt}>
            <div ref={timelineRef} className="absolute inset-0 left-[480px] pointer-events-none flex justify-between z-0">
              {markers.map((_, idx) => <div key={idx} className="w-px h-full border-l border-white/[0.03]" />)}
              {semanas.map((sem, idx) => sem.showBoundary && <div key={`sem-${idx}`} className="absolute top-0 bottom-0 w-px bg-indigo-400/40 z-10" style={{ left: `${sem.boundaryPos}%` }} />)}
              {todayPosition !== null && <div className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500/50 z-20" style={{ left: `${todayPosition}%` }} />}
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
                {markers.map((date, i) => <span key={i} className="transform -translate-x-1/2 whitespace-nowrap lowercase">{format(date, 'dd MMM', { locale: es }).replace('.', '')}</span>)}
                {todayPosition !== null && <span className="absolute bg-rose-500 text-white font-sans text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md top-1 transform -translate-x-1/2 z-30" style={{ left: `${todayPosition}%` }}>Hoy</span>}
              </div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {validRequisitos.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">No se encontraron requisitos en el rango de fechas actual.</div>
              ) : (
                <>
                  {activas.map(renderFila)}
                  {completadas.length > 0 && (
                    <div className="bg-[#0e1424]/40">
                      <div className="grid grid-cols-[480px_1fr] items-center min-h-[44px] border-b border-white/[0.04]">
                        <div className="px-5 h-full flex items-center">
                          <button type="button" onClick={() => setMostrarCompletadas(!mostrarCompletadas)} className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-2.5 rounded-lg bg-surface-800/60 border border-white/5">
                            {mostrarCompletadas ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <span>Mostrar completados ({completadas.length})</span>
                          </button>
                        </div>
                        <div className="h-full w-full" />
                      </div>
                      {mostrarCompletadas && <div className="divide-y divide-white/[0.02]">{completadas.map(renderFila)}</div>}
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

// ─────────────────────────────────────────────────────────────
// Sub-vista 3: CARGA DE TRABAJO (nueva)
// ─────────────────────────────────────────────────────────────

const SEMANAS_VISIBLES = 4
const MAX_TARJETAS_VISIBLES = 5
const MAX_FILAS_SIN_ASIGNAR = 6

// Tarjeta de un requisito. En el pool "Sin programar" muestra un desplegable para asignar
// responsable directamente (sin drag&drop). Dentro del tablero es arrastrable entre semanas
// y muestra una X para devolverlo directamente al grupo "Sin asignar".
function TarjetaCarga({ requisito, draggable = true, onDragStart, showAssign = false, onAssign, onRemove }) {
  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (e) => onDragStart(e, requisito) : undefined}
      className={`relative bg-surface-800/70 border border-white/[0.05] hover:border-white/15 rounded-lg px-2.5 py-2 space-y-1.5 transition-colors ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      title={requisito.titulo}
    >
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(requisito.id) }}
          className="absolute top-1.5 right-1.5 p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Devolver a Sin asignar"
        >
          <X size={12} />
        </button>
      )}
      <div className="flex items-center justify-between gap-2 pr-4">
        <p className="text-xs text-slate-300 truncate flex-1">{requisito.titulo}</p>
        <PrioridadBadge requisito={requisito} editable={false} />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500 truncate">{requisito.proyecto}</span>
        <span className={`text-[9px] font-medium rounded-full px-1.5 py-0.5 border shrink-0 ${(ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']).bg} ${(ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']).color} ${(ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']).border}`}>
          {requisito.estado}
        </span>
      </div>
      {showAssign && (
        <select
          defaultValue=""
          onChange={(e) => { if (e.target.value) { onAssign(requisito.id, e.target.value); e.target.value = '' } }}
          className="w-full bg-surface-700 border border-white/10 rounded-md px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
        >
          <option value="" disabled className="bg-surface-700 text-slate-500">Asignar a...</option>
          {ETIQUETAS_OPCIONES.map(opt => <option key={opt} value={opt} className="bg-surface-700 text-slate-200">{opt}</option>)}
        </select>
      )}
    </div>
  )
}

// Celda de una semana dentro del tablero de una persona: máximo 5 tarjetas visibles, scroll si hay más
function CeldaSemana({ sem, lista, onDragOver, onDrop, onDragStart, onRemove }) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="border-l border-white/5 first:border-l-0 p-2.5 space-y-2 bg-surface-900/10 hover:bg-white/[0.02] transition-colors"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-slate-500 lowercase">
          {format(sem.inicio, 'dd MMM', { locale: es }).replace('.', '')} – {format(sem.fin, 'dd MMM', { locale: es }).replace('.', '')}
        </p>
        {lista.length > MAX_TARJETAS_VISIBLES && (
          <span className="text-[9px] text-slate-500 font-mono bg-white/5 px-1 py-0.5 rounded">{lista.length}</span>
        )}
      </div>
      <div className={`space-y-2 ${lista.length > MAX_TARJETAS_VISIBLES ? 'max-h-[280px] overflow-y-auto pr-1 custom-scrollbar' : ''}`}>
        {lista.map(r => <TarjetaCarga key={r.id} requisito={r} onDragStart={onDragStart} onRemove={onRemove} />)}
      </div>
    </div>
  )
}

// Bloque de una persona: tablero de semanas + Gantt filtrado a sus requisitos (colapsado por defecto)
function PersonaBoard({ responsable, semanas, celda, handleDragOver, handleDropEnCelda, handleDragStartTarjeta, handleQuitarDeTablero, requisitosPersona }) {
  const [showGantt, setShowGantt] = useState(false)
  const col = getEtiquetaColor(responsable)

  return (
    <div className="rounded-2xl border border-white/5 bg-surface-700/40 overflow-hidden shadow-lg">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/5 bg-surface-800/40">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.accent }} />
        <h3 className="font-display font-bold text-slate-200 text-sm">{responsable}</h3>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${SEMANAS_VISIBLES}, minmax(0, 1fr))` }}>
        {semanas.map(sem => (
          <CeldaSemana
            key={sem.key}
            sem={sem}
            lista={celda(responsable, sem.key)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropEnCelda(e, responsable, sem.inicio)}
            onDragStart={handleDragStartTarjeta}
            onRemove={handleQuitarDeTablero}
          />
        ))}
      </div>

      <div className="border-t border-white/5 p-3">
        <button
          onClick={() => setShowGantt(!showGantt)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded-lg bg-surface-800/50 border border-white/5 hover:border-white/10"
        >
          <BarChart2 size={13} className="text-accent-violet" />
          {showGantt ? `Ocultar Gantt de ${responsable}` : `Ver Gantt de ${responsable}`}
          {showGantt ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        {showGantt && <MiniGantt requisitos={requisitosPersona} />}
      </div>
    </div>
  )
}

function VistaCarga() {
  const { state, dispatch } = useApp()
  const requisitos = useMemo(() => (state.requisitos || []).filter(r => r.estado !== 'Done'), [state.requisitos])

  const [fechaInicioVista, setFechaInicioVista] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  const semanas = useMemo(() => {
    return Array.from({ length: SEMANAS_VISIBLES }, (_, i) => {
      const inicio = addDays(fechaInicioVista, i * 7)
      const fin = addDays(inicio, 6)
      return { inicio, fin, key: format(inicio, 'yyyy-MM-dd') }
    })
  }, [fechaInicioVista])

  const rangoInicio = semanas[0].inicio
  const rangoFin = semanas[semanas.length - 1].fin

  // Grupo único: le falta fecha de inicio y/o responsable válido (antes eran dos grupos separados)
  const sinAsignar = useMemo(() => requisitos.filter(r =>
    !r.fechaInicio || !(r.responsable && ETIQUETAS_OPCIONES.includes(r.responsable))
  ), [requisitos])

  // Ordenado por prioridad: Alta primero, luego Media, luego Baja
  const PESO_PRIORIDAD = { Alta: 0, Media: 1, Baja: 2 }
  const sinAsignarOrdenado = useMemo(() =>
    [...sinAsignar].sort((a, b) => (PESO_PRIORIDAD[a.prioridad] ?? 1) - (PESO_PRIORIDAD[b.prioridad] ?? 1)),
    [sinAsignar]
  )

  const [poolColapsado, setPoolColapsado] = useState(true)

  // Requisitos ya programados Y asignados a una persona real, dentro del rango de semanas visible
  const enTablero = useMemo(() => requisitos.filter(r => {
    if (!r.fechaInicio) return false
    if (!(r.responsable && ETIQUETAS_OPCIONES.includes(r.responsable))) return false
    try {
      const inicio = parseISO(r.fechaInicio)
      return inicio >= rangoInicio && inicio <= rangoFin
    } catch { return false }
  }), [requisitos, rangoInicio, rangoFin])

  const celda = (responsable, semanaKey) => enTablero.filter(r => {
    if (r.responsable !== responsable) return false
    try { return format(startOfWeek(parseISO(r.fechaInicio), { weekStartsOn: 1 }), 'yyyy-MM-dd') === semanaKey } catch { return false }
  })

  // Requisitos de cada persona para su Gantt individual (todas las fechas, no solo el rango visible)
  const requisitosPorPersona = (responsable) => (state.requisitos || []).filter(r => r.responsable === responsable)

  const navegar = (dir) => setFechaInicioVista(prev => addDays(prev, dir * 7))

  const handleDragStartTarjeta = (e, requisito) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', requisito.id)
  }

  const handleDragOver = (e) => e.preventDefault()

  const handleDropEnCelda = (e, responsable, semanaInicio) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    const requisito = requisitos.find(r => r.id === id)
    if (!requisito) return

    let nuevaFechaInicio = semanaInicio
    let nuevaFechaFin = addDays(semanaInicio, 6) // por defecto, semana completa (lunes a domingo)

    if (requisito.fechaInicio && requisito.fechaVencimiento) {
      // Ya tenía fechas: se conserva su duración, solo se desplaza para empezar ese lunes
      try {
        const duracion = differenceInDays(parseISO(requisito.fechaVencimiento), parseISO(requisito.fechaInicio))
        nuevaFechaFin = addDays(semanaInicio, Math.max(0, duracion))
      } catch { /* usar semana completa por defecto */ }
    }

    dispatch({
      type: 'UPDATE_REQUISITO',
      payload: {
        id: requisito.id,
        responsable,
        fechaInicio: format(nuevaFechaInicio, 'yyyy-MM-dd'),
        fechaVencimiento: format(nuevaFechaFin, 'yyyy-MM-dd')
      }
    })
  }

  const handleDropEnPool = (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    // Devolver al grupo único: quita fechas y responsable
    dispatch({ type: 'UPDATE_REQUISITO', payload: { id, fechaInicio: '', fechaVencimiento: '', responsable: '' } })
  }

  // Botón "X" en una tarjeta del tablero: la devuelve directamente al grupo "Sin asignar"
  const handleQuitarDeTablero = (id) => {
    dispatch({ type: 'UPDATE_REQUISITO', payload: { id, fechaInicio: '', fechaVencimiento: '', responsable: '' } })
  }

  // Asignación directa desde el desplegable. Si el requisito ya tenía fechas, se conservan
  // (solo se le pone responsable); si no, se programa en la semana actualmente visible.
  const handleAsignarDesdePool = (id, responsable) => {
    const requisito = requisitos.find(r => r.id === id)
    const payload = { id, responsable }
    if (!requisito?.fechaInicio || !requisito?.fechaVencimiento) {
      payload.fechaInicio = format(rangoInicio, 'yyyy-MM-dd')
      payload.fechaVencimiento = format(addDays(rangoInicio, 6), 'yyyy-MM-dd')
    }
    dispatch({ type: 'UPDATE_REQUISITO', payload })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-500">
          Asigna un responsable desde "Sin asignar" para moverlo al tablero, o arrástralo directamente a la semana de una persona.
        </p>
        <div className="flex items-center gap-1.5 bg-surface-800/90 border border-white/5 p-1 rounded-xl">
          <button type="button" onClick={() => navegar(-1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronLeft size={14} strokeWidth={2.5} /></button>
          <button type="button" onClick={() => setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-2.5 py-1 text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 rounded-md transition-colors">Hoy</button>
          <button type="button" onClick={() => navegar(1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronRight size={14} strokeWidth={2.5} /></button>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-300 pr-2.5 pl-1">
            <Calendar size={13} className="text-violet-400" />
            <span className="lowercase">{format(rangoInicio, 'dd MMM', { locale: es }).replace('.', '')} – {format(rangoFin, 'dd MMM yyyy', { locale: es }).replace('.', '')}</span>
          </div>
        </div>
      </div>

      {/* Tablero por persona */}
      <div className="space-y-4">
        {ETIQUETAS_OPCIONES.map(responsable => (
          <PersonaBoard
            key={responsable}
            responsable={responsable}
            semanas={semanas}
            celda={celda}
            handleDragOver={handleDragOver}
            handleDropEnCelda={handleDropEnCelda}
            handleDragStartTarjeta={handleDragStartTarjeta}
            handleQuitarDeTablero={handleQuitarDeTablero}
            requisitosPersona={requisitosPorPersona(responsable)}
          />
        ))}
      </div>

      {/* Grupo único: sin asignar y/o sin programar (al final, colapsado por defecto) */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDropEnPool}
        className="rounded-2xl border border-dashed border-white/10 bg-slate-950/20 p-4 space-y-3"
      >
        <button
          type="button"
          onClick={() => setPoolColapsado(!poolColapsado)}
          className="w-full flex items-center justify-between gap-2 text-left select-none"
        >
          <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            {poolColapsado ? <ChevronRight size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
            📥 Sin asignar <span className="text-[10px] font-normal normal-case text-slate-500">(sin responsable y/o sin fecha, ordenados por prioridad)</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">{sinAsignar.length}</span>
        </button>

        {!poolColapsado && (
          sinAsignarOrdenado.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic py-1">No hay requisitos pendientes de asignar o programar.</p>
          ) : (
            <div className={`grid grid-cols-1 gap-2 ${sinAsignarOrdenado.length > MAX_FILAS_SIN_ASIGNAR ? 'max-h-[420px] overflow-y-auto pr-1 custom-scrollbar' : ''}`}>
              {sinAsignarOrdenado.map(r => (
                <TarjetaCarga key={r.id} requisito={r} onDragStart={handleDragStartTarjeta} showAssign onAssign={handleAsignarDesdePool} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Contenedor principal: Planificación
// ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'lista', label: 'Lista', icon: ListChecks },
  { id: 'timeline', label: 'Timeline', icon: BarChart2 },
  { id: 'carga', label: 'Carga de trabajo', icon: Users },
]

export default function Planificacion() {
  const { state } = useApp()
  const [tab, setTab] = useState('lista')
  const [projectModal, setProjectModal] = useState(false)
  const [editProjectObj, setEditProjectObj] = useState(null)
  const [addModal, setAddModal] = useState(false)

  const abrirEdicionProyecto = (nombreProyecto) => {
    setEditProjectObj(state.proyectos.find(p => p.nombre === nombreProyecto))
    setProjectModal(true)
  }

  return (
    <div className="p-8 animate-fade-in max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Planificación</h1>
          <p className="text-sm text-slate-500 mt-1">Proyectos, requisitos y carga de trabajo en un mismo lugar.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditProjectObj(null); setProjectModal(true) }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all">
            <Plus size={16} strokeWidth={2.5} /> Nuevo proyecto
          </button>
          <button onClick={() => setAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/90 text-white text-sm font-semibold transition-all glow-violet">
            <Plus size={16} strokeWidth={2.5} /> Nuevo requisito
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-surface-800/90 border border-white/5 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === id ? 'bg-accent-violet/20 text-accent-violet border border-accent-violet/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'lista' && <VistaLista onEditProject={abrirEdicionProyecto} />}
      {tab === 'timeline' && <VistaTimeline />}
      {tab === 'carga' && <VistaCarga />}

      {addModal && <RequisitoModal onClose={() => setAddModal(false)} />}
      {projectModal && (
        <ProjectModal onClose={() => { setProjectModal(false); setEditProjectObj(null) }} editProject={editProjectObj} />
      )}
    </div>
  )
}