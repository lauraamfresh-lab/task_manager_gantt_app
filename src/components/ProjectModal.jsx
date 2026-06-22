import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useTask } from '../context/TaskContext'

export default function ProjectModal({ onClose, editProjectName }) {
  const { dispatch, state } = useTask()
  const [name, setName] = useState(editProjectName || '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('El nombre del proyecto es requerido')
      return
    }
    if (trimmedName !== editProjectName && state.proyectos.includes(trimmedName)) {
      setError('Este proyecto ya existe')
      return
    }
    
    if (editProjectName) {
      dispatch({ type: 'UPDATE_PROJECT', payload: { oldName: editProjectName, newName: trimmedName } })
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: trimmedName })
    }
    onClose()
  }

  const inputCls = `w-full bg-surface-600 border ${error ? 'border-rose-500/60' : 'border-white/10'} rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-violet/60 transition-colors`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface-700 border border-white/10 rounded-2xl shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="font-display font-semibold text-slate-100">
            {editProjectName ? 'Editar proyecto' : 'Nuevo proyecto'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre del proyecto</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="ej: Marketing Q3"
              className={inputCls}
              autoFocus
                />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent-violet hover:bg-accent-violet/90 text-white transition-all glow-violet"
            >
              {editProjectName ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}