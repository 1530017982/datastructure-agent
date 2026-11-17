const SOURCE_VERSION = 'heap-c-v1';
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
  let currentHeapSize = 0, currentI = 0, currentLargest = 0, currentL = 0, currentR = 0;

  function record(event, lineId, description, variables = {}) {
    const done = event === 'sorted';
    steps.push({
      schemaVersion: '1.0', algorithm: 'heap-sort', stepIndex: steps.length,
      sourceVersion: SOURCE_VERSION, event, lineId, array: [...array],
      variables: { heapSize: currentHeapSize, i: currentI, largest: currentLargest, l: currentL, r: currentR, ...variables },
      description, done, result: done ? [...array] : null,
    });
  }

  function heapify(n, i) {
    let largest = i;
    let l = 2 * i + 1;
    let r = 2 * i + 2;
    
    currentHeapSize = n; currentI = i; currentLargest = largest; currentL = l; currentR = r;
    record('heapify-init', 'init-largest', `调整节点 i=${i}，当前最大值候选为 ${largest}。`, { heapSize: n, i, largest, l, r });

    if (l < n) {
      record('compare', 'compare-l', `比较左孩子 A[${l}] = ${array[l]} 和 A[${largest}] = ${array[largest]}。`, { heapSize: n, i, largest, l, r });
      if (array[l] > array[largest]) {
        largest = l;
        currentLargest = largest;
        record('update-largest', 'compare-l', `左孩子更大，更新最大值为 ${largest}。`, { heapSize: n, i, largest, l, r });
      }
    }

    if (r < n) {
      record('compare', 'compare-r', `比较右孩子 A[${r}] = ${array[r]} 和 A[${largest}] = ${array[largest]}。`, { heapSize: n, i, largest, l, r });
      if (array[r] > array[largest]) {
        largest = r;
        currentLargest = largest;
        record('update-largest', 'compare-r', `右孩子更大，更新最大值为 ${largest}。`, { heapSize: n, i, largest, l, r });
      }
    }

    if (largest !== i) {
      record('check-swap', 'check-swap', `最大值不是根节点，需要交换 A[${i}] 和 A[${largest}]。`, { heapSize: n, i, largest, l, r });
      const temp = array[i];
      array[i] = array[largest];
      array[largest] = temp;
      record('swap', 'swap-node', `交换完成。`, { heapSize: n, i, largest, l, r });
      
      heapify(n, largest);
    }
  }

  record('init', 'init', '开始堆排序，准备建立大顶堆。');
  if (array.length <= 1) {
    record('sorted', 'done', '数组为空或只有一个元素，已经有序。');
    return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
  }

  let n = array.length;
  record('build-start', 'build-heap', `从最后一个非叶子节点开始建堆。`);
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    record('heapify-call', 'heapify-call-1', `调整以 ${i} 为根的子树。`);
    heapify(n, i);
  }

  record('extract-start', 'extract-loop', `大顶堆建立完成，开始逐个提取最大值。`);
  for (let i = n - 1; i > 0; i--) {
    currentHeapSize = i; currentI = i;
    record('swap-root', 'swap-root', `将堆顶元素 A[0] = ${array[0]} 与末尾元素 A[${i}] = ${array[i]} 交换。`, { heapSize: i });
    const temp = array[0];
    array[0] = array[i];
    array[i] = temp;
    record('swap', 'swap-root', `交换完成，${array[i]} 已就位。`, { heapSize: i });

    record('heapify-call', 'heapify-call-2', `对剩余的前 ${i} 个元素重新调整为大顶堆。`);
    heapify(i, 0);
  }

  record('sorted', 'done', '排序完成，数组已按从小到大排列。');
  return { steps, result: array, sourceVersion: SOURCE_VERSION, sourceLines: SOURCE_LINES };
}