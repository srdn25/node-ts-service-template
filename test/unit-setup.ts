/// <reference types="jest" />

jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');

  const connect = jest.fn();
  const connection = {
    once: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  };

  const model = jest.fn().mockImplementation((name: string) => {
    return {
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockReturnThis(),
      findOneAndUpdate: jest.fn().mockReturnThis(),
      create: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      updateOne: jest.fn().mockReturnThis(),
      deleteOne: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
      modelName: name,
      schema: {
        pre: jest.fn(),
      },
    };
  });

  const ObjectId = function (v?: any) {
    return v || 'someObjectId';
  } as unknown as typeof originalModule.Types.ObjectId;

  ObjectId.isValid = jest.fn().mockReturnValue(true);

  return {
    ...originalModule,
    connect,
    connection,
    model,
    Types: {
      ...originalModule.Types,
      ObjectId,
    },
  };
});

afterAll(() => {
  jest.clearAllTimers();
}); 