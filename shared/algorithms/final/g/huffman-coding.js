import { MAX_NODES as MAX_SYMBOLS } from './binary-tree-util.js';
import { createTrace, defineSource } from './g-trace.js';

export { MAX_SYMBOLS };
export const DEFAULT_INPUT = { symbols: [{ id: 'A', weight: 2 }, { id: 'B', weight: 3 }, { id: 'C', weight: 7 }] };
const source = defineSource('huffman-coding', [
  ['node', 'typedef struct { long long weight; int left, right, active; } HuffmanNode;'],
  ['select', 'static int take_lightest(HuffmanNode nodes[], int count) {'],
  ['select-init', '  int i, best = -1;'],
  ['scan', '  for (i = 0; i < count; ++i) {'],
  ['compare', '    if (nodes[i].active && (best < 0 || nodes[i].weight < nodes[best].weight)) best = i;'],
  ['scan-end', '  }'],
  ['take', '  nodes[best].active = 0;'],
  ['select-return', '  return best;'],
  ['select-end', '}'],
  ['encode', 'static long long encode(const HuffmanNode nodes[], int id, char path[], int depth, char codes[][65]) {'],
  ['leaf', '  if (nodes[id].left < 0) {'],
  ['copy', '    int i; for (i = 0; i < depth; ++i) codes[id][i] = path[i];'],
  ['single', "    if (depth == 0) codes[id][i++] = '0';"],
  ['code', "    codes[id][i] = '\\0';"],
  ['cost', '    return nodes[id].weight * depth;'],
  ['leaf-end', '  }'],
  ['path-left', "  path[depth] = '0';"],
  ['encode-left', '  long long cost = encode(nodes, nodes[id].left, path, depth + 1, codes);'],
  ['path-right', "  path[depth] = '1';"],
  ['encode-right', '  return cost + encode(nodes, nodes[id].right, path, depth + 1, codes);'],
  ['encode-end', '}'],
  ['function', 'int huffman(const int weights[], int n, HuffmanNode nodes[], char codes[][65], long long *cost) {'],
  ['init', '  int i, next = n; char path[64]; *cost = 0;'],
  ['bounds', '  if (n < 0 || n > 64) return -2;'],
  ['leaf-init', '  for (i = 0; i < n; ++i) {'],
  ['weight-check', '    if (weights[i] <= 0) return -2;'],
  ['leaf-fields', '    nodes[i].weight = weights[i]; nodes[i].left = nodes[i].right = -1; nodes[i].active = 1;'],
  ['leaf-init-end', '  }'],
  ['merge-loop', '  for (i = 1; i < n; ++i) {'],
  ['take-left', '    int left = take_lightest(nodes, next);'],
  ['take-right', '    int right = take_lightest(nodes, next);'],
  ['merge', '    nodes[next].weight = nodes[left].weight + nodes[right].weight;'],
  ['merge-links', '    nodes[next].left = left; nodes[next].right = right; nodes[next].active = 1;'],
  ['next', '    ++next;'],
  ['merge-end', '  }'],
  ['start-encode', '  if (n) *cost = encode(nodes, next - 1, path, 0, codes);'],
  ['done', '  return next - 1;'],
  ['end', '}'],
]);
export const { sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES } = source;

export function generateHuffmanCodingSteps(input) {
  const { symbols } = input ?? {};
  if (!Array.isArray(symbols) || symbols.length > MAX_SYMBOLS) {
    throw new TypeError('请输入 symbols 数组，最多 64 个符号。');
  }
  const seen = new Set();
  const nodes = Array.from(symbols, (symbol, index) => {
    const { id, weight } = symbol ?? {};
    if (typeof id !== 'string' || !id.trim() || seen.has(id) ||
        !Number.isInteger(weight) || weight < 1 || weight > 2147483647) {
      throw new TypeError('符号 ID 必须非空且唯一，权重必须为 1 到 2147483647 的整数。');
    }
    seen.add(id);
    return { index, id, weight, left: null, right: null };
  });
  const candidates = nodes.map(node => node.index);
  const codes = [];
  const trace = createTrace(source);
  let root = null;
  let weightedPathLength = 0;
  let encodedBitLength = 0;
  const priority = (a, b) => nodes[a].weight - nodes[b].weight || a - b;
  const state = (currentNode = null, selected = [], path = null) => ({
    nodes, candidates: [...candidates].sort(priority), codes, root, currentNode, selected, path, weightedPathLength, encodedBitLength,
  });
  trace.record('init', 'init', '按输入顺序为符号编号，准备候选集合。', state());

  function take() {
    let best = 0;
    for (let i = 1; i < candidates.length; i++) {
      if (priority(candidates[i], candidates[best]) < 0) best = i;
    }
    return candidates.splice(best, 1)[0];
  }

  while (candidates.length > 1) {
    const left = take();
    trace.record('select', 'take-left', '取最轻候选 #' + left + ' 作为左孩子。', state(left, [left]));
    const right = take();
    trace.record('select', 'take-right', '取剩余最轻候选 #' + right + ' 作为右孩子。', state(right, [left, right]));
    const index = nodes.length;
    nodes.push({ index, id: null, weight: nodes[left].weight + nodes[right].weight, left, right });
    candidates.push(index);
    trace.record('merge', 'merge', '合并为权重 ' + nodes[index].weight + ' 的节点 #' + index + '。', state(index, [left, right]));
  }
  root = candidates[0] ?? null;

  function encode(index, path) {
    const node = nodes[index];
    if (node.left === null) {
      const code = path || '0';
      codes.push({ index, id: node.id, weight: node.weight, code });
      weightedPathLength += node.weight * path.length;
      encodedBitLength += node.weight * code.length;
      trace.record('code', 'code', '符号 ' + node.id + ' 的码字为 ' + code + '。', state(index, [], code));
      return;
    }
    for (const [side, bit] of [['left', '0'], ['right', '1']]) {
      trace.record('descend', 'encode-' + side, '沿' + (side === 'left' ? '左' : '右') + '边追加 ' + bit + '。', state(node[side], [], path + bit));
      encode(node[side], path + bit);
    }
  }
  if (root !== null) encode(root, '');
  const result = { root, nodes, codes: [...codes].sort((a, b) => a.index - b.index), weightedPathLength, encodedBitLength };
  return trace.finish('done', '哈夫曼树和码字表已生成。', state(), result);
}
