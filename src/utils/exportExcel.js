import * as XLSX from 'xlsx'
import { ETIQUETAS_OPCIONES } from '../context/AppContext'

const COLUMNAS = ['Proyecto', 'Requisito', 'Descripción', 'Prioridad', 'Estado', 'Fecha inicio', 'Fecha vencimiento', 'Notas']

function filaDeRequisito(r) {
  return {
    Proyecto: r.proyecto || '',
    Requisito: r.titulo || '',
    Descripción: r.descripcion || '',
    Prioridad: r.prioridad || 'Media',
    Estado: r.estado || 'To Do',
    'Fecha inicio': r.fechaInicio || '(sin definir)',
    'Fecha vencimiento': r.fechaVencimiento || '(sin definir)',
    Notas: r.notas || ''
  }
}

// Orden tipo Gantt: primero por fecha de inicio, las que no tienen fecha van al final
function ordenarComoGantt(lista) {
  return [...lista].sort((a, b) => {
    if (!a.fechaInicio && !b.fechaInicio) return 0
    if (!a.fechaInicio) return 1
    if (!b.fechaInicio) return -1
    return a.fechaInicio.localeCompare(b.fechaInicio)
  })
}

function hojaDesdeFilas(filas) {
  const datos = filas.length > 0 ? filas : [{ Proyecto: '', Requisito: 'Sin requisitos', Descripción: '', Prioridad: '', Estado: '', 'Fecha inicio': '', 'Fecha vencimiento': '', Notas: '' }]
  const ws = XLSX.utils.json_to_sheet(datos, { header: COLUMNAS })
  ws['!cols'] = COLUMNAS.map(col => ({
    wch: Math.min(50, Math.max(col.length, ...datos.map(f => String(f[col] ?? '').length)) + 2)
  }))
  return ws
}

// Genera y descarga un .xlsx con: una hoja "Resumen" (todo junto), una hoja por
// cada persona del equipo (su Gantt individual) y una hoja "Sin asignar".
export function exportarPlanificacionExcel(state) {
  const requisitos = state.requisitos || []
  const wb = XLSX.utils.book_new()

  const resumenFilas = ordenarComoGantt(requisitos).map(r => ({
    Responsable: r.responsable && ETIQUETAS_OPCIONES.includes(r.responsable) ? r.responsable : 'Sin asignar',
    ...filaDeRequisito(r)
  }))
  const wsResumen = XLSX.utils.json_to_sheet(resumenFilas, { header: ['Responsable', ...COLUMNAS] })
  wsResumen['!cols'] = ['Responsable', ...COLUMNAS].map(col => ({
    wch: Math.min(50, Math.max(col.length, ...resumenFilas.map(f => String(f[col] ?? '').length)) + 2)
  }))
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  ETIQUETAS_OPCIONES.forEach(persona => {
    const filas = ordenarComoGantt(requisitos.filter(r => r.responsable === persona)).map(filaDeRequisito)
    const nombreHoja = persona.substring(0, 31)
    XLSX.utils.book_append_sheet(wb, hojaDesdeFilas(filas), nombreHoja)
  })

  const sinAsignarFilas = ordenarComoGantt(
    requisitos.filter(r => !r.responsable || !ETIQUETAS_OPCIONES.includes(r.responsable))
  ).map(filaDeRequisito)
  XLSX.utils.book_append_sheet(wb, hojaDesdeFilas(sinAsignarFilas), 'Sin asignar')

  const fecha = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Planificacion_${fecha}.xlsx`)
}
