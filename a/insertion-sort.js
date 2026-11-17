const SOURCE_VERSION = 'insertion-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void insertion_sort(long long a[], int n) {' },
  { lineId: 'loop-i', text: '  for (int i = 1; i < n; ++i) {' },
  { lineId: 'temp', text: '    long long temp = a[i];' },
  { lineId: 'loop-j', text: '    int j = i - 1;' },
  { lineId: 'compare', text: '    while (j >= 0 && a[j] > temp) {' },
  { lineId: 'move', text: '      a[j + 1] = a[j];' },
  { lineId: 'decrement', text: '      --j;' },
  { lineId: 'while-end', text: '    }' },
  { lineId: 'insert', text: '    a[j + 1] = temp;' },
  { lineId: 'loop-end', text: '  }' },
  { lineId: 'done', text: '}' },
];

export function generateInsertionSortSteps(input) {
  const array = [...input];
  const steps = [];
  let currentI = 0, currentJ = -1, currentTemp = null;

  function record(event, lineId, description, variables = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'insertion-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { i: currentI, j: currentJ, temp: currentTemp, ...variables },
      description, done, result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始直接插入排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组为空或只有一个元素，已经有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let i = 1; i < array.length; i++) {
    currentI = i;
    let temp = array[i];
    currentTemp = temp;
    record('select', 'temp', `取出当前元素 ${temp}，准备插入到前面的有序序列中。`, { i, temp, j: i - 1 });

    let j = i - 1;
    while (j >= 0 && array[j] > temp) {
      currentJ = j;
      record('compare', 'compare', `比较 A[${j}] = ${array[j]} 和 ${temp}，左边更大，需要向右移动。`, { i, j, temp });
      array[j + 1] = array[j];
      record('move', 'move', `将 A[${j}] 移动到位置 ${j + 1}。`, { i, j, temp });
      j--;
    }
    if (j >= 0) {
        currentJ = j;
        record('compare', 'compare', `比较 A[${j}] = ${array[j]} 和 ${temp}，左边更小或等于，停止移动。`, { i, j, temp });
    }

    array[j + 1] = temp;
    currentJ = j + 1;
    record('insert', 'insert', `将 ${temp} 插入到位置 ${j + 1}。`, { i, j: j + 1, temp });
  }

  record('sorted', 'done', '排序完成，数组已按从小到大排列。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}