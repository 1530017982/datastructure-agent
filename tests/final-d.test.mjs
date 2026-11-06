// tests/final-d.test.mjs
// D 包（查找与哈希）验收测试：预期值均按任务单样例人工推演，不调用被测实现生成标准答案。
import assert from 'node:assert/strict';
import test from 'node:test';

import { generateLinearSearchSteps } from '../shared/algorithms/final/d/linear-search.js';
import { generateBlockSearchSteps } from '../shared/algorithms/final/d/block-search.js';
import { generateHashLinearProbingSteps } from '../shared/algorithms/final/d/hash-linear-probing.js';
import { generateHashQuadraticProbingSteps } from '../shared/algorithms/final/d/hash-quadratic-probing.js';
import { generateHashDoubleHashingSteps } from '../shared/algorithms/final/d/hash-double-hashing.js';
import { generateHashChainingSteps } from '../shared/algorithms/final/d/hash-chaining.js';
import { generateAvlSteps } from '../shared/algorithms/final/d/avl-tree.js';
import { generateRedBlackSteps, validateRedBlack } from '../shared/algorithms/final/d/red-black-tree.js';

/** 通用不变量：编号连续、首步 init、末步 done、lineId 有效、非结束步不带 result。 */
function assertStepInvariants(run, label) {
  assert.ok(run.steps.length >= 2, `${label}: 步骤过少`);
  const lineIds = new Set(run.sourceLines.map(line => line.lineId));
  run.steps.forEach((step, index) => {
    assert.equal(step.stepIndex, index, `${label}: stepIndex 不连续`);
    assert.equal(step.schemaVersion, '1.0', `${label}: schemaVersion 错误`);
    assert.equal(step.algorithm, run.steps[0].algorithm, `${label}: algorithm 不一致`);
    assert.equal(step.sourceVersion, run.sourceVersion, `${label}: sourceVersion 不一致`);
    assert.ok(lineIds.has(step.lineId), `${label}: lineId ${step.lineId} 不在 sourceLines`);
    assert.ok(typeof step.description === 'string' && step.description.length > 0, `${label}: description 为空`);
    assert.equal(typeof step.done, 'boolean');
    if (!step.done) assert.equal(step.result, null, `${label}: 非结束步不应带 result`);
  });
  assert.equal(run.steps[0].event, 'init', `${label}: 首步应为 init`);
  assert.equal(run.steps.at(-1).done, true, `${label}: 末步应 done`);
}

/** 展示代码结构检查：拼起来后花括号配平、不提前闭合、lineId 不重复。 */
function assertSourceBalanced(run, label) {
  const code = run.sourceLines.map(line => line.text).join('\n');
  let depth = 0;
  let minDepth = 0;
  for (const ch of code) {
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth < minDepth) minDepth = depth;
    }
  }
  assert.equal(depth, 0, `${label}: 展示代码花括号未配平（余额 ${depth}）`);
  assert.equal(minDepth, 0, `${label}: 展示代码出现提前闭合`);
  const ids = run.sourceLines.map(line => line.lineId);
  assert.equal(new Set(ids).size, ids.length, `${label}: sourceLines 存在重复 lineId`);
}

/** 树快照完整性：所有结点都必须能从快照根访问到，用于发现旋转中间态丢结点。 */
function assertSnapshotComplete(variables, expectedKeys, label) {
  assert.notEqual(variables.root, null, `${label}: 快照缺少根`);
  const byKey = new Map(variables.nodes.map(item => [item.key, item]));
  assert.equal(byKey.size, expectedKeys.length, `${label}: 快照结点数应为 ${expectedKeys.length}，实际 ${byKey.size}`);
  for (const key of expectedKeys) assert.ok(byKey.has(key), `${label}: 快照缺少结点 ${key}`);
  const seen = new Set();
  (function walk(key) {
    if (key === null || key === undefined) return;
    const item = byKey.get(key);
    assert.ok(item, `${label}: 引用了不存在的结点 ${key}`);
    assert.ok(!seen.has(key), `${label}: 结点 ${key} 被重复访问，链接异常`);
    seen.add(key);
    walk(item.left);
    walk(item.right);
  })(variables.root);
  assert.equal(seen.size, expectedKeys.length, `${label}: 从根出发只能访问 ${seen.size} 个结点`);
}

