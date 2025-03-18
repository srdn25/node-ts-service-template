import request from 'supertest';
import { App } from '../../src/App';
import { container } from '../../src/container';
import { TYPES } from '../../src/constants/types';
import { UserModel } from '../../src/entities/user';

let serviceInstance: App;
let authTokens: { accessToken: string; refreshToken: string };
let userId: string;

beforeAll(async () => {
  serviceInstance = container.get<App>(TYPES.App);
  await serviceInstance.start();
});

afterAll(async () => {
  await serviceInstance.stop();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

describe('Auth Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
    address: '123 Test St',
    phone: '+1234567890',
  };

  describe('POST /register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(serviceInstance.app)
        .post('/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      authTokens = res.body;
      const users = await UserModel.find({ email: testUser.email });
      expect(users).toHaveLength(1);
      userId = users[0]._id.toString();
    });

    it('should return 400 when registering with existing email', async () => {
      await request(serviceInstance.app).post('/register').send(testUser);

      const res = await request(serviceInstance.app)
        .post('/register')
        .send(testUser);

      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 when registering with invalid data', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123', // password is too short
        name: '', // empty name
      };

      const res = await request(serviceInstance.app)
        .post('/register')
        .send(invalidUser);

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /login', () => {
    it('should login and return tokens', async () => {
      await request(serviceInstance.app).post('/register').send(testUser);

      const res = await request(serviceInstance.app).post('/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 400 with incorrect password', async () => {
      await request(serviceInstance.app).post('/register').send(testUser);

      const res = await request(serviceInstance.app).post('/login').send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 with non-existent email', async () => {
      const res = await request(serviceInstance.app).post('/login').send({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('POST /refresh-token', () => {
    it('should refresh tokens with valid refresh token and CSRF from register response', async () => {
      const registerRes = await request(serviceInstance.app)
        .post('/register')
        .send(testUser);
      const { refreshToken, csrfToken } = registerRes.body;

      const res = await request(serviceInstance.app)
        .post('/refresh-token')
        .set('x-csrf-token', csrfToken)
        .send({ refreshToken, email: testUser.email });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should refresh tokens with valid refresh token and CSRF from login response', async () => {
      await request(serviceInstance.app).post('/register').send(testUser);

      const loginRes = await request(serviceInstance.app).post('/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      const { refreshToken, csrfToken } = loginRes.body;

      const res = await request(serviceInstance.app)
        .post('/refresh-token')
        .set('x-csrf-token', csrfToken)
        .send({ refreshToken, email: testUser.email });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 400 with missing CSRF token', async () => {
      const registerRes = await request(serviceInstance.app)
        .post('/register')
        .send(testUser);
      const { refreshToken } = registerRes.body;

      const res = await request(serviceInstance.app)
        .post('/refresh-token')
        .send({ refreshToken });

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('PATCH /user/:userId', () => {
    it('should update user data when authenticated', async () => {
      const registerRes = await request(serviceInstance.app)
        .post('/register')
        .send(testUser);
      const { accessToken } = registerRes.body;

      const users = await UserModel.find({ email: testUser.email });
      const userId = users[0]._id.toString();

      const updateData = {
        name: 'Updated Name',
        address: 'New Address, 123',
        phone: '+7987654321',
      };

      const res = await request(serviceInstance.app)
        .patch(`/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', 'Updated Name');
      expect(res.body).toHaveProperty('address', 'New Address, 123');
      expect(res.body).toHaveProperty('phone', '+7987654321');

      const updatedUser = await UserModel.findById(userId);
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.address).toBe('New Address, 123');
      expect(updatedUser?.phone).toBe('+7987654321');
    });

    it('should return 401 when not authenticated', async () => {
      await request(serviceInstance.app).post('/register').send(testUser);

      const users = await UserModel.find({ email: testUser.email });
      const userId = users[0]._id.toString();

      const updateData = {
        name: 'Updated Name',
      };

      const res = await request(serviceInstance.app)
        .patch(`/user/${userId}`)
        .send(updateData);

      expect(res.statusCode).toEqual(401);
    });
  });
});
