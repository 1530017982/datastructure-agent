import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import * as level from '../shared/algorithms/final/g/binary-tree-level-order.js';
import * as rebuild from '../shared/algorithms/final/g/binary-tree-reconstruction.js';
import * as threaded from '../shared/algorithms/final/g/threaded-binary-tree.js';
import * as convert from '../shared/algorithms/final/g/tree-forest-conversion.js';
import * as traversal from '../shared/algorithms/final/g/tree-forest-traversal.js';
import * as huffman from '../shared/algorithms/final/g/huffman-coding.js';
import * as bst from '../shared/algorithms/final/g/binary-search-tree.js';

const watcom = fileURLToPath(new URL('../third_party/open-watcom/', import.meta.url));
const boot = join(watcom, 'owcpp', 'boot');
const bin = join(boot, 'binnt64');
const compiler = join(watcom, 'builder', 'build', 'binbuild', 'bwcc386.exe');
const linker = join(bin, 'wcl386.exe');
const available = process.platform === 'win32' && existsSync(compiler) && existsSync(linker);

const ids = Array.from({ length: 64 }, (_, i) => String(i));
function skewed(side) {
  return { root: '0', nodes: ids.map((id, i) => ({ id, [side]: ids[i + 1] ?? null })) };
}
const empty = { root: null, nodes: [] };
const single = { root: 'A', nodes: [{ id: 'A' }] };
const binaryCases = [level.DEFAULT_INPUT, empty, single, skewed('left'), skewed('right')];
const forestCases = [
  convert.DEFAULT_INPUT, { roots: [], nodes: [] }, { roots: ['A'], nodes: [{ id: 'A' }] },
  { roots: ['0'], nodes: ids.map((id, i) => ({ id, children: ids.slice(i + 1, i + 2) })) },
  { roots: [...ids].reverse(), nodes: ids.map(id => ({ id })) },
];
const int = value => value === -2147483648 ? '(-2147483647 - 1)' : String(value);
const array = values => '{' + (values.join(', ') || '0') + '}';
const indexer = nodes => id => nodes.findIndex(node => node.id === id);
const binaryRows = (input, index) => input.nodes.map(({ left, right }) => array([index(left), index(right)]));
const intArray = (name, values) => '  const int ' + name + '[] = ' + array(values) + ';';
const check = condition => '  if (!(' + condition + ')) return 1;';
const forestArrays = input => {
  const children = [];
  const offsets = [0];
  const index = indexer(input.nodes);
  for (const node of input.nodes) {
    children.push(...(node.children ?? []).map(index));
    offsets.push(children.length);
  }
  return [
    intArray('roots', input.roots.map(index)),
    intArray('children', children),
    intArray('offsets', offsets),
  ];
};

