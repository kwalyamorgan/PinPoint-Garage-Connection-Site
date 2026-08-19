# Environment setup

The backend loads `backend/.env` when started from the `backend` directory. Start by copying `backend/.env.example` to `backend/.env`, then replace every `replace-*` value. The local `backend/.env` file is ignored and must never be committed.

## PostgreSQL

Choose one connection method:

- Local PostgreSQL: set `DATABASE_URL` to `postgresql://USER:PASSWORD@localhost:5432/pinpoint`.
- Docker Compose: the repository's compose file uses `postgresql://pinpoint_user:mmmm@localhost:5432/pinpoint` from the host. Inside the backend container it uses `postgres` as the hostname.
- Separate variables: remove `DATABASE_URL` and set `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, and `PGDATABASE`.

The backend creates its tables on startup. `ADMIN_EMAIL` and `ADMIN_PASSWORD` seed an admin account only when that email does not already exist.

## Google sign-in

1. Open [Google Cloud Console](https://console.cloud.google.com/), create or select a project, and configure the OAuth consent screen.
2. Create an OAuth client under **APIs & Services > Credentials > Create credentials > OAuth client ID**.
3. Select **Web application** and add the frontend origin to **Authorized JavaScript origins**: `http://localhost:5173`.
4. Put the resulting web client ID in both `GOOGLE_CLIENT_ID` in `backend/.env` and `VITE_GOOGLE_CLIENT_ID` in the frontend `.env`.

This application verifies Google Identity Services ID tokens; it does not use a Google client secret or an OAuth redirect URI. Do not put a client secret in frontend variables.

## Brevo password-reset email

1. Create a Brevo account and open **SMTP & API > API Keys**.
2. Create an API key and set it as `BREVO_API_KEY`.
3. Verify the sender address or domain under **Senders & IP**.
4. Set `FROM_EMAIL` to that verified sender and `FROM_NAME` to the displayed sender name.

Brevo is currently used by the forgot-password endpoint. Registration OTPs are stored and logged by the current code; they are not sent through Brevo yet.

## Cloudinary listing images

1. Create or select a Cloudinary product environment.
2. Copy the cloud name, API key, and API secret from the Cloudinary console into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

The API secret stays backend-only. The backend returns a short-lived signed upload payload to authenticated users, using the fixed `pinpoint/listings` folder.

## Frontend variables

The Vite frontend uses:

```dotenv
VITE_API_BASE=http://localhost:4000/api
VITE_API_URL=http://localhost:4000/api
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=PinPoint Garage Connection
VITE_GOOGLE_CLIENT_ID=replace-with-your-google-web-client-id.apps.googleusercontent.com
```

The frontend uses `VITE_API_BASE` for all API requests. Vite variables are public at build time, so never place Brevo, Cloudinary secrets, database passwords, or `JWT_SECRET` in them.

Local development command:

```bash
VITE_API_BASE=http://localhost:4000/api VITE_API_URL=http://localhost:4000/api npm run dev
```

## Optional Render deployment

This repository stays local-first by default. To deploy to Render without changing workspace files, set environment variables in Render only:

1. Frontend (Static Site) environment variables:
	- `VITE_API_BASE=https://<your-backend-service>.onrender.com/api`
	- `VITE_APP_URL=https://<your-frontend-service>.onrender.com`
	- `VITE_GOOGLE_CLIENT_ID=<your-google-web-client-id>`
2. Backend (Web Service) environment variables:
	- `FRONTEND_ORIGIN=https://<your-frontend-service>.onrender.com`
	- `DATABASE_URL=<your-render-postgres-url>`
	- `JWT_SECRET=<strong-random-secret>`
	- `GOOGLE_CLIENT_ID=<your-google-web-client-id>`
3. Do not commit Render URLs into `.env` or `backend/.env`; keep those files local-only.

Frontend `VITE_*` values are embedded at build time. Backend secrets must be configured only in backend service environment variables.