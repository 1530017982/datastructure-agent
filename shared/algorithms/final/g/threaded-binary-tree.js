import { DEFAULT_INPUT, MAX_NODES, normalizeTree } from './binary-tree-util.js';
import { createTrace, defineSource } from './g-trace.js';

export { DEFAULT_INPUT, MAX_NODES };
const source = defineSource('threaded-binary-tree', [
  ['node', 'typedef struct { int left, right, left_thread, right_thread; } ThreadedNode;'],
  ['helper', 'static void thread_visit(ThreadedNode nodes[], int id, int *previous) {'],
  ['empty', '  if (id < 0) return;'],
  ['original', '  int right = nodes[id].right;'],
  ['left', '  thread_visit(nodes, nodes[id].left, previous);'],
  ['visit', '  if (nodes[id].left < 0) {'],
  ['link-predecessor', '    nodes[id].left = *previous;'],
  ['mark-left', '    nodes[id].left_thread = 1;'],
  ['left-end', '  }'],
  ['right-check', '  if (*previous >= 0 && nodes[*previous].right < 0) {'],
  ['link-successor', '    nodes[*previous].right = id;'],
  ['mark-right', '    nodes[*previous].right_thread = 1;'],
  ['right-end', '  }'],
  ['advance', '  *previous = id;'],
  ['right', '  thread_visit(nodes, right, previous);'],
  ['helper-end', '}'],
  ['function', 'int thread_tree(ThreadedNode nodes[], int n, int root) {'],
  ['init', '  int i, previous = -1;'],
  ['reset', '  for (i = 0; i < n; ++i) nodes[i].left_thread = nodes[i].right_thread = 0;'],
  ['build', '  thread_visit(nodes, root, &previous);'],
  ['last-check', '  if (previous >= 0) {'],
  ['mark-last', '    nodes[previous].right_thread = 1;'],
  ['last-end', '  }'],
  ['thread-done', '  return previous;'],
  ['function-end', '}'],
  ['order-function', 'int threaded_order(const ThreadedNode nodes[], int root, int output[]) {'],
  ['order-init', '  int id = root, count = 0;'],
  ['order-loop', '  while (id >= 0) {'],
  ['first', '    while (!nodes[id].left_thread) id = nodes[id].left;'],
  ['output', '    output[count++] = id;'],
  ['thread-loop', '    while (nodes[id].right_thread) {'],
  ['follow', '      id = nodes[id].right;'],
  ['order-stop', '      if (id < 0) return count;'],
  ['thread-output', '      output[count++] = id;'],
  ['thread-loop-end', '    }'],
  ['move-right', '    id = nodes[id].right;'],
  ['order-loop-end', '  }'],
  ['done', '  return count;'],
  ['end', '}'],
]);
export const { sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES } = source;

export function generateThreadedBinaryTreeSteps(input) {
  const original = normalizeTree(input);
  const { root } = input;
  const nodes = new Map(Array.from(original, ([id, node]) => [id, { ...node, leftThread: false, rightThread: false }]));
  const trace = createTrace(source);
  const order = [];
  let previous = null;
  const state = (currentNode = null, edge = null) => ({
    root, nodes: [...nodes.values()], currentNode, previous, order, edge,
  });
  trace.record('init', 'init', '初始化中序线索及前驱指针。', state());

  function thread(id) {
    if (id === null) return;
    const { left, right } = original.get(id);
    thread(left);
    trace.record('visit', 'visit', '按原孩子边中序访问 ' + id + '。', state(id));
    const node = nodes.get(id);
    if (left === null) {
      node.left = previous;
      node.leftThread = true;
      trace.record('thread', 'link-predecessor', '设置 ' + id + ' 的前驱线索。', state(id, { from: id, to: previous, kind: 'predecessor' }));
    }
    if (previous !== null && original.get(previous).right === null) {
      const predecessor = nodes.get(previous);
      predecessor.right = id;
      predecessor.rightThread = true;
      trace.record('thread', 'link-successor', '设置 ' + previous + ' 的后继线索。', state(id, { from: previous, to: id, kind: 'successor' }));
    }
    previous = id;
    thread(right);
  }

  thread(root);
  if (previous !== null) {
    nodes.get(previous).rightThread = true;
    trace.record('thread', 'mark-last', '中序末节点的后继线索为空。', state(previous, { from: previous, to: null, kind: 'successor' }));
  }

  let id = root;
  while (id !== null) {
    while (!nodes.get(id).leftThread) id = nodes.get(id).left;
    order.push(id);
    trace.record('output', 'output', '沿孩子边下降后访问 ' + id + '。', state(id));
    while (nodes.get(id).rightThread) {
      id = nodes.get(id).right;
      if (id === null) break;
      order.push(id);
      trace.record('output', 'thread-output', '沿后继线索访问 ' + id + '。', state(id));
    }
    if (id !== null) id = nodes.get(id).right;
  }
  return trace.finish('done', '沿线索完成中序遍历。', state(), { root, nodes: [...nodes.values()], order });
}
