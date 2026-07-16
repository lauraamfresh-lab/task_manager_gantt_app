const express = require('express')
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validate = require('../middleware/validate')
const asyncHandler = require('../lib/asyncHandler')
const { bugSchema, bugUpdateSchema } = require('../schemas/bug.schema')

const router = express.Router()
router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const where = req.query.proyectoId ? { proyectoId: req.query.proyectoId } : {}
  const bugs = await prisma.bug.findMany({ where, orderBy: { fechaReporte: 'desc' } })
  res.json(bugs)
}))

router.post('/', validate(bugSchema), asyncHandler(async (req, res) => {
  const bug = await prisma.bug.create({ data: { ...req.body, reportanteId: req.user.id } })
  res.status(201).json(bug)
}))

router.patch('/:id', validate(bugUpdateSchema), asyncHandler(async (req, res) => {
  const bug = await prisma.bug.update({ where: { id: req.params.id }, data: req.body })
  res.json(bug)
}))

router.delete('/:id', requireRole('ADMIN'), asyncHandler(async (req, res) => {
  await prisma.bug.delete({ where: { id: req.params.id } })
  res.status(204).end()
}))

module.exports = router
