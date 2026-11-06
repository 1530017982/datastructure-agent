// shared/algorithms/final/d/util.js
// D 包（查找与哈希）共用的步骤工厂与输入校验。
// 步骤形状与 shared/algorithms/bubbleSort.js 一致：
// schemaVersion/algorithm/stepIndex/event/sourceVersion/lineId/variables/description/done/result，
// 数组类算法另带 array 与 target。树、哈希等结构由 variables 承载，字段待 01/02 确认接入。

export const SCHEMA_VERSION = '1.0';

/** 深拷贝快照，保证每步独立，回看不会读到后续修改。 */
export function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

/**
 * 创建步骤记录器。
 * add() 每次生成一个独立快照；stepIndex 由记录器按顺序编号，避免调用方漏号。
 */
export function createStepFactory(algorithm, sourceVersion) {
  const steps = [];

  function add({ event, lineId, description, variables = {}, array, target, done = false, result = null }) {
    const step = {
      schemaVersion: SCHEMA_VERSION,
      algorithm,
      stepIndex: steps.length,
      event,
      sourceVersion,
      lineId,
      variables: clone(variables),
      description,
      done,
      result: done ? clone(result) : null,
    };
    if (array !== undefined) step.array = clone(array);
    if (target !== undefined) step.target = target;
    steps.push(step);
    return step;
  }

  return { steps, add };
}

export function requireSafeInteger(value, name) {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} 必须是安全整数`);
  return value;
}

/** 演示用上限：容量和键列表都会参与快照复制，必须早于分配数组就拒绝过大输入。
 *  具体数值待与 01 对齐后再调整。 */
export const MAX_CAPACITY = 1024;
export const MAX_KEYS = 64;
/** 分块查找的规模上限：块数与会展开成快照的总元素数分别限制。 */
export const MAX_BLOCK_COUNT = 64;
export const MAX_BLOCK_ELEMENTS = 2048;
/** 一维数组类输入的规模上限（顺序查找）。 */
export const MAX_ARRAY_ELEMENTS = 2048;

export function isPrime(value) {
  if (!Number.isSafeInteger(value) || value < 2) return false;
  if (value % 2 === 0) return value === 2;
  for (let i = 3; i * i <= value; i += 2) if (value % i === 0) return false;
  return true;
}

export function requireCapacity(value, name = 'capacity') {
  requireSafeInteger(value, name);
  if (value < 1) throw new TypeError(`${name} 必须是正整数`);
  if (value > MAX_CAPACITY) throw new TypeError(`${name} 不能超过 ${MAX_CAPACITY}（演示上限，待与 01 对齐）`);
  return value;
}

export function requireKeyList(values, name = 'keys') {
  requireIntegerArray(values, name);
  if (values.length > MAX_KEYS) throw new TypeError(`${name} 不能超过 ${MAX_KEYS} 个（演示上限，待与 01 对齐）`);
  return values;
}

/** 分块输入校验：块数、元素总数、元素类型都在生成快照前检查，避免大输入撑爆内存。 */
export function requireBlockList(value, name = 'blocks') {
  if (!Array.isArray(value)) throw new TypeError(`${name} 必须是二维数组`);
  if (value.length > MAX_BLOCK_COUNT) throw new TypeError(`${name} 的块数不能超过 ${MAX_BLOCK_COUNT}（演示上限，待与 01 对齐）`);
  let total = 0;
  for (let i = 0; i < value.length; i++) {
    if (!Array.isArray(value[i])) throw new TypeError(`${name}[${i}] 必须是数组`);
    total += value[i].length;
    if (total > MAX_BLOCK_ELEMENTS) throw new TypeError(`${name} 的元素总数不能超过 ${MAX_BLOCK_ELEMENTS}（演示上限，待与 01 对齐）`);
  }
  return value;
}

/** 一维数组校验：先于逐元素快照限制长度。 */
export function requireArray(values, name = 'array') {
  requireIntegerArray(values, name);
  if (values.length > MAX_ARRAY_ELEMENTS) throw new TypeError(`${name} 不能超过 ${MAX_ARRAY_ELEMENTS} 个元素（演示上限，待与 01 对齐）`);
  return values;
}

export function requireIntegerArray(values, name) {
  if (!Array.isArray(values)) throw new TypeError(`${name} 必须是数组`);
  for (const value of values) requireSafeInteger(value, `${name} 的元素`);
  return values;
}

/** 空槽统一用 null 表示，避免与合法的键 0 混淆。 */
export function isEmptySlot(slot) {
  return slot === null || slot === undefined;
}

/** 归一化余数：JS 的 % 对负数返回负值，哈希取模必须落在 [0, m)。 */
export function mod(value, m) {
  return ((value % m) + m) % m;
}

/** 表内展示用：把 null 槽位写成空串以外的记号，避免被当成键 0。 */
export function formatTable(table) {
  return table.map(slot => (isEmptySlot(slot) ? '空' : String(slot))).join(' ');
}
