const os = require('os');
const fs = require('fs');

// ---------- CPU ----------
// os.cpus() reports *cumulative* time (since boot) each core has spent idle/busy.
// A single reading therefore can't tell us "current usage". We need two readings
// and compare them: usage = 1 - (idle time elapsed / total time elapsed).
//
// We take the readings on a timer (not per request) so that:
//   - the result doesn't depend on how often the browser polls, and
//   - several open tabs can't shrink the sampling window and make it noisy.
function readCpuTimes() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const t of Object.values(cpu.times)) total += t;
    idle += cpu.times.idle;
  }
  return { idle, total };
}

let previous = readCpuTimes(); // baseline taken at startup
let cpuPercent = null;         // null = "no reading yet" (first second after start)

setInterval(() => {
  const current = readCpuTimes();
  const idleDelta = current.idle - previous.idle;
  const totalDelta = current.total - previous.total;
  previous = current;

  // If no time elapsed (totalDelta 0) keep the last value instead of dividing by 0.
  if (totalDelta > 0) {
    cpuPercent = (1 - idleDelta / totalDelta) * 100;
  }
}, 1000).unref(); // unref: this timer alone won't keep the process alive

function getCpuUsage() {
  return { percent: cpuPercent === null ? null : round(cpuPercent) };
}

// ---------- Memory ----------
// "Free" memory on Linux is misleading: the kernel uses spare RAM for disk cache,
// which it hands back instantly when an app needs it. So `os.freemem()` can make
// a healthy machine look nearly full. /proc/meminfo's "MemAvailable" is the
// kernel's own estimate of what is really usable (free + reclaimable cache).
//   used    = total - available
//   percent = used / total * 100
// This matches the "used" idea in `free -h` (its "available" column).
function readMemAvailable() {
  try {
    const text = fs.readFileSync('/proc/meminfo', 'utf8');
    const match = text.match(/^MemAvailable:\s+(\d+)\s+kB/m);
    if (match) return Number(match[1]) * 1024; // kB -> bytes
  } catch {
    // fall through to the portable fallback
  }
  return os.freemem();
}

function getMemory() {
  const total = os.totalmem();
  const available = readMemAvailable();
  const used = total - available;
  return { total, used, percent: round((used / total) * 100) };
}

// ---------- Disk ----------
// fs.statfs (Node 18.15+) reports filesystem block counts for a path.
// bsize = bytes per block, blocks = total, bavail = blocks available to normal users.
// We use bavail (not bfree) like `df` does, so root-reserved blocks aren't counted as free.
async function getDisk(path = '/') {
  const s = await fs.promises.statfs(path);
  const available = s.bavail * s.bsize;
  const used = (s.blocks - s.bfree) * s.bsize;
  // Like df, capacity = used + available (excludes root-reserved blocks), so the
  // percentage and the "X of Y used" text are computed from the same basis.
  const total = used + available;
  const percent = total > 0 ? (used / total) * 100 : 0;
  return { total, used, percent: round(percent) };
}

// ---------- Uptime ----------
function getUptime() {
  return Math.floor(os.uptime());
}

function round(n) {
  return Math.round(n * 10) / 10;
}

module.exports = { getCpuUsage, getMemory, getDisk, getUptime };
