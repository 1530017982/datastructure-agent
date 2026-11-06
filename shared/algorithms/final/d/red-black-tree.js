// shared/algorithms/final/d/red-black-tree.js
// D 包 · 红黑树：新结点染红后按 CLRS 三类情况修复——
// 叔红只变色并上移，叔黑先转成外侧再旋转。每次修复后都校验根黑、无红红相邻、各路黑高一致。
// 展示代码包含结点定义、左右旋（镜像）、插入、修复与查找，可直接拼成完整编译单元。
import { createStepFactory, requireKeyList, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-rbtree-c-v1';

const SOURCE_LINES = [
  { lineId: 'include', text: '#include <stdlib.h>' },
  { lineId: 'node-type', text: 'typedef struct RBNode {' },
  { lineId: 'node-fields', text: '  long long key; int red; struct RBNode *left, *right, *parent;' },
  { lineId: 'node-end', text: '} RBNode;' },
  { lineId: 'new-node', text: 'RBNode *new_node(long long key) {' },
  { lineId: 'new-node-alloc', text: '  RBNode *n = malloc(sizeof(RBNode));' },
  { lineId: 'new-node-fill', text: '  n->key = key; n->red = 1; n->left = n->right = n->parent = NULL;' },
  { lineId: 'new-node-return', text: '  return n;' },
  { lineId: 'new-node-end', text: '}' },
  { lineId: 'is-red', text: 'int is_red(RBNode *p) { return p && p->red; }' },
  { lineId: 'fixup-decl', text: 'void fixup(RBNode **root, RBNode *z);' },
  { lineId: 'rotate-left-start', text: 'void rotate_left(RBNode **root, RBNode *x) {' },
  { lineId: 'rotate-left-body', text: '  RBNode *y = x->right; x->right = y->left; if (y->left) y->left->parent = x;' },
  { lineId: 'rotate-left-link', text: '  y->parent = x->parent; if (!x->parent) *root = y;' },
  { lineId: 'rotate-left-side', text: '  else if (x == x->parent->left) x->parent->left = y; else x->parent->right = y;' },
  { lineId: 'rotate-left-done', text: '  y->left = x; x->parent = y;' },
  { lineId: 'rotate-left-end', text: '}' },
  { lineId: 'rotate-right-start', text: 'void rotate_right(RBNode **root, RBNode *x) {' },
  { lineId: 'rotate-right-body', text: '  RBNode *y = x->left; x->left = y->right; if (y->right) y->right->parent = x;' },
  { lineId: 'rotate-right-link', text: '  y->parent = x->parent; if (!x->parent) *root = y;' },
  { lineId: 'rotate-right-side', text: '  else if (x == x->parent->right) x->parent->right = y; else x->parent->left = y;' },
  { lineId: 'rotate-right-done', text: '  y->right = x; x->parent = y;' },
  { lineId: 'rotate-right-end', text: '}' },
  { lineId: 'insert-start', text: 'void insert(RBNode **root, long long key) {' },
  { lineId: 'insert-walk', text: '  RBNode *y = NULL, *x = *root; while (x) { y = x; if (key == x->key) { return; } x = key < x->key ? x->left : x->right; }' },
  { lineId: 'insert-link', text: '  RBNode *z = new_node(key); z->parent = y;' },
  { lineId: 'insert-attach', text: '  if (!y) { *root = z; } else if (key < y->key) { y->left = z; } else { y->right = z; }' },
  { lineId: 'insert-red', text: '  z->red = 1; fixup(root, z);' },
  { lineId: 'insert-end', text: '}' },
  { lineId: 'fixup-start', text: 'void fixup(RBNode **root, RBNode *z) {' },
  { lineId: 'fixup-loop', text: '  while (z->parent && z->parent->red) {' },
  { lineId: 'fixup-context', text: '    RBNode *parent = z->parent, *grand = parent->parent; if (!grand) break;' },
  { lineId: 'fixup-uncle', text: '    int left_side = (parent == grand->left); RBNode *uncle = left_side ? grand->right : grand->left;' },
  { lineId: 'case-uncle-red', text: '    if (is_red(uncle)) { parent->red = 0; uncle->red = 0; grand->red = 1; z = grand; continue; }' },
  { lineId: 'case-inside-left', text: '    if (left_side && z == parent->right) { z = parent; rotate_left(root, z); }' },
  { lineId: 'case-inside-right', text: '    else if (!left_side && z == parent->left) { z = parent; rotate_right(root, z); }' },
  { lineId: 'case-outside', text: '    parent = z->parent; grand = parent->parent; parent->red = 0; grand->red = 1;' },
  { lineId: 'case-outside-rotate', text: '    if (left_side) { rotate_right(root, grand); } else { rotate_left(root, grand); }' },
  { lineId: 'fixup-loop-end', text: '  }' },
  { lineId: 'fixup-root-black', text: '  (*root)->red = 0;' },
  { lineId: 'fixup-end', text: '}' },
  { lineId: 'search-start', text: 'RBNode *search(RBNode *p, long long key) {' },
  { lineId: 'search-compare', text: '  while (p && p->key != key) { p = key < p->key ? p->left : p->right; }' },
  { lineId: 'search-end', text: '  return p;' },
  { lineId: 'search-close', text: '}' },
];

function node(key) {
  return { key, red: true, left: null, right: null, parent: null };
}

function isRed(p) {
  return Boolean(p && p.red);
}

function snapshot(root) {
  const nodes = [];
  (function walk(p) {
    if (!p) return;
    nodes.push({
      key: p.key,
      color: p.red ? 'R' : 'B',
      left: p.left ? p.left.key : null,
      right: p.right ? p.right.key : null,
      parent: p.parent ? p.parent.key : null,
    });
    walk(p.left);
    walk(p.right);
  })(root);
  return { root: root ? root.key : null, nodes };
}

/** 红黑性质自检：根为黑、无红红相邻、各路黑高一致。 */
export function validateRedBlack(root) {
  const heights = new Set();
  let noRedRed = true;

  (function walk(p, blacks) {
    if (!p) {
      heights.add(blacks);
      return;
    }
    if (p.red && (isRed(p.left) || isRed(p.right))) noRedRed = false;
    const next = blacks + (p.red ? 0 : 1);
    walk(p.left, next);
    walk(p.right, next);
  })(root, 1); // 空孩子按黑结点计一次

  return {
    rootIsBlack: root ? !root.red : true,
    noRedRed,
    blackHeight: heights.size === 0 ? 0 : [...heights][0],
    blackHeightConsistent: heights.size <= 1,
  };
}

/**
 * 生成红黑树的插入与查找步骤。
 * @param {{ keys: number[], target?: number }} input 键唯一；重复键按忽略处理。
 */
export function generateRedBlackSteps(input) {
  const keys = requireKeyList(input?.keys ?? [], 'keys');
  const hasTarget = input?.target !== undefined && input?.target !== null;
  const target = hasTarget ? requireSafeInteger(input.target, 'target') : null;

  let root = null;
  const { steps, add } = createStepFactory('red-black-tree', SOURCE_VERSION);
  const view = extra => ({ ...snapshot(root), checked: validateRedBlack(root), ...extra });

  add({
    event: 'init', lineId: 'node-type',
    variables: view({ phase: 'insert', key: null, keyIndex: null, z: null, relation: null, fixupCase: null }),
    description: '空树。新结点一律先染红，只在破坏红黑性质时修复；修复结束时根结点统一置黑。',
  });

  const rotateLeft = x => {
    const y = x.right;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.parent = x.parent;
    if (!x.parent) root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
    return y;
  };

  const rotateRight = x => {
    const y = x.left;
    x.left = y.right;
    if (y.right) y.right.parent = x;
    y.parent = x.parent;
    if (!x.parent) root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
    return y;
  };

  const insertKey = (key, keyIndex) => {
    let parent = null;
    let cursor = root;
    const path = [];
    while (cursor) {
      parent = cursor;
      const direction = key < cursor.key ? 'left' : key > cursor.key ? 'right' : 'equal';
      path.push(cursor.key);
      add({
        event: 'compare', lineId: 'insert-walk', variables: view({ phase: 'insert', key, keyIndex, path: [...path], z: null, relation: direction, fixupCase: null }),
        description: direction === 'equal'
          ? `${key} 与 ${cursor.key} 相等，键唯一，按忽略重复处理。`
          : `${key} ${direction === 'left' ? '小于' : '大于'} ${cursor.key}，向${direction === 'left' ? '左' : '右'}走。`,
      });
      if (direction === 'equal') return;
      cursor = direction === 'left' ? cursor.left : cursor.right;
    }

    const z = node(key);
    z.parent = parent;
    if (!parent) root = z;
    else if (key < parent.key) parent.left = z;
    else parent.right = z;

    add({
      event: 'insert-red', lineId: 'insert-red', variables: view({ phase: 'insert', key, keyIndex, path: [...path], z: key, relation: null, fixupCase: null }),
      description: `新结点 ${key} 挂在 ${parent ? parent.key + (key < parent.key ? ' 的左孩子' : ' 的右孩子') : '根位置'}，先染成红色。`,
    });

    let current = z;
    while (current.parent && current.parent.red) {
      const father = current.parent;
      const grand = father.parent;
      if (!grand) break;
      const leftSide = father === grand.left;
      const uncle = leftSide ? grand.right : grand.left;

      if (isRed(uncle)) {
        father.red = false;
        uncle.red = false;
        grand.red = true;
        add({
          event: 'fixup', lineId: 'case-uncle-red',
          variables: view({ phase: 'fixup', key, keyIndex, path: [...path], z: current.key, relation: leftSide ? 'left' : 'right', fixupCase: 'case1-uncle-red' }),
          description: `叔结点 ${uncle.key} 为红：父 ${father.key} 与叔同染黑，祖父 ${grand.key} 染红，冲突上移到祖父继续判断。`,
        });
        current = grand;
        continue;
      }

      const inner = leftSide ? current === father.right : current === father.left;
      if (inner) {
        const pivot = father;
        if (leftSide) rotateLeft(pivot); else rotateRight(pivot);
        add({
          event: 'fixup', lineId: leftSide ? 'case-inside-left' : 'case-inside-right',
          variables: view({ phase: 'fixup', key, keyIndex, path: [...path], z: current.key, relation: leftSide ? 'left' : 'right', fixupCase: 'case2-inside' }),
          description: `叔结点为黑且 ${current.key} 是内侧孩子：先绕父结点 ${pivot.key} 旋转，转成外侧情形。`,
        });
        current = pivot;
        continue;
      }

      const grandKey = grand.key;
      father.red = false;
      grand.red = true;
      if (leftSide) rotateRight(grand); else rotateLeft(grand);
      add({
        event: 'fixup', lineId: 'case-outside-rotate',
        variables: view({ phase: 'fixup', key, keyIndex, path: [...path], z: current.key, relation: leftSide ? 'left' : 'right', fixupCase: 'case3-outside' }),
        description: `叔结点为黑且 ${current.key} 是外侧孩子：父 ${father.key} 染黑、祖父 ${grandKey} 染红，再绕祖父向${leftSide ? '右' : '左'}旋转，修复结束。`,
      });
      break;
    }

    if (root) root.red = false;
    const check = validateRedBlack(root);
    add({
      event: 'root-black', lineId: 'fixup-root-black', variables: view({ phase: 'insert', key, keyIndex, path: [...path], z: key, relation: null, fixupCase: null }),
      description: `把根结点 ${root.key} 置黑。校验：根为黑 ${check.rootIsBlack ? '✔' : '✘'}，无红红相邻 ${check.noRedRed ? '✔' : '✘'}，黑高一致 ${check.blackHeightConsistent ? '✔' : '✘'}（黑高 ${check.blackHeight}）。`,
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
        event: 'compare', lineId: 'search-compare',
        variables: view({ phase: 'search', key: target, keyIndex: null, path: [...path], z: null, relation: direction, fixupCase: null }),
        description: direction === 'equal'
          ? `${target} 与结点 ${cursor.key} 相等，命中。`
          : `${target} ${direction === 'left' ? '小于' : '大于'} ${cursor.key}，向${direction === 'left' ? '左' : '右'}继续。`,
      });
      if (direction === 'equal') {
        add({
          event: 'found', lineId: 'search-end', done: true,
          variables: view({ phase: 'search', key: target, keyIndex: null, path: [...path], z: null, relation: null, fixupCase: null, searchResult: cursor.key }),
          description: `查找路径 ${path.join(' → ')}，找到 ${target}（颜色 ${cursor.red ? '红' : '黑'}）。`,
        });
        return { steps, result: { found: cursor.key, path, root: root.key }, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
      cursor = direction === 'left' ? cursor.left : cursor.right;
    }
    add({
      event: 'not-found', lineId: 'search-end', done: true,
      variables: view({ phase: 'search', key: target, keyIndex: null, path: [...path], z: null, relation: null, fixupCase: null, searchResult: null }),
      description: `查找路径 ${path.join(' → ') || '空树'}，未找到 ${target}，返回 NULL。`,
    });
    return { steps, result: { found: null, path, root: root ? root.key : null }, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  add({
    event: 'done', lineId: 'fixup-end', done: true,
    variables: view({ phase: 'insert', key: null, keyIndex: null, z: null, relation: null, fixupCase: null }),
    description: `插入结束，根为 ${root ? root.key : '空'}，共 ${keys.length} 个键；根黑、无红红相邻、各路黑高一致。`,
  });
  return { steps, result: { root: root ? root.key : null, nodes: snapshot(root).nodes, checked: validateRedBlack(root) }, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}

export { SOURCE_VERSION, SOURCE_LINES };
