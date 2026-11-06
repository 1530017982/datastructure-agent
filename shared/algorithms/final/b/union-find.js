const SOURCE_VERSION = 'uf-c-v1';

const SOURCE_LINES = [
  { lineId: 'init', text: 'void initDSU(int n) {' },
  { lineId: 'parent-self', text: '  for (int i = 0; i < n; i++) parent[i] = i;' },
  { lineId: 'find', text: 'int find(int x) {' },
  { lineId: 'find-root', text: '  if (parent[x] == x) return x;' },
  { lineId: 'path-compress', text: '  return parent[x] = find(parent[x]);' },
  { lineId: 'union', text: 'void union(int x, int y) {' },
  { lineId: 'find-roots', text: '  int rootX = find(x), rootY = find(y);' },
  { lineId: 'check-root', text: '  if (rootX != rootY) {' },
  { lineId: 'merge', text: '    parent[rootX] = rootY;' },
  { lineId: 'end', text: '}' }
];

export function generateUnionFindSteps(input) {
  const { elements, operations } = input;
  const n = elements.length;
  
  const parent = new Map(elements.map(e => [e, e]));
  let setCount = n;
  const steps = [];

  function record(event, lineId, description, currentOp = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', algorithm: 'union-find', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { parent: Object.fromEntries(parent), setCount, currentOp },
      description, done, result: done ? { setCount } : null
    });
  }

  record('init', 'init', `初始化并查集。`);
  record('parent-self', 'parent-self', `每个元素的父节点初始化为自身。共 ${setCount} 个集合。`);

  for (const op of operations) {
    const [type, x, y] = op;
    
    // 修复 4：未定义元素校验
    if (type === 'find' || type === 'union') {
      if (!parent.has(x) || (type === 'union' && !parent.has(y))) {
        record('init', 'init', `错误：操作序列包含未知元素，拒绝执行。`, op);
        continue;
      }
    }

    if (type === 'find' || type === 'union') {
      record('find', 'find', `开始处理 ${type}(${x}${y ? ', ' + y : ''})。查找 ${x} 的根。`, op);
      
      function findRoot(node) {
        if (parent.get(node) === node) return node;
        const root = findRoot(parent.get(node));
        parent.set(node, root);
        return root;
      }

      const rootX = findRoot(x);
      record('find-root', 'find-root', `找到 ${x} 的根：${rootX}。`, op);

      if (type === 'find') {
        record('path-compress', 'path-compress', `${x} 指向根 ${rootX}。`, op);
        continue;
      }

      const rootY = findRoot(y);
      record('find-roots', 'find-roots', `找到 ${y} 的根：${rootY}。`, op);
      record('check-root', 'check-root', `判断 ${rootX} 和 ${rootY} 是否相同。`, op);

      if (rootX !== rootY) {
        parent.set(rootX, rootY);
        setCount--;
        record('merge', 'merge', `根不同，合并集合。${rootX} 的父节点指向 ${rootY}，当前集合数：${setCount}。`, op);
      } else {
        record('check-root', 'check-root', `根相同，本就在同一集合，无需合并。当前集合数：${setCount}。`, op);
      }
    }
  }

  record('end', 'end', `所有操作完成。当前集合数：${setCount}。`);
  return { steps, result: steps[steps.length - 1].result, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}