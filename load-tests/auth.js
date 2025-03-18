import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Rate, Trend } from 'k6/metrics';

export const options = {
  scenarios: {
    // Authentication testing scenario
    auth_flow: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 }, // Ramp up to 5 users over 30 seconds
        { duration: '1m', target: 10 }, // Ramp up to 10 users over 1 minute
        { duration: '30s', target: 20 }, // Ramp up to 20 users over 30 seconds
        { duration: '1m', target: 20 }, // Maintain 20 users for 1 minute
        { duration: '30s', target: 0 }, // Gradually decrease load to 0 over 30 seconds
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // No more than 1% of requests should fail
    http_req_duration: ['p(95)<500'], // 95% of requests should complete under 500ms
    'http_req_duration{name:login}': ['p(95)<300'], // 95% of login requests under 300ms
    'http_req_duration{name:register}': ['p(95)<400'], // 95% of registration requests under 400ms
  },
};

// Create custom metrics
const authFailRate = new Rate('auth_fail_rate');
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const tokensGenerated = new Counter('tokens_generated');

const BASE_URL = 'http://localhost:3000'; // Replace with your actual API URL

const testUsers = new SharedArray('test_users', function () {
  return Array(20)
    .fill(0)
    .map((_, i) => {
      return {
        email: `testuser${i}@example.com`,
        password: `password${i}123`,
        phone: `123-456-${i.toString().padStart(4, '0')}`,
      };
    });
});

function register(user) {
  const url = `${BASE_URL}/auth/register`;
  const payload = JSON.stringify(user);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'register' },
  };

  const startTime = new Date().getTime();
  const res = http.post(url, payload, params);
  const duration = new Date().getTime() - startTime;

  registerDuration.add(duration);

  const success = check(res, {
    'register status is 201': (r) => r.status === 201,
    'has user data': (r) => r.json() !== undefined,
  });

  if (success) {
    return res.json();
  } else {
    authFailRate.add(1);
    console.log(`Register failed: ${res.status} ${res.body}`);
    return null;
  }
}

function login(credentials) {
  const url = `${BASE_URL}/auth/login`;
  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password,
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'login' },
  };

  const startTime = new Date().getTime();
  const res = http.post(url, payload, params);
  const duration = new Date().getTime() - startTime;

  loginDuration.add(duration);

  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  if (success) {
    tokensGenerated.add(1);
    return res.json();
  } else {
    authFailRate.add(1);
    console.log(`Login failed: ${res.status} ${res.body}`);
    return null;
  }
}

// Main test function
export default function () {
  // Select a random user from our dataset
  const userIndex = Math.floor(Math.random() * testUsers.length);
  const user = testUsers[userIndex];

  // Pause between requests
  sleep(1);

  // Attempt registration (will only succeed the first time for each user)
  const registrationResult = register(user);

  // Pause
  sleep(1);

  // Try to login
  const loginResult = login({
    email: user.email,
    password: user.password,
  });

  // Pause before completing the iteration
  sleep(1);
}
