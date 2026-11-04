# PC Health Dashboard

A small local dashboard showing CPU, memory, disk usage, and uptime.
Built with Node.js, Express, and plain HTML/CSS/JS.

## Run

```bash
sudo dnf install nodejs   # Fedora; needs Node >= 18.15
npm install
npm start
```

Then open http://localhost:3000.

## How it works

- `metrics.js` reads system stats using Node's built-in `os`/`fs` modules.
- `server.js` serves `public/` and exposes `GET /api/metrics`.
- `public/app.js` polls that endpoint every 2 seconds and updates the page.
