import { Router, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/constants/types';
import { TPetsService } from '@/types/container';
import { authMiddleware } from '@/middlewares/auth';
import { validate } from '@/middlewares/validate';
import {
  type CreatePetRequest,
  createPetRequestSchema,
} from './pets.schema';
import { catchAsync } from '@/utils';

@injectable()
export class PetsController {
  constructor(@inject(TYPES.PetsService) private petsService: TPetsService) {}

  public setupRoutes(router: Router) {
    router.post(
      '/pet',
      authMiddleware,
      validate<unknown, unknown, CreatePetRequest['body']>(
        createPetRequestSchema,
      ),
      this.createPet.bind(this),
    );

    router.get('/pet', authMiddleware, this.getPets.bind(this));
  }

  @catchAsync()
  private async createPet(
    req: Request<unknown, unknown, CreatePetRequest['body']>,
    res: Response,
  ) {
    const pet = await this.petsService.createPet(req.user._id, req.body);
    res.status(201).json(pet);
  }

  @catchAsync()
  private async getPets(req: Request, res: Response) {
    const pets = await this.petsService.getPets(req.user._id);
    res.json(pets);
  }
}
