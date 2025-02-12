/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function catchAsync() {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<void>>,
  ) {
    const originalMethod = descriptor.value!;
    descriptor.value = function (...args: any[]): Promise<void> {
      return originalMethod.apply(this, args).catch(args[2]);
    };
  };
}
