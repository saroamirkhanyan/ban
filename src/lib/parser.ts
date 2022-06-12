import { KEYWORDS, SYMBOLS } from '../constants';
import { createParserHelpers, SyntaxError } from './helpers';
import { Token, TokenType } from './tokenizer';

export enum ExpressionKind {
  IDENTIFIER,
  INTEGER,
  FUNCTION_CALL,
}

export type Identifier = {
  kind: ExpressionKind;
  name: string;
  hasEnding: boolean;
};

export type Literal = {
  kind: ExpressionKind;
  value: string;
  hasEnding: boolean;
};

export type Value = Literal | Identifier;

export type FunctionCall = {
  kind: ExpressionKind;
  functionNameIdentifier: Identifier;
  args: Array<Value>;
};

export type Expression = Value | FunctionCall;

export enum StatementKind {
  VARIABLE_DECLARATION,
  EXPRESSION_STATEMENT,
}

export type VariableDeclaration = {
  kind: StatementKind;
  identifier: Identifier;
  init: Expression;
};

export type ExpressionStatement = {
  kind: StatementKind;
  expression: Expression;
};

export type Statement = VariableDeclaration | ExpressionStatement;

export type Program = {
  body: Statement[];
};

export function parse(tokens: Token[]): Program {
  const { peek, consume, eof } = createParserHelpers<Token>(tokens);
  const body: Statement[] = [];

  function checkEOF() {
    if (eof()) {
      const lastToken = peek(-1);
      const column = lastToken.column + lastToken.value.length;
      throw new SyntaxError('Անսպասելի ավարտ', lastToken.line, column);
    }
  }

  function expectToken(expectedTokenType: TokenType, errorMessage: string) {
    checkEOF();
    const token = peek();
    if (token.type !== expectedTokenType) {
      throw new SyntaxError(errorMessage, token.line, token.column);
    }
    consume();
    const hasEnding = !!peek() && peek().type === TokenType.ENDING;
    if (hasEnding) {
      consume();
    }
    return {
      token,
      hasEnding,
    };
  }

  function expectIdentifier(): Identifier {
    const { token, hasEnding } = expectToken(
      TokenType.IDENTIFIER,
      'Սպասվում է նույնացուցիչ'
    );
    return {
      kind: ExpressionKind.IDENTIFIER,
      name: token.value,
      hasEnding,
    };
  }

  function expectLiteral(): Literal {
    const { token, hasEnding } = expectToken(
      TokenType.INTEGER,
      'Սպասվում էր բառացի արժեք'
    );
    return {
      kind: ExpressionKind.INTEGER,
      value: token.value,
      hasEnding,
    };
  }

  function expectValue(): Value {
    checkEOF();
    const token = peek();
    if (token.type === TokenType.IDENTIFIER) return expectIdentifier();
    return expectLiteral();
  }

  function expectArgs(): Value[] {
    const args: Value[] = [];
    let currentArg = expectValue();
    while (true) {
      args.push(currentArg);
      if (!peek() || peek().value !== 'և') {
        break;
      }
      consume();
      currentArg = expectValue();
    }
    return args;
  }

  function expectExpression(): Expression {
    checkEOF();
    const token = peek();
    const nextToken = peek(1);

    if (nextToken && nextToken.line === token.line) {
      let functionNameIdentifier, args;
      if (nextToken.type === TokenType.ENDING) {
        args = expectArgs();
        functionNameIdentifier = expectIdentifier();
      } else {
        functionNameIdentifier = expectIdentifier();
        args = expectArgs();
      }
      return {
        kind: ExpressionKind.FUNCTION_CALL,
        functionNameIdentifier,
        args,
      };
    }
    return expectValue();
  }

  function scanVariableDeclaration(): VariableDeclaration | null {
    if (peek().value !== KEYWORDS.VARIABLE_DECLARATION) return null;
    consume();
    const identifier = expectIdentifier();
    const potentialComma = peek();
    if (
      potentialComma.type !== TokenType.PUNCTUATOR &&
      potentialComma.value !== SYMBOLS.COMMA
    ) {
      throw new SyntaxError(
        'Սպասվում է ստորակետ',
        potentialComma.line,
        potentialComma.column
      );
    }
    consume();
    const potentialAsKeyword = peek();
    if (
      potentialAsKeyword.type !== TokenType.KEYWORD ||
      potentialAsKeyword.value !== KEYWORDS.AS
    ) {
      throw new SyntaxError(
        `Սպասվում է '${KEYWORDS.AS}'`,
        potentialComma.line,
        potentialComma.column
      );
    }
    consume();
    const init = expectExpression();
    return {
      kind: StatementKind.VARIABLE_DECLARATION,
      identifier,
      init,
    };
  }

  while (peek()) {
    const variableDeclaration: VariableDeclaration | null =
      scanVariableDeclaration();
    if (variableDeclaration) {
      body.push(variableDeclaration);
    } else {
      const expression = expectExpression();
      body.push({
        kind: StatementKind.EXPRESSION_STATEMENT,
        expression,
      });
    }
  }
  return {
    body,
  };
}
