const { z } = require('zod')

const faseSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional().default(''),
  proyectoId: z.string().min(1, 'proyectoId es obligatorio')
})

const faseUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional()
})

module.exports = { faseSchema, faseUpdateSchema }
