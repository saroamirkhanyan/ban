// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type fn<ReturnType, ParametersTypes extends unknown[] = any> =
  (...params: ParametersTypes) => ReturnType;

export const findTruly =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <ReturnType, ParametersTypes extends any[] = any>
  (...fns: fn<ReturnType, ParametersTypes>[]) =>
    (...args: ParametersTypes) => {
      for (const fn of fns) {
        const result: ReturnType = fn(...args);
        if (result) return result;
      }
      return null;
    };

export const createParserHelpers = <Type>(array: Type[]) => {
  let index = 0;

  const memo = () => {
    const savedIndex = index;
    return function comeBack() {
      index = savedIndex;
    };
  };

  const peek = (offset = 0): Type => array[index + offset];

  const consume = (offset = 1) => {
    index += offset;
    return peek(offset);
  };

  return {
    getIndex: () => index,
    peek,
    consume,
    memo,
    eof: () => !peek(),
  };
};

export class SyntaxError extends Error {
  constructor(message: string, line: number, column: number) {
    super(
      [
        'Կետադրական սխալ՝',
        `${message} ${line}-րդ տողի ${column}-րդ սյունում։`,
      ].join(' ')
    );
  }
}
