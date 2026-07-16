const path = require('path')
const express = require('express')
const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth.routes')
const usuariosRoutes = require('./routes/usuarios.routes')
const proyectosRoutes = require('./routes/proyectos.routes')
const fasesRoutes = require('./routes/fases.routes')
const requisitosRoutes = require('./routes/requisitos.routes')
const bugsRoutes = require('./routes/bugs.routes')

const app = express()

app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/proyectos', proyectosRoutes)
app.use('/api/fases', fasesRoutes)
app.use('/api/requisitos', requisitosRoutes)
app.use('/api/bugs', bugsRoutes)

// El backend sirve el frontend ya compilado (frontend/dist) — mismo
// origen, mismo dominio, sin necesidad de configurar CORS.
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist')
app.use(express.static(frontendDist))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(frontendDist, 'index.html'))
})

// Middleware de errores: siempre el último. Cualquier error lanzado (o
// pasado con next(err)) en una ruta /api/* termina aquí como JSON.
app.use((err, req, res, next) => {
  console.error(err)
  if (res.headersSent) return next(err)
  res.status(err.status || 500).json({ error: err.publicMessage || 'Error interno del servidor' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`ProjectFlow backend escuchando en el puerto ${PORT}`)
})
