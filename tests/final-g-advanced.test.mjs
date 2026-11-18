import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlayback } from '../frontend/src/features/playback/index.js';
import { displayLineId } from '../frontend/src/features/workbench/display-source.js';
import { handleAgentExplain } from '../backend/src/agent/explain.mjs';
import { buildPrompt } from '../backend/src/agent/prompt.js';
import { createRun, runsStore } from '../backend/src/runs/store.js';
import * as reconstruction from '../shared/algorithms/final/g/binary-tree-reconstruction.js';
import * as threaded from '../shared/algorithms/final/g/threaded-binary-tree.js';
import * as conversion from '../shared/algorithms/final/g/tree-forest-conversion.js';
import * as traversal from '../shared/algorithms/final/g/tree-forest-traversal.js';
import * as huffman from '../shared/algorithms/final/g/huffman-coding.js';
import * as bst from '../shared/algorithms/final/g/binary-search-tree.js';

const rebuild = reconstruction.generateBinaryTreeReconstructionSteps;
const thread = threaded.generateThreadedBinaryTreeSteps;
const convert = conversion.generateTreeForestConversionSteps;
const traverse = traversal.generateTreeForestTraversalSteps;
const encode = huffman.generateHuffmanCodingSteps;
const runBst = bst.generateBinarySearchTreeSteps;
const chain = Array.from({ length: 64 }, (_, i) => String(i));
const forestChain = { roots: ['0'], nodes: chain.map((id, i) => ({ id, children: chain.slice(i + 1, i + 2) })) };
const emptyTree = { root: null, nodes: [] };
const emptyForest = { roots: [], nodes: [] };
const binaryChain = { root: '0', nodes: chain.map((id, i) => ({ id, left: chain[i + 1] ?? null })) };
const expectedTree = {
  root: 'A',
  nodes: [
    { id: 'A', left: 'B', right: 'C' },
    { id: 'B', left: null, right: 'D' },
    { id: 'D', left: null, right: null },
    { id: 'C', left: null, right: null },
  ],
};

test('reconstruction checks interval splits, empty children and invalid orders', () => {
  const run = rebuild(reconstruction.DEFAULT_INPUT);
  assert.deepEqual(run.result, expectedTree);
  const split = run.steps.find(step => step.event === 'split').variables.stack[0];
  assert.deepEqual(split, {
    id: 'A', preStart: 0, preEnd: 4, inStart: 0, inEnd: 4, split: 2,
    leftRange: { preorder: [1, 3], inorder: [0, 2] },
    rightRange: { preorder: [3, 4], inorder: [3, 4] },
  });
  assert.deepEqual(run.steps.filter(step => step.event === 'link').map(step => step.variables.edge),
    [{ parent: 'B', child: 'D', side: 'right' }, { parent: 'A', child: 'B', side: 'left' }, { parent: 'A', child: 'C', side: 'right' }]);
  assert.deepEqual(rebuild({ preorder: [], inorder: [] }).result, emptyTree);
  assert.deepEqual(rebuild({ preorder: ['A'], inorder: ['A'] }).result.nodes, [{ id: 'A', left: null, right: null }]);
  assert.equal(rebuild({ preorder: chain, inorder: [...chain].reverse() }).result.nodes[62].left, '63');
  for (const [preorder, inorder] of [
    [['A', 'A'], ['A', 'A']], [['A', 'B'], ['A', 'C']],
    [['A', 'B', 'C'], ['C', 'A', 'B']], [Array(1), ['A']], [['A'], []],
  ]) assert.throws(() => rebuild({ preorder, inorder }), TypeError);
});

test('threading keeps child links separate and traverses attached predecessor/successor links', () => {
  const { root, order, nodes } = thread(threaded.DEFAULT_INPUT).result;
  assert.equal(root, 'A');
  assert.deepEqual(order, ['B', 'D', 'A', 'C']);
  assert.deepEqual(nodes, [
    { id: 'A', left: 'B', right: 'C', leftThread: false, rightThread: false },
    { id: 'B', left: null, right: 'D', leftThread: true, rightThread: false },
    { id: 'C', left: 'A', right: null, leftThread: true, rightThread: true },
    { id: 'D', left: 'B', right: 'A', leftThread: true, rightThread: true },
  ]);
  assert.deepEqual(thread(emptyTree).result, { ...emptyTree, order: [] });
  assert.deepEqual(thread({ root: 'A', nodes: [{ id: 'A' }] }).result.nodes,
    [{ id: 'A', left: null, right: null, leftThread: true, rightThread: true }]);
  assert.deepEqual(thread(binaryChain).result.order, [...chain].reverse());
  assert.throws(() => thread({ root: 'A', nodes: [{ id: 'A', left: 'A' }] }), TypeError);
});

