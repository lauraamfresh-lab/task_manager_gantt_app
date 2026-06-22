import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { format } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')

const MOCK_DATA = {
  proyectos: ['Demo Project'],
  tareas: [
    {
      id: '1',
      titulo: 'Conectar fuente de datos SAP a Power BI',
      proyecto: 'Demo Project',
      estado: 'In Progress',
      fechaInicio: '2025-05-19',
      fechaVencimiento: today,
      linkDocumento: 'https://onedrive.live.com',
      notas: 'Revisar las credenciales del servidor de desarrollo antes del viernes.',
      etiqueta: 'Laura',
      checklist: [
        { id: 'ch-1', texto: 'Solicitar accesos a base de datos', completado: true },
        { id: 'ch-2', texto: 'Configurar Gateway de Power BI', completado: false }
      ]
    },
    {
      id: '2',
      titulo: 'Diseñar dashboard de ventas Q2',
      proyecto: 'Demo Project',
      estado: 'To Do',
      fechaInicio: '2025-05-20',
      fechaVencimiento: '2025-06-02',
      linkDocumento: 'https://onedrive.live.com',
      notas: 'Revisar las credenciales del servidor de desarrollo antes del viernes.',
      etiqueta: 'Lola',
      checklist: [
        { id: 'ch-3', texto: 'Definir KPIs principales', completado: false }
      ]
    }
  ],
  bugs: [],
  historias: [
    { id: 'h-1', proyecto: 'Demo Project', titulo: 'Visualización de márgenes netos', descripcion: 'Como Director Financiero quiero ver el margen neto filtrado por región para tomar decisiones de presupuesto.', completada: false }
  ]
}

const TaskContext = createContext()

function init() {
  const local = localStorage.getItem('projectflow_data')
  if (local) {
    try {
      const parsed = JSON.parse(local)
      if (!parsed.historias) parsed.historias = []
      return parsed
    } catch (e) {
      return MOCK_DATA
    }
  }
  return MOCK_DATA
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PROJECT':
      return { ...state, proyectos: [...state.proyectos, action.payload] }
    case 'UPDATE_PROJECT': {
      const { oldName, newName } = action.payload
      return {
        ...state,
        proyectos: state.proyectos.map(p => p === oldName ? newName : p),
        tareas: state.tareas.map(t => t.proyecto === oldName ? { ...t, proyecto: newName } : t),
        bugs: (state.bugs || []).map(b => b.proyecto === oldName ? { ...b, proyecto: newName } : b),
        historias: (state.historias || []).map(h => h.proyecto === oldName ? { ...h, proyecto: newName } : h)
      }
    }
    case 'DELETE_PROJECT':
      return { 
        ...state, 
        proyectos: state.proyectos.filter(p => p !== action.payload),
        tareas: state.tareas.filter(t => t.proyecto !== action.payload),
        bugs: (state.bugs || []).filter(b => b.proyecto !== action.payload),
        historias: (state.historias || []).filter(h => h.proyecto !== action.payload)
      }
    case 'MOVE_PROJECT': {
      const { index, direction } = action.payload;
      const nuevosProyectos = [...state.proyectos];
      
      if (direction === 'up' && index > 0) {
        [nuevosProyectos[index - 1], nuevosProyectos[index]] = [nuevosProyectos[index], nuevosProyectos[index - 1]];
      } else if (direction === 'down' && index < nuevosProyectos.length - 1) {
        [nuevosProyectos[index + 1], nuevosProyectos[index]] = [nuevosProyectos[index], nuevosProyectos[index + 1]];
      }
      return { ...state, proyectos: nuevosProyectos };
    }
    case 'ADD_TASK':
      return { ...state, tareas: [...state.tareas, { ...action.payload, id: Date.now().toString() }] }
    case 'UPDATE_TASK':
      return { ...state, tareas: state.tareas.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) }
    case 'DELETE_TASK':
      return { ...state, tareas: state.tareas.filter(t => t.id !== action.payload) }
    case 'UPDATE_ESTADO':
      return { ...state, tareas: state.tareas.map(t => t.id === action.payload.id ? { ...t, estado: action.payload.estado } : t) }
    case 'ADD_BUG':
      return { ...state, bugs: [...(state.bugs || []), action.payload] }
    case 'UPDATE_BUG':
      return { ...state, bugs: (state.bugs || []).map(b => b.id === action.payload.id ? action.payload : b) }
    case 'DELETE_BUG':
      return { ...state, bugs: (state.bugs || []).filter(b => b.id !== action.payload) }
    case 'ADD_STORY':
      return { ...state, historias: [...(state.historias || []), { ...action.payload, id: Date.now().toString() }] }
    case 'UPDATE_STORY':
      return { ...state, historias: (state.historias || []).map(h => h.id === action.payload.id ? { ...h, ...action.payload } : h) }
    case 'DELETE_STORY':
      return { ...state, historias: (state.historias || []).filter(h => h.id !== action.payload) }
    case 'TOGGLE_STORY_COMPLETION':
      return {
        ...state,
        historias: (state.historias || []).map(h => 
          h.id === action.payload ? { ...h, completada: !h.completada } : h
        )
      }
    default:
      return state
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, init)

  useEffect(() => {
    localStorage.setItem('projectflow_data', JSON.stringify(state))
  }, [state])

  return (
    <TaskContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTask() { return useContext(TaskContext) }

export const ETIQUETAS_OPCIONES = ['Laura', 'Lola', 'Sin asignar']
export const ETIQUETA_COLORS = {
  'Laura': { accent: '#7c6cfc', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  'Lola':  { accent: '#22d3ee', bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   border: 'border-cyan-500/30' },
  'Sin asignar': { accent: '#64748b', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' }
}

export function getEtiquetaColor(etiqueta) {
  if (!etiqueta) return ETIQUETA_COLORS['Sin asignar']
  return ETIQUETA_COLORS[etiqueta] || ETIQUETA_COLORS['Sin asignar']
}

export const ESTADOS = ['To Do', 'In Progress', 'Done']
export const ESTADO_CONFIG = {
  'To Do':       { color: 'text-slate-400',  bg: 'bg-slate-500/15',  border: 'border-slate-500/30',  dot: 'bg-slate-400' },
  'In Progress': { color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  dot: 'bg-amber-400' },
  'Done':        { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
}

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