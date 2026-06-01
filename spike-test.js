import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate   = new Rate('errors');
const loginTrend  = new Trend('login_duration',  true);
const writeTrend  = new Trend('write_duration', true);

export const options = {
  scenarios: {
    spike: {
      executor:          'ramping-arrival-rate',
      startRate:         100,
      timeUnit:          '1s',
      preAllocatedVUs:   1000,
      maxVUs:            6000, 
      stages: [
        { target: 100,  duration: '2m'  }, // 正常低流量
        { target: 5000, duration: '10s' }, // 10 秒內暴衝
        { target: 5000, duration: '3m'  }, // 維持高壓
        { target: 100,  duration: '2m'  }, // 退潮
        { target: 0,    duration: '1m'  },
      ],
      exec: 'employeeFlow', // Focus the spike primarily on employee logins
    },
  },
  thresholds: {
    'http_req_duration{endpoint:login}':  ['p(95)<5000'], // 放寬冷啟動限制
    'http_req_failed':                    ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://backend-staging-1078971769535.asia-east1.run.app';

function getHeaders(token) {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// 產生隨機的 Employee Email (3001 ~ 30000)
function getRandomEmployeeEmail() {
  const id = Math.floor(Math.random() * 27000) + 3001;
  return `employee_${String(id).padStart(6, '0')}@loadtest.com`;
}

// 產生隨機的 Manager Email (3 ~ 3000)
function getRandomManagerEmail() {
  const id = Math.floor(Math.random() * 2998) + 3;
  return `employee_${String(id).padStart(6, '0')}@loadtest.com`;
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
      JSON.stringify({ email: getRandomManagerEmail() }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (res.status !== 200) return;
    const token = res.json('access_token');

    sleep(1);

    http.get(
      `${BASE_URL}/api/v1/manager/subordinates`,
      { headers: getHeaders(token), tags: { endpoint: 'read' } }
    );

    sleep(2);

    http.post(
      `${BASE_URL}/api/v1/me/goals`,
      JSON.stringify({
        title: 'Manager Goal',
        description: 'Manager load test goal',
        goalType: 'PERSONAL',
        progressPercent: 100
      }),
      { headers: getHeaders(token), tags: { endpoint: 'write' } }
    );
  });
}

export function hrFlow() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/dev-login`,
    JSON.stringify({ email: 'hr_1@loadtest.com' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status !== 200) return;
  const token = res.json('access_token');
  
  sleep(1);
  
  http.get(
    `${BASE_URL}/api/v1/hr/performance-cycles`,
    { headers: getHeaders(token), tags: { endpoint: 'read' } }
  );
}
