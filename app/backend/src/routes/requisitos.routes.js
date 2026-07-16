const express = require('express')
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/requireAuth')
const validate = require('../middleware/validate')
const asyncHandler = require('../lib/asyncHandler')
const { requisitoSchema, requisitoUpdateSchema, checklistUpdateSchema } = require('../schemas/requisito.schema')

const router = express.Router()
router.use(requireAuth)

const include = {
  checklist: true,
  dependeDe: { select: { dependeDeId: true } },
  responsable: { select: { id: true, nombre: true } },
  creadoPor: { select: { id: true, nombre: true } }
}

// Aplana la tabla puente de dependencias a un array simple de ids,
// que es la forma que espera el frontend.
function serialize(r) {
  return { ...r, dependencias: (r.dependeDe || []).map(d => d.dependeDeId) }
}

router.get('/', asyncHandler(async (req, res) => {
  const where = {}
  if (req.query.proyectoId) where.proyectoId = req.query.proyectoId
  if (req.query.faseId) where.faseId = req.query.faseId
  if (req.query.responsableId) where.responsableId = req.query.responsableId

  const requisitos = await prisma.requisito.findMany({ where, include, orderBy: { createdAt: 'asc' } })
  res.json(requisitos.map(serialize))
}))

// ADMIN y USER pueden crear requisitos (decisión confirmada en el diseño).
router.post('/', validate(requisitoSchema), asyncHandler(async (req, res) => {
  const { dependenciaIds, fechaInicio, fechaVencimiento, ...data } = req.body

  const requisito = await prisma.requisito.create({
    data: {
      ...data,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
      fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      creadoPorId: req.user.id,
      dependeDe: dependenciaIds?.length
        ? { create: dependenciaIds.map(id => ({ dependeDeId: id })) }
        : undefined
    },
    include
  })
  res.status(201).json(serialize(requisito))
}))

// USER: edición completa solo en los requisitos que él mismo creó.
// En el resto, solo puede reasignarse, cambiar fechas/fase o el estado
// (tal y como pedía el documento original: "reasignarse, cambiar fechas,
// mover planificación").
const CAMPOS_LIMITADOS_USER = ['fechaInicio', 'fechaVencimiento', 'responsableId', 'estado', 'faseId', 'enMiDia']

router.patch('/:id', validate(requisitoUpdateSchema), asyncHandler(async (req, res) => {
  const existente = await prisma.requisito.findUnique({ where: { id: req.params.id } })
  if (!existente) return res.status(404).json({ error: 'Requisito no encontrado' })

  let payload = req.body
  if (req.user.rol !== 'ADMIN' && existente.creadoPorId !== req.user.id) {
    const permitido = {}
    for (const campo of CAMPOS_LIMITADOS_USER) {
      if (campo in payload) permitido[campo] = payload[campo]
    }
    payload = permitido
  }

  const { dependenciaIds, fechaInicio, fechaVencimiento, ...data } = payload
  if ('fechaInicio' in payload) data.fechaInicio = fechaInicio ? new Date(fechaInicio) : null
  if ('fechaVencimiento' in payload) data.fechaVencimiento = fechaVencimiento ? new Date(fechaVencimiento) : null

  if (dependenciaIds) {
    await prisma.requisitoDependencia.deleteMany({ where: { requisitoId: req.params.id } })
    if (dependenciaIds.length) {
      await prisma.requisitoDependencia.createMany({
        data: dependenciaIds.map(id => ({ requisitoId: req.params.id, dependeDeId: id }))
      })
    }
  }

  const requisito = await prisma.requisito.update({ where: { id: req.params.id }, data, include })
  res.json(serialize(requisito))
}))

router.patch('/:id/checklist', validate(checklistUpdateSchema), asyncHandler(async (req, res) => {
  const { checklist } = req.body
  await prisma.$transaction([
    prisma.checklistItem.deleteMany({ where: { requisitoId: req.params.id } }),
    prisma.checklistItem.createMany({
      data: checklist.map(item => ({ requisitoId: req.params.id, texto: item.texto, completado: item.completado }))
    })
  ])
  const requisito = await prisma.requisito.findUnique({ where: { id: req.params.id }, include })
  res.json(serialize(requisito))
}))

// Eliminar requisitos queda reservado a ADMIN para evitar borrados accidentales.
router.delete('/:id', asyncHandler(async (req, res) => {
  const existente = await prisma.requisito.findUnique({ where: { id: req.params.id } })
  if (!existente) return res.status(404).json({ error: 'Requisito no encontrado' })
  if (req.user.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo un administrador puede eliminar requisitos' })
  }
  await prisma.requisito.delete({ where: { id: req.params.id } })
  res.status(204).end()
}))

module.exports = router
