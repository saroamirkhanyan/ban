import constants
from parser import ExpressionType, StatementType

from tokenizer import TokenType


class ExecutionContext:

    def __init__(self):
        self.variables = {}
        self.functions = {}

def get_value(context, value_token):
    if value_token.type == TokenType.IDENTIFIER:
        return context.variables[value_token.value]
    if value_token.type == TokenType.TRUE:
        return True
    if value_token.type == TokenType.FALSE:
        return False
    if value_token.type == TokenType.NUMBER:
        return float(value_token.value)
    if value_token.type == TokenType.QUOTE:
        return value_token.value
    raise Exception("Unexpected value " + value_token.value)

def define(context, expression, name):
    expression_type = expression[0]
    if expression_type == ExpressionType.VALUE:
        context.variables[name] = get_value(context, expression[1])
    elif expression_type == ExpressionType.FUNCTION:
        _, function_args, function_body = expression
        context.functions[name] = (function_args, function_body)


class NativeLibrary:

    def to_string(value):
        if value == True:
            return constants.TRUE
        elif value == False:
            return constants.FALSE
        return str(value)

    @staticmethod
    def print(context, args):
        printing = []
        for arg in args:
            value = arg.value
            if arg.type == TokenType.IDENTIFIER:
                value = context.variables[arg.value]
            stringified = NativeLibrary.to_string(value)
            printing.append(stringified)
        print(", ".join(x for x in printing))


PRINT = "տպիր"


def call_native_function(context, function_name, args):
    if function_name == PRINT:
        NativeLibrary.print(context, args)


def call(context, function_name, args):
    if function_name in context.functions:
        function_args, function_body = context.functions[function_name]
        function_context = ExecutionContext()
        for i in range(len(args)):
            arg_name = function_args[i]            
            function_context.variables[arg_name] = get_value(context, args[i]) 
        execute(function_context, function_body)
    else:
        call_native_function(context, function_name, args)


def do_expression(context, expression):
    expression_type = expression[0]
    if expression_type == ExpressionType.FUNCTION_CALL:
        call(context, expression[1], expression[2])


def execute(context, program):
    for statement in program:
        statement_type = statement[0]
        if statement_type == StatementType.DEFINITION:
            (_, expression, name) = statement
            define(context, expression, name)
        elif statement_type == StatementType.EXPRESSION:
            do_expression(context, statement[1])