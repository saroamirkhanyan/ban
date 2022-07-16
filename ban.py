from constants import DEBUG
from tokenizer import (Tokenizer, print_tokens) 
from parser import Parser

source = """
    «բարև» որպես անուն
    ճշմարիտ որպես սոված
    ուրիշ չափոցով գործառույթ «
        տպիր քեզ
    » որպես վարձ
"""
tokens = Tokenizer(source).tokenize()
if DEBUG:
    print_tokens(tokens)
program = Parser(tokens).parse()
if DEBUG:
    print(program)
