const SOURCE_VERSION = 'selection-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void selection_sort(long long a[], int n) {' },
  { lineId: 'loop-i', text: '  for (int i = 0; i < n - 1; ++i) {' },
  { lineId: 'init-min', text: '    int minIndex = i;' },
  { lineId: 'loop-j', text: '    for (int j = i + 1; j < n; ++j) {' },
  { lineId: 'compare', text: '      if (a[j] < a[minIndex]) {' },
  { lineId: 'update-min', text: '        minIndex = j;' },
  { lineId: 'if-end', text: '      }' },
  { lineId: 'loop-end', text: '    }' },
  { lineId: 'check-swap', text: '    if (minIndex != i) {' },
  { lineId: 'swap', text: '      long long t = a[i]; a[i] = a[minIndex]; a[minIndex] = t;' },
  { lineId: 'swap-end', text: '    }' },
  { lineId: 'done', text: '}' },
];

export function generateSelectionSortSteps(input) {
  const array = [...input];
  const steps = [];
  let currentI = 0, currentJ = -1, currentMin = 0;

  function record(event, lineId, description, variables = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'selection-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { i: currentI, j: currentJ, minIndex: currentMin, ...variables },
      description, done, result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始简单选择排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组为空或只有一个元素，已经有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let i = 0; i < array.length - 1; i++) {
    currentI = i;
    let minIndex = i;
    currentMin = minIndex;
    record('init-min', 'init-min', `将下标 ${i} 设为当前最小值的候选。`, { i, minIndex });

    for (let j = i + 1; j < array.length; j++) {
      currentJ = j;
      record('compare', 'compare', `比较 A[${j}] = ${array[j]} 和当前最小值 A[${minIndex}] = ${array[minIndex]}。`, { i, j, minIndex });
      if (array[j] < array[minIndex]) {
        minIndex = j;
        currentMin = minIndex;
        record('update-min', 'update-min', `发现更小的值 ${array[j]}，更新最小值下标为 ${j}。`, { i, j, minIndex });
      }
    }

    if (minIndex !== i) {
      record('check-swap', 'check-swap', `本轮最小值为 A[${minIndex}] = ${array[minIndex]}，与 A[${i}] = ${array[i]} 交换。`, { i, minIndex });
      const temp = array[i];
      array[i] = array[minIndex];
      array[minIndex] = temp;
      record('swap', 'swap', `交换完成。`, { i, minIndex });
    } else {
      record('check-swap', 'check-swap', `最小值就是当前元素，无需交换。`, { i, minIndex });
    }
  }

  record('sorted', 'done', '排序完成，数组已按从小到大排列。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}