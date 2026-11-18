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

export function normalizeTree(input) {
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

