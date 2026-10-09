# Project notes

## Scope of this revision

This revision replaces the meter explorer's visual layout and rewrites the Markdown documentation. See [PROTOCOL.md](../PROTOCOL.md) for the application's portal integration details and known data caveats.

The current interface presents a searchable, paginated meter directory and opens each record in an animated details overlay. The overlay shows the nameplate, network hierarchy, location, and recent consumption when the API provides them. The left navigation rail was removed in favor of a compact top header.

## Runtime configuration

The API needs the portal login in the root `.env` file. Without `URJA_EMAIL` and `URJA_PASSWORD`, the API starts but data requests fail during login. `.env` is ignored by Git; `.env.example` contains only placeholders.

The frontend sends requests through Vite's `/api` proxy to the local API on port 3000. Start the API and frontend in separate terminals as described in the root README.

## Verification recorded for this revision

- With the supplied local portal credentials configured, `GET /api/meters?page=1&pageSize=5` returned HTTP 200 and 20 meter rows, with `total: 403`.
- The frontend dev server returned HTTP 200 for the application and its transformed `App.tsx` module.
- `cd frontend && npm run build` completed successfully after the UI and documentation changes.

These checks confirm the local development flow at that time. They are not a full re-test of every portal route or a claim that the upstream portal's snapshot data is permanent.

## Known limits

- API behavior should be reviewed against the upstream portal before production use.
- Live data requires valid portal credentials and an available upstream portal.
- Consumption timestamps do not carry a confirmed timezone.
- The upstream API protocol and session behavior can change independently of this project.
