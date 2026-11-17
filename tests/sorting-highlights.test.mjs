import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPrototypeArrayFrame } from '../frontend/src/features/visualization/prototype-array.js';
import { generateSteps } from '../shared/algorithms/binarySearch.js';
import { generateBubbleSteps } from '../shared/algorithms/bubbleSort.js';
import { generateInsertionSortSteps } from '../shared/algorithms/final/a/insertion-sort.js';
import { generateBinaryInsertionSortSteps } from '../shared/algorithms/final/a/binary-insertion-sort.js';
import { generateShellSortSteps } from '../shared/algorithms/final/a/shell-sort.js';
import { generateSelectionSortSteps } from '../shared/algorithms/final/a/selection-sort.js';
import { generateQuickSortSteps } from '../shared/algorithms/final/a/quick-sort.js';
import { generateHeapSortSteps } from '../shared/algorithms/final/a/heap-sort.js';
import { generateMergeSortSteps } from '../shared/algorithms/final/a/merge-sort.js';

// Exercise the actual SVG frame builder without a browser or animation timers.
function frameCells(step) {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElementNS() {
      const element = {
        attributes: {}, classes: new Set(), children: [],
        setAttribute(name, value) {
          this.attributes[name] = String(value);
          if (name === 'class') for (const token of String(value).split(/\s+/)) this.classes.add(token);
        },
        append(...children) { this.children.push(...children); }
      };
      element.classList = { add(...names) { for (const name of names) element.classes.add(name); } };
      return element;
    }
  };
  try {
    const frame = buildPrototypeArrayFrame(step, { previous: null, enter: false, reduced: true });
    const cells = [];
    function visit(node) {
      if (Object.hasOwn(node.attributes, 'data-index')) cells.push({ index: Number(node.attributes['data-index']), classes: node.classes });
      for (const child of node.children) visit(child);
    }
    for (const cell of frame?.cells ?? []) visit(cell);
    return cells;
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}
const marked = (step, name) => frameCells(step).filter(cell => cell.classes.has(name)).map(cell => cell.index);

test('sorting initialization is idle; completed frames mark every item settled without active comparisons', () => {
  const generators = [generateBubbleSteps, generateInsertionSortSteps, generateBinaryInsertionSortSteps,
    generateShellSortSteps, generateSelectionSortSteps, generateQuickSortSteps, generateHeapSortSteps, generateMergeSortSteps];
  for (const generate of generators) {
    for (const array of [[], [7], [3, 1, 2], [2, 1, 2]]) {
      const { steps } = generate(array);
      const start = steps[0], end = steps.at(-1);
      assert.deepEqual(marked(start, 'is-sorted'), [], start.algorithm + ': initialization');
      assert.deepEqual(marked(start, 'is-comparing'), [], start.algorithm + ': initialization');
      assert.deepEqual(marked(end, 'is-sorted'), array.map((_, index) => index), end.algorithm + ': completion');
      assert.deepEqual(marked(end, 'is-comparing'), [], end.algorithm + ': completion');
      assert.deepEqual(marked(end, 'is-mid'), [], end.algorithm + ': completion');
    }
  }
});

test('merge picks and copies use original-array positions, including right runs and exhausted sides', () => {
  const { steps } = generateMergeSortSteps([4, 3, 2, 1]);
  const picks = steps.filter(step => step.event === 'pick');
  const expectedReads = [1, 0, 3, 2, 2, 3, 0, 1];
  assert.deepEqual(picks.map(step => step.variables.readIndex), expectedReads);
  picks.forEach((step, index) => {
    assert.deepEqual(marked(step, 'is-comparing'), [expectedReads[index]]);
    assert.equal(step.array[step.variables.readIndex], step.variables.pickedValue);
  });
  const copies = steps.filter(step => step.event === 'copy');
  const expectedWrites = [0, 1, 2, 3, 0, 1, 2, 3];
  copies.forEach((step, index) => assert.deepEqual(marked(step, 'is-comparing'), [expectedWrites[index]]));
  for (const step of steps.filter(step => step.event === 'compare')) {
    assert.deepEqual(marked(step, 'is-comparing'), [step.variables.i, step.variables.j].sort((a, b) => a - b));
  }
});

test('heap construction has no settled suffix; extraction settles it and binary search still excludes discarded values', () => {
  const heap = generateHeapSortSteps([3, 1, 2]);
  assert.deepEqual(marked(heap.steps.find(step => step.event === 'build-start'), 'is-sorted'), []);
  assert.deepEqual(marked(heap.steps.find(step => step.event === 'swap'), 'is-sorted'), [2]);
  const binary = generateSteps([1, 3, 5, 7, 9], 7);
  assert.deepEqual(marked(binary.steps.find(step => step.event === 'move-left'), 'is-excluded'), [0, 1, 2]);
});
