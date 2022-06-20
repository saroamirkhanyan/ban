import { KEYWORDS, SYMBOLS } from '../constants';
import { createParserHelpers, findTruly, SyntaxError } from './helpers';
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
  callee: Identifier;
  args: Array<Value>;
};

export type Expression = Value | FunctionCall;

export enum StatementKind {
  VARIABLE_DECLARATION,
  CONDITIONAL_STATEMENT,
  FUNCTION_DECLARATION,
  RETURN_STATEMENT,
  EXPRESSION_STATEMENT,
}

export type VariableDeclaration = {
  kind: StatementKind;
  identifier: Identifier;
  init: Expression;
};

export type FunctionDeclraration = {
  kind: StatementKind;
  identifier: Identifier;
  args: Value[];
  // eslint-disable-next-line no-use-before-define
  body: Statement[];
};

export type ReturnStatement = {
  kind: StatementKind,
  value: Value
}

export type ExpressionStatement = {
  kind: StatementKind;
  expression: Expression;
};

export type ConditionalStatement = {
  kind: StatementKind;
  condition: Expression;
  // eslint-disable-next-line no-use-before-define
  body: Statement[];
};

export type Statement =
  | VariableDeclaration
  | ExpressionStatement
  | FunctionDeclraration
  | ReturnStatement
  | ConditionalStatement;

export type Program = {
  body: Statement[];
};

export function parse(tokens: Token[]): Program {
  const { peek, consume, eof } = createParserHelpers<Token>(tokens);

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

  function scanKeyword(name: any) {
    if (peek().type === TokenType.KEYWORD && peek().value === name) {
      consume();
      return true;
    }
    return false;
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
      let callee, args;
      if (nextToken.type === TokenType.ENDING) {
        args = expectArgs();
        callee = expectIdentifier();
      } else {
        callee = expectIdentifier();
        args = expectArgs();
      }
      return {
        kind: ExpressionKind.FUNCTION_CALL,
        callee,
        args,
      };
    }
    return expectValue();
  }

  function scanVariableDeclaration(): VariableDeclaration | null {
    if (
      peek().type !== TokenType.KEYWORD ||
      peek().value !== KEYWORDS.VARIABLE_DECLARATION
    )
      return null;
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

  function scanConditionalStatement(): ConditionalStatement | null {
    if (peek().type !== TokenType.KEYWORD || peek().value !== KEYWORDS.IF) {
      return null;
    }
    consume();
    return {
      kind: StatementKind.CONDITIONAL_STATEMENT,
      condition: expectExpression(),
      body: scanBody(),
    };
  }

  function scanFunctionDeclaration(): FunctionDeclraration | null {
    const possibleDefineFunctionToken = peek();
    if (
      possibleDefineFunctionToken.type !== TokenType.KEYWORD ||
      possibleDefineFunctionToken.value !== KEYWORDS.FUNCTION_DECLARATION
    )
      return null;

    consume();

    const identifier = expectIdentifier();

    let args: Value[] = [];

    if (possibleDefineFunctionToken.line === peek().line) {
      args = expectArgs();
      checkEOF();
      if (
        !peek() ||
        peek().type !== TokenType.KEYWORD ||
        peek().value !== KEYWORDS.WITH_PARAMTERES
      ) {
        const prevToken = peek(-1);
        throw new SyntaxError(
          `Սպասվում էր ${KEYWORDS.WITH_PARAMTERES} բանալի բառը`,
          prevToken.line,
          prevToken.column + prevToken.value.length
        );
      }
      consume();
    }
    const body = scanBody();
    return {
      kind: StatementKind.FUNCTION_DECLARATION,
      identifier,
      args,
      body,
    };
  }

  function scanReturnStatement(): ReturnStatement | null {
    if (scanKeyword(KEYWORDS.RETURN)) {
      const value = expectValue();
      return {
        kind: StatementKind.RETURN_STATEMENT,
        value,
      };
    }
    return null;
  }

  function scanBody() {
    const body: Statement[] = [];
    while (peek()) {
      if (
        peek().type === TokenType.KEYWORD &&
        peek().value === KEYWORDS.END_BLOCK
      ) {
        consume();
        break;
      }
      const statement = findTruly<Statement | null>(
        scanVariableDeclaration,
        scanFunctionDeclaration,
        scanConditionalStatement,
        scanReturnStatement,
      )();
      if (statement) {
        body.push(statement);
        continue;
      }
      const expression = expectExpression();
      body.push({
        kind: StatementKind.EXPRESSION_STATEMENT,
        expression,
      });
    }
    return body;
  }
  return {
    body: scanBody(),
  };
}
