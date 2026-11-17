const SOURCE_VERSION = 'heap-c-v3';
const SOURCE_LINES = [
  { lineId: 'init', text: 'void heap_sort(long long a[], int n) {' },
  { lineId: 'build-heap', text: '  for (int i = n / 2 - 1; i >= 0; --i)' },
  { lineId: 'heapify-call-1', text: '    heapify(a, n, i);' },
  { lineId: 'extract-loop', text: '  for (int i = n - 1; i > 0; --i) {' },
  { lineId: 'swap-root', text: '    long long t = a[0]; a[0] = a[i]; a[i] = t;' },
  { lineId: 'heapify-call-2', text: '    heapify(a, i, 0);' },
  { lineId: 'extract-end', text: '  }' },
  { lineId: 'done', text: '}' },
  { lineId: 'heapify-func', text: 'void heapify(long long a[], int n, int i) {' },
  { lineId: 'init-largest', text: '  int largest = i;' },
  { lineId: 'init-children', text: '  int l = 2 * i + 1, r = 2 * i + 2;' },
  { lineId: 'compare-l', text: '  if (l < n && a[l] > a[largest]) largest = l;' },
  { lineId: 'compare-r', text: '  if (r < n && a[r] > a[largest]) largest = r;' },
  { lineId: 'check-swap', text: '  if (largest != i) {' },
  { lineId: 'swap-node', text: '    long long t = a[i]; a[i] = a[largest]; a[largest] = t;' },
  { lineId: 'recursive', text: '    heapify(a, n, largest);' },
  { lineId: 'heapify-end', text: '  }' },
  { lineId: 'heapify-return', text: '}' },
];

export function generateHeapSortSteps(input) {
  const array = [...input];
  const steps = [];
  let state = { heapSize: 0, i: 0, largest: 0, l: 0, r: 0 };

  function record(event, lineId, description, extra = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'heap-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { ...state, ...extra }, description, done,
      result: done ? [...array] : null,
    });
  }

  function heapify(n, i) {
    let largest = i, l = 2 * i + 1, r = 2 * i + 2;
    state.heapSize = n; state.i = i; state.largest = largest; state.l = l; state.r = r;
    record('heapify-init', 'init-largest', `调整节点 i=${i}。`);

    if (l < n) {
      record('compare', 'compare-l', `比较左孩子 A[${l}] 和 A[${largest}]。`);
      if (array[l] > array[largest]) {
        largest = l; state.largest = largest;
        record('update-largest', 'compare-l', `左孩子更大，更新 largest=${largest}。`);
      }
    }
    if (r < n) {
      record('compare', 'compare-r', `比较右孩子 A[${r}] 和 A[${largest}]。`);
      if (array[r] > array[largest]) {
        largest = r; state.largest = largest;
        record('update-largest', 'compare-r', `右孩子更大，更新 largest=${largest}。`);
      }
    }
    if (largest !== i) {
      record('check-swap', 'check-swap', `交换 A[${i}] 和 A[${largest}]。`);
      const temp = array[i]; array[i] = array[largest]; array[largest] = temp;
      record('swap', 'swap-node', `交换完成。`);
      heapify(n, largest);
    }
  }

  record('init', 'init', '开始堆排序。');
  if (array.length <= 1) { record('sorted', 'done', '数组有序。'); return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES }; }

  let n = array.length;
  
  // 【修复】为 build-start 显式提供合法的初始状态，避免 heapSize=0, i=0 被校验拦截
  state = { heapSize: n, i: Math.floor(n / 2) - 1, largest: null, l: null, r: null };
  record('build-start', 'build-heap', `从最后一个非叶子节点开始建堆。`);
  
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    state = { heapSize: n, i: i, largest: null, l: null, r: null };
    record('heapify-call', 'heapify-call-1', `调整以 ${i} 为根的子树。`);
    heapify(n, i);
  }

  record('extract-start', 'extract-loop', `提取最大值。`);
  for (let i = n - 1; i > 0; i--) {
    // 【修复】这里 i 代表外层末尾下标，heapSize 也是 i。这是合法的边界状态。
    state = { heapSize: i, i: i, largest: null, l: null, r: null };
    record('swap-root', 'swap-root', `堆顶 A[0] 与末尾 A[${i}] 交换。`);
    const temp = array[0]; array[0] = array[i]; array[i] = temp;
    record('swap', 'swap-root', `交换完成。`);
    
    record('heapify-call', 'heapify-call-2', `对前 ${i} 个元素重新调整。`);
    heapify(i, 0);
  }

  record('sorted', 'done', '排序完成。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}
