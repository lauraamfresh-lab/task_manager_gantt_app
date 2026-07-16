# ProjectFlow

Plataforma de gestión de proyectos y tareas para equipos.

## Estructura

```
/
├── frontend/   → SPA React + Vite + Tailwind (UI)
├── backend/    → API Express + Prisma + PostgreSQL (/api/*)
├── shared/     → constantes compartidas (estados, prioridades, roles)
└── package.json
```

Actualmente el **frontend sigue funcionando con localStorage** (aún no está conectado a la API). La conexión frontend↔backend, sustituyendo el almacenamiento local por llamadas a `/api/*`, es el siguiente paso pendiente de aprobación.

## Desarrollo local

### Backend

```bash
cd backend
npm install
cp .env.example .env      # y rellena DATABASE_URL / JWT_SECRET
npm run prisma:migrate:dev
npm run seed               # crea el usuario ADMIN inicial (usa ADMIN_EMAIL/ADMIN_PASSWORD del .env)
npm run dev                 # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## Build de producción

Desde la raíz:

```bash
npm run build       # instala todo y compila frontend/dist
npm run start        # arranca el backend, que sirve frontend/dist bajo el mismo dominio
```

La guía completa de despliegue en Render (crear el servicio, la base de datos, variables de entorno, migraciones, etc.) se entregará como el último paso, una vez conectado el frontend a la API.
