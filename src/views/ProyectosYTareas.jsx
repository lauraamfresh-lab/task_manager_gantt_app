import React, { useState } from 'react'
import { format, parseISO, isPast, isToday, differenceInDays } from 'date-fns'
import { Plus, ExternalLink, Trash2, Pencil, ChevronDown, ChevronRight, CheckSquare, Square, FileText, Sun } from 'lucide-react'
import { useTask, ESTADOS, ESTADO_CONFIG, getProjectColor } from '../context/TaskContext'
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

function ProyectoGroup({ proyecto, tareas, onAdd, onEdit }) {
  const { dispatch } = useTask()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)

  const [sortField, setSortField] = useState('none') 
  const [sortAsc, setSortAsc] = useState(true)

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
          {/* MODIFICADO: Ahora el punto/bolita siempre es verde esmeralda */}
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <h3 className="font-display font-bold text-slate-200 text-base">{proyecto}</h3>
          <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
            {tareasActivas.length} activas {tareasCompletadas.length > 0 && `· ${tareasCompletadas.length} hechas`}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onAdd(proyecto); }} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-600 transition-colors"
            title="Añadir tarea"
          >
            <Plus size={16} strokeWidth={2.5} />
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
  const [addModal, setAddModal] = useState(false)
  const [modal, setModal] = useState(null)

  const grouped = {}
  if (state?.proyectos) state.proyectos.forEach(p => { grouped[p] = [] })
  if (state?.tareas) state.tareas.forEach(t => { if (grouped[t.proyecto]) grouped[t.proyecto].push(t) })

  const interceptarNuevaTarea = (nuevaTarea) => {
    if (nuevaTarea.historia && nuevaTarea.historia.trim() !== '') {
      dispatch({
        type: 'ADD_STORY',
        payload: {
          proyecto: nuevaTarea.proyecto,
          titulo: `Req: ${nuevaTarea.titulo}`,
          descripcion: nuevaTarea.historia
        }
      })
    }
  }

  return (
    <div className="p-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Proyectos y Planificación</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organiza tus objetivos tácticos separando el trabajo pendiente del completado.
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

      <div>
        {Object.entries(grouped).map(([proyecto, tareas]) => (
          <ProyectoGroup key={proyecto} proyecto={proyecto} tareas={tareas} onAdd={(p) => setModal({ proyecto: p })} onEdit={(t) => setModal({ editTask: t })} />
        ))}
      </div>

      {addModal && <TaskModal onClose={() => setAddModal(false)} onSave={interceptarNuevaTarea} />}
      {projectModal && <ProjectModal onClose={() => setProjectModal(false)} />}
      {modal && !modal.editTask && <TaskModal initialProyecto={modal.proyecto} onClose={() => setModal(null)} onSave={interceptarNuevaTarea} />}
      {modal?.editTask && <TaskModal editTask={modal.editTask} onClose={() => setModal(null)} />}
    </div>
  )
}