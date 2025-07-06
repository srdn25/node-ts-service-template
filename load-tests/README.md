# Load Testing

This directory contains k6 load tests for the Node.js TypeScript service.

## Prerequisites

- Docker and Docker Compose installed
- Target service running and accessible (local development server, remote API, etc.)

## Running Load Tests

### Quick Start

The easiest way to run load tests:

```bash
# Run against local development server
npm run test:load

# Or use the script directly
./scripts/run-load-test.sh run
```

### Manual Docker Commands

Run load tests against any external service:

```bash
# Against local development server (default)
docker-compose -f docker-compose.load-test.yaml up --build

# Against remote host
TARGET_HOST=http://api.example.com:3000 docker-compose -f docker-compose.load-test.yaml up --build

# Against custom port
TARGET_HOST=http://localhost:8080 docker-compose -f docker-compose.load-test.yaml up --build
```

## Test Configuration

The load test (`auth.js`) includes:

- **Ramping VUs**: Starts with 1 user, ramps up to 20 users over 2.5 minutes
- **Test Duration**: Total test runs for 3.5 minutes
- **Test Scenarios**: Registration and login flows
- **Metrics**: Custom metrics for auth failures, login/register durations, and token generation
- **Thresholds**: 
  - Less than 1% request failures
  - 95% of requests under 500ms
  - Login requests under 300ms
  - Registration requests under 400ms

## Test Data

The test generates 20 unique test users with:
- Email: `testuser{i}@example.com`
- Name: `Test User {i}`
- Password: `password{i}123`
- Address: `Somestreet-{i}` (padded to 4 digits)

## Troubleshooting

### Connection Refused Errors

If you see "connection refused" errors:

1. **Check if the target application is running**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Verify the TARGET_HOST environment variable**:
   - For local development: `http://localhost:3000`
   - For remote host: `http://api.example.com:3000`
   - For WSL2: `http://host.docker.internal:3000`

3. **Check if the target service is accessible**:
   ```bash
   # Test connectivity
   curl -v $TARGET_HOST/health
   
   # Check if port is open
   telnet localhost 3000
   ```

### Performance Issues

- Adjust VU count and duration in the docker-compose file
- Monitor system resources during tests
- Check application logs for bottlenecks

## Customizing Tests

To modify test parameters, edit the `options` object in `auth.js`:

```javascript
export const options = {
  scenarios: {
    auth_flow: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        // ... more stages
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};
```
