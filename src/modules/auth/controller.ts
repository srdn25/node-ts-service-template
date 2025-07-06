import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { TAuthService } from '@/types/container';
import { validate } from '@/middlewares/validate';
import {
  LoginDto,
  loginRequestSchema,
  refreshAuthTokenSchema,
  RefreshAuthTokenDto,
  RegisterDto,
  registerRequestSchema,
  updateRequestSchema,
} from './schema';
import { catchAsync } from '@/utils';
import { authMiddleware } from '@/middlewares/auth';
import { ValidationError } from '@/libs/errors/Validation.error';

@injectable()
export class AuthController {
  constructor(@inject(TYPES.AuthService) private authService: TAuthService) {}

  public setupRoutes(router: Router) {
    router.post(
      '/auth/register',
      validate(registerRequestSchema),
      this.register.bind(this),
    );

    router.post('/auth/login', validate(loginRequestSchema), this.login.bind(this));

    router.patch(
      '/auth/user/:userId',
      authMiddleware,
      validate(updateRequestSchema),
      this.update.bind(this),
    );

    router.post(
      '/auth/refresh-token',
      validate(refreshAuthTokenSchema),
      this.refresToken.bind(this),
    );
  }

  @catchAsync()
  private async register(
    req: Request<unknown, unknown, RegisterDto>,
    res: Response,
  ) {
    const tokens = await this.authService.register(req.body);
    res.status(201).json(tokens);
  }

  @catchAsync()
  private async login(req: Request<unknown, unknown, LoginDto>, res: Response) {
    const tokens = await this.authService.login(req.body);
    res.json(tokens);
  }

  @catchAsync()
  private async update(
    req: Request<unknown, unknown, LoginDto>,
    res: Response,
  ) {
    const result = await this.authService.update(req.user.email, req.body);
    res.json(result);
  }

  @catchAsync()
  private async refresToken(
    req: Request<unknown, unknown, RefreshAuthTokenDto['body'], unknown>,
    res: Response,
  ) {
    const csrfToken = req.header('x-csrf-token');

    if (!csrfToken) {
      throw new ValidationError(this.constructor.name, 'Invalid CSRF token');
    }

    const tokens = await this.authService.refreshAuthToken(req.body, csrfToken);
    res.json(tokens);
  }
}
