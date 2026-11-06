// shared/algorithms/final/d/hash-linear-probing.js
// D 包 · 哈希线性探测：冲突时按 (h(k)+i) mod m 依次后移，遇空槽或同键停止，最多探测 m 次。
// 重复键不再占槽；某个键插入失败只记录该键的失败步骤，不中断后续键和查询。
import { createStepFactory, mod, requireCapacity, requireKeyList, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-hash-linear-c-v1';

const SOURCE_LINES = [
  { lineId: 'insert-start', text: 'int hash_insert(long long table[], char used[], int m, long long key) {' },
  { lineId: 'insert-hash', text: '  int h = key % m;' },
  { lineId: 'insert-normalize', text: '  if (h < 0) h += m;' },
  { lineId: 'insert-loop', text: '  for (int i = 0; i < m; i++) {' },
  { lineId: 'insert-slot', text: '    int slot = (h + i) % m;' },
  { lineId: 'insert-empty', text: '    if (!used[slot]) {' },
  { lineId: 'insert-place', text: '      table[slot] = key;' },
  { lineId: 'insert-mark', text: '      used[slot] = 1;' },
  { lineId: 'insert-return', text: '      return slot;' },
  { lineId: 'insert-empty-end', text: '    }' },
  { lineId: 'insert-same', text: '    if (table[slot] == key) {' },
  { lineId: 'insert-duplicate', text: '      return -1;' },
  { lineId: 'insert-same-end', text: '    }' },
  { lineId: 'insert-loop-end', text: '  }' },
  { lineId: 'insert-full', text: '  return -2;' },
  { lineId: 'insert-end', text: '}' },
  { lineId: 'search-start', text: 'int hash_search(long long table[], char used[], int m, long long key) {' },
  { lineId: 'search-hash', text: '  int h = key % m;' },
  { lineId: 'search-normalize', text: '  if (h < 0) h += m;' },
  { lineId: 'search-loop', text: '  for (int i = 0; i < m; i++) {' },
  { lineId: 'search-slot', text: '    int slot = (h + i) % m;' },
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
 * 生成哈希线性探测的建表与查找步骤。
 * @param {{ keys: number[], capacity: number, target?: number }} input
 *   capacity 为 1 以上的正整数（上限见 util.MAX_CAPACITY）；target 省略时只演示建表。
 */
export function generateHashLinearProbingSteps(input) {
  const keys = requireKeyList(input?.keys ?? [], 'keys');
  const capacity = requireCapacity(input?.capacity, 'capacity');
  const hasTarget = input?.target !== undefined && input?.target !== null;
  const target = hasTarget ? requireSafeInteger(input.target, 'target') : null;

  const table = Array(capacity).fill(null);
  const used = Array(capacity).fill(false);
  const { steps, add } = createStepFactory('hash-linear-probing', SOURCE_VERSION);
  const view = extra => ({ capacity, table: [...table], used: [...used], ...extra });

  add({
    event: 'init', lineId: 'insert-start', target: target ?? undefined,
    variables: view({ phase: 'insert', key: null, keyIndex: null, hash: null, slot: null, probeIndex: null, probes: 0 }),
    description: `建立容量 ${capacity} 的空表，准备插入 ${keys.length} 个键。线性探测的增量为 1，冲突时依次检查下一个槽并回绕。`,
  });

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const key = keys[keyIndex];
    const hash = mod(key, capacity);
    let probes = 0;
    let settled = false;

    add({
      event: 'calc-hash', lineId: 'insert-normalize', target: target ?? undefined,
      variables: view({ phase: 'insert', key, keyIndex, hash, slot: null, probeIndex: null, probes }),
      description: `键 ${key} 的初始槽 h = ${key} mod ${capacity} = ${hash}。`,
    });

    for (let i = 0; i < capacity; i++) {
      const slot = mod(hash + i, capacity);
      probes++;
      const occupied = used[slot];
      const occupant = table[slot];

      add({
        event: 'probe', lineId: 'insert-slot', target: target ?? undefined,
        variables: view({ phase: 'insert', key, keyIndex, hash, slot, probeIndex: i, probes }),
        description: occupied
          ? `第 ${i + 1} 次探测槽 ${slot}，已被 ${occupant} 占用，冲突，继续后移。`
          : `第 ${i + 1} 次探测槽 ${slot}，为空槽，可以放入。`,
      });

      if (!occupied) {
        table[slot] = key;
        used[slot] = true;
        settled = true;
        add({
          event: 'place', lineId: 'insert-place', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, hash, slot, probeIndex: i, probes }),
          description: `键 ${key} 放入槽 ${slot}，共探测 ${probes} 次。`,
        });
        break;
      }

      if (occupant === key) {
        settled = true;
        add({
          event: 'duplicate', lineId: 'insert-duplicate', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, hash, slot, probeIndex: i, probes }),
          description: `槽 ${slot} 已存相同键 ${key}，按约定重复键不再占新槽。`,
        });
        break;
      }
    }

    if (!settled) {
      const emptyCount = used.filter(item => !item).length;
      add({
        event: 'table-full', lineId: 'insert-full', target: target ?? undefined,
        variables: view({ phase: 'insert', key, keyIndex, hash, slot: null, probeIndex: capacity, probes, emptySlots: emptyCount }),
        description: `键 ${key} 探测 ${capacity} 次仍未找到空槽（表内空槽 ${emptyCount} 个），该键插入失败；后续键与查询继续执行。`,
      });
    }
  }

  if (hasTarget) {
    const hash = mod(target, capacity);
    let probes = 0;

    add({
      event: 'calc-hash', lineId: 'search-normalize', target,
      variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot: null, probeIndex: null, probes }),
      description: `开始查找 ${target}，初始槽 h = ${target} mod ${capacity} = ${hash}。`,
    });

    for (let i = 0; i < capacity; i++) {
      const slot = mod(hash + i, capacity);
      probes++;
      if (!used[slot]) {
        add({
          event: 'not-found', lineId: 'search-empty-return', target, done: true, result: [...table],
          variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot, probeIndex: i, probes, searchResult: -1 }),
          description: `槽 ${slot} 为空，查找提前结束：${target} 不在表中，返回 -1。`,
        });
        return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      if (table[slot] === target) {
        add({
          event: 'found', lineId: 'search-same-return', target, done: true, result: [...table],
          variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot, probeIndex: i, probes, searchResult: slot }),
          description: `槽 ${slot} 的值等于 ${target}，命中，返回 ${slot}。`,
        });
        return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      add({
        event: 'probe', lineId: 'search-slot', target,
        variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot, probeIndex: i, probes }),
        description: `第 ${i + 1} 次探测槽 ${slot}，值为 ${table[slot]}，不是目标，继续后移。`,
      });
    }

    add({
      event: 'not-found', lineId: 'search-not-found', target, done: true, result: [...table],
      variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot: null, probeIndex: capacity, probes, searchResult: -1 }),
      description: `探测 ${capacity} 次后仍未命中，返回 -1。`,
    });
    return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  add({
    event: 'done', lineId: 'insert-end', done: true, result: [...table],
    variables: view({ phase: 'insert', key: null, keyIndex: null, hash: null, slot: null, probeIndex: null, probes: 0 }),
    description: `建表结束，表中非空槽 ${used.filter(Boolean).length} 个。`,
  });
  return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}

export { SOURCE_VERSION, SOURCE_LINES };
