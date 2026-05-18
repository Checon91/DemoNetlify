# PulseDesk

PulseDesk is a complete Netlify-ready full-stack app built with Node, Express, JavaScript, JWT auth, and a small database layer.

The frontend is static HTML/CSS/JS in `public/`. The backend is an Express API deployed as a Netlify Function in `netlify/functions/api.js`. Data is stored in Netlify Blobs on Netlify and in a local JSON file during development.

## Features

- Register and login with hashed passwords.
- JWT-protected API routes.
- Create, edit, complete, reopen, and delete projects.
- Dashboard stats and filtering.
- Netlify deploy config included.
- Local development server included.

## Run Locally

```bash
npm install
cp .env.example .env
npm run dev
```

Then open:

```text
http://localhost:8888
```

Local data is saved in `.data/db.json`, which is ignored by git.

## Deploy To Netlify

1. Push this folder to GitHub.
2. Create a new Netlify site from that repository.
3. Set the build command to `npm run build`.
4. Set the publish directory to `public`.
5. Add this environment variable in Netlify:

```text
JWT_SECRET=your-long-random-production-secret
```

Netlify will run the Express API as a serverless function and use Netlify Blobs for hosted storage.

## API

All endpoints are under `/api`.

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id`
- `DELETE /projects/:id`
- `GET /health`

Authenticated requests need:

```text
Authorization: Bearer your-jwt-token
```
