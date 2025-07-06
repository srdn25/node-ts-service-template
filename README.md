# Node.js service template

## Technical Stack

- **Node.js:** The runtime environment.
- **TypeScript:** The programming language.
- **Express:** The web framework.
- **MongoDB:** The database.
- **Mongoose:** The ODM (Object Data Modeling) library for MongoDB.
- **JSON Web Tokens (JWT):** For authentication and authorization.
- **Inversify:** For Dependency Injection.
- **Zod:** For data validation.
- **Winston**: for logging.
- **Docker:** For containerization.
- **Jest:** For testing.

## Preparation Steps

### 1. Prerequisites

- **Node.js and npm:** Ensure you have Node.js (version 22 or higher is recommended) and npm installed on your system.
- **Docker:** Docker Desktop must be installed and running on your machine.

### 2. Environment Variables

- Create a `.env` file in the project's root directory.
- Copy the content of `.env.example` to your `.env` file.
- **You must provide your own `MONGODB_URI`**. The service is configured to connect to a MongoDB database, but a database instance is not included in this template. You can use a local MongoDB instance or a cloud-based service like MongoDB Atlas.
- Modify the other values in your `.env` file to match your needs.

Example `.env`:

```properties
MONGODB_URI=mongodb://user:password@your-mongodb-host:27017/your-database
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_TOKEN_SECRET=your_refresh_jwt_secret_key
PORT=3000
NODE_ENV=development

# LOGGER_ES_URL='http://elasticsearch:9200'
LOGGER_LEVEL=info
LOGGER_FILE_PATH='/logs'
```

### Development

To run the service locally, you can use the provided Docker Compose setup:

Use remote mongo server or create localy:
docker run --name dev-mongo -p 27017:27017 -d mongo:8.0.11

```bash
docker compose -f docker-compose.dev.yaml up --build
```

This will start the service, but you will need to have a MongoDB instance running and have the `MONGODB_URI` in your `.env` file pointing to it.

### Testing

The project includes integration tests for the API endpoints. The tests use **testcontainers** to automatically manage MongoDB containers for isolated testing.

#### Run All Tests

```bash
npm run test
```

This will run both unit tests and integration tests.

#### Run Tests Separately

**Unit Tests:**
```bash
npm run test:unit
```

**Integration Tests:**
```bash
npm run test:integration
```

#### Testing Environment

Integration tests automatically:
- Start a fresh MongoDB container for each test run
- Use isolated test data to avoid conflicts
- Clean up containers after tests complete
- No manual Docker setup required

The test configuration is in `.integration.test.env` file.

Integration tests are located in the `test/integration` directory and use Jest as the testing framework with SuperTest for API testing.

#### Legacy Docker Testing (Optional)

If you prefer to use Docker Compose for testing:

```bash
npm run test:docker
```

This runs all tests in a Docker environment.

## API Documentation

The API is documented using Swagger/OpenAPI. When the application is running, you can access the documentation at:

```
http://localhost:3000/docs
```

The path can be configured by setting the `SWAGGER_PATH` environment variable in the `.env` file.

### Testing Authenticated Endpoints in Swagger UI

To test endpoints that require authentication:

1. Use the `/register` or `/login` endpoint to get an access token
2. Click the "Authorize" button at the top of the Swagger UI
3. Enter your token in the format: `Bearer YOUR_TOKEN_HERE`
4. Click "Authorize" and then "Close"
5. Now you can use all authenticated endpoints in the Swagger UI

Note: The JWT token expires after some time. If you get an unauthorized error, repeat the login process to get a new token. Or exchange auth token by refresh token

## Load Testing

This project uses [k6](https://k6.io/) for load testing against external services.

### Quick Start

The easiest way to run load tests is using the provided script:

```bash
# Run against local development server
npm run test:load

# Or run with custom target
TARGET_HOST=http://api.example.com:3000 npm run test:load
```

### Manual Docker Commands

Run load tests against any external service:

```bash
# Against local development server (default)
docker-compose -f docker-compose.load-test.yaml up --build

# Against remote host
TARGET_HOST=http://api.example.com:3000 docker-compose -f docker-compose.load-test.yaml up --build
```

### Test Configuration

The load tests include:
- **Authentication flows**: Registration and login testing
- **Ramping load**: 1 to 20 users over 3.5 minutes
- **Performance thresholds**: 95% of requests under 500ms
- **Custom metrics**: Auth failures, response times, token generation

### Test Scenarios

- **auth.js**: Tests user registration and login flows
- Generates 20 unique test users
- Measures response times and error rates
- Validates authentication token generation

For detailed configuration and troubleshooting, see [load-tests/README.md](load-tests/README.md).
