import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Enterprise-Grade Load Testing Script for Performance Management System
 * 
 * Target Profile: Global enterprise with ~100,000 employees.
 * Scenario: "The Deadline Spike" - Simulating a global email blast reminding 
 *           employees that the performance review deadline is in 24 hours. 
 *           We expect a massive spike of up to 5,000 concurrent virtual users (VUs) 
 *           accessing the system simultaneously across multiple regions.
 */

export const options = {
  discardResponseBodies: true,
  
  stages: [
    { duration: '30s', target: __ENV.MAX_VUS ? parseInt(__ENV.MAX_VUS) : 1000 }, 
    { duration: '1m', target: __ENV.MAX_VUS ? parseInt(__ENV.MAX_VUS) : 5000 }, 
    { duration: '2m', target: __ENV.MAX_VUS ? parseInt(__ENV.MAX_VUS) : 5000 }, 
    { duration: '30s', target: 0 },    
  ],
  
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1200'], 
    'http_req_failed': ['rate<0.001'],                
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
// In industry, secrets are passed via CI environment variables, not hardcoded!
const API_KEY = __ENV.API_KEY || 'default-dev-key-do-not-use-in-prod';

export default function () {
  // --- CACHE BUSTING STRATEGY ---
  const randomTemplateId = Math.floor(Math.random() * 100) + 1;
  const cacheBuster = `?cb=${new Date().getTime()}-${Math.random()}`;
  
  const params = {
    headers: {
      'X-API-KEY': API_KEY,
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.get(`${BASE_URL}/api/v1/hr/evaluation-templates/${randomTemplateId}${cacheBuster}`, params);
  
  check(res, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  
  sleep(Math.random() * 4 + 3); 
}
