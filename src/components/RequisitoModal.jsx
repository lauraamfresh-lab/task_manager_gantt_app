import React, { useState, useEffect } from 'react'
import { X, FileText, Calendar, Tag, Briefcase, Link2, BookOpen, GitBranch } from 'lucide-react'
import { useApp, ESTADOS, ETIQUETAS_OPCIONES, PRIORIDADES, PRIORIDAD_CONFIG } from '../context/AppContext'

export default function RequisitoModal({ editRequisito, initialProyecto, onClose }) {
  const { state, dispatch } = useApp()

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [proyecto, setProyecto] = useState('')
  const [estado, setEstado] = useState('To Do')
  const [prioridad, setPrioridad] = useState('Media')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [responsable, setResponsable] = useState('Laura')
  const [notas, setNotas] = useState('')
  const [linkDocumento, setLinkDocumento] = useState('')
  const [dependencias, setDependencias] = useState([])

  useEffect(() => {
    if (state.proyectos.length > 0) {
      setProyecto(initialProyecto || state.proyectos[0].nombre)
    }

    if (editRequisito) {
      setTitulo(editRequisito.titulo || '')
      setDescripcion(editRequisito.descripcion || '')
      setProyecto(editRequisito.proyecto || '')
      setEstado(editRequisito.estado || 'To Do')
      setPrioridad(editRequisito.prioridad || 'Media')
      setFechaInicio(editRequisito.fechaInicio || '')
      setFechaVencimiento(editRequisito.fechaVencimiento || '')
      setResponsable(editRequisito.responsable || 'Laura')
      setNotas(editRequisito.notas || '')
      setLinkDocumento(editRequisito.linkDocumento || '')
      setDependencias(editRequisito.dependencias || [])
    }
  }, [editRequisito, initialProyecto, state.proyectos])

  const requisitosDelProyecto = state.requisitos.filter(r =>
    r.proyecto === proyecto && (!editRequisito || r.id !== editRequisito.id)
  )

  const toggleDependencia = (id) => {
    setDependencias(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titulo.trim() || !proyecto) return

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      proyecto,
      estado,
      prioridad,
      fechaInicio: fechaInicio || '',
      fechaVencimiento: fechaVencimiento || '',
      responsable,
      notas: notas.trim(),
      linkDocumento: linkDocumento.trim() || '',
      dependencias
    }

    if (editRequisito) {
      dispatch({ type: 'UPDATE_REQUISITO', payload: { id: editRequisito.id, ...payload } })
    } else {
      dispatch({ type: 'ADD_REQUISITO', payload: { checklist: [], enMiDia: false, sprintId: null, ...payload } })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-surface-800 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">

        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-surface-850">
          <h2 className="text-lg font-display font-bold text-slate-200">
            {editRequisito ? 'Editar Requisito' : 'Crear Nuevo Requisito'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/5 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Título</label>
            <input
              type="text"
              required
              placeholder="Ej: Diseñar el nuevo flujo de checkout"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-surface-700 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-violet/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              >
                {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              >
                {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDAD_CONFIG[p].label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Briefcase size={12} /> Proyecto</label>
              <select
                value={proyecto}
                onChange={(e) => setProyecto(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              >
                {state.proyectos.map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Tag size={12} /> Responsable</label>
              <select
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="w-full bg-surface-700 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-accent-violet/50 cursor-pointer"
              >
                {ETIQUETAS_OPCIONES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Link2 size={12} /> Enlace de documentación / adjunto
            </label>
            <input
              type="url"
              placeholder="Ej: https://onedrive.live.com/..."
              value={linkDocumento}
              onChange={(e) => setLinkDocumento(e.target.value)}
              className="w-full bg-surface-700 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent-violet/50"
            />
          </div>

          <div className="space-y-1.5 bg-violet-950/10 p-3.5 rounded-xl border border-violet-500/10">
            <label className="text-xs font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <BookOpen size={13} /> Descripción / Historia de usuario
            </label>
            <textarea
              placeholder="Ej: Como [rol] quiero [acción] para [beneficio]..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full h-20 bg-surface-700/60 text-xs text-slate-300 placeholder-slate-600 border border-white/5 rounded-lg p-3 focus:outline-none focus:border-violet-500/40 resize-none leading-relaxed"
            />
          </div>

          {requisitosDelProyecto.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GitBranch size={13} /> Depende de <span className="text-[10px] font-normal normal-case text-slate-500">(Opcional)</span>
              </label>
              <div className="max-h-28 overflow-y-auto space-y-1 bg-surface-700/40 border border-white/5 rounded-xl p-2">
                {requisitosDelProyecto.map(r => (
                  <label key={r.id} className="flex items-center gap-2 text-xs text-slate-300 px-1.5 py-1 rounded hover:bg-white/5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={dependencias.includes(r.id)}
                      onChange={() => toggleDependencia(r.id)}
                      className="accent-accent-violet rounded"
                    />
                    <span className="truncate">{r.titulo}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5 bg-surface-750 p-3.5 rounded-xl border border-white/5">
            <label className="text-xs font-semibold uppercase tracking-wider text-accent-violet flex items-center gap-1.5">
              <FileText size={13} /> Notas
            </label>
            <textarea
              placeholder="Detalles, contexto o comentarios..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full h-20 bg-surface-700/60 text-xs text-slate-300 placeholder-slate-600 border border-white/5 rounded-lg p-3 focus:outline-none focus:border-accent-violet/40 resize-none leading-relaxed"
            />
          </div>

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
              {editRequisito ? 'Guardar Cambios' : 'Crear Requisito'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
