import { MAX_NODES } from './binary-tree-util.js';
import { createTrace, defineSource } from './g-trace.js';

export { MAX_NODES };
export const DEFAULT_INPUT = { preorder: ['A', 'B', 'D', 'C'], inorder: ['B', 'D', 'A', 'C'] };

const source = defineSource('binary-tree-reconstruction', [
  ['node', 'typedef struct { int left, right; } Node;'],
  ['helper', 'static int build(const int pre[], const int in[], int p, int l, int r, Node out[]) {'],
  ['empty', '  if (l == r) return -1;'],
  ['root', '  int root = pre[p], split = l;'],
  ['locate', '  while (split < r && in[split] != root) ++split;'],
  ['bad', '  if (split == r) return -2;'],
  ['split', '  int right_start = p + (split - l) + 1;'],
  ['descend-left', '  int left = build(pre, in, p + 1, l, split, out);'],
  ['left-error', '  if (left == -2) return -2;'],
  ['link-left', '  out[root].left = left;'],
  ['descend-right', '  int right = build(pre, in, right_start, split + 1, r, out);'],
  ['right-error', '  if (right == -2) return -2;'],
  ['link-right', '  out[root].right = right;'],
  ['return', '  return root;'],
  ['helper-end', '}'],
  ['function', 'int reconstruct(const int pre[], const int in[], int n, Node out[]) {'],
  ['init', '  int i;'],
  ['bounds', '  if (n < 0 || n > 64) return -2;'],
  ['seen', '  int seen_pre[64] = {0}, seen_in[64] = {0};'],
  ['validate', '  for (i = 0; i < n; ++i) {'],
  ['validate-ids', '    if (pre[i] < 0 || pre[i] >= n || in[i] < 0 || in[i] >= n) return -2;'],
  ['validate-unique', '    if (seen_pre[pre[i]]++ || seen_in[in[i]]++) return -2;'],
  ['validate-end', '  }'],
  ['done', '  return build(pre, in, 0, 0, n, out);'],
  ['end', '}'],
]);
export const { sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES } = source;

export function generateBinaryTreeReconstructionSteps(input) {
  const { preorder, inorder } = input ?? {};
  function uniqueIds(order) {
    return Array.isArray(order) && order.length <= MAX_NODES &&
      Array.from(order).every(id => typeof id === 'string' && id.trim()) &&
      new Set(order).size === order.length;
  }
  if (!uniqueIds(preorder) || !uniqueIds(inorder) || preorder.length !== inorder.length) {
    throw new TypeError('请输入等长的前序和中序序列，节点 ID 必须唯一且最多 64 个。');
  }
  const trace = createTrace(source);
  const nodes = [];
  const stack = [];
  const root = preorder[0] ?? null;
  const state = (edge = null) => ({
    preorder, inorder, root, nodes, stack, currentNode: stack.at(-1)?.id ?? null, edge,
  });
  trace.record('init', 'init', '准备按前序和中序重建二叉树。', state());

  function build(preStart, inStart, inEnd) {
    if (inStart === inEnd) return null;
    const id = preorder[preStart];
    const frame = { id, preStart, preEnd: preStart + inEnd - inStart, inStart, inEnd, split: null };
    stack.push(frame);
    const node = { id, left: null, right: null };
    nodes.push(node);
    trace.record('root', 'root', '取当前前序区间首项 ' + id + ' 为根。', state());
    const split = inorder.indexOf(id, inStart);
    if (split < inStart || split >= inEnd) throw new TypeError('前序和中序不一致，根不在当前中序区间内。');
    frame.split = split;
    const rightStart = preStart + (split - inStart) + 1;
    frame.leftRange = { preorder: [preStart + 1, rightStart], inorder: [inStart, split] };
    frame.rightRange = { preorder: [rightStart, frame.preEnd], inorder: [split + 1, inEnd] };
    trace.record('split', 'split', '在中序下标 ' + split + ' 切分左右子树。', state());
    for (const [side, range] of [['left', frame.leftRange], ['right', frame.rightRange]]) {
      const [start] = range.preorder;
      const [left, right] = range.inorder;
      if (left === right) continue;
      trace.record('descend', 'descend-' + side, '进入 ' + id + ' 的' + (side === 'left' ? '左' : '右') + '子树区间。', state());
      node[side] = build(start, left, right);
      trace.record('link', 'link-' + side, '连接节点 ' + id + ' 和孩子 ' + node[side] + '。', state({ parent: id, child: node[side], side }));
    }
    trace.record('return', 'return', '返回以 ' + id + ' 为根的子树。', state());
    stack.pop();
    return id;
  }

  build(0, 0, inorder.length);
  return trace.finish('done', '二叉树重建完成。', state(), { root, nodes });
}
