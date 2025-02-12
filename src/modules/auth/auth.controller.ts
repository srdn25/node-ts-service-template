import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { TAuthService } from '@/types/container';
import { validate } from '@/middlewares/validate';
import {
  LoginDto,
  loginRequestSchema,
  RegisterDto,
  registerRequestSchema,
} from './auth.schema';
import { catchAsync } from '@/utils';

@injectable()
export class AuthController {
  constructor(@inject(TYPES.AuthService) private authService: TAuthService) {}

  public setupRoutes(router: Router) {
    router.post(
      '/auth/register',
      validate(registerRequestSchema),
      this.register.bind(this),
    );

    router.post(
      '/auth/login',
      validate(loginRequestSchema),
      this.login.bind(this),
    );
  }

  @catchAsync()
  private async register(
    req: Request<unknown, unknown, RegisterDto>,
    res: Response,
  ) {
    const user = await this.authService.register(req.body);
    res.status(201).json(user);
  }

  @catchAsync()
  private async login(req: Request<unknown, unknown, LoginDto>, res: Response) {
    const token = await this.authService.login(req.body);
    res.json({ token });
  }
}
