const algorithms = {
  bfs: { title: '广度优先搜索（BFS）', name: 'BFS', start: true, fields: [['currentNode', '当前顶点'], ['currentEdge', '当前边'], ['queue', '队列'], ['visited', '已访问']] },
  dfs: { title: '深度优先搜索（DFS）', name: 'DFS', start: true, fields: [['currentNode', '当前顶点'], ['currentEdge', '当前边'], ['stack', '栈（底到顶）'], ['discoveryOrder', '发现顺序']] },
  prim: { title: 'Prim 最小生成树', name: 'Prim', start: true, weighted: true, directed: false, fields: [['currentEdge', '当前边'], ['key', '候选权重'], ['inMST', '树中顶点'], ['totalWeight', '总权重']] },
  kruskal: { title: 'Kruskal 最小生成树', name: 'Kruskal', weighted: true, directed: false, fields: [['currentEdge', '当前边'], ['selectedEdges', '已选边'], ['parent', '并查集父节点'], ['totalWeight', '总权重']] },
  dijkstra: { title: 'Dijkstra 最短路径', name: 'Dijkstra', start: true, weighted: true, fields: [['currentEdge', '当前边'], ['dist', '距离'], ['previous', '前驱'], ['visited', '已确定顶点']] },
  floyd: { title: 'Floyd 最短路径', name: 'Floyd', weighted: true, maxNodes: 8, fields: [['currentK', '中转点 k'], ['currentI', '起点 i'], ['currentJ', '终点 j'], ['matrix', '距离矩阵']] },
  'topological-sort': { title: '拓扑排序', name: '拓扑排序', directed: true, fields: [['currentNode', '当前顶点'], ['inDegree', '入度'], ['queue', '零入度队列'], ['resultOrder', '输出顺序']] }
};

export const graphMaxEdges = 120;
export const graphMaxWeight = 1e12;
export const graphAlgorithmIds = Object.keys(algorithms);
export function graphAlgorithm(id) {
  return Object.hasOwn(algorithms, id) ? algorithms[id] : null;
}
