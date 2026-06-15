import React, { useState, useEffect, useRef } from 'react'
import { BookOpen, Plus, Trash2, ChevronDown, ChevronRight, PlusCircle, Pencil, Check } from 'lucide-react'
import { useTask, getProjectColor } from '../context/TaskContext'

function ProyectoHistoriaGroup({ proyecto, historias }) {
  const { dispatch } = useTask()
  const col = getProjectColor(proyecto)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Estados para edición en línea de la historia
  const [editingId, setEditingId] = useState(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')

  // Referencia para la altura dinámica al EDITAR
  const textareaEditRef = useRef(null)

  // Efecto que ajusta la altura al escribir o al abrir el modo edición
  useEffect(() => {
    if (textareaEditRef.current) {
      textareaEditRef.current.style.height = 'auto'
      textareaEditRef.current.style.height = `${textareaEditRef.current.scrollHeight}px`
    }
  }, [editDescripcion, editingId])

  const iniciarEdicion = (h) => {
    setEditingId(h.id)
    setEditTitulo(h.titulo)
    setEditDescripcion(h.descripcion)
  }

  const guardarEdicion = (id) => {
    if (!editTitulo.trim()) return
    dispatch({
      type: 'UPDATE_STORY', 
      payload: { id, proyecto, titulo: editTitulo.trim(), descripcion: editDescripcion.trim() }
    })
    setEditingId(null)
  }

  // Sincronización cruzada: Crear una tarea a partir de esta historia
  const enviarATareas = (h) => {
    const confirmacion = window.confirm(`¿Quieres crear una tarea en el proyecto "${proyecto}" basada en este requerimiento?`)
    if (!confirmacion) return

    dispatch({
      type: 'ADD_TASK',
      payload: {
        id: `task-${Date.now()}`,
        titulo: h.titulo,
        proyecto: proyecto,
        estado: 'To Do',
        etiqueta: 'Sin etiqueta',
        historia: h.descripcion,
        checklist: [],
        notas: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaVencimiento: ''
      }
    })
    alert('¡Tarea añadida y sincronizada con éxito en Proyectos!')
  }

  return (
    <div className="mb-6 bg-surface-700/30 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      {/* Cabecera del Grupo de Proyecto */}
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-5 py-3.5 bg-surface-800/60 border-b border-white/5 flex justify-between items-center cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="text-slate-400">
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </div>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.accent }} />
          <h3 className="font-display font-bold text-slate-200 text-base">{proyecto}</h3>
          <span className="text-xs font-mono text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
            {historias.length} {historias.length === 1 ? 'requerimiento' : 'requerimientos'}
          </span>
        </div>
      </div>

      {/* Listado de Historias del Proyecto */}
      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {historias.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2">No hay historias de usuario en este proyecto.</p>
          ) : (
            historias.map(h => (
              <div key={h.id} className="bg-surface-700/40 border border-white/5 rounded-xl p-4 flex justify-between items-start gap-4 hover:border-white/10 transition-colors">
                
                {editingId === h.id ? (
                  <div className="space-y-2 flex-1">
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
                  </div>
                ) : (
                  <div className="space-y-1.5 flex-1">
                    <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-500 shrink-0" />
                      {h.titulo}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed pl-5 font-sans whitespace-pre-wrap">{h.descripcion}</p>
                  </div>
                )}

                {/* BOTONERA DE ACCIÓN MUTUA */}
                <div className="flex items-center gap-1 shrink-0">
                  {editingId === h.id ? (
                    <button 
                      onClick={() => guardarEdicion(h.id)}
                      className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded-lg hover:bg-emerald-500/10 transition-all"
                      title="Guardar cambios"
                    >
                      <Check size={14} />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => enviarATareas(h)}
                        className="text-violet-400 hover:text-violet-300 p-1.5 rounded-lg hover:bg-violet-500/10 transition-all"
                        title="Añadir a tareas del proyecto"
                      >
                        <PlusCircle size={14} />
                      </button>
                      <button 
                        onClick={() => iniciarEdicion(h)}
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
  const [proyecto, setProyecto] = useState(state.proyectos[0] || '')

  // Referencia para la altura dinámica al CREAR
  const textareaCreateRef = useRef(null)

  // Efecto que ajusta la altura al escribir un nuevo requerimiento
  useEffect(() => {
    if (textareaCreateRef.current) {
      textareaCreateRef.current.style.height = 'auto'
      textareaCreateRef.current.style.height = `${textareaCreateRef.current.scrollHeight}px`
    }
  }, [descripcion])

  const groupedHistorias = {}
  state.proyectos.forEach(p => { groupedHistorias[p] = [] })
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
        descripcion: descripcion.trim() 
      }
    })
    setTitulo('')
    setDescripcion('')
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

      {/* Formulario de creación */}
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
              {state.proyectos.map(p => <option key={p} value={p} className="bg-surface-700">{p}</option>)}
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

        {/* Textarea dinámico de creación */}
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
        {Object.entries(groupedHistorias).map(([proyectoName, historiasList]) => (
          <ProyectoHistoriaGroup 
            key={proyectoName} 
            proyecto={proyectoName} 
            historias={historiasList} 
          />
        ))}
      </div>

    </div>
  )
}