const SOURCE_VERSION = 'floyd-c-v1';

const SOURCE_LINES = [
  { lineId: 'init', text: 'void floyd(int dist[][MAX], int n) {' },
  { lineId: 'init-dist', text: '  // 初始化 dist 矩阵' },
  { lineId: 'loop-k', text: '  for (int k = 0; k < n; k++) {' },
  { lineId: 'loop-i', text: '    for (int i = 0; i < n; i++) {' },
  { lineId: 'loop-j', text: '      for (int j = 0; j < n; j++) {' },
  { lineId: 'relax', text: '        if (dist[i][k] + dist[k][j] < dist[i][j])' },
  { lineId: 'update', text: '          dist[i][j] = dist[i][k] + dist[k][j];' },
  { lineId: 'end', text: '}' }
];

export function generateFloydSteps(input) {
  const { nodes, edges } = input;
  const directed = input.directed || false; // 修复 2：有向图支持
  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));

  const dist = Array.from({ length: n }, () => Array(n).fill(Infinity));
  for (let i = 0; i < n; i++) dist[i][i] = 0;

  for (const [u, v, w] of edges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    if (ui !== undefined && vi !== undefined) {
      if (w < dist[ui][vi]) {
        dist[ui][vi] = w;
        if (!directed) dist[vi][ui] = w;
      }
    }
  }

  const steps = [];
  function formatMatrix() { return dist.map(row => row.map(val => val === Infinity ? '∞' : val).join(', ')); }

  function record(event, lineId, description, k = null, i = null, j = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', algorithm: 'floyd', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { matrix: formatMatrix(), currentK: k !== null ? nodes[k] : null, currentI: i !== null ? nodes[i] : null, currentJ: j !== null ? nodes[j] : null },
      description, done, result: done ? formatMatrix() : null
    });
  }

  record('init', 'init', `初始化 Floyd 距离矩阵。`);
  record('init-dist', 'init-dist', `矩阵初始化完成，自身距离为0，直连边填入权重。`);

  for (let k = 0; k < n; k++) {
    record('loop-k', 'loop-k', `当前中转点 k = ${nodes[k]}。`, k);
    for (let i = 0; i < n; i++) {
      record('loop-i', 'loop-i', `起点 i = ${nodes[i]}。`, k, i);
      for (let j = 0; j < n; j++) {
        record('loop-j', 'loop-j', `终点 j = ${nodes[j]}，检查是否可以通过 k 缩短距离。`, k, i, j);
        if (dist[i][k] !== Infinity && dist[k][j] !== Infinity) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            const oldDist = dist[i][j];
            dist[i][j] = dist[i][k] + dist[k][j];
            record('update', 'update', `发现更短路径！${nodes[i]}->${nodes[j]} 的距离由 ${oldDist === Infinity ? '∞' : oldDist} 更新为 ${dist[i][j]}。`, k, i, j);
          }
        }
      }
    }
  }

  let hasNegativeCycle = false;
  for (let i = 0; i < n; i++) {
    if (dist[i][i] < 0) hasNegativeCycle = true;
  }

  // 修复 6：最后一步和返回结果必须一致
  if (hasNegativeCycle) {
    record('end', 'end', `对角线发现负数，存在负权环！`);
  } else {
    record('end', 'end', `Floyd 算法结束，最短路径矩阵计算完毕。`);
  }

  return { steps, result: hasNegativeCycle ? 'Has Negative Cycle' : formatMatrix(), sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}