# Urja Grid Explorer

Urja Grid Explorer is a web interface for searching electricity meters and reviewing their network, location, and recent consumption details. The React client uses the API service in this repository.

## Project scope

This project provides the meter explorer interface, Express API, and supporting documentation. [PROTOCOL.md](./PROTOCOL.md) records the portal integration behavior and current data caveats.

The take-home brief supplies a login to the Urja Meter Ops portal and says the portal has no ready-made API. The service therefore makes authenticated requests to the portal and exposes its own JSON endpoints.

## What the explorer does

- Searches and pages through meter records.
- Opens meter details in an animated overlay.
- Shows the meter nameplate, seven-level network path, coordinates, and recent readings.
- Keeps the overlay usable with keyboard close and reduced-motion preferences.

## Technology and layout

- **Frontend:** React, TypeScript, and Vite (`frontend/`)
- **API:** Express and TypeScript (`src/`)
- **Contract:** OpenAPI 3 specification (`openapi.json`)

```text
frontend/src/        Meter directory, details overlay, API client, and styles
src/                 API routes, portal client, and data normalization
docs/FINDINGS.md     Scope, behavior, and verification notes for this revision
PROTOCOL.md          Portal integration notes and known data limits
openapi.json         Public API contract
```

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

Install the API dependencies and create a local environment file:

```bash
npm ci
cp .env.example .env
```

Set the portal login in `.env`:

```env
PORT=3000
URJA_BASE_URL=https://urja-ops.flockenergy.tech
URJA_EMAIL=your-portal-email
URJA_PASSWORD=your-portal-password
```

Keep `.env` local; Git ignores it. Start the API:

```bash
npm run dev
```

In another terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`. During development, Vite proxies `/api` requests to the API on port 3000. Portal credentials are required for live meter data.

## API routes

| Route | Purpose |
| --- | --- |
| `GET /health` | Check API process health |
| `GET /api/meters?q=&page=` | Search and page through meters |
| `GET /api/meters/:meterId` | Get a meter's nameplate and network hierarchy |
| `GET /api/meters/:meterId/location` | Get coordinates |
| `GET /api/meters/:meterId/consumption` | Get recent consumption readings |
| `GET /api/transformers?page=` | List transformer records |

Example:

```bash
curl 'http://localhost:3000/api/meters?q=J1000&page=1'
```

See [openapi.json](./openapi.json) for request and response schemas. The API returns structured errors for invalid input and upstream failures.

## Build and checks

```bash
npm run build
npm test
cd frontend
npm run build
```

## Notes and limitations

- The integration is read-only; no portal mutations are included.
- Portal login credentials must be supplied locally and are not committed.
- The API keeps its session cookie in process memory. Restarting the API clears that session.
- Portal timestamps do not include a known timezone, so the API preserves them as strings.
- The API and portal integration should be validated against the upstream portal before production use.
- The explorer depends on the API and the external portal being available.

## Further reading

- [PROTOCOL.md](./PROTOCOL.md) — portal integration and data caveats.
- [docs/FINDINGS.md](./docs/FINDINGS.md) — scope and verification notes.
- [frontend/README.md](./frontend/README.md) — frontend-specific instructions.
