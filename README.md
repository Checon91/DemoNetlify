# PulseDesk

PulseDesk es una app full stack lista para Netlify, creada con Node, Express, JavaScript, autenticacion JWT y una capa sencilla de base de datos.

El frontend es HTML/CSS/JS estatico dentro de `public/`. El backend es una API de Express desplegada como Netlify Function en `netlify/functions/api.js`. Los datos se guardan en Netlify Blobs en produccion y en un archivo JSON local durante desarrollo.

## Funcionalidades

- Registro e inicio de sesion con contrasenas encriptadas.
- Rutas de API protegidas con JWT.
- Crear, editar, completar, reabrir y eliminar proyectos.
- Estadisticas y filtros en el dashboard.
- Configuracion de deploy en Netlify incluida.
- Servidor local de desarrollo incluido.

## Ejecutar Localmente

```bash
npm install
cp .env.example .env
npm run dev
```

Despues abre:

```text
http://localhost:8888
```

Los datos locales se guardan en `.data/db.json`, que Git ignora.

## Deploy En Netlify

1. Sube esta carpeta a GitHub.
2. Crea un nuevo sitio en Netlify desde ese repositorio.
3. Usa `npm run build` como build command.
4. Usa `public` como publish directory.
5. Agrega esta variable de entorno en Netlify:

```text
JWT_SECRET=tu-secreto-largo-y-seguro-de-produccion
```

Netlify ejecutara la API de Express como serverless function y usara Netlify Blobs como almacenamiento.

## API

Todos los endpoints estan bajo `/api`.

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `GET /health`

Las solicitudes autenticadas necesitan:

```text
Authorization: Bearer tu-token-jwt
```
