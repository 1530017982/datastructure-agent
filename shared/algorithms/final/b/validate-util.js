export function validateGraphInput(input, algoName, isWeighted) {
  const { nodes, edges, start } = input;
  
  let directed = false;
  if ('directed' in input) {
    if (typeof input.directed !== 'boolean') {
      throw new Error(`【${algoName}】方向字段 directed 必须是布尔值。`);
    }
    directed = input.directed;
  }

  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error(`【${algoName}】顶点 nodes 必须是非空数组。`);
  }
  // 修复 3：使用 Object.create(null) 避免 __proto__ 污染
  const nodeSet = Object.create(null);
  for (let i = 0; i < nodes.length; i++) {
    if (typeof nodes[i] !== 'string' || nodes[i].trim() === '') {
      throw new Error(`【${algoName}】第 ${i + 1} 个顶点不是非空字符串。`);
    }
    if (nodeSet[nodes[i]]) {
      throw new Error(`【${algoName}】顶点 ${nodes[i]} 存在重复。`);
    }
    nodeSet[nodes[i]] = true;
  }

  if (!Array.isArray(edges)) {
    throw new Error(`【${algoName}】边 edges 必须是数组。`);
  }
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!Array.isArray(edge) || edge.length < 2) {
      throw new Error(`【${algoName}】第 ${i + 1} 条边格式错误。`);
    }
    const [u, v, w] = edge;
    // 修复 3：属性存在性检查
    if (!nodeSet[u]) throw new Error(`【${algoName}】第 ${i + 1} 条边引用了未声明的顶点 ${u}。`);
    if (!nodeSet[v]) throw new Error(`【${algoName}】第 ${i + 1} 条边引用了未声明的顶点 ${v}。`);

    if (isWeighted) {
      if (w === undefined || w === null) {
        throw new Error(`【${algoName}】第 ${i + 1} 条边缺失权重。`);
      }
      if (typeof w !== 'number' || !isFinite(w)) {
        throw new Error(`【${algoName}】第 ${i + 1} 条边权重必须是有限数值。`);
      }
      if (algoName === 'Dijkstra' && w < 0) {
        throw new Error(`【${algoName}】第 ${i + 1} 条边包含负权，Dijkstra 拒绝负权。`);
      }
    } else {
      if (w !== undefined) {
        throw new Error(`【${algoName}】第 ${i + 1} 条边多了权重，无权图不需要传第三个参数。`);
      }
    }
  }

  if (algoName === 'Prim' || algoName === 'Kruskal') {
    if (directed === true) throw new Error(`【${algoName}】只接受无向图 (directed=false)。`);
  }
  if (algoName === '拓扑排序') {
    if (directed === false) throw new Error(`【${algoName}】只接受有向图 (directed=true)。`);
  }

  if (['BFS', 'DFS', 'Prim', 'Dijkstra'].includes(algoName)) {
    if (!start || !nodeSet[start]) {
      throw new Error(`【${algoName}】起点 start 必须存在且包含在顶点列表中。`);
    }
  }

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