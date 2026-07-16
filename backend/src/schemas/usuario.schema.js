const { z } = require('zod')
const { ROLES } = require('../../../shared/constants')

const crearUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  rol: z.enum(ROLES).default('USER')
})

const actualizarUsuarioSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  nombre: z.string().min(1).optional(),
  rol: z.enum(ROLES).optional()
})

module.exports = { crearUsuarioSchema, actualizarUsuarioSchema }
