import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  createPasswordHash,
  verifyPassword,
  createAccessToken,
  createRefreshToken,
  decryptRefreshToken,
  createAuthJwt,
  invalidCredentialsError,
} from '../../../src/utils/auth';
import { TConfig } from '../../../src/types/container';

jest.mock('jsonwebtoken');
jest.mock('crypto');

describe('Auth Utils', () => {
  let mockConfig: TConfig;

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

    (crypto.randomBytes as jest.Mock).mockReturnValue(
      Buffer.from('a'.repeat(16)),
    );
    (crypto.pbkdf2Sync as jest.Mock).mockReturnValue(
      Buffer.from('hashedpassword'.padEnd(64, '0')),
    );
    (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);

    const mockHashInstance = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('a'.repeat(32)),
    };
    (crypto.createHash as jest.Mock).mockReturnValue(mockHashInstance);

    const mockCipher = {
      update: jest.fn().mockReturnValue('encrypted'),
      final: jest.fn().mockReturnValue('data'),
    };
    (crypto.createCipheriv as jest.Mock).mockReturnValue(mockCipher);

    const mockDecipher = {
      update: jest
        .fn()
        .mockReturnValue('{"userId":"123","email":"test@example.com"}'),
      final: jest.fn().mockReturnValue(''),
    };
    (crypto.createDecipheriv as jest.Mock).mockReturnValue(mockDecipher);

    (jwt.sign as jest.Mock).mockReturnValue('jwt-token');
  });

  describe('createPasswordHash', () => {
    it('should create a hash and salt when no salt is provided', () => {
      const result = createPasswordHash('password');

      expect(result.hash).toBeTruthy();
      expect(result.salt).toBeTruthy();
      expect(result.hash.length).toBeGreaterThan(0);
      expect(result.salt.length).toBeGreaterThan(0);
    });

    it('should use the provided salt when available', () => {
      const salt = 'testsalt123';
      const result = createPasswordHash('password', salt);

      expect(result.hash).toBeTruthy();
      expect(result.salt).toBe(salt);

      const result2 = createPasswordHash('password', salt);
      expect(result.hash).toBe(result2.hash);
    });
  });

  describe('verifyPassword', () => {
    it('should not throw when password is valid', () => {
      const { hash, salt } = createPasswordHash('password');
      const combinedPassword = `${salt}:${hash}`;

      expect(() => {
        verifyPassword('password', combinedPassword);
      }).not.toThrow();
    });

    it('should throw when the stored password format is invalid', () => {
      expect(() => {
        verifyPassword('password', 'invalidformat');
      }).toThrow(invalidCredentialsError);
    });

    it('should throw when passwords do not match', () => {
      const { hash, salt } = createPasswordHash('password');
      const combinedPassword = `${salt}:${hash}`;

      expect(() => {
        verifyPassword('wrongpassword', combinedPassword);
      }).toThrow(invalidCredentialsError);
    });
  });

  describe('createAccessToken', () => {
    it('should create a JWT access token', () => {
      const token = createAccessToken('123', 'test@example.com', mockConfig);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('createRefreshToken and decryptRefreshToken', () => {
    it('should create and decrypt a refresh token', () => {
      const userId = '123';
      const email = 'test@example.com';

      const { refreshToken, iv } = createRefreshToken(
        userId,
        email,
        mockConfig,
      );

      expect(refreshToken).toBeTruthy();
      expect(iv).toBeTruthy();

      const decrypted = decryptRefreshToken(refreshToken, iv, mockConfig);

      expect(decrypted).toBeTruthy();
      expect(decrypted?.userId).toBe(userId);
      expect(decrypted?.email).toBe(email);
    });
  });

  describe('createAuthJwt', () => {
    it('should create a complete auth JWT response', () => {
      const result = createAuthJwt('123', 'test@example.com', mockConfig);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('csrfToken');
      expect(result).toHaveProperty('expireInAccessToken', '1h');
      expect(result).toHaveProperty('expireInRefreshToken', '7d');
    });
  });
});
