const SOURCE_VERSION = 'quick-c-v2';
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
  let state = { low: 0, high: 0, i: 0, j: 0, pivot: null };

  function record(event, lineId, description, extra = {}) {
    steps.push({
      schemaVersion: '1.0', algorithm: 'quick-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { ...state, ...extra }, description, done: false, result: null,
    });
  }

  record('init', 'init', '开始快速排序。');

  function quickSort(low, high) {
    state.low = low; state.high = high;
    if (low >= high) return;

    let pivot = array[low];
    state.pivot = pivot;
    record('init-pivot', 'init-pivot', `选取基准值 pivot = ${pivot}。`);

    let i = low, j = high;
    state.i = i; state.j = j;
    record('init-pointers', 'init-pointers', `初始化双指针 i = ${i}, j = ${j}。`);

    while (i < j) {
      while (i < j && array[j] >= pivot) {
        state.i = i; state.j = j;
        record('compare-right', 'scan-right', `比较 A[${j}] = ${array[j]} 和 ${pivot}。`);
        j--;
      }
      state.i = i; state.j = j;
      if (i < j) {
        record('fill-left', 'fill-left', `将 A[${j}] 填到左边空位 A[${i}]。`, { fillFrom: j, fillTo: i });
        array[i] = array[j];
        i++;
        state.i = i;
      }

      while (i < j && array[i] <= pivot) {
        state.i = i; state.j = j;
        record('compare-left', 'scan-left', `比较 A[${i}] = ${array[i]} 和 ${pivot}。`);
        i++;
      }
      state.i = i; state.j = j;
      if (i < j) {
        record('fill-right', 'fill-right', `将 A[${i}] 填到右边空位 A[${j}]。`, { fillFrom: i, fillTo: j });
        array[j] = array[i];
        j--;
        state.j = j;
      }
    }

    array[i] = pivot;
    state.i = i; state.j = j;
    record('place-pivot', 'place-pivot', `基准值 ${pivot} 归位到位置 ${i}。`);

    quickSort(low, i - 1);
    quickSort(i + 1, high);
  }

  quickSort(0, array.length - 1);

  steps.push({
    schemaVersion: '1.0', algorithm: 'quick-sort', stepIndex: steps.length,
    sourceVersion: SOURCE_VERSION, event: 'sorted', lineId: 'done', array: [...array],
    variables: { low: 0, high: array.length - 1, i: null, j: null, pivot: null },
    description: '排序完成。', done: true, result: [...array],
  });

  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}