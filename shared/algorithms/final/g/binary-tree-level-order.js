export const SOURCE_VERSION = 'binary-tree-level-order-c-v1';
export const MAX_NODES = 64;
export const DEFAULT_INPUT = {
  root: 'A',
  nodes: [
    { id: 'A', left: 'B', right: 'C' },
    { id: 'B', left: null, right: 'D' },
    { id: 'C', left: null, right: null },
    { id: 'D', left: null, right: null },
  ],
};

export const SOURCE_LINES = [
  ['limit', '#define MAX_NODES 64'],
  ['node', 'typedef struct { int left, right; } Node;'],
  ['entry', 'typedef struct { int node, level; } Entry;'],
  ['function', 'int level_order(const Node nodes[], int root, Entry output[]) {'],
  ['init', '  Entry queue[MAX_NODES];'],
  ['indices', '  int head = 0, tail = 0, count = 0;'],
  ['root-check', '  if (root >= 0)'],
  ['enqueue-root', '    queue[tail++] = (Entry){root, 1};'],
  ['loop', '  while (head < tail) {'],
  ['dequeue', '    Entry current = queue[head++];'],
  ['visit', '    output[count++] = current;'],
  ['left-child', '    int left = nodes[current.node].left;'],
  ['left-check', '    if (left >= 0)'],
  ['enqueue-left', '      queue[tail++] = (Entry){left, current.level + 1};'],
  ['right-child', '    int right = nodes[current.node].right;'],
  ['right-check', '    if (right >= 0)'],
  ['enqueue-right', '      queue[tail++] = (Entry){right, current.level + 1};'],
  ['loop-end', '  }'],
  ['done', '  return count;'],
  ['function-end', '}'],
].map(([lineId, text]) => ({ lineId, text }));

function normalizeTree(input) {
  if (!input || !Array.isArray(input.nodes) || input.nodes.length > MAX_NODES) {
    throw new TypeError('请输入包含 root 和 nodes 的二叉树，最多允许 64 个节点。');
  }

  const { root } = input;
  const nodes = new Map();
  for (const node of input.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id.trim() || nodes.has(node.id)) {
      throw new TypeError('节点必须有非空且唯一的字符串 ID。');
    }
    const { id, left = null, right = null } = node;
    nodes.set(id, { id, left, right });
  }
  if (nodes.size === 0 ? root !== null : !nodes.has(root)) {
    throw new TypeError('空树的 root 必须为 null，非空树的 root 必须引用已有节点。');
  }

  const visited = new Set();
  const pending = root === null ? [] : [root];
  while (pending.length) {
    const id = pending.pop();
    if (!nodes.has(id) || visited.has(id)) {
      throw new TypeError('孩子必须引用已有节点，且不能形成环或被重复引用。');
    }
    visited.add(id);
    const { left, right } = nodes.get(id);
    if (right !== null) pending.push(right);
    if (left !== null) pending.push(left);
  }
  if (visited.size !== nodes.size) {
    throw new TypeError('所有节点都必须能从根到达。');
  }
  return nodes;
}

export function generateBinaryTreeLevelOrderSteps(input) {
  const nodes = normalizeTree(input);
  const { root } = input;
  const steps = [];
  const queue = [];
  const order = [];
  const levels = [];
  let head = 0;
  let current = null;

  function record(event, lineId, description, queuedNode = null) {
    const done = event === 'done';
    steps.push({
      schemaVersion: '1.0',
      algorithm: 'binary-tree-level-order',
      stepIndex: steps.length,
      event,
      sourceVersion: SOURCE_VERSION,
      lineId,
      description,
      variables: {
        root,
        nodes: Array.from(nodes.values(), (node) => ({ ...node })),
        queue: queue.slice(head).map((entry) => ({ ...entry })),
        currentNode: current?.id ?? null,
        level: current?.level ?? queuedNode?.level ?? null,
        queuedNode: queuedNode ? { ...queuedNode } : null,
        order: [...order],
        levels: levels.map((ids) => [...ids]),
      },
      done,
      result: done ? [...order] : null,
    });
  }

  record('init', 'init', '初始化队列和访问序列。');
  if (root !== null) {
    const entry = { id: root, level: 1 };
    queue.push(entry);
    record('enqueue', 'enqueue-root', `根节点 ${root} 在第 1 层，加入队尾。`, entry);
  }

  while (head < queue.length) {
    current = queue[head++];
    const { id, level } = current;
    record('dequeue', 'dequeue', `从队首取出第 ${level} 层的节点 ${id}。`);
    order.push(id);
    const levelIndex = level - 1;
    levels[levelIndex] ??= [];
    levels[levelIndex].push(id);
    record('visit', 'visit', `访问 ${id} 并追加到访问序列。`);

    const node = nodes.get(id);
    for (const side of ['left', 'right']) {
      const child = node[side];
      if (child === null) continue;
      const entry = { id: child, level: level + 1 };
      queue.push(entry);
      const sideName = side === 'left' ? '左' : '右';
      record('enqueue', `enqueue-${side}`, `把 ${id} 的${sideName}孩子 ${child} 加入队尾。`, entry);
    }
  }

  current = null;
  record('done', 'done', order.length ? '队列已空，层序遍历结束。' : '空树没有可访问的节点。');
  return { steps, result: order, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}
