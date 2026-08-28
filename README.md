# DigitalBox UI

Vite + React 19 + TypeScript + MUI front end for DigitalBox. Warehouse-staff interface for
uploading packing-slip PDFs and working the order queue (ship / cancel / search / history).

Backend: [DigitalBox API](https://github.com/JavaJonathan/DigitalBoxAPI-Rewrite).

## Quick start

```bash
npm install
echo "VITE_API_BASE_URL=http://localhost:5180" > .env.local
npm run dev        # http://localhost:5173
```

Sign in with the shared warehouse credentials configured on the API.

See [CLAUDE.md](CLAUDE.md) for architecture and conventions.
