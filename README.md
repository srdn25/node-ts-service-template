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

```bash
docker-compose -f docker-compose.dev.yaml up --build
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

This project uses [k6](https://k6.io/) for load testing.

### 1. Installation

Before running the load tests, you need to install `k6`.

**Linux (using the official installer):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

For other operating systems, please refer to the official [k6 installation documentation](https://k6.io/docs/get-started/installation/).

### 2. Running the tests

Once `k6` is installed, you can run the load tests using the following npm script:

```bash
npm run load-test
```

This will execute the test script located in `load-tests/auth.js`. You can modify this script or create new ones to simulate different user scenarios.
