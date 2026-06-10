import React, { useState, useEffect } from 'react'
import { X, FileText, Calendar, Tag, Briefcase, Link2 } from 'lucide-react'
import { useTask, ESTADOS, ETIQUETAS_OPCIONES } from '../context/TaskContext'

export default function TaskModal({ editTask, initialProyecto, onClose, onSave }) {
  const { state, dispatch } = useTask()
  
  // Estados del formulario
  const [titulo, setTitulo] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [estado, setEstado] = useState('To Do')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [etiqueta, setEtiqueta] = useState('Laura') // Valor inicial por defecto de tus opciones
  const [notas, setNotas] = useState('')
  const [linkDocumento, setLinkDocumento] = useState('') // Nuevo campo para el enlace
  const [sincronizarHistoria, setSincronizarHistoria] = useState(false)

  useEffect(() => {
    if (state.proyectos.length > 0) {
      setProyecto(initialProyecto || state.proyectos[0])
    }

    if (editTask) {
      setTitulo(editTask.titulo || '')
      setProyecto(editTask.proyecto || '')
      setEstado(editTask.estado || 'To Do')
      setFechaInicio(editTask.fechaInicio || '')
      setFechaVencimiento(editTask.fechaVencimiento || '')
      setEtiqueta(editTask.etiqueta || 'Laura')
      setNotas(editTask.notas || '')
      setLinkDocumento(editTask.linkDocumento || '')
      setSincronizarHistoria(!!editTask.historia)
    }
  }, [editTask, initialProyecto, state.proyectos])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titulo.trim() || !proyecto) return

    const taskData = {
      titulo: titulo.trim(),
      proyecto,
      estado,
      fechaInicio: fechaInicio || null, 
      fechaVencimiento: fechaVencimiento || null,
      etiqueta,
      notas: notas.trim(),
      linkDocumento: linkDocumento.trim() || null, // Guardamos el enlace de forma segura
      historia: sincronizarHistoria ? notas.trim() : null
    }

    if (editTask) {
      dispatch({ type: 'UPDATE_TASK', payload: { id: editTask.id, ...taskData } })
    } else {
      dispatch({
        type: 'ADD_TASK',
        payload: {
          id: Date.now().toString(),
          enMiDia: false,
          checklist: [],
          ...taskData
        }
      })
      
      if (sincronizarHistoria && onSave) {
        onSave(taskData)
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-800 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-surface-850">
          <h2 className="text-lg font-display font-bold text-slate-200">
            {editTask ? 'Editar Tarea' : 'Crear Nueva Tarea'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/5 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Título de la tarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Título de la tarea</label>
            <input
              type="text"
              required
              placeholder="Ej: Diseñar el nuevo flujo de checkout"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-surface-700 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-violet/50 transition-colors"
            />
          </div>

          {/* 1. Cambio: Estado del formulario siempre visible debajo del título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estado de la Tarea</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full bg-surface-700 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
            >
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Fila: Proyecto y Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Briefcase size={12} /> Proyecto</label>
              <select
                value={proyecto}
                onChange={(e) => setProyecto(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              >
                {state.proyectos.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* 2. Cambio: Responsable convertido a desplegable usando ETIQUETAS_OPCIONES */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Tag size={12} /> Responsable</label>
              <select
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              >
                {ETIQUETAS_OPCIONES.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Cambio: Campo para pegar un enlace (Documento/OneDrive/SharePoint) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Link2 size={12} /> Enlace del Documentación / Adjunto
            </label>
            <input
              type="url"
              placeholder="Ej: https://onedrive.live.com/..."
              value={linkDocumento}
              onChange={(e) => setLinkDocumento(e.target.value)}
              className="w-full bg-surface-700 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-violet/50"
            />
          </div>

          {/* Caja de Historia de Usuario / Requerimiento */}
          <div className="space-y-1.5 bg-surface-750 p-3.5 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-accent-violet flex items-center gap-1.5">
                <FileText size={13} /> Requerimiento o Notas
              </label>
              
              {!editTask && (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={sincronizarHistoria} 
                    onChange={(e) => setSincronizarHistoria(e.target.checked)}
                    className="accent-accent-violet rounded"
                  />
                  ¿Duplicar en módulo Historias?
                </label>
              )}
            </div>
            <textarea
              placeholder="Como [usuario], quiero [acción] para [beneficio]... o detalles de la tarea."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full h-24 bg-surface-700/60 text-xs text-slate-300 placeholder-slate-600 border border-white/5 rounded-lg p-3 focus:outline-none focus:border-accent-violet/40 resize-none leading-relaxed"
            />
          </div>

          {/* Fila: Tiempos y Planificación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar size={12} /> Inicio <span className="text-[10px] font-normal normal-case text-slate-500">(Opcional)</span>
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar size={12} /> Vencimiento
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/5 text-slate-400 hover:text-slate-200 text-sm font-medium hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-accent-violet hover:bg-accent-violet/90 text-white text-sm font-semibold transition-all glow-violet"
            >
              {editTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}