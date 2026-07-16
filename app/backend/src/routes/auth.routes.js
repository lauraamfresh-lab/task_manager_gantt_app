const express = require('express')
const prisma = require('../lib/prisma')
const validate = require('../middleware/validate')
const requireAuth = require('../middleware/requireAuth')
const asyncHandler = require('../lib/asyncHandler')
const { loginSchema } = require('../schemas/auth.schema')
const { verifyPassword, signToken, setAuthCookie, clearAuthCookie } = require('../lib/auth')

const router = express.Router()

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' })

  const ok = await verifyPassword(password, usuario.passwordHash)
  if (!ok) return res.status(401).json({ error: 'Credenciales incorrectas' })

  const token = signToken(usuario)
  setAuthCookie(res, token)
  res.json({ id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol })
}))

router.post('/logout', (req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user)
})

module.exports = router
