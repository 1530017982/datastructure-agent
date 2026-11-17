const SOURCE_VERSION = 'shell-c-v2';
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
  let state = { gap: 0, i: 0, j: 0, temp: null, insertIndex: null };

  function record(event, lineId, description, extra = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'shell-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { ...state, ...extra }, description, done,
      result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始希尔排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let gap = Math.floor(array.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    state.gap = gap;
    record('gap', 'init-gap', `增量 gap = ${gap}。`);

    for (let i = gap; i < array.length; i++) {
      state.i = i; state.temp = array[i];
      let j = i;
      state.j = j; state.insertIndex = null;
      record('select', 'temp', `取出 A[${i}] = ${state.temp}。`);

      while (j >= gap && array[j - gap] > state.temp) {
        record('compare', 'compare', `比较 A[${j - gap}] 和 ${state.temp}，前者较大。`);
        array[j] = array[j - gap];
        record('move', 'move', `A[${j - gap}] 后移。`);
        j -= gap; state.j = j;
      }
      
      if (j >= gap) record('compare', 'compare', `比较 A[${j - gap}] 和 ${state.temp}，前者较小或等于。`);

      array[j] = state.temp;
      state.insertIndex = j;
      record('insert', 'insert', `插入到位置 ${j}。`);
    }
  }

  record('sorted', 'done', '排序完成。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}