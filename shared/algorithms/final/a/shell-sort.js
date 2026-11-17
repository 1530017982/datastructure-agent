const SOURCE_VERSION = 'shell-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void shell_sort(long long a[], int n) {' },
  { lineId: 'init-gap', text: '  for (int gap = n / 2; gap > 0; gap /= 2) {' },
  { lineId: 'loop-i', text: '    for (int i = gap; i < n; ++i) {' },
  { lineId: 'temp', text: '      long long temp = a[i];' },
  { lineId: 'loop-j', text: '      int j = i;' },
  { lineId: 'compare', text: '      while (j >= gap && a[j - gap] > temp) {' },
  { lineId: 'move', text: '        a[j] = a[j - gap];' },
  { lineId: 'decrement', text: '        j -= gap;' },
  { lineId: 'while-end', text: '      }' },
  { lineId: 'insert', text: '      a[j] = temp;' },
  { lineId: 'loop-end', text: '    }' },
  { lineId: 'gap-end', text: '  }' },
  { lineId: 'done', text: '}' },
];

export function generateShellSortSteps(input) {
  const array = [...input];
  const steps = [];
  let currentGap = 0, currentI = 0, currentJ = 0, currentTemp = null;

  function record(event, lineId, description, variables = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'shell-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { gap: currentGap, i: currentI, j: currentJ, temp: currentTemp, ...variables },
      description, done, result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始希尔排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组为空或只有一个元素，已经有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let gap = Math.floor(array.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    currentGap = gap;
    record('gap', 'init-gap', `当前增量 gap = ${gap}。`, { gap });

    for (let i = gap; i < array.length; i++) {
      currentI = i;
      let temp = array[i];
      currentTemp = temp;
      let j = i;
      currentJ = j;
      record('select', 'temp', `取出 A[${i}] = ${temp}，在相隔 gap 的序列中寻找插入位置。`, { gap, i, j, temp });

      while (j >= gap && array[j - gap] > temp) {
        currentJ = j;
        record('compare', 'compare', `比较 A[${j - gap}] = ${array[j - gap]} 和 ${temp}，前者较大，需要后移。`, { gap, i, j, temp });
        array[j] = array[j - gap];
        record('move', 'move', `将 A[${j - gap}] 移动到位置 ${j}。`, { gap, i, j, temp });
        j -= gap;
        currentJ = j;
      }
      
      if (j >= gap) {
          record('compare', 'compare', `比较 A[${j - gap}] = ${array[j - gap]} 和 ${temp}，前者较小，停止后移。`, { gap, i, j, temp });
      }

      array[j] = temp;
      currentJ = j;
      record('insert', 'insert', `将 ${temp} 插入到位置 ${j}。`, { gap, i, j, temp });
    }
  }

  record('sorted', 'done', '排序完成，数组已按从小到大排列。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}