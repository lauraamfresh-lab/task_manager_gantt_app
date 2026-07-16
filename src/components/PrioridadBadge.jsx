import React from 'react'
import { useApp, PRIORIDADES, PRIORIDAD_CONFIG } from '../context/AppContext'

// editable=true -> <select> que permite cambiar la prioridad in-place (listas, filas)
// editable=false -> badge de solo lectura (paneles compactos, tarjetas de informe)
export default function PrioridadBadge({ requisito, editable = true }) {
  const { dispatch } = useApp()
  const cfg = PRIORIDAD_CONFIG[requisito.prioridad] || PRIORIDAD_CONFIG['Media']

  if (!editable) {
    return (
      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
        {cfg.label}
      </span>
    )
  }

  return (
    <select
      value={requisito.prioridad || 'Media'}
      onClick={e => e.stopPropagation()}
      onChange={e => dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, prioridad: e.target.value } })}
      className={`text-[10px] font-semibold rounded-full pl-2 pr-1 py-0.5 border cursor-pointer focus:outline-none transition-all bg-transparent ${cfg.color} ${cfg.border}`}
    >
      {PRIORIDADES.map(p => (
        <option key={p} value={p} className="bg-surface-700 text-slate-200">
          {PRIORIDAD_CONFIG[p].label}
        </option>
      ))}
    </select>
  )
}
