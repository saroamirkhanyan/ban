import constants
from parser import ExpressionType, StatementType

from tokenizer import TokenType


class ExecutionContext:

    def __init__(self, outer=None):
        self.variables = {}
        self.functions = {}
        self.outer = outer


def get_variable(context, name):
    if name in context.variables:
        return context.variables[name]
    return context.outer and get_variable(context.outer, name)


def get_function(context, name):
    if name in context.functions:
        return context.functions[name]
    return context.outer and get_function(context.outer, name)


def get_value(context, value_token):
    if value_token.type == TokenType.IDENTIFIER:
        return get_variable(context, value_token.value)
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
                value = get_variable(context, arg.value)
            stringified = NativeLibrary.to_string(value)
            printing.append(stringified)
        print(", ".join(x for x in printing))


PRINT = "տպիր"


def call_native_function(context, function_name, args):
    if function_name == PRINT:
        NativeLibrary.print(context, args)
    else:
        raise Exception(function_name + " is not a native function")


def call(context, function_name, args):
    function_in_scope = get_function(context, function_name)
    if function_in_scope:
        function_args, function_body = function_in_scope
        function_context = ExecutionContext(outer=context)
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
