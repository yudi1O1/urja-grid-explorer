# Investigation findings

These notes summarize the read-only requests used to shape the API. The polished protocol reference is [PROTOCOL.md](../PROTOCOL.md); implementation details and run instructions are in [README.md](../README.md).

## Confirmed observations

- The login action expects URL-encoded credentials plus `x-sveltekit-action: true`. It answers with HTTP 200 and a JSON-described 303 redirect, and sets a secure session cookie with a one-hour max age.
- Meter search is `GET /portal/meters/search?q=...&page=...`. On the observed instance it returned 403 meters, 20 per page, and 100 matches for `j1000`.
- The detail page's SvelteKit `__data.json` payload carries the nameplate and seven network levels. Legacy records encode nameplate values as label/value pairs; v2 records encode an `installed_meter` JSON object inside `classData`.
- Location is available from `/portal/meters/{meterId}/geo`; consumption is available from `/portal/meters/{meterId}/energy`.
- `GET /portal/dts?page=1` returns transformer rows with `code`, `name`, `feederCode`, and `capacityKva`; the observed instance returned 40 rows over two pages.
- Numeric location and consumption values arrive as strings. Energy timestamps have no timezone marker.
- Search page 21 returned the three remaining rows. Page 22 returned no rows; invalid page values were normalized to page 1 upstream. The service instead validates client input and forwards valid positive pages.

## API decisions

- Keep portal authentication and cookies private to the service.
- Present one stable nameplate and hierarchy response across both observed meter detail versions.
- Split hierarchy labels into `{name, code}` when a parenthesized code is present; keep a label intact and use an empty code when it is not.
- Preserve timestamp strings and convert numeric measurement fields to JSON numbers.
- Expose transformer inventory because it is a small, paginated read endpoint that helps consumers interpret DT references.
- Do not call the signed export or signing-key endpoints in this implementation. The core service can meet its use case through search, details, location, energy, and transformer routes.

## Still unknown

- The exact timezone represented by consumption timestamps.
- Whether a portal session refreshes on use and all status codes used after expiry.
- Upstream request throttling and long-term availability expectations.
- Whether hierarchy labels and empty values remain consistent across every meter.
- The signing algorithm and exact operational contract for the full export path.