test('顺序查找：重复键返回首个匹配，空表返回 -1', () => {
  const repeated = generateLinearSearchSteps({ array: [4, 2, 4], target: 4 });
  assertStepInvariants(repeated, 'linear/repeated');
  assertSourceBalanced(repeated, 'linear/repeated');
  assert.equal(repeated.result, 0);
  assert.equal(repeated.steps.at(-1).event, 'found');

  const empty = generateLinearSearchSteps({ array: [], target: 4 });
  assertStepInvariants(empty, 'linear/empty');
  assert.equal(empty.result, -1);
  assert.equal(empty.steps.length, 2);

  const missing = generateLinearSearchSteps({ array: [1, 3, 5], target: 4 });
  assert.equal(missing.result, -1);
  assert.equal(missing.steps.filter(step => step.event === 'compare').length, 3);

  const input = [4, 2, 4];
  generateLinearSearchSteps({ array: input, target: 4 });
  assert.deepEqual(input, [4, 2, 4], '不应修改入参');

  assert.throws(() => generateLinearSearchSteps({ array: new Array(5000).fill(0), target: 0 }), /不能超过/);
});

test('分块查找：索引取真实块最大值，块内命中与未命中', () => {
  const blocks = [[3, 1], [8, 5]];
  const hit = generateBlockSearchSteps({ blocks, target: 3 });
  assertStepInvariants(hit, 'block/hit');
  assertSourceBalanced(hit, 'block/hit');
  assert.equal(hit.result, 0);
  // 索引表必须是真实最大值 3 和 8；若误用块末元素会变成 1 和 5，从而跳过第一块
  assert.deepEqual(hit.steps[0].variables.blockMaxValues, [3, 8]);
  assert.equal(hit.steps.at(-1).event, 'found');

  const miss = generateBlockSearchSteps({ blocks, target: 4 });
  assert.equal(miss.result, -1);
  assert.equal(miss.steps.at(-1).event, 'not-found');
  assert.equal(miss.steps.filter(step => step.event === 'inner-compare').length, 2, '第二块内应比较两次');

  const skipEmpty = generateBlockSearchSteps({ blocks: [[], [2], [9]], target: 9 });
  assert.equal(skipEmpty.result, 1, '空块不计入展平下标');
  assert.ok(skipEmpty.steps.some(step => step.event === 'index-skip'));

  // 块长不一致时索引仍按真实最大值工作
  const uneven = generateBlockSearchSteps({ blocks: [[9, 2, 7, 5, 1], [12], [20, 15]], target: 7 });
  assert.equal(uneven.result, 2);
  assert.deepEqual(uneven.steps[0].variables.blockMaxValues, [9, 12, 20]);

  assert.throws(() => generateBlockSearchSteps({ blocks: [[5], [3]], target: 5 }), /值域重叠/);

  // 规模校验必须先于展开：15 万个元素的块要直接拒绝，不能靠 Math.max(...) 抛 RangeError
  assert.throws(
    () => generateBlockSearchSteps({ blocks: [Array.from({ length: 150000 }, (_, i) => i)], target: 5 }),
    /元素总数不能超过/,
  );
  assert.throws(
    () => generateBlockSearchSteps({ blocks: Array.from({ length: 100 }, () => [1]), target: 1 }),
    /块数不能超过/,
  );
  // 上限内的单个大块仍能正常求最值
  const large = generateBlockSearchSteps({ blocks: [Array.from({ length: 2000 }, (_, i) => i)], target: 1999 });
  assert.equal(large.result, 1999);
});

test('哈希线性探测：m=5 插入 4/9/14 落 4/0/1，满表后仍能查询', () => {
  const run = generateHashLinearProbingSteps({ keys: [4, 9, 14], capacity: 5, target: 14 });
  assertStepInvariants(run, 'hash-linear');
  assertSourceBalanced(run, 'hash-linear');
  assert.deepEqual(run.result, [9, 14, null, null, 4]);
  assert.equal(run.steps.at(-1).event, 'found');
  assert.equal(run.steps.at(-1).variables.searchResult, 1, '14 落在槽 1，探测顺序 4 → 0 → 1');

  const full = generateHashLinearProbingSteps({ keys: [0, 1, 2, 3], capacity: 3, target: 1 });
  assertStepInvariants(full, 'hash-linear/full');
  assert.deepEqual(full.result, [0, 1, 2]);
  const failure = full.steps.find(step => step.event === 'table-full');
  assert.ok(failure, '键 3 应记录插入失败');
  assert.equal(failure.variables.key, 3);
  assert.equal(failure.variables.emptySlots, 0);
  assert.equal(full.steps.at(-1).event, 'found', '建表失败后仍须执行查询');
  assert.equal(full.steps.at(-1).variables.searchResult, 1);

  const duplicate = generateHashLinearProbingSteps({ keys: [4, 4], capacity: 5 });
  assert.equal(duplicate.result.filter(slot => slot === 4).length, 1, '重复键不占新槽');
  assert.ok(duplicate.steps.some(step => step.event === 'duplicate'));

  assert.throws(() => generateHashLinearProbingSteps({ keys: [1], capacity: 0 }), /正整数/);
  assert.throws(() => generateHashLinearProbingSteps({ keys: [1], capacity: 2 ** 32 }), /不能超过/);
});

