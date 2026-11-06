// shared/algorithms/final/d/hash-double-hashing.js
// D 包 · 哈希双散列：冲突时用第二个哈希值做步长，按 (h1 + i×h2) mod m 探测。
// h2 取 1 + (k mod (m-1))，只有容量为素数时步长才与表长互素、遍历全表；
// 因此容量必须是素数，否则探测会在子集内循环并错误地报告"表已满"。
import { createStepFactory, isPrime, mod, requireCapacity, requireKeyList, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-hash-double-c-v1';

const SOURCE_LINES = [
  { lineId: 'insert-start', text: 'int hash_insert(long long table[], char used[], int m, long long key) {' },
  { lineId: 'insert-h1', text: '  int h1 = key % m;' },
  { lineId: 'insert-h1-normalize', text: '  if (h1 < 0) h1 += m;' },
  { lineId: 'insert-h2', text: '  int h2 = 1 + key % (m - 1);' },
  { lineId: 'insert-h2-normalize', text: '  if (h2 < 0) h2 += (m - 1);' },
  { lineId: 'insert-loop', text: '  for (int i = 0; i < m; i++) {' },
  { lineId: 'insert-slot', text: '    int slot = (h1 + i * h2) % m;' },
  { lineId: 'insert-empty', text: '    if (!used[slot]) {' },
  { lineId: 'insert-place', text: '      table[slot] = key;' },
  { lineId: 'insert-mark', text: '      used[slot] = 1;' },
  { lineId: 'insert-return', text: '      return slot;' },
  { lineId: 'insert-empty-end', text: '    }' },
  { lineId: 'insert-same', text: '    if (table[slot] == key) {' },
  { lineId: 'insert-duplicate', text: '      return -1; /* 重复键 */' },
  { lineId: 'insert-same-end', text: '    }' },
  { lineId: 'insert-loop-end', text: '  }' },
  { lineId: 'insert-full', text: '  return -2; /* 素数容量下遍历全表仍无空槽 */' },
  { lineId: 'insert-end', text: '}' },
  { lineId: 'search-start', text: 'int hash_search(long long table[], char used[], int m, long long key) {' },
  { lineId: 'search-h1', text: '  int h1 = key % m;' },
  { lineId: 'search-h1-normalize', text: '  if (h1 < 0) h1 += m;' },
  { lineId: 'search-h2', text: '  int h2 = 1 + key % (m - 1);' },
  { lineId: 'search-h2-normalize', text: '  if (h2 < 0) h2 += (m - 1);' },
  { lineId: 'search-loop', text: '  for (int i = 0; i < m; i++) {' },
  { lineId: 'search-slot', text: '    int slot = (h1 + i * h2) % m;' },
  { lineId: 'search-empty', text: '    if (!used[slot]) {' },
  { lineId: 'search-empty-return', text: '      return -1;' },
  { lineId: 'search-empty-end', text: '    }' },
  { lineId: 'search-same', text: '    if (table[slot] == key) {' },
  { lineId: 'search-same-return', text: '      return slot;' },
  { lineId: 'search-same-end', text: '    }' },
  { lineId: 'search-loop-end', text: '  }' },
  { lineId: 'search-not-found', text: '  return -1;' },
  { lineId: 'search-end', text: '}' },
];

/**
 * 生成哈希双散列的建表与查找步骤。
 * @param {{ keys: number[], capacity: number, target?: number }} input
 *   capacity 必须是素数且不小于 2；非素数会抛 TypeError（否则探测不遍历全表）。
 */
export function generateHashDoubleHashingSteps(input) {
  const keys = requireKeyList(input?.keys ?? [], 'keys');
  const capacity = requireCapacity(input?.capacity, 'capacity');
  if (capacity < 2) throw new TypeError('双散列容量必须不小于 2（h2 以 m-1 为模数）');
  if (!isPrime(capacity)) {
    throw new TypeError(`双散列容量必须为素数，${capacity} 不是素数：h2 与表长可能不互素，探测会在部分槽位内循环`);
  }
  const hasTarget = input?.target !== undefined && input?.target !== null;
  const target = hasTarget ? requireSafeInteger(input.target, 'target') : null;

  const table = Array(capacity).fill(null);
  const used = Array(capacity).fill(false);
  const step = value => 1 + mod(value, capacity - 1);

  const { steps, add } = createStepFactory('hash-double-hashing', SOURCE_VERSION);
  const view = extra => ({ capacity, table: [...table], used: [...used], formula: '(h1 + i*h2) mod m', ...extra });

  add({
    event: 'init', lineId: 'insert-start', target: target ?? undefined,
    variables: view({ phase: 'insert', key: null, keyIndex: null, h1: null, h2: null, slot: null, probeIndex: null, probes: 0 }),
    description: `建立容量 ${capacity} 的空表（素数容量保证步长与表长互素）。步长由第二个哈希给出：h2 = 1 + (k mod ${capacity - 1})，不同键的步长可以不同。`,
  });

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const key = keys[keyIndex];
    const h1 = mod(key, capacity);
    const h2 = step(key);
    let probes = 0;
    let settled = false;

    add({
      event: 'calc-hash', lineId: 'insert-h2', target: target ?? undefined,
      variables: view({ phase: 'insert', key, keyIndex, h1, h2, slot: null, probeIndex: null, probes }),
      description: `键 ${key}：h1 = ${key} mod ${capacity} = ${h1}；h2 = 1 + (${key} mod ${capacity - 1}) = ${h2}，即每次后移 ${h2} 个槽。`,
    });

    for (let i = 0; i < capacity; i++) {
      const slot = mod(h1 + i * h2, capacity);
      probes++;
      const occupied = used[slot];
      const occupant = table[slot];

      add({
        event: 'probe', lineId: 'insert-slot', target: target ?? undefined,
        variables: view({ phase: 'insert', key, keyIndex, h1, h2, slot, probeIndex: i, probes }),
        description: `第 ${i + 1} 次探测：(${h1} + ${i}×${h2}) mod ${capacity} = 槽 ${slot}，${occupied ? `已被 ${occupant} 占用，继续按步长 ${h2} 后移。` : '为空槽。'}`,
      });

      if (!occupied) {
        table[slot] = key;
        used[slot] = true;
        settled = true;
        add({
          event: 'place', lineId: 'insert-place', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, h1, h2, slot, probeIndex: i, probes }),
          description: `键 ${key} 放入槽 ${slot}，共探测 ${probes} 次。`,
        });
        break;
      }

      if (occupant === key) {
        settled = true;
        add({
          event: 'duplicate', lineId: 'insert-duplicate', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, h1, h2, slot, probeIndex: i, probes }),
          description: `槽 ${slot} 已存相同键 ${key}，重复键不再占新槽。`,
        });
        break;
      }
    }

    if (!settled) {
      const emptyCount = used.filter(item => !item).length;
      add({
        event: 'table-full', lineId: 'insert-full', target: target ?? undefined,
        variables: view({ phase: 'insert', key, keyIndex, h1, h2, slot: null, probeIndex: capacity, probes, emptySlots: emptyCount }),
        description: `探测 ${capacity} 次仍无空槽，键 ${key} 插入失败（表内空槽 ${emptyCount} 个）。容量为素数时步长与表长互素，走到这里说明表确实已满；后续键与查询继续执行。`,
      });
    }
  }

  if (hasTarget) {
    const h1 = mod(target, capacity);
    const h2 = step(target);
    let probes = 0;

    add({
      event: 'calc-hash', lineId: 'search-h2', target,
      variables: view({ phase: 'search', key: target, keyIndex: null, h1, h2, slot: null, probeIndex: null, probes }),
      description: `查找 ${target}：h1 = ${h1}，h2 = ${h2}，按同一组参数复现探测序列。`,
    });

    for (let i = 0; i < capacity; i++) {
      const slot = mod(h1 + i * h2, capacity);
      probes++;
      if (!used[slot]) {
        add({
          event: 'not-found', lineId: 'search-empty-return', target, done: true, result: [...table],
          variables: view({ phase: 'search', key: target, keyIndex: null, h1, h2, slot, probeIndex: i, probes, searchResult: -1 }),
          description: `第 ${i + 1} 次探测遇到空槽 ${slot}，查找终止，${target} 不在表中，返回 -1。`,
        });
        return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      if (table[slot] === target) {
        add({
          event: 'found', lineId: 'search-same-return', target, done: true, result: [...table],
          variables: view({ phase: 'search', key: target, keyIndex: null, h1, h2, slot, probeIndex: i, probes, searchResult: slot }),
          description: `第 ${i + 1} 次探测命中槽 ${slot}，返回 ${slot}。`,
        });
        return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      add({
        event: 'probe', lineId: 'search-slot', target,
        variables: view({ phase: 'search', key: target, keyIndex: null, h1, h2, slot, probeIndex: i, probes }),
        description: `第 ${i + 1} 次探测槽 ${slot}，值为 ${table[slot]}，不是目标。`,
      });
    }

    add({
      event: 'not-found', lineId: 'search-not-found', target, done: true, result: [...table],
      variables: view({ phase: 'search', key: target, keyIndex: null, h1, h2, slot: null, probeIndex: capacity, probes, searchResult: -1 }),
      description: `探测 ${capacity} 次仍未命中，返回 -1。`,
    });
    return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  add({
    event: 'done', lineId: 'insert-end', done: true, result: [...table],
    variables: view({ phase: 'insert', key: null, keyIndex: null, h1: null, h2: null, slot: null, probeIndex: null, probes: 0 }),
    description: `建表结束，表中非空槽 ${used.filter(Boolean).length} 个。`,
  });
  return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}

export { SOURCE_VERSION, SOURCE_LINES };
