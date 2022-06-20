import * as fs from 'fs';
import { tokenize } from './lib/tokenizer';
import { parse } from './lib/parser';
import { compile } from './lib/compiler';

const source = fs.readFileSync(process.argv[2], 'utf-8');

function baneval(source: string) {
  const tokens = tokenize(source);
  const program = parse(tokens);
  const compiledProgram = compile(program);
  eval(compiledProgram);
}

baneval(source);