test('哈希平方探测：区分表已满与探测耗尽，单键失败后继续', () => {
  const run = generateHashQuadraticProbingSteps({ keys: [0, 7, 14, 21], capacity: 7 });
  assertStepInvariants(run, 'hash-quadratic');
  assertSourceBalanced(run, 'hash-quadratic');
  assert.deepEqual(run.result, [0, 7, 21, null, 14, null, null]);

  // 仍有空槽但序列耗尽：必须报 probe-exhausted 并给出剩余空槽数
  const exhausted = generateHashQuadraticProbingSteps({ keys: [0, 7, 14, 21, 28], capacity: 7 });
  assertStepInvariants(exhausted, 'hash-quadratic/exhausted');
  const exhaustedStep = exhausted.steps.find(step => step.event === 'probe-exhausted');
  assert.ok(exhaustedStep, '应记录探测耗尽');
  assert.equal(exhaustedStep.variables.emptySlots, 3, '耗尽时仍有 3 个空槽');
  assert.ok(!exhausted.steps.some(step => step.event === 'table-full'));

  // 真正写满：必须报 table-full，不能归因为探测局限
  const full = generateHashQuadraticProbingSteps({ keys: [0, 1, 2, 3], capacity: 3 });
  assertStepInvariants(full, 'hash-quadratic/full');
  assert.deepEqual(full.result, [0, 1, 2]);
  const fullStep = full.steps.find(step => step.event === 'table-full');
  assert.ok(fullStep, '空槽为 0 时应记为 table-full');
  assert.equal(fullStep.variables.emptySlots, 0);
  assert.ok(!full.steps.some(step => step.event === 'probe-exhausted'));

  // 单键失败后继续插入并查询
  const keepGoing = generateHashQuadraticProbingSteps({ keys: [0, 7, 14, 21, 28, 3], capacity: 7, target: 3 });
  assertStepInvariants(keepGoing, 'hash-quadratic/keep-going');
  assert.equal(keepGoing.result[3], 3, '键 3 应继续插入槽 3');
  assert.ok(keepGoing.steps.some(step => step.event === 'probe-exhausted' && step.variables.key === 28));
  assert.equal(keepGoing.steps.at(-1).event, 'found');
  assert.equal(keepGoing.steps.at(-1).variables.searchResult, 3);

  assert.throws(() => generateHashQuadraticProbingSteps({ keys: [1], capacity: 4 }), /奇素数/);
});

test('哈希双散列：m=5 插入 1/6/11 落 1/4/0，非素数容量被拒绝', () => {
  const run = generateHashDoubleHashingSteps({ keys: [1, 6, 11], capacity: 5 });
  assertStepInvariants(run, 'hash-double');
  assertSourceBalanced(run, 'hash-double');
  assert.deepEqual(run.result, [11, 1, null, null, 6]);

  const placed = run.steps.filter(step => step.event === 'place');
  assert.deepEqual(placed.map(step => step.variables.slot), [1, 4, 0]);
  assert.deepEqual(placed.map(step => step.variables.h2), [2, 3, 4], '步长应为 1 + k mod (m-1)');

  // 容量 4 与步长 2 不互素，只在槽 1、3 循环；必须在校验阶段拒绝，而不是误报满表
  assert.throws(() => generateHashDoubleHashingSteps({ keys: [1, 3, 13], capacity: 4 }), /素数/);
  assert.throws(() => generateHashDoubleHashingSteps({ keys: [1], capacity: 1 }), /不小于 2/);

  // 合法素数容量下建表失败后仍能查询已有键
  const full = generateHashDoubleHashingSteps({ keys: [0, 1, 2, 3], capacity: 3, target: 1 });
  assertStepInvariants(full, 'hash-double/full');
  assert.ok(full.steps.some(step => step.event === 'table-full'));
  assert.equal(full.steps.at(-1).event, 'found');
  assert.equal(full.steps.at(-1).variables.searchResult, 1);
});

test('哈希拉链法：同桶尾插，链内比较次数与空桶命中', () => {
  const run = generateHashChainingSteps({ keys: [1, 6], bucketCount: 5, target: 6 });
  assertStepInvariants(run, 'hash-chaining');
  assertSourceBalanced(run, 'hash-chaining');
  assert.deepEqual(run.result[1], [1, 6], '同义词挂在同一桶，尾插顺序 1 → 6');
  assert.equal(run.steps.at(-1).event, 'found');
  assert.equal(run.steps.at(-1).variables.compared, 2, '查 6 需两次链内比较');

  const emptyBucket = generateHashChainingSteps({ keys: [1, 6], bucketCount: 5, target: 7 });
  assert.equal(emptyBucket.steps.at(-1).event, 'not-found');
  assert.equal(emptyBucket.steps.at(-1).variables.compared, 0, '空桶直接未命中，不需比较');

  const duplicate = generateHashChainingSteps({ keys: [1, 1], bucketCount: 5 });
  assert.deepEqual(duplicate.result[1], [1], '重复键不重复入链');
});

