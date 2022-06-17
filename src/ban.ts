import * as fs from 'fs';
import { tokenize } from './lib/tokenizer';
import { parse } from './lib/parser';
import { compile } from './lib/compiler';

const source = fs.readFileSync(process.argv[2], 'utf-8');

function baneval(source: string, { isDebug = false }) {
  const tokens = tokenize(source);
  if (isDebug) {
    console.debug('Tokens');
    console.dir(tokens, { depth: Infinity });
  }
  /*
  const program = parse(tokens);
  const compiledProgram = compile(program);
  eval(compiledProgram);
  */
}

baneval(source, {
  isDebug: true
});
