import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { format } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')
const STORAGE_KEY = 'projectflow_data'

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const MOCK_DATA = (() => {
  const proyectoId = uid()
  return {
    proyectos: [{ id: proyectoId, nombre: 'Demo Project', tipo: 'Proyecto' }],
    fases: [],
    requisitos: [
      {
        id: uid(),
        proyectoId,
        faseId: null,
        titulo: 'Conectar fuente de datos SAP a Power BI',
        descripcion: '',
        estado: 'In Progress',
        prioridad: 'Media',
        fechaInicio: '2025-05-19',
        fechaVencimiento: today,
        responsable: 'Laura',
        linkDocumento: 'https://onedrive.live.com',
        notas: 'Revisar las credenciales del servidor de desarrollo antes del viernes.',
        enMiDia: false,
        dependencias: [],
        checklist: [
          { id: 'ch-1', texto: 'Solicitar accesos a base de datos', completado: true },
          { id: 'ch-2', texto: 'Configurar Gateway de Power BI', completado: false }
        ]
      },
      {
        id: uid(),
        proyectoId,
        faseId: null,
        titulo: 'Diseñar dashboard de ventas Q2',
        descripcion: '',
        estado: 'To Do',
        prioridad: 'Media',
        fechaInicio: '2025-05-20',
        fechaVencimiento: '2025-06-02',
        responsable: 'Lola',
        linkDocumento: 'https://onedrive.live.com',
        notas: 'Revisar las credenciales del servidor de desarrollo antes del viernes.',
        enMiDia: false,
        dependencias: [],
        checklist: [
          { id: 'ch-3', texto: 'Definir KPIs principales', completado: false }
        ]
      },
      {
        id: uid(),
        proyectoId,
        faseId: null,
        titulo: 'Visualización de márgenes netos',
        descripcion: 'Como Director Financiero quiero ver el margen neto filtrado por región para tomar decisiones de presupuesto.',
        estado: 'To Do',
        prioridad: 'Alta',
        fechaInicio: '',
        fechaVencimiento: '',
        responsable: 'Laura',
        linkDocumento: '',
        notas: '',
        enMiDia: false,
        dependencias: [],
        checklist: []
      }
    ],
    bugs: []
  }
})()

// ─── Migración de datos antiguos (tareas + historias + sprints) ───
function migrateLegacyState(raw) {
  const rawProyectos = (raw.proyectos || []).map(p => (typeof p === 'string' ? { nombre: p, tipo: 'Proyecto' } : p))
  const proyectos = rawProyectos.map(p => ({ id: p.id || uid(), nombre: p.nombre, tipo: p.tipo || 'Proyecto' }))
  const idByNombre = Object.fromEntries(proyectos.map(p => [p.nombre, p.id]))

  const fases = (raw.sprints || []).map(s => ({
    id: s.id || uid(),
    proyectoId: idByNombre[s.proyecto] ?? null,
    nombre: s.nombre,
    descripcion: s.descripcion || ''
  }))

  const historias = raw.historias || []
  const historiaById = Object.fromEntries(historias.map(h => [h.id, h]))
  const historiaIdsUsadas = new Set()

  const requisitosDeTareas = (raw.tareas || []).map(t => {
    const h = t.historiaId ? historiaById[t.historiaId] : null
    if (h) historiaIdsUsadas.add(h.id)
    return {
      id: t.id || uid(),
      proyectoId: idByNombre[t.proyecto] ?? null,
      faseId: h?.sprintId ?? t.sprintId ?? null,
      titulo: t.titulo || '',
      descripcion: h?.descripcion || t.historia || '',
      estado: t.estado || 'To Do',
      prioridad: 'Media',
      fechaInicio: t.fechaInicio || '',
      fechaVencimiento: t.fechaVencimiento || '',
      responsable: t.etiqueta || h?.responsable || '',
      linkDocumento: t.linkDocumento || '',
      notas: t.notas || '',
      enMiDia: !!t.enMiDia,
      dependencias: [],
      checklist: t.checklist || []
    }
  })

  const requisitosDeHistoriasSueltas = historias
    .filter(h => !historiaIdsUsadas.has(h.id))
    .map(h => ({
      id: h.id || uid(),
      proyectoId: idByNombre[h.proyecto] ?? null,
      faseId: h.sprintId ?? null,
      titulo: h.titulo || '',
      descripcion: h.descripcion || '',
      estado: h.completada ? 'Done' : 'To Do',
      prioridad: 'Media',
      fechaInicio: '',
      fechaVencimiento: h.fechaLimite || '',
      responsable: h.responsable || '',
      linkDocumento: '',
      notas: '',
      enMiDia: false,
      dependencias: [],
      checklist: []
    }))

  const bugs = (raw.bugs || []).map(b => ({
    ...b,
    id: b.id || uid(),
    proyectoId: idByNombre[b.proyecto] ?? b.proyectoId ?? null
  }))

  return {
    proyectos,
    fases,
    requisitos: [...requisitosDeTareas, ...requisitosDeHistoriasSueltas],
    bugs
  }
}

