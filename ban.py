from constants import DEBUG
import sys
from tokenizer import (Tokenizer, print_tokens)
from parser import Parser
import sys
import machine
source_file = open(sys.argv[1], "r")
source = source_file.read() 
source_file.close()
tokens = Tokenizer(source).tokenize()
if DEBUG:
    print_tokens(tokens)
program = Parser(tokens).parse()
if DEBUG:
    for statement in program:
        print(statement)
machine.execute(machine.ExecutionContext(), program)
