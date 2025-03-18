import jwt from 'jsonwebtoken';
import { ValidationError } from '@/libs/errors/Validation.error';
import type { TConfig } from '@/types/container';
import type { Cipher, Decipher } from 'node:crypto';
import {
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'node:crypto';
import type { IAuthJwtResponse } from '@/types';

const ITERATIONS = 1000;
const KEY_LEN = 64;
const DIGEST = 'sha256';
const SALT_LENGTH = 16;
const AES_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, the IV length is 16 bytes

export const invalidCredentialsError = new ValidationError(
  'utils.auth',
  'Invalid credentials',
);

export function createPasswordHash(
  password: string,
  argSalt?: string,
): { hash: string; salt: string } {
  let salt = argSalt;

  if (!salt) {
    salt = randomBytes(SALT_LENGTH).toString('hex');
  }

  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString(
    'hex',
  );

  return {
    hash,
    salt,
  };
}

export function verifyPassword(passwordDto: string, userPassword: string) {
  const storedPasswordArray = userPassword.split(':');

  if (storedPasswordArray.length !== 2) {
    throw invalidCredentialsError;
  }

  const [salt, storedHash] = storedPasswordArray;

  const { hash } = createPasswordHash(passwordDto, salt);

  if (!timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash))) {
    throw invalidCredentialsError;
  }
}

export function createAccessToken(
  userId: string,
  email: string,
  config: TConfig,
): string {
  return jwt.sign({ userId, email }, config.values.JWT_SECRET, {
    expiresIn: config.values.JWT_ACCESS_TOKEN_EXPIRE_TIME,
  });
}

export function createRefreshToken(
  userId: string,
  email: string,
  config: TConfig,
): { refreshToken: string; iv: string } {
  const iv = randomBytes(IV_LENGTH);
  const key = createHash('sha256')
    .update(String(config.values.JWT_REFRESH_TOKEN_SECRET))
    .digest('base64')
    .substr(0, 32);

  const cipher: Cipher = createCipheriv(AES_ALGORITHM, key, iv);

  const tokenData = JSON.stringify({ userId, email });

  let encryptedToken = cipher.update(tokenData, 'utf8', 'hex');
  encryptedToken += cipher.final('hex');

  return {
    refreshToken: encryptedToken,
    iv: iv.toString('hex'),
  };
}

export function decryptRefreshToken(
  encryptedRefreshToken: string,
  iv: string,
  config: TConfig,
): { userId: string; email: string } | undefined {
  const key = createHash('sha256')
    .update(String(config.values.JWT_REFRESH_TOKEN_SECRET))
    .digest('base64')
    .substr(0, 32);
  const decipher: Decipher = createDecipheriv(
    AES_ALGORITHM,
    key,
    Buffer.from(iv, 'hex'),
  );

  let decryptedToken = decipher.update(encryptedRefreshToken, 'hex', 'utf8');
  decryptedToken += decipher.final('utf8');

  try {
    return JSON.parse(decryptedToken) as { userId: string; email: string };
  } catch (error) {
    console.error('Error parsing decrypted token:', error);
    return undefined;
  }
}

export function createAuthJwt(
  userId: string,
  email: string,
  config: TConfig,
): IAuthJwtResponse {
  const refreshTokenData = createRefreshToken(userId, email, config);
  return {
    accessToken: createAccessToken(userId, email, config),
    expireInAccessToken: config.values.JWT_ACCESS_TOKEN_EXPIRE_TIME,
    refreshToken: refreshTokenData.refreshToken,
    csrfToken: refreshTokenData.iv,
    expireInRefreshToken: config.values.JWT_REFRESH_TOKEN_EXPIRE_TIME,
  };
}
