const fs = require('fs');
const dashboard = {
  "title": "PMS Ultimate Dashboard",
  "uid": "pms-dashboard",
  "editable": true,
  "panels": [
    {
      "type": "row",
      "title": "🌟 Row 1: Four Golden Signals (Executive View)",
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": 0 }
    },
    {
      "type": "stat",
      "title": "1. Traffic (RPS)",
      "gridPos": { "h": 5, "w": 6, "x": 0, "y": 1 },
      "targets": [
        { "expr": "sum(rate(http_server_requests_count{application=~\"$application\"}[$__rate_interval]))", "refId": "A" }
      ]
    },
    {
      "type": "stat",
      "title": "2. Latency (P95)",
      "gridPos": { "h": 5, "w": 6, "x": 6, "y": 1 },
      "targets": [
        { "expr": "histogram_quantile(0.95, sum(rate(http_server_requests_bucket{application=~\"$application\"}[$__rate_interval])) by (le))", "refId": "A" }
      ]
    },
    {
      "type": "stat",
      "title": "3. Errors (5xx Rate %)",
      "gridPos": { "h": 5, "w": 6, "x": 12, "y": 1 },
      "targets": [
        { "expr": "sum(rate(http_server_requests_count{application=~\"$application\", status=~\"5..\"}[$__rate_interval])) / sum(rate(http_server_requests_count{application=~\"$application\"}[$__rate_interval]))", "refId": "A" }
      ]
    },
    {
      "type": "stat",
      "title": "4. Saturation (DB Pending Conn)",
      "gridPos": { "h": 5, "w": 6, "x": 18, "y": 1 },
      "targets": [
        { "expr": "sum(hikaricp_connections_pending{application=~\"$application\"})", "refId": "A" }
      ]
    },
    {
      "type": "row",
      "title": "🔴 Row 2: RED Method (API View)",
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": 6 }
    },
    {
      "type": "timeseries",
      "title": "Rate (Requests/sec per API)",
      "gridPos": { "h": 8, "w": 8, "x": 0, "y": 7 },
      "targets": [
        { "expr": "sum(rate(http_server_requests_count{application=~\"$application\"}[$__rate_interval])) by (uri)", "legendFormat": "{{uri}}", "refId": "A" }
      ]
    },
    {
      "type": "timeseries",
      "title": "Errors (Failed req/sec)",
      "gridPos": { "h": 8, "w": 8, "x": 8, "y": 7 },
      "targets": [
        { "expr": "sum(rate(http_server_requests_count{application=~\"$application\", status=~\"4..|5..\"}[$__rate_interval])) by (uri, status)", "legendFormat": "{{status}} - {{uri}}", "refId": "A" }
      ]
    },
    {
      "type": "timeseries",
      "title": "Duration (P95 Latency per API)",
      "gridPos": { "h": 8, "w": 8, "x": 16, "y": 7 },
      "targets": [
        { "expr": "histogram_quantile(0.95, sum(rate(http_server_requests_bucket{application=~\"$application\"}[$__rate_interval])) by (le, uri))", "legendFormat": "P95 {{uri}}", "refId": "A" }
      ]
    },
    {
      "type": "row",
      "title": "💻 Row 3: USE Method (Infra View)",
      "gridPos": { "h": 1, "w": 24, "x": 0, "y": 15 }
    },
    {
      "type": "timeseries",
      "title": "Utilization (CPU / Memory)",
      "gridPos": { "h": 8, "w": 8, "x": 0, "y": 16 },
      "targets": [
        { "expr": "avg(process_cpu_usage{application=~\"$application\"})", "legendFormat": "CPU Usage (avg)", "refId": "A" },
        { "expr": "avg(jvm_memory_used{application=~\"$application\"} / jvm_memory_max{application=~\"$application\"})", "legendFormat": "JVM Memory Usage (avg)", "refId": "B" }
      ]
    },
    {
      "type": "timeseries",
      "title": "Saturation (Queue/Pending)",
      "gridPos": { "h": 8, "w": 8, "x": 8, "y": 16 },
      "targets": [
        { "expr": "sum(hikaricp_connections_pending{application=~\"$application\"})", "legendFormat": "DB Threads Pending", "refId": "A" },
        { "expr": "sum(tomcat_threads_busy{application=~\"$application\"})", "legendFormat": "Tomcat Threads Busy", "refId": "B" }
      ]
    }
  ],
  "templating": {
    "list": [
      {
        "hide": 0,
        "name": "DS_PROMETHEUS",
        "query": "prometheus",
        "type": "datasource"
      },
      {
        "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
        "hide": 0,
        "includeAll": true,
        "name": "application",
        "query": "label_values(http_server_requests_count, application)",
        "type": "query"
      }
    ]
  }
};
fs.writeFileSync('grafana/pms-ultimate-dashboard.json', JSON.stringify(dashboard, null, 2), 'utf8');