test('conversion round-trips arbitrary branching, root order and empty forests', () => {
  const run = convert(conversion.DEFAULT_INPUT);
  assert.deepEqual(run.result, {
    root: 'A',
    nodes: [
      { id: 'A', left: 'B', right: 'D' }, { id: 'B', left: null, right: 'C' },
      { id: 'C', left: null, right: null }, { id: 'D', left: null, right: null },
    ],
  });
  const forests = [
    conversion.DEFAULT_INPUT, emptyForest, forestChain,
    { roots: ['D', 'A', 'Z'], nodes: [
      { id: 'C' }, { id: 'A', children: ['C', 'B', 'E'] }, { id: 'D', children: ['F'] },
      { id: 'B', children: ['G'] }, { id: 'E' }, { id: 'F' }, { id: 'G' }, { id: 'Z' },
    ] },
  ];
  for (const forest of forests) {
    const binary = convert(forest).result;
    const reverse = convert({ mode: 'to-forest', ...binary });
    assert.deepEqual(reverse.result,
      { roots: forest.roots, nodes: forest.nodes.map(({ id, children = [] }) => ({ id, children })) });
  }
  assert.throws(() => convert({ mode: 'wrong' }), TypeError);
  assert.throws(() => convert({ roots: ['A', 'B'], nodes: [{ id: 'A', children: ['B'] }, { id: 'B' }] }), TypeError);
});

test('forest traversal records tree boundaries, returns, modes and empty input', () => {
  assert.deepEqual(traverse(traversal.DEFAULT_INPUT).result, ['A', 'B', 'C', 'D']);
  const run = traverse({ ...traversal.DEFAULT_INPUT, mode: 'postorder' });
  assert.deepEqual(run.result, ['B', 'C', 'A', 'D']);
  assert.deepEqual(run.steps.filter(step => step.event === 'start-tree').map(step => [
    step.variables.treeIndex, step.variables.childNode,
  ]), [[1, 'A'], [2, 'D']]);
  assert.equal(run.steps.find(step => step.event === 'resume').variables.currentNode, 'A');
  assert.deepEqual(traverse(emptyForest).result, []);
  assert.deepEqual(traverse({ ...forestChain, mode: 'postorder' }).result, [...chain].reverse());
  assert.throws(() => traverse({ roots: [], nodes: [{ id: 'A' }] }), TypeError);
  assert.throws(() => traverse({ roots: ['A'], nodes: [{ id: 'A', children: Array(1) }] }), TypeError);
});

test('Huffman codes are prefix-free, deterministic and use the documented single-symbol policy', () => {
  const run = encode(huffman.DEFAULT_INPUT);
  assert.deepEqual(run.steps.find(step => step.event === 'merge').variables.selected, [0, 1]);
  assert.equal(run.result.weightedPathLength, 17);
  assert.deepEqual(run.result.codes.map(({ code }) => code), ['00', '01', '1']);
  const ties = encode({ symbols: ['D', 'C', 'B', 'A'].map(id => ({ id, weight: 1 })) }).result;
  assert.deepEqual(ties.codes.map(({ id, code }) => [id, code]), [['D', '00'], ['C', '01'], ['B', '10'], ['A', '11']]);
  const single = encode({ symbols: [{ id: 'A', weight: 7 }] }).result;
  assert.equal(single.codes[0].code, '0');
  assert.equal(single.weightedPathLength, 0);
  assert.equal(single.encodedBitLength, 7);
  assert.deepEqual(encode({ symbols: [] }).result, { root: null, nodes: [], codes: [], weightedPathLength: 0, encodedBitLength: 0 });
  const max = encode({ symbols: chain.map(id => ({ id, weight: 2147483647 })) }).result;
  assert.equal(max.weightedPathLength, 64 * 6 * 2147483647);
  for (const a of max.codes) for (const b of max.codes) {
    if (a !== b) assert.ok(!a.code.startsWith(b.code));
  }
  assert.throws(() => encode({ symbols: Array(1) }), TypeError);
  assert.throws(() => encode({ symbols: [{ id: 'A', weight: 0 }] }), TypeError);
  assert.throws(() => encode({ symbols: [{ id: 'A', weight: 1 }, { id: 'A', weight: 2 }] }), TypeError);
});

