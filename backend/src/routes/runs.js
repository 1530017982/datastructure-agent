// backend/src/routes/runs.js
import { generateSteps } from '../../../shared/algorithms/binarySearch.js';
import { generateBubbleSteps } from '../../../shared/algorithms/bubbleSort.js';
import { graphAlgorithm, graphMaxEdges, graphMaxWeight } from '../../../frontend/src/features/workbench/graph-algorithms.js';
import { generateDfsSteps } from '../../../shared/algorithms/final/b/dfs.js';
import { generatePrimSteps } from '../../../shared/algorithms/final/b/prim.js';
import { generateKruskalSteps } from '../../../shared/algorithms/final/b/kruskal.js';
import { generateDijkstraSteps } from '../../../shared/algorithms/final/b/dijkstra.js';
import { generateFloydSteps } from '../../../shared/algorithms/final/b/floyd.js';
import { generateTopoSteps } from '../../../shared/algorithms/final/b/topological-sort.js';
import { arraySearchMaxElements } from '../../../frontend/src/features/workbench/array-search.js';
import { generateLinearSearchSteps } from '../../../shared/algorithms/final/d/linear-search.js';
import { generateBlockSearchSteps } from '../../../shared/algorithms/final/d/block-search.js';
import { generateBfsSteps } from '../../../shared/algorithms/final/b/bfs.js';
import { validateGraphInput } from '../../../shared/algorithms/final/b/validate-util.js';
import { createRun, getRun } from '../runs/store.js';


export function handleCreateRun(req, res, body) {
  try {
    // 修复8：限制请求体大小 (10KB)
   
    const { array, target } = JSON.parse(body);

    // 修复2：使用 Number.isSafeInteger 严格校验
    if (!Array.isArray(array)) {
      return sendError(res, 400, 'INVALID_INPUT', 'array 必须是数组');
    }
    if (!Number.isSafeInteger(target)) {
      return sendError(res, 400, 'INVALID_INPUT', 'target 必须是安全整数');
    }
    if (array.length > 100) {
      return sendError(res, 400, 'INVALID_INPUT', '数组长度不能超过 100');
    }
    
    for (let i = 0; i < array.length; i++) {
      if (!Number.isSafeInteger(array[i])) {
        return sendError(res, 400, 'INVALID_INPUT', '数组元素必须全是安全整数');
      }
      if (i > 0 && array[i] < array[i - 1]) {
        return sendError(res, 400, 'INVALID_INPUT', '数组必须是有序的');
      }
    }

    const algoResult = generateSteps(array, target);
    const run = createRun({
      algorithm: 'binary-search',
      sourceVersion: algoResult.sourceVersion,
      sourceLines: algoResult.sourceLines,
      steps: algoResult.steps,
      result: algoResult.result,
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(run));
  } catch (e) {
    sendError(res, 400, 'INVALID_INPUT', '请求体格式错误');
  }
}

export function handleCreateBubbleRun(res, body) {
  let input;
  try {
    input = JSON.parse(body);
  } catch {
    return sendError(res, 400, 'INVALID_INPUT', '请求体格式错误');
  }
  const array = input?.array;
  if (!Array.isArray(array) || array.length > 24 || !array.every(Number.isSafeInteger)) {
    return sendError(res, 400, 'INVALID_INPUT', '数组必须包含 0 到 24 个安全整数');
  }
  const run = createRun({ algorithm: 'bubble-sort', ...generateBubbleSteps(array) });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(run));
}
export function handleCreateArraySearchRun(res, body, algorithm) {
  let result;
  try {
    const input = JSON.parse(body);
    if (algorithm === 'linear-search') {
      if (!Array.isArray(input?.array)) throw new TypeError('array 必须是数组。');
      if (input.array.length > arraySearchMaxElements) throw new TypeError('数组最多包含 100 个元素。');
      result = generateLinearSearchSteps(input);
    } else {
      if (Array.isArray(input?.blocks) && input.blocks.reduce((size, block) => size + (Array.isArray(block) ? block.length : 0), 0) > arraySearchMaxElements) {
        throw new TypeError('所有块合计最多包含 100 个元素。');
      }
      result = generateBlockSearchSteps(input);
    }
  } catch (error) {
    if (!(error instanceof TypeError || error instanceof SyntaxError)) throw error;
    return sendError(res, 400, 'INVALID_INPUT', error.message);
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(createRun({ algorithm, ...result })));
}

const graphGenerators = {
  bfs: generateBfsSteps,
  dfs: generateDfsSteps,
  prim: generatePrimSteps,
  kruskal: generateKruskalSteps,
  dijkstra: generateDijkstraSteps,
  floyd: generateFloydSteps,
  'topological-sort': generateTopoSteps
};

export function handleCreateGraphRun(res, body, algorithm) {
  const config = graphAlgorithm(algorithm);
  const maxNodes = config.maxNodes ?? 30;
  let input;
  try {
    input = JSON.parse(body);
  } catch {
    return sendError(res, 400, 'INVALID_INPUT', '请求体格式错误');
  }
  if (input?.nodes?.length > maxNodes || input?.edges?.length > graphMaxEdges) {
    return sendError(res, 400, 'INVALID_INPUT', config.name + ' 最多支持 ' + maxNodes + ' 个顶点和 ' + graphMaxEdges + ' 条边。');
  }
  let graph;
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('图输入必须为 JSON 对象。');
    const directed = Object.hasOwn(input, 'directed') ? input.directed : config.directed ?? false;
    const validated = validateGraphInput({ ...input, directed }, config.name, Boolean(config.weighted));
    if (config.weighted && input.edges.some(([, , weight]) => Math.abs(weight) > graphMaxWeight)) {
      throw new Error('边权的绝对值不得超过 ' + graphMaxWeight + '。');
    }
    const edges = validated.map(({ u, v, w }) => config.weighted ? [u, v, w] : [u, v]);
    graph = { nodes: input.nodes, edges, directed, ...(config.start ? { start: input.start } : {}) };
  } catch (error) {
    return sendError(res, 400, 'INVALID_INPUT', error.message);
  }
  const run = createRun({ algorithm, graph, ...graphGenerators[algorithm](graph) });
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(run));
}


export function handleGetRun(req, res, runId) {
  const run = getRun(runId);
  if (!run) {
    return sendError(res, 404, 'RUN_NOT_FOUND', '未找到该 run');
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(run));
}

export function handleGetStep(req, res, runId, stepIndex) {
  const run = getRun(runId);
  if (!run) {
    return sendError(res, 404, 'RUN_NOT_FOUND', '未找到该 run');
  }
  
  const index = parseInt(stepIndex, 10);
  if (isNaN(index) || index < 0 || index >= run.steps.length) {
    return sendError(res, 400, 'STEP_OUT_OF_RANGE', '步骤索引越界');
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ runId, step: run.steps[index] }));
}

// 统一错误格式
function sendError(res, status, code, message) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: { code, message } }));
}
