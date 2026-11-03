import assert from 'node:assert/strict';
import test from 'node:test';
import { acceptsLocalCode, compilerAvailable, runCustomCode } from '../backend/src/custom-code/runner.js';
import { compileSource } from '../backend/src/custom-code/compile-source.js';

const custom = body => `void sort(int a[], int n) {\n${body}\n}`;

test('custom code accepts loopback and rejects external or rebinding origins', () => {
  const request = { headers: { host: 'localhost:3000', origin: 'http://localhost:3000' },
    socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' } };
  assert.equal(acceptsLocalCode(request), true);
  assert.equal(acceptsLocalCode({ ...request, headers: { ...request.headers, origin: 'https://example.com' } }), false);
  assert.equal(acceptsLocalCode({ ...request, headers: { host: 'example.com:3000' } }), false);
  assert.equal(acceptsLocalCode({ ...request, socket: { ...request.socket, remoteAddress: '192.168.0.2' } }), false);
});

test('custom code cannot emit a preprocessor directive, raw pointer operation or arbitrary call', () => {
  for (const body of ['#include <stdio.h>', 'int *p = a;', 'system(0);', 'a[0] = open(0);', 'n = 100;', 'int i; a[i] = 2;']) {
    assert.throws(() => compileSource(custom(body)), /第 \d+ 行/);
  }
});

test('Watcom compiles the edited code in both languages and returns real source-mapped writes',
  { skip: !(await compilerAvailable()) }, async () => {
    const source = custom('for (int i = 0; i < n; i++) {\n  a[i] = a[i] * -2;\n}');
    for (const language of ['c', 'cpp']) {
      const run = await runCustomCode({ language, source, array: [5, 1, -4] });
      assert.deepEqual(run.result, [-10, -2, 8]);
      const writes = run.steps.filter(step => step.event === 'write');
      assert.deepEqual(writes.map(step => step.array), [[-10, 1, -4], [-10, -2, -4], [-10, -2, 8]]);
      assert.deepEqual(writes.map(step => step.lineId), ['3', '3', '3']);
      assert.equal(run.sourceLines[2].text, '  a[i] = a[i] * -2;');
    }
  });

test('Watcom runtime reports invalid indexing, overflow and nonterminating loops',
  { skip: !(await compilerAvailable('c')) }, async () => {
    for (const [body, expected] of [
      ['a[n] = 0;', /第 2 行：数组下标越界/],
      ['int value = 2147483647 + 1;', /第 2 行：运算结果超出/],
      ['a[0] = 1 / 0;', /第 2 行：除数不能为零/],
      ['while (1) {}', /第 2 行：超过执行步数限制/],
    ]) {
      await assert.rejects(runCustomCode({ language: 'c', array: [1], source: custom(body) }), expected);
    }
  });
