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

## GitHub Pages frontend + separate backend

If your frontend is deployed on GitHub Pages and backend runs elsewhere (for example Render), set the following:

1. In GitHub repository settings, create Actions secret `VITE_API_BASE`.
2. Set it to your backend API base URL including `/api`.
	- Example: `https://your-backend.onrender.com/api`
3. Optional: create repository variable `VITE_APP_URL` with your frontend URL.
	- Example: `https://<username>.github.io/<repo>`
4. In backend environment, set `FRONTEND_ORIGIN` to include your GitHub Pages origin.
	- Example: `https://<username>.github.io`
	- If you use a custom domain, include that domain too.

The GitHub Pages workflow now fails fast if `VITE_API_BASE` is missing, so production builds never deploy with `localhost` API endpoints.