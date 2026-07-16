// Constantes compartidas. El backend las usa para validar (Zod) y el
// frontend para pintar selects/badges. Si cambian los valores aquí,
// cambian en toda la aplicación.

const ROLES = ['ADMIN', 'USER']
const ESTADOS = ['To Do', 'In Progress', 'Done']
const PRIORIDADES = ['Alta', 'Media', 'Baja']
const ESTADOS_BUG = ['Abierto', 'En Progreso', 'Resuelto']

module.exports = { ROLES, ESTADOS, PRIORIDADES, ESTADOS_BUG }
