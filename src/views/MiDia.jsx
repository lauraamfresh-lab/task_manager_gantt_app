import React from 'react'
import { useTask } from '../context/TaskContext'
import { Sun, AlertCircle, Clock } from 'lucide-react'

export default function MyDay() {
  const { state, dispatch } = useTask()

  // OBTENER FECHA LOCAL DE FORMA SEGURA (Evita desfases de zona horaria)
  const d = new Date()
  const hoyStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  // FILTRADO: Tareas marcadas para Mi Día + Tareas vencidas no completadas
  const miDiaTareas = state.tareas.filter(t => {
    const esMarcadaMiDia = t.enMiDia
    const estaVencida = t.fechaVencimiento && t.fechaVencimiento < hoyStr && t.estado !== 'Done'
    
    return esMarcadaMiDia || estaVencida
  })

  // Estadísticas de progreso
  const completadas = miDiaTareas.filter(t => t.estado === 'Done').length
  const total = miDiaTareas.length
  const progreso = total > 0 ? Math.round((completadas / total) * 100) : 0

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  const handleToggleMyDay = (id) => {
    dispatch({ type: 'TOGGLE_MY_DAY', payload: id })
  }

  return (
    <div className="p-8 animate-fade-in bg-[#0b0f19] min-h-screen text-slate-100">
      
      {/* Encabezado Principal */}
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

        {/* Barra de Progreso */}
        {total > 0 && (
          <div className="bg-surface-800 border border-white/5 px-4 py-3 rounded-2xl flex items-center gap-4 min-w-[240px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Progreso diario</span>
                <span className="text-violet-400 font-bold font-mono">{progreso}%</span>
              </div>
              <div className="w-full bg-surface-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-violet-500 h-full transition-all duration-500 ease-out"
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

      {/* Listado de Tareas */}
      <div className="space-y-3 max-w-4xl">
        {miDiaTareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-2xl bg-surface-800/20 px-4">
            <div className="w-12 h-12 rounded-full bg-surface-800 flex items-center justify-center mb-3 border border-white/5">
              <Sun size={20} className="text-slate-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-400">Tu día está despejado</h3>
            <p className="text-xs text-slate-600 max-w-[280px] mt-1 leading-relaxed">
              Las tareas que agregues a "Mi Día" o que se encuentren vencidas aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          miDiaTareas.map(tarea => {
            const esVencida = tarea.fechaVencimiento && tarea.fechaVencimiento < hoyStr && tarea.estado !== 'Done'
            
            return (
              <div 
                key={tarea.id} 
                className="p-4 bg-surface-800/60 hover:bg-surface-800 border border-white/5 rounded-xl flex items-center justify-between gap-4 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-medium ${tarea.estado === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {tarea.titulo}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-violet-400 font-semibold px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 uppercase">
                        {tarea.proyecto}
                      </span>
                      {tarea.fechaVencimiento && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={11} />
                          {tarea.fechaVencimiento}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges de Estado / Alertas */}
                <div className="flex items-center gap-2 shrink-0">
                  {esVencida && (
                    <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      <AlertCircle size={11} />
                      <span>Vencida</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleToggleMyDay(tarea.id)}
                    className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded bg-surface-700/50 border border-white/5 transition-colors"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}