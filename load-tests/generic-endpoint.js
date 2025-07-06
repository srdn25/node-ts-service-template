import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:3000';
const TARGET_ENDPOINT = __ENV.TARGET_ENDPOINT;
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '10', 10); // Default to 10 RPS

if (!TARGET_ENDPOINT) {
  throw new Error('TARGET_ENDPOINT environment variable is not set.');
}

export const options = {
  scenarios: {
    constant_rps_test: {
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

const responseTimeTrend = new Trend('response_time_ms');

export default function () {
  const url = `${BASE_URL}${TARGET_ENDPOINT}`;
  const res = http.get(url);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  responseTimeTrend.add(res.timings.duration);
  sleep(1); // Small sleep to simulate user think time, adjust as needed
}
