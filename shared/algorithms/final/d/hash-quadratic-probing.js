// shared/algorithms/final/d/hash-quadratic-probing.js
// D 包 · 哈希平方探测：冲突时按 (h(k)+i²) mod m 探测，最多 m 次。
// 正平方增量不保证遍历全表：失败时按实际空槽数区分「表已满」与「探测序列耗尽」。
// 某个键失败只记录该键的失败步骤，不中断后续键和查询。
import { createStepFactory, isPrime, mod, requireCapacity, requireKeyList, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-hash-quadratic-c-v1';

const SOURCE_LINES = [
  { lineId: 'insert-start', text: 'int hash_insert(long long table[], char used[], int m, long long key) {' },
  { lineId: 'insert-hash', text: '  int h = key % m;' },
  { lineId: 'insert-normalize', text: '  if (h < 0) h += m;' },
  { lineId: 'insert-loop', text: '  for (int i = 0; i < m; i++) {' },
  { lineId: 'insert-slot', text: '    int slot = (h + i * i) % m;' },
  { lineId: 'insert-empty', text: '    if (!used[slot]) {' },
  { lineId: 'insert-place', text: '      table[slot] = key;' },
  { lineId: 'insert-mark', text: '      used[slot] = 1;' },
  { lineId: 'insert-return', text: '      return slot;' },
  { lineId: 'insert-empty-end', text: '    }' },
  { lineId: 'insert-same', text: '    if (table[slot] == key) {' },
  { lineId: 'insert-duplicate', text: '      return -1; /* 重复键 */' },
  { lineId: 'insert-same-end', text: '    }' },
  { lineId: 'insert-loop-end', text: '  }' },
  { lineId: 'insert-exhausted', text: '  return -2; /* 探测序列耗尽，表中可能仍有空槽 */' },
  { lineId: 'insert-end', text: '}' },
  { lineId: 'search-start', text: 'int hash_search(long long table[], char used[], int m, long long key) {' },
  { lineId: 'search-hash', text: '  int h = key % m;' },
  { lineId: 'search-normalize', text: '  if (h < 0) h += m;' },
  { lineId: 'search-loop', text: '  for (int i = 0; i < m; i++) {' },
  { lineId: 'search-slot', text: '    int slot = (h + i * i) % m;' },
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
 * 生成哈希平方探测的建表与查找步骤。
 * @param {{ keys: number[], capacity: number, target?: number }} input
 *   容量取奇素数（按任务单约定），否则正平方序列的覆盖性无法保证，直接抛 TypeError。
 */
export function generateHashQuadraticProbingSteps(input) {
  const keys = requireKeyList(input?.keys ?? [], 'keys');
  const capacity = requireCapacity(input?.capacity, 'capacity');
  if (!isPrime(capacity) || capacity === 2) {
    throw new TypeError(`平方探测容量必须为奇素数，${capacity} 不满足`);
  }
  const hasTarget = input?.target !== undefined && input?.target !== null;
  const target = hasTarget ? requireSafeInteger(input.target, 'target') : null;

  const table = Array(capacity).fill(null);
  const used = Array(capacity).fill(false);
  const { steps, add } = createStepFactory('hash-quadratic-probing', SOURCE_VERSION);
  const view = extra => ({ capacity, table: [...table], used: [...used], formula: '(h + i*i) mod m', ...extra });

  add({
    event: 'init', lineId: 'insert-start', target: target ?? undefined,
    variables: view({ phase: 'insert', key: null, keyIndex: null, hash: null, slot: null, probeIndex: null, probes: 0 }),
    description: `建立容量 ${capacity} 的空表。平方探测第 i 次尝试的槽位为 (h + i²) mod ${capacity}，增量依次为 1、4、9、16……`,
  });

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const key = keys[keyIndex];
    const hash = mod(key, capacity);
    const visited = [];
    let probes = 0;
    let settled = false;

    add({
      event: 'calc-hash', lineId: 'insert-normalize', target: target ?? undefined,
      variables: view({ phase: 'insert', key, keyIndex, hash, slot: null, probeIndex: null, probes, visited: [] }),
      description: `键 ${key} 的初始槽 h = ${key} mod ${capacity} = ${hash}。`,
    });

    for (let i = 0; i < capacity; i++) {
      const slot = mod(hash + i * i, capacity);
      probes++;
      const again = visited.includes(slot);
      visited.push(slot);
      const occupied = used[slot];
      const occupant = table[slot];

      add({
        event: 'probe', lineId: 'insert-slot', target: target ?? undefined,
        variables: view({ phase: 'insert', key, keyIndex, hash, slot, probeIndex: i, probes, offset: i * i, visited: [...visited] }),
        description: `第 ${i + 1} 次探测：偏移 ${i}² = ${i * i}，槽 ${slot}${again ? '（该槽之前已访问过）' : ''}，${occupied ? `已被 ${occupant} 占用，继续。` : '为空槽。'}`,
      });

      if (!occupied) {
        table[slot] = key;
        used[slot] = true;
        settled = true;
        add({
          event: 'place', lineId: 'insert-place', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, hash, slot, probeIndex: i, probes, visited: [...visited] }),
          description: `键 ${key} 放入槽 ${slot}，共探测 ${probes} 次。`,
        });
        break;
      }

      if (occupant === key) {
        settled = true;
        add({
          event: 'duplicate', lineId: 'insert-duplicate', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, hash, slot, probeIndex: i, probes, visited: [...visited] }),
          description: `槽 ${slot} 已存相同键 ${key}，重复键不再占新槽。`,
        });
        break;
      }
    }

    if (!settled) {
      const emptyCount = used.filter(item => !item).length;
      if (emptyCount === 0) {
        add({
          event: 'table-full', lineId: 'insert-exhausted', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, hash, slot: null, probeIndex: capacity, probes, visited: [...visited], emptySlots: 0 }),
          description: `表已满（空槽 0 个），键 ${key} 无处可放，插入失败；后续键与查询继续执行。`,
        });
      } else {
        add({
          event: 'probe-exhausted', lineId: 'insert-exhausted', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, hash, slot: null, probeIndex: capacity, probes, visited: [...visited], emptySlots: emptyCount }),
          description: `键 ${key} 探测 ${capacity} 次后序列耗尽，插入失败。表中仍有 ${emptyCount} 个空槽，但平方增量到不了——这是正平方探测的固有局限，与「表已满」是两回事。`,
        });
      }
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
      const slot = mod(hash + i * i, capacity);
      probes++;
      if (!used[slot]) {
        add({
          event: 'not-found', lineId: 'search-empty-return', target, done: true, result: [...table],
          variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot, probeIndex: i, probes, searchResult: -1 }),
          description: `第 ${i + 1} 次探测到空槽 ${slot}，由于插入时也会停在这个位置，可断定 ${target} 不在表中，返回 -1。`,
        });
        return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      if (table[slot] === target) {
        add({
          event: 'found', lineId: 'search-same-return', target, done: true, result: [...table],
          variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot, probeIndex: i, probes, searchResult: slot }),
          description: `第 ${i + 1} 次探测命中槽 ${slot}，值为 ${target}，返回 ${slot}。`,
        });
        return { steps, result: [...table], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      add({
        event: 'probe', lineId: 'search-slot', target,
        variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot, probeIndex: i, probes }),
        description: `第 ${i + 1} 次探测槽 ${slot}，值为 ${table[slot]}，不是目标。`,
      });
    }

    add({
      event: 'not-found', lineId: 'search-not-found', target, done: true, result: [...table],
      variables: view({ phase: 'search', key: target, keyIndex: null, hash, slot: null, probeIndex: capacity, probes, searchResult: -1 }),
      description: '探测序列耗尽仍未命中，返回 -1。',
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
