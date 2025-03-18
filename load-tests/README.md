# Service Load Tests

This directory contains scripts for load testing the service API using [k6](https://k6.io/).

## Requirements

- Installed k6 (https://k6.io/docs/get-started/installation/)
- Running application (by default at http://localhost:3000)

## Scripts

The directory contains the following load testing scripts:

1. **auth.js** - testing authentication (registration, login)

## Running Tests

### Basic Run

```bash
k6 run load-tests/auth.js
```

### Running with Custom Parameters

```bash
k6 run --vus 10 --duration 30s load-tests/auth.js
```

### Running with Results Saving

```bash
k6 run --out json=results.json load-tests/auth.js
```

## Test Configuration

Before running the tests, you may need to change the following parameters:

1. **BASE_URL** - API URL (default is 'http://localhost:3000')
2. **Test data** - test users
3. **Thresholds** - acceptable values for response time and error rate

## Metrics

All scripts collect the following metrics:

- Response time for each request type
- Percentage of failed requests
- Number of successful operations for each resource
- Additional custom metrics (depends on the script)

## Load Scenarios

### auth.js

- Ramping up from 1 to 20 users over several minutes
- Simulation of registration and login processes

## Results Analysis

After running the test, k6 outputs a detailed report with performance metrics, including:

- Average response time
- Median response time
- 95th and 99th percentiles of response time
- Request rate
- Number of errors

## Performance Requirements

The tests have the following thresholds:

- No more than 1% of requests should fail
- 95% of all requests should complete under 500ms
- 95% of login requests should complete under 300ms
- 95% of registration requests should complete under 400ms
