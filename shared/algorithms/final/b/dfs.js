const SOURCE_VERSION = 'dfs-c-v1';

const SOURCE_LINES = [
  { lineId: 'init', text: 'void dfs(int graph[][MAX], int start, int n) {' },
  { lineId: 'init-visited', text: '  int visited[MAX] = {0};' },
  { lineId: 'init-stack', text: '  int stack[MAX], top = -1;' },
  { lineId: 'push-start', text: '  stack[++top] = start;' },
  { lineId: 'loop', text: '  while (top >= 0) {' },
  { lineId: 'peek', text: '    int u = stack[top];' },
  { lineId: 'check-neighbor', text: '    if (hasUnvisitedNeighbor(u)) {' },
  { lineId: 'find-neighbor', text: '      int v = getUnvisitedNeighbor(u);' },
  { lineId: 'mark-neighbor', text: '      visited[v] = 1;' },
  { lineId: 'push-neighbor', text: '      stack[++top] = v;' },
  { lineId: 'pop', text: '    } else { top--; } // 回退' },
  { lineId: 'end', text: '}' }
];

export function generateDfsSteps(input) {
  // 输入格式与 BFS 完全一致: { nodes: [], edges: [['A','B']], start: 'A' }
  const { nodes, edges, start } = input;
  
  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const graph = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (const [u, v] of edges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    if (ui !== undefined && vi !== undefined) {
      graph[ui][vi] = 1;
      graph[vi][ui] = 1; // 默认无向图
    }
  }

  const steps = [];
  const stack = [];
  const visited = new Set();
  const discoveryOrder = [];

  function record(event, lineId, description, currentNode = null, currentEdge = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', 
      algorithm: 'dfs', 
      stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, 
      event, 
      lineId, 
      variables: {
        stack: [...stack],
        visited: Array.from(visited),
        discoveryOrder: [...discoveryOrder],
        currentNode,
        currentEdge
      },
      description, 
      done, 
      result: done ? discoveryOrder : null
    });
  }

  // 1. 初始化
  record('init', 'init', `初始化 DFS，准备从起点 ${start} 开始遍历。`);
  
  if (!nodeIndex.has(start)) {
    record('end', 'end', `起点 ${start} 不在图中，遍历结束。`);
    return { steps, result: [], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  record('init-visited', 'init-visited', `创建 visited 数组，标记未访问。`);
  record('init-stack', 'init-stack', `创建空栈 stack。`);

  // 2. 起点入栈并标记
  const startIdx = nodeIndex.get(start);
  stack.push(start);
  record('push-start', 'push-start', `起点 ${start} 入栈。`, start);

  // 3. 开始循环
  record('loop', 'loop', `进入 while 循环，检查栈是否为空。`);

  while (stack.length > 0) {
    const u = stack[stack.length - 1]; // 获取栈顶元素，但不弹出（Peek）
    const ui = nodeIndex.get(u);
    
    record('peek', 'peek', `查看栈顶节点 ${u}。`, u);

    // 寻找未访问的邻接点
    let nextNeighbor = null;
    let nextNeighborIdx = -1;

    for (let v = 0; v < n; v++) {
      if (graph[ui][v] === 1) {
        const neighbor = nodes[v];
        if (!visited.has(neighbor)) {
          nextNeighbor = neighbor;
          nextNeighborIdx = v;
          break; // 找到第一个未访问的就停下（固定邻接顺序）
        }
      }
    }

    if (nextNeighbor !== null) {
      // 找到了未访问的邻接点，深入
      record('check-neighbor', 'check-neighbor', `节点 ${u} 发现未访问邻点 ${nextNeighbor}。`, u, [u, nextNeighbor]);
      
      visited.add(nextNeighbor);
      discoveryOrder.push(nextNeighbor);
      record('find-neighbor', 'find-neighbor', `标记 ${nextNeighbor} 为已访问。`, u, [u, nextNeighbor]);

      stack.push(nextNeighbor);
      record('push-neighbor', 'push-neighbor', `将 ${nextNeighbor} 压入栈中，准备深入。`, nextNeighbor, [u, nextNeighbor]);
    
    } else {
      // 没有未访问的邻接点，回退（出栈）
      stack.pop();
      record('pop', 'pop', `节点 ${u} 没有未访问的邻点了，出栈回退。`, u);
    }
    
    if (stack.length > 0) {
      record('loop', 'loop', `检查栈是否为空，当前栈顶为 ${stack[stack.length - 1]}。`, stack[stack.length - 1]);
    }
  }

  // 4. 结束
  record('end', 'end', `栈为空，DFS 遍历结束。访问顺序：${discoveryOrder.join(' -> ')}`);
  
  return { steps, result: discoveryOrder, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}