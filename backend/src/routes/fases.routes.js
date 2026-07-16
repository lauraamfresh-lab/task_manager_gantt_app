const express = require('express')
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validate = require('../middleware/validate')
const asyncHandler = require('../lib/asyncHandler')
const { faseSchema, faseUpdateSchema } = require('../schemas/fase.schema')

const router = express.Router()
router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const where = req.query.proyectoId ? { proyectoId: req.query.proyectoId } : {}
  const fases = await prisma.fase.findMany({ where })
  res.json(fases)
}))

router.post('/', requireRole('ADMIN'), validate(faseSchema), asyncHandler(async (req, res) => {
  const fase = await prisma.fase.create({ data: req.body })
  res.status(201).json(fase)
}))

router.patch('/:id', requireRole('ADMIN'), validate(faseUpdateSchema), asyncHandler(async (req, res) => {
  const fase = await prisma.fase.update({ where: { id: req.params.id }, data: req.body })
  res.json(fase)
}))

router.delete('/:id', requireRole('ADMIN'), asyncHandler(async (req, res) => {
  await prisma.fase.delete({ where: { id: req.params.id } })
  res.status(204).end()
}))

module.exports = router
