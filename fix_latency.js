const fs = require('fs');
let c = fs.readFileSync('grafana/pms-ultimate-dashboard.json', 'utf8');

c = c.replace(/histogram_quantile\(0\.95, sum by \(le\) \(rate\(\{__name__=~"http_server_requests_milliseconds_bucket", application=~"\$application"\}\[2m\]\)\)\)/g, 'sum(rate(http_server_requests_milliseconds_sum{application=~"$application"}[2m])) / sum(rate(http_server_requests_milliseconds_count{application=~"$application"}[2m]))');

c = c.replace(/histogram_quantile\(0\.95, sum by \(le, uri\) \(rate\(\{__name__=~"http_server_requests_milliseconds_bucket", application=~"\$application"\}\[2m\]\)\)\)/g, 'sum by (uri) (rate(http_server_requests_milliseconds_sum{application=~"$application"}[2m])) / sum by (uri) (rate(http_server_requests_milliseconds_count{application=~"$application"}[2m]))');

c = c.replace(/Latency \(P95\)/g, 'Latency (Avg)');
c = c.replace(/Duration \(P95 Latency per API\)/g, 'Duration (Avg Latency per API)');

fs.writeFileSync('grafana/pms-ultimate-dashboard.json', c);
