# 第8章 排序

> 面向 408 复习，按用户提供的王道 2027 版目录组织。定义、函数与算例为独立整理，不摘录教材试题或答案。
>
> [[B00-排序导航|返回本章导航]]

## 本章约定与代码使用

- 默认将记录按整数 `key` **非递减排序**，允许重复。`value` 表示随记录移动的数据，可记录原始编号来观察稳定性。交换、搬移、复制必须操作整条记录。
- 内部数组采用 0 基下标，常用有效范围 `a[0..n-1]`。快速排序、归并排序的辅助函数使用闭区间 `[low,high]`；堆中的孩子为 `2i+1`、`2i+2`。
- 稳定性是“相等关键字记录的原相对顺序是否始终保持”，不是“数组是否已经有序”。具体实现中的等号、交换范围、分配收集顺序都会影响稳定性。
- 关键字比较次数只数记录间的 key 判定，不把循环边界判定混入。移动次数若精确计算，本页把整条记录赋值算 1 次：交换通常 3 次，暂存、回填也计数；题目另有规定则以题设为准。
- 时间复杂度表含最好、平均、最坏；辅助空间计入递归栈与临时数组，不把原输入数组当额外空间。**原地 O(1) 辅助空间不等于稳定。**
- 代码为 C++ 风格的 C 基础写法：结构体、数组、指针、函数、malloc/free；无 STL、类、模板，无额外 `.cpp` 文件。
- 常规原地排序函数要求 `n≥0`、n>0 时 a 有效。需要分配内存或限定 key 范围的函数会返回 bool；失败含义另行说明。输出数组容量与指针由调用者保证。
- 外部排序区分记录数 N、内存可驻留记录数 w、磁盘块数 D、缓冲块数 b、归并路数 k、初始段数 r、归并趟数 s；避免一个字母同时代表不同单位。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
#include <stdint.h>

typedef struct {
    int key;
    int value;
} SortRecord;

void SwapRecord(SortRecord *a, SortRecord *b) {
    SortRecord temp = *a;
    *a = *b;
    *b = temp;
}
```

## 8.1 排序的基本概念

### 8.1.1 排序的定义

#### 排序、稳定性与多关键字

排序是把记录重新排列，使关键字满足指定的大小关系。非递减允许相等；降序改变比较方向。排序对象是**记录**，关键字只是确定其顺序的依据。

稳定性例子，A/B 是原始身份，不参与 key 大小比较：

```text
输入： (3,A) (1,X) (3,B) (2,Y)
稳定： (1,X) (2,Y) (3,A) (3,B)
不稳： (1,X) (2,Y) (3,B) (3,A)
```

不稳定算法也可能在某个输入上保留同 key 的顺序；只有“所有合法输入都保证”才称稳定。没有重复 key 的输入无法区分该次结果是否破坏稳定性。

**多关键字排序：**例如先按班级升序，再按同班成绩降序。可以直接写组合比较器；也可以先按次关键字成绩排序，再用**稳定算法**按主关键字班级排序，这样同班内部保留成绩次序。按相反次序连续做普通全表排序，通常会让最后排的字段成为主关键字。

#### 内部排序、外部排序与性能指标

- 内部排序：待排记录可驻留内存，主要分析 key 比较、记录搬移和辅助空间。
- 外部排序：记录不能全部驻留内存，要借助外存；主要瓶颈通常是块读写与归并趟数，CPU 比较仍要考虑。
- 比较排序：靠关键字间的比较决定次序；分配式排序如基数、计数可利用 key 的范围或数字结构。
- 自适应性：能利用输入已有次序改善性能。例如带提前停止的冒泡和直接插入，已排序输入可达到线性时间。

比较排序处理 n 个互异 key，在一般模型下要区分 n! 种排列，决策树最坏高度至少 ⌈log₂(n!)⌉，渐近为 Ω(n log n)。这不是每个输入都必须 n log n 次比较，也不能用来否定有范围约束的计数/基数线性排序。

> [!tip] 考点提示
> 比较时间、移动时间、额外内存、稳定性、输入特征、记录大小、是否链式、是否外存都可能决定选择。只有“平均快”不足以说明一种算法全面优于另一种。

## 8.2 插入排序

### 8.2.1 直接插入排序

#### 有序前缀、移动插入与稳定性

第 i 趟前，`a[0..i-1]` 已有序；暂存 `a[i]`，把比它**严格大**的记录向右移，再放入空位。共 n−1 个待插入记录，不等于每趟只做一次比较。

```cpp
void InsertionSort(SortRecord a[], int n) {
    for (int i = 1; i < n; ++i) {
        SortRecord temp = a[i];
        int j = i - 1;
        while (j >= 0 && a[j].key > temp.key) {
            a[j + 1] = a[j];
            --j;
        }
        a[j + 1] = temp;
    }
}
```

条件为 `>`，相等记录不越过已有相等记录，所以稳定。若改成 `>=`，新记录会插到旧相等记录前，破坏稳定性。

#### 直接插入的趟数、比较与移动

例 `[5,2,4,1,3]`：

```text
插入2： [2,5 | 4,1,3]
插入4： [2,4,5 | 1,3]
插入1： [1,2,4,5 | 3]
插入3： [1,2,3,4,5]
```

最好已非递减：key 比较 n−1 次，代码仍每趟暂存与回填，n≥1 时记录赋值 2(n−1) 次；可优化不需要移动时跳过回填，但应以指定代码计数。

最坏严格递减：key 比较 Σi=n(n−1)/2；右移同样 Σi 次，连同暂存和回填共 n(n−1)/2+2(n−1) 次记录赋值。边界 `j>=0` 不计 key 比较。

最好 O(n)，平均/最坏 O(n²)，辅助 O(1)。n=0、1 时无需排序。

#### 逆序对与近乎有序输入

逆序对是 i<j 且 a[i].key>a[j].key 的一对记录；相等不算。上面的移动式插入中，每右移一次消去一个逆序对，所以右移次数等于初始逆序对数 I，时间可写 O(n+I)。

“接近有序”应具体看逆序对或移位距离，不是仅有少量位置错就一定线性。例如一个很大的 key 在首位，也可能产生 n−1 个逆序对；n−1 仍线性，但错误记录之间的规模可使 I 更大。

### 8.2.2 折半插入排序

#### 用折半定位稳定插入位置

仍维护有序前缀，只把“找插入位置”改为折半。为了稳定，应找**第一个严格大于 temp.key 的位置**，使新记录位于已有相等记录之后。

```cpp
void BinaryInsertionSort(SortRecord a[], int n) {
    for (int i = 1; i < n; ++i) {
        SortRecord temp = a[i];
        int low = 0, high = i; // 搜索区间 [low,high)，结果可为 i。
        while (low < high) {
            int mid = low + (high - low) / 2;
            if (a[mid].key <= temp.key) { low = mid + 1; }
            else { high = mid; }
        }
        for (int j = i - 1; j >= low; --j) { a[j + 1] = a[j]; }
        a[low] = temp;
    }
}
```

若对相等时也向左找，变成“首个 ≥temp”，就可能不稳定。以 `(2,A),(2,B),(1,X)` 为例，插入 B 时正确放在 A 后。

#### 比较减少但移动成本不变

每趟定位 O(log i)，总 key 比较 Θ(n log n)，此无提前跳过版本最好也如此；移动次数仍取决于插入位置，最坏 Θ(n²)，总体平均/最坏 O(n²)，辅助 O(1)，稳定。

在已排序输入上，没有右移，但仍每趟折半，因此本版本最好 Θ(n log n)。若先判断 `a[i-1].key<=a[i].key` 然后跳过，该优化版最好可 O(n)。**不要把不同版本的最好复杂度混成一个固定答案。**

### 8.2.3 希尔排序

#### 增量分组与逐步缩小间隔

希尔排序又称缩小增量排序。给定 gap，把下标同余的记录视为一组，各组做直接插入；逐次减小 gap，最后必须 gap=1，才能保证全表有序。

不是把相邻 gap 个记录作为一组。例如 n=8、gap=3：组为 `[0,3,6]`、`[1,4,7]`、`[2,5]`。

```cpp
// 本版增量 n/2、n/4、...、1，全部整数下取整。
void ShellSort(SortRecord a[], int n) {
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; ++i) {
            SortRecord temp = a[i];
            int j = i - gap;
            while (j >= 0 && a[j].key > temp.key) {
                a[j + gap] = a[j];
                j -= gap;
            }
            a[j + gap] = temp;
        }
    }
}
```

#### 希尔演算与不稳定反例

输入 `[8,3,7,4,6,2,5,1]`，用 gap=4、2、1：

```text
gap=4 后： [6,2,5,1,8,3,7,4]
gap=2 后： [5,1,6,2,7,3,8,4]
gap=1 后： [1,2,3,4,5,6,7,8]
```

不稳定反例：`[(2,A),(2,B),(1,X)]`，先 gap=2，再 gap=1。gap=2 将 X 和 A 所在组排为 X、A，数组变成 `X,B,A`；最后 A/B 仍为 B、A。即便组内只移动严格大的记录，跨组仍会改变相等 key 的全局次序。

上面 `ShellSort` 对 n=3 实际只用 gap=1，不会出现该反例；反例是说明合法增量序列 `[2,1]` 的希尔过程。对本代码可用 n=4 的 `[(2,A),(2,B),(1,X),(3,Y)]`：gap=2 后 X、B、A、Y，最终 B 在 A 前。

#### 增量序列与复杂度边界

辅助空间 O(1)，不稳定，直接依赖能按间隔访问数组；通常不适合用普通链表照搬。时间复杂度强烈依赖增量序列与输入。

- 本页折半增量版本：最坏 O(n²)，已排序时仍要做多趟检查，最好 Θ(n log n)。
- 某些其他增量序列有不同的理论界或经验性能；不能把“希尔一律 O(n^1.3)”当统一结论。
- gap 排序只保证各同余组有序；经过 gap=1 的整表插入才完成最终排序。趟数按增量个数计，不按每次插入计。

## 8.3 交换排序

### 8.3.1 冒泡排序

#### 相邻交换、提前停止与函数

本版每趟从左到右，相邻逆序就交换；第一趟最大记录到末尾，第 t 趟后最后 t 个位置固定。相等不交换，稳定。

```cpp
void BubbleSort(SortRecord a[], int n) {
    for (int end = n - 1; end > 0; --end) {
        bool changed = false;
        for (int j = 0; j < end; ++j) {
            if (a[j].key > a[j + 1].key) {
                SwapRecord(&a[j], &a[j + 1]);
                changed = true;
            }
        }
        if (!changed) { break; }
    }
}
```

另一常见版本从右往左把最小值冒到开头，趟后形态不同。题目要求手工一趟时必须看扫描方向，不能只凭“冒泡”猜结果。

#### 冒泡趟后状态与逆序对

输入 `[5,1,4,2,3]`：

```text
第1趟： [1,4,2,3 | 5]
第2趟： [1,2,3 | 4,5]
第3趟： [1,2 | 3,4,5]，无交换，停止。
```

有序输入最好比较 n−1 次、0 次交换，时间 O(n)；严格递减最坏比较 n(n−1)/2 次、交换同样多、记录赋值为 3n(n−1)/2。平均/最坏 O(n²)，辅助 O(1)。若不带提前停止，最好也 Θ(n²)。

每次相邻逆序交换减少恰好一个逆序对，所以交换次数等于初始逆序对数 I；但比较次数未必 O(n+I)。例如 `[2,3,...,n,1]` 中 I=n−1，本版 1 每趟只向左移一个位置，仍需 Θ(n²) 比较。不能把插入排序的 O(n+I) 直接套到普通冒泡。

### 8.3.2 快速排序

#### 一次划分、枢轴最终位置与函数

快速排序选择枢轴 pivot，划分成不大于 pivot 与不小于 pivot 的两侧，再递归处理左右；两侧内部并不因此有序。

本版采用首记录枢轴与挖坑法，左右扫描方向与等号配合，最终 pivot 放在 low==high 处。这一位置已是该枢轴在完整非递减排列中的一个合法位置。

```cpp
int PartitionHole(SortRecord a[], int low, int high) {
    SortRecord pivot = a[low];
    while (low < high) {
        while (low < high && a[high].key >= pivot.key) { --high; }
        if (low < high) { a[low] = a[high]; }
        while (low < high && a[low].key <= pivot.key) { ++low; }
        if (low < high) { a[high] = a[low]; }
    }
    a[low] = pivot;
    return low;
}

