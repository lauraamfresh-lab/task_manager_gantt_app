import React from 'react'
import { useApp, ESTADOS, ESTADO_CONFIG } from '../context/AppContext'

export default function EstadoSelect({ requisito, onChange }) {
  const { dispatch } = useApp()
  const cfg = ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']

  const handleChange = (e) => {
    const estado = e.target.value
    if (onChange) {
      onChange(estado)
    } else {
      dispatch({ type: 'UPDATE_REQUISITO', payload: { id: requisito.id, estado } })
    }
  }

  return (
    <select
      value={requisito.estado}
      onChange={handleChange}
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
