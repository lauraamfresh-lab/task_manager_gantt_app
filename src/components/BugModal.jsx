import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useApp as useTask } from '../context/AppContext'

export default function BugModal({ onClose, editBug }) {
  const { state, dispatch } = useTask()
  
  const [titulo, setTitulo] = useState(editBug ? editBug.titulo : '')
  const [descripcion, setDescripcion] = useState(editBug ? editBug.descripcion : '')
  const [proyecto, setProyecto] = useState(editBug ? editBug.proyecto : state.proyectos[0]?.nombre || '')
  const [prioridad, setPrioridad] = useState(editBug ? editBug.prioridad : 'Media')
  const [estado, setEstado] = useState(editBug ? editBug.estado : 'Abierto')
  // 1. Añadimos el estado para el reportero
  const [reportadoPor, setReportadoPor] = useState(editBug ? editBug.reportadoPor : '')

  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('El título del error es obligatorio')
      return
    }
    // Validación opcional por si quieres obligar a poner un nombre de contacto
    if (!reportadoPor.trim()) {
      setError('Es obligatorio indicar quién reportó el error para el seguimiento')
      return
    }

    const bugData = {
      id: editBug ? editBug.id : 'bug-' + Date.now(),
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      proyecto,
      prioridad,
      estado,
      reportadoPor: reportadoPor.trim(), // 2. Lo adjuntamos a la data
      fechaReporte: editBug ? editBug.fechaReporte : new Date().toISOString().split('T')[0]
    }

    if (editBug) {
      dispatch({ type: 'UPDATE_BUG', payload: bugData })
    } else {
      dispatch({ type: 'ADD_BUG', payload: bugData })
    }
    onClose()
  }

  const inputCls = "w-full bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-violet/60 transition-colors"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface-700 border border-white/10 rounded-2xl shadow-2xl animate-slide-in">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-display font-semibold text-slate-100">
            {editBug ? 'Editar Reporte de Error' : 'Reportar un Error / Bug'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Título del error</label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="ej: El botón de descarga no responde"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Descripción o pasos para reproducir</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Qué ocurre, comportamiento esperado..."
              className={`${inputCls} h-20 resize-none`}
            />
          </div>

          {/* 3. NUEVO INPUT: Persona de contacto */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Reportado por / Persona de contacto</label>
            <input
              type="text"
              value={reportadoPor}
              onChange={e => setReportadoPor(e.target.value)}
              placeholder="ej: Laura, Cliente X, Soporte"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Proyecto afectado</label>
            <select value={proyecto} onChange={e => setProyecto(e.target.value)} className={inputCls}>
              {state.proyectos.map(p => <option key={p.nombre} value={p.nombre} className="bg-surface-700">{p.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Prioridad</label>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className={inputCls}>
                <option value="Baja" className="bg-surface-700">Baja</option>
                <option value="Media" className="bg-surface-700">Media</option>
                <option value="Alta" className="bg-surface-700">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Estado inicial</label>
              <select value={estado} onChange={e => setEstado(e.target.value)} className={inputCls}>
                <option value="Abierto" className="bg-surface-700">Abierto</option>
                <option value="En Progreso" className="bg-surface-700">En Progreso</option>
                <option value="Resuelto" className="bg-surface-700">Resuelto</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-slate-400 hover:text-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-lg shadow-rose-950/20"
            >
              {editBug ? 'Guardar Cambios' : 'Registrar Bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}