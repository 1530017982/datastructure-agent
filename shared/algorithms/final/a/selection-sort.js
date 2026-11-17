const SOURCE_VERSION = 'selection-c-v2';
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
  { lineId: 'outer-loop-end', text: '  }' },
  { lineId: 'done', text: '}' },
];

export function generateSelectionSortSteps(input) {
  const array = [...input];
  const steps = [];
  let state = { i: 0, j: -1, minIndex: 0 };

  function record(event, lineId, description, extra = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'selection-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { ...state, ...extra }, description, done,
      result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始简单选择排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let i = 0; i < array.length - 1; i++) {
    state.i = i; state.j = -1;
    let minIndex = i; state.minIndex = minIndex;
    record('init-min', 'init-min', `假设 ${i} 是最小值。`);

    for (let j = i + 1; j < array.length; j++) {
      state.j = j;
      record('compare', 'compare', `比较 A[${j}] 和 A[${minIndex}]。`);
      if (array[j] < array[minIndex]) {
        minIndex = j; state.minIndex = minIndex;
        record('update-min', 'update-min', `更新最小值为 ${j}。`);
      }
    }

    if (minIndex !== i) {
      record('check-swap', 'check-swap', `交换 A[${i}] 和 A[${minIndex}]。`);
      const temp = array[i]; array[i] = array[minIndex]; array[minIndex] = temp;
      record('swap', 'swap', `交换完成。`);
    } else {
      record('check-swap', 'check-swap', `无需交换。`);
    }
  }

  record('sorted', 'done', '排序完成。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}