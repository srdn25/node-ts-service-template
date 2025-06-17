/// <reference types="jest" />

import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';

let mongoContainer: StartedMongoDBContainer;

beforeAll(async () => {
  // Start MongoDB container for integration tests
  if (process.env.NODE_ENV === 'test' && process.env.JEST_WORKER_ID) {
    mongoContainer = await new MongoDBContainer('mongo:8.0')
      .start();
    
    // Set the MongoDB URI for tests
    process.env.MONGODB_URI = mongoContainer.getConnectionString();
  }
});

afterAll(async () => {
  // Clean up MongoDB container
  if (mongoContainer) {
    await mongoContainer.stop();
  }
});

afterAll(() => {
  jest.clearAllTimers();
});
