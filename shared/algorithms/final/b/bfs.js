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
  { lineId: 'end', text: '}' }
];

export function generateBfsSteps(input) {
  const { nodes, start, directed } = input;
  const validEdges = validateGraphInput(input, 'BFS',false);

  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const graph = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (const { u, v } of validEdges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    graph[ui][vi] = 1;
    if (!directed) graph[vi][ui] = 1;
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

  record('init', 'init', `初始化 BFS，准备从起点 ${start} 开始遍历。`);
  record('init-visited', 'init-visited', `创建 visited 数组，标记未访问。`);
  record('init-queue', 'init-queue', `创建空队列 queue。`);
  
  visited.add(start);
  discoveryOrder.push(start);
  record('mark-start', 'mark-start', `标记起点 ${start} 为已访问。`, start);

  queue.push(start);
  record('enqueue-start', 'enqueue-start', `将起点 ${start} 入队。`, start);

  record('loop', 'loop', `进入 while 循环，检查队列是否为空。`);
  
  while (queue.length > 0) {
    const u = queue.shift(); 
    record('dequeue', 'dequeue', `节点 ${u} 出队，成为当前处理节点。`, u);
    record('loop-neighbors', 'loop-neighbors', `开始遍历 ${u} 的所有邻接点。`, u);
    
    const ui = nodeIndex.get(u);
    for (let v = 0; v < n; v++) {
      if (graph[ui][v] === 1) {
        const neighbor = nodes[v];
        record('check-neighbor', 'check-neighbor', `发现邻接点 ${neighbor}，检查是否已访问。`, u, [u, neighbor]);
        
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          discoveryOrder.push(neighbor);
          record('mark-neighbor', 'mark-neighbor', `${neighbor} 未被访问，标记为已访问。`, u, [u, neighbor]);
          queue.push(neighbor);
          record('enqueue-neighbor', 'enqueue-neighbor', `将 ${neighbor} 入队。`, u, [u, neighbor]);
        } else {
          record('skip-neighbor', 'check-neighbor', `${neighbor} 已被访问过，跳过。`, u, [u, neighbor]);
        }
      }
    }
    record('loop', 'loop', `${u} 的邻接点处理完毕。检查队列是否还有节点。`, u);
  }

  record('end', 'end', `队列为空，BFS 遍历结束。完整访问顺序：${discoveryOrder.join(' -> ')}`);
  return { steps, result: discoveryOrder, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}