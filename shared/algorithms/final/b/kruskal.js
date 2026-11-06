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
  const { nodes, edges } = input;
  const n = nodes.length;
  const edgeList = edges.map(([u, v, w]) => ({ u, v, w }));
  
  const steps = [];
  const selectedEdges = [];
  let totalWeight = 0;
  const parent = new Map(nodes.map(node => [node, node]));

  function record(event, lineId, description, currentEdge = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', algorithm: 'kruskal', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: {
        selectedEdges: selectedEdges.map(e => `${e.u}-${e.v}(${e.w})`),
        totalWeight, currentEdge,
        parent: Object.fromEntries(parent)
      },
      description, done, result: done ? { totalWeight, selectedEdges: selectedEdges.map(e => `${e.u}-${e.v}`) } : null
    });
  }

  record('init', 'init', `初始化 Kruskal 算法。`);
  edgeList.sort((a, b) => a.w - b.w);
  record('sort', 'sort', `将所有边按权重从小到大排序。`);
  record('init-dsu', 'init-dsu', `初始化并查集，每个节点各自为一个集合。`);
  record('loop', 'loop', `开始遍历排序后的边。`);

  function findRoot(x) {
    if (parent.get(x) === x) return x;
    return findRoot(parent.get(x));
  }

  for (const edge of edgeList) {
    const { u, v, w } = edge;
    record('find-u', 'find-u', `检查边 ${u}-${v} (权重 ${w})。查找 ${u} 所在集合的根。`, [u, v, w]);
    const rootU = findRoot(u);
    record('find-v', 'find-v', `查找 ${v} 所在集合的根。`, [u, v, w]);
    const rootV = findRoot(v);
    record('check-root', 'check-root', `判断 ${u} 和 ${v} 是否在同一个集合。`, [u, v, w]);

    if (rootU !== rootV) {
      parent.set(rootU, rootV);
      selectedEdges.push(edge);
      totalWeight += w;
      record('union', 'union', `根不同，不会成环。合并集合，将边加入最小生成树。`, [u, v, w]);
    } else {
      record('check-root', 'check-root', `根相同，加入该边会成环，跳过。`, [u, v, w]);
    }
    if (selectedEdges.length === n - 1) break;
  }

  record('end', 'end', `Kruskal 算法结束。总权重：${totalWeight}`);
  return { steps, result: steps[steps.length - 1].result, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}