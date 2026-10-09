# Urja Grid Explorer frontend

This React and TypeScript application provides a browser interface for the meter API in the repository root.

## Features

- Search meters by meter ID or serial number.
- Browse paginated results.
- Open meter details in a dismissible, animated overlay.
- Review meter identification, network hierarchy, coordinates, and recent readings.
- Use the interface with reduced-motion preferences and keyboard close controls.

## Start the application

First configure and run the API from the repository root. Follow the root [README](../README.md) to create `.env` with the portal login.

Then, in this directory, install dependencies and start Vite:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The development server proxies `/api` requests to `http://localhost:3000`; the API must be running and configured for live meter data to appear.

## Build

```bash
npm run build
```

The production bundle is written to `dist/`. This frontend refresh does not replace or reimplement the backend API.
