import { Request, Response, Router } from 'express';
import { AuthController } from '../../../../src/modules/auth/controller';
import { TYPES } from '../../../../src/constants/types';
import { TAuthService } from '../../../../src/types/container';
import { ValidationError } from '../../../../src/libs/errors/Validation.error';
import { authMiddleware } from '../../../../src/middlewares/auth';
import { validate } from '../../../../src/middlewares/validate';
import { User } from '../../../../src/entities/user';
import { TMongoObjectId, MongoObjectId } from '../../../../src/types';

jest.mock('../../../../src/utils', () => ({
  catchAsync:
    () =>
    (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = function (...args: any[]) {
        try {
          return Promise.resolve(originalMethod.apply(this, args));
        } catch (error) {
          return Promise.reject(error);
        }
      };
      return descriptor;
    },
}));

jest.mock('../../../../src/middlewares/validate', () => ({
  validate: jest
    .fn()
    .mockImplementation(
      (schema) => (req: Request, res: Response, next: Function) => {
        next();
      },
    ),
}));

jest.mock('../../../../src/middlewares/auth', () => ({
  authMiddleware: jest
    .fn()
    .mockImplementation((req: any, res: Response, next: Function) => {
      req.user = {
        _id: new MongoObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        address: 'Test Address',
      };
      next();
    }),
}));

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: any;
  let mockRouter: Router;
  let mockRequest: Partial<Request> & { user?: any };
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        csrfToken: 'mock-csrf-token',
      }),
      login: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        csrfToken: 'mock-csrf-token',
      }),
      update: jest.fn().mockResolvedValue({
        name: 'Updated Name',
        email: 'test@example.com',
      }),
      refreshAuthToken: jest.fn().mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        csrfToken: 'new-csrf-token',
      }),
    };

    authController = new AuthController(mockAuthService as any);

    mockRouter = {
      post: jest.fn(),
      patch: jest.fn(),
    } as unknown as Router;

    mockRequest = {
      body: {},
      header: jest.fn().mockReturnValue('mock-csrf-token'),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('setupRoutes', () => {
    it('should set up routes on the router', () => {
      authController.setupRoutes(mockRouter);

      expect(mockRouter.post).toHaveBeenCalledTimes(3);
      expect(mockRouter.patch).toHaveBeenCalledTimes(1);

      expect(mockRouter.post).toHaveBeenCalledWith(
        '/register',
        expect.any(Function),
        expect.any(Function),
      );

      expect(mockRouter.post).toHaveBeenCalledWith(
        '/login',
        expect.any(Function),
        expect.any(Function),
      );

      expect(mockRouter.post).toHaveBeenCalledWith(
        '/refresh-token',
        expect.any(Function),
        expect.any(Function),
      );

      expect(mockRouter.patch).toHaveBeenCalledWith(
        '/user/:userId',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        address: 'Test Address',
      };

      const registerMethod = (authController as any).register.bind(
        authController,
      );
      await registerMethod(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.register).toHaveBeenCalledWith(mockRequest.body);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        csrfToken: 'mock-csrf-token',
      });
    });
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginMethod = (authController as any).login.bind(authController);
      await loginMethod(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.login).toHaveBeenCalledWith(mockRequest.body);

      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        csrfToken: 'mock-csrf-token',
      });
    });
  });

  describe('update', () => {
    it('should update user details and return updated user', async () => {
      mockRequest.body = {
        name: 'Updated Name',
      };

      mockRequest.user = {
        _id: new MongoObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        address: 'Test Address',
      };

      const updateMethod = (authController as any).update.bind(authController);
      await updateMethod(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.update).toHaveBeenCalledWith(
        'test@example.com',
        mockRequest.body,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        name: 'Updated Name',
        email: 'test@example.com',
      });
    });
  });

  describe('refresToken', () => {
    it('should refresh auth tokens when valid csrf token is provided', async () => {
      mockRequest.body = {
        refreshToken: 'old-refresh-token',
        email: 'test@example.com',
      };

      const refreshTokenMethod = (authController as any).refresToken.bind(
        authController,
      );
      await refreshTokenMethod(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockRequest.header).toHaveBeenCalledWith('x-csrf-token');

      expect(mockAuthService.refreshAuthToken).toHaveBeenCalledWith(
        mockRequest.body,
        'mock-csrf-token',
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        csrfToken: 'new-csrf-token',
      });
    });

    it('should throw ValidationError when csrf token is missing', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);

      mockRequest.body = {
        refreshToken: 'old-refresh-token',
        email: 'test@example.com',
      };

      const refreshTokenMethod = (authController as any).refresToken.bind(
        authController,
      );

      await expect(async () => {
        await refreshTokenMethod(
          mockRequest as Request,
          mockResponse as Response,
        );
      }).rejects.toThrow(ValidationError);
    });
  });
});