function init() {
  const local = localStorage.getItem(STORAGE_KEY)
  if (!local) return MOCK_DATA
  try {
    const parsed = JSON.parse(local)

    // Ya está en formato nuevo (tiene requisitos) → solo rellenar campos que falten
    if (parsed.requisitos) {
      return {
        proyectos: (parsed.proyectos || []).map(p => ({ id: p.id || uid(), nombre: p.nombre, tipo: p.tipo || 'Proyecto' })),
        fases: (parsed.fases || []).map(f => ({ descripcion: '', ...f })),
        requisitos: (parsed.requisitos || []).map(r => ({
          faseId: null, prioridad: 'Media', descripcion: '', dependencias: [], checklist: [], notas: '', linkDocumento: '', enMiDia: false,
          ...r
        })),
        bugs: parsed.bugs || []
      }
    }

    // Formato antiguo (tareas + historias + sprints) → migrar
    if (parsed.tareas || parsed.historias) {
      return migrateLegacyState(parsed)
    }

    return MOCK_DATA
  } catch (e) {
    return MOCK_DATA
  }
}

const AppContext = createContext()

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_PROJECT':
      return { ...state, proyectos: [...state.proyectos, { id: uid(), ...action.payload }] }
    case 'UPDATE_PROJECT': {
      const { id, nombre, tipo } = action.payload
      return {
        ...state,
        proyectos: state.proyectos.map(p => p.id === id ? { ...p, nombre, tipo } : p)
      }
    }
    case 'DELETE_PROJECT':
      return {
        ...state,
        proyectos: state.proyectos.filter(p => p.id !== action.payload),
        requisitos: state.requisitos.filter(r => r.proyectoId !== action.payload),
        bugs: (state.bugs || []).filter(b => b.proyectoId !== action.payload),
        fases: (state.fases || []).filter(f => f.proyectoId !== action.payload)
      }
    case 'MOVE_PROJECT': {
      const { index, direction } = action.payload
      const nuevos = [...state.proyectos]
      if (direction === 'up' && index > 0) {
        [nuevos[index - 1], nuevos[index]] = [nuevos[index], nuevos[index - 1]]
      } else if (direction === 'down' && index < nuevos.length - 1) {
        [nuevos[index + 1], nuevos[index]] = [nuevos[index], nuevos[index + 1]]
      }
      return { ...state, proyectos: nuevos }
    }

    case 'ADD_REQUISITO':
      return {
        ...state,
        requisitos: [
          ...state.requisitos,
          {
            faseId: null, prioridad: 'Media', descripcion: '', dependencias: [], checklist: [],
            notas: '', linkDocumento: '', enMiDia: false, estado: 'To Do',
            ...action.payload,
            id: uid()
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
    case 'UPDATE_REQUISITO_CHECKLIST':
      return {
        ...state,
        requisitos: state.requisitos.map(r => r.id === action.payload.id ? { ...r, checklist: action.payload.checklist } : r)
      }

    case 'ADD_BUG':
      return { ...state, bugs: [...(state.bugs || []), { id: uid(), ...action.payload }] }
    case 'UPDATE_BUG':
      return { ...state, bugs: (state.bugs || []).map(b => b.id === action.payload.id ? action.payload : b) }
    case 'DELETE_BUG':
      return { ...state, bugs: (state.bugs || []).filter(b => b.id !== action.payload) }

    case 'ADD_FASE':
      return { ...state, fases: [...(state.fases || []), { id: uid(), descripcion: '', ...action.payload }] }
    case 'UPDATE_FASE':
      return { ...state, fases: (state.fases || []).map(f => f.id === action.payload.id ? { ...f, ...action.payload } : f) }
    case 'DELETE_FASE':
      return {
        ...state,
        fases: (state.fases || []).filter(f => f.id !== action.payload),
        requisitos: state.requisitos.map(r => r.faseId === action.payload ? { ...r, faseId: null } : r)
      }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, init)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() { return useContext(AppContext) }

export function getProyecto(state, proyectoId) {
  return (state.proyectos || []).find(p => p.id === proyectoId) || null
}

export function getProyectoNombre(state, proyectoId) {
  return getProyecto(state, proyectoId)?.nombre || 'Sin proyecto'
}

export const RESPONSABLES_OPCIONES = ['Laura', 'Lola', 'Mateo']
export const RESPONSABLE_COLORS = {
  'Laura': { accent: '#7c6cfc', bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30' },
  'Lola': { accent: '#22d3ee', bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Sin asignar': { accent: '#64748b', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' }
}
export function getResponsableColor(nombre) {
  if (!nombre) return RESPONSABLE_COLORS['Sin asignar']
  return RESPONSABLE_COLORS[nombre] || RESPONSABLE_COLORS['Sin asignar']
}

export const ESTADOS = ['To Do', 'In Progress', 'Done']
export const ESTADO_CONFIG = {
  'To Do': { color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30', dot: 'bg-slate-400' },
  'In Progress': { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  'Done': { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
}

export const PRIORIDADES = ['Alta', 'Media', 'Baja']
export const PRIORIDAD_CONFIG = {
  'Alta': { color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
  'Media': { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  'Baja': { color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
}

export function getProjectColor(proyectoNombre, proyectosArray = []) {
  const normalized = proyectoNombre?.toUpperCase().trim() || ''

  if (normalized.includes('TES1')) {
    return { accent: '#22d3ee', text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10' }
  }
  if (normalized.includes('DEMO')) {
    return { accent: '#f59e0b', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' }
  }

  const fallbackColors = [
    { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', accent: '#34d399' },
    { text: 'text-fuchsia-400', border: 'border-fuchsia-500/30', bg: 'bg-fuchsia-500/10', accent: '#e879f9' },
    { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', accent: '#60a5fa' },
  ]

  const index = proyectosArray.findIndex(p => p.nombre === proyectoNombre)
  const colorIndex = index !== -1 ? index % fallbackColors.length : 0
  return fallbackColors[colorIndex]
}
