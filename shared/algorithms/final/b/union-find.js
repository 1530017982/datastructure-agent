import { DSU } from './dsu-util.js';

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
  { lineId: 'check-rank', text: '    if (rank[rootX] < rank[rootY]) {' },
  { lineId: 'merge-x-to-y', text: '      parent[rootX] = rootY;' },
  { lineId: 'merge-y-to-x', text: '    } else { parent[rootY] = rootX; }' },
  { lineId: 'end', text: '}' }
];

export function generateUnionFindSteps(input) {
  const { elements, operations } = input;
  const dsu = new DSU(elements);
  let setCount = dsu.setCount;
  const steps = [];
  const failedOps = []; 

  function record(event, lineId, description, currentOp = null, errorMsg = null) {
    const done = event === 'end';
    const dsuState = dsu.getState();
    
    steps.push({
      schemaVersion: '1.0', algorithm: 'union-find', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { parent: dsuState.parent, rank: dsuState.rank, setCount, currentOp, errorMsg },
      description, done, 
      result: done ? { setCount, failedOps } : null 
    });
  }

  record('init', 'init', `初始化并查集。`);
  record('parent-self', 'parent-self', `每个元素的父节点初始化为自身。共 ${setCount} 个集合。`);

  for (const op of operations) {
    const [type, x, y] = op;
    
    if (type !== 'find' && type !== 'union') {
      failedOps.push({ op, reason: `不支持的操作类型：${type}` });
      continue;
    }

    if (!dsu.parent.has(x) || (type === 'union' && !dsu.parent.has(y))) {
      failedOps.push({ op, reason: `未知元素错误：${!dsu.parent.has(x) ? x : y} 不存在。` });
      continue;
    }

    record('find', 'find', `开始处理 ${type}(${x}${y ? ', ' + y : ''})。查找 ${x} 的根。`, op);
      
    const rootX = dsu.find(x);
    record('find-root', 'find-root', `找到 ${x} 的根：${rootX}。`, op);

    if (type === 'find') {
      record('path-compress', 'path-compress', `${x} 指向根 ${rootX}。`, op);
      continue;
    }

    const rootY = dsu.find(y);
    record('find-roots', 'find-roots', `找到 ${y} 的根：${rootY}。`, op);
    record('check-root', 'check-root', `判断 ${rootX} 和 ${rootY} 是否相同。`, op);

    if (rootX !== rootY) {
      const rankX = dsu.rank.get(rootX);
      const rankY = dsu.rank.get(rootY);
      
      dsu.union(x, y);
      setCount = dsu.setCount;

      if (rankX < rankY) {
        record('merge', 'merge-x-to-y', `rootX 的秩较小，将 ${rootX} 挂到 ${rootY} 下。`, op);
      } else if (rankX > rankY) {
        record('merge', 'merge-y-to-x', `rootY 的秩较小，将 ${rootY} 挂到 ${rootX} 下。`, op);
      } else {
        record('merge', 'merge-y-to-x', `秩相同，将 ${rootY} 挂到 ${rootX} 下，并增加 ${rootX} 的秩。`, op);
      }
    } else {
      record('check-root', 'check-root', `根相同，无需合并。当前集合数：${setCount}。`, op);
    }
  }

  record('end', 'end', `所有操作完成。当前集合数：${setCount}。失败操作数：${failedOps.length}。`);
  return { steps, result: steps[steps.length - 1].result, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}