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
  const { nodes, edges, start } = input;
  const directed = input.directed || false;
  
  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const graph = Array.from({ length: n }, () => Array(n).fill(0));
  
  for (const [u, v] of edges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    if (ui !== undefined && vi !== undefined) {
      graph[ui][vi] = 1;
      if (!directed) graph[vi][ui] = 1;
    }
  }

  const steps = [];
  const stack = [];
  const visited = new Set();
  const discoveryOrder = [];

  function record(event, lineId, description, currentNode = null, currentEdge = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', algorithm: 'dfs', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { stack: [...stack], visited: Array.from(visited), discoveryOrder: [...discoveryOrder], currentNode, currentEdge },
      description, done, result: done ? discoveryOrder : null
    });
  }

  record('init', 'init', `初始化 DFS，准备从起点 ${start} 开始遍历。`);
  
  if (!nodeIndex.has(start)) {
    record('end', 'end', `起点 ${start} 不在图中，遍历结束。`);
    return { steps, result: [], sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  record('init-visited', 'init-visited', `创建 visited 数组，标记未访问。`);
  record('init-stack', 'init-stack', `创建空栈 stack。`);

  const startIdx = nodeIndex.get(start);
  stack.push(start);
  visited.add(start);              // 修复 1：起点入栈时必须标记已访问
  discoveryOrder.push(start);      // 修复 1：起点必须加入访问序列
  record('push-start', 'push-start', `起点 ${start} 入栈并标记为已访问。`, start);

  record('loop', 'loop', `进入 while 循环，检查栈是否为空。`);

  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    const ui = nodeIndex.get(u);
    record('peek', 'peek', `查看栈顶节点 ${u}。`, u);

    let nextNeighbor = null;
    for (let v = 0; v < n; v++) {
      if (graph[ui][v] === 1) {
        const neighbor = nodes[v];
        if (!visited.has(neighbor)) {
          nextNeighbor = neighbor;
          break;
        }
      }
    }

    if (nextNeighbor !== null) {
      record('check-neighbor', 'check-neighbor', `节点 ${u} 发现未访问邻点 ${nextNeighbor}。`, u, [u, nextNeighbor]);
      
      visited.add(nextNeighbor);
      discoveryOrder.push(nextNeighbor);
      record('find-neighbor', 'find-neighbor', `标记 ${nextNeighbor} 为已访问。`, u, [u, nextNeighbor]);

      stack.push(nextNeighbor);
      record('push-neighbor', 'push-neighbor', `将 ${nextNeighbor} 压入栈中，准备深入。`, nextNeighbor, [u, nextNeighbor]);
    
    } else {
      stack.pop();
      record('pop', 'pop', `节点 ${u} 没有未访问的邻点了，出栈回退。`, u);
    }
    
    if (stack.length > 0) {
      record('loop', 'loop', `检查栈是否为空，当前栈顶为 ${stack[stack.length - 1]}。`, stack[stack.length - 1]);
    }
  }

  record('end', 'end', `栈为空，DFS 遍历结束。访问顺序：${discoveryOrder.join(' -> ')}`);
  return { steps, result: discoveryOrder, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}