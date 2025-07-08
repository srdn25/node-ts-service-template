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

### Docker Swarm Deployment

To deploy the service to a Docker Swarm cluster, you first need to build and push the Docker image to a registry. Then you can use the `docker-compose.dev.yaml` file with the `docker stack deploy` command.

1.  **Build the Docker image:**
    ```bash
    docker build -t service-template:latest .
    ```

2.  **Push the image to a registry:**
    ```bash
    docker push service-template:latest
    ```

3.  **Initialize Docker Swarm** (if you haven't already):
    ```bash
    docker swarm init
    ```

4.  **Deploy the stack:**
    ```bash
    docker stack deploy -c docker-compose.dev.yaml service-template
    ```
    This will create a stack named `service-template`.

### Monitoring the Service

Once the service is deployed, you can monitor it using the following commands:

-   **List the running services in the stack:**
    ```bash
    docker stack services service-template
    ```

-   **Check the resource usage of the running containers:**
    ```bash
    docker stats --no-stream
    ```

-   **List the running containers for the service:**
    ```bash
    docker service ps service-template_app
    ```

-   **View service logs:**
    ```bash
    docker service logs service-template_app
    ```

### Removing the Stack

To remove the deployed stack, use the following command:

```bash
docker stack rm service-template
```

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

## Performance Testing

For detailed information on how to perform performance testing using `clinic doctor` and `autocannon`, refer to the [Performance Testing Documentation](./docs/performance-testing.md).


### Running the Load Tests

The easiest way to run the load tests is to use the provided npm script:

```bash
npm run test:load
```

This will execute the `scripts/run-all-load-tests.sh` script, which runs a series of load tests against the service.

### Configuration

You can configure the load test parameters by editing the `scripts/run-all-load-tests.sh` script. The following variables are available at the top of the file:

- `START_RPS`: The initial number of requests per second.
- `RPS_STEP`: The amount to increase the RPS by in each step.
- `MAX_RPS`: The maximum number of requests per second to test.

The script will run tests for each endpoint defined in the `ENDPOINTS` array, starting with 10 RPS and then iterating from `START_RPS` to `MAX_RPS` with the specified step.

#### Targeting a Specific Host for Load Tests

By default, load tests are configured to target `http://172.21.127.86:3000` (your WSL IP address). If you need to target a different host (e.g., a local Docker Compose setup or another IP), you can override the `TARGET_HOST` environment variable when running the load tests:

```bash
TARGET_HOST=http://localhost:3000 npm run test:load
```

