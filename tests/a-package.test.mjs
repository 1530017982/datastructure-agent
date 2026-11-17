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

// 辅助函数：补齐完整的 run 结构
function createMockRun(rawRun, algorithm) {
  return {
    runId: 'mock-run-id',
    algorithm: algorithm,
    sourceVersion: rawRun.sourceVersion,
    sourceLines: rawRun.sourceLines,
    steps: rawRun.steps,
    result: rawRun.result
  };
}

test('A包：归并排序在递归返回后正确恢复当前帧区间', () => {
  const run = generateMergeSortSteps([3, 1, 2]);
  const mergeStarts = run.steps.filter(s => s.event === 'merge-start');
  
  assert.equal(mergeStarts[0].variables.low, 0);
  assert.equal(mergeStarts[0].variables.high, 1);
  assert.equal(mergeStarts[0].variables.mid, 0);

  assert.equal(mergeStarts[1].variables.low, 0);
  assert.equal(mergeStarts[1].variables.high, 2);
  assert.equal(mergeStarts[1].variables.mid, 1);
});

test('A包：归并排序的 temp 数组为独立快照且保持稳定性证据', () => {
  const rawRun = generateMergeSortSteps([3, 1, 2, 3, 1]);
  const run = createMockRun(rawRun, 'merge-sort');

  // 正向验证：完整的正常 run 必须能通过校验
  assert.doesNotThrow(() => validateRun(run, 'merge-sort'), '正常 run 被误拒');

  // 稳定性证据：归并排序展示代码中必须存在相等时保留左侧的逻辑
  assert.ok(run.sourceLines.some(l => l.text.includes('a[i] <= a[j]')), '源码缺少稳定性保证条件');

  // 验证 temp 快照不共享引用
  const starts = run.steps.filter(s => s.event === 'merge-start');
  assert.deepEqual(starts[0].variables.temp, []);
  
  const firstPick = run.steps.find(s => s.event === 'pick');
  assert.equal(firstPick.variables.temp.length, 1);
  
  firstPick.variables.temp.push(999);
  assert.notEqual(starts[0].variables.temp.length, 2);
});

test('A包：堆排序外层调用与内部根节点状态分离', () => {
  const run = generateHeapSortSteps([4, 1, 3, 2]);
  const calls = run.steps.filter(s => s.event === 'heapify-call');
  
  assert.equal(calls[0].variables.heapSize, 4);
  assert.equal(calls[0].variables.i, 1);
  
  assert.equal(calls[1].variables.heapSize, 4);
  assert.equal(calls[1].variables.i, 0);
});

test('A包：前端严格校验拦截非法类型与缺失字段', () => {
  const rawRun = generateMergeSortSteps([2, 1]);
  const run = createMockRun(rawRun, 'merge-sort');
  
  // 正向验证
  assert.doesNotThrow(() => validateRun(run, 'merge-sort'), '正常 run 被误拒');

  // 反向验证：注入坏类型数据
  const badRun = JSON.parse(JSON.stringify(run));
  badRun.steps[0].variables.low = 'bad';
  badRun.steps[0].variables.high = -999;
  badRun.steps[0].variables.i = { bad: true };
  badRun.steps[0].variables.k = 'wrong';
  
  assert.throws(() => {
    validateRun(badRun, 'merge-sort');
  }, /步骤或源码映射不完整/);
});

test('A包：全部7种排序的初始化、空数组、单元素能通过前端消费链校验', () => {
  const cases = [
    { gen: generateInsertionSortSteps, id: 'insertion-sort' },
    { gen: generateBinaryInsertionSortSteps, id: 'binary-insertion-sort' },
    { gen: generateShellSortSteps, id: 'shell-sort' },
    { gen: generateSelectionSortSteps, id: 'selection-sort' },
    { gen: generateQuickSortSteps, id: 'quick-sort' },
    { gen: generateHeapSortSteps, id: 'heap-sort' },
    { gen: generateMergeSortSteps, id: 'merge-sort' }
  ];

  for (const { gen, id } of cases) {
    // 普通输入
    const normalRun = createMockRun(gen([3,1,2]), id);
    assert.doesNotThrow(() => validateRun(normalRun, id), `${id} 普通输入校验失败`);
    
    // 空数组
    const emptyRun = createMockRun(gen([]), id);
    assert.doesNotThrow(() => validateRun(emptyRun, id), `${id} 空数组校验失败`);
    
    // 单元素
    const singleRun = createMockRun(gen([7]), id);
    assert.doesNotThrow(() => validateRun(singleRun, id), `${id} 单元素校验失败`);
  }
});
