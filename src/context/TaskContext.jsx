import React, { createContext, useContext, useReducer, useEffect } from 'react'

export const ESTADOS = ['To Do', 'In Progress', 'Done']

export const ESTADO_CONFIG = {
  'To Do': { bg: 'bg-slate-500/10', color: 'text-slate-400', border: 'border-slate-500/20' },
  'In Progress': { bg: 'bg-blue-500/10', color: 'text-blue-400', border: 'border-blue-500/30' },
  'Done': { bg: 'bg-emerald-500/10', color: 'text-emerald-500', border: 'border-emerald-500/20' }
}

export const ETIQUETAS_OPCIONES = [
  'Frontend', 'Backend', 'Diseño', 'DevOps', 'QA', 'Marketing', 'Ventas', 'Legal', 'Otro'
]

// 1. ASIGNACIÓN SECUENCIAL DE COLORES POR PROYECTO
export function getProjectColor(project, proyectosArray = []) {
  const normalized = project?.toUpperCase().trim() || ''
  
  if (normalized.includes('TES1')) {
    return { accent: '#22d3ee', text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' }
  }
  if (normalized.includes('DEMO')) {
    return { accent: '#f59e0b', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' }
  }

  const fallbackColors = [
    { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', accent: '#34d399' },
    { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', accent: '#60a5fa' },
    { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', accent: '#f43f5e' },
    { text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/10', accent: '#c084fc' },
    { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-500/10', accent: '#fb923c' },
    { text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10', accent: '#e879f9' },
    { text: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10', accent: '#38bdf8' },
    { text: 'text-lime-400', border: 'border-lime-500/30', bg: 'bg-lime-500/10', accent: '#a3e635' },
    { text: 'text-pink-400', border: 'border-pink-500/30', bg: 'bg-pink-500/10', accent: '#f472b6' },
    { text: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-500/10', accent: '#2dd4bf' },
    { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', accent: '#818cf8' },
    { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', accent: '#fbbf24' },
  ]
  
  const index = proyectosArray.indexOf(project)
  const colorIndex = index !== -1 ? index % fallbackColors.length : 0
  
  return fallbackColors[colorIndex]
}

export function getEtiquetaColor(etiqueta) {
  const map = {
    'Frontend': { accent: '#60a5fa' },
    'Backend': { accent: '#34d399' },
    'Diseño': { accent: '#f472b6' },
    'DevOps': { accent: '#fb923c' },
    'QA': { accent: '#a3e635' },
    'Marketing': { accent: '#c084fc' },
    'Ventas': { accent: '#2dd4bf' },
    'Legal': { accent: '#94a3b8' },
    'Otro': { accent: '#a8a29e' }
  }
  return map[etiqueta] || { accent: '#94a3b8' }
}

const initialState = {
  proyectos: ['Proyecto Principal'],
  proyectosCompletados: [], // Nuevo estado para proyectos archivados
  tareas: []
}

function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tareas: [...state.tareas, action.payload] }
    case 'UPDATE_TASK':
      return { ...state, tareas: state.tareas.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) }
    case 'DELETE_TASK':
      return { ...state, tareas: state.tareas.filter(t => t.id !== action.payload) }
    case 'UPDATE_ESTADO':
      return { ...state, tareas: state.tareas.map(t => t.id === action.payload.id ? { ...t, estado: action.payload.estado } : t) }
    case 'ADD_PROJECT':
      if (state.proyectos.includes(action.payload)) return state
      return { ...state, proyectos: [...state.proyectos, action.payload] }
    case 'DELETE_PROJECT':
      return { 
        ...state, 
        proyectos: state.proyectos.filter(p => p !== action.payload),
        tareas: state.tareas.filter(t => t.proyecto !== action.payload)
      }
    case 'COMPLETE_PROJECT':
      return {
        ...state,
        proyectos: state.proyectos.filter(p => p !== action.payload),
        proyectosCompletados: [...(state.proyectosCompletados || []), action.payload]
      }
    case 'REACTIVATE_PROJECT':
      return {
        ...state,
        proyectosCompletados: (state.proyectosCompletados || []).filter(p => p !== action.payload),
        proyectos: [...state.proyectos, action.payload]
      }
    case 'ADD_STORY':
      const tareaHistoria = {
        id: Date.now().toString(),
        proyecto: action.payload.proyecto,
        titulo: action.payload.titulo,
        estado: 'To Do',
        notas: action.payload.descripcion,
        fechaInicio: new Date().toISOString(),
        fechaVencimiento: new Date(Date.now() + 86400000).toISOString()
      }
      return { ...state, tareas: [...state.tareas, tareaHistoria] }
    case 'LOAD_DATA':
      return action.payload
    default:
      return state
  }
}

const TaskContext = createContext()

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState)

  // Cargar de LocalStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('taskData')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Aseguramos que proyectosCompletados exista al cargar versiones viejas
        if (!parsed.proyectosCompletados) parsed.proyectosCompletados = []
        dispatch({ type: 'LOAD_DATA', payload: parsed })
      } catch (e) {
        console.error("Error al cargar datos", e)
      }
    }
  }, [])

  // Guardar en LocalStorage al cambiar
  useEffect(() => {
    localStorage.setItem('taskData', JSON.stringify(state))
  }, [state])

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTask() {
  return useContext(TaskContext)
}