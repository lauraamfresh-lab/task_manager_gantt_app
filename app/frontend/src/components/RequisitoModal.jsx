import React, { useState, useEffect } from 'react'
import { X, FileText, Calendar, Tag, Briefcase, Link2, AlertTriangle, GitBranch } from 'lucide-react'
import { useApp, ESTADOS, PRIORIDADES, RESPONSABLES_OPCIONES } from '../context/AppContext'

export default function RequisitoModal({ editRequisito, initialProyectoId, initialFaseId, onClose }) {
  const { state, dispatch } = useApp()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [proyectoId, setProyectoId] = useState('')
  const [estado, setEstado] = useState('To Do')
  const [prioridad, setPrioridad] = useState('Media')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [responsable, setResponsable] = useState('')
  const [notas, setNotas] = useState('')
  const [linkDocumento, setLinkDocumento] = useState('')
  const [dependencias, setDependencias] = useState([])

  useEffect(() => {
    if (state.proyectos.length > 0 && !editRequisito) {
      setProyectoId(initialProyectoId || state.proyectos[0].id)
    }

    if (editRequisito) {
      setTitulo(editRequisito.titulo || '')
      setDescripcion(editRequisito.descripcion || '')
      setProyectoId(editRequisito.proyectoId || '')
      setEstado(editRequisito.estado || 'To Do')
      setPrioridad(editRequisito.prioridad || 'Media')
      setFechaInicio(editRequisito.fechaInicio || '')
      setFechaVencimiento(editRequisito.fechaVencimiento || '')
      setResponsable(editRequisito.responsable || '')
      setNotas(editRequisito.notas || '')
      setLinkDocumento(editRequisito.linkDocumento || '')
      setDependencias(editRequisito.dependencias || [])
    }
  }, [editRequisito, initialProyectoId, state.proyectos])

  const requisitosDelProyecto = state.requisitos.filter(r => r.proyectoId === proyectoId && r.id !== editRequisito?.id)

  const toggleDependencia = (id) => {
    setDependencias(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titulo.trim() || !proyectoId) return

    const data = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      proyectoId,
      estado,
      prioridad,
      fechaInicio,
      fechaVencimiento,
      responsable,
      notas,
      linkDocumento,
      dependencias
    }

    if (editRequisito) {
      dispatch({ type: 'UPDATE_REQUISITO', payload: { id: editRequisito.id, ...data } })
    } else {
      dispatch({ type: 'ADD_REQUISITO', payload: { ...data, faseId: initialFaseId ?? null, checklist: [], enMiDia: false } })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={handleSubmit} className="bg-surface-800 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-slate-100">
            {editRequisito ? 'Editar requisito' : 'Nuevo requisito'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <input
          type="text"
          placeholder="Título del requisito"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          required
          className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent-violet/50"
        />

        <textarea
          placeholder="Descripción (opcional) — qué se necesita y por qué"
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          rows={2}
          className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-accent-violet/50 resize-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><Briefcase size={12} /> Proyecto</label>
            <select value={proyectoId} onChange={e => setProyectoId(e.target.value)} className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
              {state.proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><Tag size={12} /> Estado</label>
            <select value={estado} onChange={e => setEstado(e.target.value)} className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><AlertTriangle size={12} /> Prioridad</label>
            <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
              {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Responsable</label>
            <select value={responsable} onChange={e => setResponsable(e.target.value)} className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
              <option value="">Sin asignar</option>
              {RESPONSABLES_OPCIONES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12} /> Fecha inicio</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12} /> Fecha vencimiento</label>
            <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-500 flex items-center gap-1"><Link2 size={12} /> Enlace a documento</label>
          <input type="url" value={linkDocumento} onChange={e => setLinkDocumento(e.target.value)} placeholder="https://..." className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-500 flex items-center gap-1"><FileText size={12} /> Notas</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} className="w-full bg-surface-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none" />
        </div>

        {requisitosDelProyecto.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs text-slate-500 flex items-center gap-1"><GitBranch size={12} /> Depende de (opcional)</label>
            <div className="max-h-28 overflow-y-auto space-y-1 border border-white/5 rounded-lg p-2">
              {requisitosDelProyecto.map(r => (
                <label key={r.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={dependencias.includes(r.id)} onChange={() => toggleDependencia(r.id)} className="accent-accent-violet" />
                  {r.titulo}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancelar</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-accent-violet text-white hover:bg-accent-violet/90">
            {editRequisito ? 'Guardar' : 'Crear requisito'}
          </button>
        </div>
      </form>
    </div>
  )
}
