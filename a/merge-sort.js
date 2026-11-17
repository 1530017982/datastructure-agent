const SOURCE_VERSION = 'merge-c-v1';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void merge_sort(long long a[], int low, int high) {' },
  { lineId: 'base-check', text: '  if (low >= high) return;' },
  { lineId: 'calc-mid', text: '  int mid = low + (high - low) / 2;' },
  { lineId: 'recurse-left', text: '  merge_sort(a, low, mid);' },
  { lineId: 'recurse-right', text: '  merge_sort(a, mid + 1, high);' },
  { lineId: 'merge-start', text: '  // 合并 a[low...mid] 和 a[mid+1...high]' },
  { lineId: 'compare', text: '  if (a[i] <= a[j]) {' },
  { lineId: 'pick-left', text: '    temp[k++] = a[i++];' },
  { lineId: 'pick-right', text: '  } else {' },
  { lineId: 'pick-right-body', text: '    temp[k++] = a[j++];' },
  { lineId: 'copy-back', text: '  // 将 temp 复制回 a' },
  { lineId: 'done', text: '}' },
];

export function generateMergeSortSteps(input) {
  const array = [...input];
  const steps = [];
  let currentLow = 0, currentHigh = 0, currentMid = 0;

  function record(event, lineId, description, variables = {}) {
    steps.push({
      schemaVersion: '1.0', algorithm: 'merge-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { low: currentLow, high: currentHigh, mid: currentMid, ...variables },
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
    let i = low, j = mid + 1;
    while (i <= mid && j <= high) {
      record('compare', 'compare', `比较左半部分的 A[${i}] = ${array[i]} 和右半部分的 A[${j}] = ${array[j]}。`, { low, high, mid, i, j });
      if (array[i] <= array[j]) {
        temp.push(array[i]);
        record('pick', 'pick-left', `A[${i}] 较小，放入临时数组。`, { low, high, mid, i, j });
        i++;
      } else {
        temp.push(array[j]);
        record('pick', 'pick-right-body', `A[${j}] 较小，放入临时数组。`, { low, high, mid, i, j });
        j++;
      }
    }
    while (i <= mid) { temp.push(array[i]); record('pick', 'pick-left', `左半部分剩余元素 A[${i}] 放入临时数组。`, { low, high, mid, i, j }); i++; }
    while (j <= high) { temp.push(array[j]); record('pick', 'pick-right-body', `右半部分剩余元素 A[${j}] 放入临时数组。`, { low, high, mid, i, j }); j++; }

    for (let k = 0; k < temp.length; k++) {
      array[low + k] = temp[k];
    }
    record('merge', 'copy-back', `合并完成，区间 [${low}, ${high}] 已有序。`, { low, high, mid });
  }

  mergeSort(0, array.length - 1);

  steps.push({
    schemaVersion: '1.0', algorithm: 'merge-sort', stepIndex: steps.length,
    sourceVersion: SOURCE_VERSION, event: 'sorted', lineId: 'done', array: [...array],
    variables: { low: 0, high: array.length - 1, mid: null },
    description: '归并排序完成，数组已按从小到大排列。', done: true, result: [...array],
  });

  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}