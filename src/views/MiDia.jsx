import React from 'react'
import { useTask } from '../context/TaskContext'
// Importa aquí los mismos componentes o iconos que ya uses (ej: TaskCard, Sun, etc.)

export default function MyDayView() {
  const { state } = useTask()
  
  // Obtener la fecha de hoy en formato idéntico al del input date (YYYY-MM-DD)
  const hoyStr = new Date().toISOString().split('T')[0]

  // FILTRADO: Tareas marcadas manualmente + Tareas vencidas no completadas
  const tareasMiDia = state.tareas.filter(t => {
    const esMarcadaMiDia = t.enMiDia
    const estaVencida = t.fechaVencimiento && t.fechaVencimiento < hoyStr && t.estado !== 'Done'
    
    return esMarcadaMiDia || estaVencida
  })

  return (
    <div className="p-8 animate-fade-in bg-[#0b0f19] min-h-screen text-slate-100">
      {/* Tu cabecera existente (No cambies nada de tus estilos) */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-100">Mi Día</h1>
      </div>

      {/* Renderizado de las tareas */}
      <div className="space-y-3">
        {tareasMiDia.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No hay tareas para hoy ni tareas vencidas pendientes.</p>
        ) : (
          tareasMiDia.map(tarea => (
            // Aquí dejas tu `<TaskCard />` o el componente que uses para pintar la tarea tal y como lo tenías
            <div key={tarea.id} className="p-4 bg-surface-800 rounded-xl border border-white/5">
              <span className="text-sm font-medium">{tarea.titulo}</span>
              {tarea.fechaVencimiento && tarea.fechaVencimiento < hoyStr && (
                <span className="text-[10px] ml-2 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md font-semibold">
                  Vencida
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}