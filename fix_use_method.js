const fs = require('fs');
let c = JSON.parse(fs.readFileSync('grafana/pms-ultimate-dashboard.json', 'utf8'));

// 1. Fix JVM Memory Usage
for (let panel of c.panels) {
  if (panel.title === 'Utilization (CPU / Memory)' || panel.title.includes('Utilization')) {
    panel.targets[1].expr = 'sum({__name__=~"jvm_memory_used|jvm_memory_used_bytes", application=~"$application", area="heap"})';
    panel.targets[1].legendFormat = 'JVM Heap Memory Used';
  }
}

// 2. Add 'Errors' to USE Method
let satPanel = c.panels.find(p => p.title.includes('Saturation'));
if (satPanel) {
    satPanel.gridPos.w = 8;
    satPanel.gridPos.x = 8;
}

let errorsPanel = {
  "type": "timeseries",
  "title": "Errors (Infra/Log Errors)",
  "gridPos": {
    "h": 8,
    "w": 8,
    "x": 16,
    "y": satPanel ? satPanel.gridPos.y : 16
  },
  "targets": [
    {
      "expr": "sum(rate(logback_events_total{level=\"error\", application=~\"$application\"}[2m]))",
      "legendFormat": "Log Errors/sec",
      "refId": "A"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "color": { "mode": "palette-classic" },
      "custom": {
        "axisPlacement": "left",
        "drawStyle": "line",
        "lineInterpolation": "linear",
        "lineWidth": 2
      }
    },
    "overrides": []
  },
  "options": {
    "legend": { "displayMode": "list", "placement": "bottom" },
    "tooltip": { "mode": "single" }
  }
};

let satIndex = c.panels.findIndex(p => p.title.includes('Saturation'));
if (satIndex !== -1) {
    c.panels.splice(satIndex + 1, 0, errorsPanel);
} else {
    c.panels.push(errorsPanel);
}

fs.writeFileSync('grafana/pms-ultimate-dashboard.json', JSON.stringify(c, null, 2));
