import { validateGraphInput } from './validate-util.js';

const SOURCE_VERSION = 'floyd-c-v2';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void floyd(int dist[][MAX], int n) {' },
  { lineId: 'loop-k', text: '  for (int k = 0; k < n; k++) {' },
  { lineId: 'loop-i', text: '    for (int i = 0; i < n; i++) {' },
  { lineId: 'loop-j', text: '      for (int j = 0; j < n; j++) {' },
  // 修复 2：补全可达性判断，与实际执行一致
  { lineId: 'relax', text: '        if (dist[i][k] != INF && dist[k][j] != INF && dist[i][k] + dist[k][j] < dist[i][j])' },
  { lineId: 'update', text: '          dist[i][j] = dist[i][k] + dist[k][j];' },
  { lineId: 'end', text: '      }\n    }\n  }\n}' }
];

export function generateFloydSteps(input) {
  const validEdges = validateGraphInput(input, 'Floyd', true);
  const { nodes, directed } = input;
  
  const n = nodes.length;
  const nodeIndex = new Map(nodes.map((node, i) => [node, i]));
  const dist = Array.from({ length: n }, () => Array(n).fill(Infinity));
  
  for (let i = 0; i < n; i++) dist[i][i] = 0;

  for (const { u, v, w } of validEdges) {
    const ui = nodeIndex.get(u);
    const vi = nodeIndex.get(v);
    dist[ui][vi] = Math.min(dist[ui][vi], w);
    if (!directed) dist[vi][ui] = Math.min(dist[vi][ui], w);
  }

  const steps = [];
  function formatMatrix() { return dist.map(row => row.map(val => val === Infinity ? '∞' : val).join(', ')); }

  function record(event, lineId, description, k = null, i = null, j = null, customResult = null) {
    const done = event === 'end';
    steps.push({
      schemaVersion: '1.0', algorithm: 'floyd', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId,
      variables: { matrix: formatMatrix(), currentK: k !== null ? nodes[k] : null, currentI: i !== null ? nodes[i] : null, currentJ: j !== null ? nodes[j] : null },
      description, done, result: done ? customResult : null
    });
  }

  record('init', 'init', `初始化 Floyd。`);
  record('init-dist', 'init', `矩阵初始化完成，对角线为0。`);

  for (let k = 0; k < n; k++) {
    record('loop-k', 'loop-k', `中转点 k = ${nodes[k]}。`, k);
    for (let i = 0; i < n; i++) {
      record('loop-i', 'loop-i', `起点 i = ${nodes[i]}。`, k, i);
      for (let j = 0; j < n; j++) {
        record('loop-j', 'loop-j', `终点 j = ${nodes[j]}。`, k, i, j);
        
        // 执行逻辑同样保持严格的可达性判断
        if (dist[i][k] !== Infinity && dist[k][j] !== Infinity && dist[i][k] + dist[k][j] < dist[i][j]) {
          const oldDist = dist[i][j];
          dist[i][j] = dist[i][k] + dist[k][j];
          record('update', 'update', `更新 ${nodes[i]}->${nodes[j]} 为 ${dist[i][j]}。`, k, i, j);
        }
      }
    }
  }

  let hasNegativeCycle = false;
  for (let i = 0; i < n; i++) {
    if (dist[i][i] < 0) hasNegativeCycle = true;
  }

  const finalResult = hasNegativeCycle ? 'Has Negative Cycle' : formatMatrix();
  if (hasNegativeCycle) {
    record('end', 'end', `对角线发现负数，存在负权环！`, null, null, null, finalResult);
  } else {
    record('end', 'end', `Floyd 结束。`, null, null, null, finalResult);
  }
  return { steps, result: finalResult, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}