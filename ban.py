from constants import DEBUG
from tokenizer import (Tokenizer, print_tokens)
from parser import Parser
import machine

source = """
    ճշմարիտ որպես սոված
    տպիր սովածը
    բարև չափոցով գործառույթ «
        տպիր բարև 
    » որպես չգիտեմինչ
    չգիտեմինչ սովածը
    չգիտեմինչ սովածը
"""

tokens = Tokenizer(source).tokenize()
if DEBUG:
    print_tokens(tokens)
program = Parser(tokens).parse()
if DEBUG:
    for statement in program:
        print(statement)
machine.execute(machine.ExecutionContext(), program)
