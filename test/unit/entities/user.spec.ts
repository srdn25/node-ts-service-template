import { ZodError } from 'zod';
import { ValidationError } from '../../../src/libs/errors/Validation.error';
import { MongoObjectId } from '../../../src/types';

jest.mock('mongoose', () => {
  const mockPreFn = jest.fn();

  const mockSchema = {
    pre: mockPreFn,
    path: jest.fn().mockImplementation((pathName) => {
      return { pathName };
    }),
  };

  const mockSchemaConstructor = jest.fn().mockImplementation(() => mockSchema);

  mockPreFn.mockImplementation((hook: string, fn: any) => {
    return fn;
  });

  return {
    ...jest.requireActual('mongoose'),
    Schema: mockSchemaConstructor,
    model: jest.fn().mockReturnValue({}),
  };
});

const { UserSchemaZod, userSchema, UserModel } = jest.requireActual(
  '../../../src/entities/user',
);

describe('User Entity', () => {
  const validUserData = {
    _id: new MongoObjectId(),
    name: 'Test User',
    email: 'test@example.com',
    address: 'Test Address',
    password: 'password123',
    phone: '1234567890',
  };

  describe('UserSchemaZod', () => {
    it('should validate a valid user object', () => {
      const originalInstanceOf =
        UserSchemaZod.shape._id.constructor.prototype.check;
      UserSchemaZod.shape._id.constructor.prototype.check = jest
        .fn()
        .mockReturnValue(true);

      const result = UserSchemaZod.safeParse(validUserData);
      expect(result.success).toBe(true);

      UserSchemaZod.shape._id.constructor.prototype.check = originalInstanceOf;
    });

    it('should require name field', () => {
      const originalInstanceOf =
        UserSchemaZod.shape._id.constructor.prototype.check;
      UserSchemaZod.shape._id.constructor.prototype.check = jest
        .fn()
        .mockReturnValue(true);

      const invalidUser = { ...validUserData } as any;
      delete invalidUser.name;

      const result = UserSchemaZod.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('name');
      }

      UserSchemaZod.shape._id.constructor.prototype.check = originalInstanceOf;
    });

    it('should require valid email format', () => {
      const originalInstanceOf =
        UserSchemaZod.shape._id.constructor.prototype.check;
      UserSchemaZod.shape._id.constructor.prototype.check = jest
        .fn()
        .mockReturnValue(true);

      const invalidUser = { ...validUserData, email: 'invalid-email' };

      const result = UserSchemaZod.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email');
      }

      UserSchemaZod.shape._id.constructor.prototype.check = originalInstanceOf;
    });

    it('should require password with minimum length', () => {
      const invalidUser = { ...validUserData, password: 'short' };

      const result = UserSchemaZod.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('password');
      }
    });

    it('should allow optional fields', () => {
      const userWithOptionalFields = {
        ...validUserData,
        mobile: '0987654321',
        services: ['service1', 'service2'],
        emailTemplate: 'template',
      };

      const result = UserSchemaZod.safeParse(userWithOptionalFields);
      expect(result.success).toBe(true);
    });

    it('should validate email field format', () => {
      const validEmailUser = {
        ...validUserData,
        email: 'valid.email+tag@example.co.uk',
      };
      const result = UserSchemaZod.safeParse(validEmailUser);
      expect(result.success).toBe(true);
    });

    it('should validate services as array of strings', () => {
      const validServicesUser = {
        ...validUserData,
        services: ['design', 'development', 'consultation'],
      };
      const result = UserSchemaZod.safeParse(validServicesUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid services format', () => {
      const invalidServicesUser = {
        ...validUserData,
        services: 'not an array',
      } as any;
      const result = UserSchemaZod.safeParse(invalidServicesUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('services');
      }
    });

    it('should handle complex email formats', () => {
      const complexEmailTests = [
        { email: 'email+tag@example.co.uk', valid: true },
        { email: 'firstname.lastname@example.com', valid: true },
        { email: 'email@subdomain.example.com', valid: true },
        { email: 'email@123.123.123.123', valid: false },
        { email: 'email@example-one.com', valid: true },
        { email: '1234567890@example.com', valid: true },
        { email: '_______@example.com', valid: true },
        { email: 'email@example.name', valid: true },
        { email: 'email@example.museum', valid: true },
        { email: 'email@example.co.jp', valid: true },
        { email: 'email@example.web', valid: true },
        { email: 'email@example', valid: false },
        { email: 'email@.com', valid: false },
        { email: 'email@example..com', valid: false },
        { email: 'email@[123.123.123.123]', valid: false },
        { email: '"email"@example.com', valid: false },
        { email: 'email..email@example.com', valid: false },
        { email: 'email@-example.com', valid: false },
      ];

      for (const testCase of complexEmailTests) {
        const user = { ...validUserData, email: testCase.email };
        const result = UserSchemaZod.safeParse(user);

        if (testCase.valid) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      }
    });
  });

  describe('Mongoose Schema', () => {
    it('should define the schema with correct fields', () => {
      const mongoose = require('mongoose');

      expect(mongoose.Schema).toHaveBeenCalled();

      expect(userSchema).toBeDefined();
    });

    it('should setup pre-save hook', () => {
      const mongoose = require('mongoose');
      const schema = mongoose.Schema();

      expect(schema.pre).toHaveBeenCalledWith('save', expect.any(Function));
    });
  });

  describe('Pre-Save Hook', () => {
    it('should pass validation for valid data', () => {
      const mongoose = require('mongoose');
      const schema = mongoose.Schema();
      const preSaveHook = schema.pre.mock.calls[0][1];
      const mockNext = jest.fn();

      const originalParse = UserSchemaZod.parse;
      UserSchemaZod.parse = jest.fn();

      preSaveHook.call(validUserData, mockNext);

      expect(mockNext).toHaveBeenCalledWith();

      UserSchemaZod.parse = originalParse;
    });

    it('should handle ZodError in pre-save hook', () => {
      const mongoose = require('mongoose');
      const schema = mongoose.Schema();
      const preSaveHook = schema.pre.mock.calls[0][1];
      const mockNext = jest.fn();

      const originalParse = UserSchemaZod.parse;
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'undefined',
          path: ['name'],
          message: 'Required',
        },
      ]);

      UserSchemaZod.parse = jest.fn().mockImplementation(() => {
        throw zodError;
      });

      preSaveHook.call(validUserData, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = mockNext.mock.calls[0][0];
      expect(error.name).toBe('User schema pre save');
      expect(error.details).toBe(zodError.errors);

      UserSchemaZod.parse = originalParse;
    });

    it('should handle generic error in pre-save hook', () => {
      const mongoose = require('mongoose');
      const schema = mongoose.Schema();
      const preSaveHook = schema.pre.mock.calls[0][1];
      const mockNext = jest.fn();

      const originalParse = UserSchemaZod.parse;
      UserSchemaZod.parse = jest.fn().mockImplementation(() => {
        throw new Error('Generic error');
      });

      preSaveHook.call(validUserData, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = mockNext.mock.calls[0][0];
      expect(error.name).toBe('User schema pre save');
      expect(error.message).toBe('Validation error on saving user');

      UserSchemaZod.parse = originalParse;
    });
  });

  describe('UserModel', () => {
    it('should create mongoose model with User name', () => {
      expect(UserModel).toBeDefined();

      const { model } = require('mongoose');
      expect(model).toHaveBeenCalledWith('User', expect.any(Object));
    });
  });
});
