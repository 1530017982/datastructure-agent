const SOURCE_VERSION = 'merge-c-v3';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void merge_sort(long long a[], int low, int high) {' },
  { lineId: 'base-check', text: '  if (low >= high) return;' },
  { lineId: 'calc-mid', text: '  int mid = low + (high - low) / 2;' },
  { lineId: 'recurse-left', text: '  merge_sort(a, low, mid);' },
  { lineId: 'recurse-right', text: '  merge_sort(a, mid + 1, high);' },
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
  
  // 使用局部状态对象，避免全局污染
  let state = { low: 0, high: 0, mid: 0, i: 0, j: 0, k: 0, p: null, temp: [] };

  function record(event, lineId, description, extra = {}) {
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
    // 初始化当前帧的状态
    state.low = low; state.high = high; state.mid = null;
    state.i = null; state.j = null; state.k = null; state.p = null;
    
    if (low >= high) return;

    let mid = Math.floor((low + high) / 2);
    state.mid = mid;
    record('divide', 'calc-mid', `将区间 [${low}, ${high}] 从 ${mid} 分开。`);

    mergeSort(low, mid);
    mergeSort(mid + 1, high);

    // 【核心修复】：递归返回后，必须重新恢复当前帧的 low/high/mid，防止被子调用污染
    state.low = low; state.high = high; state.mid = mid;
    state.i = low; state.j = mid + 1; state.k = 0;
    
    let temp = [];
    state.temp = temp;
    record('merge-start', 'declare', `准备合并区间 [${low}, ${mid}] 和 [${mid + 1}, ${high}]。`);

    let i = low, j = mid + 1, k = 0;
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

    state.k = k; state.p = 0; state.i = null; state.j = null;
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
