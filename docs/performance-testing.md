# Performance Testing

This document outlines how to perform performance testing using `clinic doctor` and `autocannon`.

## Prerequisites

Make sure you have `clinic doctor` and `autocannon` installed globally:

```bash
npm install -g clinic autocannon
```

## Running Performance Tests

## Running Performance Tests

To run performance tests, you can use the following commands:

### Health Endpoint

```bash
clinic doctor --on-port 'autocannon -c 100 -d 30 http://localhost:3001/health' -- node --env-file=.env dist/main.cjs
```

### Login Endpoint

```bash
clinic doctor --on-port 'autocannon -c 10 -d 10 -m POST -H "Content-Type: application/json" -b "{ \"email\": \"test@example.com\", \"password\": \"password123\" }" http://localhost:3001/auth/login' -- node --env-file=.env dist/main.cjs
```
