# Urja Meter Ops protocol

This note records the read-only behavior observed in the supplied Urja Meter Ops instance on 8 October 2026. Counts and sample values describe that instance at the time of observation and may change.

## Investigation scope

I used the supplied operator account to make ordinary HTTPS requests to the same routes used by the portal. I called the login, search, meter detail, location, consumption, and transformer-list routes. I did not call write or configuration routes, retrieve signing keys, or modify portal data. The portal is a SvelteKit application; its application data routes return JSON, so the service does not scrape rendered HTML for API results.

## Authentication and sessions

Login is a SvelteKit form action rather than a conventional JSON login endpoint.

| Item | Observed behavior |
| --- | --- |
| Request | `POST /login` |
| Body | URL-encoded `email` and `password` fields |
| Required headers | `Accept: application/json`, `Content-Type: application/x-www-form-urlencoded`, `Origin`, `Referer`, and `x-sveltekit-action: true` |
| HTTP response | `200 OK` |
| Response body | `{"type":"redirect","status":303,"location":"/meters"}` |
| Session | `__Secure-better-auth.session_token` cookie; `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age=3600` |

The 303 is described in the JSON body; it is not the HTTP response status. Authenticated API calls need the session cookie. The service keeps it in memory, shares an in-flight login between concurrent requests, and retries once after an upstream 401 or 403. I observed the cookie lifetime, but did not wait for expiry to establish whether every expired session produces those statuses or whether the portal refreshes the cookie.

## Routes and data

| Portal route | Method | Observed response and behavior |
| --- | --- | --- |
| `/portal/meters/search?q=&page=1` | GET | `{data, total, page, pageSize}`. The observed instance had 403 meters and 20 records per page. Search is case-insensitive; `q=j1000` returned 100 matches. |
| `/meters/{meterId}/__data.json?x-sveltekit-invalidated=001` | GET | SvelteKit indexed page data containing nameplate details and the meter's seven hierarchy labels. The service decodes this payload and normalizes legacy and v2 page shapes. |
| `/portal/meters/{meterId}/geo` | GET | `{data: {latitude, longitude}}`; coordinate values are strings. |
| `/portal/meters/{meterId}/energy` | GET | `{data: [{timestamp, kwh, kvah, voltR}, ...]}`; every field is a string. |
| `/portal/dts?page=1` | GET | `{data, total, page, pageSize}` with transformer fields `code`, `name`, `feederCode`, and `capacityKva`. The observed instance had 40 transformers and 20 per page. |

Search pagination is one-based. On the observed instance, page 21 returned three meters and page 22 returned an empty `data` array while keeping `page: 22`. The portal normalized `page=0`, negative, and non-numeric values to page 1. Adding `pageSize=100` did not change the 20-record page size. The clean API validates page input instead of copying that surprising fallback behavior.

The detail route supports two observed data shapes. Legacy meters provide a list of label/value pairs. v2 meters provide a JSON string under `classData`, with an `installed_meter` object. The SvelteKit page-data response stores objects in an indexed graph; the service decodes that graph before mapping labels such as `Meter ID`/`MeterId` and `Installation Status`/`InstallationStatus` to one stable API shape.

The hierarchy contains zone, circle, division, subdivision, substation, feeder, and distribution transformer (DT). The portal supplies each as a display label such as `Jaipur Zone 1 (Z-01)`. The clean API splits the visible name and code into separate fields. Empty labels remain empty; the service does not infer missing values from neighboring meters.

For `J100000`, the energy route returned 337 readings from `23/06/2026 23:30` through `30/06/2026 23:30` in 30-minute steps. The readings use `DD/MM/YYYY HH:mm`; no timezone is included. Numeric strings are converted to JSON numbers by the clean API, while timestamps are preserved verbatim. The energy counters appear cumulative, but that interpretation and the timezone were not independently verified.

## Data caveats and limits

- Counts, meter statuses, transformer names, and readings are snapshots, not a promised fixed dataset.
- A meter may use either the legacy or v2 detail shape; the public API hides that distinction.
- The timestamp timezone is unknown, so the service does not convert timestamps to ISO 8601.
- The session expiry path has not been observed end-to-end; one retry on 401/403 is a bounded recovery policy.
- The portal exposes an export action in its UI. Existing investigation notes indicate that route is signed. This service omits the export and signing-key flow; it uses paginated search and per-meter details instead.
- No mutation routes were explored or implemented.
