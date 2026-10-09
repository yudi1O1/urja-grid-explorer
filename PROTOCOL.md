# Urja Meter Ops integration notes

## Scope

The take-home brief identifies the portal at `https://urja-ops.flockenergy.tech`, supplies an operator login, and states that the portal has no ready-made API. It asks the candidate to discover how the portal works and build a separate service around it.

This document describes the application's portal integration, recorded route behavior, and known data caveats. Live API verification is called out separately.

## Authentication

The existing API implementation signs in with the portal's login form and keeps the resulting session cookie in process memory. It sends `URJA_EMAIL` and `URJA_PASSWORD` from the local environment. The base URL defaults to `https://urja-ops.flockenergy.tech` and can be overridden with `URJA_BASE_URL`.

The implementation notes record a URL-encoded `POST /login` form with `email` and `password` fields and the `x-sveltekit-action: true` header. The portal responds with a JSON-described redirect and a secure session cookie. The API shares an in-flight login across concurrent requests and performs one re-login attempt after an upstream `401` or `403`.

Credentials belong in the ignored local `.env` file. Do not commit them or return them from API responses.

## Recorded portal routes

The application uses the following portal route mapping:

| Portal route | Method | Data used by the service |
| --- | --- | --- |
| `/portal/meters/search?q=&page=1` | GET | A paginated meter list, with `data`, `total`, `page`, and `pageSize` fields. |
| `/meters/{meterId}/__data.json?x-sveltekit-invalidated=001` | GET | SvelteKit page data used to build the meter nameplate and network hierarchy. |
| `/portal/meters/{meterId}/geo` | GET | Meter latitude and longitude. |
| `/portal/meters/{meterId}/energy` | GET | Recent readings containing timestamp and energy/voltage values. |
| `/portal/dts?page=1` | GET | A paginated list of distribution transformers. |

These are portal routes used by the service, not the public routes exposed by this API. The public contract is in [openapi.json](./openapi.json).

## Normalization and caveats

- Meter detail data has legacy and v2 shapes. The backend maps both into one nameplate response.
- Network hierarchy levels are zone, circle, division, subdivision, substation, feeder, and distribution transformer.
- Portal hierarchy labels may include a code in parentheses. The API separates the display name and code when it can; it does not infer missing values.
- Location and consumption values may arrive as strings and are normalized by the API.
- Recorded energy timestamps use `DD/MM/YYYY HH:mm` and have no timezone marker. The API preserves them as strings.
- The API uses paginated requests and does not implement the portal's signed full-dataset export flow.
- Authentication expiry, throttling, and long-term portal availability have not been fully characterized.

## Local verification

On 9 October 2026, the local API returned HTTP 200 for the first meter search page when configured with the take-home portal login: 20 records were returned and the response reported 403 total records. These values are a snapshot and may change. This confirms the current client-to-API data path; it does not independently validate every raw portal route listed above.
