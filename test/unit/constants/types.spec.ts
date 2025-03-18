import { TYPES, StatusCodes } from '../../../src/constants/types';

describe('Constants', () => {
  describe('TYPES', () => {
    it('should define all required symbols', () => {
      expect(TYPES.MongoClient).toBeDefined();
      expect(TYPES.AuthService).toBeDefined();
      expect(TYPES.App).toBeDefined();
      expect(TYPES.Logger).toBeDefined();
      expect(TYPES.Config).toBeDefined();
      expect(TYPES.AuthController).toBeDefined();
      expect(TYPES.HealthController).toBeDefined();
    });

    it('should have unique symbol values', () => {
      const values = Object.values(TYPES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('StatusCodes', () => {
    it('should define common HTTP status codes', () => {
      expect(StatusCodes.OK).toBe(200);
      expect(StatusCodes.CREATED).toBe(201);
      expect(StatusCodes.BAD_REQUEST).toBe(400);
      expect(StatusCodes.UNAUTHORIZED).toBe(401);
      expect(StatusCodes.FORBIDDEN).toBe(403);
      expect(StatusCodes.NOT_FOUND).toBe(404);
      expect(StatusCodes.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });
});