void QuickSortRange(SortRecord a[], int low, int high) {
    if (low >= high) { return; }
    int p = PartitionHole(a, low, high);
    QuickSortRange(a, low, p - 1);
    QuickSortRange(a, p + 1, high);
}

void QuickSort(SortRecord a[], int n) {
    if (n > 1) { QuickSortRange(a, 0, n - 1); }
}
```

等号使扫描在等值处也能推进，但全相等输入仍可能得到极端划分。递归边界排除已定位枢轴，不能写回包含 p 的原区间而导致不缩小。

#### 快速划分例子与不稳定反例

按本代码对 `[4,2,7,3,6,1,5]` 做第一次划分：pivot=4；从右找到 1 填左坑，从左找到 7 填右坑，再从右找到 3 填坑，最终：

```text
[1,2,3 | 4 | 6,7,5]
```

左侧≤4、右侧≥4；右侧不是完整有序。若题目采用别的枢轴/分区方案，一趟结果可不同，不应照抄这一状态。

不稳定反例：`[(2,A),(2,B),(1,X)]`。本版第一次划分可得 `[(1,X),(2,B),(2,A)]`，相等记录 B、A 逆序。

#### 平均、最坏与递归栈

一次划分 Θ(n)。较均衡：T(n)=2T(n/2)+Θ(n)，Θ(n log n)，栈 O(log n)。每次枢轴落端点：T(n)=T(n−1)+Θ(n)，Θ(n²)，朴素递归栈 O(n)。

随机排列互异 key、固定首枢轴，或对互异 key 随机选枢轴，可以得到常见期望 Θ(n log n)。首枢轴遇已排序/逆序/本版全相等等输入可能退化。**随机化降低坏输入风险，不提供最坏 O(n log n) 保证。**

平均效率较好，辅助空间必须算栈，本页朴素版不能写“空间一律 O(1)”或“一律 O(log n)”。三数取中等改善枢轴策略也不是无条件消除最坏情况。

#### 只递归短区间与三路划分

只递归较短一侧，把较长一侧放进循环，可将**最坏递归栈**限制为 O(log n)；划分仍可能不均，时间最坏仍 O(n²)。

```cpp
void QuickSortShortFirst(SortRecord a[], int low, int high) {
    while (low < high) {
        int p = PartitionHole(a, low, high);
        if (p - low < high - p) {
            QuickSortShortFirst(a, low, p - 1);
            low = p + 1;
        } else {
            QuickSortShortFirst(a, p + 1, high);
            high = p - 1;
        }
    }
}
```

大量重复 key 时，可把区间划成 `<pivot`、`=pivot`、`>pivot` 三段，相等段不用递归。下面展示三路过程，仍不稳定；不重复 key 的极端枢轴仍可能导致平方时间。

```cpp
void QuickSortThreeWay(SortRecord a[], int low, int high) {
    if (low >= high) { return; }
    int pivot = a[low].key;
    int lt = low, i = low, gt = high;
    while (i <= gt) {
        if (a[i].key < pivot) {
            SwapRecord(&a[lt++], &a[i++]);
        } else if (a[i].key > pivot) {
            SwapRecord(&a[i], &a[gt--]); // 换来的记录尚未判断，i 不增加。
        } else { ++i; }
    }
    QuickSortThreeWay(a, low, lt - 1);
    QuickSortThreeWay(a, gt + 1, high);
}
```

全相等时三路版一次线性扫描结束，朴素二路挖坑版却可能平方。回答复杂度时先说明实现版本和输入条件。

## 8.4 选择排序

### 8.4.1 简单选择排序

#### 选最小值、交换与函数

第 i 趟从 `a[i..n-1]` 找最小记录，与 a[i] 交换；第 i 趟后前 i+1 个位置固定。与插入的“前缀暂有序、记录仍可能后移”不同，这些前缀位置已是最终位置。

```cpp
void SelectionSort(SortRecord a[], int n) {
    for (int i = 0; i < n - 1; ++i) {
        int minimum = i;
        for (int j = i + 1; j < n; ++j) {
            if (a[j].key < a[minimum].key) { minimum = j; }
        }
        if (minimum != i) { SwapRecord(&a[i], &a[minimum]); }
    }
}
```

#### 固定比较次数与不稳定反例

无论初始次序，key 比较 Σ(n−1−i)=n(n−1)/2，最好/平均/最坏时间 Θ(n²)。最多 n−1 次交换，交换赋值最多 3(n−1) 次；本版有序输入不交换。辅助 O(1)，不稳定。

反例 `[(2,A),(2,B),(1,X)]`：第一趟把 X 与 A 交换，得到 `X,B,A`。即便选择时只在严格小于时更新 minimum，也阻止不了远距离交换造成逆序。

若改为取出最小记录、把中间记录依次右移、插到前端，可以实现稳定的选择版本，但移动复杂度改变；考试默认的简单选择通常指交换版。

### 8.4.2 堆排序

#### 完全二叉树与大小根堆

堆是满足局部次序的完全二叉树，数组能紧凑存储。大根堆：每个父 key≥其孩子；小根堆相反。堆不是 BST，兄弟或不同子树没有统一大小关系；数组整体也不有序。

0 基数组：父 `(i-1)/2`（仅 i>0），左孩子 `2i+1`，右孩子 `2i+2`；n≥2 时最后非叶为 `n/2-1`。非叶数 ⌊n/2⌋，叶下标从 ⌊n/2⌋ 到 n−1。

**升序原地堆排序建大根堆。**每次把最大堆顶交换到当前有效堆的末尾，缩小堆，再下滤；已放末尾的大值不得重新参与调整。小根堆不断弹出可得到升序输出序列，但在同一数组中“交换堆顶到末尾”会得到降序。

#### 下滤、上滤与线性建堆函数

```cpp
// [0,n) 中除 root 可能不足外，其左右子树都已是大根堆。
void MaxHeapSiftDown(SortRecord a[], int n, int root) {
    SortRecord temp = a[root];
    int parent = root;
    while (parent < n / 2) { // 先判断有孩子，避免计算叶的 2*parent+1。
        int child = 2 * parent + 1;
        if (child + 1 < n && a[child + 1].key > a[child].key) { ++child; }
        if (temp.key >= a[child].key) { break; }
        a[parent] = a[child];
        parent = child;
    }
    a[parent] = temp;
}

void MaxHeapSiftUp(SortRecord a[], int index) {
    SortRecord temp = a[index];
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (a[parent].key >= temp.key) { break; }
        a[index] = a[parent];
        index = parent;
    }
    a[index] = temp;
}

