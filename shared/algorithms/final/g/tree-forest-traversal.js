import { MAX_NODES } from './binary-tree-util.js';
import { DEFAULT_FOREST, normalizeForest } from './tree-forest-util.js';
import { createTrace, defineSource } from './g-trace.js';

export { MAX_NODES };
export const DEFAULT_INPUT = { mode: 'preorder', ...DEFAULT_FOREST };
const source = defineSource('tree-forest-traversal', [
  ['helper', 'static void walk(int id, const int children[], const int offsets[], int post, int out[], int *count) {'],
  ['enter', '  int i = offsets[id], end = offsets[id + 1];'],
  ['pre-check', '  if (!post) {'],
  ['visit-pre', '    out[(*count)++] = id;'],
  ['pre-end', '  }'],
  ['loop', '  for (; i < end; ++i) {'],
  ['descend', '    walk(children[i], children, offsets, post, out, count);'],
  ['resume', '  }'],
  ['post-check', '  if (post) {'],
  ['visit-post', '    out[(*count)++] = id;'],
  ['post-end', '  }'],
  ['return', '  return;'],
  ['helper-end', '}'],
  ['function', 'int traverse_forest(const int roots[], int nr, const int children[], const int offsets[], int post, int out[]) {'],
  ['init', '  int i, count = 0;'],
  ['root-loop', '  for (i = 0; i < nr; ++i) {'],
  ['start-tree', '    walk(roots[i], children, offsets, post, out, &count);'],
  ['end-tree', '  }'],
  ['done', '  return count;'],
  ['end', '}'],
]);
export const { sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES } = source;

export function generateTreeForestTraversalSteps(input) {
  const nodes = normalizeForest(input);
  const { roots, mode = 'preorder' } = input;
  if (!['preorder', 'postorder'].includes(mode)) throw new TypeError('mode 必须是 preorder 或 postorder。');
  const trace = createTrace(source);
  const stack = [];
  const order = [];
  let treeIndex = null;
  const state = (childNode = null) => ({
    roots, nodes: [...nodes.values()], mode, treeIndex, stack, order, childNode,
    currentNode: stack.at(-1)?.id ?? null, level: stack.at(-1)?.level ?? null,
  });
  trace.record('init', 'init', '初始化森林遍历序列。', state());
  function visit(id, level) {
    stack.push({ id, level });
    trace.record('enter', 'enter', '进入第 ' + level + ' 层节点 ' + id + '。', state());
    if (mode === 'preorder') {
      order.push(id);
      trace.record('visit', 'visit-pre', '先根访问 ' + id + '。', state());
    }
    for (const child of nodes.get(id).children) {
      trace.record('descend', 'descend', '递归进入孩子 ' + child + '。', state(child));
      visit(child, level + 1);
      trace.record('resume', 'resume', '从 ' + child + ' 回到 ' + id + '。', state(child));
    }
    if (mode === 'postorder') {
      order.push(id);
      trace.record('visit', 'visit-post', '处理完孩子后访问 ' + id + '。', state());
    }
    trace.record('return', 'return', '退出节点 ' + id + '。', state());
    stack.pop();
  }

  roots.forEach((root, index) => {
    treeIndex = index + 1;
    trace.record('start-tree', 'start-tree', '开始第 ' + treeIndex + ' 棵树，根为 ' + root + '。', state(root));
    visit(root, 1);
    trace.record('end-tree', 'end-tree', '完成第 ' + treeIndex + ' 棵树。', state(root));
  });
  treeIndex = null;
  return trace.finish('done', '森林遍历完成。', state(), order);
}
