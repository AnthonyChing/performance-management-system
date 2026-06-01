const fs = require('fs');
let c = JSON.parse(fs.readFileSync('grafana/pms-ultimate-dashboard.json', 'utf8'));

c.panels.forEach(row => {
    if (row.type === 'row') return;

    if (row.title && row.title.includes('Latency (Avg)')) {
        row.targets[0].expr = 'sum(rate(http_server_requests_milliseconds_sum{application=~"$application"}[$__rate_interval])) / sum(rate(http_server_requests_milliseconds_count{application=~"$application"}[$__rate_interval]))';
        if (row.fieldConfig && row.fieldConfig.defaults) {
            row.fieldConfig.defaults.unit = 'ms';
            row.fieldConfig.defaults.min = 0;
        }
        if (row.options && row.options.reduceOptions) {
            // Set calc to LastNotNull to prevent 'No Data' when traffic ends
            row.options.reduceOptions.calcs = ['lastNotNull'];
        }
    } else if (row.title && row.title.includes('Duration (Avg Latency per API)')) {
        row.targets[0].expr = 'sum by (uri) (rate(http_server_requests_milliseconds_sum{application=~"$application"}[$__rate_interval])) / sum by (uri) (rate(http_server_requests_milliseconds_count{application=~"$application"}[$__rate_interval]))';
        if (row.fieldConfig && row.fieldConfig.defaults) {
            row.fieldConfig.defaults.unit = 'ms';
            row.fieldConfig.defaults.min = 0;
        }
    } else if (row.title && row.title.includes('Utilization')) {
        // Fix JVM Memory - use simple sum without area filter, so it always works
        row.targets[1].expr = 'sum({__name__=~"jvm_memory_used|jvm_memory_used_bytes", application=~"$application"})';
        row.gridPos = { h: 8, w: 12, x: 0, y: 16 };
    } else if (row.title && row.title.includes('Saturation')) {
        row.gridPos = { h: 8, w: 12, x: 12, y: 16 };
    }
});

// Remove the Errors panel because logback metrics aren't exported
c.panels = c.panels.filter(p => p.title && !p.title.includes('Errors (Infra/Log Errors)'));

fs.writeFileSync('grafana/pms-ultimate-dashboard.json', JSON.stringify(c, null, 2));
