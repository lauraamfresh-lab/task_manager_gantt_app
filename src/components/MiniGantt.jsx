import React, { useState, useMemo } from 'react'
import { BarChart2, ChevronDown, ChevronRight } from 'lucide-react'
import { format, parseISO, differenceInDays, addDays, startOfWeek, getISOWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { ESTADO_CONFIG, getEtiquetaColor } from '../context/AppContext'

// Gantt compacto y de solo lectura (sin drag ni resize) para mostrar el calendario
// de un subconjunto de requisitos (por proyecto, por persona, etc.)
export default function MiniGantt({ requisitos }) {
  const [vistaMode, setVistaMode] = useState('mes')
  const [fechaInicioVista, setFechaInicioVista] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [mostrarCompletadas, setMostrarCompletadas] = useState(false)

  const timelineBounds = useMemo(() => {
    const min = fechaInicioVista
    let diasAAnadir = 31
    if (vistaMode === 'semana') diasAAnadir = 7
    else if (vistaMode === 'tres_meses') diasAAnadir = 90
    const max = addDays(min, diasAAnadir)
    const totalDays = Math.max(1, differenceInDays(max, min))
    const markers = []
    for (let i = 0; i <= totalDays; i++) markers.push(addDays(min, i))
    return { minDate: min, maxDate: max, totalDays, markers }
  }, [fechaInicioVista, vistaMode])

  const { minDate, maxDate, totalDays, markers } = timelineBounds
  const getPerc = (dateObj) => Math.min(100, Math.max(0, (differenceInDays(dateObj, minDate) / totalDays) * 100))

  const todayPosition = useMemo(() => {
    const today = new Date()
    if (today >= minDate && today <= addDays(minDate, totalDays)) return getPerc(today)
    return null
  }, [minDate, totalDays])

  const semanas = useMemo(() => {
    const result = []
    const limite = addDays(minDate, totalDays)
    let cursor = startOfWeek(minDate, { weekStartsOn: 1 })
    while (cursor <= limite) {
      const weekStart = cursor
      const weekEndExclusivo = addDays(weekStart, 7)
      const clampedStart = weekStart < minDate ? minDate : weekStart
      const clampedEnd = weekEndExclusivo > limite ? limite : weekEndExclusivo
      result.push({ weekNumber: getISOWeek(weekStart), showBoundary: weekStart > minDate, boundaryPos: getPerc(weekStart), left: getPerc(clampedStart), right: getPerc(clampedEnd) })
      cursor = addDays(cursor, 7)
    }
    return result
  }, [minDate, totalDays])

  const validRequisitos = useMemo(() => requisitos.filter(r => {
    if (!r.fechaInicio || !r.fechaVencimiento) return false
    try {
      const tStart = parseISO(r.fechaInicio)
      let tEnd = parseISO(r.fechaVencimiento)
      if (tEnd <= tStart) tEnd = addDays(tStart, 1)
      return tStart <= maxDate && tEnd >= minDate
    } catch { return false }
  }), [requisitos, minDate, maxDate])

  const activas = useMemo(() => [...validRequisitos].filter(r => r.estado !== 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)), [validRequisitos])
  const completadas = useMemo(() => [...validRequisitos].filter(r => r.estado === 'Done').sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio)), [validRequisitos])

  const navegarTimeline = (dir) => {
    const delta = vistaMode === 'semana' ? 7 : vistaMode === 'mes' ? 30 : 90
    setFechaInicioVista(prev => addDays(prev, dir * delta))
  }

  const renderFila = (requisito) => {
    const start = parseISO(requisito.fechaInicio)
    let end = requisito.fechaVencimiento ? parseISO(requisito.fechaVencimiento) : addDays(start, 1)
    if (end <= start) end = addDays(start, 1)
    const barLeft = getPerc(start)
    const barRight = getPerc(end)
    const barWidth = Math.max(1.5, barRight - barLeft)
    const cfg = ESTADO_CONFIG[requisito.estado] || ESTADO_CONFIG['To Do']
    const tagColor = getEtiquetaColor(requisito.responsable)

    return (
      <div key={requisito.id} className="grid grid-cols-[260px_1fr] items-center hover:bg-white/[0.02] transition-colors min-h-[48px] py-1.5 relative z-10 border-b border-white/[0.02]">
        <div className="px-4 pr-3 flex items-center justify-between gap-3 border-r border-white/5 h-full">
          <span className={`text-xs font-medium pr-2 break-words flex-1 leading-relaxed ${requisito.estado === 'Done' ? 'line-through text-slate-500 opacity-60' : 'text-slate-300'}`}>{requisito.titulo}</span>
          <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 border shrink-0 uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border}`}>{requisito.estado === 'In Progress' ? 'Progreso' : requisito.estado}</span>
        </div>
        <div className="relative h-full w-full flex items-center px-3">
          <div
            className="absolute h-5 rounded-lg flex items-center px-2 shadow-md border cursor-default overflow-hidden transition-all duration-150"
            style={{ left: `${barLeft}%`, width: `${barWidth}%`, backgroundColor: `${tagColor.accent}20`, borderColor: `${tagColor.accent}60`, borderWidth: '1px' }}
            title={`${requisito.titulo} [${requisito.responsable || 'Sin asignar'}]`}
          >
            <div className="absolute left-0 top-0 bottom-0 opacity-40" style={{ width: requisito.estado === 'Done' ? '100%' : requisito.estado === 'In Progress' ? '50%' : '0%', backgroundColor: tagColor.accent }} />
            {barWidth > 14 && <span className="text-[9px] font-semibold text-white/95 truncate z-10 font-mono">{requisito.responsable || 'Sin asignar'}</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 bg-surface-800/70 border border-white/5 px-2.5 py-1.5 rounded-lg">
          <BarChart2 size={12} className="text-slate-500" />
          <span className="text-[10px] font-medium text-slate-400 mr-1">Vista:</span>
          <select value={vistaMode} onChange={(e) => { setVistaMode(e.target.value); setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 })) }} className="bg-transparent text-[11px] font-semibold text-slate-200 outline-none cursor-pointer">
            <option value="semana" className="bg-surface-700">Semana</option>
            <option value="mes" className="bg-surface-700">Mes</option>
            <option value="tres_meses" className="bg-surface-700">3 Meses</option>
          </select>
        </div>
        <div className="flex items-center gap-1 bg-surface-800/70 border border-white/5 p-1 rounded-lg">
          <button onClick={() => navegarTimeline(-1)} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronRight size={13} className="rotate-180" /></button>
          <button onClick={() => setFechaInicioVista(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-2 py-0.5 text-[10px] font-semibold text-slate-200 bg-white/5 hover:bg-white/10 rounded transition-colors">Hoy</button>
          <button onClick={() => navegarTimeline(1)} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"><ChevronRight size={13} /></button>
          <span className="text-[10px] font-mono text-slate-400 px-1.5 lowercase">{format(minDate, 'dd MMM', { locale: es }).replace('.', '')} – {format(maxDate, 'dd MMM yy', { locale: es }).replace('.', '')}</span>
        </div>
      </div>

      <div className="border border-white/5 rounded-xl bg-surface-700/20 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="relative" style={{ minWidth: `${Math.max(640, 260 + markers.length * 42)}px` }}>
            <div className="absolute inset-0 left-[260px] pointer-events-none flex justify-between z-0">
              {markers.map((_, idx) => <div key={idx} className="w-px h-full border-l border-white/[0.03]" />)}
              {semanas.map((sem, idx) => sem.showBoundary && <div key={`sem-${idx}`} className="absolute top-0 bottom-0 w-px bg-indigo-400/40 z-10" style={{ left: `${sem.boundaryPos}%` }} />)}
              {todayPosition !== null && <div className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-rose-500/50 z-20" style={{ left: `${todayPosition}%` }} />}
            </div>
            <div className="grid grid-cols-[260px_1fr] bg-surface-800/80 border-b border-white/5 items-stretch text-[10px] font-medium uppercase tracking-wider text-slate-500 z-10 relative">
              <div className="px-4 border-r border-white/5 flex items-center h-6">Semana del año</div>
              <div className="relative h-6">
                {semanas.map((sem, idx) => (
                  <div key={idx} className="absolute top-0 bottom-0 flex items-center justify-center border-l border-indigo-400/30 first:border-l-0 overflow-hidden" style={{ left: `${sem.left}%`, width: `${sem.right - sem.left}%` }}>
                    <span className="text-[8px] font-bold text-indigo-300 tracking-wider truncate px-1">Sem {sem.weekNumber}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[260px_1fr] bg-surface-800/80 border-b border-white/10 items-center text-[10px] font-medium uppercase tracking-wider text-slate-500 h-9 z-10 relative">
              <div className="px-4 border-r border-white/5 h-full flex items-center">Requisito</div>
              <div className="relative h-full flex justify-between items-center px-3 font-mono text-[9px] text-slate-500">
                {markers.map((date, i) => <span key={i} className="transform -translate-x-1/2 whitespace-nowrap lowercase">{format(date, 'dd MMM', { locale: es }).replace('.', '')}</span>)}
                {todayPosition !== null && <span className="absolute bg-rose-500 text-white text-[8px] font-bold px-1 py-0.5 rounded top-1 transform -translate-x-1/2 z-30" style={{ left: `${todayPosition}%` }}>Hoy</span>}
              </div>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {validRequisitos.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">Sin requisitos con fechas en este período.</div>
              ) : (
                <>
                  {activas.map(renderFila)}
                  {completadas.length > 0 && (
                    <div className="bg-[#0e1424]/30">
                      <div className="grid grid-cols-[260px_1fr] items-center min-h-[36px] border-b border-white/[0.03]">
                        <div className="px-4 h-full flex items-center">
                          <button onClick={() => setMostrarCompletadas(!mostrarCompletadas)} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded bg-surface-800/60 border border-white/5">
                            {mostrarCompletadas ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Completados ({completadas.length})
                          </button>
                        </div>
                        <div />
                      </div>
                      {mostrarCompletadas && <div className="divide-y divide-white/[0.02]">{completadas.map(renderFila)}</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