const suites = [
  ['bfs', level, binaryCases.map((input, i) => {
    const expected = [
      [['A', 1], ['B', 2], ['C', 2], ['D', 3]], [], [['A', 1]],
      ids.map((id, index) => [id, index + 1]), ids.map((id, index) => [id, index + 1]),
    ][i];
    const index = indexer(input.nodes);
    return [
      '  Node nodes[] = ' + array(binaryRows(input, index)) + ';',
      '  Entry out[64];',
      check('level_order(nodes, ' + index(input.root) + ', out) == ' + expected.length),
      ...expected.map(([id, depth], j) => check('out[' + j + '].node == ' + index(id) + ' && out[' + j + '].level == ' + depth)),
    ];
  })],
  ['rebuild', rebuild, [
    rebuild.DEFAULT_INPUT, { preorder: [], inorder: [] }, { preorder: ['A'], inorder: ['A'] },
    { preorder: ids, inorder: [...ids].reverse() }, { preorder: ids, inorder: ids },
  ].map(input => {
    const { root, nodes } = rebuild.generateBinaryTreeReconstructionSteps(input).result;
    const index = indexer(nodes);
    return [
      intArray('pre', input.preorder.map(index)), intArray('in', input.inorder.map(index)), '  Node out[64];',
      check('reconstruct(pre, in, ' + nodes.length + ', out) == ' + index(root)),
      ...nodes.map(({ id, left, right }) => check('out[' + index(id) + '].left == ' + index(left) + ' && out[' + index(id) + '].right == ' + index(right))),
    ];
  }).concat([
    [intArray('pre', [0, 1, 2]), intArray('in', [2, 0, 1]), '  Node out[64];', check('reconstruct(pre, in, 3, out) == -2')],
    [intArray('pre', [0, 1, 0]), intArray('in', [2, 0, 1]), '  Node out[64];', check('reconstruct(pre, in, 3, out) == -2')],
  ])],
  ['thread', threaded, binaryCases.map(input => {
    const { order, nodes } = threaded.generateThreadedBinaryTreeSteps(input).result;
    const index = indexer(input.nodes);
    return [
      '  ThreadedNode nodes[] = ' + array(binaryRows(input, index)) + ';', '  int out[64];',
      check('thread_tree(nodes, ' + nodes.length + ', ' + index(input.root) + ') == ' + index(order.at(-1))),
      check('threaded_order(nodes, ' + index(input.root) + ', out) == ' + order.length),
      ...order.map((id, j) => check('out[' + j + '] == ' + index(id))),
      ...nodes.flatMap(({ left, right, leftThread, rightThread }, j) => [
        check('nodes[' + j + '].left == ' + index(left) + ' && nodes[' + j + '].right == ' + index(right)),
        check('nodes[' + j + '].left_thread == ' + Number(leftThread) + ' && nodes[' + j + '].right_thread == ' + Number(rightThread)),
      ]),
    ];
  })],
  ['convert', convert, forestCases.map(input => {
    const index = indexer(input.nodes);
    const { root, nodes } = convert.generateTreeForestConversionSteps(input).result;
    const parents = new Map();
    for (const node of input.nodes) for (const child of node.children ?? []) parents.set(child, node.id);
    const order = traversal.generateTreeForestTraversalSteps({ ...input, mode: 'preorder' }).result;
    return [
      ...forestArrays(input), '  Node out[64];', '  int parents[64], order[64];',
      check('forest_to_binary(' + nodes.length + ', roots, ' + input.roots.length + ', children, offsets, out) == ' + index(root)),
      ...nodes.map(({ left, right }, j) => check('out[' + j + '].left == ' + index(left) + ' && out[' + j + '].right == ' + index(right))),
      check('binary_to_forest(out, ' + index(root) + ', parents, order) == ' + nodes.length),
      ...order.flatMap((id, j) => [check('order[' + j + '] == ' + index(id)), check('parents[' + index(id) + '] == ' + index(parents.get(id)))]),
    ];
  })],
  ['forest', traversal, forestCases.flatMap(input => ['preorder', 'postorder'].map(mode => {
    const index = indexer(input.nodes);
    const order = traversal.generateTreeForestTraversalSteps({ ...input, mode }).result;
    return [
      ...forestArrays(input), '  int out[64];',
      check('traverse_forest(roots, ' + input.roots.length + ', children, offsets, ' + Number(mode === 'postorder') + ', out) == ' + order.length),
      ...order.map((id, j) => check('out[' + j + '] == ' + index(id))),
    ];
  }))],
  ['huffman', huffman, [
    huffman.DEFAULT_INPUT.symbols, [], [{ id: 'A', weight: 7 }],
    ids.slice(0, 5).map(id => ({ id, weight: 1 })), ids.map(id => ({ id, weight: 2147483647 })),
  ].map(symbols => {
    const { root, nodes, codes, weightedPathLength } = huffman.generateHuffmanCodingSteps({ symbols }).result;
    return [
      intArray('weights', symbols.map(symbol => symbol.weight)),
      '  HuffmanNode nodes[127]; char codes[64][65]; long long cost;',
      check('huffman(weights, ' + symbols.length + ', nodes, codes, &cost) == ' + (root ?? -1)),
      check('cost == ' + weightedPathLength + 'LL'),
      ...nodes.map(({ weight, left, right }, j) => check('nodes[' + j + '].weight == ' + weight + 'LL && nodes[' + j + '].left == ' + (left ?? -1) + ' && nodes[' + j + '].right == ' + (right ?? -1))),
      ...codes.map(({ index, code }) => {
        const row = 'codes[' + index + ']';
        const bits = Array.from(code, (bit, i) => row + '[' + i + "] == '" + bit + "'");
        return check([...bits, row + '[' + code.length + '] == 0'].join(' && '));
      }),
    ];
  })],
  ['bst', bst, [
    bst.DEFAULT_INPUT.operations, [], [{ type: 'search', key: 0 }],
    [{ type: 'insert', key: -2147483648 }, { type: 'insert', key: 2147483647 }, { type: 'search', key: 0 }],
    [...ids.map(key => ({ type: 'insert', key: Number(key) })), { type: 'search', key: 63 }, { type: 'insert', key: 0 }],
  ].map(operations => {
    const result = bst.generateBinarySearchTreeSteps({ operations }).result;
    const statuses = { inserted: 1, found: 0, duplicate: 0, missing: -1 };
    return [
      '  BST tree; int node, path[64], len, out[64];',
      '  bst_init(&tree);',
      ...result.operations.flatMap(({ type, key, status, node, path }) => [
        check('bst_operation(&tree, ' + int(key) + ', ' + Number(type === 'insert') + ', &node, path, &len) == ' + statuses[status]),
        check('node == ' + (node ?? -1) + ' && len == ' + path.length),
        ...path.map((id, i) => check('path[' + i + '] == ' + id)),
      ]),
      check('tree.root == ' + (result.root ?? -1) + ' && tree.count == ' + result.nodes.length),
      check('bst_inorder(&tree, out) == ' + result.inorder.length),
      ...result.inorder.map((key, i) => check('out[' + i + '] == ' + int(key))),
    ];
  })],
];

