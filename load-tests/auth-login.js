import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const BASE_URL = __ENV.TARGET_HOST || 'http://localhost:3000';
const TARGET_RPS = parseInt(__ENV.TARGET_RPS || '10', 10); // Default to 10 RPS
const NUM_TEST_USERS = parseInt(__ENV.NUM_TEST_USERS || '50', 10); // Number of test users to create

// Custom metrics
const loginDuration = new Trend('login_duration_ms');
const loginFailRate = new Rate('login_fail_rate');
const loginSuccessRate = new Rate('login_success_rate');
const responseDetails = new Counter('response_details');

// Test users array - will be populated during setup
let testUsers = [];

// Setup function to create test users
export function setup() {
  console.log(`Setting up ${NUM_TEST_USERS} test users...`);
  
  // Create array of test users
  for (let i = 1; i <= NUM_TEST_USERS; i++) {
    const userUniqueId = crypto.randomUUID();
    testUsers.push({
      email: `testuser${userUniqueId}@example.com`,
      password: `password${userUniqueId}123`,
      name: `Test User ${userUniqueId}`,
      address: `Somestreet-${userUniqueId}`,
      phone: `+1234567${userUniqueId}`,
    });
  }

  // Register all test users
  let registeredUsers = [];
  let registrationFailures = 0;

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const url = `${BASE_URL}/auth/register`;
    const payload = JSON.stringify(user);
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'setup_register' },
    };

    const res = http.post(url, payload, params);
    
    if (res.status === 201) {
      registeredUsers.push(user);
      console.log(`✓ Registered user ${i + 1}/${NUM_TEST_USERS}: ${user.email}`);
    } else {
      registrationFailures++;
      console.log(`✗ Failed to register user ${i + 1}/${NUM_TEST_USERS}: ${user.email} - Status: ${res.status}, Body: ${res.body}`);
    }
  }

  console.log(`Setup complete: ${registeredUsers.length} users registered, ${registrationFailures} failures`);
  
  // Return only successfully registered users
  return { registeredUsers };
}

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

export default function (data) {
  // Get registered users from setup
  const { registeredUsers } = data;
  
  if (!registeredUsers || registeredUsers.length === 0) {
    console.log('No registered users available for login test');
    return;
  }

  // Select a random user from the registered users
  const randomIndex = Math.floor(Math.random() * registeredUsers.length);
  const testUser = registeredUsers[randomIndex];

  const url = `${BASE_URL}/auth/login`;
  const payload = JSON.stringify({
    email: testUser.email,
    password: testUser.password,
  });
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'login' },
  };

  const res = http.post(url, payload, params);

  // Check response and log details
  const loginCheck = check(res, {
    'login status is 200': (r) => r.status === 200,
    'has access token': (r) => {
      try {
        const body = r.json();
        return body && body.accessToken;
      } catch (e) {
        return false;
      }
    },
    'has refresh token': (r) => {
      try {
        const body = r.json();
        return body && body.refreshToken;
      } catch (e) {
        return false;
      }
    },
  });

  // Track success/failure rates
  if (loginCheck) {
    loginSuccessRate.add(1);
  } else {
    loginFailRate.add(1);
  }

  // Log response details for debugging
  if (res.status !== 200) {
    console.log(`Login failed for ${testUser.email}: Status ${res.status}, Body: ${res.body}`);
    responseDetails.add(1);
  }

  loginDuration.add(res.timings.duration);
  sleep(1); // Small sleep to simulate user think time, adjust as needed
}
