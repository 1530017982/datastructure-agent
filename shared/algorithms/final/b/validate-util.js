export function validateGraphInput(input, algoName, isWeighted) {
  if (!input || typeof input !== 'object') {
    throw new Error(`【${algoName}】输入必须是一个对象。`);
  }
  const { nodes, edges, start } = input;
  
  let directed = false;
  if ('directed' in input) {
    if (typeof input.directed !== 'boolean') {
      throw new Error(`【${algoName}】方向字段 directed 必须是布尔值。`);
    }
    directed = input.directed;
  }

  // 1. 严格校验 nodes
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error(`【${algoName}】顶点 nodes 必须是非空数组。`);
  }
  const nodeMap = new Map();
  for (let i = 0; i < nodes.length; i++) {
    if (typeof nodes[i] !== 'string' || nodes[i].trim() === '') {
      throw new Error(`【${algoName}】第 ${i + 1} 个顶点不是非空字符串。`);
    }
    if (nodeMap.has(nodes[i])) {
      throw new Error(`【${algoName}】顶点 ${nodes[i]} 存在重复。`);
    }
    nodeMap.set(nodes[i], true);
  }

  // 2. 严格校验 edges
  if (!Array.isArray(edges)) {
    throw new Error(`【${algoName}】边 edges 必须是数组。`);
  }
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!Array.isArray(edge)) {
      throw new Error(`【${algoName}】第 ${i + 1} 条边必须是数组。`);
    }
    if (isWeighted) {
      if (edge.length !== 3) throw new Error(`【${algoName}】第 ${i + 1} 条带权边必须是 [起点, 终点, 权重] 格式。`);
    } else {
      if (edge.length !== 2) throw new Error(`【${algoName}】第 ${i + 1} 条无权边必须是 [起点, 终点] 格式。`);
    }

    const [u, v, w] = edge;
    if (typeof u !== 'string' || !nodeMap.has(u)) throw new Error(`【${algoName}】第 ${i + 1} 条边引用了未声明的顶点 ${u}。`);
    if (typeof v !== 'string' || !nodeMap.has(v)) throw new Error(`【${algoName}】第 ${i + 1} 条边引用了未声明的顶点 ${v}。`);

    if (isWeighted) {
      if (w === undefined || w === null) throw new Error(`【${algoName}】第 ${i + 1} 条边缺失权重。`);
      if (typeof w !== 'number' || !isFinite(w)) throw new Error(`【${algoName}】第 ${i + 1} 条边权重必须是有限数值。`);
      if (algoName === 'Dijkstra' && w < 0) throw new Error(`【${algoName}】第 ${i + 1} 条边包含负权，Dijkstra 拒绝负权。`);
    }
  }

  // 3. 方向与起点校验
  if (algoName === 'Prim' || algoName === 'Kruskal') {
    if (directed === true) throw new Error(`【${algoName}】只接受无向图 (directed=false)。`);
  }
  if (algoName === '拓扑排序') {
    if (directed === false) throw new Error(`【${algoName}】只接受有向图 (directed=true)。`);
  }
  if (['BFS', 'DFS', 'Prim', 'Dijkstra'].includes(algoName)) {
    if (typeof start !== 'string' || !nodeMap.has(start)) throw new Error(`【${algoName}】起点 start 必须存在且包含在顶点列表中。`);
  }

  // 4. 过滤重复边并取最小权重
  const finalEdges = new Map();
  for (const [u, v, w] of edges) {
    const key = directed ? JSON.stringify([u, v]) : JSON.stringify(u < v ? [u, v] : [v, u]);
    if (!finalEdges.has(key)) {
      finalEdges.set(key, { u, v, w });
    } else if (isWeighted) {
      const existing = finalEdges.get(key);
      if (w < existing.w) existing.w = w;
    }
  }
  return Array.from(finalEdges.values());
}