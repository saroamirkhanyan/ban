import { SYMBOLS } from '../constants';
import { createParserHelpers, findTruly, fn, SyntaxError } from './helpers';
import { isKeyword, isArmenian, isNumber, isEnding } from './validators';

export enum TokenType {
  INTEGER,
  KEYWORD,
  IDENTIFIER,
  OPERATOR,
  ENDING,
  PUNCTUATOR,
}

export type Token = {
  type: TokenType;
  value: string;
  line: number;
  column: number;
};

type scanTokenProps = {
  validate: fn<boolean>;
  validateChar?: fn<boolean>;
  tokenType: TokenType;
};

export const tokenize = (source: string) => {
  const { peek, consume, memo } = createParserHelpers<string>(
    source.split('')
  );

  let line = 1;
  let column = 1;

  const createToken = (value: string, type: TokenType) => ({
    type,
    value,
    line,
    column,
  });

  const scan = (when: fn<boolean>) => {
    let value = '';
    while (when(peek())) {
      value += peek();
      consume();
    }
    return value;
  };

  const scanToken = ({
    validate,
    validateChar = validate,
    tokenType,
  }: scanTokenProps) => {
    const comeBack = memo();
    const value = scan(validateChar);
    if (value && validate(value)) {
      return createToken(value, tokenType);
    } else {
      comeBack();
      return null;
    }
  };

  function scanNumber() {
    return scanToken({
      validate: isNumber,
      tokenType: TokenType.INTEGER,
    });
  }

  const scanIdentifier = () =>
    scanToken({
      validate: isArmenian,
      tokenType: TokenType.IDENTIFIER,
    });

  function scanKeyword() {
    return scanToken({
      validate: isKeyword,
      validateChar: isArmenian,
      tokenType: TokenType.KEYWORD,
    });
  }

  function scanEnding() {
    return scanToken({
      validateChar(text: string) {
        return /[-նըի]/.test(text);
      },
      validate(text: string) {
        return isEnding(text);
      },
      tokenType: TokenType.ENDING,
    });
  }

  function scanPunctuator() {
    return scanToken({
      validate(text: string) {
        return text === ',';
      },
      tokenType: TokenType.PUNCTUATOR,
    });
  }

  function skipSpaces() {
    while (peek() === ' ') {
      consume();
    }
  }

  function skipComments() {
    if (peek() !== SYMBOLS.COMMENT_START) return false;
    while (peek() !== SYMBOLS.COMMENT_END) {
      consume();
    }
    consume();
    return true;
  }

  const tokens: Token[] = [];

  while (peek()) {
    skipSpaces();
    if (skipComments()) {
      continue;
    }
    if (peek() === '\n' || peek() === '\r') {
      ++line;
      column = 0;
      consume();
      continue;
    }
    if (!peek()) continue;
    const token = findTruly<Token | null>(
      scanKeyword,
      scanIdentifier,
      scanEnding,
      scanPunctuator,
      scanNumber
    )();
    if (token) {
      column += token.value.length;
      tokens.push(token);
    } else {
      throw new SyntaxError(`Չսպասված ${peek()}`, line, column);
    }
  }
  return tokens;
};
