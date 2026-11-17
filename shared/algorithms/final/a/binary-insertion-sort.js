const SOURCE_VERSION = 'binary-insertion-c-v2';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void binary_insertion_sort(long long a[], int n) {' },
  { lineId: 'loop-i', text: '  for (int i = 1; i < n; ++i) {' },
  { lineId: 'temp', text: '    long long temp = a[i];' },
  { lineId: 'init-bounds', text: '    int left = 0, right = i - 1;' },
  { lineId: 'while-loop', text: '    while (left <= right) {' },
  { lineId: 'calc-mid', text: '      int mid = left + (right - left) / 2;' },
  { lineId: 'compare', text: '      if (a[mid] > temp) right = mid - 1;' },
  { lineId: 'else', text: '      else left = mid + 1;' },
  { lineId: 'while-end', text: '    }' },
  { lineId: 'move-loop', text: '    for (int j = i - 1; j >= left; --j) {' },
  { lineId: 'move', text: '      a[j + 1] = a[j];' },
  { lineId: 'move-end', text: '    }' },
  { lineId: 'insert', text: '    a[left] = temp;' },
  { lineId: 'loop-end', text: '  }' },
  { lineId: 'done', text: '}' },
];

export function generateBinaryInsertionSortSteps(input) {
  const array = [...input];
  const steps = [];
  let state = { i: 0, left: 0, right: -1, mid: null, temp: null, insertIndex: null };

  function record(event, lineId, description, extra = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'binary-insertion-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { ...state, ...extra }, description, done,
      result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始折半插入排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组已经有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let i = 1; i < array.length; i++) {
    state.i = i; state.temp = array[i]; 
    let left = 0, right = i - 1;
    state.left = left; state.right = right; state.mid = null; state.insertIndex = null;
    
    record('select', 'temp', `取出 ${state.temp}，准备查找。`);
    record('init-bounds', 'init-bounds', `查找范围 [0, ${right}]。`);

    while (left <= right) {
      let mid = Math.floor((left + right) / 2);
      state.mid = mid; state.left = left; state.right = right;
      record('compare', 'calc-mid', `mid = ${mid}，比较 A[${mid}] 和 ${state.temp}。`);
      
      if (array[mid] > state.temp) {
        right = mid - 1; state.right = right;
        record('move-right', 'compare', `A[${mid}] 更大，更新 right = ${right}。`);
      } else {
        left = mid + 1; state.left = left;
        record('move-left', 'else', `A[${mid}] 小于等于，更新 left = ${left}。`);
      }
    }

    state.mid = null;
    record('found-pos', 'while-end', `查找结束，插入位置 ${left}。`);
    
    for (let j = i - 1; j >= left; j--) {
      array[j + 1] = array[j];
      record('move', 'move', `将 A[${j}] 向右移动。`, { j });
    }
    
    array[left] = state.temp;
    state.insertIndex = left;
    record('insert', 'insert', `插入到位置 ${left}。`);
  }

  record('sorted', 'done', '排序完成。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}