const SOURCE_VERSION = 'merge-c-v2';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void merge_sort(long long a[], int low, int high) {' },
  { lineId: 'base-check', text: '  if (low >= high) return;' },
  { lineId: 'calc-mid', text: '  int mid = low + (high - low) / 2;' },
  { lineId: 'recurse-left', text: '  merge_sort(a, low, mid);' },
  { lineId: 'recurse-right', text: '  merge_sort(a, mid + 1, high);' },
  // 修复：定义MAX为100，与接口限制对齐
  { lineId: 'declare', text: '  long long temp[100]; int i = low, j = mid + 1, k = 0;' },
  { lineId: 'compare', text: '  while (i <= mid && j <= high) {' },
  { lineId: 'pick-left', text: '    if (a[i] <= a[j]) temp[k++] = a[i++];' },
  { lineId: 'pick-right', text: '    else temp[k++] = a[j++];' },
  { lineId: 'while-end', text: '  }' },
  { lineId: 'pick-remain', text: '  while (i <= mid) temp[k++] = a[i++]; while (j <= high) temp[k++] = a[j++];' },
  { lineId: 'copy-back', text: '  for (int p = 0; p < k; p++) a[low + p] = temp[p];' },
  { lineId: 'done', text: '}' },
];

export function generateMergeSortSteps(input) {
  const array = [...input];
  const steps = [];
  let state = { low: 0, high: 0, mid: 0, i: 0, j: 0, k: 0, p: null, temp: [] };

  function record(event, lineId, description, extra = {}) {
    // 修复：严格分离当前状态和额外覆盖，确保temp是独立的深拷贝
    const vars = { ...state, ...extra };
    vars.temp = [...(extra.temp ?? state.temp)];
    steps.push({
      schemaVersion: '1.0', algorithm: 'merge-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: vars, description, done: false, result: null,
    });
  }

  record('init', 'init', '开始归并排序。');

  function mergeSort(low, high) {
    state.low = low; state.high = high; state.i = null; state.j = null; state.k = null; state.p = null;
    if (low >= high) return;

    let mid = Math.floor((low + high) / 2);
    state.mid = mid;
    record('divide', 'calc-mid', `将区间 [${low}, ${high}] 从 ${mid} 分开。`);

    mergeSort(low, mid);
    mergeSort(mid + 1, high);

    let temp = [];
    let i = low, j = mid + 1, k = 0;
    state.i = i; state.j = j; state.k = k; state.temp = temp;
    record('merge-start', 'declare', `准备合并区间 [${low}, ${mid}] 和 [${mid + 1}, ${high}]。`);

    while (i <= mid && j <= high) {
      state.i = i; state.j = j;
      record('compare', 'compare', `比较 A[${i}] 和 A[${j}]。`);
      if (array[i] <= array[j]) {
        temp.push(array[i]);
        state.temp = [...temp]; state.i = i + 1; state.k = k + 1;
        record('pick', 'pick-left', `将 A[${i}] 放入临时数组。`, { pickedValue: array[i] });
        i++; k++;
      } else {
        temp.push(array[j]);
        state.temp = [...temp]; state.j = j + 1; state.k = k + 1;
        record('pick', 'pick-right', `将 A[${j}] 放入临时数组。`, { pickedValue: array[j] });
        j++; k++;
      }
    }
    
    while (i <= mid) { 
      temp.push(array[i]); 
      state.temp = [...temp]; state.i = i + 1; state.k = k + 1;
      record('pick', 'pick-remain', `左半部分剩余 A[${i}] 放入临时数组。`, { pickedValue: array[i] }); 
      i++; k++;
    }
    while (j <= high) { 
      temp.push(array[j]); 
      state.temp = [...temp]; state.j = j + 1; state.k = k + 1;
      record('pick', 'pick-remain', `右半部分剩余 A[${j}] 放入临时数组。`, { pickedValue: array[j] }); 
      j++; k++;
    }

    // 修复：k 表示归并段长度不变，用 p 作为写回游标
    state.k = k; state.p = 0;
    for (let p = 0; p < k; p++) {
      array[low + p] = temp[p];
      state.p = p + 1;
      record('copy', 'copy-back', `将 temp[${p}] = ${temp[p]} 写回 A[${low + p}]。`);
    }
    state.p = null;
    record('merge', 'copy-back', `区间 [${low}, ${high}] 合并完成。`);
  }

  mergeSort(0, array.length - 1);

  steps.push({
    schemaVersion: '1.0', algorithm: 'merge-sort', stepIndex: steps.length,
    sourceVersion: SOURCE_VERSION, event: 'sorted', lineId: 'done', array: [...array],
    variables: { low: 0, high: array.length - 1, mid: null, i: null, j: null, k: null, p: null, temp: [] },
    description: '排序完成。', done: true, result: [...array],
  });

  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}