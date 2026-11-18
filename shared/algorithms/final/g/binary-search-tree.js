import { MAX_NODES } from './binary-tree-util.js';
import { defineSource } from './g-trace.js';

export { MAX_NODES };
export const MAX_OPERATIONS = 128;
export const DEFAULT_INPUT = {
  operations: [
    { type: 'insert', key: 5 }, { type: 'insert', key: 3 }, { type: 'insert', key: 7 }, { type: 'insert', key: 4 },
    { type: 'search', key: 4 }, { type: 'search', key: 6 }, { type: 'insert', key: 3 },
  ],
};
const source = defineSource('binary-search-tree', [
  ['node', 'typedef struct { int key, left, right; } BSTNode;'],
  ['tree', 'typedef struct { int root, count; BSTNode nodes[64]; } BST;'],
  ['init-function', 'void bst_init(BST *tree) {'],
  ['init', '  tree->root = -1; tree->count = 0;'],
  ['init-end', '}'],
  ['function', 'int bst_operation(BST *tree, int key, int insert, int *node, int path[], int *length) {'],
  ['operation', '  int *link = &tree->root;'],
  ['path-init', '  *length = 0;'],
  ['loop', '  while (*link >= 0) {'],
  ['current', '    BSTNode *current = &tree->nodes[*link];'],
  ['compare', '    path[(*length)++] = *link;'],
  ['equal', '    if (key == current->key) {'],
  ['found-node', '      *node = *link;'],
  ['found', '      return 0;'],
  ['equal-end', '    }'],
  ['less', '    if (key < current->key) {'],
  ['left', '      link = &current->left;'],
  ['else', '    } else {'],
  ['right', '      link = &current->right;'],
  ['branch-end', '    }'],
  ['loop-end', '  }'],
  ['missing-node', '  *node = -1;'],
  ['missing', '  if (!insert) return -1;'],
  ['capacity', '  if (tree->count == 64) return -2;'],
  ['new-index', '  int index = tree->count++;'],
  ['new-key', '  tree->nodes[index].key = key;'],
  ['new-links', '  tree->nodes[index].left = tree->nodes[index].right = -1;'],
  ['attach', '  *link = index;'],
  ['inserted-node', '  *node = index;'],
  ['inserted', '  return 1;'],
  ['operation-end', '}'],
  ['inorder-helper', 'static void bst_inorder_visit(const BST *tree, int id, int out[], int *count) {'],
  ['inorder-empty', '  if (id < 0) return;'],
  ['inorder-left', '  bst_inorder_visit(tree, tree->nodes[id].left, out, count);'],
  ['inorder-output', '  out[(*count)++] = tree->nodes[id].key;'],
  ['inorder-right', '  bst_inorder_visit(tree, tree->nodes[id].right, out, count);'],
  ['inorder-helper-end', '}'],
  ['inorder', 'int bst_inorder(const BST *tree, int out[]) {'],
  ['inorder-init', '  int count = 0;'],
  ['inorder-start', '  bst_inorder_visit(tree, tree->root, out, &count);'],
  ['done', '  return count;'],
  ['end', '}'],
]);
export const { sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES } = source;

export const BINARY_SEARCH_TREE_REPLAY_FORMAT = 'bst-replay-v1';

function freezeTree(root, nodes) {
  return Object.freeze({ root, nodes: Object.freeze(nodes) });
}

