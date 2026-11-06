// shared/algorithms/final/d/avl-tree.js
// D 包 · 平衡二叉树：按二叉排序树规则插入，回溯更新高度，
// 出现 |平衡因子| > 1 时按 LL / RR / LR / RL 四种情况旋转。
// 关键：旋转后先把新子树根接回父结点（或更新整树根），再记录快照，保证每帧都能从 root 访问全树。
import { createStepFactory, requireKeyList, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-avl-c-v1';

const SOURCE_LINES = [
  { lineId: 'include', text: '#include <stdlib.h>' },
  { lineId: 'node-type', text: 'typedef struct AVLNode {' },
  { lineId: 'node-fields', text: '  long long key; int height; struct AVLNode *left, *right;' },
  { lineId: 'node-end', text: '} AVLNode;' },
  { lineId: 'height-fn', text: 'int height(AVLNode *p) { return p ? p->height : 0; }' },
  { lineId: 'update-fn', text: 'void update(AVLNode *p) {' },
  { lineId: 'update-body', text: '  int l = height(p->left), r = height(p->right);' },
  { lineId: 'update-set', text: '  p->height = 1 + (l > r ? l : r);' },
  { lineId: 'update-end', text: '}' },
  { lineId: 'balance-fn', text: 'int balance(AVLNode *p) { return p ? height(p->left) - height(p->right) : 0; }' },
  { lineId: 'rotate-right-start', text: 'AVLNode *rotate_right(AVLNode *p) {' },
  { lineId: 'rotate-right-body', text: '  AVLNode *q = p->left; p->left = q->right; q->right = p;' },
  { lineId: 'rotate-right-update', text: '  update(p); update(q); return q;' },
  { lineId: 'rotate-right-end', text: '}' },
  { lineId: 'rotate-left-start', text: 'AVLNode *rotate_left(AVLNode *p) {' },
  { lineId: 'rotate-left-body', text: '  AVLNode *q = p->right; p->right = q->left; q->left = p;' },
  { lineId: 'rotate-left-update', text: '  update(p); update(q); return q;' },
  { lineId: 'rotate-left-end', text: '}' },
  { lineId: 'new-node', text: 'AVLNode *new_node(long long key) {' },
  { lineId: 'new-node-body', text: '  AVLNode *n = malloc(sizeof(AVLNode)); n->key = key; n->height = 1; n->left = n->right = NULL; return n;' },
  { lineId: 'new-node-end', text: '}' },
  { lineId: 'insert-start', text: 'AVLNode *insert(AVLNode *p, long long key) {' },
  { lineId: 'insert-empty', text: '  if (!p) { return new_node(key); }' },
  { lineId: 'insert-left', text: '  if (key < p->key) { p->left = insert(p->left, key); }' },
  { lineId: 'insert-right', text: '  else if (key > p->key) { p->right = insert(p->right, key); }' },
  { lineId: 'insert-duplicate', text: '  else { return p; }' },
  { lineId: 'insert-update', text: '  update(p); int bf = balance(p);' },
  { lineId: 'case-ll', text: '  if (bf > 1 && balance(p->left) >= 0) { return rotate_right(p); }' },
  { lineId: 'case-rr', text: '  if (bf < -1 && balance(p->right) <= 0) { return rotate_left(p); }' },
  { lineId: 'case-lr-inner', text: '  if (bf > 1 && balance(p->left) < 0) { p->left = rotate_left(p->left); }' },
  { lineId: 'case-lr', text: '  if (bf > 1) { return rotate_right(p); }' },
  { lineId: 'case-rl-inner', text: '  if (bf < -1 && balance(p->right) > 0) { p->right = rotate_right(p->right); }' },
  { lineId: 'case-rl', text: '  if (bf < -1) { return rotate_left(p); }' },
  { lineId: 'insert-end', text: '  return p;' },
  { lineId: 'insert-close', text: '}' },
  { lineId: 'search-start', text: 'AVLNode *search(AVLNode *p, long long key) {' },
  { lineId: 'search-compare', text: '  while (p && p->key != key) { p = key < p->key ? p->left : p->right; }' },
  { lineId: 'search-end', text: '  return p;' },
  { lineId: 'search-close', text: '}' },
];

function node(key) {
  return { key, left: null, right: null, height: 1 };
}

function height(p) {
  return p ? p.height : 0;
}

function update(p) {
  p.height = 1 + Math.max(height(p.left), height(p.right));
  return p.height;
}

function balance(p) {
  return p ? height(p.left) - height(p.right) : 0;
}

function rotateRight(p) {
  const q = p.left;
  p.left = q.right;
  q.right = p;
  update(p);
  update(q);
  return q;
}

function rotateLeft(p) {
  const q = p.right;
  p.right = q.left;
  q.left = p;
  update(p);
  update(q);
  return q;
}

/** 序列化为可渲染的快照：每个结点带高度、平衡因子和左右孩子的键。 */
function snapshot(root) {
  const nodes = [];
  (function walk(p) {
    if (!p) return;
    nodes.push({ key: p.key, left: p.left ? p.left.key : null, right: p.right ? p.right.key : null, height: p.height, bf: balance(p) });
    walk(p.left);
    walk(p.right);
  })(root);
  return { root: root ? root.key : null, nodes };
}

/**
 * 生成平衡二叉树的插入与查找步骤。
 * @param {{ keys: number[], target?: number }} input 键必须唯一；重复键按"忽略重复"处理并给出说明。
 */
export function generateAvlSteps(input) {
  const keys = requireKeyList(input?.keys ?? [], 'keys');
  const hasTarget = input?.target !== undefined && input?.target !== null;
  const target = hasTarget ? requireSafeInteger(input.target, 'target') : null;

  let root = null;
  const { steps, add } = createStepFactory('avl-tree', SOURCE_VERSION);
  const view = extra => ({ ...snapshot(root), ...extra });

  /** 旋转后把新子树根接回父结点（或更新整树根），使快照与树结构一致。 */
  const attach = (parent, oldNode, newNode) => {
    if (!parent) root = newNode;
    else if (parent.left === oldNode) parent.left = newNode;
    else parent.right = newNode;
  };

  add({
    event: 'init', lineId: 'node-type',
    variables: view({ phase: 'insert', key: null, keyIndex: null, path: [], unbalancedAt: null, rotation: null }),
    description: '空树。每次插入后自底向上更新高度，若某结点平衡因子绝对值超过 1 就旋转修复。',
  });

  const insertKey = (key, keyIndex) => {
    if (!root) {
      root = node(key);
      add({
        event: 'insert', lineId: 'insert-empty', variables: view({ phase: 'insert', key, keyIndex, path: [], unbalancedAt: null, rotation: null }),
        description: `树为空，${key} 直接成为根结点。`,
      });
      return;
    }

    // 先沿查找路径下探：这部分只影响比较步骤，不改变树。
    const path = [];
    let cursor = root;
    while (cursor) {
      const direction = key < cursor.key ? 'left' : key > cursor.key ? 'right' : 'equal';
      path.push(cursor.key);
      add({
        event: 'compare', lineId: direction === 'left' ? 'insert-left' : direction === 'right' ? 'insert-right' : 'insert-duplicate',
        variables: view({ phase: 'insert', key, keyIndex, path: [...path], unbalancedAt: null, rotation: null }),
        description: direction === 'equal'
          ? `${key} 与结点 ${cursor.key} 相等，键唯一，按忽略重复处理。`
          : `${key} ${direction === 'left' ? '小于' : '大于'} ${cursor.key}，向${direction === 'left' ? '左' : '右'}子树下探。`,
      });
      if (direction === 'equal') return;
      cursor = direction === 'left' ? cursor.left : cursor.right;
    }

    // 递归插入：旋转完成后先接回父结点，再记录快照。
    const walkInsert = (p, parent) => {
      if (!p) return node(key);
      if (key < p.key) p.left = walkInsert(p.left, p);
      else if (key > p.key) p.right = walkInsert(p.right, p);
      else return p;

      update(p);
      const bf = balance(p);
      let type = null;
      if (bf > 1 && balance(p.left) >= 0) type = 'LL';
      else if (bf < -1 && balance(p.right) <= 0) type = 'RR';
      else if (bf > 1 && balance(p.left) < 0) type = 'LR';
      else if (bf < -1 && balance(p.right) > 0) type = 'RL';
      if (!type) return p;

      add({
        event: 'unbalanced', lineId: 'insert-update',
        variables: view({ phase: 'insert', key, keyIndex, path: [...path], unbalancedAt: p.key, bf, rotation: null }),
        description: `结点 ${p.key} 的平衡因子为 ${bf}，左子树高 ${height(p.left)}、右子树高 ${height(p.right)}，属于 ${type}。`,
      });

      let next = p;
      if (type === 'LL') {
        next = rotateRight(p);
      } else if (type === 'RR') {
        next = rotateLeft(p);
      } else if (type === 'LR') {
        p.left = rotateLeft(p.left);
        add({
          event: 'rotate-inner', lineId: 'case-lr-inner',
          variables: view({ phase: 'insert', key, keyIndex, path: [...path], unbalancedAt: p.key, bf, rotation: 'LR-1' }),
          description: `LR 第一步：对 ${p.key} 的左孩子做左旋，把内侧情形转成 LL。此时 ${p.key} 仍在原位。`,
        });
        next = rotateRight(p);
      } else {
        p.right = rotateRight(p.right);
        add({
          event: 'rotate-inner', lineId: 'case-rl-inner',
          variables: view({ phase: 'insert', key, keyIndex, path: [...path], unbalancedAt: p.key, bf, rotation: 'RL-1' }),
          description: `RL 第一步：对 ${p.key} 的右孩子做右旋，把内侧情形转成 RR。此时 ${p.key} 仍在原位。`,
        });
        next = rotateLeft(p);
      }

      attach(parent, p, next);
      add({
        event: 'rotate', lineId: type === 'LL' ? 'case-ll' : type === 'RR' ? 'case-rr' : type === 'LR' ? 'case-lr' : 'case-rl',
        variables: view({ phase: 'insert', key, keyIndex, path: [...path], unbalancedAt: p.key, bf, rotation: type }),
        description: `对 ${p.key} 完成${type === 'LR' || type === 'RL' ? '第二次' : ''}旋转，${next.key} 上升为子树根，当前整树根为 ${root.key}。`,
      });
      return next;
    };

    root = walkInsert(root, null);
    add({
      event: 'insert', lineId: 'insert-end', variables: view({ phase: 'insert', key, keyIndex, path: [...path], unbalancedAt: null, rotation: null }),
      description: `插入 ${key} 完成，当前根为 ${root.key}，全树恢复平衡。`,
    });
  };

  for (let i = 0; i < keys.length; i++) insertKey(keys[i], i);

  if (hasTarget) {
    let cursor = root;
    const path = [];
    while (cursor) {
      const direction = target < cursor.key ? 'left' : target > cursor.key ? 'right' : 'equal';
      path.push(cursor.key);
      add({
        event: 'compare', lineId: 'search-compare', variables: view({ phase: 'search', key: target, keyIndex: null, path: [...path], unbalancedAt: null, rotation: null }),
        description: direction === 'equal'
          ? `${target} 与结点 ${cursor.key} 相等，查找命中。`
          : `${target} ${direction === 'left' ? '小于' : '大于'} ${cursor.key}，向${direction === 'left' ? '左' : '右'}子树继续。`,
      });
      if (direction === 'equal') {
        add({
          event: 'found', lineId: 'search-end', done: true, variables: view({ phase: 'search', key: target, keyIndex: null, path: [...path], unbalancedAt: null, rotation: null, searchResult: cursor.key }),
          description: `查找路径为 ${path.join(' → ')}，找到 ${target}。`,
        });
        return { steps, result: { found: cursor.key, path, root: root.key }, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      cursor = direction === 'left' ? cursor.left : cursor.right;
    }
    add({
      event: 'not-found', lineId: 'search-end', done: true, variables: view({ phase: 'search', key: target, keyIndex: null, path: [...path], unbalancedAt: null, rotation: null, searchResult: null }),
      description: `查找路径为 ${path.join(' → ') || '空树'}，未找到 ${target}。`,
    });
    return { steps, result: { found: null, path, root: root ? root.key : null }, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  add({
    event: 'done', lineId: 'insert-close', done: true,
    variables: view({ phase: 'insert', key: null, keyIndex: null, path: [], unbalancedAt: null, rotation: null }),
    description: `插入结束，共 ${keys.length} 个键，当前根为 ${root ? root.key : '空'}，每个结点的平衡因子绝对值都不超过 1。`,
  });
  return { steps, result: { root: root ? root.key : null, nodes: snapshot(root).nodes }, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}

export { SOURCE_VERSION, SOURCE_LINES };
