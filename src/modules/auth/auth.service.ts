import { randomBytes, pbkdf2Sync } from 'node:crypto';
import z from 'zod';
import jwt from 'jsonwebtoken';
import { inject } from 'inversify';
import { UserModel } from '@/entities/user.entity';
import { LoginSchema, RegisterSchema } from './auth.schema';
import { TYPES } from '@/constants/types';
import { TConfig } from '@/types/container';
import { ValidationError } from '@/libs/errors/Validation.error';

export class AuthService {
  private static SALT_LENGTH = 16;
  private static ITERATIONS = 1000;
  private static KEY_LEN = 64;
  private static DIGEST = 'sha256';

  constructor(@inject(TYPES.Config) private readonly config: TConfig) {}

  public async register(dto: z.infer<typeof RegisterSchema>) {
    const exists = await UserModel.findOne({ email: dto.email });
    if (exists) throw new Error('User already exists');

    const salt = randomBytes(AuthService.SALT_LENGTH).toString('hex');
    const hash = pbkdf2Sync(
      dto.password,
      salt,
      AuthService.ITERATIONS,
      AuthService.KEY_LEN,
      AuthService.DIGEST,
    ).toString('hex');

    return UserModel.create({
      ...dto,
      password: `${salt}:${hash}`,
    });
  }

  public async login(dto: z.infer<typeof LoginSchema>) {
    const user = await UserModel.findOne({ email: dto.email });
    const invalidCredentialsError = new ValidationError(
      this.constructor.name,
      'Invalid credentials',
    );
    if (!user) {
      throw invalidCredentialsError;
    }

    const [salt, storedHash] = user.password.split(':');
    const hash = pbkdf2Sync(
      dto.password,
      salt,
      AuthService.ITERATIONS,
      AuthService.KEY_LEN,
      AuthService.DIGEST,
    ).toString('hex');

    if (hash !== storedHash) {
      throw invalidCredentialsError;
    }

    return jwt.sign({ userId: user._id }, this.config.values.JWT_SECRET, {
      expiresIn: '1h',
    });
  }
}
