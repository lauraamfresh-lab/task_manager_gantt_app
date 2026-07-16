const { z } = require('zod')

const proyectoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['Proyecto', 'Operativa']).default('Proyecto')
})

const proyectoUpdateSchema = proyectoSchema.partial()

module.exports = { proyectoSchema, proyectoUpdateSchema }
