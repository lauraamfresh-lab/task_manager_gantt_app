import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { format } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')

const MOCK_DATA = {
  proyectos: [{ nombre: 'Demo Project', tipo: 'Proyecto' }],
  requisitos: [
    {
      id: '1',
      titulo: 'Conectar fuente de datos SAP a Power BI',
      descripcion: '',
      proyecto: 'Demo Project',
      estado: 'In Progress',
      prioridad: 'Alta',
      fechaInicio: '2025-05-19',
      fechaVencimiento: today,
      linkDocumento: 'https://onedrive.live.com',
      notas: 'Revisar las credenciales del servidor de desarrollo antes del viernes.',
      responsable: 'Laura',
      dependencias: [],
      sprintId: null,
      enMiDia: false,
      checklist: [
        { id: 'ch-1', texto: 'Solicitar accesos a base de datos', completado: true },
        { id: 'ch-2', texto: 'Configurar Gateway de Power BI', completado: false }
      ]
    },
    {
      id: '2',
      titulo: 'Diseñar dashboard de ventas Q2',
      descripcion: '',
      proyecto: 'Demo Project',
      estado: 'To Do',
      prioridad: 'Media',
      fechaInicio: '2025-05-20',
      fechaVencimiento: '2025-06-02',
      linkDocumento: 'https://onedrive.live.com',
      notas: 'Revisar las credenciales del servidor de desarrollo antes del viernes.',
      responsable: 'Lola',
      dependencias: [],
      sprintId: null,
      enMiDia: false,
      checklist: [
        { id: 'ch-3', texto: 'Definir KPIs principales', completado: false }
      ]
    },
    {
      id: 'h-1',
      titulo: 'Visualización de márgenes netos',
      descripcion: 'Como Director Financiero quiero ver el margen neto filtrado por región para tomar decisiones de presupuesto.',
      proyecto: 'Demo Project',
      estado: 'To Do',
      prioridad: 'Media',
      fechaInicio: '',
      fechaVencimiento: '',
      linkDocumento: '',
      notas: '',
      responsable: '',
      dependencias: [],
      sprintId: null,
      enMiDia: false,
      checklist: []
    }
  ],
  bugs: [],
  sprints: []
}

const AppContext = createContext()

// Convierte una tarea "antigua" (modelo pre-fusión) en un Requisito
function tareaARequisito(t) {
  return {
    id: t.id,
    titulo: t.titulo || '',
    descripcion: t.historia || '',
    proyecto: t.proyecto,
    estado: t.estado || 'To Do',
    prioridad: t.prioridad || 'Media',
    fechaInicio: t.fechaInicio || '',
    fechaVencimiento: t.fechaVencimiento || '',
    linkDocumento: t.linkDocumento || '',
    notas: t.notas || '',
    responsable: t.etiqueta || '',
    dependencias: t.dependencias || [],
    sprintId: t.sprintId || null,
    enMiDia: !!t.enMiDia,
    checklist: t.checklist || []
  }
}

// Convierte una historia "antigua" (sin tarea vinculada) en un Requisito
function historiaARequisito(h) {
  return {
    id: h.id,
    titulo: h.titulo || '',
    descripcion: h.descripcion || '',
    proyecto: h.proyecto,
    estado: h.completada ? 'Done' : 'To Do',
    prioridad: 'Media',
    fechaInicio: '',
    fechaVencimiento: h.fechaLimite || '',
    linkDocumento: '',
    notas: '',
    responsable: h.responsable || '',
    dependencias: [],
    sprintId: h.sprintId || null,
    enMiDia: false,
    checklist: []
  }
}

// Migra el modelo antiguo (proyectos.tareas + proyectos.historias) al nuevo modelo unificado (requisitos)
function migrarAModeloUnificado(parsed) {
  if (Array.isArray(parsed.requisitos)) {
    // Ya está en el modelo nuevo: solo garantizamos que los campos nuevos existan
    parsed.requisitos = parsed.requisitos.map(r => ({
      descripcion: '',
      prioridad: 'Media',
      dependencias: [],
      responsable: '',
      sprintId: null,
      enMiDia: false,
      checklist: [],
      ...r
    }))
    return parsed
  }

  const tareas = parsed.tareas || []
  const historias = parsed.historias || []
  const historiaIdsUsadas = new Set(tareas.filter(t => t.historiaId).map(t => t.historiaId))

  const requisitosDesdeTareas = tareas.map(tareaARequisito)
  const requisitosDesdeHistoriasSueltas = historias
    .filter(h => !historiaIdsUsadas.has(h.id))
    .map(historiaARequisito)

  return {
    ...parsed,
    requisitos: [...requisitosDesdeTareas, ...requisitosDesdeHistoriasSueltas],
    tareas: undefined,
    historias: undefined
  }
}

