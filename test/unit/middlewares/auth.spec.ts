import { authMiddleware } from '../../../src/middlewares/auth';
import jwt from 'jsonwebtoken';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UserModel } from '../../../src/entities/user';
import { Types } from 'mongoose';

jest.mock('jsonwebtoken');
jest.mock('../../../src/entities/user', () => ({
  UserModel: {
    findOne: jest.fn(),
  },
  UserSchemaZod: {
    parse: jest.fn().mockImplementation((data) => data),
  },
}));

describe('authMiddleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockResponse: Partial<FastifyReply>;
  const originalEnv = process.env;

  beforeEach(() => {
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should authenticate user with valid token', async () => {
    const userId = new Types.ObjectId();
    const userEmail = 'test@example.com';
    const mockUser = {
      _id: userId,
      email: userEmail,
      name: 'Test User',
      toObject: jest.fn().mockReturnValue({
        _id: userId,
        email: userEmail,
        name: 'Test User',
      }),
    };

    (jwt.verify as jest.Mock).mockReturnValue({
      userId,
      email: userEmail,
    });

    (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

    await authMiddleware(
      mockRequest as FastifyRequest,
      mockResponse as FastifyReply,
    );

    expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    expect(UserModel.findOne).toHaveBeenCalledWith({
      email: userEmail,
      _id: userId,
    });
    expect((mockRequest as any).user).toEqual({
      _id: userId,
      email: userEmail,
      name: 'Test User',
    });
  });

  it('should return 401 when no token is provided', async () => {
    mockRequest.headers = {};

    await authMiddleware(
      mockRequest as FastifyRequest,
      mockResponse as FastifyReply,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledWith({
      error: 'No token provided',
    });
  });

  it('should return 401 when token verification fails', async () => {
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(
      mockRequest as FastifyRequest,
      mockResponse as FastifyReply,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledWith({
      error: 'Invalid token',
    });
  });

  it('should return 401 when user is not found', async () => {
    const userId = new Types.ObjectId();
    const userEmail = 'test@example.com';

    (jwt.verify as jest.Mock).mockReturnValue({
      userId,
      email: userEmail,
    });

    (UserModel.findOne as jest.Mock).mockResolvedValue(null);

    await authMiddleware(
      mockRequest as FastifyRequest,
      mockResponse as FastifyReply,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.send).toHaveBeenCalledWith({
      error: 'User not found',
    });
  });
});
