import React, { useState, useEffect, useRef } from 'react'
import { format, parseISO, isPast, isToday, differenceInDays, addDays } from 'date-fns'
import { Plus, ExternalLink, Trash2, Pencil, ChevronDown, ChevronRight, CheckSquare, Square, FileText, Sun, ArrowUp, ArrowDown, BookOpen, PlusCircle, Calendar, User, Clock, Check, Circle } from 'lucide-react'
import { useTask, ESTADOS, ESTADO_CONFIG, getProjectColor, ETIQUETAS_OPCIONES } from '../context/TaskContext'
import TaskModal from '../components/TaskModal'
import ProjectModal from '../components/ProjectModal'

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

function TareaRow({ tarea, i, tareasLength, onEdit }) {
  const { dispatch } = useTask()
  const [expanded, setExpanded] = useState(false)
  const [nuevoItemText, setNuevoItemText] = useState('')
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingItemText, setEditingItemText] = useState('')

  const checklist = tarea.checklist || []
  const notas = tarea.notas || ''
  const itemsCompletados = checklist.filter(item => item.completado).length

  let diasDuracion = '—'
  if (tarea.fechaInicio && tarea.fechaVencimiento) {
    try {
      const start = parseISO(tarea.fechaInicio)
      const end = parseISO(tarea.fechaVencimiento)
      const diff = differenceInDays(end, start)
      diasDuracion = diff >= 0 ? `${diff}d` : '0d'
    } catch {}
  }

  const toggleChecklistItem = (itemId) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completado: !item.completado } : item
    )
    dispatch({ type: 'UPDATE_TASK', payload: { id: tarea.id, checklist: updatedChecklist } })
  }

  const handleAddChecklist = (e) => {
    e.preventDefault()
    if (!nuevoItemText.trim()) return
    const newItem = { id: Date.now().toString(), texto: nuevoItemText.trim(), completado: false }
    dispatch({ type: 'UPDATE_TASK', payload: { id: tarea.id, checklist: [...checklist, newItem] } })
    setNuevoItemText('')
  }

  const handleBorrarChecklist = (itemId) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId)
    dispatch({ type: 'UPDATE_TASK', payload: { id: tarea.id, checklist: updatedChecklist } })
  }

  const startEditingItem = (item) => {
    setEditingItemId(item.id)
    setEditingItemText(item.texto)
  }

  const saveEditingItem = (itemId) => {
    if (!editingItemText.trim()) return
    const updatedChecklist = checklist.map(item => 
      item.id === itemId ? { ...item, texto: editingItemText.trim() } : item
    )
    dispatch({ type: 'UPDATE_TASK', payload: { id: tarea.id, checklist: updatedChecklist } })
    setEditingItemId(null)
  }

  return (
    <>
      <div
        className={`group grid grid-cols-[1fr_130px_100px_80px_70px_60px] items-center px-4 py-3 transition-colors hover:bg-surface-600/30 cursor-pointer ${
          i < tareasLength - 1 ? 'border-b border-white/4' : ''
        } ${tarea.estado === 'Done' ? 'opacity-50' : ''} ${expanded ? 'bg-surface-600/20' : 'bg-surface-700/80'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col pr-4 truncate">
          <span className={`text-sm font-medium truncate flex items-center gap-2 ${tarea.estado === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
            {tarea.titulo}
            
            {tarea.enMiDia && <Sun size={12} className="text-amber-400 fill-amber-400/20 shrink-0" />}

            <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded-md font-medium shrink-0 normal-case no-underline flex items-center gap-1">
              {tarea.etiqueta && tarea.etiqueta !== 'Sin etiqueta' ? `👤 ${tarea.etiqueta}` : '👤 Sin asignar'}
            </span>
          </span>
          <div className="flex gap-2 mt-1 pl-5">
            {checklist.length > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <CheckSquare size={10} /> {itemsCompletados}/{checklist.length} sub-tareas
              </span>
            )}
            {notas.trim().length > 0 && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <FileText size={10} /> Notas
              </span>
            )}
            {tarea.historia && tarea.historia.trim().length > 0 && (
              <span className="text-[10px] text-violet-400 flex items-center gap-1 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded font-medium">
                📄 Req Sincronizado
              </span>
            )}
          </div>
        </div>

        <div onClick={e => e.stopPropagation()}><EstadoSelect tarea={tarea} /></div>
        <VencimientoLabel fecha={tarea.fechaVencimiento} />
        <span className="text-xs text-slate-500 font-mono">
          {tarea.fechaInicio ? format(parseISO(tarea.fechaInicio), 'dd MMM') : '—'}
        </span>
        <span className="text-xs text-slate-400 font-mono font-medium">{diasDuracion}</span>

        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => dispatch({ type: 'UPDATE_TASK', payload: { id: tarea.id, enMiDia: !tarea.enMiDia } })}
            className={`p-1.5 rounded-lg transition-all ${tarea.enMiDia ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}
            title={tarea.enMiDia ? "Quitar de Mi Día" : "Añadir a Mi Día"}
          >
            <Sun size={13} />
          </button>
          
          {tarea.linkDocumento && (
            <a href={tarea.linkDocumento} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-500 hover:text-accent-violet hover:bg-accent-violet/10 transition-all">
              <ExternalLink size={13} />
            </a>
          )}
          <button onClick={() => onEdit(tarea)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-500 transition-all"><Pencil size={13} /></button>
          <button onClick={() => dispatch({ type: 'DELETE_TASK', payload: tarea.id })} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"><Trash2 size={13} /></button>
        </div>
      </div>

      {expanded && (
        <div className="bg-surface-800/40 border-b border-white/5 px-8 py-4 grid grid-cols-1 md:grid-cols-2 gap-6" onClick={e => e.stopPropagation()}>
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
                      <span 
                        onDoubleClick={() => startEditingItem(item)}
                        className={`cursor-text select-none ${item.completado ? 'line-through text-slate-500' : ''}`}
                      >
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

          <div className="space-y-4 flex flex-col">
            {tarea.historia && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold uppercase text-violet-400 flex items-center gap-1.5">📄 Historia de Usuario</h4>
                <div className="bg-violet-950/20 border border-violet-500/10 rounded-xl p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {tarea.historia}
                </div>
              </div>
            )}
            <div className="space-y-2 flex flex-col flex-1">
              <h4 className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5"><FileText size={13} /> Notas</h4>
              <textarea
                value={notas}
                onChange={e => dispatch({ type: 'UPDATE_TASK', payload: { id: tarea.id, notas: e.target.value } })}
                placeholder="Escribe comentarios o detalles... (Se guarda automáticamente)"
                className="w-full flex-1 min-h-[80px] bg-surface-700/60 text-xs text-slate-300 placeholder-slate-600 border border-white/5 rounded-xl p-3 focus:outline-none focus:border-accent-violet/50 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Construye el payload de la tarea vinculada a una historia (mismos campos que antes calculaba enviarATareas)
function construirTareaDesdeHistoria(historia, proyecto) {
  let fechaInicio = format(new Date(), 'yyyy-MM-dd')
  if (historia.fechaLimite && historia.diasDesarrollo > 0) {
    try {
      fechaInicio = format(addDays(parseISO(historia.fechaLimite), -historia.diasDesarrollo), 'yyyy-MM-dd')
    } catch { /* keep today */ }
  }
  return {
    titulo: historia.titulo,
    proyecto,
    estado: 'To Do',
    etiqueta: historia.responsable || 'Sin asignar',
    historia: historia.descripcion,
    historiaId: historia.id,
    checklist: [],
    notas: '',
    enMiDia: false,
    fechaInicio,
    fechaVencimiento: historia.fechaLimite || ''
  }
}

function HistoriaItem({ h, proyecto, dispatch }) {
  const { state } = useTask()
  const tareas = state?.tareas || []

  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [editTitulo, setEditTitulo] = useState(h.titulo)
  const [editDescripcion, setEditDescripcion] = useState(h.descripcion)
  const [editFechaLimite, setEditFechaLimite] = useState(h.fechaLimite || '')
  const [editResponsable, setEditResponsable] = useState(h.responsable || '')
  const [editDiasDesarrollo, setEditDiasDesarrollo] = useState(h.diasDesarrollo ?? '')
  const textareaEditRef = useRef(null)

  useEffect(() => {
    if (isEditing && textareaEditRef.current) {
      textareaEditRef.current.style.height = 'auto'
      textareaEditRef.current.style.height = `${textareaEditRef.current.scrollHeight}px`
    }
  }, [editDescripcion, isEditing])

  const guardarEdicion = () => {
    if (!editTitulo.trim()) return
    dispatch({
      type: 'UPDATE_STORY',
      payload: {
        ...h,
        titulo: editTitulo.trim(),
        descripcion: editDescripcion.trim(),
        fechaLimite: editFechaLimite,
        responsable: editResponsable,
        diasDesarrollo: editDiasDesarrollo !== '' ? parseInt(editDiasDesarrollo, 10) : null
      }
    })
    setIsEditing(false)
  }

  const toggleCompletada = (e) => {
    e.stopPropagation()
    dispatch({ type: 'TOGGLE_STORY_COMPLETION', payload: h.id })
  }

  const enviarATareas = () => {
    // Bug 1 fix: dedup by historiaId
    const yaExiste = tareas.some(t => t.historiaId === h.id)
    if (yaExiste) {
      alert('Ya existe una tarea vinculada a este requerimiento. Puedes editarla desde Proyectos y Tareas.')
      return
    }
    const confirmacion = window.confirm(`¿Quieres crear una tarea en el proyecto "${proyecto}" basada en este requerimiento?`)
    if (!confirmacion) return

    dispatch({ type: 'ADD_TASK', payload: construirTareaDesdeHistoria(h, proyecto) })
    alert('¡Tarea añadida y sincronizada con éxito en Proyectos!')
  }

  return (
    <div className={`bg-surface-700/40 border ${h.completada ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5'} rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-white/10 transition-colors`}>

      {isEditing ? (
        <div className="space-y-2 flex-1 w-full">
          <input
            type="text"
            value={editTitulo}
            onChange={e => setEditTitulo(e.target.value)}
            className="w-full bg-surface-600 text-xs font-semibold text-slate-200 rounded px-2 py-1 border border-white/10 focus:outline-none"
          />
          <textarea
            ref={textareaEditRef}
            value={editDescripcion}
            onChange={e => setEditDescripcion(e.target.value)}
            className="w-full bg-surface-600 text-xs text-slate-300 rounded p-2 border border-white/10 focus:outline-none resize-none overflow-hidden min-h-[48px]"
          />
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10} /> Fecha Límite</label>
              <input
                type="date"
                value={editFechaLimite}
                onChange={e => setEditFechaLimite(e.target.value)}
                className="w-full bg-surface-600 text-xs text-slate-200 rounded px-2 py-1 border border-white/10 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1"><User size={10} /> Responsable</label>
              <select
                value={editResponsable}
                onChange={e => setEditResponsable(e.target.value)}
                className="w-full bg-surface-600 text-xs text-slate-200 rounded px-2 py-1 border border-white/10 focus:outline-none cursor-pointer"
              >
                <option value="">Sin asignar</option>
                {ETIQUETAS_OPCIONES.map(opt => (
                  <option key={opt} value={opt} className="bg-surface-700">{opt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10} /> Días Des.</label>
              <input
                type="number"
                min="0"
                value={editDiasDesarrollo}
                onChange={e => setEditDiasDesarrollo(e.target.value)}
                className="w-full bg-surface-600 text-xs text-slate-200 rounded px-2 py-1 border border-white/10 focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 flex-1 w-full">
          <div
            className="flex items-start gap-2.5 cursor-pointer group"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <button
              onClick={toggleCompletada}
              className="mt-0.5 shrink-0 focus:outline-none transition-transform active:scale-90"
              title={h.completada ? "Marcar como pendiente" : "Marcar como completado"}
            >
              {h.completada ? (
                <Check size={16} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              ) : (
                <Circle size={16} className="text-slate-500 group-hover:text-slate-400" />
              )}
            </button>

            <h4 className={`text-sm font-semibold flex-1 transition-colors ${h.completada ? 'text-slate-400' : 'text-slate-200'}`}>
              {h.titulo}
            </h4>

            <div className="text-slate-500 mt-0.5">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pl-7">
            {h.responsable && h.responsable !== 'Sin asignar' && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <User size={9} /> {h.responsable}
              </span>
            )}
            {h.fechaLimite && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <Calendar size={9} /> {h.fechaLimite}
              </span>
            )}
            {h.diasDesarrollo !== undefined && h.diasDesarrollo !== null && h.diasDesarrollo !== '' && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded">
                <Clock size={9} /> {h.diasDesarrollo} días
              </span>
            )}
          </div>

          {isExpanded && (
            <p className={`text-xs leading-relaxed pl-7 font-sans whitespace-pre-wrap mt-2 ${h.completada ? 'text-slate-500' : 'text-slate-400'}`}>
              {h.descripcion}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0 mt-2 sm:mt-0">
        {isEditing ? (
          <button
            onClick={guardarEdicion}
            className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/10 transition-all"
            title="Guardar cambios"
          >
            <Check size={14} />
          </button>
        ) : (
          <>
            <button
              onClick={enviarATareas}
              className="text-violet-400 hover:text-violet-300 p-1.5 rounded-lg hover:bg-violet-500/10 transition-all"
              title="Añadir a tareas del proyecto"
            >
              <PlusCircle size={14} />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-surface-500/30 transition-all"
              title="Editar historia"
            >
              <Pencil size={14} />
            </button>
          </>
        )}
        <button
          onClick={() => dispatch({ type: 'DELETE_STORY', payload: h.id })}
          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
          title="Borrar historia"
        >
          <Trash2 size={14} />
        </button>
      </div>

    </div>
  )
}

function ProyectoGroup({ proyecto, tareas, index, totalProyectos, onAdd, onEdit, onEditProject }) {
  const { state, dispatch } = useTask()
  const col = getProjectColor(proyecto, state.proyectos)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  const [sortField, setSortField] = useState('none') 
  const [sortAsc, setSortAsc] = useState(true)

  // --- Panel de Requerimientos (solo aplica a proyectos de tipo 'Proyecto') ---
  const tipoProyecto = state.proyectos.find(p => p.nombre === proyecto)?.tipo
  const historiasProyecto = (state.historias || []).filter(h => h.proyecto === proyecto)
  const [showRequerimientos, setShowRequerimientos] = useState(false)
  const [creandoHistoria, setCreandoHistoria] = useState(false)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')
  const [nuevaFechaLimite, setNuevaFechaLimite] = useState('')
  const [nuevoResponsable, setNuevoResponsable] = useState('')
  const [nuevoDiasDesarrollo, setNuevoDiasDesarrollo] = useState('')
  const [crearTareaAuto, setCrearTareaAuto] = useState(false)
  const textareaCreateRef = useRef(null)

  useEffect(() => {
    if (textareaCreateRef.current) {
      textareaCreateRef.current.style.height = 'auto'
      textareaCreateRef.current.style.height = `${textareaCreateRef.current.scrollHeight}px`
    }
  }, [nuevaDescripcion])

  const handleCrearHistoria = (e) => {
    e.preventDefault()
    if (!nuevoTitulo.trim()) return

    const nuevaHistoria = {
      id: `us-${Date.now()}`,
      proyecto,
      titulo: nuevoTitulo.trim(),
      descripcion: nuevaDescripcion.trim(),
      completada: false,
      fechaLimite: nuevaFechaLimite,
      responsable: nuevoResponsable,
      diasDesarrollo: nuevoDiasDesarrollo !== '' ? parseInt(nuevoDiasDesarrollo, 10) : null
    }

    dispatch({ type: 'ADD_STORY', payload: nuevaHistoria })

    if (crearTareaAuto) {
      dispatch({ type: 'ADD_TASK', payload: construirTareaDesdeHistoria(nuevaHistoria, proyecto) })
    }

    setNuevoTitulo('')
    setNuevaDescripcion('')
    setNuevaFechaLimite('')
    setNuevoResponsable('')
    setNuevoDiasDesarrollo('')
    setCrearTareaAuto(false)
    setCreandoHistoria(false)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      if (sortAsc) {
        setSortAsc(false)
      } else {
        setSortField('none') 
      }
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const ordenarTareas = (lista) => {
    if (sortField === 'none') return lista
    return [...lista].sort((a, b) => {
      let valA = a[sortField] || ''
      let valB = b[sortField] || ''

      if (sortField === 'fechaInicio' || sortField === 'fechaVencimiento') {
        if (!valA) return 1
        if (!valB) return -1
        return sortAsc 
          ? parseISO(valA).getTime() - parseISO(valB).getTime()
          : parseISO(valB).getTime() - parseISO(valA).getTime()
      }

      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
    })
  }

  const tareasActivas = ordenarTareas(tareas.filter(t => t.estado !== 'Done'))
  const tareasCompletadas = ordenarTareas(tareas.filter(t => t.estado === 'Done'))

  const handleDeleteProject = (e) => {
    e.stopPropagation()
    if (window.confirm(`¿Seguro que deseas eliminar el proyecto "${proyecto}"?\n\n⚠️ ADVERTENCIA: Se borrarán permanentemente todas sus tareas, historias y bugs asociados.`)) {
      dispatch({ type: 'DELETE_PROJECT', payload: proyecto })
    }
  }

  return (
    <div className="mb-6 bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-3.5 bg-surface-800/60 border-b border-white/5 flex justify-between items-center cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="text-slate-400">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: col.accent }} />
          <h3 className="font-display font-bold text-slate-200 text-base">{proyecto}</h3>
          <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
            {tareasActivas.length} activas {tareasCompletadas.length > 0 && `· ${tareasCompletadas.length} hechas`}
          </span>
        </div>
        
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'up' } })} 
            disabled={index === 0} 
            className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Mover arriba"
          >
            <ArrowUp size={16} />
          </button>
          <button 
            onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'down' } })} 
            disabled={index === totalProyectos - 1} 
            className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Mover abajo"
          >
            <ArrowDown size={16} />
          </button>
          <button 
            onClick={() => onAdd(proyecto)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-600 transition-colors"
            title="Añadir tarea"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => onEditProject(proyecto)} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-600 transition-colors"
            title="Editar proyecto/operativa"
          >
            <Pencil size={16} strokeWidth={2.5} />
          </button>
          <button 
            onClick={handleDeleteProject} 
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Eliminar proyecto"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {tipoProyecto === 'Proyecto' && (
            <div className="bg-surface-800/20 border-b border-white/5 overflow-hidden">
              <div
                className="flex items-center justify-between gap-3 px-5 py-3 cursor-pointer select-none hover:bg-white/[0.02] transition-colors"
                onClick={() => setShowRequerimientos(!showRequerimientos)}
              >
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  {showRequerimientos ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                  <BookOpen size={14} className="text-violet-400" /> Requerimientos ({historiasProyecto.length})
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowRequerimientos(true)
                    setCreandoHistoria(!creandoHistoria)
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded"
                >
                  <Plus size={12} />
                  Nuevo Requerimiento
                </button>
              </div>

              {showRequerimientos && (
                <div className="px-5 pb-4 space-y-3 animate-fade-in">
                  {creandoHistoria && (
                    <form onSubmit={handleCrearHistoria} className="bg-surface-700/40 border border-white/5 rounded-xl p-4 space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">Título del Requerimiento</label>
                        <input
                          type="text"
                          autoFocus
                          placeholder="Ej: Exportación a PDF de reportes mensuales..."
                          value={nuevoTitulo}
                          onChange={e => setNuevoTitulo(e.target.value)}
                          className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar size={10} /> Fecha Límite <span className="text-[10px] normal-case font-normal text-slate-500">(Opcional)</span></label>
                          <input
                            type="date"
                            value={nuevaFechaLimite}
                            onChange={e => setNuevaFechaLimite(e.target.value)}
                            className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><User size={10} /> Responsable</label>
                          <select
                            value={nuevoResponsable}
                            onChange={e => setNuevoResponsable(e.target.value)}
                            className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60 cursor-pointer"
                          >
                            <option value="">Sin asignar</option>
                            {ETIQUETAS_OPCIONES.map(opt => (
                              <option key={opt} value={opt} className="bg-surface-700">{opt}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock size={10} /> Días de Desarrollo</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Ej: 5"
                            value={nuevoDiasDesarrollo}
                            onChange={e => setNuevoDiasDesarrollo(e.target.value)}
                            className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 font-medium">Descripción (Historia de Usuario)</label>
                        <textarea
                          ref={textareaCreateRef}
                          placeholder="Ej: Como [rol] quiero [acción] para [beneficio]..."
                          value={nuevaDescripcion}
                          onChange={e => setNuevaDescripcion(e.target.value)}
                          className="w-full bg-surface-600 border border-white/10 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60 resize-none leading-relaxed overflow-hidden min-h-[56px]"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={crearTareaAuto}
                            onChange={e => setCrearTareaAuto(e.target.checked)}
                            className="accent-accent-violet rounded"
                          />
                          Crear también la tarea vinculada automáticamente
                        </label>
                        <button type="submit" className="bg-accent-violet hover:bg-accent-violet/90 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md glow-violet shrink-0">
                          Guardar Historia
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    {historiasProyecto.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-3">No hay requerimientos para este proyecto.</p>
                    ) : (
                      historiasProyecto.map(h => (
                        <HistoriaItem key={h.id} h={h} proyecto={proyecto} dispatch={dispatch} />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tareas.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 italic">No hay tareas en este proyecto. ¡Crea una nueva!</div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_130px_100px_80px_70px_60px] px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-surface-800/20 border-b border-white/4 select-none">
                <div className="cursor-pointer hover:text-slate-300 flex items-center gap-1" onClick={() => handleSort('titulo')}>
                  Tarea {sortField === 'titulo' ? (sortAsc ? '▲' : '▼') : ''}
                </div>
                <div>Estado</div>
                <div className="cursor-pointer hover:text-slate-300 flex items-center gap-1" onClick={() => handleSort('fechaVencimiento')}>
                  Vencimiento {sortField === 'fechaVencimiento' ? (sortAsc ? '▲' : '▼') : ''}
                </div>
                <div className="cursor-pointer hover:text-slate-300 flex items-center gap-1" onClick={() => handleSort('fechaInicio')}>
                  Inicio {sortField === 'fechaInicio' ? (sortAsc ? '▲' : '▼') : ''}
                </div>
                <div>Duración</div>
                <div className="text-end">Acción</div>
              </div>

              <div>
                {tareasActivas.map((tarea, index) => (
                  <TareaRow key={tarea.id} tarea={tarea} i={index} tareasLength={tareasActivas.length} onEdit={onEdit} />
                ))}
                {tareasActivas.length === 0 && tareasCompletadas.length > 0 && (
                  <div className="p-4 text-center text-xs text-slate-500 italic">
                    ¡Todas las tareas de este proyecto están completadas! 🎉
                  </div>
                )}
              </div>

              {tareasCompletadas.length > 0 && (
                <div className="border-t border-white/4 bg-surface-800/10">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-300 transition-colors select-none text-left"
                  >
                    {showCompleted ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                    <span>Mostrar tareas completadas ({tareasCompletadas.length})</span>
                  </button>
                  
                  {showCompleted && (
                    <div className="border-t border-white/4 bg-surface-900/10 animate-fade-in">
                      {tareasCompletadas.map((tarea, index) => (
                        <TareaRow key={tarea.id} tarea={tarea} i={index} tareasLength={tareasCompletadas.length} onEdit={onEdit} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProyectosYTareas() {
  const { state, dispatch } = useTask()
  const [projectModal, setProjectModal] = useState(false)
  const [editProjectObj, setEditProjectObj] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [modal, setModal] = useState(null)

  const grouped = {}
  state.proyectos.forEach(p => { grouped[p.nombre] = [] })
  state.tareas.forEach(t => { if (grouped[t.proyecto]) grouped[t.proyecto].push(t) })

  const abrirEdicionProyecto = (nombreProyecto) => {
    const target = state.proyectos.find(p => p.nombre === nombreProyecto)
    setEditProjectObj(target)
    setProjectModal(true)
  }

  return (
    <div className="p-8 animate-fade-in max-w-7xl mx-auto space-y-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Proyectos y Planificación</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organiza tus objetivos tácticos, gestiona tareas y registra los requerimientos de cada proyecto.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setProjectModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 text-sm font-medium transition-all">
            <Plus size={16} strokeWidth={2.5} /> Nuevo proyecto
          </button>
          <button onClick={() => setAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-violet hover:bg-accent-violet/90 text-white text-sm font-semibold transition-all glow-violet">
            <Plus size={16} strokeWidth={2.5} /> Nueva tarea
          </button>
        </div>
      </div>

      <div className="space-y-10">
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-slate-300 border-b border-white/10 pb-2">📁 Proyectos</h2>
          {state.proyectos.map((p, index) => {
            if (p.tipo !== 'Proyecto') return null;
            return (
              <ProyectoGroup 
                key={p.nombre} 
                proyecto={p.nombre} 
                tareas={grouped[p.nombre] || []} 
                index={index}
                totalProyectos={state.proyectos.length}
                onAdd={(proj) => setModal({ proyecto: proj })} 
                onEdit={(t) => setModal({ editTask: t })} 
                onEditProject={abrirEdicionProyecto}
              />
            )
          })}
          {state.proyectos.filter(p => p.tipo === 'Proyecto').length === 0 && (
            <p className="text-xs text-slate-500 italic pl-2">No hay elementos en la categoría Proyectos.</p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold text-slate-300 border-b border-white/10 pb-2">⚙️ Operativa</h2>
          {state.proyectos.map((p, index) => {
            if (p.tipo !== 'Operativa') return null;
            return (
              <ProyectoGroup 
                key={p.nombre} 
                proyecto={p.nombre} 
                tareas={grouped[p.nombre] || []} 
                index={index}
                totalProyectos={state.proyectos.length}
                onAdd={(proj) => setModal({ proyecto: proj })} 
                onEdit={(t) => setModal({ editTask: t })} 
                onEditProject={abrirEdicionProyecto}
              />
            )
          })}
          {state.proyectos.filter(p => p.tipo === 'Operativa').length === 0 && (
            <p className="text-xs text-slate-500 italic pl-2">No hay elementos en la categoría Operativa.</p>
          )}
        </div>
      </div>

      {addModal && <TaskModal onClose={() => setAddModal(false)} />}
      {projectModal && (
        <ProjectModal 
          onClose={() => { setProjectModal(false); setEditProjectObj(null); }} 
          editProject={editProjectObj} 
        />
      )}
      {modal && !modal.editTask && <TaskModal initialProyecto={modal.proyecto} onClose={() => setModal(null)} />}
      {modal?.editTask && <TaskModal editTask={modal.editTask} onClose={() => setModal(null)} />}
    </div>
  )
}