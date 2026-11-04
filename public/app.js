const POLL_MS = 2000;

const $ = (id) => document.getElementById(id);

function formatBytes(bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatUptime(totalSeconds) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`].filter(Boolean).join(' ');
}

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

refresh();
setInterval(refresh, POLL_MS);
