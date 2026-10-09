# Urja Meter API

A read-only TypeScript/Express service that gives engineers and data tools a stable JSON API over the legacy Urja Meter Ops portal. It handles portal authentication internally, normalizes inconsistent payloads, and exposes meter search, nameplate and network details, locations, consumption readings, and transformer inventory. A small React client demonstrates the API.

## What it includes

- Paginated meter search and transformer inventory.
- Meter nameplate details and the seven-level network hierarchy.
- Meter coordinates and recent half-hour consumption readings.
- In-memory portal session handling with one bounded retry after 401/403.
- Stable JSON response and error shapes, plus an OpenAPI 3.0.3 specification.
- A React/Vite explorer for searching meters and viewing their network path, location, and readings.

## Structure

```text
src/
  clients/       Authenticated HTTP client for the portal
  config/        Environment configuration
  controllers/   HTTP input validation and response handling
  middleware/    Consistent API errors
  routes/        Express routes
  services/      Portal calls and response normalization
  types/         Upstream and public API types
  utils/         SvelteKit page-data decoding and numeric validation
  __tests__/     Fast API input and health checks
  app.ts         Express app
  server.ts      Local server entry point
frontend/        Optional React/Vite explorer
PROTOCOL.md      Observed portal behavior and data caveats
openapi.json     Public API contract
docs/FINDINGS.md Investigation notes
```

## Run locally

Requirements: Node.js 20.19+ or 22.12+ and npm.

1. Install backend dependencies:

   ```bash
   npm ci
   ```

2. Create `.env` from the example and enter the portal credentials provided for your evaluation environment:

   ```bash
   cp .env.example .env
   ```

   ```env
   PORT=3000
   URJA_BASE_URL=https://urja-ops.flockenergy.tech
   URJA_EMAIL=your-portal-email
   URJA_PASSWORD=your-portal-password
   ```

   Keep `.env` local; it is gitignored.

3. Start the API:

   ```bash
   npm run dev
   ```

4. In a second terminal, optionally start the React client:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

   Vite proxies `/api` requests to `http://localhost:3000` during development.

## API examples

Check service health:

```bash
curl http://localhost:3000/health
```

Search meters (page size follows the portal's observed page size of 20):

```bash
curl 'http://localhost:3000/api/meters?q=J1000&page=1'
```

Get a meter's normalized nameplate and network hierarchy:

```bash
curl http://localhost:3000/api/meters/J100000
```

```json
{
  "data": {
    "nameplate": {
      "meterId": "J100000",
      "serialNo": "SE33962",
      "make": "HPL",
      "phaseType": "single",
      "installStatus": "Decommissioned",
      "installationType": "Whole Current"
    },
    "hierarchy": {
      "zone": { "name": "Jaipur Zone 1", "code": "Z-01" },
      "circle": { "name": "Circle 1", "code": "C-01" },
      "division": { "name": "Division 1", "code": "D-01" },
      "subdivision": { "name": "Subdivision 1", "code": "SD-01" },
      "substation": { "name": "Substation 1", "code": "SS-01" },
      "feeder": { "name": "Feeder 1", "code": "F-001" },
      "dt": { "name": "Malviya Nagar DT 1", "code": "DT-001" }
    }
  }
}
```

Get location, consumption, or transformers:

```bash
curl http://localhost:3000/api/meters/J100000/location
curl http://localhost:3000/api/meters/J100000/consumption
curl 'http://localhost:3000/api/transformers?page=1'
```

The API returns `400` for invalid query/path input, `502` for upstream failures or unexpected upstream data, and `500` for unexpected internal errors. Error bodies use `{ "error": { "code": "...", "message": "..." } }`.

## Build and checks

```bash
npm run build
npm test
```

The API tests cover service health and invalid query handling. The frontend can be type-checked and bundled with `cd frontend && npm run build`.

## API reference

- [openapi.json](./openapi.json) describes this service's public API.
- [PROTOCOL.md](./PROTOCOL.md) documents the portal routes, authentication, observed payloads, and caveats.
- [docs/FINDINGS.md](./docs/FINDINGS.md) keeps the investigation notes.

## Assumptions and trade-offs

- The integration is read-only. It makes no portal changes.
- Credentials come from environment variables and are never returned by this API. Session cookies stay in process memory.
- One shared login promise prevents concurrent first requests from creating duplicate sessions. A 401/403 triggers one re-login and retry.
- The clean API preserves upstream pagination rather than inventing page-size behavior.
- The portal has legacy and v2 nameplate shapes; the API normalizes both into the same `nameplate` contract.
- Numeric measurements become JSON numbers. Portal timestamps remain strings because their timezone is unknown.
- If the portal changes its SvelteKit page-data encoding or detail fields, the decoder returns a clear upstream error instead of silently fabricating fields.
- There is no cache because freshness requirements were not specified. Each request reflects current upstream data.

## Intentionally left out

- Mutations, administration, and write endpoints.
- The signed full-dataset export and its signing-key flow.
- A persistent local index, cross-meter analytics, or caching policy.
- Guessing timestamp timezone or filling missing hierarchy values from neighboring records.

## With more time

- Add mocked upstream contract tests for both meter-detail versions and session expiry.
- Add request correlation IDs and structured logs without recording credentials or cookies.
- Observe session expiry and portal throttling over a longer run, then refine retry and timeout policy.
- Define freshness requirements before adding a cache or local query index.
- Add a map and interval-usage visualization after confirming the reading semantics and timestamp timezone.

## Reflection

### What assumptions did I make?

I treated the service as read-only, mapped only fields observed in the portal, preserved timestamps without timezone conversion, and returned missing hierarchy labels as empty values rather than guessing. I assumed a 401/403 is a useful signal for one authentication retry; that behavior remains bounded because other failure modes have not been exhaustively observed.

### Which part was the most difficult, and how did I get unstuck?

The most difficult part was matching the portal's login action. An initial JSON request got `415`, and a later form request got `403`; comparing the successful request showed that the portal expects URL-encoded credentials and the `x-sveltekit-action: true` header. The meter detail payload also took investigation: legacy records use label/value pairs, while v2 records put JSON inside SvelteKit's indexed page-data graph.

### If I had another day, what would I improve?

I would add mocked upstream tests for both payload versions and session recovery, investigate session expiry and throttling over time, and build a map or interval-usage view only after confirming timezone and measurement semantics.

### What mistake did I make while solving this?

I initially guessed the login format from common API patterns instead of reproducing the portal's successful browser request, which cost time. The first version also left hierarchy and v2 detail records out of the API. Comparing both observed payload shapes helped correct those gaps.

### If I were reviewing my own submission, what would I criticise?

The detail decoder depends on the observed SvelteKit serialization format, and session expiry behavior has not been observed end-to-end. The service intentionally surfaces unexpected payloads as a 502; a production integration would benefit from stronger contract tests, monitoring, and a portal-owned stable API.
