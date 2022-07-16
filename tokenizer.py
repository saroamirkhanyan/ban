import enum
from constants import (
    LQUOTE,
    RQUOTE,
    AS,
    TRUE,
    FALSE,
    FUNCTION,
    SPACE,
    NEW_LINE,
    SEPARATOR,
    PARAMETER,
    IDENTIFIER_SYMBOLS,
    NUMBER_SYMBOLS,
    COMMENT_START,
    COMMENT_END
)
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

class Mode(enum.Enum):
    NORMAL = 1
    FUNCTION = 2


def print_tokens(tokens):
    for (token_type, value) in tokens:
        print(str(token_type) + " " + value)


class Tokenizer(Explorer):
    def __init__(self, source):
        self.current_char_idx = 0
        self.mode = Mode.NORMAL
        self.source = source

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

    def scan_identifier(self):
        value = ""
        while self.peek() in IDENTIFIER_SYMBOLS:
            value += self.peek()
            self.consume()
        return value

    def scan_number(self):
        value = ""
        while self.peek() in NUMBER_SYMBOLS:
            value += self.peek()
            self.consume()
        return value

    def tokenize(self):
        tokens = []
        while not self.eof():
            if (self.scan_space() or 
                self.scan_new_line() or 
                self.scan_comment()):
                continue
        
            if self.mode == Mode.FUNCTION and self.peek() == LQUOTE: 
                self.mode = Mode.NORMAL
                self.consume()
                continue
            if self.peek() == RQUOTE:
                tokens.append((TokenType.END_FUNCTION, ""))
                self.consume()
                continue

            quote = self.scan_quote()
            if quote:
                tokens.append((TokenType.QUOTE, quote))
                continue
            identifier = self.scan_identifier()
            #:TODO Refactor
            if identifier:
                type = TokenType.IDENTIFIER
                if identifier == TRUE:
                    type = TokenType.TRUE
                elif identifier == FALSE:
                    type = TokenType.FALSE
                elif identifier == SEPARATOR:
                    type = TokenType.SEPARATOR
                elif identifier == PARAMETER:
                    type = TokenType.PARAMETER
                elif identifier == FUNCTION:
                    type = TokenType.FUNCTION
                    self.mode = Mode.FUNCTION
                elif identifier == AS:
                    type = TokenType.AS
                tokens.append((type, identifier))
                continue
            number = self.scan_number()
            if number:
                tokens.append((TokenType.NUMBER, number))
                continue
            raise Exception("Unexpected token " + self.peek())
        return tokens
