class Explorer:
    def __init__(self, source):
        self.source = source
        self.current_char_idx = 0
    def peek(self, step = 0):
        return self.source[self.current_char_idx + step]

    def consume(self, step = 1):
        self.current_char_idx += step 

    def eof(self):
        return len(self.source) == self.current_char_idx
