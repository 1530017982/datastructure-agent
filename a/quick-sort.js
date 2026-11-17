const SOURCE_VERSION = 'quick-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void quick_sort(long long a[], int low, int high) {' },
  { lineId: 'base-check', text: '  if (low >= high) return;' },
  { lineId: 'init-pivot', text: '  long long pivot = a[low];' },
  { lineId: 'init-pointers', text: '  int i = low, j = high;' },
  { lineId: 'loop', text: '  while (i < j) {' },
  { lineId: 'scan-right', text: '    while (i < j && a[j] >= pivot) --j;' },
  { lineId: 'fill-left', text: '    if (i < j) a[i++] = a[j];' },
  { lineId: 'scan-left', text: '    while (i < j && a[i] <= pivot) ++i;' },
  { lineId: 'fill-right', text: '    if (i < j) a[j--] = a[i];' },
  { lineId: 'loop-end', text: '  }' },
  { lineId: 'place-pivot', text: '  a[i] = pivot;' },
  { lineId: 'recurse-left', text: '  quick_sort(a, low, i - 1);' },
  { lineId: 'recurse-right', text: '  quick_sort(a, i + 1, high);' },
  { lineId: 'done', text: '}' },
];

export function generateQuickSortSteps(input) {
  const array = [...input];
  const steps = [];
  let currentLow = 0, currentHigh = 0, currentI = 0, currentJ = 0, currentPivot = null;

  function record(event, lineId, description, variables = {}) {
    steps.push({
      schemaVersion: '1.0', algorithm: 'quick-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { low: currentLow, high: currentHigh, i: currentI, j: currentJ, pivot: currentPivot, ...variables },
      description, done: false, result: null,
    });
  }

  record('init', 'init', '开始快速排序。');

  function quickSort(low, high) {
    currentLow = low; currentHigh = high;
    if (low >= high) return;

    let pivot = array[low];
    currentPivot = pivot;
    record('init-pivot', 'init-pivot', `选取基准值 pivot = ${pivot}。`, { low, high, pivot });

    let i = low, j = high;
    currentI = i; currentJ = j;
    record('init-pointers', 'init-pointers', `初始化双指针 i = ${i}, j = ${j}。`, { low, high, i, j, pivot });

    while (i < j) {
      while (i < j && array[j] >= pivot) {
        currentI = i; currentJ = j;
        record('compare-right', 'scan-right', `比较 A[${j}] = ${array[j]} 和 ${pivot}，继续向左寻找。`, { low, high, i, j, pivot });
        j--;
      }
      currentI = i; currentJ = j;
      if (i < j) {
        array[i] = array[j];
        record('fill-left', 'fill-left', `将 A[${j}] = ${array[j]} 填到左边的空位 A[${i}]。`, { low, high, i, j, pivot });
        i++;
      }

      while (i < j && array[i] <= pivot) {
        currentI = i; currentJ = j;
        record('compare-left', 'scan-left', `比较 A[${i}] = ${array[i]} 和 ${pivot}，继续向右寻找。`, { low, high, i, j, pivot });
        i++;
      }
      currentI = i; currentJ = j;
      if (i < j) {
        array[j] = array[i];
        record('fill-right', 'fill-right', `将 A[${i}] = ${array[i]} 填到右边的空位 A[${j}]。`, { low, high, i, j, pivot });
        j--;
      }
    }

    array[i] = pivot;
    record('place-pivot', 'place-pivot', `基准值 ${pivot} 归位到最终位置 ${i}。`, { low, high, i, j, pivot });

    quickSort(low, i - 1);
    quickSort(i + 1, high);
  }

  quickSort(0, array.length - 1);

  steps.push({
    schemaVersion: '1.0', algorithm: 'quick-sort', stepIndex: steps.length,
    sourceVersion: SOURCE_VERSION, event: 'sorted', lineId: 'done', array: [...array],
    variables: { low: 0, high: array.length - 1, i: null, j: null, pivot: null },
    description: '快速排序完成，数组已按从小到大排列。', done: true, result: [...array],
  });

  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}