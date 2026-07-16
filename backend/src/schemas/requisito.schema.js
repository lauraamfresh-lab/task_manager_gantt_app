const { z } = require('zod')
const { ESTADOS, PRIORIDADES } = require('../../../shared/constants')

const fechaOpcional = z.string().nullable().optional()

const requisitoSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  descripcion: z.string().optional().default(''),
  estado: z.enum(ESTADOS).default('To Do'),
  prioridad: z.enum(PRIORIDADES).default('Media'),
  fechaInicio: fechaOpcional,
  fechaVencimiento: fechaOpcional,
  proyectoId: z.string().min(1, 'proyectoId es obligatorio'),
  faseId: z.string().nullable().optional(),
  responsableId: z.string().nullable().optional(),
  notas: z.string().optional().default(''),
  linkDocumento: z.string().optional().default(''),
  enMiDia: z.boolean().optional().default(false),
  dependenciaIds: z.array(z.string()).optional().default([])
})

const requisitoUpdateSchema = requisitoSchema.partial()

const checklistUpdateSchema = z.object({
  checklist: z.array(z.object({
    texto: z.string().min(1),
    completado: z.boolean().default(false)
  }))
})

module.exports = { requisitoSchema, requisitoUpdateSchema, checklistUpdateSchema }
