import React from 'react'
import { useTask } from '../context/TaskContext'
import { Sun, Calendar, CheckCircle2, Circle, Star, Trash2, Clock, AlertCircle } from 'lucide-react'
import TaskCard from './TaskCard'

export default function MyDay() {
  const { state, dispatch } = useTask()

  // Obtener la fecha de hoy en formato 'YYYY-MM-DD'
  const hoyStr = new Date().toISOString().split('T')[0]

  // FILTRADO ADAPTADO: Añade automáticamente las tareas vencidas que no estén completadas
  const miDiaTareas = state.tareas.filter(t => {
    const esMarcadaMiDia = t.enMiDia
    const estaVencida = t.fechaVencimiento && t.fechaVencimiento < hoyStr && t.estado !== 'Done'
    
    return esMarcadaMiDia || estaVencida
  })

  // Estadísticas básicas
  const completadas = miDiaTareas.filter(t => t.estado === 'Done').length
  const total = miDiaTareas.length
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0

  const handleRemoveFromMyDay = (id) => {
    dispatch({ type: 'TOGGLE_MY_DAY', payload: id })
  }

  // Formatear fecha actual para el encabezado
  const fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="p-8 animate-fade-in bg-[#0b0f19] min-h-screen text-slate-100">
      {/* Header con saludo y fecha */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Sun className="text-amber-400" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100">Mi Día</h1>
            <p className="text-sm text-slate-500 capitalize mt-0.5">{fechaActual}</p>
          </div>
        </div>

        {/* Barra de Progreso del Día */}
        {total > 0 && (
          <div className="bg-surface-800 border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-4 min-w-[240px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Progreso diario</span>
                <span className="text-accent-violet font-bold font-mono">{progreso}%</span>
              </div>
              <div className="w-full bg-surface-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-accent-violet h-full transition-all duration-500 ease-out"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-bold text-slate-200 font-mono">{completadas}</span>
              <span className="text-xs text-slate-500 font-medium">/{total}</span>
            </div>
          </div>
        )}
      </div>

      {/* Listado de tareas */}
      <div className="space-y-3 max-w-4xl">
        {miDiaTareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-2xl bg-surface-800/20 px-4">
            <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mb-3 border border-white/5">
              <Sun size={20} className="text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-400">Tu día está despejado</h3>
            <p className="text-xs text-slate-600 max-w-[280px] mt-1 leading-relaxed">
              Las tareas que agregues a "Mi Día" o que se encuentren vencidas aparecerán aquí para ayudarte a enfocar tu jornada.
            </p>
          </div>
        ) : (
          miDiaTareas.map(tarea => (
            <div key={tarea.id} className="relative group">
              <TaskCard tarea={tarea} />
              
              {/* Indicador visual discreto si la tarea entra por estar vencida */}
              {tarea.fechaVencimiento && tarea.fechaVencimiento < hoyStr && tarea.estado !== 'Done' && (
                <div className="absolute top-3.5 right-14 flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
                  <AlertCircle size={10} />
                  <span>Vencida</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}