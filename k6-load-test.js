import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 }, // Ramp up to 50 users
    { duration: '30s', target: 50 }, // Stay at 50 users for 30s
    { duration: '10s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

export default function () {
  // 對不需授權的 Health 端點進行壓測
  const res = http.get('http://localhost:8080/actuator/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
