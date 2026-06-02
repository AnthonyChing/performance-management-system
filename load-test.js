import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate   = new Rate('errors');
const loginTrend  = new Trend('login_duration',  true);
const writeTrend  = new Trend('write_duration', true);

export const options = {
  scenarios: {
    employee_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: 100, duration: '1m' }, // 
        { target: 900, duration: '3m' }, //  (900 VUs)
        { target: 900, duration: '3m' }, // 
        { target: 0,   duration: '1m' }, // 
      ],
      exec: 'employeeFlow',
    },
    manager_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: 10, duration: '1m' },
        { target: 80, duration: '3m' }, //  (80 VUs)
        { target: 80, duration: '3m' },
        { target: 0,  duration: '1m' },
      ],
      exec: 'managerFlow',
    },
    hr_flow: {
      executor: 'constant-vus',
      vus: 20,                          // (20 VUs)
      duration: '8m',
      exec: 'hrFlow',
    },
  },
  thresholds: {
    'http_req_duration{endpoint:login}':  ['p(95)<5000'],
    'http_req_duration{endpoint:write}':  ['p(95)<5000'],
    'http_req_duration{endpoint:read}':   ['p(95)<5000'],
    'errors':                             ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://backend-staging-1078971769535.asia-east1.run.app';

function getHeaders(token) {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

//  Employee Email (3001 ~ 30000)
function getRandomEmployeeEmail() {
  const id = Math.floor(Math.random() * 27000) + 3001;
  return `employee_${String(id).padStart(6, '0')}@loadtest.com`;
}

//  Manager Email (Hardcoded as there is only 1 manager seeded)
function getManagerEmail() {
  return `manager_2@loadtest.com`;
}

export function employeeFlow() {
  group('employee_login', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/api/v1/auth/dev-login`,
      JSON.stringify({ email: getRandomEmployeeEmail() }),
      { headers: { 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
    );
    loginTrend.add(Date.now() - start);
    check(res, { 'login 200': (r) => r.status === 200 }) || errorRate.add(1);

    if (res.status !== 200) return;
    const token = res.json('access_token');

    sleep(1);

    group('employee_read', () => {
      const readRes = http.get(
        `${BASE_URL}/api/v1/me/performance-cycles/current`,
        { headers: getHeaders(token), tags: { endpoint: 'read' } }
      );
      check(readRes, { 'read 200/404': (r) => [200, 404].includes(r.status) }) || errorRate.add(1);
    });

    sleep(2);

    group('employee_write', () => {
      const start2 = Date.now();
      const writeRes = http.post(
        `${BASE_URL}/api/v1/me/goals`,
        JSON.stringify({
          title: 'Load Test Goal',
          description: 'This is a load test goal',
          goalType: 'PERSONAL',
          progressPercent: 50
        }),
        { headers: getHeaders(token), tags: { endpoint: 'write' } }
      );
      writeTrend.add(Date.now() - start2);
      check(writeRes, { 'write 201/200': (r) => [200, 201].includes(r.status) }) || errorRate.add(1);
    });
  });
}

export function managerFlow() {
  group('manager_login', () => {
    const res = http.post(
      `${BASE_URL}/api/v1/auth/dev-login`,
      JSON.stringify({ email: getManagerEmail() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (!check(res, { 'manager login 200': (r) => r.status === 200 })) {
      errorRate.add(1);
      return;
    }
    const token = res.json('access_token');

    sleep(1);

    const readRes = http.get(
      `${BASE_URL}/api/v1/manager/subordinates`,
      { headers: getHeaders(token), tags: { endpoint: 'read' } }
    );
    check(readRes, { 'manager read 200': (r) => r.status === 200 }) || errorRate.add(1);

    sleep(2);

    const writeRes = http.post(
      `${BASE_URL}/api/v1/me/goals`,
      JSON.stringify({
        title: 'Manager Goal',
        description: 'Manager load test goal',
        goalType: 'PERSONAL',
        progressPercent: 100
      }),
      { headers: getHeaders(token), tags: { endpoint: 'write' } }
    );
    check(writeRes, { 'manager write 200/201': (r) => [200, 201].includes(r.status) }) || errorRate.add(1);
  });
}

export function hrFlow() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/dev-login`,
    JSON.stringify({ email: 'hr_1@loadtest.com' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (!check(res, { 'hr login 200': (r) => r.status === 200 })) {
    errorRate.add(1);
    return;
  }
  const token = res.json('access_token');
  
  sleep(1);
  
  const readRes = http.get(
    `${BASE_URL}/api/v1/hr/performance-cycles`,
    { headers: getHeaders(token), tags: { endpoint: 'read' } }
  );
  check(readRes, { 'hr read 200': (r) => r.status === 200 }) || errorRate.add(1);
}


import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export function handleSummary(data) {
  return {
    "summary.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
