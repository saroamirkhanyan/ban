import enum
from constants import (
    LQUOTE, RQUOTE, AS, TRUE, FALSE, FUNCTION, SPACE,
                       NEW_LINE, SEPARATOR, PARAMETER, IDENTIFIER_SYMBOLS,
                       NUMBER_SYMBOLS, COMMENT_START, COMMENT_END, ENDING_SYMBOLS)
from explorer import Explorer


class TokenType(enum.Enum):
    QUOTE = 1
    TRUE = 2
    FALSE = 3
    AS = 4
    FUNCTION = 5
    IDENTIFIER = 6
    NUMBER = 7
    SEPARATOR = 8
    PARAMETER = 9
    END_FUNCTION = 10
    ENDING = 11

class Token:

    def __init__(self, type, value, position):
        self.type = type
        self.value = value
        self.position = position


class Mode(enum.Enum):
    NORMAL = 1
    FUNCTION = 2


def print_tokens(tokens):
    for token in tokens:
        print(str(token.type) + " " + str(token.value))


class Tokenizer(Explorer):

    def __init__(self, source):
        self.current_char_idx = 0
        self.mode = Mode.NORMAL
        self.source = source
        self.position = {
            'line': 0,
            'column': 0
        }

    def create_token(self, type, value):
        return Token(type, value, self.position)

    def scan_space(self):
        if self.peek() == SPACE:
            self.consume()
            return True
        return False

    def scan_new_line(self):
        if self.peek() == NEW_LINE:
            self.consume()
            return True
        return False

    def scan_comment(self):
        if self.peek() == COMMENT_START:
            while self.peek() != COMMENT_END:
                self.consume()
            self.consume()
            return True
        return False

    def scan_quote(self):
        value = ""
        if self.peek() != LQUOTE:
            return
        self.consume()
        while self.peek() != RQUOTE:
            value += self.peek()
            self.consume()
        self.consume()
        return value

    def scan_word(self, SYMBOLS):
        value = ""
        while self.peek() in SYMBOLS:
            value += self.peek()
            self.consume()
        return value

    def tokenize(self):
        tokens = []
        while not self.eof():
            if (self.scan_space() or self.scan_new_line()
                    or self.scan_comment()):
                continue

            if self.mode == Mode.FUNCTION and self.peek() == LQUOTE:
                self.mode = Mode.NORMAL
                self.consume()
                continue
            if self.peek() == RQUOTE:
                tokens.append(self.create_token(TokenType.END_FUNCTION, ""))
                self.consume()
                continue

            quote = self.scan_quote()
            if quote:
                tokens.append(self.create_token(TokenType.QUOTE, quote))
                continue


            word = self.scan_word(IDENTIFIER_SYMBOLS)
            #:TODO Refactor
            if word:
                has_ending = False
                if word[-1] in ENDING_SYMBOLS:
                    word = word[:-1]
                    has_ending = True

                word_types = {
                    TRUE: TokenType.TRUE,
                    FALSE: TokenType.FALSE,
                    SEPARATOR: TokenType.SEPARATOR,
                    PARAMETER: TokenType.PARAMETER,
                    AS: TokenType.AS,
                    FUNCTION: TokenType.FUNCTION,
                }
                type = TokenType.IDENTIFIER
                if word in word_types:
                    type = word_types[word]
                if word == FUNCTION:
                    self.mode = Mode.FUNCTION

                tokens.append(self.create_token(type, word))
                if has_ending:
                    tokens.append(self.create_token(TokenType.ENDING, ""))
                continue
            
            number = self.scan_word(NUMBER_SYMBOLS)
            if number:
                tokens.append(
                    self.create_token(TokenType.NUMBER, number))
                continue
            raise Exception("Unexpected token " + self.peek())
        return tokens