test('BST records real search paths, preserves duplicate links and covers full capacity', () => {
  const run = runBst(bst.DEFAULT_INPUT);
  assert.deepEqual(run.result.inorder, [3, 4, 5, 7]);
  assert.deepEqual(run.result.operations.map(operation => operation.status),
    ['inserted', 'inserted', 'inserted', 'inserted', 'found', 'missing', 'duplicate']);
  assert.deepEqual(run.result.operations[4].path.map(id => run.result.nodes[id].key), [5, 3, 4]);
  assert.deepEqual(run.result.operations[5].path.map(id => run.result.nodes[id].key), [5, 7]);
  const duplicate = run.steps.find(step => step.event === 'duplicate');
  assert.deepEqual(duplicate.variables.nodes, run.steps[duplicate.stepIndex - 1].variables.nodes);
  assert.equal(runBst({ operations: [{ type: 'search', key: 0 }] }).result.operations[0].node, null);
  const operations = chain.map(key => ({ type: 'insert', key: Number(key) }));
  const result = runBst({ operations: [...operations, { type: 'search', key: 63 }] }).result;
  assert.equal(result.nodes.length, 64);
  assert.equal(result.operations.at(-1).path.length, 64);
  assert.throws(() => runBst({ operations: [...operations, { type: 'insert', key: 64 }] }), TypeError);
  assert.throws(() => runBst({ operations: [{ type: 'delete', key: 0 }] }), TypeError);
});

test('all new G traces preserve source mappings and replay independent snapshots', () => {
  for (const [module, generate] of [
    [reconstruction, rebuild], [threaded, thread], [conversion, convert],
    [traversal, traverse], [huffman, encode], [bst, runBst],
  ]) {
    const input = structuredClone(module.DEFAULT_INPUT);
    const run = generate(input);
    assert.deepEqual(run, generate(input));
    assert.deepEqual(input, module.DEFAULT_INPUT);
    const lines = new Set(run.sourceLines.map(line => line.lineId));
    assert.equal(lines.size, run.sourceLines.length);
    run.steps.forEach((step, index) => {
      assert.equal(step.stepIndex, index);
      assert.ok(lines.has(step.lineId));
      assert.equal(step.sourceVersion, module.SOURCE_VERSION);
      assert.equal(step.done, index === run.steps.length - 1);
      assert.deepEqual(step.result, step.done ? run.result : null);
    });
    const snapshots = [];
    const player = createPlayback({ runId: module.SOURCE_VERSION, steps: run.steps, onStepChange: event => snapshots.push(event.step) });
    player.next();
    player.prev();
    assert.equal(snapshots.at(-1), run.steps[0]);
    player.seek(run.steps.length - 1);
    assert.equal(snapshots.at(-1), run.steps.at(-1));
    player.reset();
    assert.equal(player.getState().stepIndex, 0);
    player.destroy();
    const last = structuredClone(run.steps.at(-1));
    const collection = Object.values(run.steps[0].variables).find(Array.isArray);
    if (module === bst) assert.throws(() => collection.push('changed'), TypeError);
    else collection.push('changed');
    assert.deepEqual(run.steps.at(-1), last);
    assert.notEqual(run.steps.at(-1).result, run.result);
  }
});

test('BST validates distinct insert keys before building any tree snapshot', () => {
  const inserts = chain.map(key => ({ type: 'insert', key: Number(key) }));
  const freeze = Object.freeze;
  let snapshots = 0;
  Object.freeze = value => {
    if (Array.isArray(value?.nodes) && Object.hasOwn(value, 'root')) snapshots++;
    return freeze(value);
  };
  try {
    assert.throws(() => bst.generateBinarySearchTreeReplay({
      operations: [...inserts, { type: 'insert', key: 64 }],
    }), { name: 'TypeError', message: '二叉排序树最多允许 64 个不同的键。' });
    assert.equal(snapshots, 0);

    const replay = bst.generateBinarySearchTreeReplay({
      operations: [...inserts, { type: 'insert', key: -0 }, { type: 'search', key: 64 }],
    });
    assert.equal(snapshots, 65);
    assert.equal(replay.treeStates.length, 65);
    assert.deepEqual(replay.result.operations.slice(-2).map(({ status, node }) => [status, node]),
      [['duplicate', 0], ['missing', null]]);
    assert.equal(replay.result.operations.at(-2).key, 0);
  } finally {
    Object.freeze = freeze;
  }
});