void BuildMaxHeap(SortRecord a[], int n) {
    for (int i = n / 2 - 1; i >= 0; --i) { MaxHeapSiftDown(a, n, i); }
}

void HeapSort(SortRecord a[], int n) {
    BuildMaxHeap(a, n);
    for (int end = n - 1; end > 0; --end) {
        SwapRecord(&a[0], &a[end]);
        MaxHeapSiftDown(a, end, 0); // 有效堆为 [0,end)。
    }
}
```

`MaxHeapSiftDown` 要求 n>0 且 root 是有效下标。本版用 `parent<n/2` 判断有孩子，对**奇数 n 的最后非叶**仍成立：例如 n=5，parent=1<2 有孩子，parent=2 为叶。n=1、root=0 时仅回填，不进入循环。

建堆从最后非叶向根，每次孩子子树已是堆。不是从根向下随便调整一遍。

#### 堆建立、插入、删除与修改数据

以下操作针对**正在维护的大根堆**，n 是有效堆长度；完成 `HeapSort` 后数组已非递减，通常不再是大根堆，若继续堆操作应先重建。

```cpp
bool MaxHeapPeek(const SortRecord a[], int n, SortRecord *out) {
    if (n <= 0 || out == NULL) { return false; }
    *out = a[0];
    return true;
}

bool MaxHeapPush(SortRecord a[], int *n, int capacity, SortRecord r) {
    if (n == NULL || *n < 0 || *n >= capacity) { return false; }
    a[*n] = r;
    MaxHeapSiftUp(a, *n);
    ++(*n);
    return true;
}

bool MaxHeapPop(SortRecord a[], int *n, SortRecord *out) {
    if (n == NULL || *n <= 0 || out == NULL) { return false; }
    *out = a[0];
    --(*n);
    if (*n > 0) {
        a[0] = a[*n];
        MaxHeapSiftDown(a, *n, 0);
    }
    return true;
}

// 已知数组位置 index，替换整条记录后恢复堆。
bool MaxHeapReplaceAt(SortRecord a[], int n, int index, SortRecord r) {
    if (index < 0 || index >= n) { return false; }
    a[index] = r;
    if (index > 0 && a[index].key > a[(index - 1) / 2].key) {
        MaxHeapSiftUp(a, index);
    } else { MaxHeapSiftDown(a, n, index); }
    return true;
}

bool MaxHeapDeleteAt(SortRecord a[], int *n, int index, SortRecord *out) {
    if (n == NULL || index < 0 || index >= *n || out == NULL) { return false; }
    *out = a[index];
    --(*n);
    if (index < *n) { MaxHeapReplaceAt(a, *n, index, a[*n]); }
    return true;
}

int HeapFindKey(const SortRecord a[], int n, int key) {
    for (int i = 0; i < n; ++i) {
        if (a[i].key == key) { return i; }
    }
    return -1;
}
```

堆顶读取 O(1)，建堆 O(n)，插入/弹顶/已知位置删除和替换最坏 O(log n)；按任意 key 查找最坏 O(n)，不能按 BST 方式只走一条子树。只修改 value 可原地改，不需堆调整；修改 key 必须恢复堆性质。输出指针不要指向本次操作会覆盖的数组槽。

#### 建堆O(n)、排序复杂度与不稳定反例

多数结点接近底层，调整距离短。高度约 h 的结点数量不超过约 n/2^(h+1)，总调整上界为：

$$\sum_{h\ge0}O\left(\frac{n}{2^{h+1}}h\right)=O(n)$$

这说明自底向上建堆 O(n)，不是“n 个结点各 O(log n)，所以建堆必定 n log n”。若逐条 Push 来建，最坏才 O(n log n)。

随后 n−1 次取堆顶，每次最多 O(log n)，堆排序平均/最坏 O(n log n)，辅助 O(1)，不稳定；教材比较表通常将最好也列 O(n log n) 的通用界。**本页带提前停止的下滤在全相等输入上可只用 Θ(n)**，所以若要求紧确最好界，应以允许重复 key 和该实现为条件说明，不能把通用上界当所有输入的精确次数。

不稳定反例 `[(2,A),(2,B),(1,X)]`：建堆后根为 A；交换 A 到末尾，再使 B 成堆顶，最终 X、B、A。

#### 堆排序逐趟演算

输入 `[4,1,3,2,5]`，使用本页下滤：

```text
建堆后： [5,4,3,2,1]
取最大： [4,2,3,1 | 5]
再取：   [3,2,1 | 4,5]
再取：   [2,1 | 3,4,5]
再取：   [1 | 2,3,4,5]
```

题目说“第一趟”可能从建堆算起，也可能指建堆后的第一次取堆顶；先确认定义。仅知道某个堆满足父≥子，不足以唯一确定它由哪种建堆代码产生。

## 8.5 归并排序、基数排序和计数排序

### 8.5.1 归并排序

#### 两路归并与稳定的相等处理

归并把两个已经有序的段合成一个有序段。各维护首个未取位置，每次取较小 key；若相等优先取**来自原序列左段**的记录，才能保留跨段的同 key 相对次序。

```cpp
// a[low..mid] 与 a[mid+1..high] 已非递减；temp 与 a 不重叠，容量至少 n。
void MergeRanges(SortRecord a[], SortRecord temp[], int low, int mid, int high) {
    int i = low, j = mid + 1, p = low;
    while (i <= mid && j <= high) {
        if (a[i].key <= a[j].key) { temp[p++] = a[i++]; }
        else { temp[p++] = a[j++]; }
    }
    while (i <= mid) { temp[p++] = a[i++]; }
    while (j <= high) { temp[p++] = a[j++]; }
    for (int k = low; k <= high; ++k) { a[k] = temp[k]; }
}

void MergeSortRange(SortRecord a[], SortRecord temp[], int low, int high) {
    if (low >= high) { return; }
    int mid = low + (high - low) / 2;
    MergeSortRange(a, temp, low, mid);
    MergeSortRange(a, temp, mid + 1, high);
    MergeRanges(a, temp, low, mid, high);
}

bool MergeSort(SortRecord a[], int n) {
    if (n < 0 || (n > 0 && a == NULL)) { return false; }
    if (n <= 1) { return true; }
    if ((size_t)n > SIZE_MAX / sizeof(SortRecord)) { return false; }
    SortRecord *temp = (SortRecord *)malloc((size_t)n * sizeof(SortRecord));
    if (temp == NULL) { return false; }
    MergeSortRange(a, temp, 0, n - 1);
    free(temp);
    return true;
}
```

一次 merge 包含左右剩余尾部，不能只写两段都有元素时的主循环。临时数组一次申请并复用；申请失败在排序开始前发生，原数组不变。

#### 两路归并的比较数、趟数与复杂度

合并长度 p、q 的两个非空段，key 比较最少 min(p,q)，最多 p+q−1；余下的尾部不用再比较。复制 temp 与回填使本版一轮合并移动 2(p+q) 次记录。

自底向上两路归并的段长 1、2、4、…，n≥1 时需要 ⌈log₂n⌉ 趟，最后一段不够两段时直接保留。自顶向下代码按递归执行，不能把某时刻数组机械解释为统一完整趟。

```text
输入：    [7,2,6,3,5,1,4]
长度1并： [2,7 | 3,6 | 1,5 | 4]
长度2并： [2,3,6,7 | 1,4,5]
长度4并： [1,2,3,4,5,6,7]
```

本版无跳过优化，最好/平均/最坏 Θ(n log n)，临时数组 O(n) 加递归栈 O(log n)，总辅助 O(n)，稳定。若增加“两段边界已有序就跳过归并”可改善最好情况，但那是优化版本。

链式归并可重新连接 next，省去数组临时存储；递归版仍有栈。迭代链表归并可做到 O(1) 额外链接工作空间，不能把“数组归并必须 O(n)”误认为一切存储实现都同样。

#### 自底向上的归并函数

```cpp
bool MergeSortBottomUp(SortRecord a[], int n) {
    if (n < 0 || (n > 0 && a == NULL)) { return false; }
    if (n <= 1) { return true; }
    if ((size_t)n > SIZE_MAX / sizeof(SortRecord)) { return false; }
    SortRecord *temp = (SortRecord *)malloc((size_t)n * sizeof(SortRecord));
    if (temp == NULL) { return false; }
    int width = 1;
    while (width < n) {
        int low = 0;
        while (low < n) {
            int leftLength = n - low < width ? n - low : width;
            int middle = low + leftLength;
            int rightLength = n - middle < width ? n - middle : width;
            int end = middle + rightLength;
            if (rightLength > 0) { MergeRanges(a, temp, low, middle - 1, end - 1); }
            low = end;
        }
        if (width > n / 2) { break; } // 下一趟无需执行，也防 width*2 溢出。
        width *= 2;
    }
    free(temp);
    return true;
}
```

此函数去掉递归栈，辅助仍为临时数组 O(n)；不能因为“非递归”就写成原地 O(1)。

### 8.5.2 基数排序

#### 数字关键字、LSD与MSD

将 key 看成 d 个“位”或子关键字，每位的可能值数称基数 radix=ρ。

- LSD：从最低位到最高位，逐位做稳定分配与收集。最后一趟高位成为主要顺序，同高位内部保留低位次序。
- MSD：从最高位开始分桶，再对每桶按下一位继续处理，直到桶只有一条记录或位已用完。不能只全表按高位排一次再全表按低位排一次，那会改变主次。
- 同基数同位数的非负整数，可在高位补 0；字符串等变长 key 需明确终止标记与字典序规则。

LSD 每位必须稳定。按桶号顺序收集，桶内按进入顺序保存（如队列尾插），不能头插后直接顺链取而颠倒。稳定计数分配也可以完成每位操作。

#### 十进制LSD函数与溢出边界

下面 key 必须非负，自动按最大 key 确定十进制位数；value 随记录移动。temp 大小 n，计数桶 10。

```cpp
bool RadixSortLSD(SortRecord a[], int n) {
    if (n < 0 || (n > 0 && a == NULL)) { return false; }
    int maximum = 0;
    for (int i = 0; i < n; ++i) {
        if (a[i].key < 0) { return false; }
        if (a[i].key > maximum) { maximum = a[i].key; }
    }
    if (n <= 1 || maximum == 0) { return true; }
    if ((size_t)n > SIZE_MAX / sizeof(SortRecord)) { return false; }
    SortRecord *temp = (SortRecord *)malloc((size_t)n * sizeof(SortRecord));
    if (temp == NULL) { return false; }
    int place = 1;
    while (true) {
        int end[10] = {0};
        for (int i = 0; i < n; ++i) { ++end[(a[i].key / place) % 10]; }
        for (int digit = 1; digit < 10; ++digit) { end[digit] += end[digit - 1]; }
        for (int i = n - 1; i >= 0; --i) {
            int digit = (a[i].key / place) % 10;
            temp[--end[digit]] = a[i]; // 从右到左放入桶的末端，保持稳定。
        }
        for (int i = 0; i < n; ++i) { a[i] = temp[i]; }
        if (place > maximum / 10) { break; }
        place *= 10; // 由上一判断保证不超过 maximum，不溢出 int。
    }
    free(temp);
    return true;
}
```

负数不能直接用本函数，取绝对值后再排也不等价于正常整数升序，还存在 INT_MIN 溢出。要支持有符号整数，应设计一致的映射或分组规则，不能把负余数当桶下标。

#### 基数逐位演算与复杂度

自拟输入 `[329,457,657,839,436,720,355]`，十进制 3 位：

```text
个位收集： [720,355,436,457,657,329,839]
十位收集： [720,329,436,839,355,457,657]
百位收集： [329,355,436,457,657,720,839]
```

每位分配遍历 n、整理 ρ 个桶或计数，总时间 O(d(n+ρ))；数组实现辅助 O(n+ρ)，稳定，通常不靠 key 间大小比较。d、ρ 都视为固定常数时才可简写 O(n)，不能把大位数或大基数忽略。

链式分配可移动链接避免完整数组复制，但需桶首尾指针及链接存储；若记录本来就带 next，新增桶空间为 O(ρ)，与本页数组实现 O(n+ρ) 的口径不同。

### 8.5.3 计数排序

#### 关键字范围、计数与稳定定位

已知整数 key 位于 `[minimum,maximum]`，范围宽度 R=maximum−minimum+1。先数每种 key 的记录数，再累积成各 key 在结果中占据的位置范围。

只“按计数重复输出 key”会丢失 value，也无法证明相等记录稳定。要排序完整记录，应给每条记录分配位置；本版从右往左遍历，递减该 key 的累积末端，保持相等记录次序。

#### 支持负关键字的稳定计数函数

本版范围由调用者给出，最多一百万个计数桶，防止复习例子中用极宽范围申请巨大空间。返回 false 包括输入范围不合法、记录越界或分配失败；验证与申请都在写回前，原数组不变。

```cpp
enum { MAX_COUNT_RANGE = 1000000 };

