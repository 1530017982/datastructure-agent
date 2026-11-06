// shared/algorithms/final/d/block-search.js
// D 包 · 分块查找：块内可无序，块间值域依次分离。
// 用每块「最大值」建立索引确定候选块，再在块内顺序比较；空块跳过。
// 展示代码接收的索引与执行逻辑一致：一维数组 + 每块起点/块长/块最大值，块长不限。
import { createStepFactory, requireBlockList, requireIntegerArray, requireSafeInteger } from './util.js';

const SOURCE_VERSION = 'd-block-c-v2';

const SOURCE_LINES = [
  { lineId: 'function-start', text: 'int block_search(const long long a[], const int starts[], const int sizes[], const long long blockMax[], int blockCount, long long target) {' },
  { lineId: 'index-loop', text: '  for (int b = 0; b < blockCount; b++) {' },
  { lineId: 'index-skip', text: '    if (sizes[b] == 0) { continue; }' },
  { lineId: 'index-compare', text: '    if (blockMax[b] < target) { continue; }' },
  { lineId: 'inner-loop', text: '    for (int i = 0; i < sizes[b]; i++) {' },
  { lineId: 'inner-compare', text: '      if (a[starts[b] + i] == target) {' },
  { lineId: 'found', text: '        return starts[b] + i;' },
  { lineId: 'inner-compare-end', text: '      }' },
  { lineId: 'inner-loop-end', text: '    }' },
  { lineId: 'not-found-block', text: '    return -1;' },
  { lineId: 'index-loop-end', text: '  }' },
  { lineId: 'not-found', text: '  return -1;' },
  { lineId: 'function-end', text: '}' },
];

/**
 * 生成分块查找的执行步骤。
 * @param {{ blocks: number[][], target: number }} input
 *   非空块的取值范围必须依次分离（本块最大值不大于下一块最小值），否则抛 TypeError。
 *   块长不限；块内不要求有序。
 */
export function generateBlockSearchSteps(input) {
  const target = requireSafeInteger(input?.target, 'target');
  // 块数与元素总数在展开成快照之前就校验，避免超大输入把内存撑爆。
  const blocks = requireBlockList(input?.blocks, 'blocks');

  const ranges = [];
  let base = 0;
  for (let b = 0; b < blocks.length; b++) {
    const block = requireIntegerArray(blocks[b], `blocks[${b}]`);
    // 用循环求最值：展开运算符在元素过多时会触发 RangeError（参数数量上限）。
    let max = null;
    let min = null;
    for (const value of block) {
      if (max === null || value > max) max = value;
      if (min === null || value < min) min = value;
    }
    ranges.push({ blockIndex: b, size: block.length, start: base, end: base + block.length - 1, min, max });
    base += block.length;
  }

  const nonEmpty = ranges.filter(range => range.size > 0);
  for (let k = 1; k < nonEmpty.length; k++) {
    if (nonEmpty[k - 1].max > nonEmpty[k].min) {
      throw new TypeError(`第 ${nonEmpty[k - 1].blockIndex} 块与第 ${nonEmpty[k].blockIndex} 块的值域重叠，块间必须依次分离`);
    }
  }

  const flat = blocks.flat();
  const { steps, add } = createStepFactory('block-search', SOURCE_VERSION);
  const view = () => ({
    blocks: blocks.map(block => [...block]),
    ranges: ranges.map(range => ({ ...range })),
    // 索引表就是各块最大值，与展示代码的 blockMax[] 一一对应
    blockMaxValues: ranges.map(range => range.max),
  });

  add({
    event: 'init', lineId: 'function-start', array: flat, target,
    variables: { ...view(), blockIndex: null, blockMax: null, index: null, current: null, comparisons: 0 },
    description: blocks.length
      ? `共 ${blocks.length} 块（其中 ${nonEmpty.length} 块非空），索引表为各块最大值 [${ranges.map(r => (r.max === null ? '空' : r.max)).join(', ')}]，先据此定位候选块。`
      : '没有任何块，直接返回未找到。',
  });

  if (blocks.length === 0) {
    add({
      event: 'not-found', lineId: 'not-found', array: flat, target, done: true, result: -1,
      variables: { ...view(), blockIndex: null, blockMax: null, index: null, current: null, comparisons: 0 },
      description: '没有可检查的块，返回 -1。',
    });
    return { steps, result: -1, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  let comparisons = 0;
  for (const range of ranges) {
    if (range.size === 0) {
      add({
        event: 'index-skip', lineId: 'index-skip', array: flat, target,
        variables: { ...view(), blockIndex: range.blockIndex, blockMax: null, index: null, current: null, comparisons },
        description: `第 ${range.blockIndex} 块是空块，按约定跳过。`,
      });
      continue;
    }

    comparisons++;
    const maxMeaning = `该块元素为 [${blocks[range.blockIndex].join(', ')}]，最大值 ${range.max}`;
    add({
      event: 'index-compare', lineId: 'index-compare', array: flat, target,
      variables: { ...view(), blockIndex: range.blockIndex, blockMax: range.max, index: null, current: null, comparisons },
      description: `用索引项比较：${maxMeaning} 与目标 ${target}，${range.max < target ? '整块都小于目标，跳到下一块。' : '目标可能在本块内。'}`,
    });

    if (range.max < target) continue;

    add({
      event: 'block-selected', lineId: 'inner-loop', array: flat, target,
      variables: { ...view(), blockIndex: range.blockIndex, blockMax: range.max, index: null, current: null, comparisons },
      description: `选定第 ${range.blockIndex} 块，块内下标范围 ${range.start}～${range.end}，开始逐项扫描。`,
    });

    for (let i = 0; i < range.size; i++) {
      const current = blocks[range.blockIndex][i];
      const index = range.start + i;
      comparisons++;
      add({
        event: 'inner-compare', lineId: 'inner-compare', array: flat, target,
        variables: { ...view(), blockIndex: range.blockIndex, blockMax: range.max, index, current, comparisons },
        description: `块内比较 A[${index}] = ${current} 与 ${target}：${current === target ? '相等。' : '不相等，块内继续。'}`,
      });

      if (current === target) {
        add({
          event: 'found', lineId: 'found', array: flat, target, done: true, result: index,
          variables: { ...view(), blockIndex: range.blockIndex, blockMax: range.max, index, current, comparisons },
          description: `在第 ${range.blockIndex} 块的下标 ${index} 命中 ${target}，返回 ${index}。`,
        });
        return { steps, result: index, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
      }
    }

    add({
      event: 'not-found', lineId: 'not-found-block', array: flat, target, done: true, result: -1,
      variables: { ...view(), blockIndex: range.blockIndex, blockMax: range.max, index: null, current: null, comparisons },
      description: `候选块内没有 ${target}；因块间值域分离，后续块不可能命中，返回 -1。`,
    });
    return { steps, result: -1, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  add({
    event: 'not-found', lineId: 'not-found', array: flat, target, done: true, result: -1,
    variables: { ...view(), blockIndex: null, blockMax: null, index: null, current: null, comparisons },
    description: `所有块的索引最大值都小于 ${target}，返回 -1。`,
  });
  return { steps, result: -1, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}

export { SOURCE_VERSION, SOURCE_LINES };
