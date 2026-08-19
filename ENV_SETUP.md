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
3. Select **Web application** and add the frontend origins to **Authorized JavaScript origins**: `http://localhost:5173` for local development and the production site origin for deployment.
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

Development currently targets the Render backend through `.env.development`. To test against a local backend instead, run:

```bash
VITE_API_BASE=http://localhost:4000/api VITE_API_URL=http://localhost:4000/api npm run dev
```

## Production checklist

- Use a managed PostgreSQL connection string with TLS as required by the provider.
- Generate a unique, high-entropy `JWT_SECRET` and strong admin password.
- Set `NODE_ENV=production`, `START_FRONTEND=false`, and the real comma-separated `FRONTEND_ORIGIN` values.
- Use a verified production Brevo sender and production Google origin.
- Keep `backend/.env` out of source control and secret managers' logs.

## Render frontend + separate backend

For a Render static site and Render web service:

1. Set the frontend Render environment variable `VITE_API_BASE` to the backend URL including `/api`, for example `https://your-backend.onrender.com/api`.
2. Set `VITE_APP_URL` to the frontend URL, for example `https://your-frontend.onrender.com`.
3. Use `npm run build` as the frontend build command and `docs` as the publish directory.
4. Set the backend `FRONTEND_ORIGIN` to the exact frontend origin, without a trailing slash.

Frontend `VITE_*` values are embedded at build time. Backend secrets must be configured only in the backend Render service environment.