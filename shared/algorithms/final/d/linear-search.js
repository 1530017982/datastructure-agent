// shared/algorithms/final/d/linear-search.js
// D 包 · 顺序查找：从下标 0 开始逐项比较，遇到首个相等值即返回下标，遍历完返回 -1。
import { createStepFactory, requireArray, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-linear-c-v1';

const SOURCE_LINES = [
  { lineId: 'function-start', text: 'int linear_search(const long long a[], int n, long long target) {' },
  { lineId: 'loop-check', text: '  for (int i = 0; i < n; i++) {' },
  { lineId: 'compare', text: '    if (a[i] == target) {' },
  { lineId: 'found', text: '      return i;' },
  { lineId: 'compare-end', text: '    }' },
  { lineId: 'loop-end', text: '  }' },
  { lineId: 'not-found', text: '  return -1;' },
  { lineId: 'function-end', text: '}' },
];

/**
 * 生成顺序查找的执行步骤。
 * @param {{ array: number[], target: number }} input 数组可乱序、可重复；重复键返回首个匹配下标。
 */
export function generateLinearSearchSteps(input) {
  const array = requireArray(input?.array ?? [], 'array');
  const target = requireSafeInteger(input?.target, 'target');
  const { steps, add } = createStepFactory('linear-search', SOURCE_VERSION);

  add({
    event: 'init', lineId: 'function-start', array, target,
    variables: { index: null, current: null, comparisons: 0 },
    description: array.length
      ? `准备从下标 0 开始逐项比较，查找 ${target}。`
      : '空表没有任何元素可比较，直接返回未找到。',
  });

  if (array.length === 0) {
    add({
      event: 'not-found', lineId: 'not-found', array, target, done: true, result: -1,
      variables: { index: null, current: null, comparisons: 0 },
      description: '空表遍历结束，未找到目标值，返回 -1。',
    });
    return { steps, result: -1, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let i = 0; i < array.length; i++) {
    const current = array[i];
    add({
      event: 'compare', lineId: 'compare', array, target,
      variables: { index: i, current, comparisons: i + 1 },
      description: `比较第 ${i + 1} 个元素 A[${i}] = ${current} 与目标 ${target}，${current === target ? '相等。' : '不相等，继续向后。'}`,
    });

    if (current === target) {
      add({
        event: 'found', lineId: 'found', array, target, done: true, result: i,
        variables: { index: i, current, comparisons: i + 1 },
        description: `在下标 ${i} 命中目标 ${target}，共比较 ${i + 1} 次，返回 ${i}。`,
      });
      return { steps, result: i, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
    }
  }

  add({
    event: 'not-found', lineId: 'not-found', array, target, done: true, result: -1,
    variables: { index: null, current: null, comparisons: array.length },
    description: `比较完全部 ${array.length} 个元素仍未命中，返回 -1。`,
  });
  return { steps, result: -1, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}

export { SOURCE_VERSION, SOURCE_LINES };