bool CountingSort(SortRecord a[], int n, int minimum, int maximum) {
    if (n < 0 || minimum > maximum || (n > 0 && a == NULL)) { return false; }
    long long range = (long long)maximum - minimum + 1;
    if (range > MAX_COUNT_RANGE) { return false; }
    for (int i = 0; i < n; ++i) {
        if (a[i].key < minimum || a[i].key > maximum) { return false; }
    }
    if (n <= 1) { return true; }
    if ((size_t)n > SIZE_MAX / sizeof(SortRecord)) { return false; }
    int R = (int)range;
    int *end = (int *)calloc((size_t)R, sizeof(int));
    SortRecord *temp = (SortRecord *)malloc((size_t)n * sizeof(SortRecord));
    if (end == NULL || temp == NULL) {
        free(end);
        free(temp);
        return false;
    }
    for (int i = 0; i < n; ++i) {
        int offset = (int)((long long)a[i].key - minimum);
        ++end[offset];
    }
    for (int i = 1; i < R; ++i) { end[i] += end[i - 1]; }
    for (int i = n - 1; i >= 0; --i) {
        int offset = (int)((long long)a[i].key - minimum);
        temp[--end[offset]] = a[i];
    }
    for (int i = 0; i < n; ++i) { a[i] = temp[i]; }
    free(end);
    free(temp);
    return true;
}
```

偏移用 `key-minimum`，允许负 key；差值先转宽整数，避免 INT_MAX−INT_MIN 的 int 溢出。累积计数最大为 n，不超过有效 int n 的范围。

#### 计数定位例子与适用范围

输入 `[(2,A),(-1,X),(2,B),(0,Y)]`，范围 −1～2：

```text
key：      -1  0  1  2
出现数：    1  1  0  2
累积末端：  1  2  2  4
```

从右到左：Y 放下标 1；B 放 3；X 放 0；A 放 2。结果 `X,Y,A,B`，同 key 的 A 在 B 前。

本版时间 O(n+R)，辅助 O(n+R)，稳定，不属于一般比较排序。若只排序纯整数而不带记录身份，可只按次数写回，用 O(R) 空间，但那不能作为“完整记录稳定排序”的同一个实现。

R 很大而 n 小时内存与清桶成本高，例如十条记录分布于十亿范围，计数不划算。重复很多但范围极宽也未必适合；要看**范围宽度**，不是只看不同 key 数量。

## 8.6 各种内部排序算法的比较及应用

### 8.6.1 内部排序算法的比较

#### 时间、空间与稳定性总表

下表对应本页主要实现；无特殊说明时采用常见教材分析条件，希尔不强行统一平均界。

| 算法 | 最好时间 | 平均时间 | 最坏时间 | 辅助空间 | 稳定性 |
|---|---|---|---|---|---|
| 直接插入 | Θ(n) | Θ(n²) | Θ(n²) | O(1) | 稳定 |
| 折半插入（不跳过有序项） | Θ(n log n) | Θ(n²) | Θ(n²) | O(1) | 稳定 |
| 希尔（本页折半增量） | Θ(n log n) | 随输入/增量分析 | O(n²) | O(1) | 不稳定 |
| 冒泡（带无交换停止） | Θ(n) | Θ(n²) | Θ(n²) | O(1) | 稳定 |
| 快速（朴素二路递归） | Θ(n log n) | 期望 Θ(n log n) | Θ(n²) | 通常 O(log n)，最坏 O(n) 栈 | 不稳定 |
| 简单选择（交换） | Θ(n²) | Θ(n²) | Θ(n²) | O(1) | 不稳定 |
| 堆排序 | 教材通常列 O(n log n)，见实现条件 | Θ(n log n) | Θ(n log n) | O(1) | 不稳定 |
| 两路归并（本页未跳过 merge） | Θ(n log n) | Θ(n log n) | Θ(n log n) | O(n) | 稳定 |
| LSD 基数（给定 d 位、基数ρ） | O(d(n+ρ)) | O(d(n+ρ)) | O(d(n+ρ)) | O(n+ρ) | 稳定分配时稳定 |
| 稳定计数（范围宽度R） | O(n+R) | O(n+R) | O(n+R) | O(n+R) | 稳定 |

堆排序一行是常见教材上界；本页下滤遇全相等可提前停，总体 Θ(n)，不影响最坏 n log n 保证。快速平均界假设常见随机模型；基数与计数复杂度保留 key 结构参数。n≤1 的特例不用套 log 表式。

**稳定四类优先记：**插入（直接/稳定折半）、冒泡、稳定归并、稳定分配（基数/计数）。**典型不稳定四类：**希尔、快速、简单选择交换版、堆。

#### 一趟能说明什么与算法识别

| 观察 | 可以联想 | 不能轻率推出 |
|---|---|---|
| 前缀暂时有序，后段仍任意 | 插入 | 前缀记录的最终位置已固定 |
| 一个最值到末尾，末尾若干最大记录有序 | 左到右冒泡、堆排序 | 仅凭结果一定能区分两者 |
| 前端最小记录依次固定 | 简单选择、反向冒泡 | 所有前缀有序过程都属于选择 |
| 某枢轴左右满足大小分界 | 快速划分 | 左右子区间内部已经有序 |
| 若干等长有序段，逐趟段长翻倍 | 自底向上两路归并 | 所有递归归并的中间状态都整齐分段 |
| 下标同余的组分别有序 | 希尔 | 全表已按 gap 连续片段有序 |
| 按个位、十位等分配收集 | LSD 基数 | 只看到一趟最终形态就能证明稳定 |

给一个中间序列时，多种算法可能都产生它；应利用**比较/扫描方向、每趟定义、所固定位置、堆结构、枢轴选择**判断，不能只记某个演示数组。

#### 精确次数与复杂度的区别

- O(n²) 不能直接代替“比较 n(n−1)/2 次”；冒泡提前停会减少次数，简单选择的比较次数却固定。
- 交换次数不等于赋值次数；一次 SwapRecord 使用 3 次完整记录赋值。
- 快速的一趟是一次区间划分；希尔的一趟是一个 gap；归并的一趟是全表同级段归并；外部的一趟通常是整个数据的一轮读写。四种“趟”不能混计。
- 基数/计数主要操作是取位、计数、定位与搬移，不能因为“不做 key 比较”就说时间为 0。
- 比较次数少不一定实际更快，移动大记录、随机访存或磁盘访问可能更贵。

### 8.6.2 内部排序算法的应用

#### 按输入、稳定性与空间选择

| 需求 | 常见选择 | 理由与限制 |
|---|---|---|
| n 小或逆序对少 | 直接插入 | 实现简单，O(n+I)，稳定；大量逆序时平方 |
| 只想减少有序前缀定位比较 | 折半插入 | 定位快，记录搬移仍可能平方 |
| 原地、一般数组、通常追求快 | 快速 | 平均较好；不稳定，需处理退化与栈 |
| 必须保证最坏 n log n 且额外空间小 | 堆排序 | O(1) 额外空间，最坏保证；不稳定 |
| 必须稳定且允许临时数组 | 归并 | 确定 n log n 上界，便于顺序访问 |
| 普通链表 | 链式归并 | 不依赖随机下标，可重连链接 |
| 整数范围 R 与 n 相当或更小 | 稳定计数 | O(n+R)，范围极宽不合适 |
| 可拆成少量位的 key | LSD 基数 | O(d(n+ρ))，需稳定分配和合法位编码 |
| 记录很大、移动成本高 | 间接排序 | 排下标/指针，最后按排列访问或重排记录 |
| 多字段主次排序 | 稳定多趟或组合比较 | 稳定多趟先次后主；组合比较直接表达优先级 |

若同时要求“稳定、最坏 O(n log n)、严格 O(1) 额外空间”，本章常规数组实现没有一种直接满足；不要随意把快速或堆改称稳定，也不要把归并临时数组漏掉。

#### 间接排序与排序后的查重函数

间接排序先排索引，避免频繁搬移大记录。下面以稳定插入排序索引为例，只改变 index，不改变原 a；后续可按 index 顺序读取。复杂度仍是插入的 O(n²)，这里只展示减少搬移的思路。

```cpp
void StableIndexSort(const SortRecord a[], int index[], int n) {
    for (int i = 0; i < n; ++i) { index[i] = i; }
    for (int i = 1; i < n; ++i) {
        int temp = index[i];
        int j = i - 1;
        while (j >= 0 && a[index[j]].key > a[temp].key) {
            index[j + 1] = index[j];
            --j;
        }
        index[j + 1] = temp;
    }
}

