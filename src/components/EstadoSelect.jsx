import React from 'react'
import { useApp, ESTADOS, ESTADO_CONFIG } from '../context/AppContext'

export default function EstadoSelect({ requisito }) {
  const { dispatch } = useApp()
  const cfg = ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']

  return (
    <select
      value={requisito.estado}
      onClick={e => e.stopPropagation()}
      onChange={e => dispatch({ type: 'UPDATE_ESTADO', payload: { id: requisito.id, estado: e.target.value } })}
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