export function generateBinarySearchTreeReplay(input) {
  const { operations } = input ?? {};
  if (!Array.isArray(operations) || operations.length > MAX_OPERATIONS) {
    throw new TypeError('请输入 operations 数组，最多 128 次操作。');
  }
  const insertKeys = new Set();
  const ops = Array.from(operations, operation => {
    const { type, key } = operation ?? {};
    if (!['search', 'insert'].includes(type) || !Number.isInteger(key) || key < -2147483648 || key > 2147483647) {
      throw new TypeError('操作必须是 search 或 insert，键必须为 32 位有符号整数。');
    }
    if (type === 'insert') insertKeys.add(key);
    return { type, key: key === 0 ? 0 : key };
  });
  if (insertKeys.size > MAX_NODES) throw new TypeError('二叉排序树最多允许 64 个不同的键。');

  let tree = freezeTree(null, []);
  const treeStates = [tree];
  const steps = [];
  const results = [];
  let operationIndex = null;
  let path = [];
  function record(event, lineId, description, currentNode = null, edge = null) {
    steps.push({
      event, lineId, description, currentNode, edge, operationIndex,
      treeIndex: treeStates.length - 1, pathLength: path.length, lastResultIndex: results.length - 1,
    });
  }

  record('init', 'init', '初始化空的二叉排序树。');
  ops.forEach(({ type, key }, index) => {
    operationIndex = index;
    path = [];
    let id = tree.root;
    let parent = null;
    let side = null;
    const save = (status, node) => results.push({ type, key, status, node, path: [...path] });
    record('operation', 'operation', (type === 'insert' ? '开始插入键 ' : '开始查找键 ') + key + '。', id);
    while (id !== null) {
      const node = tree.nodes[id];
      path.push(id);
      record('compare', 'compare', '比较 ' + key + ' 和当前节点的键 ' + node.key + '。', id);
      if (key === node.key) {
        const duplicate = type === 'insert';
        save(duplicate ? 'duplicate' : 'found', id);
        record(duplicate ? 'duplicate' : 'found', 'found', duplicate ? '键已存在，保留已有节点。' : '找到目标键。', id);
        return;
      }
      parent = id;
      side = key < node.key ? 'left' : 'right';
      id = node[side];
      record('move', side, '沿' + (side === 'left' ? '左' : '右') + '链接继续。', parent, { from: parent, to: id, side });
    }
    if (type === 'search') {
      save('missing', null);
      record('missing', 'missing', '到达空链接，查找结束。');
      return;
    }
    id = tree.nodes.length;
    const nodes = [...tree.nodes, Object.freeze({ id, key, left: null, right: null })];
    if (parent !== null) nodes[parent] = Object.freeze({ ...nodes[parent], [side]: id });
    tree = freezeTree(tree.root ?? id, nodes);
    treeStates.push(tree);
    save('inserted', id);
    record('insert', 'attach', '在空链接处挂接新节点，键为 ' + key + '。', id, { from: parent, to: id, side: side ?? 'root' });
  });

  const inorder = [];
  function visit(id) {
    if (id === null) return;
    const node = tree.nodes[id];
    visit(node.left);
    inorder.push(node.key);
    visit(node.right);
  }
  visit(tree.root);
  operationIndex = null;
  path = [];
  record('done', 'done', '操作结束，输出当前二叉排序树及其中序序列。');
  return {
    format: BINARY_SEARCH_TREE_REPLAY_FORMAT, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES,
    treeStates, steps, result: { root: tree.root, nodes: tree.nodes, operations: results, inorder },
  };
}

export function restoreBinarySearchTreeRun(replay) {
  const { format, treeStates, steps, result, sourceVersion, sourceLines, ...metadata } = replay;
  if (format !== BINARY_SEARCH_TREE_REPLAY_FORMAT) throw new TypeError('不支持的二叉排序树回放格式。');

  // Reuse immutable state across steps, including after a JSON round trip.
  const trees = structuredClone(treeStates).map(({ root, nodes }) =>
    freezeTree(root, nodes.map(node => Object.freeze(node))));
  const results = result.operations.map(entry => Object.freeze({ ...entry, path: Object.freeze([...entry.path]) }));
  const expandedSteps = steps.map((step, stepIndex) => {
    const { event, lineId, description, currentNode, edge, operationIndex, treeIndex, pathLength, lastResultIndex } = step;
    const { root, nodes } = trees[treeIndex];
    const currentOperation = results[operationIndex];
    const done = event === 'done';
    const variables = {
      root, nodes, currentNode, edge: edge && { ...edge }, operationIndex,
      operation: currentOperation ? { type: currentOperation.type, key: currentOperation.key } : null,
      path: currentOperation?.path.slice(0, pathLength) ?? [],
      lastResult: results[lastResultIndex] ?? null,
    };
    if (done) variables.inorder = [...result.inorder];
    return {
      schemaVersion: '1.0', algorithm: source.algorithm, sourceVersion, stepIndex, event,
      lineId, description, variables, done, result: done ? structuredClone(result) : null,
    };
  });
  return { ...metadata, steps: expandedSteps, result: structuredClone(result), sourceVersion, sourceLines };
}

export function generateBinarySearchTreeSteps(input) {
  return restoreBinarySearchTreeRun(generateBinarySearchTreeReplay(input));
}
