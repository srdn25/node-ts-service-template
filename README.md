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
- Modify the values in your `.env` file to match your needs.
- **Do not change `MONGODB_URI`** value, when you start local development.

Example `.env`:

```properties
MONGODB_URI=mongodb://root:example@localhost:27017/northStarInvoice?authSource=admin&replicaSet=rs0
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_TOKEN_SECRET=your_refresh_jwt_secret_key
PORT=3000
NODE_ENV=development

# LOGGER_ES_URL='http://elasticsearch:9200'
LOGGER_LEVEL=info
LOGGER_FILE_PATH='/logs'
```

### Development

To run service localy follow next steps:

- chmod +x ./docker/generate-ca-key.sh
- ./docker/generate-ca-key.sh // it will generate ssl certificate for mongodb
- npm run local:docker
- docker exec -it mongo-north-star-invoice mongosh
  - use admin
  - db.auth("root")
  - Enter password <example>
  - rs.initiate({
    \_id : 'rs0',
    members: [
    { _id : 0, host : "mongodb:27017" }
    ]
    })

### Testing

The project includes integration tests for the API endpoints. There are several ways to run the tests:

#### Run Tests with Docker (All-in-one)

This will start MongoDB in a container and run the tests:

```bash
npm run test:integration:docker
```

#### Separate Testing Steps

If you want more control over the testing process, you can:

1. **Start only the test database**:

```bash
npm run test:db:start
```

2. **Run tests against the running database**:

```bash
npm run test:run
```

3. **Stop the test database when done**:

```bash
npm run test:db:stop
```

#### Testing Environment

The tests use a separate MongoDB database (`northStarInvoice-integration-tests`) to avoid conflicting with development data. The test configuration is in `.integration.test.env` file.

Integration tests are located in the `test/integration` directory and use Jest as the testing framework with SuperTest for API testing.

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
