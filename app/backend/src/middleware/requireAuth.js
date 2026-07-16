const { verifyToken, COOKIE_NAME } = require('../lib/auth')
const prisma = require('../lib/prisma')

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) return res.status(401).json({ error: 'No autenticado' })

    const payload = verifyToken(token)
    const usuario = await prisma.usuario.findUnique({ where: { id: payload.id } })
    if (!usuario) return res.status(401).json({ error: 'No autenticado' })

    req.user = { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre, email: usuario.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' })
  }
}

module.exports = requireAuth