// a 已非递减；每个 key 只保留第一条记录，返回新有效长度。
int UniqueSorted(SortRecord a[], int n) {
    if (n <= 0) { return 0; }
    int written = 1;
    for (int i = 1; i < n; ++i) {
        if (a[i].key != a[written - 1].key) { a[written++] = a[i]; }
    }
    return written;
}
```

UniqueSorted 的“第一条”是排序结果中的第一条；若想保留**原输入最早记录**，前置排序应稳定或明确把原编号作为次关键字。去重只缩短有效长度，不自动释放数组容量。

#### TopK与第k小：排序之外的选择

只要第 t 小或前 t 大，不一定全表排序：

- 大小为 t 的小根堆维护前 t 大，扫描 n 条记录，时间 O(n log t)，空间 O(t)；最终这 t 条若要有序还需再排。
- 快速选择只进入包含目标排名的一侧，随机模型期望 O(n)，不良划分最坏 O(n²)。
- 选择操作找到排名位置后，左右两侧不一定有序；重复 key 按记录个数计排名。

以下使用零基 rank；rank=0 为最小，rank=n−1 为最大。函数会修改原数组，失败返回 false。

```cpp
bool QuickSelect(SortRecord a[], int n, int rank, SortRecord *out) {
    if (n <= 0 || rank < 0 || rank >= n || a == NULL || out == NULL) { return false; }
    int low = 0, high = n - 1;
    while (low <= high) {
        int p = PartitionHole(a, low, high);
        if (p == rank) { *out = a[p]; return true; }
        if (p < rank) { low = p + 1; }
        else { high = p - 1; }
    }
    return false;
}
```

本函数首枢轴策略并未随机化，“期望线性”需输入随机模型；不能认为这段代码对任意输入都线性。out 不要覆盖仍需使用的 a 中槽位。

## 8.7 外部排序

### 8.7.1 外部排序的基本概念

#### 归并段、块I/O与内存容量

外部排序的文件无法整体驻留内存。常见处理先生成若干**初始归并段（run）**，每个段内部已经有序；再反复归并这些段，直到得到一个有序文件。

归并段是逻辑有序序列，不等于一个磁盘块。一个段可跨很多块；一个块也可能在具体布局中包含段边界。内存里只需驻留各段的当前缓冲块和少量工作数据。

总时间可分为 CPU 选择/比较时间、外存块读写时间与其他开销。数据量大时通常优先减少**完整读写轮数**和实际搬运量，同时使用顺序 I/O、缓冲和重叠读写。

#### 统一变量与总读写模型

| 符号 | 意义 | 单位 |
|---|---|---|
| N | 文件实际记录数 | 记录 |
| w | 初始段生成时可保留的工作记录数 | 记录 |
| D | 文件块数 | 磁盘块 |
| b | 可供本次归并分配的缓冲块数 | 内存块 |
| k | 每组同时参与归并的路数 | 段 |
| r | 初始归并段数 | 段 |
| s | 初始段生成后所需归并趟数 | 趟 |

在每趟都读写全部 D 块、记录格式不变、忽略段边界块碎片和缓存等简化模型中：

$$s=\lceil\log_k r\rceil\quad(r\ge1,k\ge2)$$

$$\text{块传输次数}=2D(1+s)$$

其中 1 是生成初始段：读原文件 D 块、写初始段 D 块；每个归并趟再读 D、写 D。若题目明确**不计初始段生成、最后输出写入或驻留缓存**，必须相应减掉；若小段跨块导致填充，要按实际块数求和。空文件直接 0，r=1 时 s=0，但仍可能需要初始段生成读写。

> [!warning] 一个“读写”还是两次传输
> 读一块、写一块是两次块传输。教材或题目说“读写一遍”可能表示一对，需要看定义，不能把 2D 与 D 混用。

### 8.7.2 外部排序的方法

#### 初始段生成与逐趟归并

最简单生成法：每次读至多 w 条记录，内部排序后写成一个有序段。固定长度块式生成的段数 r=⌈N/w⌉，最后一段可能较短。

随后每组取至多 k 个有序段归并，段数由 r 变为 ⌈r/k⌉，直到 1。段数不整除时，末组可少于 k 路；若只有一段也可直接沿用，实际复制策略会影响精确 I/O，前述全量模型假设每趟都统一读写。

示例 N=1000、w=100，r=10；

```text
二路： 10 → 5 → 3 → 2 → 1，4 个归并趟。
三路： 10 → 4 → 2 → 1，3 个归并趟。
五路： 10 → 2 → 1，2 个归并趟。
```

如果 D=100、五路且采用全量模型，总传输 2×100×(1+2)=600 次；若只计归并则 400 次。w 是记录容量，D 是块数，不能用这两个 100 之间的数值相同代替单位换算。

#### 归并趟数的整数计算函数

避免用浮点 log 后 ceil 在整数幂附近引起误差，直接反复向上整除。

```cpp
int MergePassCount(int runs, int ways) {
    if (runs < 0 || ways < 2) { return -1; }
    int passes = 0;
    while (runs > 1) {
        runs = runs / ways + (runs % ways != 0);
        ++passes;
    }
    return passes; // 0、1 个段都无需归并。
}

bool EstimateBlockTransfers(long long blocks, int runs, int ways, long long *out) {
    if (out == NULL || blocks < 0 || runs < 0 || ways < 2) { return false; }
    if ((blocks == 0) != (runs == 0)) { return false; }
    int passes = MergePassCount(runs, ways);
    long long factor = 2LL * (passes + 1);
    if (blocks > LLONG_MAX / factor) { return false; }
    *out = blocks * factor;
    return true;
}
```

此函数计算简化模型，不预测实际磁盘耗时，也不考虑记录压缩、段填充或缓存命中。

#### 减少趟数的两条途径

1. **增加归并路数 k**：相同 r 下，⌈logₖr⌉ 通常更小；但需要更多输入缓冲和更高效的最小值选择。
2. **减少初始段数 r**：增加内存 w，或用置换选择产生超过 w 的段；也需遵守内存预算。

k 与 r 改变后趟数未必立刻减少，ceil 有台阶。例如 k=4，r 从 10 减到 8，仍是 2 趟；减到 4 才是 1 趟。

### 8.7.3 多路平衡归并与败者树

#### 多路归并、缓冲与比较成本

k 路归并每次从 k 个段的当前首记录中取最小，输出后**只从获胜段补读下一条**。每段本身有序，这是只比较当前首记录即可保证全局正确的前提。

若简单遍历 k 个首记录找最小，每次最多 k−1 次比较，处理 N 条记录约 O(Nk)。使用堆或败者树，每次更新 O(log k)，总 O(N log k) 加建树成本。

一块输入缓冲配每段、一块输出缓冲，则至少 k+1 块，k≤b−1；采用每路和输出的双缓冲时通常需要 2(k+1) 块，另有树与记录元数据。k 不能无限增大。

“多路平衡归并”是按轮次把段组成若干组、均衡归并；不是 AVL 的平衡，也不保证所有段等长。增加 k 可减少磁盘读写趟数，却不能把取最小值所需比较完全忽略。

#### 败者树的比赛、根外冠军与重放

把 k 个当前首记录视为选手，按完全比赛树两两比较：较小者胜，较大者败。**内部结点存败者的选手编号，最终冠军另存在 winner 中。**不是把每个内部结点都存最小者，那是胜者树。

```text
四路首记录：  3(路0)   7(路1)   2(路2)   6(路3)
第一轮败者：       路1              路3
决赛败者：                路0
另存冠军：                路2，key=2
```

输出 2 后路 2 补读 9：9 与该路径保存的路 3 的 6 比，6 获胜；6 再与决赛败者路 0 的 3 比，3 获胜。新冠军路 0。路 1 的 7 不需要重新全局扫描。

k=2^h 时一条更新路径 h=log₂k 次比赛；任意 k 可以补到 2 的幂，最长 ⌈log₂k⌉。初始完整比赛建树 O(k)，不是对每个新输出记录重新建树。

#### 败者树表示、建树与冠军更新函数

下面支持至多 32 路。补齐的虚拟路与读完的真实路都用 `active=false`，视为大于有效记录；**不占用 INT_MAX 作为“无穷”**，所以 key=INT_MAX 仍可正常排序。

相等 key 时选较小路号，保证不同输入段的固定优先级；同段内部按读入次序输出。若各段对应原序列连续区间、路号按区间先后排列，可保留跨段的稳定性；任意重新分组时，应附原编号来保证全局稳定。

```cpp
enum { MAX_MERGE_WAYS = 32 };

