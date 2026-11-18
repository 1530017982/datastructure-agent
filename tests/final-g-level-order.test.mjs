import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_INPUT, MAX_NODES, generateBinaryTreeLevelOrderSteps,
} from '../shared/algorithms/final/g/binary-tree-level-order.js';

test('replays the default tree in FIFO order with one-based levels', () => {
  const { steps, result, sourceLines } = generateBinaryTreeLevelOrderSteps(DEFAULT_INPUT);
  assert.deepEqual(result, ['A', 'B', 'C', 'D']);
  assert.deepEqual(steps.at(-1).variables.levels, [['A'], ['B', 'C'], ['D']]);
  const queueAfterDequeue = steps.filter(({ event }) => event === 'dequeue')
    .map(({ variables }) => [variables.currentNode, variables.level, variables.queue.map(({ id }) => id)]);
  assert.deepEqual(queueAfterDequeue, [['A', 1, []], ['B', 2, ['C']], ['C', 2, ['D']], ['D', 3, []]]);
  const lines = new Set(sourceLines.map(({ lineId }) => lineId));
  steps.forEach((step, index) => {
    assert.equal(step.stepIndex, index);
    assert.ok(lines.has(step.lineId));
    assert.equal(step.done, index === steps.length - 1);
    assert.deepEqual(step.result, step.done ? result : null);
  });
  const enqueues = steps.filter(step => step.event === 'enqueue');
  assert.deepEqual(enqueues.map(({ lineId, variables }) => [lineId, variables.queuedNode.id, variables.queuedNode.level]), [
    ['enqueue-root', 'A', 1],
    ['enqueue-left', 'B', 2],
    ['enqueue-right', 'C', 2],
    ['enqueue-right', 'D', 3],
  ]);
  for (const [side, level] of [['root', '1'], ['left', 'current.level + 1'], ['right', 'current.level + 1']]) {
    const index = sourceLines.findIndex(line => line.lineId === 'enqueue-' + side);
    assert.deepEqual(sourceLines.slice(index - 1, index + 4).map(line => line.text.trim()), [
      'if (' + side + ' >= 0) {',
      'queue[tail].node = ' + side + ';',
      'queue[tail].level = ' + level + ';',
      'tail++;',
      '}',
    ]);
  }
  steps[1].variables.queue[0].id = 'changed';
  steps[0].variables.nodes[0].left = null;
  steps.find(({ event }) => event === 'visit').variables.levels[0].push('changed');
  assert.equal(steps[1].variables.queuedNode.id, 'A');
  assert.equal(steps[1].variables.nodes[0].left, 'B');
  assert.deepEqual(steps.at(-1).variables.levels, [['A'], ['B', 'C'], ['D']]);
  assert.equal(DEFAULT_INPUT.nodes[0].left, 'B');
});

test('replays empty and single-node trees', () => {
  const empty = generateBinaryTreeLevelOrderSteps({ root: null, nodes: [] });
  assert.deepEqual(empty.result, []);
  assert.deepEqual(empty.steps.map(({ event }) => event), ['init', 'done']);
  const single = generateBinaryTreeLevelOrderSteps({ root: 'A', nodes: [{ id: 'A' }] });
  assert.deepEqual(single.result, ['A']);
  assert.deepEqual(single.steps.map(({ event }) => event), ['init', 'enqueue', 'dequeue', 'visit', 'done']);
  assert.deepEqual(single.steps.at(-1).variables.levels, [['A']]);
});

test('supports a skewed tree at the node limit', () => {
  const nodes = Array.from({ length: MAX_NODES }, (_, index) => ({
    id: String(index),
    right: index + 1 < MAX_NODES ? String(index + 1) : null,
  }));
  const { steps, result } = generateBinaryTreeLevelOrderSteps({ root: '0', nodes });
  assert.deepEqual(result, nodes.map(({ id }) => id));
  assert.equal(steps.filter(({ event }) => event === 'visit').at(-1).variables.level, MAX_NODES);
  assert.throws(() => generateBinaryTreeLevelOrderSteps({ root: '0', nodes: [...nodes, { id: 'extra' }] }));
});

test('rejects duplicate IDs, missing children, cycles, shared children, and unreachable nodes', () => {
  const badTrees = [
    [{ id: 'A' }, { id: 'A' }],
    [{ id: 'A', left: 'B' }],
    [{ id: 'A', right: 'A' }],
    [{ id: 'A', left: 'B', right: 'B' }, { id: 'B' }],
    [{ id: 'A' }, { id: 'B' }],
  ];
  for (const nodes of badTrees) {
    assert.throws(() => generateBinaryTreeLevelOrderSteps({ root: 'A', nodes }), TypeError);
  }
});
