const express = require('express')
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validate = require('../middleware/validate')
const asyncHandler = require('../lib/asyncHandler')
const { proyectoSchema, proyectoUpdateSchema } = require('../schemas/proyecto.schema')

const router = express.Router()
router.use(requireAuth)

// Lectura: ambos roles. Escritura: solo ADMIN (según el diseño acordado).
router.get('/', asyncHandler(async (req, res) => {
  const proyectos = await prisma.proyecto.findMany({ orderBy: { orden: 'asc' } })
  res.json(proyectos)
}))

router.post('/', requireRole('ADMIN'), validate(proyectoSchema), asyncHandler(async (req, res) => {
  const count = await prisma.proyecto.count()
  const proyecto = await prisma.proyecto.create({ data: { ...req.body, orden: count } })
  res.status(201).json(proyecto)
}))

router.patch('/:id', requireRole('ADMIN'), validate(proyectoUpdateSchema), asyncHandler(async (req, res) => {
  const proyecto = await prisma.proyecto.update({ where: { id: req.params.id }, data: req.body })
  res.json(proyecto)
}))

router.post('/:id/mover', requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { direccion } = req.body // 'up' | 'down'
  const proyectos = await prisma.proyecto.findMany({ orderBy: { orden: 'asc' } })
  const index = proyectos.findIndex(p => p.id === req.params.id)
  if (index === -1) return res.status(404).json({ error: 'Proyecto no encontrado' })

  const targetIndex = direccion === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= proyectos.length) return res.json(proyectos)

  const a = proyectos[index]
  const b = proyectos[targetIndex]
  await prisma.$transaction([
    prisma.proyecto.update({ where: { id: a.id }, data: { orden: b.orden } }),
    prisma.proyecto.update({ where: { id: b.id }, data: { orden: a.orden } })
  ])

  const actualizados = await prisma.proyecto.findMany({ orderBy: { orden: 'asc' } })
  res.json(actualizados)
}))

router.delete('/:id', requireRole('ADMIN'), asyncHandler(async (req, res) => {
  await prisma.proyecto.delete({ where: { id: req.params.id } })
  res.status(204).end()
}))

module.exports = router
