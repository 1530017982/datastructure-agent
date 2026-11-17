const SOURCE_VERSION = 'binary-insertion-c-v1';
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
  let currentI = 0, currentL = 0, currentR = -1, currentM = -1, currentTemp = null;

  function record(event, lineId, description, variables = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'binary-insertion-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { i: currentI, left: currentL, right: currentR, mid: currentM, temp: currentTemp, ...variables },
      description, done, result: done ? [...array] : null,
    });
  }

  record('init', 'init', '开始折半插入排序。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组为空或只有一个元素，已经有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  for (let i = 1; i < array.length; i++) {
    currentI = i;
    let temp = array[i];
    currentTemp = temp;
    record('select', 'temp', `取出当前元素 ${temp}，准备在前面的有序序列中寻找插入位置。`, { i, temp });
    
    let left = 0, right = i - 1;
    currentL = left; currentR = right;
    record('init-bounds', 'init-bounds', `查找范围 [0, ${right}]。`, { i, left, right, temp });

    while (left <= right) {
      let mid = Math.floor((left + right) / 2);
      currentM = mid; currentL = left; currentR = right;
      record('compare', 'calc-mid', `取中间位置 mid = ${mid}，比较 A[${mid}] = ${array[mid]} 和 ${temp}。`, { i, left, right, mid, temp });
      
      if (array[mid] > temp) {
        right = mid - 1;
        currentR = right;
        record('move-right', 'compare', `A[${mid}] > ${temp}，插入位置在左半区，更新 right = ${right}。`, { i, left, right, mid, temp });
      } else {
        left = mid + 1;
        currentL = left;
        record('move-left', 'else', `A[${mid}] <= ${temp}，插入位置在右半区，更新 left = ${left}。`, { i, left, right, mid, temp });
      }
    }

    record('found-pos', 'while-end', `查找结束，插入位置为 ${left}。`, { i, left, temp });
    
    for (let j = i - 1; j >= left; j--) {
      array[j + 1] = array[j];
      record('move', 'move', `将元素 A[${j}] = ${array[j]} 向右移动一位。`, { i, left, j, temp });
    }
    
    array[left] = temp;
    record('insert', 'insert', `将 ${temp} 插入到位置 ${left}。`, { i, left, temp });
  }

  record('sorted', 'done', '排序完成，数组已按从小到大排列。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}