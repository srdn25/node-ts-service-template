import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:3000';
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '10', 10); // Default to 10 RPS

export const options = {
  scenarios: {
    constant_arrival_rate_test: {
      executor: 'constant-arrival-rate',
      rate: TARGET_RPS, // requests per second
      timeUnit: '1s',
      duration: '30s', // Run for 30 seconds
      preAllocatedVUs: 10, // Initial VUs to allocate
      maxVUs: 50, // Max VUs to allow
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // No more than 1% of requests should fail
    http_req_duration: ['p(95)<500'], // 95% of requests should complete under 500ms
  },
};

const registerDuration = new Trend('register_duration_ms');

export default function () {
  const uniqueId = Date.now() + Math.random().toString(36).substring(2, 15);
  const user = {
    email: `testuser-${uniqueId}@example.com`,
    name: `Test User ${uniqueId}`,
    password: `password${uniqueId}`,
    address: `Somestreet-${uniqueId}`,
  };

  const url = `${BASE_URL}/auth/register`;
  const payload = JSON.stringify(user);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'register' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'register status is 201': (r) => r.status === 201,
  });

  registerDuration.add(res.timings.duration);
  sleep(1); // Small sleep to simulate user think time, adjust as needed
}
