const SOURCE_VERSION = 'insertion-c-v2';
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
  let state = { i: 0, j: -1, temp: null, insertIndex: null };

  function record(event, lineId, description, extra = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'insertion-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { ...state, ...extra }, description, done,
      result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始直接插入排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组为空或只有一个元素，已经有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let i = 1; i < array.length; i++) {
    state.i = i; state.temp = array[i]; state.insertIndex = null;
    record('select', 'temp', `取出当前元素 ${state.temp}，准备插入。`, { j: i - 1 });

    let j = i - 1;
    state.j = j;
    while (j >= 0 && array[j] > state.temp) {
      record('compare', 'compare', `比较 A[${j}] = ${array[j]} 和 ${state.temp}。`);
      array[j + 1] = array[j];
      record('move', 'move', `将 A[${j}] 移动到位置 ${j + 1}。`);
      j--; state.j = j;
    }
    if (j >= 0) record('compare', 'compare', `比较 A[${j}] = ${array[j]} 和 ${state.temp}，停止移动。`);

    array[j + 1] = state.temp;
    state.insertIndex = j + 1;
    record('insert', 'insert', `将 ${state.temp} 插入到位置 ${state.insertIndex}。`);
  }

  record('sorted', 'done', '排序完成。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}