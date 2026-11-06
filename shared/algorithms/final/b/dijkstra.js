import { validateGraphInput } from './validate-util.js';

const SOURCE_VERSION = 'dijkstra-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void dijkstra(int graph[][MAX], int start, int n) {' },
  { lineId: 'init-dist', text: '  int dist[MAX]; bool visited[MAX] = {0};' },
  { lineId: 'set-dist', text: '  for (int i = 0; i < n; i++) dist[i] = INF;' },
  { lineId: 'start-dist', text: '  dist[start] = 0;' },
  { lineId: 'loop', text: '  for (int count = 0; count < n; count++) {' },
  { lineId: 'find-min', text: '    int u = findMinDistance(dist, visited);' },
  { lineId: 'mark-visited', text: '    if (u == -1) break; visited[u] = 1;' },
  { lineId: 'loop-neighbors', text: '    for (int v = 0; v < n; v++) {' },
  { lineId: 'check-relax', text: '      if (!visited[v] && graph[u][v] != INF && dist[u] + graph[u][v] < dist[v]) {' },
  { lineId: 'update-dist', text: '        dist[v] = dist[u] + graph[u][v];' },
  { lineId: 'end', text: '}' }
];

export function generateDijkstraSteps(input) {
  const { nodes, start, directed } = input;
  const validEdges = validateGraphInput(input, 'Dijkstra', true);
  
  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const graph = Array.from({ length: n }, () => Array(n).fill(Infinity));
  
  for (const { u, v, w } of validEdges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    graph[ui][vi] = w;
    if (!directed) graph[vi][ui] = w;
  }

  const steps = [];
  const dist = Array(n).fill(Infinity);
  const visited = new Set();
  const previous = Array(n).fill(null);

  function record(event, lineId, description, currentNode = null, currentEdge = null) {
    const done = event === 'end';
    // 修复：使用 Object.create(null) 防止 __proto__ 丢失
    const distDisplay = Object.create(null);
    nodes.forEach((node, i) => { distDisplay[node] = dist[i] === Infinity ? '∞' : dist[i]; });
    
    const prevDisplay = Object.create(null);
    nodes.forEach((node, i) => { prevDisplay[node] = previous[i]; });

    steps.push({
      schemaVersion: '1.0', algorithm: 'dijkstra', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { dist: distDisplay, previous: prevDisplay, visited: Array.from(visited), currentNode, currentEdge },
      description, done, result: done ? distDisplay : null
    });
  }

  record('init', 'init', `初始化 Dijkstra，准备从起点 ${start} 开始。`);
  record('init-dist', 'init-dist', `创建距离数组 dist，所有节点初始距离为无穷大。`);
  const startIdx = nodeIndex.get(start);
  dist[startIdx] = 0;
  record('start-dist', 'start-dist', `起点 ${start} 到自己的距离设为 0。`);
  record('loop', 'loop', `进入主循环。`);

  for (let count = 0; count < n; count++) {
    let uIdx = -1, minDist = Infinity;
    for (let i = 0; i < n; i++) {
      if (!visited.has(nodes[i]) && dist[i] < minDist) { minDist = dist[i]; uIdx = i; }
    }

    if (uIdx === -1) {
      record('mark-visited', 'mark-visited', `剩下的节点都不可达，提前结束循环。`);
      break;
    }

    const u = nodes[uIdx];
    record('find-min', 'find-min', `找到当前距离最小的未访问节点：${u} (距离: ${dist[uIdx]})。`, u);
    visited.add(u);
    record('mark-visited', 'mark-visited', `节点 ${u} 的最短距离已确定，标记为已访问。`, u);
    record('loop-neighbors', 'loop-neighbors', `开始检查 ${u} 的邻接点，进行松弛操作。`, u);

    for (let vIdx = 0; vIdx < n; vIdx++) {
      if (graph[uIdx][vIdx] !== Infinity && !visited.has(nodes[vIdx])) {
        const v = nodes[vIdx], weight = graph[uIdx][vIdx], newDist = dist[uIdx] + weight;
        record('check-relax', 'check-relax', `检查边 ${u} -> ${v}，如果借道 ${u} 更近，则更新距离。`, u, [u, v, weight]);
        if (newDist < dist[vIdx]) {
          dist[vIdx] = newDist; previous[vIdx] = u;
          record('update-dist', 'update-dist', `发现更短路径！更新 ${v} 的距离为 ${newDist}，前驱设为 ${u}。`, u, [u, v, weight]);
        }
      }
    }
  }

  record('end', 'end', `所有可达节点处理完毕，Dijkstra 结束。`);
  return { steps, result: steps[steps.length - 1].variables.dist, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}