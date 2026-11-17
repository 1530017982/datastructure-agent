const SOURCE_VERSION = 'merge-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void merge_sort(long long a[], int low, int high) {' },
  { lineId: 'base-check', text: '  if (low >= high) return;' },
  { lineId: 'calc-mid', text: '  int mid = low + (high - low) / 2;' },
  { lineId: 'recurse-left', text: '  merge_sort(a, low, mid);' },
  { lineId: 'recurse-right', text: '  merge_sort(a, mid + 1, high);' },
  { lineId: 'declare', text: '  long long temp[MAX]; int i = low, j = mid + 1, k = 0;' },
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
  let currentLow = 0, currentHigh = 0, currentMid = 0, currentI = 0, currentJ = 0, currentK = 0;
  let currentTemp = [];

  function record(event, lineId, description, variables = {}) {
    steps.push({
      schemaVersion: '1.0', algorithm: 'merge-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { low: currentLow, high: currentHigh, mid: currentMid, i: currentI, j: currentJ, k: currentK, temp: [...currentTemp], ...variables },
      description, done: false, result: null,
    });
  }

  record('init', 'init', '开始归并排序。');

  function mergeSort(low, high) {
    currentLow = low; currentHigh = high;
    if (low >= high) return;

    let mid = Math.floor((low + high) / 2);
    currentMid = mid;
    record('divide', 'calc-mid', `将区间 [${low}, ${high}] 从中点 ${mid} 分开。`, { low, high, mid });

    mergeSort(low, mid);
    mergeSort(mid + 1, high);

    let temp = [];
    let i = low, j = mid + 1, k = 0;
    currentI = i; currentJ = j; currentK = k; currentTemp = [];
    record('merge-start', 'declare', `准备合并区间 [${low}, ${mid}] 和 [${mid + 1}, ${high}]。`, { low, high, mid, i, j, k, temp });

    while (i <= mid && j <= high) {
      currentI = i; currentJ = j; currentTemp = [...temp];
      record('compare', 'compare', `比较左半部分的 A[${i}] = ${array[i]} 和右半部分的 A[${j}] = ${array[j]}。`, { low, high, mid, i, j, k, temp });
      if (array[i] <= array[j]) {
        temp.push(array[i]);
        currentTemp = [...temp]; currentK = k + 1;
        record('pick', 'pick-left', `A[${i}] 较小，放入临时数组 temp[${k}]。`, { low, high, mid, i, j, k, temp });
        i++;
      } else {
        temp.push(array[j]);
        currentTemp = [...temp]; currentK = k + 1;
        record('pick', 'pick-right', `A[${j}] 较小，放入临时数组 temp[${k}]。`, { low, high, mid, i, j, k, temp });
        j++;
      }
      k++;
    }
    
    while (i <= mid) { 
      temp.push(array[i]); 
      currentI = i; currentK = k; currentTemp = [...temp];
      record('pick', 'pick-remain', `左半部分剩余元素 A[${i}] 放入临时数组。`, { low, high, mid, i, j, k, temp }); 
      i++; k++;
    }
    while (j <= high) { 
      temp.push(array[j]); 
      currentJ = j; currentK = k; currentTemp = [...temp];
      record('pick', 'pick-remain', `右半部分剩余元素 A[${j}] 放入临时数组。`, { low, high, mid, i, j, k, temp }); 
      j++; k++;
    }

    for (let p = 0; p < temp.length; p++) {
      array[low + p] = temp[p];
      currentTemp = [...temp]; currentK = p + 1;
      record('copy', 'copy-back', `将 temp[${p}] = ${temp[p]} 写回 A[${low + p}]。`, { low, high, mid, i, j, k: p, temp });
    }
    record('merge', 'copy-back', `合并完成，区间 [${low}, ${high}] 已有序。`, { low, high, mid, i, j, k: temp.length, temp });
  }

  mergeSort(0, array.length - 1);

  steps.push({
    schemaVersion: '1.0', algorithm: 'merge-sort', stepIndex: steps.length,
    sourceVersion: SOURCE_VERSION, event: 'sorted', lineId: 'done', array: [...array],
    variables: { low: 0, high: array.length - 1, mid: null, i: null, j: null, k: null, temp: [] },
    description: '归并排序完成，数组已按从小到大排列。', done: true, result: [...array],
  });

  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}