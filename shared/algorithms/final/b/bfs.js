import { validateGraphInput } from './validate-util.js';

const SOURCE_VERSION = 'bfs-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void bfs(int graph[][MAX], int start, int n) {' },
  { lineId: 'init-visited', text: '  int visited[MAX] = {0};' },
  { lineId: 'init-queue', text: '  int queue[MAX], front = 0, rear = 0;' },
  { lineId: 'mark-start', text: '  visited[start] = 1;' },
  { lineId: 'enqueue-start', text: '  queue[rear++] = start;' },
  { lineId: 'loop', text: '  while (front < rear) {' },
  { lineId: 'dequeue', text: '    int u = queue[front++];' },
  { lineId: 'loop-neighbors', text: '    for (int v = 0; v < n; v++) {' },
  { lineId: 'check-neighbor', text: '      if (graph[u][v] && !visited[v]) {' },
  { lineId: 'mark-neighbor', text: '        visited[v] = 1;' },
  { lineId: 'enqueue-neighbor', text: '        queue[rear++] = v;' },
  { lineId: 'end', text: '      }\n    }\n  }\n}' }
];

export function generateBfsSteps(input) {
  const validEdges = validateGraphInput(input, 'BFS', false);
  const { nodes, start, directed } = input;
  
  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const graph = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (const { u, v } of validEdges) {
    const ui = nodeIndex.get(u); const vi = nodeIndex.get(v);
    graph[ui][vi] = 1; if (!directed) graph[vi][ui] = 1;
  }

  const steps = [];
  const queue = [];
  const visited = new Set();
  const discoveryOrder = [];

  function record(event, lineId, description, currentNode = null, currentEdge = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', algorithm: 'bfs', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { queue: [...queue], visited: Array.from(visited), discoveryOrder: [...discoveryOrder], currentNode, currentEdge },
      description, done, result: done ? discoveryOrder : null
    });
  }

  record('init', 'init', `初始化 BFS。`); record('init-visited', 'init-visited', `创建 visited。`); record('init-queue', 'init-queue', `创建队列。`);
  
  visited.add(start); discoveryOrder.push(start);
  record('mark-start', 'mark-start', `标记起点 ${start}。`, start);
  queue.push(start);
  record('enqueue-start', 'enqueue-start', `起点 ${start} 入队。`, start);
  record('loop', 'loop', `进入 while 循环。`);
  
  while (queue.length > 0) {
    const u = queue.shift(); 
    record('dequeue', 'dequeue', `节点 ${u} 出队。`, u);
    record('loop-neighbors', 'loop-neighbors', `遍历 ${u} 邻接点。`, u);
    const ui = nodeIndex.get(u);
    for (let v = 0; v < n; v++) {
      if (graph[ui][v] === 1) {
        const neighbor = nodes[v];
        record('check-neighbor', 'check-neighbor', `发现邻点 ${neighbor}。`, u, [u, neighbor]);
        if (!visited.has(neighbor)) {
          visited.add(neighbor); discoveryOrder.push(neighbor);
          record('mark-neighbor', 'mark-neighbor', `标记 ${neighbor}。`, u, [u, neighbor]);
          queue.push(neighbor);
          record('enqueue-neighbor', 'enqueue-neighbor', `入队 ${neighbor}。`, u, [u, neighbor]);
        } else {
          record('skip-neighbor', 'check-neighbor', `跳过已访问 ${neighbor}。`, u, [u, neighbor]);
        }
      }
    }
    record('loop', 'loop', `队列状态：${queue.join(', ')}。`, u);
  }
  record('end', 'end', `结束：${discoveryOrder.join(' -> ')}`);
  return { steps, result: discoveryOrder, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}