const path = require('path');
const express = require('express');
const metrics = require('./metrics');

const app = express();
const PORT = 3000;

// Serve the dashboard page (HTML/CSS/JS) straight from the public folder.
app.use(express.static(path.join(__dirname, 'public')));

// One endpoint returns every metric, so the browser only needs a single request per refresh.
app.get('/api/metrics', async (req, res) => {
  try {
    res.json({
      cpu: metrics.getCpuUsage(),
      memory: metrics.getMemory(),
      disk: await metrics.getDisk('/'),
      uptimeSeconds: metrics.getUptime(),
    });
  } catch (err) {
    // Log the real error for us, but send the browser a generic message
    // so we don't leak system details.
    console.error(err);
    res.status(500).json({ error: 'Failed to read system metrics' });
  }
});

// Bind to localhost only: this dashboard is for this machine, not the network.
app.listen(PORT, '127.0.0.1', () => {
  console.log(`PC Health Dashboard running at http://localhost:${PORT}`);
});
