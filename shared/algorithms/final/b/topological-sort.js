import { validateGraphInput } from './validate-util.js';

const SOURCE_VERSION = 'topo-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void topoSort(int graph[][MAX], int n) {' },
  { lineId: 'init-degree', text: '  int inDegree[MAX] = {0};' },
  { lineId: 'calc-degree', text: '  // 统计所有节点的入度' },
  { lineId: 'init-queue', text: '  queue<int> q;' },
  { lineId: 'push-zero', text: '  // 将入度为0的节点入队' },
  { lineId: 'loop', text: '  while (!q.empty()) {' },
  { lineId: 'pop', text: '    int u = q.front(); q.pop();' },
  { lineId: 'loop-neighbors', text: '    for (int v = 0; v < n; v++) {' },
  { lineId: 'dec-degree', text: '      if (graph[u][v] == 1) {' },
  { lineId: 'check-zero', text: '        if (--inDegree[v] == 0) q.push(v);' },
  { lineId: 'end', text: '}' }
];

export function generateTopoSteps(input) {
  const { nodes } = input;
  // 使用统一的校验工具，强制要求是有向图
  const validEdges = validateGraphInput(input, '拓扑排序',true);

  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const graph = Array.from({ length: n }, () => Array(n).fill(0));
  const inDegree = new Map(nodes.map(node => [node, 0]));

  for (const { u, v } of validEdges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    graph[ui][vi] = 1;
    inDegree.set(v, inDegree.get(v) + 1);
  }

  const steps = [];
  const queue = [];
  const resultOrder = [];

  function record(event, lineId, description, currentNode = null, currentEdge = null, customResult = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', algorithm: 'topological-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { inDegree: Object.fromEntries(inDegree), queue: [...queue], resultOrder: [...resultOrder], currentNode, currentEdge },
      description, done, 
      result: done ? (customResult || resultOrder) : null 
    });
  }

  record('init', 'init', `初始化拓扑排序。`);
  record('init-degree', 'init-degree', `初始化入度表。`);
  record('calc-degree', 'calc-degree', `统计每个节点的入度。`);

  for (const node of nodes) {
    if (inDegree.get(node) === 0) queue.push(node);
  }
  record('init-queue', 'init-queue', `创建零入度队列。`);
  record('push-zero', 'push-zero', `将入度为 0 的节点加入队列：${queue.join(', ')}。`);
  record('loop', 'loop', `进入 while 循环。`);

  while (queue.length > 0) {
    const u = queue.shift();
    resultOrder.push(u);
    record('pop', 'pop', `节点 ${u} 出队，加入拓扑序列。`, u);

    const ui = nodeIndex.get(u);
    record('loop-neighbors', 'loop-neighbors', `检查 ${u} 的后继节点。`, u);

    for (let v = 0; v < n; v++) {
      if (graph[ui][v] === 1) {
        const neighbor = nodes[v];
        record('dec-degree', 'dec-degree', `找到边 ${u} -> ${neighbor}，准备将入度减 1。`, u, [u, neighbor]);
        const newDegree = inDegree.get(neighbor) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
          record('check-zero', 'check-zero', `${neighbor} 入度变为 0，加入队列。`, u, [u, neighbor]);
        } else {
          record('dec-degree', 'dec-degree', `${neighbor} 的入度变为 ${newDegree}。`, u, [neighbor]);
        }
      }
    }
    record('loop', 'loop', `当前队列状态：${queue.length ? queue.join(', ') : '空'}。`, u);
  }

  if (resultOrder.length === n) {
    record('end', 'end', `所有节点均已输出，拓扑排序完成。`);
  } else {
    record('end', 'end', `输出的节点数少于总数，图中存在环，无法完成拓扑排序！`, null, null, 'Has Cycle');
  }

  return { steps, result: resultOrder.length === n ? resultOrder : 'Has Cycle', sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}