// Parse a small C/C++ subset and generate native code with checked array access.
// Only tokens consumed by the grammar below can appear in the generated program.
const operators = [
  ['||'], ['&&'], ['==', '!='], ['<', '<=', '>', '>='], ['+', '-'], ['*', '/', '%'],
];
const checked = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'divide', '%': 'remainder' };
const reserved = new Set(('a n sort auto bool break case catch char class const continue default delete do double else enum ' +
  'explicit export extern false float for friend goto if inline int long mutable namespace new operator private protected ' +
  'public register return short signed sizeof static struct switch template this throw true try typedef typename union ' +
  'unsigned using virtual void volatile wchar_t while').split(' '));

export function compileSource(source) {
  source = source.replace(/\r\n?/g, '\n');
  const lines = source.split('\n');
  const tokens = [];
  const pattern = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|\s+|[A-Za-z_][A-Za-z_0-9]*|\d+|\+\+|--|<=|>=|==|!=|&&|\|\||[+\-*/%!=<>{}()[\],;]/gy;
  let line = 1;
  while (pattern.lastIndex < source.length) {
    const match = pattern.exec(source);
    if (!match) throw new Error(`第 ${line} 行：有不支持的字符或未闭合的注释。`);
    const value = match[0];
    if (!/^(?:\s|\/\/|\/\*)/.test(value)) tokens.push({ value, line });
    line += (value.match(/\n/g) || []).length;
  }
  tokens.push({ value: '', line });
  let position = 0;
  let depth = 0;
  let loopDepth = 0;
  const scopes = [new Set(['n'])];
  const peek = () => tokens[position];
  const fail = message => { throw new Error(`第 ${peek().line} 行：${message}`); };
  function accept(value) {
    if (peek().value !== value) return false;
    position++;
    return true;
  }
  const expect = value => { if (!accept(value)) fail(`需要 “${value}”。`); };
  const scoped = fn => {
    scopes.push(new Set());
    try { return fn(); } finally { scopes.pop(); }
  };
  function nested(fn) {
    if (++depth > 48) fail('代码嵌套过深。');
    try { return fn(); } finally { depth--; }
  }
  function identifier() {
    const name = peek().value;
    if (!/^[A-Za-z_][A-Za-z_0-9]*$/.test(name) || name.length > 32) fail('需要有效的变量名。');
    position++;
    return name;
  }
  function variable(name) {
    if (!scopes.some(scope => scope.has(name))) fail(`变量 ${name} 未声明。`);
    return name === 'n' ? 'n' : 'v_' + name;
  }
  function primary() {
    if (accept('(')) {
      const value = nested(expression);
      expect(')');
      return '(' + value + ')';
    }
    const value = peek().value;
    if (/^\d+$/.test(value)) {
      if (value.length > 10 || Number(value) > 2147483647 || /^0\d/.test(value)) fail('请使用 32 位十进制整数。');
      position++;
      return value;
    }
    const name = identifier();
    if (name === 'a') {
      expect('[');
      const index = nested(expression);
      expect(']');
      return `get(${index})`;
    }
    return variable(name);
  }
  function unary() {
    if (accept('!')) return `(!${nested(unary)})`;
    if (accept('-')) {
      if (accept('2147483648')) return '(-2147483647 - 1)';
      return `sub(0, ${nested(unary)})`;
    }
    if (accept('+')) return nested(unary);
    return primary();
  }
  function expression(level = 0) {
    if (level === operators.length) return unary();
    let value = expression(level + 1);
    while (operators[level].includes(peek().value)) {
      const op = tokens[position++].value;
      const right = expression(level + 1);
      value = Object.hasOwn(checked, op) ? `${checked[op]}(${value}, ${right})` : `(${value} ${op} ${right})`;
    }
    return value;
  }
  function declaration(row) {
    const name = identifier();
    if (reserved.has(name) || scopes.some(scope => scope.has(name))) fail(`变量名 ${name} 不可重复或保留。`);
    expect('=');
    const initial = expression();
    scopes.at(-1).add(name);
    return `int v_${name} = (tick(${row}), (${initial}))`;
  }
  function assignment(lineNumber) {
    const name = identifier();
    if (name === 'a') {
      expect('[');
      const index = expression();
      expect(']');
      expect('=');
      return `put(${index}, ${expression()}, ${lineNumber})`;
    }
    if (name === 'n') fail('数组长度 n 只读。');
    const target = variable(name);
    if (accept('++')) return `${target} = add(${target}, 1)`;
    if (accept('--')) return `${target} = sub(${target}, 1)`;
    expect('=');
    return `${target} = ${expression()}`;
  }
  function block() {
    expect('{');
    return nested(() => scoped(() => {
      const statements = [];
      while (!accept('}')) statements.push(statement());
      return `{\n${statements.join('\n')}\n}`;
    }));
  }
  function condition() {
    expect('(');
    const value = expression();
    expect(')');
    return value;
  }
  function loopBody() {
    loopDepth++;
    try { return block(); } finally { loopDepth--; }
  }
  function statement() {
    const row = peek().line;
    const tick = `tick(${row});`;
    if (accept('if')) {
      const value = condition();
      const yes = block();
      const no = accept('else') ? ` else ${block()}` : '';
      return `${tick} if (observe(${value}, ${row})) ${yes}${no}`;
    }
    if (accept('while')) return `while ((tick(${row}), (${condition()}))) ${loopBody()}`;
    if (accept('for')) return scoped(() => {
      expect('(');
      const init = accept('int') ? declaration(row) : assignment(row);
      expect(';');
      const test = expression();
      expect(';');
      const update = assignment(row);
      expect(')');
      return `{ ${tick} ${init}; for (; (tick(${row}), (${test})); tick(${row}), ${update}) ${loopBody()} }`;
    });
    for (const control of ['break', 'continue', 'return']) {
      if (!accept(control)) continue;
      if (control !== 'return' && !loopDepth) fail(`${control} 只能用于循环内。`);
      expect(';');
      return `${tick} ${control};`;
    }
    if (accept('int')) {
      const value = declaration(row);
      expect(';');
      return value + ';';
    }
    const value = assignment(row);
    expect(';');
    return `${tick} ${value};`;
  }

  for (const value of ['void', 'sort', '(', 'int', 'a', '[', ']', ',', 'int', 'n', ')']) expect(value);
  const body = block();
  if (peek().value !== '') fail('只支持一个 void sort(int a[], int n) 函数。');
  return { lines, body, firstLine: tokens[0].line, lastLine: tokens[position - 1].line };
}
