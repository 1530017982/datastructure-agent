import { MAX_NODES, normalizeTree } from './binary-tree-util.js';
import { DEFAULT_FOREST, normalizeForest } from './tree-forest-util.js';
import { createTrace, defineSource } from './g-trace.js';

export { MAX_NODES };
export const DEFAULT_INPUT = { mode: 'to-binary', ...DEFAULT_FOREST };
const source = defineSource('tree-forest-conversion', [
  ['node', 'typedef struct { int left, right; } Node;'],
  ['forward', 'int forest_to_binary(int n, const int roots[], int nr, const int children[], const int offsets[], Node out[]) {'],
  ['init-forward', '  int parent, i;'],
  ['clear', '  for (i = 0; i < n; ++i) out[i].left = out[i].right = -1;'],
  ['groups', '  for (parent = -1; parent < n; ++parent) {'],
  ['group', '    const int *group = parent < 0 ? roots : children + offsets[parent];'],
  ['count', '    int count = parent < 0 ? nr : offsets[parent + 1] - offsets[parent];'],
  ['left-check', '    if (parent >= 0 && count) {'],
  ['link-child', '      out[parent].left = group[0];'],
  ['left-end', '    }'],
  ['siblings', '    for (i = 1; i < count; ++i) {'],
  ['link-sibling', '      out[group[i - 1]].right = group[i];'],
  ['siblings-end', '    }'],
  ['groups-end', '  }'],
  ['done-forward', '  return nr ? roots[0] : -1;'],
  ['forward-end', '}'],
  ['reverse-helper', 'static void restore(const Node nodes[], int id, int parent, int parents[], int order[], int *count) {'],
  ['reverse-loop', '  while (id >= 0) {'],
  ['restore-link', '    parents[id] = parent;'],
  ['restore-order', '    order[(*count)++] = id;'],
  ['restore-child', '    restore(nodes, nodes[id].left, id, parents, order, count);'],
  ['restore-sibling', '    id = nodes[id].right;'],
  ['restore-loop-end', '  }'],
  ['helper-end', '}'],
  ['reverse', 'int binary_to_forest(const Node nodes[], int root, int parents[], int order[]) {'],
  ['init-reverse', '  int count = 0;'],
  ['restore-roots', '  restore(nodes, root, -1, parents, order, &count);'],
  ['done-reverse', '  return count;'],
  ['reverse-end', '}'],
]);
export const { sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES } = source;

export function generateTreeForestConversionSteps(input) {
  const { mode = 'to-binary' } = input ?? {};
  const trace = createTrace(source);
  if (mode === 'to-binary') {
    const original = normalizeForest(input);
    const { roots } = input;
    const root = roots[0] ?? null;
    const nodes = new Map(Array.from(original.keys(), id => [id, { id, left: null, right: null }]));
    const state = (currentNode = null, edge = null) => ({
      mode, roots, root, forestNodes: [...original.values()], binaryNodes: [...nodes.values()], currentNode, edge,
    });
    trace.record('init', 'init-forward', '初始化左孩子、右兄弟表示。', state());
    for (const { id, children } of [{ id: null, children: roots }, ...original.values()]) {
      if (id !== null && children.length) {
        nodes.get(id).left = children[0];
        trace.record('link', 'link-child', '用左指针连接首个孩子 ' + children[0] + '。', state(id, { from: id, to: children[0], kind: 'first-child' }));
      }
      for (let i = 1; i < children.length; i++) {
        const from = children[i - 1];
        const to = children[i];
        nodes.get(from).right = to;
        trace.record('link', 'link-sibling', '用右指针连接' + (id === null ? '下一棵树的根 ' : '右兄弟 ') + to + '。', state(from, { from, to, kind: 'next-sibling' }));
      }
    }
    return trace.finish('done-forward', '森林已转换为左孩子、右兄弟二叉树。', state(), { root, nodes: [...nodes.values()] });
  }
  if (mode !== 'to-forest') throw new TypeError('mode 必须是 to-binary 或 to-forest。');
  const original = normalizeTree(input);
  const { root } = input;
  const roots = [];
  const nodes = new Map(Array.from(original.keys(), id => [id, { id, children: [] }]));
  const state = (currentNode = null, edge = null) => ({
    mode, roots, root, forestNodes: [...nodes.values()], binaryNodes: [...original.values()], currentNode, edge,
  });
  trace.record('init', 'init-reverse', '初始化空的有序森林。', state());
  function restore(id, parent) {
    while (id !== null) {
      const group = parent === null ? roots : nodes.get(parent).children;
      group.push(id);
      const edge = { from: parent, to: id, kind: parent === null ? 'root' : 'child' };
      trace.record('restore', 'restore-link', '恢复' + (parent === null ? '森林根 ' : '孩子 ') + id + '。', state(id, edge));
      const { left, right } = original.get(id);
      restore(left, id);
      id = right;
    }
  }
  restore(root, null);
  return trace.finish('done-reverse', '有序森林恢复完成。', state(), { roots, nodes: [...nodes.values()] });
}
