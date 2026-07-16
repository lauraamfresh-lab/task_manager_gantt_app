const { z } = require('zod')
const { PRIORIDADES, ESTADOS_BUG } = require('../../../shared/constants')

const bugSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional().default(''),
  proyectoId: z.string().min(1, 'proyectoId es obligatorio'),
  prioridad: z.enum(PRIORIDADES).default('Media'),
  estado: z.enum(ESTADOS_BUG).default('Abierto'),
  reportadoPor: z.string().optional().default('')
})

const bugUpdateSchema = bugSchema.partial()

module.exports = { bugSchema, bugUpdateSchema }
