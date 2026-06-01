const fs = require('fs');
let c = JSON.parse(fs.readFileSync('grafana/pms-ultimate-dashboard.json', 'utf8'));
c.panels.forEach(p => {
    if (p.title === 'Errors (Infra Errors)') {
        p.title = 'Errors (DB Conn Timeouts)';
        p.targets[0].expr = 'sum(rate(hikaricp_connections_timeout_total{application=~"$application"}[$__rate_interval]))';
        p.targets[0].legendFormat = 'DB Timeouts/sec';
        if (p.fieldConfig && p.fieldConfig.defaults) {
            p.fieldConfig.defaults.min = 0;
        }
    }
});
fs.writeFileSync('grafana/pms-ultimate-dashboard.json', JSON.stringify(c, null, 2));
