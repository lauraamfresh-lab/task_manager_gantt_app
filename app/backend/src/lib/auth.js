const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const COOKIE_NAME = 'projectflow_token'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('Falta la variable de entorno JWT_SECRET')
  }
  return secret
}

function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

function signToken(usuario) {
  return jwt.sign({ id: usuario.id, rol: usuario.rol }, getJwtSecret(), { expiresIn: '7d' })
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret())
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
  })
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME)
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie
}
