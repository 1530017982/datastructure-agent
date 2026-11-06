// shared/algorithms/final/d/hash-chaining.js
// D 包 · 哈希拉链法：同义词挂在同一桶的链表上，桶内尾插。
// 查找时先定位桶，再沿链逐个比较；空桶直接判定未命中。
import { createStepFactory, mod, requireCapacity, requireKeyList, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-hash-chaining-c-v1';

const SOURCE_LINES = [
  { lineId: 'include', text: '#include <stdlib.h>' },
  { lineId: 'node-type', text: 'typedef struct Node {' },
  { lineId: 'node-fields', text: '  long long key; struct Node *next;' },
  { lineId: 'node-end', text: '} Node;' },
  { lineId: 'insert-start', text: 'int hash_insert(Node *buckets[], int m, long long key) {' },
  { lineId: 'insert-hash', text: '  int h = key % m;' },
  { lineId: 'insert-normalize', text: '  if (h < 0) h += m;' },
  { lineId: 'insert-scan', text: '  for (Node *p = buckets[h]; p; p = p->next) {' },
  { lineId: 'insert-same', text: '    if (p->key == key) {' },
  { lineId: 'insert-duplicate', text: '      return -1;' },
  { lineId: 'insert-same-end', text: '    }' },
  { lineId: 'insert-scan-end', text: '  }' },
  { lineId: 'insert-new', text: '  Node *node = malloc(sizeof(Node));' },
  { lineId: 'insert-fill', text: '  node->key = key; node->next = NULL;' },
  { lineId: 'insert-first', text: '  if (!buckets[h]) {' },
  { lineId: 'insert-first-link', text: '    buckets[h] = node; return h;' },
  { lineId: 'insert-first-end', text: '  }' },
  { lineId: 'insert-tail-init', text: '  Node *p = buckets[h];' },
  { lineId: 'insert-tail-loop', text: '  while (p->next) {' },
  { lineId: 'insert-tail-next', text: '    p = p->next;' },
  { lineId: 'insert-tail-loop-end', text: '  }' },
  { lineId: 'insert-tail', text: '  p->next = node; return h;' },
  { lineId: 'insert-end', text: '}' },
  { lineId: 'search-start', text: 'int hash_search(Node *buckets[], int m, long long key) {' },
  { lineId: 'search-hash', text: '  int h = key % m;' },
  { lineId: 'search-normalize', text: '  if (h < 0) h += m;' },
  { lineId: 'search-empty', text: '  if (!buckets[h]) {' },
  { lineId: 'search-empty-return', text: '    return -1;' },
  { lineId: 'search-empty-end', text: '  }' },
  { lineId: 'search-loop', text: '  for (Node *p = buckets[h]; p; p = p->next) {' },
  { lineId: 'search-same', text: '    if (p->key == key) {' },
  { lineId: 'search-same-return', text: '      return h;' },
  { lineId: 'search-same-end', text: '    }' },
  { lineId: 'search-loop-end', text: '  }' },
  { lineId: 'search-not-found', text: '  return -1;' },
  { lineId: 'search-end', text: '}' },
];

/**
 * 生成哈希拉链法的建表与查找步骤。
 * @param {{ keys: number[], bucketCount: number, target?: number }} input
 *   桶内尾插；相同键重复插入时不再新增结点。
 */
export function generateHashChainingSteps(input) {
  const keys = requireKeyList(input?.keys ?? [], 'keys');
  const bucketCount = requireCapacity(input?.bucketCount, 'bucketCount');
  const hasTarget = input?.target !== undefined && input?.target !== null;
  const target = hasTarget ? requireSafeInteger(input.target, 'target') : null;

  const buckets = Array.from({ length: bucketCount }, () => []);
  const { steps, add } = createStepFactory('hash-chaining', SOURCE_VERSION);
  const view = extra => ({ bucketCount, buckets: buckets.map(chain => [...chain]), ...extra });

  add({
    event: 'init', lineId: 'node-type', target: target ?? undefined,
    variables: view({ phase: 'insert', key: null, keyIndex: null, bucketIndex: null, chain: [], position: null, compared: 0 }),
    description: `建立 ${bucketCount} 个空桶，每个桶是一条链表；冲突的键追加到同一条链上，不占用其他桶。`,
  });

  for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
    const key = keys[keyIndex];
    const bucketIndex = mod(key, bucketCount);
    const chain = buckets[bucketIndex];
    let compared = 0;
    let duplicate = false;

    add({
      event: 'calc-hash', lineId: 'insert-normalize', target: target ?? undefined,
      variables: view({ phase: 'insert', key, keyIndex, bucketIndex, chain: [...chain], position: null, compared: 0 }),
      description: `键 ${key} 定位到桶 ${bucketIndex}（${key} mod ${bucketCount} = ${bucketIndex}），链上现有 ${chain.length} 个结点。`,
    });

    for (let position = 0; position < chain.length; position++) {
      compared++;
      const nodeKey = chain[position];
      add({
        event: 'compare', lineId: 'insert-same', target: target ?? undefined,
        variables: view({ phase: 'insert', key, keyIndex, bucketIndex, chain: [...chain], position, compared }),
        description: `比较链上第 ${position + 1} 个结点 ${nodeKey} 与 ${key}：${nodeKey === key ? '相同，按重复键处理。' : '不同，继续沿链向后。'}`,
      });
      if (nodeKey === key) {
        duplicate = true;
        add({
          event: 'duplicate', lineId: 'insert-duplicate', target: target ?? undefined,
          variables: view({ phase: 'insert', key, keyIndex, bucketIndex, chain: [...chain], position, compared }),
          description: `桶 ${bucketIndex} 的链上已存在 ${key}，不再重复插入。`,
        });
        break;
      }
    }

    if (!duplicate) {
      chain.push(key);
      add({
        event: 'insert-tail', lineId: 'insert-tail', target: target ?? undefined,
        variables: view({ phase: 'insert', key, keyIndex, bucketIndex, chain: [...chain], position: chain.length - 1, compared }),
        description: `把 ${key} 追加到桶 ${bucketIndex} 的链尾，链变为 ${chain.join(' → ')}。`,
      });
    }
  }

  if (hasTarget) {
    const bucketIndex = mod(target, bucketCount);
    const chain = buckets[bucketIndex];

    add({
      event: 'calc-hash', lineId: 'search-normalize', target,
      variables: view({ phase: 'search', key: target, keyIndex: null, bucketIndex, chain: [...chain], position: null, compared: 0 }),
      description: `查找 ${target}：先定位桶 ${bucketIndex}，链上有 ${chain.length} 个结点。`,
    });

    if (chain.length === 0) {
      add({
        event: 'not-found', lineId: 'search-empty-return', target, done: true, result: buckets.map(item => [...item]),
        variables: view({ phase: 'search', key: target, keyIndex: null, bucketIndex, chain: [], position: null, compared: 0, searchResult: -1 }),
        description: `桶 ${bucketIndex} 是空桶，无需比较即可判定 ${target} 不在表中，返回 -1。`,
      });
      return { steps, result: buckets.map(item => [...item]), sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
    }

    let compared = 0;
    for (let position = 0; position < chain.length; position++) {
      compared++;
      const nodeKey = chain[position];
      add({
        event: 'compare', lineId: 'search-same', target,
        variables: view({ phase: 'search', key: target, keyIndex: null, bucketIndex, chain: [...chain], position, compared }),
        description: `第 ${compared} 次比较：链上结点 ${nodeKey} 与 ${target}${nodeKey === target ? '相同，命中。' : '不同，继续向后。'}`,
      });
      if (nodeKey === target) {
        add({
          event: 'found', lineId: 'search-same-return', target, done: true, result: buckets.map(item => [...item]),
          variables: view({ phase: 'search', key: target, keyIndex: null, bucketIndex, chain: [...chain], position, compared, searchResult: bucketIndex }),
          description: `在桶 ${bucketIndex} 的链上第 ${position + 1} 个结点命中 ${target}，共比较 ${compared} 次，返回桶号 ${bucketIndex}。`,
        });
        return { steps, result: buckets.map(item => [...item]), sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
    }

    add({
      event: 'not-found', lineId: 'search-not-found', target, done: true, result: buckets.map(item => [...item]),
      variables: view({ phase: 'search', key: target, keyIndex: null, bucketIndex, chain: [...chain], position: null, compared, searchResult: -1 }),
      description: `整条链比较完（${compared} 次）仍未命中，返回 -1。`,
    });
    return { steps, result: buckets.map(item => [...item]), sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  add({
    event: 'done', lineId: 'insert-end', done: true, result: buckets.map(item => [...item]),
    variables: view({ phase: 'insert', key: null, keyIndex: null, bucketIndex: null, chain: [], position: null, compared: 0 }),
    description: `建表结束，${bucketCount} 个桶中共有 ${buckets.reduce((sum, chain) => sum + chain.length, 0)} 个结点。`,
  });
  return { steps, result: buckets.map(item => [...item]), sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}

export { SOURCE_VERSION, SOURCE_LINES };
