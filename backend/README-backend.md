# Backend (Express + TypeScript)

Run locally:

```bash
cd backend
npm install
npm run dev
```

Build and run:

```bash
cd backend
npm install
npm run build
npm start
```

API endpoints are exposed under `/api/*` (e.g. `/api/garages`). Static images are served at `/images`.

Notes about native modules:
- `better-sqlite3` is a native module and may require system build tools and sqlite development headers on Linux. On Debian/Ubuntu run:

	```bash
	sudo apt update
	sudo apt install build-essential python3 pkg-config libsqlite3-dev
	```

- `bcryptjs` is used instead of `bcrypt` to avoid native builds. If you still face `npm install` errors, ensure you have the above packages and a compatible `node` version.