typedef struct {
    SortRecord record;
    bool active;
} MergePlayer;

typedef struct {
    int ways;
    int base; // >=ways 的最小 2 的幂。
    int winner;
    int loser[MAX_MERGE_WAYS]; // 有效内部位置 1..base-1。
    MergePlayer player[MAX_MERGE_WAYS];
} LoserTree;

bool LTBetter(const LoserTree *T, int a, int b) {
    if (T->player[a].active != T->player[b].active) { return T->player[a].active; }
    if (!T->player[a].active) { return a < b; }
    if (T->player[a].record.key != T->player[b].record.key) {
        return T->player[a].record.key < T->player[b].record.key;
    }
    return a < b;
}

// first[0..ways-1] 存各路首记录与是否非空；空路 record 不参与比较。
bool BuildLoserTree(LoserTree *T, const MergePlayer first[], int ways) {
    if (ways < 1 || ways > MAX_MERGE_WAYS || T == NULL || first == NULL) { return false; }
    T->ways = ways;
    T->base = 1;
    while (T->base < ways) { T->base *= 2; }
    int winnerAt[2 * MAX_MERGE_WAYS]; // 仅在初始建树时使用。
    for (int i = 0; i < T->base; ++i) {
        T->player[i].active = false;
        T->player[i].record.key = T->player[i].record.value = 0;
        if (i < ways && first[i].active) { T->player[i] = first[i]; }
        winnerAt[T->base + i] = i;
    }
    for (int p = T->base - 1; p >= 1; --p) {
        int a = winnerAt[2 * p], b = winnerAt[2 * p + 1];
        if (LTBetter(T, a, b)) { winnerAt[p] = a; T->loser[p] = b; }
        else { winnerAt[p] = b; T->loser[p] = a; }
    }
    T->winner = winnerAt[1]; // ways=1 时位置1本身就是叶。
    return true;
}

// 只能替换“刚刚输出的冠军”对应选手，其他路径的败者才仍然有效。
void ReplaceLoserWinner(LoserTree *T, MergePlayer next) {
    int current = T->winner;
    T->player[current].active = next.active;
    if (next.active) { T->player[current].record = next.record; }
    int p = (T->base + current) / 2;
    while (p >= 1) {
        int opponent = T->loser[p];
        if (LTBetter(T, opponent, current)) {
            T->loser[p] = current;
            current = opponent;
        }
        p /= 2;
    }
    T->winner = current;
}
```

Build 中暂用 winnerAt 从底向上产生败者数组，建成后不再保留胜者树。Replace 只重放原冠军路径；若任意改一个非冠军，再机械用此函数，可能破坏不变量。

#### 二进制记录读写与多文件归并函数

以下让每个 FILE 流表示一个已非递减的归并段，输出流写最终记录。调用者提前打开互不重叠的输入流与输出流（输入 `rb`、输出 `wb`），函数不打开、不关闭、不删除文件。

这是最小的文件归并实现，C 的 FILE 层可提供缓冲；真正按磁盘块优化时，还需为每路配置明确的块缓冲。**一条 fread 不等于一次磁盘块读取。**结构体直接二进制写入仅用于相同程序环境，不作为跨平台文件交换格式。

```cpp
// present=false 表示正常到达末尾；半条记录或 I/O 错误返回 false。
bool ReadSortRecord(FILE *input, SortRecord *out, bool *present) {
    *present = false;
    size_t got = fread(out, 1, sizeof(SortRecord), input);
    if (got == sizeof(SortRecord)) { *present = true; return true; }
    if (got == 0 && feof(input) && !ferror(input)) { return true; }
    return false;
}

bool WriteSortRecord(FILE *output, SortRecord r) {
    return fwrite(&r, sizeof(SortRecord), 1, output) == 1;
}

bool MergeRunFiles(FILE *input[], int ways, FILE *output) {
    if (ways < 1 || ways > MAX_MERGE_WAYS || input == NULL || output == NULL) {
        return false;
    }
    MergePlayer first[MAX_MERGE_WAYS];
    for (int i = 0; i < ways; ++i) {
        if (input[i] == NULL || input[i] == output) { return false; }
        for (int j = 0; j < i; ++j) {
            if (input[i] == input[j]) { return false; }
        }
    }
    for (int i = 0; i < ways; ++i) {
        first[i].record.key = first[i].record.value = 0;
        if (!ReadSortRecord(input[i], &first[i].record, &first[i].active)) { return false; }
    }
    LoserTree T;
    BuildLoserTree(&T, first, ways);
    while (T.player[T.winner].active) {
        int from = T.winner;
        if (!WriteSortRecord(output, T.player[from].record)) { return false; }
        MergePlayer next;
        next.record.key = next.record.value = 0;
        if (!ReadSortRecord(input[from], &next.record, &next.active)) { return false; }
        ReplaceLoserWinner(&T, next);
    }
    return fflush(output) == 0; // 输出缓冲真正提交时也可能出错。
}
```

调用者仍须确保不同流不是指向同一底层文件，以及每路已排序。失败时输入可能已推进、输出保留已写前缀，不保证回滚。内存工作区 O(k)，CPU 建树 O(k)、选择 O(N log k)（k=1 特例线性复制）；没有把 N 条记录全部读入内存。

#### 增加路数后的I/O与CPU关系

若初始段数 r，k 路归并约 s=⌈logₖr⌉ 趟，每趟用败者树选出 N 条记录，CPU 选择成本约 O(N·s·log₂k)。忽略向上取整时 logₖr·log₂k=log₂r，说明增加路数主要减少完整读写轮数，不能简单宣称 key 比较也按同一倍数减少。

实际缓冲大小、树建造、缓存、段长分布与最后不足 k 路的组都会改变精确开销。考研计算优先按题设模型，不能无限提高 k 而忽略 k+1 个缓冲的空间约束。

### 8.7.4 置换-选择排序（生成初始归并段）

#### 工作区、当前段与冻结记录

固定每 w 条记录内部排序，只能生成长度至多 w 的初始段。置换选择在输出一条记录后马上读入一条新的记录，利用腾出的槽继续延长当前段。

1. 先把至多 w 条记录放入工作区，标记属于当前段。
2. 在当前段的候选中取最小记录输出，记刚输出的 key 为 last。
3. 顺序读入下一条记录 x：若 x.key≥last，可以继续属于当前段；若 x.key<last，**冻结到下一段**，仍保存在工作区。
4. 当前段候选耗尽，关闭当前段，进入下一段，冻结记录成为新的候选。
5. 输入耗尽后继续输出工作区里的所有记录；工作区也为空才结束。

key 相等可留在当前段，因为目标是非递减。冻结记录占用内存，不能丢掉，也不能直接写入当前段破坏有序。

选择最小可用小根堆或败者树。把“所属段号”作为第一关键字、key 作为第二关键字，就能使当前段全部排在冻结段之前，不用每次扫描整个工作区。

#### 置换选择的逐步演算

w=3，输入 `[4,1,7,0,5,2,8,3,6]`。表中候选与冻结列表为了说明而按大小列出，不代表实际堆数组布局。

| 输出 | 新读入 | 当前段剩余候选 | 下一段冻结 | 解释 |
|---|---|---|---|---|
| 段0：1 | 0 | 4、7 | 0 | 0<1，冻结 |
| 段0：4 | 5 | 5、7 | 0 | 5≥4，继续当前段 |
| 段0：5 | 2 | 7 | 0、2 | 2<5，冻结 |
| 段0：7 | 8 | 8 | 0、2 | 8≥7，继续当前段 |
| 段0：8 | 3 | 无 | 0、2、3 | 3<8，冻结；段0结束 |
| 段1：0 | 6 | 2、3、6 | 无 | 冻结记录解冻，6≥0 |
| 段1：2 | 已到末尾 | 3、6 | 无 | 继续排空工作区 |
| 段1：3 | 已到末尾 | 6 | 无 | 继续输出 |
| 段1：6 | 已到末尾 | 无 | 无 | 完成 |

输出两个有序段：`[1,4,5,7,8]` 和 `[0,2,3,6]`，长度 5、4，均可超过 w=3。拼接后整个文件尚未有序，还需段间归并。

#### 带段号的小根堆与生成函数

下面是**数组演示函数**：输入 a 已在内存，out 按段先后保存输出，runOf 标出每条输出所属段；可用来手算冻结与段边界。它不是把整个外部文件读入内存的方案。真正外部实现把读 a 的步骤换成输入缓冲取记录，把写 out 的步骤换成当前段的输出缓冲；核心堆仍只保留 w 条记录。

out、runOf 容量至少 n，不能与 a 重叠。段号从 0 开始，order 为输入原下标，用于同段同 key 的稳定次序。

```cpp
typedef struct {
    SortRecord record;
    int run;
    int order;
} ReplacementEntry;

