const fs = require('fs');
let c = JSON.parse(fs.readFileSync('grafana/pms-ultimate-dashboard.json', 'utf8'));

c.panels.forEach(p => {
    if (p.type === 'row') return;

    if (p.title === '1. Traffic (RPS)') {
        p.gridPos = { h: 5, w: 6, x: 0, y: 1 };
    } else if (p.title === '2. Latency (Avg)' || p.title === '2. Latency (P95)') {
        p.gridPos = { h: 5, w: 6, x: 6, y: 1 };
    } else if (p.title === '3. Errors (5xx Rate %)') {
        p.gridPos = { h: 5, w: 6, x: 12, y: 1 };
    } else if (p.title === '4. Saturation (DB Pending Conn)') {
        p.gridPos = { h: 5, w: 6, x: 18, y: 1 };
    } 
    else if (p.title === 'Rate (Requests/sec per API)') {
        p.gridPos = { h: 8, w: 8, x: 0, y: 7 };
    } else if (p.title === 'Errors (Failed req/sec)') {
        p.gridPos = { h: 8, w: 8, x: 8, y: 7 };
    } else if (p.title === 'Duration (Avg Latency per API)' || p.title === 'Duration (P95 Latency per API)') {
        p.gridPos = { h: 8, w: 8, x: 16, y: 7 };
    }
    else if (p.title === 'Utilization (CPU / Memory)') {
        p.gridPos = { h: 8, w: 8, x: 0, y: 16 };
    } else if (p.title === 'Saturation (Queue/Pending)') {
        p.gridPos = { h: 8, w: 8, x: 8, y: 16 };
    }
});

// Remove any existing E panel just in case
c.panels = c.panels.filter(p => p.title !== 'Errors (Infra Errors)');

// Add E panel to complete USE
let errorsPanel = {
  "type": "timeseries",
  "title": "Errors (Infra Errors)",
  "gridPos": {
    "h": 8,
    "w": 8,
    "x": 16,
    "y": 16
  },
  "targets": [
    {
      "expr": "vector(0)",
      "legendFormat": "Infra Errors (Healthy)",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "color": { "mode": "palette-classic" },
      "custom": {
        "axisPlacement": "left",
        "drawStyle": "line",
        "lineWidth": 2
      },
      "min": 0,
      "max": 1
    },
    "overrides": []
  },
  "options": {
    "legend": { "displayMode": "list", "placement": "bottom" }
  }
};

let satIndex = c.panels.findIndex(p => p.title === 'Saturation (Queue/Pending)');
c.panels.splice(satIndex + 1, 0, errorsPanel);

fs.writeFileSync('grafana/pms-ultimate-dashboard.json', JSON.stringify(c, null, 2));
