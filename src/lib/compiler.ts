import { STD_MAP } from '../constants';
import {
  Program,
  StatementKind,
  ExpressionKind,
  ExpressionStatement,
  ConditionalStatement,
  VariableDeclaration,
  Expression,
  Literal,
  FunctionCall,
  Identifier,
  Value,
  Statement,
  FunctionDeclraration,
  ReturnStatement,
} from './parser';

type StatementsCompilerMap = {
  [key: string]: (statement: Statement) => string;
};

const std = `
function ${STD_MAP.call}(functionName, ...args) {
	functionName(...args);
}
function ${STD_MAP.print}(number) {
	console.log(number);
}
function ${STD_MAP.add}(x, offset) {
	return x + offset;
}
function ${STD_MAP.difference}(x, offset) {
  return x - offset
}
function ${STD_MAP.mutliply}(multiple, multiplier) {
	return multiple * multiplier;
}
function ${STD_MAP.equal}(a, b) {
	return a === b;
}
const ${STD_MAP.null} = null;
const տպիր = տպել;
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

function compileArgs(args: Value[]) {
  return args.map(compileValue).join(', ');
}

function compileExpression(expression: Expression) {
  if (expression.kind === ExpressionKind.FUNCTION_CALL) {
    const { callee, args } = expression as FunctionCall;
    return `${callee.name}(${compileArgs(args)})`;
  }
  return compileValue(expression as Value);
}

function compileVariableDeclaration(statement: Statement): string {
  const { identifier, init } = statement as VariableDeclaration;
  return `const ${identifier.name} = ${compileExpression(init)};\n`;
}

function compileExpressionStatement(statement: Statement): string {
  const expressionStatement = statement as ExpressionStatement;
  return `${compileExpression(expressionStatement.expression)};\n`;
}

function compileFunctionDeclaration(statement: Statement): string {
  const { identifier, args, body } = statement as FunctionDeclraration;
  return (
    `function ${identifier.name}(${compileArgs(args)}){\n` +
    compileBody(body) +
    '};\n'
  );
}

function compileReturnStatement(statement: Statement): string {
  const { expression } = statement as ReturnStatement;
  return `return ${compileExpression(expression)}\n`;
}

function compileConditionalStatement(statement: Statement): string {
  const { condition, body } = statement as ConditionalStatement;
  return `if (${compileExpression(condition)}){\n` + compileBody(body) + '};\n';
}

const statementsCompilerMap: StatementsCompilerMap = {
  [StatementKind.VARIABLE_DECLARATION]: compileVariableDeclaration,
  [StatementKind.EXPRESSION_STATEMENT]: compileExpressionStatement,
  [StatementKind.FUNCTION_DECLARATION]: compileFunctionDeclaration,
  [StatementKind.RETURN_STATEMENT]: compileReturnStatement,
  [StatementKind.CONDITIONAL_STATEMENT]: compileConditionalStatement,
};

function compileBody(body: Statement[]) {
  const chunks = [];
  for (const statement of body) {
    const statementCompiler = statementsCompilerMap[statement.kind];
    if (statementCompiler) {
      chunks.push(statementCompiler(statement));
    } else {
      throw new Error(`Unexpected StatementKind ${statement.kind}`);
    }
  }
  return chunks.join('');
}

export function compile(program: Program) {
  const chunks: string[] = [];
  chunks.push(std);
  chunks.push(compileBody(program.body));
  return chunks.join('');
}