function init() {
  const local = localStorage.getItem('projectflow_data')
  if (local) {
    try {
      const parsed = JSON.parse(local)
      if (!parsed.sprints) parsed.sprints = []
      if (!parsed.bugs) parsed.bugs = []

      if (parsed.proyectos) {
        parsed.proyectos = parsed.proyectos.map(p =>
          typeof p === 'string' ? { nombre: p, tipo: 'Proyecto' } : p
        )
      }

      const migrado = migrarAModeloUnificado(parsed)
      delete migrado.tareas
      delete migrado.historias
      return migrado
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
      const { oldName, newName, tipo } = action.payload
      return {
        ...state,
        proyectos: state.proyectos.map(p => p.nombre === oldName ? { nombre: newName, tipo } : p),
        requisitos: state.requisitos.map(r => r.proyecto === oldName ? { ...r, proyecto: newName } : r),
        bugs: (state.bugs || []).map(b => b.proyecto === oldName ? { ...b, proyecto: newName } : b),
        sprints: (state.sprints || []).map(s => s.proyecto === oldName ? { ...s, proyecto: newName } : s)
      }
    }
    case 'DELETE_PROJECT':
      return {
        ...state,
        proyectos: state.proyectos.filter(p => p.nombre !== action.payload),
        requisitos: state.requisitos.filter(r => r.proyecto !== action.payload),
        bugs: (state.bugs || []).filter(b => b.proyecto !== action.payload),
        sprints: (state.sprints || []).filter(s => s.proyecto !== action.payload)
      }
    case 'MOVE_PROJECT': {
      const { index, direction } = action.payload
      const nuevosProyectos = [...state.proyectos]
      if (direction === 'up' && index > 0) {
        [nuevosProyectos[index - 1], nuevosProyectos[index]] = [nuevosProyectos[index], nuevosProyectos[index - 1]]
      } else if (direction === 'down' && index < nuevosProyectos.length - 1) {
        [nuevosProyectos[index + 1], nuevosProyectos[index]] = [nuevosProyectos[index], nuevosProyectos[index + 1]]
      }
      return { ...state, proyectos: nuevosProyectos }
    }

    // ─── Requisitos (entidad única: fusiona lo que antes eran Tareas + Historias) ───
    case 'ADD_REQUISITO':
      return {
        ...state,
        requisitos: [
          ...state.requisitos,
          {
            descripcion: '',
            prioridad: 'Media',
            dependencias: [],
            checklist: [],
            notas: '',
            responsable: '',
            sprintId: null,
            enMiDia: false,
            ...action.payload,
            id: action.payload.id || Date.now().toString()
          }
        ]
      }
    case 'UPDATE_REQUISITO':
      return {
        ...state,
        requisitos: state.requisitos.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r)
      }
    case 'DELETE_REQUISITO':
      return {
        ...state,
        requisitos: state.requisitos
          .filter(r => r.id !== action.payload)
          .map(r => ({ ...r, dependencias: (r.dependencias || []).filter(id => id !== action.payload) }))
      }
    case 'UPDATE_ESTADO':
      return {
        ...state,
        requisitos: state.requisitos.map(r => r.id === action.payload.id ? { ...r, estado: action.payload.estado } : r)
      }
    case 'TOGGLE_EN_MI_DIA':
      return {
        ...state,
        requisitos: state.requisitos.map(r => r.id === action.payload ? { ...r, enMiDia: !r.enMiDia } : r)
      }

    case 'ADD_BUG':
      return { ...state, bugs: [...(state.bugs || []), action.payload] }
    case 'UPDATE_BUG':
      return { ...state, bugs: (state.bugs || []).map(b => b.id === action.payload.id ? action.payload : b) }
    case 'DELETE_BUG':
      return { ...state, bugs: (state.bugs || []).filter(b => b.id !== action.payload) }

    // ─── Sprints / Fases (usadas en Informes) ───
    case 'ADD_SPRINT':
      return { ...state, sprints: [...(state.sprints || []), { descripcion: '', ...action.payload }] }
    case 'UPDATE_REQUISITO_SPRINT':
      return {
        ...state,
        requisitos: state.requisitos.map(r =>
          r.id === action.payload.requisitoId ? { ...r, sprintId: action.payload.sprintId } : r
        )
      }
    case 'UPDATE_SPRINT':
      return {
        ...state,
        sprints: (state.sprints || []).map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        )
      }
    case 'DELETE_SPRINT':
      return {
        ...state,
        sprints: (state.sprints || []).filter(s => s.id !== action.payload),
        requisitos: state.requisitos.map(r =>
          r.sprintId === action.payload ? { ...r, sprintId: null } : r
        )
      }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, init)

  useEffect(() => {
    localStorage.setItem('projectflow_data', JSON.stringify(state))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }
// Alias por compatibilidad con nombres usados anteriormente en el código
export const useTask = useApp

export const ETIQUETAS_OPCIONES = ['Laura', 'Lola', 'Mateo']
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

export const PRIORIDADES = ['Baja', 'Media', 'Alta']
export const PRIORIDAD_CONFIG = {
  'Baja':  { color: 'text-slate-400',  bg: 'bg-slate-500/15',  border: 'border-slate-500/30',  label: '⬇ Baja' },
  'Media': { color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  label: '● Media' },
  'Alta':  { color: 'text-rose-400',   bg: 'bg-rose-500/15',   border: 'border-rose-500/30',   label: '⬆ Alta' },
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
  ]

  const index = proyectosArray.findIndex(p => (typeof p === 'string' ? p : p.nombre) === project)
  const colorIndex = index !== -1 ? index % fallbackColors.length : 0

  return fallbackColors[colorIndex]
}
