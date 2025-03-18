import { inject } from 'inversify';
import { UserModel } from '@/entities/user';
import {
  LoginDto,
  RefreshAuthTokenDto,
  RegisterDto,
  UpdateDto,
} from './schema';
import { StatusCodes, TYPES } from '@/constants/types';
import { TConfig, TLogger } from '@/types/container';
import { ApplicationError } from '@/libs/errors/Application.error';
import { DatabaseErrorCatch } from '@/utils';
import {
  createAuthJwt,
  createPasswordHash,
  decryptRefreshToken,
  invalidCredentialsError,
  verifyPassword,
} from '@/utils/auth';
import { IAuthJwtResponse, MongoObjectId } from '@/types';

export class AuthService {
  constructor(
    @inject(TYPES.Config) private readonly config: TConfig,
    @inject(TYPES.Logger) private readonly logger: TLogger,
  ) {}

  @DatabaseErrorCatch
  public async register(dto: RegisterDto) {
    const where = { email: dto.email };

    const exists = await UserModel.findOne(where);
    if (exists) {
      throw new ApplicationError(
        this.constructor.name,
        'User already exists',
        StatusCodes.BAD_REQUEST,
        where,
      );
    }

    const { hash, salt } = createPasswordHash(dto.password);

    const user = await UserModel.create({
      ...dto,
      password: `${salt}:${hash}`,
    });

    return createAuthJwt(user._id.toString(), user.email, this.config);
  }

  @DatabaseErrorCatch
  public async login(dto: LoginDto) {
    let tokens: IAuthJwtResponse | null = null;
    const user = await UserModel.findOne({ email: dto.email });

    if (!user) {
      throw invalidCredentialsError;
    }

    verifyPassword(dto.password, user.password);

    try {
      tokens = createAuthJwt(user._id.toString(), user.email, this.config);
    } catch (error) {
      throw new ApplicationError(
        this.constructor.name,
        'Cannot create auth tokens',
        StatusCodes.INTERNAL_SERVER_ERROR,
        { error },
      );
    }

    return tokens;
  }

  @DatabaseErrorCatch
  public async update(email: string, dto: UpdateDto) {
    const result = await UserModel.findOneAndUpdate({ email }, dto, {
      new: true,
    });

    if (!result) {
      throw new ApplicationError(
        this.constructor.name,
        'User for update not found',
        StatusCodes.BAD_REQUEST,
      );
    }

    return result;
  }

  /**
   * Considerations:
   *  - add refresh token to database for be able revoke session
   */
  @DatabaseErrorCatch
  public async refreshAuthToken(
    dto: RefreshAuthTokenDto['body'],
    csrfToken: string,
  ) {
    const data = decryptRefreshToken(dto.refreshToken, csrfToken, this.config);

    if (!data?.email || !data.userId) {
      throw new ApplicationError(
        this.constructor.name,
        'Invalid refresh token',
        StatusCodes.BAD_REQUEST,
      );
    }

    const user = await UserModel.findOne({
      email: data.email,
      _id: new MongoObjectId(data.userId),
    });

    if (!user) {
      throw invalidCredentialsError;
    }

    return createAuthJwt(user._id.toString(), user.email, this.config);
  }
}
