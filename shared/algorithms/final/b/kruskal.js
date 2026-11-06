import { DSU } from './dsu-util.js';
import { validateGraphInput } from './validate-util.js';

const SOURCE_VERSION = 'kruskal-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void kruskal(Edge edges[], int E, int V) {' },
  { lineId: 'sort', text: '  sort(edges, edges + E);' },
  { lineId: 'init-dsu', text: '  initDSU(V);' },
  { lineId: 'loop', text: '  for (int i = 0; i < E; i++) {' },
  { lineId: 'find-u', text: '    int rootU = find(edges[i].u);' },
  { lineId: 'find-v', text: '    int rootV = find(edges[i].v);' },
  { lineId: 'check-root', text: '    if (rootU != rootV) {' },
  { lineId: 'union', text: '      unionSet(rootU, rootV);' },
  { lineId: 'end', text: '}' }
];

export function generateKruskalSteps(input) {
  const { nodes } = input;
  const validEdges = validateGraphInput(input, 'Kruskal', true);

  const n = nodes.length;
  const dsu = new DSU(nodes);
  // 记录原始索引以确保同权边稳定排序
  const edgeList = validEdges.map((e, index) => ({ u: e.u, v: e.v, w: e.w, originalIndex: index }));
  
  const steps = [];
  const selectedEdges = [];
  let totalWeight = 0;

  function record(event, lineId, description, currentEdge = null) {
    const done = event === 'end';
    const isForest = selectedEdges.length < n - 1; 
    const dsuState = dsu.getState();
    
    steps.push({
      schemaVersion: '1.0', algorithm: 'kruskal', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { 
        sortedEdges: edgeList.map(e => `${e.u}-${e.v}(${e.w})`),
        selectedEdges: selectedEdges.map(e => `${e.u}-${e.v}(${e.w})`), 
        totalWeight, currentEdge, isForest, parent: dsuState.parent, rank: dsuState.rank 
      },
      description, done, result: done ? { totalWeight, selectedEdges: selectedEdges.map(e => `${e.u}-${e.v}`), isForest } : null
    });
  }

  record('init', 'init', `初始化 Kruskal 算法。`);
  // 修复：增加 originalIndex 比较作为第二排序条件，确保同权边顺序稳定
  edgeList.sort((a, b) => {
    if (a.w !== b.w) return a.w - b.w;
    return a.originalIndex - b.originalIndex;
  });
  record('sort', 'sort', `将所有边按权重从小到大稳定排序。`);
  record('init-dsu', 'init-dsu', `初始化并查集，每个节点各自为一个集合。`);
  record('loop', 'loop', `开始遍历排序后的边。`);

  for (const edge of edgeList) {
    const { u, v, w } = edge;
    record('find-u', 'find-u', `检查边 ${u}-${v} (权重 ${w})。查找 ${u} 所在集合的根。`, [u, v, w]);
    const rootU = dsu.find(u);
    record('find-v', 'find-v', `查找 ${v} 所在集合的根。`, [u, v, w]);
    const rootV = dsu.find(v);
    record('check-root', 'check-root', `判断 ${u} 和 ${v} 是否在同一个集合。`, [u, v, w]);

    if (rootU !== rootV) {
      dsu.union(u, v);
      selectedEdges.push(edge);
      totalWeight += w;
      record('union', 'union', `根不同，不会成环。按秩合并集合并加入边。`, [u, v, w]);
    } else {
      record('check-root', 'check-root', `根相同，加入该边会成环，跳过。`, [u, v, w]);
    }
    if (selectedEdges.length === n - 1) break;
  }

  if (selectedEdges.length === n - 1) {
    record('end', 'end', `Kruskal 算法结束。生成一棵最小生成树，总权重：${totalWeight}`);
  } else {
    record('end', 'end', `Kruskal 算法结束。图不连通，生成最小生成森林，总权重：${totalWeight}`);
  }
  return { steps, result: steps[steps.length - 1].result, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}