test('平衡二叉树：四种失衡各触发对应旋转，旋转快照保留完整树', () => {
  const cases = [
    { keys: [3, 2, 1], rotation: 'LL' },
    { keys: [1, 2, 3], rotation: 'RR' },
    { keys: [3, 1, 2], rotation: 'LR' },
    { keys: [1, 3, 2], rotation: 'RL' },
  ];
  for (const { keys, rotation } of cases) {
    const run = generateAvlSteps({ keys });
    assertStepInvariants(run, `avl/${rotation}`);
    assertSourceBalanced(run, `avl/${rotation}`);
    assert.equal(run.result.root, 2, `${rotation}: 根应为 2`);

    const rotations = run.steps.filter(step => step.event === 'rotate').map(step => step.variables.rotation);
    assert.ok(rotations.includes(rotation), `${rotation}: 未记录对应旋转，实际 ${rotations.join(',')}`);

    // 每个旋转帧（含内旋）都必须能从快照根访问全部已插入结点
    const inserted = new Set();
    for (const step of run.steps) {
      if (typeof step.variables.key === 'number') inserted.add(step.variables.key);
      if (step.event === 'rotate' || step.event === 'rotate-inner') {
        assertSnapshotComplete(step.variables, [...inserted], `${rotation}/${step.variables.rotation}`);
      }
    }

    for (const item of run.result.nodes) assert.ok(Math.abs(item.bf) <= 1, `${rotation}: 结点 ${item.key} 平衡因子超限`);
  }

  const search = generateAvlSteps({ keys: [3, 1, 2], target: 3 });
  assert.equal(search.steps.at(-1).event, 'found');
  assert.deepEqual(search.result.path, [2, 3], 'LR 旋转后查找 3 的路径应为 2 → 3');

  assert.throws(() => generateAvlSteps({ keys: Array.from({ length: 100 }, (_, i) => i) }), /不能超过/, '键数上限应先于快照生成');
});

test('红黑树：旋转与变色样例，插入后始终满足红黑性质', () => {
  const rotate = generateRedBlackSteps({ keys: [10, 5, 1] });
  assertStepInvariants(rotate, 'rb/rotate');
  assertSourceBalanced(rotate, 'rb/rotate');
  assert.equal(rotate.result.root, 5, '[10,5,1] 旋转后根为 5');
  assert.equal(rotate.result.nodes.find(item => item.key === 5).color, 'B');
  assert.equal(rotate.result.nodes.find(item => item.key === 1).color, 'R');
  assert.equal(rotate.result.nodes.find(item => item.key === 10).color, 'R');

  const recolor = generateRedBlackSteps({ keys: [10, 5, 15, 1] });
  assertStepInvariants(recolor, 'rb/recolor');
  assert.equal(recolor.result.root, 10);
  assert.equal(recolor.result.nodes.find(item => item.key === 5).color, 'B');
  assert.equal(recolor.result.nodes.find(item => item.key === 15).color, 'B');
  assert.equal(recolor.result.nodes.find(item => item.key === 1).color, 'R');
  assert.ok(recolor.steps.some(step => step.variables.fixupCase === 'case1-uncle-red'));

  assert.deepEqual(validateRedBlack(null), { rootIsBlack: true, noRedRed: true, blackHeight: 1, blackHeightConsistent: true });

  const bigger = generateRedBlackSteps({ keys: [7, 3, 18, 10, 22, 8, 11, 26, 2, 6, 13] });
  const settled = bigger.steps.filter(step => step.event === 'root-black');
  assert.equal(settled.length, 11, '每个键插入后都应完成一次根置黑');
  for (const step of settled) {
    assert.ok(step.variables.checked.rootIsBlack, '插入结束后根必须为黑');
    assert.ok(step.variables.checked.noRedRed, '插入结束后不得出现红红相邻');
    assert.ok(step.variables.checked.blackHeightConsistent, '插入结束后各路黑高必须一致');
  }
});

test('快照互相独立：回看早期步骤不会被后续插入污染', () => {
  const run = generateAvlSteps({ keys: [3, 2, 1] });
  const firstInsert = run.steps.find(step => step.event === 'insert');
  assert.equal(firstInsert.variables.nodes.length, 1, '首步只应有 1 个结点');
  assert.equal(run.steps.at(-1).variables.nodes.length, 3);

  const hash = generateHashLinearProbingSteps({ keys: [4, 9], capacity: 5 });
  const firstProbe = hash.steps.find(step => step.event === 'probe');
  assert.equal(firstProbe.variables.table.filter(slot => slot !== null).length, 0, '首次探测时表还是空的');
});
