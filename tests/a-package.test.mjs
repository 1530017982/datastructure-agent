import test from 'node:test';
import assert from 'node:assert/strict';
import { generateInsertionSortSteps } from '../shared/algorithms/final/a/insertion-sort.js';
import { generateMergeSortSteps } from '../shared/algorithms/final/a/merge-sort.js';
import { generateHeapSortSteps } from '../shared/algorithms/final/a/heap-sort.js';
import { generateQuickSortSteps } from '../shared/algorithms/final/a/quick-sort.js';
import { generateSelectionSortSteps } from '../shared/algorithms/final/a/selection-sort.js';
import { generateShellSortSteps } from '../shared/algorithms/final/a/shell-sort.js';
import { generateBinaryInsertionSortSteps } from '../shared/algorithms/final/a/binary-insertion-sort.js';
import { validateRun } from '../frontend/src/features/workbench/input.js';

test('A包：归并排序在递归返回后正确恢复当前帧区间', () => {
  const run = generateMergeSortSteps([3, 1, 2]);
  const mergeStarts = run.steps.filter(s => s.event === 'merge-start');
  
  // 第一次合并 [0,0] 和 [1,1] -> 区间 [0, 1]
  assert.equal(mergeStarts[0].variables.low, 0);
  assert.equal(mergeStarts[0].variables.high, 1);
  assert.equal(mergeStarts[0].variables.mid, 0);

  // 第二次合并 [0,1] 和 [2,2] -> 区间 [0, 2]
  assert.equal(mergeStarts[1].variables.low, 0);
  assert.equal(mergeStarts[1].variables.high, 2);
  assert.equal(mergeStarts[1].variables.mid, 1);
});

test('A包：归并排序的 temp 数组为独立快照且保持稳定性', () => {
  const run = generateMergeSortSteps([3, 1, 2, 3, 1]);
  // 验证稳定排序的最终结果
  assert.deepEqual(run.result, [1, 1, 2, 3, 3]);

  // 验证 temp 快照不共享引用
  const starts = run.steps.filter(s => s.event === 'merge-start');
  assert.deepEqual(starts[0].variables.temp, []);
  
  const firstPick = run.steps.find(s => s.event === 'pick');
  assert.equal(firstPick.variables.temp.length, 1);
  
  // 修改历史步骤不应该影响其他步骤
  firstPick.variables.temp.push(999);
  assert.notEqual(starts[0].variables.temp.length, 2);
});

test('A包：堆排序外层调用与内部根节点状态分离', () => {
  const run = generateHeapSortSteps([4, 1, 3, 2]);
  const calls = run.steps.filter(s => s.event === 'heapify-call');
  
  // 第一次建堆：调整 i=1 (heapSize=4)
  assert.equal(calls[0].variables.heapSize, 4);
  assert.equal(calls[0].variables.i, 1);
  
  // 第二次建堆：调整 i=0 (heapSize=4)
  assert.equal(calls[1].variables.heapSize, 4);
  assert.equal(calls[1].variables.i, 0);
});

test('A包：前端严格校验拦截非法类型与缺失字段', () => {
  const run = generateMergeSortSteps([2, 1]);
  const badRun = JSON.parse(JSON.stringify(run));
  
  // 注入坏类型数据
  badRun.steps[0].variables.low = 'bad';
  badRun.steps[0].variables.high = -999;
  badRun.steps[0].variables.i = { bad: true };
  badRun.steps[0].variables.k = 'wrong';
  
  // 断言 validateRun 会抛出错误（证明校验生效）
  assert.throws(() => {
    validateRun(badRun, 'merge-sort');
  }, /步骤或源码映射不完整/);
});

test('A包：其他6种排序的基础正确性', () => {
  const input = [5, 2, 8, 1, 9];
  assert.deepEqual(generateInsertionSortSteps(input).result, [1, 2, 5, 8, 9]);
  assert.deepEqual(generateBinaryInsertionSortSteps(input).result, [1, 2, 5, 8, 9]);
  assert.deepEqual(generateShellSortSteps(input).result, [1, 2, 5, 8, 9]);
  assert.deepEqual(generateSelectionSortSteps(input).result, [1, 2, 5, 8, 9]);
  assert.deepEqual(generateQuickSortSteps(input).result, [1, 2, 5, 8, 9]);
  assert.deepEqual(generateHeapSortSteps(input).result, [1, 2, 5, 8, 9]);
});