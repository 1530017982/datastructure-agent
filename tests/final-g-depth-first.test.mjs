import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import * as preorder from '../shared/algorithms/final/g/binary-tree-preorder.js';
import * as inorder from '../shared/algorithms/final/g/binary-tree-inorder.js';
import * as postorder from '../shared/algorithms/final/g/binary-tree-postorder.js';

const traversals = [
  { mode: 'preorder', module: preorder, generate: preorder.generateBinaryTreePreorderSteps, expected: ['A', 'B', 'D', 'C'] },
  { mode: 'inorder', module: inorder, generate: inorder.generateBinaryTreeInorderSteps, expected: ['B', 'D', 'A', 'C'] },
  { mode: 'postorder', module: postorder, generate: postorder.generateBinaryTreePostorderSteps, expected: ['D', 'B', 'C', 'A'] },
];

function reference(input, mode) {
  const nodes = new Map(input.nodes.map(node => [node.id, node]));
  const output = [];
  function walk(id, level) {
    if (id === null || id === undefined) return;
    const node = nodes.get(id);
    if (mode === 'preorder') output.push({ id, level });
    walk(node.left, level + 1);
    if (mode === 'inorder') output.push({ id, level });
    walk(node.right, level + 1);
    if (mode === 'postorder') output.push({ id, level });
  }
  walk(input.root, 1);
  return output;
}

function skewed(side) {
  return {
    root: '0',
    nodes: Array.from({ length: 64 }, (_, i) => ({
      id: String(i), [side]: i === 63 ? null : String(i + 1),
    })),
  };
}

function generatedTrees() {
  let seed = 20261118;
  function random(max) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % max;
  }
  return Array.from({ length: 100 }, () => {
    const count = random(65);
    const nodes = Array.from({ length: count }, (_, i) => ({ id: String(i), left: null, right: null }));
    const slots = count ? [{ parent: nodes[0], side: 'left' }, { parent: nodes[0], side: 'right' }] : [];
    for (let i = 1; i < count; i++) {
      const slot = slots.splice(random(slots.length), 1)[0];
      slot.parent[slot.side] = nodes[i].id;
      slots.push({ parent: nodes[i], side: 'left' }, { parent: nodes[i], side: 'right' });
    }
    return { root: count ? '0' : null, nodes: nodes.reverse() };
  });
}

const inputs = [
  preorder.DEFAULT_INPUT, { root: null, nodes: [] }, { root: 'A', nodes: [{ id: 'A' }] },
  skewed('left'), skewed('right'), ...generatedTrees(),
];

for (const { mode, module, generate, expected } of traversals) {
  test(`${mode} records visits, child returns, source lines and active recursion frames`, () => {
    const trace = generate(module.DEFAULT_INPUT);
    assert.deepEqual(trace.result, expected);
    assert.deepEqual(trace.steps.filter(step => step.event === 'visit').map(step => step.variables.currentNode), expected);
    assert.deepEqual(trace.steps.filter(step => step.event === 'enter').map(step => step.variables.currentNode), ['A', 'B', 'D', 'C']);
    assert.deepEqual(trace.steps.filter(step => step.event === 'return').map(step => step.variables.currentNode), ['D', 'B', 'C', 'A']);
    const sourceIds = new Set(trace.sourceLines.map(line => line.lineId));
    assert.equal(sourceIds.size, trace.sourceLines.length);
    trace.steps.forEach((step, index) => {
      assert.equal(step.stepIndex, index);
      assert.equal(step.algorithm, `binary-tree-${mode}`);
      assert.equal(step.sourceVersion, module.SOURCE_VERSION);
      assert.ok(sourceIds.has(step.lineId));
      assert.equal(step.done, index === trace.steps.length - 1);
      assert.deepEqual(step.result, step.done ? expected : null);
      assert.equal(step.variables.currentNode, step.variables.stack.at(-1)?.id ?? null);
      assert.deepEqual(step.variables.stack.map(frame => frame.level), step.variables.stack.map((_, i) => i + 1));
    });
    const atD = trace.steps.find(step => step.event === 'enter' && step.variables.currentNode === 'D');
    assert.deepEqual(atD.variables.stack.map(frame => frame.id), ['A', 'B', 'D']);
    const resumeB = trace.steps.find(step => step.event === 'resume' && step.variables.currentNode === 'B');
    assert.equal(resumeB.lineId, 'resume-right');
    assert.equal(resumeB.variables.childNode, 'D');
    assert.deepEqual(resumeB.variables.stack.map(frame => frame.id), ['A', 'B']);
    assert.deepEqual(trace.steps.at(-1).variables.stack, []);
    assert.equal(trace.steps.at(-1).variables.currentNode, null);
    if (mode === 'postorder') {
      assert.ok(atD.stepIndex < trace.steps.find(step => step.event === 'visit').stepIndex);
      assert.equal(trace.steps.filter(step => step.event === 'visit').at(-1).variables.currentNode, 'A');
    }
  });

  test(`${mode} handles empty, single-node, both 64-node chains and generated trees`, () => {
    for (const input of inputs) {
      const expectedVisits = reference(input, mode);
      const trace = generate(input);
      assert.deepEqual(trace.result, expectedVisits.map(entry => entry.id));
      assert.deepEqual(trace.steps.filter(step => step.event === 'visit').map(step => ({
        id: step.variables.currentNode, level: step.variables.level,
      })), expectedVisits);
    }
    assert.deepEqual(generate(inputs[1]).steps.map(step => step.event), ['init', 'done']);
    assert.deepEqual(generate(inputs[2]).steps.map(step => step.event), ['init', 'enter', 'visit', 'return', 'done']);
  });

  test(`${mode} validates trees and keeps input and historical frames independent`, () => {
    const badInputs = [
      null, {}, { root: null, nodes: [{ id: 'A' }] }, { root: 'A', nodes: [] },
      { root: 'A', nodes: [{ id: '' }] },
      { root: 'A', nodes: [{ id: 'A' }, { id: 'A' }] },
      { root: 'A', nodes: [{ id: 'A', left: 'missing' }] },
      { root: 'A', nodes: [{ id: 'A', right: 'A' }] },
      { root: 'A', nodes: [{ id: 'A', left: 'B', right: 'B' }, { id: 'B' }] },
      { root: 'A', nodes: [{ id: 'A' }, { id: 'B' }] },
      { root: '0', nodes: [...skewed('right').nodes, { id: 'extra' }] },
    ];
    for (const input of badInputs) assert.throws(() => generate(input), TypeError);
    const input = structuredClone(module.DEFAULT_INPUT);
    const trace = generate(input);
    const original = JSON.stringify(trace);
    assert.equal(JSON.stringify(generate(input)), original);
    const enter = trace.steps.find(step => step.event === 'enter');
    enter.variables.stack[0].id = 'changed';
    enter.variables.nodes[0].left = null;
    enter.variables.order.push('changed');
    trace.result.push('changed');
    input.nodes[0].id = 'changed';
    assert.deepEqual(trace.steps.at(-1).result, expected);
    assert.deepEqual(trace.steps.at(-1).variables.order, expected);
    assert.equal(trace.steps.at(-1).variables.nodes[0].id, 'A');
    assert.equal(trace.steps.at(-1).variables.nodes[0].left, 'B');
    assert.equal(trace.steps.find(step => step.event === 'return').variables.stack[0].id, 'A');
  });
}

