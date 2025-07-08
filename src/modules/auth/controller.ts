import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
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
  UpdateDto
} from './schema';
import { authMiddleware } from '@/middlewares/auth';
import { ValidationError } from '@/libs/errors/Validation.error';

@injectable()
export class AuthController {
  constructor(@inject(TYPES.AuthService) private authService: TAuthService) {}

  public setupRoutes(app: FastifyInstance) {
    app.post<{ Body: RegisterDto }>(
      '/auth/register',
      { preHandler: validate(registerRequestSchema) },
      this.register.bind(this),
    );

    app.post<{ Body: LoginDto }>(
      '/auth/login',
      { preHandler: validate(loginRequestSchema) },
      this.login.bind(this),
    );

    app.patch<{ Body: UpdateDto }>(
      '/auth/user/:userId',
      { preHandler: [authMiddleware, validate(updateRequestSchema)] },
      this.update.bind(this),
    );

    app.post<{ Body: RefreshAuthTokenDto['body'] }>(
      '/auth/refresh-token',
      { preHandler: validate(refreshAuthTokenSchema) },
      this.refresToken.bind(this),
    );
  }

  private async register(
    req: FastifyRequest<{ Body: RegisterDto }>,
    reply: FastifyReply,
  ) {
    const tokens = await this.authService.register(req.body);
    reply.status(201).send(tokens);
  }

  private async login(
    req: FastifyRequest<{ Body: LoginDto }>,
    reply: FastifyReply,
  ) {
    const tokens = await this.authService.login(req.body);
    reply.send(tokens);
  }

  private async update(
    req: FastifyRequest<{ Body: UpdateDto }>,
    reply: FastifyReply,
  ) {
    const result = await this.authService.update(req.user!.email, req.body);
    reply.send(result);
  }

  private async refresToken(
    req: FastifyRequest<{ Body: RefreshAuthTokenDto['body'] }>,
    reply: FastifyReply,
  ) {
    const csrfToken = req.headers['x-csrf-token'] as string;

    if (!csrfToken) {
      throw new ValidationError(this.constructor.name, 'Invalid CSRF token');
    }

    const tokens = await this.authService.refreshAuthToken(req.body, csrfToken);
    reply.send(tokens);
  }
}
