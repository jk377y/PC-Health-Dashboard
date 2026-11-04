const path = require('path');
const express = require('express');
const metrics = require('./metrics');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/metrics', async (req, res) => {
  try {
    res.json({
      cpu: metrics.getCpuUsage(),
      memory: metrics.getMemory(),
      disk: await metrics.getDisk('/'),
      uptimeSeconds: metrics.getUptime(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read system metrics' });
  }
});

// Bind to localhost only: this dashboard is for this machine, not the network.
app.listen(PORT, '127.0.0.1', () => {
  console.log(`PC Health Dashboard running at http://localhost:${PORT}`);
});