const root = fileURLToPath(new URL('../', import.meta.url));
const watcom = join(root, 'third_party', 'open-watcom');
const boot = join(watcom, 'owcpp', 'boot');
const compiler = join(watcom, 'builder', 'build', 'binbuild', 'bwcc386.exe');
const linker = join(boot, 'binnt64', 'wcl386.exe');
const nativeAvailable = process.platform === 'win32' && existsSync(compiler) && existsSync(linker);

test('Open Watcom compiles displayed C and verifies 315 traversal cases including both 64-node chains', {
  skip: nativeAvailable ? false : 'Requires the repository Open Watcom Windows toolchain',
}, () => {
  const cwd = mkdtempSync(join(tmpdir(), 'g-dfs-'));
  const compilerEnv = {
    ...process.env,
    WATCOM: boot,
    PATH: [join(boot, 'binnt64'), process.env.PATH].join(delimiter),
    LIB: join(boot, 'lib386', 'nt'),
    LIBPATH: join(boot, 'lib386', 'nt'),
  };
  const options = { cwd, env: compilerEnv, windowsHide: true, timeout: 15000, encoding: 'utf8' };
  try {
    for (const { mode, module } of traversals) {
      const cases = inputs.map((input, caseIndex) => {
        const index = id => input.nodes.findIndex(node => node.id === id);
        const tree = input.nodes.map(node => `{${index(node.left)},${index(node.right)}}`).join(',') || '{-1,-1}';
        const expected = reference(input, mode);
        const expectedRows = expected.map(entry => `{${index(entry.id)},${entry.level}}`).join(',') || '{-1,-1}';
        return `static Node tree${caseIndex}[] = {${tree}};
static Entry expected${caseIndex}[] = {${expectedRows}};
static int check${caseIndex}(void) {
  Entry output[64];
  int i, count = ${mode}(tree${caseIndex}, ${index(input.root)}, output);
  if (count != ${expected.length}) return 1;
  for (i = 0; i < count; i++) {
    if (output[i].node != expected${caseIndex}[i].node || output[i].level != expected${caseIndex}[i].level) return 2;
  }
  return 0;
}`;
      });
      const main = inputs.map((_, i) => `  if (check${i}()) return ${i + 1};`).join('\n');
      writeFileSync(join(cwd, mode + '.c'), module.SOURCE_LINES.map(line => line.text).join('\n') +
        '\n' + cases.join('\n') + '\nint main(void) {\n' + main + '\n  return 0;\n}\n', 'ascii');
      const compileLog = execFileSync(compiler, ['-za99', '-bt=nt', '-q', '-fo=' + mode + '.obj', mode + '.c'], options);
      const linkLog = execFileSync(linker, ['-l=nt', '-q', '-fe=' + mode + '.exe', mode + '.obj'], options);
      execFileSync(join(cwd, mode + '.exe'), [], options);
      // Keep linker diagnostics visible for reproducibility, including unused-library warnings.
      if (compileLog.trim()) console.log(compileLog.trim());
      if (linkLog.trim()) console.log(linkLog.trim());
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
