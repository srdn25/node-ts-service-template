import type { TMongoObjectId } from '@/types';
import { inject, injectable } from 'inversify';
import { PetModel } from '@/entities/pet.entity';
import { TYPES } from '@/constants/types';
import type { TConfig } from '@/types/container';
import type { CreatePetDto } from './pets.schema';

@injectable()
export class PetsService {
  constructor(@inject(TYPES.Config) private readonly config: TConfig) {}

  public async createPet(userId: TMongoObjectId, dto: CreatePetDto) {
    const pet = await PetModel.create({ ...dto, ownerId: userId });
    return pet;
  }

  public async getPets(userId: TMongoObjectId) {
    return PetModel.find({ ownerId: userId });
  }
}
