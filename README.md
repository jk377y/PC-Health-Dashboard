# PC Health Dashboard

A small local dashboard showing CPU, memory, disk usage, and uptime.
Built with Node.js, Express, and plain HTML/CSS/JS.

This project was also my first time using an AI agent (Claude Code) to build a complete, if small, application from start to finish. See [Built with an AI agent](#built-with-an-ai-agent) below.

## Features

- Live CPU, memory, and disk usage, refreshed every 2 seconds
- System uptime shown in days, hours, and minutes
- Progress bars that turn orange at 70% and red at 90%
- Only one runtime dependency (Express), with no front-end framework or build step
- Listens on localhost only, so nothing is exposed to your network

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

### Project structure

```
.
├── server.js        # Express server and the /api/metrics route
├── metrics.js       # CPU, memory, disk, and uptime readers
└── public/
    ├── index.html   # Dashboard markup
    ├── style.css    # Styling
    ├── app.js       # Polls the API and updates the page
    └── images/      # Images used in this README
```

### API

`GET /api/metrics` returns everything in one JSON response (the numbers below are just an example):

```json
{
  "cpu": { "percent": 12.4 },
  "memory": { "total": 16678203392, "used": 5368709120, "percent": 32.2 },
  "disk": { "total": 510405042176, "used": 183500000000, "percent": 35.9 },
  "uptimeSeconds": 93784
}
```

Byte values are in bytes. `cpu.percent` is `null` for the first second after the server starts, while the first reading is still being taken.

### Design notes

A few choices that are easy to get wrong with system metrics:

- **CPU** is measured by comparing two readings of the cumulative CPU times, taken once a second on a timer. A single reading can't show current usage, and a timer means the result doesn't change with how many browser tabs are open.
- **Memory** uses `MemAvailable` from `/proc/meminfo` instead of `os.freemem()`. On Linux, "free" memory ignores disk cache that the kernel gives back on demand, so it makes a healthy machine look nearly full. If `/proc/meminfo` can't be read, it falls back to `os.freemem()`.
- **Disk** is calculated the same way `df` does it, so the percentage matches what you see in the terminal.

Linux is the primary target. The memory reading falls back gracefully elsewhere, but I've only tested on Fedora.

## Built with an AI agent

The goal of this project was to learn what it's like to build a real application with an AI agent. I used [Claude Code](https://claude.com/claude-code) inside VS Code. I described what I wanted, reviewed each change it proposed, and steered it as we went.

The screenshot below is from one part of that process. I had added a `CLAUDE.md` file with commenting standards, and asked Claude to review the existing comments and improve them without touching any executable code. Every edit shows up as a side-by-side diff that I can inspect before moving on.

![Claude Code in VS Code showing side-by-side diffs of comment-only edits to app.js](public/images/claude_workflow.png)

A few things I learned along the way:

- A `CLAUDE.md` file is a good place to put project rules (like commenting style) so you don't have to repeat them.
- Reviewing the diff after each step keeps you in control, and it's how I confirmed the comment-only pass changed no code.
- Telling the agent not to commit or push until I say so keeps Git history under my control.

## About the author
### James Kelly, built with [Claude Code](https://claude.com/claude-code)

<a href="https://jk377y.dev" target="_blank">Portfolio</a> - <a href="mailto:jk377y@gmail.com">Email</a> - <a href="https://www.linkedin.com/in/james-kelly-cloud-engineer/" target="_blank">LinkedIn</a> - <a href="https://github.com/jk377y" target="_blank">GitHub</a>

## *License*
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
<br>Copyright (c) 2026 James Kelly
<br>Information on this license can be found at: (https://opensource.org/licenses/MIT)