bool RSBefore(ReplacementEntry a, ReplacementEntry b) {
    if (a.run != b.run) { return a.run < b.run; }
    if (a.record.key != b.record.key) { return a.record.key < b.record.key; }
    return a.order < b.order;
}

void RSSiftDown(ReplacementEntry heap[], int n, int root) {
    ReplacementEntry temp = heap[root];
    int parent = root;
    while (parent < n / 2) {
        int child = 2 * parent + 1;
        if (child + 1 < n && RSBefore(heap[child + 1], heap[child])) { ++child; }
        if (!RSBefore(heap[child], temp)) { break; }
        heap[parent] = heap[child];
        parent = child;
    }
    heap[parent] = temp;
}

bool GenerateReplacementRuns(const SortRecord a[], int n, int workCapacity,
                             SortRecord out[], int runOf[], int capacity,
                             int *runCount) {
    if (runCount == NULL) { return false; }
    *runCount = 0;
    if (n < 0 || workCapacity < 1 || capacity < n ||
        (n > 0 && (a == NULL || out == NULL || runOf == NULL))) { return false; }
    if (n == 0) { return true; }
    int size = n < workCapacity ? n : workCapacity;
    if ((size_t)size > SIZE_MAX / sizeof(ReplacementEntry)) { return false; }
    ReplacementEntry *heap = (ReplacementEntry *)malloc((size_t)size * sizeof(ReplacementEntry));
    if (heap == NULL) { return false; }
    for (int i = 0; i < size; ++i) {
        heap[i].record = a[i];
        heap[i].run = 0;
        heap[i].order = i;
    }
    for (int i = size / 2 - 1; i >= 0; --i) { RSSiftDown(heap, size, i); }
    int read = size, written = 0, lastRun = 0;
    while (size > 0) {
        ReplacementEntry winner = heap[0];
        out[written] = winner.record;
        runOf[written++] = winner.run;
        lastRun = winner.run;
        if (read < n) {
            ReplacementEntry next;
            next.record = a[read];
            next.order = read++;
            next.run = winner.run + (next.record.key < winner.record.key ? 1 : 0);
            heap[0] = next;
        } else {
            --size;
            if (size > 0) { heap[0] = heap[size]; }
        }
        if (size > 0) { RSSiftDown(heap, size, 0); }
    }
    *runCount = lastRun + 1;
    free(heap);
    return true;
}
```

优先按段号比较保证所有当前段候选先输出；新记录的段号相同或加 1。堆初始化 O(w)，每条记录更新 O(log w)（w=1 时按 O(1)），生成 CPU 总时间 O(N log(w+1))，堆工作空间 O(w)。数组演示另有调用者提供的 N 条输入与输出，不应说整个演示占用仅 O(w) 总内存。

#### 初始段长度的最好、最坏与平均

- 已非递减：新记录都可进入当前段，可能整个文件只生成一个段，长度 N。
- 严格递减：新记录通常冻结，下一个段重新开始；各完整段约 w 条，末段可能不足 w。
- 大量随机输入、常见独立连续 key 模型：平均段长趋近约 2w，是统计结论，不是每段精确长度，也不是任意小样本都满足。

因此初始段不等长，不能再无条件用 `r=ceil(N/w)`；知道实际生成段数才能计算精确归并趟数。更长段通常有利，但减少 r 未必跨过 log 向上取整的门槛，也不必然减少一趟。

### 8.7.5 最佳归并树

#### 不等长段、加权路径长度与读写量

初始段长度不同，合并次序会改变同一记录被反复读写的次数。归并树：叶对应初始段，叶权 wᵢ 为该段长度；内部结点对应一次归并，权为孩子权之和；叶到根的边数 dᵢ 等于该段记录参与归并次数。

$$WPL=\sum_i w_i d_i=\sum_{\text{内部结点 }v}w(v)$$

若权的单位是记录，WPL 是归并期间所有“读入量”总和，也等于写出量总和；读+写是 **2WPL**。若权是块，且忽略块碎片/重编码等，也同样按块理解。生成初始段的读写另计，不包含在该 WPL 中。

最少归并趟数与最小总搬运量不是同一目标。**最佳归并树按段权最小化加权总搬运量**；长段应尽量少参与归并，短段可更深。不能只追求树高度最小就认定 WPL 最优。

#### 二路与k路Huffman构造及补虚段

二路最佳归并树等同 Huffman：反复取当前最短的两段合并，把新长度放回集合，直到剩一段。k 路则每次合并 k 个最短段，但需满足满 k 叉树的叶数条件：

$$r'\equiv1\pmod{k-1}$$

真实段 r≥2 时，补 q 个长度 0 的虚段：

$$q=\big((k-1)-((r-1)\bmod(k-1))\big)\bmod(k-1)$$

补后 r'=r+q，0≤q≤k−2；内部结点数 (r'−1)/(k−1)。r=0、1 单独处理，无需归并或补虚段。二路 k=2 永远 q=0。

虚段不产生真实记录 I/O，只帮助满足 k 叉结构。由于权为 0，构造时会优先与短段一起合并。也可理解为第一组只归并 k−q 个真实段，后面按 k 路合并。

> [!warning] 不要把虚段放到任意末组
> 不等长最佳归并的初始不足 k 路组应按权与虚段处理；“最后一组随便少几路”属于另一种轮次归并安排，未必达到最小 WPL。

题目若限制只能归并原序列相邻的段、固定物理安排或严格按整轮平衡归并，普通 Huffman 自由选择模型未必适用。应先看允许的合并规则。全局稳定性也须随段次序或原编号维护。

#### 二路最短先并的例子

段长 3、4、5、20：

```text
3+4=7；5+7=12；12+20=32。
WPL=7+12+32=51；归并读写量=102。
```

对应深度：3、4 深度 3，5 深度 2，20 深度 1；3×3+4×3+5×2+20×1=51。

按两组同时归并成平衡树 `(3+4)` 和 `(5+20)`，然后再并：WPL=7+25+32=64，读写=128。虽然平衡树只需两层，而 Huffman 的部分短段三层，后者总搬运量更少。

#### 三路补虚段的完整例子

真实段长 2、3、4、7、8、12，r=6、k=3，r−1=5 不能被 2 整除，q=1。补 0：

```text
0+2+3=5
4+5+7=16
8+12+16=36
WPL=5+16+36=57
归并读写量=114
```

| 真实段长 | 叶深度 | 权×深度 |
|---|---|---|
| 2 | 3 | 6 |
| 3 | 3 | 9 |
| 4 | 2 | 8 |
| 7 | 2 | 14 |
| 8 | 1 | 8 |
| 12 | 1 | 12 |

合计 57，虚段 0×3=0。第一轮实质只读两条真实段（2、3），不是读一个有真实长度的“额外文件”。

#### 最佳归并树的结点与构造函数

下面最多 128 个真实段、2～32 路，权使用非负 long long。每次扫描当前未合并根，选 k 个最小者；用 parent 标记已纳入新结点，并保存 child，能还原树形与每次归并。

这是便于复习的 O(r²) 选小版本；使用最小堆可改善为 O(r log r) 的数量级。本函数构造计划和 WPL，不读写实际归并文件。

```cpp
enum {
    MAX_INITIAL_RUNS = 128,
    MAX_MERGE_NODES = 2 * (MAX_INITIAL_RUNS + MAX_MERGE_WAYS)
};

typedef struct {
    long long weight;
    int parent;
    int childCount;
    int child[MAX_MERGE_WAYS];
    int originalRun; // >=0 真实初始段号；-1 虚叶；-2 内部结点。
} MergePlanNode;

typedef struct {
    int count;
    int leaves;
    int dummyRuns;
    int root;
    long long wpl;
    MergePlanNode node[MAX_MERGE_NODES];
} MergePlan;

void InitMergePlanNode(MergePlanNode *p, long long weight, int originalRun) {
    p->weight = weight;
    p->parent = -1;
    p->childCount = 0;
    p->originalRun = originalRun;
    for (int i = 0; i < MAX_MERGE_WAYS; ++i) { p->child[i] = -1; }
}

