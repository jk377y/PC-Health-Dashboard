// How often (in milliseconds) we ask the server for fresh numbers.
const POLL_MS = 2000;

// Short helper so we don't type document.getElementById everywhere.
const $ = (id) => document.getElementById(id);

// Turns a raw byte count into something readable like "7.8 GiB".
// Uses 1024-based units (KiB, MiB...) to match what the OS tools report.
function formatBytes(bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// Formats seconds as e.g. "2d 5h 12m". Leading zero units are hidden, but
// minutes always show, so a fresh boot reads "0m" instead of an empty string.
function formatUptime(totalSeconds) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  // `d && ...` yields 0 (falsy) when there are no days, and filter(Boolean) drops it.
  // Hours stay visible if days are shown, even when h is 0 ("1d 0h 5m").
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}

// Fills a progress bar and colors it by severity: 70%+ is a warning, 90%+ is critical.
// The 'warn' and 'bad' classes are styled in style.css.
function setBar(id, percent) {
  const bar = $(id);
  bar.style.width = `${percent}%`;
  bar.classList.toggle('warn', percent >= 70 && percent < 90);
  bar.classList.toggle('bad', percent >= 90);
}

function render(data) {
  // CPU percent is null for the first second after the server starts.
  if (data.cpu.percent === null) {
    $('cpu-value').textContent = 'Measuring…';
    setBar('cpu-bar', 0);
  } else {
    $('cpu-value').textContent = `${data.cpu.percent}%`;
    setBar('cpu-bar', data.cpu.percent);
  }

  $('mem-value').textContent = `${data.memory.percent}%`;
  setBar('mem-bar', data.memory.percent);
  $('mem-detail').textContent =
    `${formatBytes(data.memory.used)} of ${formatBytes(data.memory.total)} used`;

  $('disk-value').textContent = `${data.disk.percent}%`;
  setBar('disk-bar', data.disk.percent);
  $('disk-detail').textContent =
    `${formatBytes(data.disk.used)} of ${formatBytes(data.disk.total)} used`;

  $('uptime-value').textContent = formatUptime(data.uptimeSeconds);
}

// Fetches the latest metrics and updates the page. If the server is down we
// show a message and keep going, since the next poll may succeed.
async function refresh() {
  const status = $('status');
  try {
    const res = await fetch('/api/metrics');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    render(await res.json());
    status.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    status.classList.remove('error');
  } catch (err) {
    status.textContent = 'Cannot reach the server. Retrying…';
    status.classList.add('error');
  }
}

// Load once right away so the page isn't blank for the first 2 seconds.
refresh();
setInterval(refresh, POLL_MS);
