from constants import DEBUG
from tokenizer import (Tokenizer, print_tokens) 
from parser import Parser
import machine
source = """
    ճշմարիտ որպես սոված
    5 որպես թիվ
    տպիր թիվ և սոված 
"""
tokens = Tokenizer(source).tokenize()
if DEBUG:
    print_tokens(tokens)
program = Parser(tokens).parse()
if DEBUG:
    print(program)
machine.execute(
    machine.ExecutionContext(),
    program
)