test('compact BST replay keeps 128 operations, works with the player, and binds questions to the same step', async () => {
  const insertions = chain.map(key => ({ type: 'insert', key: Number(key) }));
  const misses = chain.map(() => ({ type: 'search', key: 64 }));
  const input = { operations: [...insertions, ...misses] };
  const replay = bst.generateBinarySearchTreeReplay(input);
  assert.equal(replay.treeStates.length, 65);
  assert.equal(replay.steps.length, 12482);
  assert.equal(replay.result.operations.length, 128);
  assert.ok(replay.result.operations.slice(64).every(({ status, path }) => status === 'missing' && path.length === 64));
  assert.equal(replay.steps.filter(step => step.event === 'missing').length, 64);

  const algorithm = 'binary-search-tree';
  const serverRun = createRun({ algorithm, input, ...bst.restoreBinarySearchTreeRun(replay) });
  const wire = JSON.stringify({ ...replay, algorithm, runId: serverRun.runId, input });
  assert.ok(Buffer.byteLength(wire) < 3797555, 'wire payload including run metadata must fit within 10% of the old replay');
  const clientRun = bst.restoreBinarySearchTreeRun(JSON.parse(wire));
  const firstInsert = clientRun.steps.find(step => step.event === 'insert');
  assert.equal(clientRun.steps[0].variables.nodes.length, 0);
  assert.equal(firstInsert.variables.nodes[0].right, null);

  let event;
  const player = createPlayback({
    runId: clientRun.runId, steps: clientRun.steps,
    onStepChange: next => { event = next; },
  });
  try {
    player.next();
    assert.equal(event.step.event, 'operation');
    player.seek(clientRun.steps.length - 2);
    assert.equal(event.step.event, 'missing');
    assert.equal(event.step.stepIndex, 12480);
    assert.deepEqual(event.step.variables.path, chain.map(Number));
    assert.equal(event.step.variables.lastResult.status, 'missing');
    assert.equal(displayLineId(algorithm, event.step.lineId), 'missing');

    player.prev();
    assert.equal(event.step.event, 'move');
    assert.equal(event.step.stepIndex, 12479);
    assert.deepEqual(event.step.variables.edge, { from: 63, to: null, side: 'right' });
    assert.equal(displayLineId(algorithm, event.step.lineId), 'right');
    assert.strictEqual(event.step.variables.nodes, clientRun.steps[12480].variables.nodes);
    assert.ok(Object.isFrozen(event.step.variables.nodes));
    assert.ok(Object.isFrozen(event.step.variables.nodes[63]));

    const ask = () => handleAgentExplain({
      runId: event.runId, stepIndex: event.stepIndex, question: '为什么查找失败？', hintLevel: 2,
    });
    const moved = await ask();
    assert.equal(moved.status, 200);
    assert.equal(moved.body.runId, event.runId);
    assert.equal(moved.body.stepIndex, event.stepIndex);
    assert.deepEqual(moved.body.stepRefs[0].variables, event.step.variables);
    assert.match(moved.body.answer, /沿右链接继续/);

    player.next();
    const missing = await ask();
    assert.equal(missing.status, 200);
    assert.equal(missing.body.runId, serverRun.runId);
    assert.equal(missing.body.stepIndex, event.stepIndex);
    assert.deepEqual(missing.body.stepRefs[0].variables, event.step.variables);
    assert.match(missing.body.answer, /到达空链接，查找结束/);
    const prompt = buildPrompt(serverRun, serverRun.steps[missing.body.stepIndex], 2, '为什么查找失败？')[1].content;
    assert.match(prompt, /"event":"missing","lineId":"missing"/);
    assert.match(prompt, /"activeLineId":"missing"/);
    assert.match(prompt, /"event":"move","lineId":"right"/);
    player.reset();
    assert.equal(event.stepIndex, 0);
    assert.equal(event.step.lineId, 'init');
  } finally {
    player.destroy();
    runsStore.delete(serverRun.runId);
  }
});
