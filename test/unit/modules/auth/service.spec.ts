import { AuthService } from '../../../../src/modules/auth/service';
import { UserModel } from '../../../../src/entities/user';
import { ApplicationError } from '../../../../src/libs/errors/Application.error';
import { TConfig, TLogger } from '../../../../src/types/container';
import * as authUtils from '../../../../src/utils/auth';
import {
  LoginDto,
  RefreshAuthTokenDto,
  RegisterDto,
  UpdateDto,
} from '../../../../src/modules/auth/schema';
import { Types } from 'mongoose';
import { MongoObjectId } from '../../../../src/types';
import { MongooseErrorHandler } from '../../../../src/libs/errors/Database.error';

jest.mock('../../../../src/utils/index', () => {
  const originalModule = jest.requireActual('../../../../src/utils/index');

  return {
    ...originalModule,
    DatabaseErrorCatch: () => {
      return function (
        target: object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<any>,
      ): TypedPropertyDescriptor<any> | void {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
          try {
            return await originalMethod.apply(this, args);
          } catch (error) {
            if (error instanceof Error && error.message === 'User not found') {
              throw new Error('Invalid credentials');
            }
            throw error;
          }
        };
        return descriptor;
      };
    },
  };
});

jest.mock('../../../../src/entities/user', () => ({
  UserModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../../../src/utils/auth', () => ({
  createPasswordHash: jest.fn(),
  verifyPassword: jest.fn(),
  createAuthJwt: jest.fn(),
  decryptRefreshToken: jest.fn(),
  invalidCredentialsError: new Error('Invalid credentials'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockConfig: TConfig;
  let mockLogger: TLogger;
  let mockUserId: string;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      values: {
        JWT_SECRET: 'test-secret',
        JWT_ACCESS_TOKEN_EXPIRE_TIME: '1h',
        JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
        JWT_REFRESH_TOKEN_EXPIRE_TIME: '7d',
        MONGODB_URI: 'mongodb://test',
        MONGODB_TLS_FILE_PATH: '',
        PORT: 3000,
        NODE_ENV: 'test',
        LOGGER_LEVEL: 'info',
        SWAGGER_PATH: '/api-docs',
        AUTHENTICATION_SCHEME: 'Bearer',
        CORS_ORIGIN: '*',
        CORS_METHODS: 'GET,POST,PUT,DELETE',
      },
    } as unknown as TConfig;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      },
      config: {},
      prepareMetadata: jest.fn(),
    } as unknown as TLogger;

    mockUserId = new Types.ObjectId().toString();

    authService = new AuthService(mockConfig, mockLogger);
  });

  describe('register', () => {
    it('should register a new user and return auth tokens', async () => {
      const registerDto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        address: '123 Test St',
        phone: '123-456-7890',
      };

      const mockAuthJwt = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        csrfToken: 'csrf-token',
        expireInAccessToken: '1h',
        expireInRefreshToken: '7d',
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (authUtils.createPasswordHash as jest.Mock).mockReturnValue({
        hash: 'hashed-password',
        salt: 'salt-value',
      });

      const mockUser = {
        _id: mockUserId,
        email: registerDto.email,
      };

      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);
      (authUtils.createAuthJwt as jest.Mock).mockReturnValue(mockAuthJwt);

      const result = await authService.register(registerDto);

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(authUtils.createPasswordHash).toHaveBeenCalledWith(
        registerDto.password,
      );
      expect(UserModel.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'salt-value:hashed-password',
      });
      expect(authUtils.createAuthJwt).toHaveBeenCalledWith(
        mockUserId,
        registerDto.email,
        mockConfig,
      );

      expect(result).toEqual(mockAuthJwt);
    });

    it('should throw an error if user already exists', async () => {
      const registerDto: RegisterDto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        address: '123 Test St',
      };

      const existingUser = {
        _id: mockUserId,
        email: registerDto.email,
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ApplicationError,
      );

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(UserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in a user and return auth tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: mockUserId,
        email: loginDto.email,
        password: 'salt:hash',
      };

      const mockAuthJwt = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        csrfToken: 'csrf-token',
        expireInAccessToken: '1h',
        expireInRefreshToken: '7d',
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (authUtils.createAuthJwt as jest.Mock).mockReturnValue(mockAuthJwt);

      const result = await authService.login(loginDto);

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(authUtils.verifyPassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(authUtils.createAuthJwt).toHaveBeenCalledWith(
        mockUserId,
        loginDto.email,
        mockConfig,
      );

      expect(result).toEqual(mockAuthJwt);
    });

    it('should throw an error if user does not exist', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      (UserModel.findOne as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid credentials');
      });

      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(authUtils.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw an error if token creation fails', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: mockUserId,
        email: loginDto.email,
        password: 'salt:hash',
      };

      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (authUtils.createAuthJwt as jest.Mock).mockImplementation(() => {
        throw new Error('Token creation failed');
      });

      await expect(authService.login(loginDto)).rejects.toThrow();

      expect(UserModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(authUtils.verifyPassword).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user details', async () => {
      const email = 'test@example.com';
      const updateDto: UpdateDto = {
        name: 'Updated Name',
        address: 'New Address',
      };

      const updatedUser = {
        _id: mockUserId,
        email,
        name: updateDto.name,
        address: updateDto.address,
      };

      (UserModel.findOneAndUpdate as jest.Mock).mockResolvedValue(updatedUser);

      const result = await authService.update(email, updateDto);

      expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { email },
        updateDto,
        { new: true },
      );

      expect(result).toEqual(updatedUser);
    });

    it('should throw an error if user for update is not found', async () => {
      const email = 'nonexistent@example.com';
      const updateDto: UpdateDto = {
        name: 'Updated Name',
      };

      (UserModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(authService.update(email, updateDto)).rejects.toThrow(
        ApplicationError,
      );

      expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { email },
        updateDto,
        { new: true },
      );
    });
  });

  describe('refreshAuthToken', () => {
    it('should refresh auth tokens with valid refresh token', async () => {
      const refreshTokenDto = {
        email: 'test@example.com',
        refreshToken: 'valid-refresh-token',
      };
      const csrfToken = 'valid-csrf-token';

      const tokenData = {
        userId: mockUserId,
        email: 'test@example.com',
      };

      const mockUser = {
        _id: new MongoObjectId(mockUserId),
        email: tokenData.email,
      };

      const mockAuthJwt = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        csrfToken: 'new-csrf-token',
        expireInAccessToken: '1h',
        expireInRefreshToken: '7d',
      };

      (authUtils.decryptRefreshToken as jest.Mock).mockReturnValue(tokenData);
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (authUtils.createAuthJwt as jest.Mock).mockReturnValue(mockAuthJwt);

      const result = await authService.refreshAuthToken(
        refreshTokenDto,
        csrfToken,
      );

      expect(authUtils.decryptRefreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        csrfToken,
        mockConfig,
      );

      expect(UserModel.findOne).toHaveBeenCalledWith({
        email: tokenData.email,
        _id: expect.any(MongoObjectId),
      });

      expect(authUtils.createAuthJwt).toHaveBeenCalledWith(
        mockUserId,
        tokenData.email,
        mockConfig,
      );

      expect(result).toEqual(mockAuthJwt);
    });

    it('should throw an error with invalid refresh token data', async () => {
      const refreshTokenDto = {
        email: 'test@example.com',
        refreshToken: 'invalid-refresh-token',
      };
      const csrfToken = 'invalid-csrf-token';

      (authUtils.decryptRefreshToken as jest.Mock).mockReturnValue({
        email: 'test@example.com',
      });

      await expect(
        authService.refreshAuthToken(refreshTokenDto, csrfToken),
      ).rejects.toThrow(ApplicationError);

      expect(authUtils.decryptRefreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
        csrfToken,
        mockConfig,
      );

      expect(UserModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw an error when user from token is not found', async () => {
      const refreshTokenDto = {
        email: 'deleted@example.com',
        refreshToken: 'valid-refresh-token',
      };
      const csrfToken = 'valid-csrf-token';

      const tokenData = {
        userId: mockUserId,
        email: 'deleted@example.com',
      };

      (authUtils.decryptRefreshToken as jest.Mock).mockReturnValue(tokenData);

      (UserModel.findOne as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid credentials');
      });

      await expect(
        authService.refreshAuthToken(refreshTokenDto, csrfToken),
      ).rejects.toThrow('Invalid credentials');

      expect(authUtils.decryptRefreshToken).toHaveBeenCalled();
      expect(UserModel.findOne).toHaveBeenCalled();
      expect(authUtils.createAuthJwt).not.toHaveBeenCalled();
    });

    it('should throw an error with completely invalid token', async () => {
      const refreshTokenDto = {
        email: 'test@example.com',
        refreshToken: 'completely-invalid',
      };
      const csrfToken = 'invalid-csrf';

      (authUtils.decryptRefreshToken as jest.Mock).mockReturnValue(undefined);

      await expect(
        authService.refreshAuthToken(refreshTokenDto, csrfToken),
      ).rejects.toThrow(ApplicationError);

      expect(authUtils.decryptRefreshToken).toHaveBeenCalled();
      expect(UserModel.findOne).not.toHaveBeenCalled();
    });
  });
});
