import React, { useState, useEffect, useRef } from 'react'
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight, PlusCircle, Pencil, Check, Circle, ArrowUp, ArrowDown, Calendar, User, Clock } from 'lucide-react'
import { useTask, getProjectColor, ETIQUETAS_OPCIONES } from '../context/TaskContext'
import { addDays, format, parseISO } from 'date-fns'

function HistoriaItem({ h, proyecto, dispatch }) {
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

    // Bug 6 fix: compute fechaInicio from fechaLimite - diasDesarrollo
    let fechaInicio = format(new Date(), 'yyyy-MM-dd')
    if (h.fechaLimite && h.diasDesarrollo > 0) {
      try {
        fechaInicio = format(addDays(parseISO(h.fechaLimite), -h.diasDesarrollo), 'yyyy-MM-dd')
      } catch { /* keep today */ }
    }

    dispatch({
      type: 'ADD_TASK',
      payload: {
        titulo: h.titulo,
        proyecto: proyecto,
        estado: 'To Do',
        etiqueta: h.responsable || 'Sin asignar',
        historia: h.descripcion,
        historiaId: h.id,   // Bug 2 fix: stamp foreign key
        checklist: [],
        notas: '',
        enMiDia: false,
        fechaInicio,
        fechaVencimiento: h.fechaLimite || ''
      }
    })
    alert('¡Tarea añadida y sincronizada con éxito en Proyectos!')
  }

  const tareaVinculada = tareas.find(t => t.historiaId === h.id)

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
          <div className="grid grid-cols-2 gap-2">
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

function ProyectoHistoriaGroup({ proyecto, historias, index, totalProyectos }) {
  const { state, dispatch } = useTask()
  const col = getProjectColor(proyecto, state.proyectos)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const historiasCompletadas = historias.filter(h => h.completada).length

  return (
    <div className="mb-6 bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-3.5 bg-surface-800/60 border-b border-white/5 flex flex-wrap justify-between items-center cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 flex-1">
          <div className="text-slate-400">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.accent }} />
          <h3 className="font-display font-bold text-slate-200 text-base">{proyecto}</h3>

          <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${historiasCompletadas === historias.length && historias.length > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>
            {historiasCompletadas} / {historias.length}
          </span>
        </div>

        <div className="flex items-center gap-1 ml-4" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'up' } })}
            disabled={index === 0}
            className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Mover proyecto arriba"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={() => dispatch({ type: 'MOVE_PROJECT', payload: { index, direction: 'down' } })}
            disabled={index === totalProyectos - 1}
            className="p-1 text-slate-500 hover:text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Mover proyecto abajo"
          >
            <ArrowDown size={16} />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {historias.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2">No hay historias de usuario en este proyecto.</p>
          ) : (
            historias.map(h => (
              <HistoriaItem key={h.id} h={h} proyecto={proyecto} dispatch={dispatch} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Historias() {
  const { state, dispatch } = useTask()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [responsable, setResponsable] = useState('')

  const textareaCreateRef = useRef(null)

  const proyectosFiltrados = state.proyectos.filter(p => p.tipo === 'Proyecto')

  useEffect(() => {
    if (proyectosFiltrados.length > 0 && !proyecto) {
      setProyecto(proyectosFiltrados[0].nombre)
    }
  }, [state.proyectos, proyectosFiltrados, proyecto])

  useEffect(() => {
    if (textareaCreateRef.current) {
      textareaCreateRef.current.style.height = 'auto'
      textareaCreateRef.current.style.height = `${textareaCreateRef.current.scrollHeight}px`
    }
  }, [descripcion])

  const groupedHistorias = {}
  proyectosFiltrados.forEach(p => { groupedHistorias[p.nombre] = [] })
  if (state.historias) {
    state.historias.forEach(h => {
      if (groupedHistorias[h.proyecto]) {
        groupedHistorias[h.proyecto].push(h)
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titulo.trim() || !proyecto) return

    dispatch({
      type: 'ADD_STORY',
      payload: {
        id: `us-${Date.now()}`,
        proyecto,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        completada: false,
        fechaLimite,
        responsable
      }
    })
    setTitulo('')
    setDescripcion('')
    setFechaLimite('')
    setResponsable('')
  }

  return (
    <div className="p-8 animate-fade-in max-w-5xl mx-auto space-y-8 text-slate-100">

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <BookOpen size={18} className="text-accent-violet" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Historias de Usuario</h1>
          <p className="text-sm text-slate-500 mt-0.5">Requerimientos funcionales organizados por proyecto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-700/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Plus size={14} /> Nuevo Requerimiento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Proyecto Vinculado</label>
            <select
              value={proyecto}
              onChange={e => setProyecto(e.target.value)}
              className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60 cursor-pointer"
            >
              {proyectosFiltrados.map(p => <option key={p.nombre} value={p.nombre} className="bg-surface-700">{p.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs text-slate-400 font-medium">Título del Requerimiento</label>
            <input
              type="text"
              placeholder="Ej: Exportación a PDF de reportes mensuales..."
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><Calendar size={10} /> Fecha Límite <span className="text-[10px] normal-case font-normal text-slate-500">(Opcional)</span></label>
            <input
              type="date"
              value={fechaLimite}
              onChange={e => setFechaLimite(e.target.value)}
              className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><User size={10} /> Responsable</label>
            <select
              value={responsable}
              onChange={e => setResponsable(e.target.value)}
              className="w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60 cursor-pointer"
            >
              <option value="">Sin asignar</option>
              {ETIQUETAS_OPCIONES.map(opt => (
                <option key={opt} value={opt} className="bg-surface-700">{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium">Descripción (Historia de Usuario)</label>
          <textarea
            ref={textareaCreateRef}
            placeholder="Ej: Como [rol] quiero [acción] para [beneficio]..."
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="w-full bg-surface-600 border border-white/10 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-accent-violet/60 resize-none leading-relaxed overflow-hidden min-h-[56px]"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="bg-accent-violet hover:bg-accent-violet/90 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-all shadow-md glow-violet">
            Guardar Historia
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {state.proyectos.map((pObj, index) => {
          if (pObj.tipo !== 'Proyecto') return null;
          return (
            <ProyectoHistoriaGroup
              key={pObj.nombre}
              proyecto={pObj.nombre}
              historias={groupedHistorias[pObj.nombre] || []}
              index={index}
              totalProyectos={state.proyectos.length}
            />
          )
        })}
      </div>

    </div>
  )
}