bool BuildOptimalMergePlan(const long long length[], int runs, int ways, MergePlan *T) {
    if (T == NULL || runs < 0 || runs > MAX_INITIAL_RUNS ||
        ways < 2 || ways > MAX_MERGE_WAYS || (runs > 0 && length == NULL)) {
        return false;
    }
    for (int i = 0; i < runs; ++i) {
        if (length[i] < 0) { return false; }
    }
    T->count = T->leaves = T->dummyRuns = 0;
    T->root = -1;
    T->wpl = 0;
    if (runs == 0) { return true; }
    int dummy = runs == 1 ? 0 :
        ((ways - 1) - (runs - 1) % (ways - 1)) % (ways - 1);
    T->dummyRuns = dummy;
    T->leaves = runs + dummy;
    for (int i = 0; i < runs; ++i) { InitMergePlanNode(&T->node[T->count++], length[i], i); }
    for (int i = 0; i < dummy; ++i) { InitMergePlanNode(&T->node[T->count++], 0, -1); }
    int active = T->leaves;
    while (active > 1) {
        if (T->count >= MAX_MERGE_NODES || active < ways) { return false; }
        int parent = T->count;
        InitMergePlanNode(&T->node[parent], 0, -2);
        long long sum = 0;
        for (int c = 0; c < ways; ++c) {
            int best = -1;
            for (int i = 0; i < parent; ++i) {
                if (T->node[i].parent == -1 &&
                    (best == -1 || T->node[i].weight < T->node[best].weight)) {
                    best = i;
                }
            }
            if (best == -1 || T->node[best].weight > LLONG_MAX - sum) { return false; }
            sum += T->node[best].weight;
            T->node[best].parent = parent;
            T->node[parent].child[c] = best;
        }
        if (sum > LLONG_MAX - T->wpl) { return false; }
        T->node[parent].weight = sum;
        T->node[parent].childCount = ways;
        T->wpl += sum;
        ++T->count;
        active -= ways - 1;
    }
    T->root = T->count - 1;
    return true;
}

int MergeLeafDepth(const MergePlan *T, int leaf) {
    if (leaf < 0 || leaf >= T->leaves) { return -1; }
    int depth = 0;
    while (T->node[leaf].parent != -1) {
        leaf = T->node[leaf].parent;
        ++depth;
    }
    return depth;
}

bool MergeReadWriteCost(const MergePlan *T, long long *out) {
    if (out == NULL || T->wpl > LLONG_MAX / 2) { return false; }
    *out = 2 * T->wpl;
    return true;
}
```

仅在 Build 返回 true 后使用计划；溢出失败时可能保留中间构造状态。内部合并权之和就是 WPL，不用再乘某个“归并趟数”。还要计初始段生成时，按相同单位另外加读写量。

#### 外部排序四项技术的作用区分

| 技术 | 改善对象 | 不应混淆 |
|---|---|---|
| 多路归并 | 相同初始段下减少完整归并趟数 | 受缓冲块预算限制 |
| 败者树 | 每输出记录选择最小首记录的 CPU 比较 | 本身不增加段长，也不直接改变 r 或 s |
| 置换选择 | 生成更长初始段、减少实际 r | 随机平均约 2w，不是最坏保证 |
| 最佳归并树 | 不等长段的归并次序与总搬运量 | 目标是最小 WPL，不是最小最大深度 |

四者可以组合：先置换选择生成不等长段，再按可用 k 选最佳合并计划，每次 k 路合并用败者树，配块缓冲执行读写。

## 本章综合回顾

### 排序条件与公式速查

| 项目 | 公式／规则 | 前提 |
|---|---|---|
| 直接插入右移 | 初始逆序对数 I | 严格大于时移动 |
| 直接插入时间 | O(n+I) | 本页移动插入 |
| 冒泡交换 | 初始逆序对数 I | 每次相邻逆序交换 |
| 简单选择比较 | n(n−1)/2 | 逐趟扫描全部未定后缀 |
| 自底向上建堆 | O(n) | 孩子先调整，再调整父 |
| 两非空段归并比较 | min(p,q)～p+q−1 | 标准首记录比较后取一条 |
| 两路归并趟数 | ⌈log₂n⌉ | 初始单记录段，自底向上 |
| 基数时间 | O(d(n+ρ)) | d 位，ρ 个桶，逐位分配收集 |
| 计数时间 | O(n+R) | 整数范围宽度 R |
| 固定内存批量初始段 | r=⌈N/w⌉ | 不使用置换选择 |
| k 路平衡归并趟数 | s=⌈logₖr⌉ | r≥1，k≥2，逐轮向上整除 |
| 全量块读写 | 2D(1+s) | 初始段生成和每趟均读写全文件 |
| 败者树更新 | O(log k) | 只替换刚输出的冠军 |
| 随机置换选择段长 | 约 2w | 统计模型、大量输入；不保证每段 |
| 归并树搬运量 | WPL=Σwᵢdᵢ=Σ内部权 | 归并读与写分别 WPL |
| 总归并读写 | 2WPL | 权与读写用相同单位，忽略碎片 |
| k 叉虚段数 | q=((k−1)−(r−1)%(k−1))%(k−1) | r≥2，q∈[0,k−2] |

### 稳定性与实现细节清单

- [ ] 记录交换完整，value/原编号不能与 key 脱离。
- [ ] 直接插入只移动严格大于的记录；稳定折半插入找首个严格大的位置。
- [ ] 冒泡只交换严格逆序；简单选择的远距离交换仍可不稳定。
- [ ] 归并相等时先左；LSD 每一位稳定分配；稳定计数倒序占累计末端。
- [ ] 希尔组内稳定不代表全局稳定；快速/堆用明确同 key 反例理解。
- [ ] 原输入无重复只能观察这次排列，不能证明算法稳定。
- [ ] 多字段稳定多趟先次后主；带原编号作次 key 是另一种显式排序规则。

### 复杂度、边界与外部排序清单

- [ ] 直接插入与带停止冒泡有序时可线性；折半插入仍可能大量移动。
- [ ] 希尔界依赖增量；本版折半 gap 最后必须 1。
- [ ] 快速划分后仅枢轴定位，两侧仍待排；最坏时间与最坏栈分别分析。
- [ ] 三路快排解决大量相等 key 的重复递归，不消除所有坏枢轴情况。
- [ ] 大根堆原地升序；有效堆长度不包含已经固定的末尾。
- [ ] 建堆线性与逐条 Push 建堆 n log n 是不同过程。
- [ ] 归并计临时数组和栈；迭代数组版仍需 O(n) 临时空间。
- [ ] 计数看范围宽度 R；基数看 d 与ρ；不能对任意 key 宣称线性。
- [ ] key 范围、负取模、桶下标、倍增溢出、容量和申请失败都明确。
- [ ] 外部记录数、块数与缓冲数单位一致；读与写分开数。
- [ ] k 路要至少 k 个输入缓冲和 1 个输出缓冲，双缓冲另算。
- [ ] 败者树内部存败者，冠军另存；只更新冠军所在路径。
- [ ] 置换选择输出后才补新记录；小于 last 冻结，大于或等于可延续。
- [ ] 随机平均段长不是每段长度，不能据 2w 算任意输入的精确 r。
- [ ] 最佳归并先补零权虚叶；最小 WPL 与最少趟数区分。
- [ ] 本章文件归并函数只处理一次多路合并；完整外排还须段生成、计划和文件管理。

### 典型复习小题与解释

以下为自拟回顾题，不对应教材试题精选或官方解析。

1. **相等记录从未直接互换，算法就一定稳定吗？**不一定。希尔、简单选择、堆都可通过与第三条记录远距离交换，使相等记录间接逆序。
2. **折半插入为什么没有降到 n log n 总时间？**比较定位变快，但每次插到前面仍需搬移较长后缀，最坏累计 n(n−1)/2 次右移。
3. **有 n−1 个逆序对的数组，冒泡就一定线性吗？**不一定。左到右冒泡遇 `[2,3,...,n,1]`，小值每趟向左仅一步，比较仍平方；插入却可 O(n+I)。
4. **快排第一次划分后 pivot 左侧是否都排好？**没有，只满足不大于 pivot；右侧类似，仍须继续排序。
5. **只递归短侧之后快排最坏时间变了吗？**不一定，仍可 n²；改进的是最坏栈深，降到 O(log n)。
6. **为什么升序堆排序通常建大根堆？**把最大值交换到有效堆末尾，逐步固定从右往左的最大后缀；小根堆用相同末尾交换得到降序。
7. **计数排序为何能处理负 key？**用 key−minimum 当桶偏移即可；差值要用足够宽整数，范围过大仍不适合。
8. **归并两段时用 `<`，相等走右，会怎样？**完整序列仍可有序，但相等 key 可能让右段原本较晚的记录先输出，破坏稳定性。
9. **败者树为什么只补读一条输入路？**只有冠军路输出了一条，其他路首记录未消费；补所有路会跳过记录。
10. **置换选择内存只有 w，为何段可超过 w？**每输出一条就腾槽补新记录，可延续当前段；长度不是同时驻留容量。
11. **6 段做 3 路最佳归并要补多少虚段？**q=1，使 7 个叶满足 (7−1)%2=0；虚段权 0，不产生真实 I/O。
12. **Huffman 树更深是否说明外排更慢？**不能只看最大深度；加权总搬运量取决于段长×深度，长段浅、短段深可能减少 WPL。

### 使用说明与参考

本页按用户给定目录独立整理，包含计数排序与全部外部排序小节；没有提供教材书页全文，因此不声称复刻全部题目、逐字表述或官方答案。精确计数与中间状态均注明采用的实现。

- [电子工业出版社：2027 数据结构考研复习指导](https://wap.phei.com.cn/module/goods/wssd_content.jsp?bookid=68851)：书目与章节目录参考。
- [Virginia Tech OpenDSA：External Sorting](https://opendsa-server.cs.vt.edu/ODSA/Books/CS3/html/ExternalSort.html)：外部排序、缓冲与初始段生成的延伸阅读。
- [Bender 等：Run Generation Revisited](https://www3.cs.stonybrook.edu/~bender/newpub/2015-BenderMcMc-ISAAC-run-generation.pdf)：置换选择与随机输入平均段长的研究背景。

返回 [[B00-排序导航|第8章导航]]。
