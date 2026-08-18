Development with Docker Compose

This repository includes a `docker-compose.yml` that runs Postgres, the backend, and the frontend for local development.

Bring up the stack:

```bash
# from project root
docker compose up --build
```

Services:
- `postgres`: Postgres 16 with DB `pinpoint` and user `pinpoint_user` (password `mmmm`) — change in `docker-compose.yml` if needed.
- `backend`: Node backend, mounts `./backend` for live edits. Backend envs include `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- `frontend`: Vite dev server, mounts project root. It is started with `--host 0.0.0.0` to be reachable from the host.

Notes:
- The backend sets `START_FRONTEND=false` inside the container so it will not try to spawn the frontend process again.
- If you want to run only a subset, use `docker compose up backend` or `docker compose up frontend`.
- For a fresh environment the Postgres container will create the `pinpoint` DB and the `pinpoint_user` account automatically.

Stopping:

```bash
docker compose down
```
