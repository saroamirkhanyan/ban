import enum
from explorer import Explorer
from tokenizer import TokenType


class ExpressionType(enum.Enum):
    VALUE = 0
    FUNCTION = 1
    FUNCTION_CALL = 2


class StatementType(enum.Enum):
    DEFINITION = 0
    EXPRESSION = 1


class Parser:

    def __init__(self, tokens):
        self.tokens = tokens
        self.explorer = Explorer(tokens)

    def match(self, type):
        return (not self.explorer.eof()) and self.explorer.peek()[0] == type

    def scan(self, scanning_type):
        if self.explorer.eof():
            return
        token = self.explorer.peek()
        if token[0] == scanning_type:
            self.explorer.consume()
            return token

    def expect(self, expected_type, error_message):
        token = self.scan(expected_type)
        if not token:
            raise Exception(error_message)
        return token

    def scan_value(self):
        return (self.scan(TokenType.IDENTIFIER) or self.scan(TokenType.NUMBER)
                or self.scan(TokenType.TRUE) or self.scan(TokenType.FALSE)
                or self.scan(TokenType.QUOTE))

    def expect_value(self, error_message):
        value = self.scan_value()
        if value:
            return value
        raise Exception(error_message)

    def scan_expression(self):
        values = [self.scan_value()]
        if self.match(TokenType.SEPARATOR):
            while self.scan(TokenType.SEPARATOR):
                values.append(self.scan_value())
        if self.scan(TokenType.PARAMETER):
            #:TODO Move error message to constants
            self.expect(TokenType.FUNCTION, "Expected գործառույթ keyword")
            return (ExpressionType.FUNCTION, values, self.parse())
        elif self.match(TokenType.IDENTIFIER):
            # This means that this is function call
            name_token = values[0]
            args = []
            while True:
                args.append(self.expect_value("Expected Argument"))
                if not self.scan(TokenType.SEPARATOR):
                    break
            return (ExpressionType.FUNCTION_CALL, name_token[1], args)
        return values[0]

    def parse(self):
        body = []
        while not self.explorer.eof() and not self.scan(
                TokenType.END_FUNCTION):
            expression = self.scan_expression()
            as_keyword = self.scan(TokenType.AS)
            if not as_keyword:
                body.append((StatementType.EXPRESSION, expression))
                continue
            identifier = self.scan(TokenType.IDENTIFIER)
            body.append((StatementType.DEFINITION, expression, identifier[1]))
        return body
