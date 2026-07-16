# ProjectFlow

SPA de gestión de proyectos. Dark Mode · React + Vite + Tailwind CSS.

## Setup local

```bash
# 1. Entrar al directorio
cd projectflow

# 2. Instalar dependencias
npm install

# 3. Servidor de desarrollo
npm run dev
# → http://localhost:5173
```

## Build para producción / Netlify

```bash
npm run build
# Genera la carpeta /dist lista para desplegar
```

## Despliegue en Netlify

### Opción A — Drag & Drop
1. Ejecuta `npm run build`
2. Ve a https://app.netlify.com/drop
3. Arrastra la carpeta `dist/`

### Opción B — CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Opción C — Git Integration
1. Sube el proyecto a GitHub
2. Conecta el repo en Netlify → Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

## Stack
- React 18 + Vite
- Tailwind CSS
- Context API + localStorage
- react-google-charts (Gantt)
- date-fns
- lucide-react

## Vistas
- **Mi Día** — tareas con vencimiento hoy
- **Proyectos y Tareas** — lista agrupada por proyecto, cambio de estado inline
- **Gantt** — diagrama cronológico con Google Charts