for (const [name, module, cases] of suites) {
  test('Open Watcom ' + name + ' matches expected structures, order and boundary results (' + cases.length + ' cases)', {
    skip: available ? false : 'Requires the repository Open Watcom Windows toolchain',
  }, () => {
    const temp = resolve(tmpdir());
    const cwd = mkdtempSync(join(temp, 'g-watcom-'));
    const lib = join(boot, 'lib386', 'nt');
    const env = {
      ...process.env, WATCOM: boot, PATH: [bin, process.env.PATH].join(delimiter),
      INCLUDE: join(boot, 'h'), LIB: lib, LIBPATH: lib,
    };
    const options = { cwd, env, windowsHide: true, timeout: 15000, encoding: 'utf8' };
    const code = [

      ...module.SOURCE_LINES.map(row => row.text),
      ...cases.flatMap((body, i) => ['static int case_' + i + '(void) {', ...body, '  return 0;', '}']),
      'int main(void) {',
      ...cases.map((_, i) => '  if (case_' + i + '()) return ' + (i + 1) + ';'),
      '  return 0;',
      '}',
      '',
    ].join('\n');
    try {
      writeFileSync(join(cwd, 'check.c'), code, 'ascii');
      execFileSync(compiler, ['-za99', '-bt=nt', '-q', '-fo=check.obj', 'check.c'], options);
      execFileSync(linker, ['-l=nt', '-q', '-fe=check.exe', 'check.obj'], options);
      assert.doesNotThrow(() => execFileSync(join(cwd, 'check.exe'), [], options));
    } finally {
      if (cwd.startsWith(temp + sep + 'g-watcom-')) rmSync(cwd, { recursive: true, force: true });
    }
  });
}
