const os = require('os');
const fs = require('fs');
const si = require('systeminformation');

// ---------- CPU ----------
// CPU time is reported as a *cumulative* total (since boot) of each core's idle/busy
// time, so a single reading can't tell us "current usage". si.currentLoad() compares
// each reading with the previous one: usage = busy time elapsed / total time elapsed.
//
// We take the readings on a timer (not per request) so that:
//   - the result doesn't depend on how often the browser polls, and
//   - several open tabs can't shrink the sampling window and make it noisy.
// ---------- CPU ----------
let cpuPercent = null;

setInterval(async () => {
  try {
    const data = await si.currentLoad();
    if (Number.isFinite(data.currentLoad)) {
      cpuPercent = round(data.currentLoad);
    }
  } catch (err) {
    console.error('CPU measurement failed:', err);
  }
}, 1000).unref();

function getCpuUsage() {
  return { percent: cpuPercent };
}

// ---------- Memory ----------
// "Free" memory on Linux is misleading: the kernel uses spare RAM for disk cache,
// which it hands back instantly when an app needs it. So `os.freemem()` can make
// a healthy machine look nearly full. /proc/meminfo's "MemAvailable" is the
// kernel's own estimate of what is really usable (free + reclaimable cache).
//   used    = total - available
//   percent = used / total * 100
// This matches the "used" idea in `free -h` (its "available" column).
//
// macOS has the same cache problem but no /proc/meminfo, so there we use si.mem().
// It runs external commands, which is why it's on a timer (not per request), and
// why Linux and Windows skip it: on Windows it would start PowerShell every time
// just to return os.freemem(), which already counts that cache as available.
let macAvailable = null;

async function sampleMacMemory() {
  try {
    macAvailable = (await si.mem()).available;
  } catch (err) {
    console.error('Memory measurement failed:', err);
  }
}

if (process.platform === 'darwin') {
  sampleMacMemory();
  setInterval(sampleMacMemory, 2000).unref();
}

function readMemAvailable() {
  if (macAvailable !== null) return macAvailable;
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
// os.uptime() returns fractional seconds; we drop the decimals since the UI only shows d/h/m.
function getUptime() {
  return Math.floor(os.uptime());
}

// Round to one decimal place (e.g. 42.37 -> 42.4) so the numbers look tidy in the UI.
function round(n) {
  return Math.round(n * 10) / 10;
}

module.exports = { getCpuUsage, getMemory, getDisk, getUptime };
