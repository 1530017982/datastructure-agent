const SOURCE_VERSION = 'bubble-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void bubble_sort(long long a[], int n) {' },
  { lineId: 'pass', text: '  for (int end = n - 1; end > 0; --end) {' },
  { lineId: 'loop', text: '    for (int i = 0; i < end; ++i) {' },
  { lineId: 'compare', text: '      if (a[i] > a[i + 1]) {' },
  { lineId: 'temp', text: '        long long tmp = a[i];' },
  { lineId: 'assign-left', text: '        a[i] = a[i + 1];' },
  { lineId: 'swap', text: '        a[i + 1] = tmp;' },
  { lineId: 'if-end', text: '      }' },
  { lineId: 'loop-end', text: '    }' },
  { lineId: 'pass-end', text: '  }' },
  { lineId: 'done', text: '}' },
];

export function generateBubbleSteps(input) {
  const array = [...input];
  const steps = [];
  let pass = 0;
  let sortedFrom = array.length;
  function record(event, lineId, description, index = null) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'bubble-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { pass, index, sortedFrom }, description, done,
      result: done ? [...array] : null,
    });
  }

  record('init', 'init', array.length ? '从左向右依次比较相邻元素。' : '空数组没有需要比较的元素。');
  for (let end = array.length - 1; end > 0; end--) {
    pass++;
    for (let i = 0; i < end; i++) {
      const left = array[i];
      const right = array[i + 1];
      record('compare', 'compare', `比较 A[${i}] = ${left} 和 A[${i + 1}] = ${right}，${left > right ? '左边更大，需要交换。' : '顺序正确，继续比较。'}`, i);
      if (left > right) {
        array[i] = right;
        array[i + 1] = left;
        record('swap', 'swap', `交换 ${left} 和 ${right}，较大的值移到右边。`, i);
      }
    }
    sortedFrom = end;
    record('pass-end', 'pass-end', `第 ${pass} 轮结束，下标 ${end} 的元素已到最终位置。`);
  }
  sortedFrom = 0;
  record('sorted', 'done', array.length ? '排序完成，数组已按从小到大排列。' : '排序完成，结果仍是空数组。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}
