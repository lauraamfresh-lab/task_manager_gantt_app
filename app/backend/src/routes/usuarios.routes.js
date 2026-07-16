const express = require('express')
const prisma = require('../lib/prisma')
const requireAuth = require('../middleware/requireAuth')
const requireRole = require('../middleware/requireRole')
const validate = require('../middleware/validate')
const asyncHandler = require('../lib/asyncHandler')
const { crearUsuarioSchema, actualizarUsuarioSchema } = require('../schemas/usuario.schema')
const { hashPassword } = require('../lib/auth')

const router = express.Router()
router.use(requireAuth, requireRole('ADMIN'))

const SELECT_PUBLICO = { id: true, email: true, nombre: true, rol: true, createdAt: true }

router.get('/', asyncHandler(async (req, res) => {
  const usuarios = await prisma.usuario.findMany({ select: SELECT_PUBLICO, orderBy: { createdAt: 'asc' } })
  res.json(usuarios)
}))

router.post('/', validate(crearUsuarioSchema), asyncHandler(async (req, res) => {
  const { email, password, nombre, rol } = req.body
  const existente = await prisma.usuario.findUnique({ where: { email } })
  if (existente) return res.status(409).json({ error: 'Ya existe un usuario con ese email' })

  const usuario = await prisma.usuario.create({
    data: { email, nombre, rol, passwordHash: await hashPassword(password) },
    select: SELECT_PUBLICO
  })
  res.status(201).json(usuario)
}))

router.patch('/:id', validate(actualizarUsuarioSchema), asyncHandler(async (req, res) => {
  const data = { ...req.body }
  if (data.password) {
    data.passwordHash = await hashPassword(data.password)
    delete data.password
  }
  const usuario = await prisma.usuario.update({ where: { id: req.params.id }, data, select: SELECT_PUBLICO })
  res.json(usuario)
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' })
  }
  await prisma.usuario.delete({ where: { id: req.params.id } })
  res.status(204).end()
}))

module.exports = router
