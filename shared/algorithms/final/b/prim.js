const SOURCE_VERSION = 'prim-c-v1';

const SOURCE_LINES = [
  { lineId: 'init', text: 'void prim(int graph[][MAX], int start, int n) {' },
  { lineId: 'init-key', text: '  int key[MAX]; bool inMST[MAX] = {0};' },
  { lineId: 'set-key', text: '  for (int i = 0; i < n; i++) key[i] = INF;' },
  { lineId: 'start-key', text: '  key[start] = 0;' },
  { lineId: 'loop', text: '  for (int count = 0; count < n; count++) {' },
  { lineId: 'find-min', text: '    int u = findMinKey(key, inMST);' },
  { lineId: 'mark-mst', text: '    if (u == -1) break; inMST[u] = 1;' },
  { lineId: 'loop-neighbors', text: '    for (int v = 0; v < n; v++) {' },
  // 修复：使用 != INF 判断，防止 0 权边被跳过
  { lineId: 'check-relax', text: '      if (!inMST[v] && graph[u][v] != INF && graph[u][v] < key[v]) {' },
  { lineId: 'update-key', text: '        key[v] = graph[u][v]; parent[v] = u;' },
  { lineId: 'end', text: '}' }
];

export function generatePrimSteps(input) {
  const { nodes, edges, start, directed } = input;
  if (directed === true) throw new Error("Prim 算法只支持无向图！");

  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const graph = Array.from({ length: n }, () => Array(n).fill(Infinity));
  
  for (const [u, v, w] of edges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    if (ui === undefined || vi === undefined) throw new Error("包含未声明的节点！");
    
    graph[ui][vi] = Math.min(graph[ui][vi], w);
    graph[vi][ui] = Math.min(graph[vi][ui], w);
  }

  const steps = [];
  const key = Array(n).fill(Infinity);
  const inMST = new Set();
  const parent = Array(n).fill(null);
  let totalWeight = 0;

  function record(event, lineId, description, currentNode = null, currentEdge = null) {
    const done = event === 'end';
    const keyDisplay = {};
    nodes.forEach((node, i) => { keyDisplay[node] = key[i] === Infinity ? '∞' : key[i]; });
    const parentDisplay = {};
    nodes.forEach((node, i) => { parentDisplay[node] = parent[i]; });

    steps.push({
      schemaVersion: '1.0', algorithm: 'prim', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { key: keyDisplay, parent: parentDisplay, inMST: Array.from(inMST), totalWeight, currentNode, currentEdge },
      description, done, result: done ? { totalWeight, mstNodes: Array.from(inMST) } : null
    });
  }

  record('init', 'init', `初始化 Prim 算法。`);
  if (!nodeIndex.has(start)) {
    record('end', 'end', `起点 ${start} 不在图中，结束。`);
    return { steps, result: { totalWeight: 0, mstNodes: [] }, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  record('init-key', 'init-key', `创建 key 数组，初始化为无穷大。`);
  const startIdx = nodeIndex.get(start);
  key[startIdx] = 0;
  record('start-key', 'start-key', `起点 ${start} 的 key 设为 0。`);
  record('loop', 'loop', `进入主循环。`);

  for (let count = 0; count < n; count++) {
    let uIdx = -1, minKey = Infinity;
    for (let i = 0; i < n; i++) {
      if (!inMST.has(nodes[i]) && key[i] < minKey) { minKey = key[i]; uIdx = i; }
    }

    if (uIdx === -1) {
      record('mark-mst', 'mark-mst', `图不连通，存在无法到达的顶点，提前结束。`);
      break;
    }

    const u = nodes[uIdx];
    record('find-min', 'find-min', `找到当前 key 最小的顶点：${u} (权重: ${key[uIdx]})。`, u);
    
    inMST.add(u);
    if (parent[uIdx] !== null) totalWeight += key[uIdx];
    record('mark-mst', 'mark-mst', `将 ${u} 加入生成树。当前总权重: ${totalWeight}。`, u);
    record('loop-neighbors', 'loop-neighbors', `检查 ${u} 的邻接点，更新候选边。`, u);

    for (let vIdx = 0; vIdx < n; vIdx++) {
      if (graph[uIdx][vIdx] !== Infinity && !inMST.has(nodes[vIdx])) {
        const v = nodes[vIdx], weight = graph[uIdx][vIdx];
        record('check-relax', 'check-relax', `检查边 ${u} -> ${v} (权重 ${weight})。`, u, [u, v, weight]);
        if (weight < key[vIdx]) {
          key[vIdx] = weight;
          parent[vIdx] = u;
          record('update-key', 'update-key', `发现更小的连边，更新 ${v} 的 key 为 ${weight}，前驱为 ${u}。`, u, [u, v, weight]);
        }
      }
    }
  }

  record('end', 'end', `Prim 算法结束。总权重：${totalWeight}`);
  return { steps, result: steps[steps.length - 1].result, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}