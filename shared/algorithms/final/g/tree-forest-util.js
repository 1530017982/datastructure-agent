import { MAX_NODES } from './binary-tree-util.js';

export const DEFAULT_FOREST = {
  roots: ['A', 'D'],
  nodes: [{ id: 'A', children: ['B', 'C'] }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
};

export function normalizeForest(input) {
  if (!input || !Array.isArray(input.roots) || !Array.isArray(input.nodes) ||
      input.nodes.length > MAX_NODES || input.roots.length > input.nodes.length) {
    throw new TypeError('请输入有序森林 roots 和 nodes，最多允许 64 个节点。');
  }
  const nodes = new Map();
  for (const node of input.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id.trim() || nodes.has(node.id)) {
      throw new TypeError('森林节点必须有非空且唯一的字符串 ID。');
    }
    const { id, children = [] } = node;
    if (!Array.isArray(children) || children.length > input.nodes.length) {
      throw new TypeError('children 必须是有序的孩子 ID 数组。');
    }
    nodes.set(id, { id, children: [...children] });
  }
  const seen = new Set();
  const pending = [...input.roots];
  while (pending.length) {
    const id = pending.pop();
    if (!nodes.has(id) || seen.has(id)) throw new TypeError('森林引用必须有效，且节点不能重复访问。');
    seen.add(id);
    pending.push(...nodes.get(id).children);
  }
  if (seen.size !== nodes.size) throw new TypeError('森林所有节点必须从某个根可达。');
  return nodes;
}
