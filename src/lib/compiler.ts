import { STD_MAP } from '../constants';
import {
  Program,
  StatementKind,
  ExpressionKind,
  ExpressionStatement,
  VariableDeclaration,
  Expression,
  Literal,
  FunctionCall,
  Identifier,
  Value,
} from './parser';

const std = `
function ${STD_MAP.call}(functionName, ...args) {
	functionName(...args)
}

function ${STD_MAP.print}(number) {
	console.log(number);
}
function ${STD_MAP.add}(x, offset) {
	return x + offset;
}
function ${STD_MAP.mutliply}(multiple, multiplier) {
	return multiple * multiplier
}
const ${STD_MAP.null} = null
const տպիր = տպել
`;

function compileValue(value: Value): string {
  if (value.kind === ExpressionKind.IDENTIFIER) {
    return (value as Identifier).name;
  }
  if (value.kind === ExpressionKind.INTEGER) {
    return (value as Literal).value;
  }
  throw new Error(`Value with kind ${value.kind} not implemented yet!`);
}

function compileExpression(expression: Expression) {
  if (expression.kind === ExpressionKind.FUNCTION_CALL) {
    const { functionNameIdentifier, args } = expression as FunctionCall;
    return `${functionNameIdentifier.name}(${args
      .map(compileValue)
      .join(',')})`;
  }
  return compileValue(expression as Value);
}

export function compile(program: Program) {
  const chunks: string[] = [];
  chunks.push(std);
  for (const statement of program.body) {
    if (statement.kind === StatementKind.VARIABLE_DECLARATION) {
      const { identifier, init } = statement as VariableDeclaration;
      chunks.push(`const ${identifier.name} = ${compileExpression(init)};\n`);
    } else if (statement.kind === StatementKind.EXPRESSION_STATEMENT) {
      const expressionStatement = statement as ExpressionStatement;
      chunks.push(`${compileExpression(expressionStatement.expression)};\n`);
    }
  }
  return chunks.join('');
}
