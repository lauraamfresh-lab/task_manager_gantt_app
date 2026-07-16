import React from 'react'
import { Flame, AlertCircle, ShieldAlert } from 'lucide-react'
import { PRIORIDAD_CONFIG } from '../context/AppContext'

const ICONS = { Alta: Flame, Media: AlertCircle, Baja: ShieldAlert }

export default function PrioridadBadge({ prioridad, size = 11 }) {
  const cfg = PRIORIDAD_CONFIG[prioridad] || PRIORIDAD_CONFIG['Media']
  const Icon = ICONS[prioridad] || AlertCircle
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={size} />
      {prioridad}
    </span>
  )
}
