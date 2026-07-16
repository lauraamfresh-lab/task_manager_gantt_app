// Crea el usuario administrador inicial. Se ejecuta con `npm run seed`
// (o `node prisma/seed.js`) una sola vez, tras las migraciones.
//
// Variables de entorno esperadas:
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOMBRE (opcional, por defecto "Admin")

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const nombre = process.env.ADMIN_NOMBRE || 'Admin'

  if (!email || !password) {
    console.error('Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en las variables de entorno.')
    process.exit(1)
  }

  const existente = await prisma.usuario.findUnique({ where: { email } })
  if (existente) {
    console.log(`Ya existe un usuario con el email ${email}. No se crea ninguno nuevo.`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const admin = await prisma.usuario.create({
    data: { email, nombre, passwordHash, rol: 'ADMIN' }
  })

  console.log(`Usuario ADMIN creado: ${admin.email} (id: ${admin.id})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
