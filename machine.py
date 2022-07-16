import constants
from parser import ExpressionType, StatementType

from tokenizer import TokenType

class ExecutionContext:
    def __init__(self):
        self.memory = {}

def define(context, statement):
    (_, value_token, name) = statement
    if value_token[0] == TokenType.TRUE:
       value = True 
    elif value_token[1] == TokenType.FALSE:
        value = False
    elif value_token[0] == TokenType.NUMBER:
        value = float(value_token[1])
    context.memory[name] = value
    pass

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
        for (arg_type, arg_value) in args:
            if arg_type == TokenType.IDENTIFIER:
                memory_value = context.memory[arg_value]
                stringified = NativeLibrary.to_string(memory_value)
                printing.append(stringified)
        print(", ".join(x for x in printing))
PRINT = "տպիր"

def call_native_function(context, function_name, args):
    if function_name == PRINT:
        NativeLibrary.print(context, args)

def call(context, function_name, args):
    if function_name in context.memory:
        print(function_name, args)
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
            define(context, statement)
        elif statement_type == StatementType.EXPRESSION:
            do_expression(context, statement[1])
