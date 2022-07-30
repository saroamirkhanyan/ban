import enum
from constants import DEBUG
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
        return (not self.explorer.eof()) and self.explorer.peek().type == type

    def scan(self, scanning_type):
        if self.explorer.eof():
            return
        token = self.explorer.peek()
        if token.type == scanning_type:
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

    def scan_full_value(self, skip_ending):
        value = self.scan_value()
        has_ending = not not self.scan(TokenType.ENDING)
        if skip_ending:
            return value
        return (value, has_ending)

    def expect_value(self, error_message):
        value = self.scan_value()
        if value:
            return value
        raise Exception(error_message)

    def scan_expression(self):
        (value_token,
         value_has_ending) = self.scan_full_value(skip_ending=False)

        values = []

        if self.match(TokenType.SEPARATOR):
            while self.scan(TokenType.SEPARATOR):
                values.append(self.scan_full_value(skip_ending=True))

        if DEBUG:
            print("VALUE TOKEN", value_token.value)

        if value_has_ending:
            if self.match(TokenType.IDENTIFIER):
                callee_token = self.expect(TokenType.IDENTIFIER,
                                           "Excepted function name")
                values.append(value_token)
                return (ExpressionType.FUNCTION_CALL, callee_token.value,
                        values)
        else:
            if self.scan(TokenType.PARAMETER):
                #:TODO Move error message to constants
                self.expect(TokenType.FUNCTION, "Expected գործառույթ keyword")
                values.append(value_token)
                return (ExpressionType.FUNCTION,
                        list(map(lambda token: token.value,
                                 values)), self.parse())
            next_value_token = self.scan_full_value(skip_ending=True)
            if next_value_token:
                values.append(next_value_token)
                while self.scan(TokenType.SEPARATOR):
                    values.append(self.scan_full_value(skip_ending=True))
                return (ExpressionType.FUNCTION_CALL, value_token.value,
                        values)

        return (ExpressionType.VALUE, value_token)

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
            body.append(
                (StatementType.DEFINITION, expression, identifier.value))
        return body
