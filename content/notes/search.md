# 第7章 查找

> 面向 408 复习，按王道 2027 版及用户提供的知识目录组织。说明、例子与代码为独立整理，不摘录教材习题和答案。
>
> [[B00-查找导航|返回本章导航]]

## 本章约定与代码使用

- 数组下标默认从 **0** 开始；常规数组查找失败返回 -1，不把合法下标 0 当失败。带哨兵的顺序查找采用 1 基有效区、失败返回 0；树查找失败返回 NULL。各接口分别说明。
- 记录含整数 key 和整数 value；key 决定位置，value 是随记录保存的数据。树与散列表采用唯一关键字，重复插入失败；静态数组若有重复，接口会说明返回哪一个。
- 修改 value 不改变结构；修改 key 可能破坏顺序、树结构或散列地址，通常按“插入新关键字成功后删除旧关键字”处理，而不是直接覆盖 key。
- ASL 按一次记录/结点的关键字判定为一次比较；它可以是三路判定，不逐条数代码中 `<`、`==` 的机器运算。若题目指定逐语句计数，以题目为准。
- 散列开放定址的“探测次数”包含访问空槽；链地址例子的“关键字比较次数”只数链中实际记录。两个计数口径会分别标明。
- 空二叉树高度 0，单结点高度 1；B 树高度只数带关键字的层，不数外部 NULL 失败结点。红黑树的 NIL 为黑色哨兵，不是数据记录。
- 代码只用结构体、数组、指针、函数和 malloc/free，不使用 STL、类或模板，全部保留在 Markdown 中。
- 动态树使用前根指针置为 NULL；红黑树使用专用初始化。对象、数组与输出指针要求有效，动态对象重建前先释放旧资源。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

enum { MAX_SEARCH_RECORDS = 1024 };

typedef struct {
    int key;
    int value;
} SearchRecord;

int CompareKeys(int a, int b) {
    if (a < b) { return -1; }
    if (a > b) { return 1; }
    return 0;
}
```

## 7.1 查找的基本概念

### 查找表、关键字与查找结果

查找表是由同一类型记录组成的集合，查找是在其中寻找关键字满足条件的记录。

- 主关键字可以唯一标识记录，次关键字可能对应多条记录。
- 查找成功：找到匹配记录；查找失败：确认表中没有目标记录。
- 查找表可以采用数组、链表、树、散列表等组织，逻辑集合不必按关键字排序。
- 接口可返回下标、结点地址、记录或状态，必须明确失败值及重复值规则。

### 静态查找表与动态查找表

静态查找主要查询，表结构建立后基本不变；动态查找同时支持插入和删除。顺序有序数组查询快，但维护有序性要移动元素；平衡树和散列表适合频繁改变集合。

“动态”不等于“必须链式存储”；“静态”也不等于“只能无序数组”。选择时同时考虑查找、修改、空间、是否需要范围查询及数据规模。

### 平均查找长度ASL与概率条件

$$
ASL=\sum_{i=1}^{n}p_i C_i,\qquad \sum p_i=1
$$

p_i 是第 i 种查找情况的概率，C_i 是该情况下关键字比较或指定探测的次数。

- 成功 ASL 与失败 ASL 分别计算，概率分别归一化。
- 若成功概率为 q，总体期望可写 `q×ASL成功+(1-q)×ASL失败`。
- “等概率”要明确是记录等概率、失败间隙等概率，还是散列初始地址等概率。
- ASL 数值不等于时间复杂度；同为 O(log n) 的树，不同形状、概率和常数可有不同 ASL。

**例：** 三条记录比较次数 1、2、3，概率 0.6、0.3、0.1，ASL=1.5；不能用等概率平均值 2 替换。

## 7.2 顺序查找和折半查找

### 7.2.1 顺序查找

#### 无序表的逐项查找

```cpp
// 返回从前向后第一个匹配下标；n=0 时返回 -1。
int SequentialSearch(const SearchRecord a[], int n, int key) {
    if (n < 0 || (n > 0 && a == NULL)) { return -1; }
    for (int i = 0; i < n; ++i) {
        if (a[i].key == key) { return i; }
    }
    return -1;
}
```

数组和链表都能顺序查找，不要求有序。成功最多比较 n 次，失败比较 n 次，辅助空间 O(1)。若成功等概率：

$$
ASL_{成功}=\frac{1+2+\cdots+n}{n}=\frac{n+1}{2}
$$

高频记录放在更早检查的位置可降低加权 ASL，但需要查找概率信息，不是无条件按关键字排序即可改善。

#### 哨兵查找与失败比较次数

```cpp
// 有效记录 a[1..n]，a[0] 专用于哨兵；容量至少 n+1。
// 返回 1..n 的匹配位置，0 表示失败；从后向前找。
int SequentialSentinel(SearchRecord a[], int n, int key) {
    if (a == NULL || n < 0) { return 0; }
    a[0].key = key;
    int i = n;
    while (a[i].key != key) { --i; }
    return i;
}
```

哨兵省去每轮边界判定，仍为 O(n)。等概率成功 ASL 仍为 (n+1)/2；**失败时若把哨兵的关键字比较也计入，是 n+1 次**，不是前面无哨兵版本的 n 次。此函数修改 a[0]，真实记录不能占该位置。

#### 有序表的提前失败与ASL

升序表遇到第一个比目标大的关键字即可失败，不必继续扫描。

```cpp
int OrderedSequentialSearch(const SearchRecord a[], int n, int key) {
    if (n < 0 || (n > 0 && a == NULL)) { return -1; }
    for (int i = 0; i < n; ++i) {
        int cmp = CompareKeys(a[i].key, key);
        if (cmp == 0) { return i; }
        if (cmp > 0) { return -1; }
    }
    return -1;
}
```

若 n 个不同关键字等概率成功，ASL 成功仍为 (n+1)/2。若 n+1 个失败间隙等概率，比较次数依次为 1、2、…、n、n：

$$
ASL_{失败}=\frac{n(n+3)}{2(n+1)}\quad(n\ge1)
$$

最后两个失败间隙都需比较最后一项。不同失败概率不能直接使用此式。n=0 不比较记录，失败比较数为 0。

### 7.2.2 折半查找

#### 使用条件与闭区间写法

折半查找要求能高效随机访问，并且记录按比较关系有序；顺序存储升序表是典型场景。普通链表即使有序，找中点也要走链，不能直接获得数组版 O(log n) 的访问代价。

```cpp
// 升序数组；重复关键字时返回某一个匹配位置。
int BinarySearch(const SearchRecord a[], int n, int key) {
    if (n < 0 || (n > 0 && a == NULL)) { return -1; }
    int low = 0;
    int high = n - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        int cmp = CompareKeys(a[mid].key, key);
        if (cmp == 0) { return mid; }
        if (cmp < 0) { low = mid + 1; }
        else { high = mid - 1; }
    }
    return -1;
}
```

当前候选为闭区间 [low,high]，失配后 mid 已排除，所以更新必须 ±1；否则可能死循环。`low+(high-low)/2` 避免 low+high 溢出。

#### 首个匹配、下界与插入位置

```cpp
// 返回第一个 key>=target 的位置，无则返回 n；区间为 [low,high)。
int LowerBound(const SearchRecord a[], int n, int target) {
    int low = 0;
    int high = n;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (a[mid].key < target) { low = mid + 1; }
        else { high = mid; }
    }
    return low;
}

int BinarySearchFirst(const SearchRecord a[], int n, int key) {
    if (n < 0 || (n > 0 && a == NULL)) { return -1; }
    int i = LowerBound(a, n, key);
    return i < n && a[i].key == key ? i : -1;
}
```

LowerBound 以前提合法、升序输入为基础，返回 n 是合法插入位置而非数组可读下标。半开区间 high=mid 不需要减 1；不能混用闭区间终止条件。

#### 判定树、成功与失败ASL

折半过程构成判定树，根是第一次选中的中点，左右子树对应两个区间。内部结点表示成功记录，外部间隙表示失败；它符合二叉排序关系。

若记录在第 d 层，成功比较 d 次；若失败落在外部结点第 d 层，则比较 d-1 个真实记录。实际中点取下整还是上整可能改变具体树形，必须按代码画树。

**n=7、关键字 1..7：** 依次以 4、2/6、1/3/5/7 为三层。

$$
ASL_{成功}=\frac{1+2\times2+4\times3}{7}=\frac{17}{7}
$$

8 个失败间隙都在第四层外部位置，失败比较均为 3，ASL 失败=3。对 n=2^h-1 的满判定树：

$$
ASL_{成功}=\frac{(h-1)2^h+1}{2^h-1},\qquad ASL_{失败}=h
$$

一般 n 不能直接套满树式；应数各层记录及失败间隙。n≥1 的最大记录比较数为 ⌊log₂n⌋+1，迭代辅助空间 O(1)。维护数组有序的插删仍可能 O(n)。

### 7.2.3 分块查找

#### 块间有序、块内可无序与索引

分块查找又称索引顺序查找，把数据分成若干块：块内不要求排序，但前块所有关键字小于后块所有关键字。索引记录块最大关键字与块范围。

先定位第一个“块最大值≥目标”的块，再在该块顺序查找。仅仅各块最大值递增，不一定满足块间有序，要检查整块最小值也大于前块最大值。

例：数据 `[7,2,5 | 15,10,12 | 23,19,20]`，块最大值 `[7,15,23]`。找 12 定位第二块，扫描 15、10、12；找 8 也定位第二块，但扫描后失败。

#### 建立索引与分块查找函数

```cpp
typedef struct {
    int maxKey;
    int start;
    int length;
} BlockIndex;

bool BuildBlockIndex(const SearchRecord a[], int n, int blockSize,
                       BlockIndex index[], int capacity, int *blocks) {
    if (n < 0 || blockSize < 1 || index == NULL || blocks == NULL ||
        (n > 0 && a == NULL)) { return false; }
    int need = n / blockSize + (n % blockSize != 0);
    if (capacity < need) { return false; }
    int previousMax = 0;
    for (int b = 0; b < need; ++b) {
        int start = b * blockSize;
        int length = n - start < blockSize ? n - start : blockSize;
        int minimum = INT_MAX;
        int maximum = INT_MIN;
        for (int i = start; i < start + length; ++i) {
            if (a[i].key < minimum) { minimum = a[i].key; }
            if (a[i].key > maximum) { maximum = a[i].key; }
        }
        if (b > 0 && minimum <= previousMax) { return false; }
        index[b].maxKey = maximum;
        index[b].start = start;
        index[b].length = length;
        previousMax = maximum;
    }
    *blocks = need;
    return true;
}

int BlockSearch(const SearchRecord a[], const BlockIndex index[],
                  int blocks, int key) {
    int low = 0;
    int high = blocks - 1;
    int candidate = blocks;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (index[mid].maxKey >= key) { candidate = mid; high = mid - 1; }
        else { low = mid + 1; }
    }
    if (candidate == blocks) { return -1; }
    int end = index[candidate].start + index[candidate].length;
    for (int i = index[candidate].start; i < end; ++i) {
        if (a[i].key == key) { return i; }
    }
    return -1;
}
```

查找以索引和数据一致、块间有序为前提。建索引 O(n)，失败时不要使用部分索引；索引二分加块内扫描为 O(log b+s)，b 为块数，s 为该块长度上界。

#### 分块ASL与最优块长的条件

若 n=bs，每块 s 条、成功记录等概率，索引也采用顺序查找：

$$
ASL=\frac{b+1}{2}+\frac{s+1}{2}
=\frac{n/s+s}{2}+1
$$

在该模型下 s≈√n 时较小。若索引用二分、各块不等长或访问概率不同，不能再直接说最优块长一定 √n。

索引比较与块内比较都要计入；上述数据找 12，本页二分索引比较 15、7 两次，块内三次，共 5 次。失败 ASL 还取决于失败关键字分布，不只由 n 决定。

## 7.3 树形查找

### 7.3.1 二叉排序树（BST）

#### BST的递归顺序性质与ASL

每个结点左子树全部关键字小于它，右子树全部关键字大于它，左右子树也都是 BST。本页关键字唯一。

- 中序遍历严格递增；允许重复时要另规定相等值存储策略。
- 只检查左右孩子比根小/大不够，性质作用于整棵子树。
- 成功比较数为结点所在层次；失败比较数为走过的真实结点数。
- 形状由插入顺序决定；平衡形态 O(log n)，递增输入可退化为链，最坏 O(n)。

普通 BST 不自动保持平衡。随机模型下的平均结果不能当作任意输入的最坏保证。

#### BST的查找、插入与修改数据

```cpp
typedef struct BSTNode {
    SearchRecord record;
    struct BSTNode *left;
    struct BSTNode *right;
} BSTNode, *BSTree;

BSTree BSTFind(BSTree T, int key) {
    while (T != NULL) {
        int cmp = CompareKeys(key, T->record.key);
        if (cmp == 0) { return T; }
        T = cmp < 0 ? T->left : T->right;
    }
    return NULL;
}

bool BSTInsert(BSTree *root, SearchRecord record) {
    if (root == NULL) { return false; }
    BSTree *slot = root;
    while (*slot != NULL) {
        if (record.key == (*slot)->record.key) { return false; }
        slot = record.key < (*slot)->record.key ? &(*slot)->left : &(*slot)->right;
    }
    BSTree p = (BSTree)malloc(sizeof(BSTNode));
    if (p == NULL) { return false; }
    p->record = record;
    p->left = p->right = NULL;
    *slot = p;
    return true;
}

bool BSTUpdateValue(BSTree T, int key, int value) {
    BSTree p = BSTFind(T, key);
    if (p == NULL) { return false; }
    p->record.value = value;
    return true;
}
```

查找与插入沿一条路径，O(h)；插入前先查重，申请失败不改变树。value 修改仍需查找，定位后改字段 O(1)。

#### BST删除的三种结构情况

1. 叶：摘掉并释放。
2. 一个孩子：让双亲直接连接该孩子。
3. 两个孩子：用中序前驱或后继替换记录，再删除前驱/后继原位置；它至多有一个孩子。

```cpp
bool BSTDelete(BSTree *root, int key) {
    if (root == NULL) { return false; }
    BSTree *slot = root;
    while (*slot != NULL && (*slot)->record.key != key) {
        slot = key < (*slot)->record.key ? &(*slot)->left : &(*slot)->right;
    }
    if (*slot == NULL) { return false; }
    BSTree p = *slot;
    if (p->left != NULL && p->right != NULL) {
        BSTree *successorSlot = &p->right;
        while ((*successorSlot)->left != NULL) { successorSlot = &(*successorSlot)->left; }
        BSTree successor = *successorSlot;
        p->record = successor->record; // 关键字和数据一起复制。
        *successorSlot = successor->right;
        free(successor);
    } else {
        *slot = p->left != NULL ? p->left : p->right;
        free(p);
    }
    return true;
}

void BSTInOrder(BSTree T) {
    if (T == NULL) { return; }
    BSTInOrder(T->left);
    printf("%d ", T->record.key);
    BSTInOrder(T->right);
}

void DestroyBST(BSTree *T) {
    if (T == NULL || *T == NULL) { return; }
    DestroyBST(&(*T)->left);
    DestroyBST(&(*T)->right);
    free(*T);
    *T = NULL;
}
```

不能用任意叶替换根，必须满足顺序关系。删除两孩子结点时要复制整个记录，不能仅换 key 而把 value 留给错误关键字。

删除 O(h)；本版查找/插入/删除是迭代，辅助指针 O(1)，中序与销毁递归栈 O(h)。外部结点指针可能在删除时失效，记录也可能因后继替换而改变。

#### BST构造与删除例子

依次插入 50、30、70、20、40、60、80：根 50，左右根 30、70，底层为 20、40、60、80；中序 20、30、40、50、60、70、80，等概率成功 ASL=17/7。

删 50 用后继 60 替换根记录，再删原 60；删 20 是叶情况，删某个只有一个孩子的结点要把该孩子接回。相同关键字集合按不同顺序插入可能得到不同 BST。

### 7.3.2 平衡二叉树

#### AVL的平衡因子、高度与最少结点

AVL 是每个结点左右子树高度差绝对值不超过 1 的 BST。平衡因子 BF=左高-右高，合法值 -1、0、1；不是要求左右结点数相等。

高 h 的 AVL 最少结点数：

$$
N(0)=0,\quad N(1)=1,\quad N(h)=N(h-1)+N(h-2)+1
$$

前几项 0、1、2、4、7、12、20；即 N(h)=F_(h+2)-1，高度为 O(log n)。最大结点数仍为 2^h-1。

#### LL、RR、LR、RL与旋转方向

以最靠近插入位置的失衡祖先 A 为观察点：

| 插入路径 | 处理 | 三个关键字例子 |
| --- | --- | --- |
| LL | 对 A 右旋 | 30、20、10 |
| RR | 对 A 左旋 | 10、20、30 |
| LR | 左孩子左旋，再 A 右旋 | 30、10、20 |
| RL | 右孩子右旋，再 A 左旋 | 10、30、20 |

四例最终均以 20 为根、10 在左、30 在右。命名描述失衡路径，旋转方向不与名字直接相同。旋转只改连接并维护高度，保持中序关键字顺序。

#### AVL的高度维护、旋转与统一再平衡

```cpp
typedef struct AVLNode {
    SearchRecord record;
    int height;
    struct AVLNode *left;
    struct AVLNode *right;
} AVLNode, *AVLTree;

int AVLHeight(AVLTree p) { return p == NULL ? 0 : p->height; }

void AVLRefresh(AVLTree p) {
    int a = AVLHeight(p->left);
    int b = AVLHeight(p->right);
    p->height = (a > b ? a : b) + 1;
}

AVLTree AVLRotateRight(AVLTree a) {
    AVLTree b = a->left;
    a->left = b->right;
    b->right = a;
    AVLRefresh(a);
    AVLRefresh(b);
    return b;
}

AVLTree AVLRotateLeft(AVLTree a) {
    AVLTree b = a->right;
    a->right = b->left;
    b->left = a;
    AVLRefresh(a);
    AVLRefresh(b);
    return b;
}

AVLTree AVLRebalance(AVLTree p) {
    if (p == NULL) { return NULL; }
    AVLRefresh(p);
    int bf = AVLHeight(p->left) - AVLHeight(p->right);
    if (bf > 1) {
        if (AVLHeight(p->left->left) < AVLHeight(p->left->right)) {
            p->left = AVLRotateLeft(p->left);
        }
        return AVLRotateRight(p);
    }
    if (bf < -1) {
        if (AVLHeight(p->right->right) < AVLHeight(p->right->left)) {
            p->right = AVLRotateRight(p->right);
        }
        return AVLRotateLeft(p);
    }
    return p;
}
```

旋转先更新原根 a，再更新新根 b；顺序反了可能使用旧高度。再平衡比较子树高度，也正确覆盖删除时重侧孩子 BF=0 的情况。

#### AVL查找、插入与数据修改

```cpp
AVLTree AVLFind(AVLTree T, int key) {
    while (T != NULL && T->record.key != key) {
        T = key < T->record.key ? T->left : T->right;
    }
    return T;
}

AVLTree AVLInsertRec(AVLTree T, SearchRecord record, bool *ok) {
    if (T == NULL) {
        AVLTree p = (AVLTree)malloc(sizeof(AVLNode));
        if (p == NULL) { *ok = false; return NULL; }
        p->record = record;
        p->height = 1;
        p->left = p->right = NULL;
        return p;
    }
    if (record.key == T->record.key) { *ok = false; return T; }
    if (record.key < T->record.key) { T->left = AVLInsertRec(T->left, record, ok); }
    else { T->right = AVLInsertRec(T->right, record, ok); }
    return *ok ? AVLRebalance(T) : T;
}

bool AVLInsert(AVLTree *root, SearchRecord record) {
    if (root == NULL) { return false; }
    bool ok = true;
    *root = AVLInsertRec(*root, record, &ok);
    return ok;
}

bool AVLUpdateValue(AVLTree T, int key, int value) {
    AVLTree p = AVLFind(T, key);
    if (p == NULL) { return false; }
    p->record.value = value;
    return true;
}
```

插入先按 BST 定位，再沿路径回溯更新和旋转；一次插入最多需要一次单旋或一次双旋，但可能沿路径更新很多结点。

#### AVL删除与向上继续平衡

```cpp
AVLTree AVLDeleteRec(AVLTree T, int key, bool *deleted) {
    if (T == NULL) { return NULL; }
    if (key < T->record.key) { T->left = AVLDeleteRec(T->left, key, deleted); }
    else if (key > T->record.key) { T->right = AVLDeleteRec(T->right, key, deleted); }
    else {
        *deleted = true;
        if (T->left == NULL || T->right == NULL) {
            AVLTree child = T->left != NULL ? T->left : T->right;
            free(T);
            return child;
        }
        AVLTree successor = T->right;
        while (successor->left != NULL) { successor = successor->left; }
        T->record = successor->record;
        T->right = AVLDeleteRec(T->right, successor->record.key, deleted);
    }
    return AVLRebalance(T);
}

bool AVLDelete(AVLTree *root, int key) {
    if (root == NULL) { return false; }
    bool deleted = false;
    *root = AVLDeleteRec(*root, key, &deleted);
    return deleted;
}

void DestroyAVL(AVLTree *T) {
    if (T == NULL || *T == NULL) { return; }
    DestroyAVL(&(*T)->left);
    DestroyAVL(&(*T)->right);
    free(*T);
    *T = NULL;
}
```

删除后的子树可能继续变矮，使更高祖先失衡，因此可能在多个层次旋转，不能照搬“插入只调整第一个失衡祖先后即可”的停止规则。

**重侧 BF=0 例子：** 根 20，左叶 10，右子树根 30、孩子 25/40。删 10 后根右高差 2、30 的 BF=0，单左旋即可；新根 30，左 20（右孩子 25），右 40。旋转后这棵子树高度未下降。

AVL 查找、插入、删除最坏 O(log n)；递归更新 O(log n) 栈。改 key 要重新插删，不能改字段后仅更新 height。

### 7.3.3 红黑树

#### 红黑性质、NIL与黑高

红黑树是带颜色约束的 BST：

1. 每个结点红或黑。
2. 根黑。
3. 外部 NIL 叶黑，不保存记录。
4. 红结点的两个孩子黑，即不能连续两个红结点。
5. 从同一结点到各后代 NIL 的路径包含相同数量黑结点。

本页黑高 bh(x) 不包含 x，自 x 以下计黑结点并包含末端 NIL，bh(NIL)=0。部分教材黑高是否含当前点或外部叶不同，计算前明确边界。

不能把 NIL 与“实际没有左右孩子的数据结点”当成同一种叶。实际末层数据结点可以红。

#### 高度界与AVL的区别

子树中至少有 2^bh-1 个实际结点；红不能相邻，使最长根到 NIL 路径不超过最短的两倍，n 个实际结点高度 O(log n)，常用上界 h≤2log₂(n+1)。

红黑树不要求每点左右高度差≤1，平衡约束比 AVL 宽松；两者查找、插删都保证 O(log n)。AVL 通常更紧凑，但不能据此断言每组数据的 ASL 或运行速度必然更优。

将红结点与其黑双亲合并，可联系到 2-3-4 树；普通红黑树允许右红链接，不要额外加入仅左红的变种规则。

#### 红黑树的哨兵、查找与旋转

```cpp
enum { RB_BLACK = 0, RB_RED = 1 };

typedef struct RBNode {
    SearchRecord record;
    int color;
    struct RBNode *left;
    struct RBNode *right;
    struct RBNode *parent;
} RBNode;

typedef struct {
    RBNode *root;
    RBNode nil;
} RBTree;

void InitRBTree(RBTree *T) {
    T->nil.color = RB_BLACK;
    T->nil.left = T->nil.right = T->nil.parent = &T->nil;
    T->root = &T->nil;
}

RBNode *RBFind(RBTree *T, int key) {
    RBNode *p = T->root;
    while (p != &T->nil) {
        if (p->record.key == key) { return p; }
        p = key < p->record.key ? p->left : p->right;
    }
    return NULL; // 对外失败为 NULL，内部空链接仍用 &nil。
}

// left=true 左旋，false 右旋；相应旋转孩子必须非 NIL。
void RBRotate(RBTree *T, RBNode *x, bool left) {
    RBNode *y = left ? x->right : x->left;
    if (left) {
        x->right = y->left;
        if (y->left != &T->nil) { y->left->parent = x; }
    } else {
        x->left = y->right;
        if (y->right != &T->nil) { y->right->parent = x; }
    }
    y->parent = x->parent;
    if (x->parent == &T->nil) { T->root = y; }
    else if (x == x->parent->left) { x->parent->left = y; }
    else { x->parent->right = y; }
    if (left) { y->left = x; }
    else { y->right = x; }
    x->parent = y;
}
```

nil 放在 RBTree 对象内部，其地址是所有空链接的目标；**不可按值复制或移动已建立的 RBTree**，否则链接仍指向旧对象哨兵。操作期间对象地址保持不变。

#### 插入修复：红叔与黑叔

新结点插入为红，左右为黑 NIL，不改变路径黑高。父黑则结束；父红意味着祖父存在且需要处理：

| 叔颜色 | 处理 |
| --- | --- |
| 红 | 父、叔改黑，祖父改红，把问题向祖父上推 |
| 黑，折线 | 先旋父把折线变直线 |
| 黑，直线 | 父黑、祖父红，再旋祖父 |

左右对称，最后根强制黑。

```cpp
void RBInsertFix(RBTree *T, RBNode *z) {
    while (z->parent->color == RB_RED) {
        bool left = z->parent == z->parent->parent->left;
        RBNode *uncle = left ? z->parent->parent->right : z->parent->parent->left;
        if (uncle->color == RB_RED) {
            z->parent->color = uncle->color = RB_BLACK;
            z->parent->parent->color = RB_RED;
            z = z->parent->parent;
        } else {
            if (z == (left ? z->parent->right : z->parent->left)) {
                z = z->parent;
                RBRotate(T, z, left);
            }
            z->parent->color = RB_BLACK;
            z->parent->parent->color = RB_RED;
            RBRotate(T, z->parent->parent, !left);
        }
    }
    T->root->color = RB_BLACK;
    T->root->parent = &T->nil;
}

bool RBInsert(RBTree *T, SearchRecord record) {
    RBNode *parent = &T->nil;
    RBNode *p = T->root;
    while (p != &T->nil) {
        parent = p;
        if (record.key == p->record.key) { return false; }
        p = record.key < p->record.key ? p->left : p->right;
    }
    RBNode *z = (RBNode *)malloc(sizeof(RBNode));
    if (z == NULL) { return false; }
    z->record = record;
    z->color = RB_RED;
    z->left = z->right = &T->nil;
    z->parent = parent;
    if (parent == &T->nil) { T->root = z; }
    else if (record.key < parent->record.key) { parent->left = z; }
    else { parent->right = z; }
    RBInsertFix(T, z);
    return true;
}
```

插 10、20、30：黑叔直线，20 成黑根，10/30 红；再插 15，父 10 红、叔 30 红，10/30 变黑，根最终仍黑，15 红。这是变色与旋转不同情况的简例。

#### 删除的颜色判断与四类修复

先按 BST 方法找真正摘掉原位置的结点 y，检查 **y 的原颜色**。摘掉红结点无需补黑；摘掉黑而替代孩子红时，把孩子染黑即可；黑被黑/NIL 替代，需补偿一层黑高不足。

以不足位置 x 为双亲左孩子为例，兄弟 w 在右，近侄 w.left、远侄 w.right：

1. 兄红：兄黑、父红，左旋父，转化为黑兄情形。
2. 兄黑且两侄黑：兄红，黑不足上推到父。
3. 兄黑、近红、远黑：旋兄并变色，转化为远红。
4. 兄黑、远红：兄取父颜色，父与远侄黑，旋父，结束。

x 在右时镜像处理。“双黑”是解释不足的概念，本页没有第三种实际颜色字段。

```cpp
void RBTransplant(RBTree *T, RBNode *u, RBNode *v) {
    if (u->parent == &T->nil) { T->root = v; }
    else if (u == u->parent->left) { u->parent->left = v; }
    else { u->parent->right = v; }
    v->parent = u->parent; // v 为 NIL 时也记录此次修复位置的双亲。
}

void RBDeleteFix(RBTree *T, RBNode *x) {
    while (x != T->root && x->color == RB_BLACK) {
        bool left = x == x->parent->left;
        RBNode *w = left ? x->parent->right : x->parent->left;
        if (w->color == RB_RED) {
            w->color = RB_BLACK;
            x->parent->color = RB_RED;
            RBRotate(T, x->parent, left);
            w = left ? x->parent->right : x->parent->left;
        }
        RBNode *near = left ? w->left : w->right;
        RBNode *far = left ? w->right : w->left;
        if (near->color == RB_BLACK && far->color == RB_BLACK) {
            if (w != &T->nil) { w->color = RB_RED; }
            x = x->parent;
        } else {
            if (far->color == RB_BLACK) {
                near->color = RB_BLACK;
                w->color = RB_RED;
                RBRotate(T, w, !left);
                w = left ? x->parent->right : x->parent->left;
                far = left ? w->right : w->left;
            }
            w->color = x->parent->color;
            x->parent->color = RB_BLACK;
            far->color = RB_BLACK;
            RBRotate(T, x->parent, left);
            x = T->root;
        }
    }
    x->color = RB_BLACK;
}

bool RBDelete(RBTree *T, int key) {
    RBNode *z = RBFind(T, key);
    if (z == NULL) { return false; }
    RBNode *y = z;
    int oldColor = y->color;
    RBNode *x;
    if (z->left == &T->nil) { x = z->right; RBTransplant(T, z, z->right); }
    else if (z->right == &T->nil) { x = z->left; RBTransplant(T, z, z->left); }
    else {
        y = z->right;
        while (y->left != &T->nil) { y = y->left; }
        oldColor = y->color;
        x = y->right;
        if (y->parent == z) { x->parent = y; }
        else {
            RBTransplant(T, y, y->right);
            y->right = z->right;
            y->right->parent = y;
        }
        RBTransplant(T, z, y);
        y->left = z->left;
        y->left->parent = y;
        y->color = z->color;
    }
    free(z);
    if (oldColor == RB_BLACK) { RBDeleteFix(T, x); }
    T->nil.color = RB_BLACK;
    T->nil.parent = &T->nil;
    if (T->root != &T->nil) { T->root->parent = &T->nil; }
    return true;
}

bool RBUpdateValue(RBTree *T, int key, int value) {
    RBNode *p = RBFind(T, key);
    if (p == NULL) { return false; }
    p->record.value = value;
    return true;
}

void DestroyRBNodes(RBTree *T, RBNode *p) {
    if (p == &T->nil) { return; }
    DestroyRBNodes(T, p->left);
    DestroyRBNodes(T, p->right);
    free(p);
}

void ClearRBTree(RBTree *T) {
    DestroyRBNodes(T, T->root);
    InitRBTree(T);
}
```

本版移植后继结点，不只复制 key；z 的地址被释放。删除修复时 NIL 的 parent 临时记录不足位置，修复完成后重置；不能在修复前强行重置它。

常规红黑插入最多两次旋转，删除最多三次旋转，但向上变色可能 O(log n)。查找、插删总时间 O(log n)，旋转次数小不意味着总操作 O(1)。销毁递归栈 O(log n)，NIL 不单独 free。

## 7.4 B树和B+树

### 7.4.1 B树及其基本操作

#### m阶B树的结点容量与高度

B 树是平衡的多路查找树，主要用于外存索引。一个结点存多个关键字，可以对应一个磁盘页；降低树高有助于减少访问磁盘页的次数。

这里采用教材常见的**阶数 m = 每个结点最多有 m 个孩子**，m≥3。设 c=⌈m/2⌉。

| 位置 | 关键字数 | 孩子数（非底层结点） |
|---|---|---|
| 非空根结点 | 1～m−1 | 2～m |
| 非根结点 | c−1～m−1 | c～m |
| 空树 | 0 | 0 |

一个含 k 个关键字的非底层结点有 k+1 个孩子。结点内 K₁<K₂<…<Kₖ，孩子 P₀…Pₖ 的关键字范围分别为：小于 K₁、介于相邻两个 K 之间、大于 Kₖ。**子树内全部关键字都要满足范围，不能只检查子树根。**本章唯一关键字，不讨论重复记录的附加管理。

所有底层存关键字的结点处于同一层。教材有时把查找失败的外部空结点称为“叶结点”；本节代码的 `leaf=true` 指**没有实际孩子、但存关键字的底层结点**。两种称呼不要混用。

以 h 表示存关键字的层数，非空 B 树含 n 个关键字：

$$2c^{h-1}-1\le n\le m^h-1$$

因此：

$$\lceil\log_m(n+1)\rceil\le h\le\left\lfloor\log_c\frac{n+1}{2}\right\rfloor+1$$

推导：根最少 1 个关键字、2 个孩子；第 i 层（i≥2）最少 2c^(i−2) 个结点，每个至少 c−1 个关键字；最多时第 i 层有 m^(i−1) 个结点，每个 m−1 个关键字。**n 是关键字总数，不是结点总数。**空树单独取 h=0。

> [!warning] 阶数、最小度数与磁盘读次数
> 最小度数 t 的 B 树通常最多 2t 个孩子，对应 m=2t；不能把 t 直接当作 m。查找经过 h 个结点最多需要 h 次页面访问，但根若已驻留内存，实际磁盘读取可能少一次。结点内部还要比较关键字，页面访问次数不等于关键字比较次数。

#### B树查找、插入与删除的过程

**查找：**在当前结点寻找第一个 ≥key 的关键字。相等即成功；否则沿对应区间的孩子下降；下降到空指针后失败。结点内可顺序或折半查找。

**插入：**新记录最终进入底层结点。教材常从“插入后溢出”描述：出现 m 个关键字后分裂，取中间关键字上移到父结点，左右分别保留较小、较大的关键字；父结点也可能溢出，向上继续。根分裂使高度增加 1。上移的记录从原子结点中移除。

**删除：**

1. 在底层删除关键字；若内部关键字被删，先用直接前驱或直接后继的**整条记录**替代，再到对应子树删除那条记录。
2. 若非根结点少于 c−1 个关键字，优先考虑向相邻兄弟借。兄弟的边界记录先上移到父结点，父结点的分隔记录下移到不足结点；有孩子时还要移动对应孩子。
3. 兄弟也处于最小容量时，将不足结点、父结点的分隔记录和一个兄弟合并。父结点因此少一个关键字，可能继续不足。
4. 根的关键字数变为 0 且尚有一个孩子时，让这个孩子成为新根，高度减少 1；最后一个关键字被删后成为空树。

> [!tip] 考点提示
> 插入位置是底层；被提升的关键字可能到根。删除内部关键字时替代它的是前驱或后继，不是任意孩子的第一个关键字。借用需要经过父结点，不能把兄弟的某个关键字直接塞过来。

#### 偶数阶B树的表示、查找与分裂函数

下面给出可直接理解各步骤的**4 阶 B 树（t=2）**函数。将 t 改成其他 ≥2 的值，可表示 m=2t 的偶数阶 B 树。采用“下降前分裂满孩子、下降前补足最小孩子”的方法。

这种方法与“溢出后分裂”的教材过程都能得到合法树，具体形状可能不同。**不能通过简单修改常量把这套预先合并算法改为任意奇数阶 B 树**：奇数阶的两个最小孩子再加一个分隔关键字，可能超出最大容量。

以下代码与本章 `SearchRecord` 定义配合。所有公开函数要求传入合法、已初始化的树，`BTree T = NULL;` 表示空树。

```cpp
enum {
    BT_MIN_DEGREE = 2,
    BT_ORDER = 2 * BT_MIN_DEGREE,
    BT_MAX_KEYS = BT_ORDER - 1
};

typedef struct BNode {
    int n;
    bool leaf;
    SearchRecord item[BT_MAX_KEYS];
    struct BNode *child[BT_ORDER];
} BNode, *BTree;

BNode *NewBNode(bool leaf) {
    BNode *p = (BNode *)malloc(sizeof(BNode));
    if (p == NULL) { return NULL; }
    p->n = 0;
    p->leaf = leaf;
    for (int i = 0; i < BT_MAX_KEYS; ++i) {
        p->item[i].key = 0;
        p->item[i].value = 0;
    }
    for (int i = 0; i < BT_ORDER; ++i) { p->child[i] = NULL; }
    return p;
}

SearchRecord *BFind(BTree T, int key) {
    while (T != NULL) {
        int i = 0;
        while (i < T->n && key > T->item[i].key) { ++i; }
        if (i < T->n && key == T->item[i].key) { return &T->item[i]; }
        if (T->leaf) { return NULL; }
        T = T->child[i];
    }
    return NULL;
}

// 父结点未满，child[i] 已满。分配失败时本次分裂不改变树。
bool BSplitChild(BNode *parent, int i) {
    BNode *left = parent->child[i];
    BNode *right = NewBNode(left->leaf);
    if (right == NULL) { return false; }
    const int t = BT_MIN_DEGREE;
    SearchRecord middle = left->item[t - 1];
    right->n = t - 1;
    for (int j = 0; j < t - 1; ++j) { right->item[j] = left->item[j + t]; }
    if (!left->leaf) {
        for (int j = 0; j < t; ++j) {
            right->child[j] = left->child[j + t];
            left->child[j + t] = NULL;
        }
    }
    left->n = t - 1;
    for (int j = parent->n; j >= i + 1; --j) {
        parent->child[j + 1] = parent->child[j];
    }
    parent->child[i + 1] = right;
    for (int j = parent->n - 1; j >= i; --j) {
        parent->item[j + 1] = parent->item[j];
    }
    parent->item[i] = middle;
    ++parent->n;
    return true;
}
```

#### B树插入、数据修改与分配失败

```cpp
// p 未满，r.key 在整棵树中不存在。
bool BInsertNonFull(BNode *p, SearchRecord r) {
    int i = p->n - 1;
    if (p->leaf) {
        while (i >= 0 && r.key < p->item[i].key) {
            p->item[i + 1] = p->item[i];
            --i;
        }
        p->item[i + 1] = r;
        ++p->n;
        return true;
    }
    while (i >= 0 && r.key < p->item[i].key) { --i; }
    ++i;
    if (p->child[i]->n == BT_MAX_KEYS) {
        if (!BSplitChild(p, i)) { return false; }
        if (r.key > p->item[i].key) { ++i; }
    }
    return BInsertNonFull(p->child[i], r);
}

bool BInsert(BTree *T, SearchRecord r) {
    if (BFind(*T, r.key) != NULL) { return false; }
    if (*T == NULL) {
        BNode *p = NewBNode(true);
        if (p == NULL) { return false; }
        p->item[0] = r;
        p->n = 1;
        *T = p;
        return true;
    }
    if ((*T)->n == BT_MAX_KEYS) {
        BNode *root = NewBNode(false);
        if (root == NULL) { return false; }
        root->child[0] = *T;
        if (!BSplitChild(root, 0)) {
            free(root);
            return false;
        }
        *T = root;
    }
    return BInsertNonFull(*T, r);
}

bool BUpdateValue(BTree T, int key, int value) {
    SearchRecord *p = BFind(T, key);
    if (p == NULL) { return false; }
    p->value = value;
    return true;
}
```

`BInsert` 返回 false 可能表示重复或分配失败。若下降途中此前已经完成分裂，后续分配失败会保留这些合法分裂：**旧记录集合不变、待插入记录未进入，但树形可能改变。**不要把 false 理解为每个结点地址与形状都完全不变。

#### B树删除中的借用与合并函数

```cpp
// child[i] 向左兄弟借；左兄弟至少有 t 个关键字。
void BBorrowPrevious(BNode *p, int i) {
    BNode *q = p->child[i];
    BNode *s = p->child[i - 1];
    for (int j = q->n - 1; j >= 0; --j) { q->item[j + 1] = q->item[j]; }
    if (!q->leaf) {
        for (int j = q->n; j >= 0; --j) { q->child[j + 1] = q->child[j]; }
        q->child[0] = s->child[s->n];
        s->child[s->n] = NULL;
    }
    q->item[0] = p->item[i - 1];
    p->item[i - 1] = s->item[s->n - 1];
    ++q->n;
    --s->n;
}

// child[i] 向右兄弟借；右兄弟至少有 t 个关键字。
void BBorrowNext(BNode *p, int i) {
    BNode *q = p->child[i];
    BNode *s = p->child[i + 1];
    q->item[q->n] = p->item[i];
    if (!q->leaf) { q->child[q->n + 1] = s->child[0]; }
    p->item[i] = s->item[0];
    for (int j = 1; j < s->n; ++j) { s->item[j - 1] = s->item[j]; }
    if (!s->leaf) {
        for (int j = 1; j <= s->n; ++j) { s->child[j - 1] = s->child[j]; }
        s->child[s->n] = NULL;
    }
    ++q->n;
    --s->n;
}

// 合并 child[i]、item[i]、child[i+1]；合并后容量不超过 2t-1。
void BMergeChildren(BNode *p, int i) {
    BNode *left = p->child[i];
    BNode *right = p->child[i + 1];
    int oldN = left->n;
    left->item[oldN] = p->item[i];
    for (int j = 0; j < right->n; ++j) {
        left->item[oldN + 1 + j] = right->item[j];
    }
    if (!left->leaf) {
        for (int j = 0; j <= right->n; ++j) {
            left->child[oldN + 1 + j] = right->child[j];
        }
    }
    left->n += right->n + 1;
    for (int j = i + 1; j < p->n; ++j) { p->item[j - 1] = p->item[j]; }
    for (int j = i + 2; j <= p->n; ++j) { p->child[j - 1] = p->child[j]; }
    p->child[p->n] = NULL;
    --p->n;
    free(right); // 孩子已转移，只释放右结点本身。
}
```

#### B树删除、根缩减与销毁函数

```cpp
// key 确实存在。每次下降前，尽量保证目标孩子至少有 t 个关键字。
void BDeleteExisting(BNode *p, int key) {
    int i = 0;
    while (i < p->n && key > p->item[i].key) { ++i; }
    if (i < p->n && key == p->item[i].key) {
        if (p->leaf) {
            for (int j = i + 1; j < p->n; ++j) { p->item[j - 1] = p->item[j]; }
            --p->n;
        } else if (p->child[i]->n >= BT_MIN_DEGREE) {
            BNode *q = p->child[i];
            while (!q->leaf) { q = q->child[q->n]; }
            SearchRecord predecessor = q->item[q->n - 1];
            p->item[i] = predecessor;
            BDeleteExisting(p->child[i], predecessor.key);
        } else if (p->child[i + 1]->n >= BT_MIN_DEGREE) {
            BNode *q = p->child[i + 1];
            while (!q->leaf) { q = q->child[0]; }
            SearchRecord successor = q->item[0];
            p->item[i] = successor;
            BDeleteExisting(p->child[i + 1], successor.key);
        } else {
            BMergeChildren(p, i);
            BDeleteExisting(p->child[i], key);
        }
        return;
    }
    if (p->child[i]->n == BT_MIN_DEGREE - 1) {
        if (i > 0 && p->child[i - 1]->n >= BT_MIN_DEGREE) {
            BBorrowPrevious(p, i);
        } else if (i < p->n && p->child[i + 1]->n >= BT_MIN_DEGREE) {
            BBorrowNext(p, i);
        } else if (i < p->n) {
            BMergeChildren(p, i);
        } else {
            BMergeChildren(p, i - 1);
            --i;
        }
    }
    BDeleteExisting(p->child[i], key);
}

bool BDelete(BTree *T, int key) {
    if (BFind(*T, key) == NULL) { return false; }
    BDeleteExisting(*T, key);
    if ((*T)->n == 0) {
        BNode *oldRoot = *T;
        *T = oldRoot->leaf ? NULL : oldRoot->child[0];
        free(oldRoot);
    }
    return true;
}

void DestroyBNodes(BNode *p) {
    if (p == NULL) { return; }
    if (!p->leaf) {
        for (int i = 0; i <= p->n; ++i) { DestroyBNodes(p->child[i]); }
    }
    free(p);
}

void ClearBTree(BTree *T) {
    DestroyBNodes(*T);
    *T = NULL;
}
```

固定阶数时查找、插删时间 O(log n)，递归辅助空间 O(log n)。如果将 m 也视为变量，本版结点内扫描、搬移最多 O(m)，应写 O(m·h) 的上界；不能无条件把结点内部处理当常数。操作后旧的 `BFind` 返回地址可能不再代表原记录，重新查找再使用。

#### 4阶B树插删演算

按上述代码插入 10、20、5、6、12、30、7、17，最终为：

```text
             [10 | 20]
          /      |      \
    [5 | 6 | 7] [12 | 17] [30]
```

按顺序删除：

| 操作 | 调整 | 删除后的根与底层 |
|---|---|---|
| 删除 6 | 底层直接删，不不足 | 根 [10,20]；[5,7]、[12,17]、[30] |
| 删除 30 | 下降前向左借：17 上移，20 下移，再删 30 | 根 [10,17]；[5,7]、[12]、[20] |
| 删除 20 | [12]、分隔 17、[20] 合并，再删 20 | 根 [10]；[5,7]、[12,17] |

另看根缩减：根 `[20]` 的孩子为 `[10]`、`[30]`，删除 10 前合并为 `[10,20,30]`；删除后旧根为空，让 `[20,30]` 成为新的底层根。

### 7.4.2 B+树的基本概念

#### B+树的索引结点、叶结点与两种约定

本节采用考研教材常见的**子树最大关键字索引**约定：

- m 阶分支结点最多 m 个孩子，**k 个孩子配 k 个索引关键字**；第 i 个索引关键字等于第 i 个孩子子树的最大关键字。
- 非根分支结点通常至少 ⌈m/2⌉ 个孩子；非叶根至少 2 个孩子。
- 所有实际记录集中在叶结点，叶结点按关键字有序并通过指针串起来。分支结点仅存索引关键字与孩子指针。
- 在叶容量也取 m 的这套模型中，非根叶结点存 ⌈m/2⌉～m 条记录；根本身为叶时可更少。实际数据库常给叶结点单独设置容量，要以题设为准。

```text
                 [ 9 | 18 | 30 ]    ← 各孩子的最大关键字
                   /    |    \
       [2,5,9] → [12,15,18] → [21,25,30]
```

查找 18：在根选择最大关键字为 18 的孩子，继续到叶中找实际记录；**在根看见 18 不能就返回实际记录**。

另一种常见实现用“右子树最小关键字”作分隔符，k 个孩子只存 k−1 个分隔关键字。这种 B+ 树也合法，但本章题目、代码和容量表使用前一约定。做题先看定义，不能拿 B 树的“k 个关键字配 k+1 个孩子”直接套本节模型。

#### B树与B+树的比较及更新规则

| 比较项 | B 树 | 本节 B+ 树 |
|---|---|---|
| 实际记录位置 | 各层存关键字的结点都可存记录 | 全部在叶结点 |
| 查找成功停止位置 | 可能在内部结点 | 必须到叶结点 |
| 关键字重复出现 | 本章唯一 key 只对应一条记录 | 叶中真实 key 可重复出现在内部索引 |
| 分支容量关系 | k 个关键字、k+1 个孩子 | k 个索引关键字、k 个孩子 |
| 全部记录的顺序访问 | 中序处理内部与各子树 | 沿叶链顺序扫描 |
| 范围查找 | 找到起点后还要跨内部结点与子树 | 找到起点叶后沿叶链读取 |
| 磁盘索引优势 | 多路树降低高度 | 分支不存完整记录，通常容纳更多索引项；叶链利于范围读取 |

**B+ 树的标准增删规则：**

1. 插入记录到目标叶；叶溢出时分裂，把描述新孩子边界的索引项加入父结点。实际记录仍留在叶中，是索引的复制或建立。
2. 父结点也溢出时继续分裂，必要时产生新根。
3. 删除叶中实际记录；不足时从相邻兄弟借记录或合并；维护父结点索引，必要时逐层合并与根缩减。
4. 在最大关键字索引约定下，**即使未发生分裂/合并，子树最大 key 改变也可能需要向上更新索引**；叶分裂、合并还必须维护叶链。
5. 只改 value 不改变索引；改 key 必须按删除与插入处理。

> [!warning] 分裂时“提升”不是同一个动作
> B 树中提升的关键字从孩子移除；B+ 树的叶记录不会因父结点建立索引而消失。叶链仅串实际叶结点，不把内部索引结点混进去。

#### B+树的表示与批量建立函数

为使查找与范围访问代码有完整的数据来源，下面用**5 阶、最大关键字索引**构造一棵静态 B+ 树。输入是严格递增的记录数组，最多 `MAX_SEARCH_RECORDS` 条。将记录均匀分组建叶，再逐层分组建父结点；非根结点每组至少 3 项，根可例外。

这是**批量建立 O(n)**，不是逐条动态插入。7.4.2 的重点是 B+ 树基本概念、查找路径和范围访问，动态分裂/合并规则在上一小节列出，不将重建冒称 O(log n) 的动态更新。

```cpp
enum { BP_ORDER = 5 };

typedef struct BPNode {
    bool leaf;
    int count;
    SearchRecord item[BP_ORDER]; // 内部结点只有 key 有意义。
    struct BPNode *child[BP_ORDER];
    struct BPNode *next;         // 仅用于叶链。
} BPNode, *BPTree;

BPNode *NewBPNode(bool leaf) {
    BPNode *p = (BPNode *)malloc(sizeof(BPNode));
    if (p == NULL) { return NULL; }
    p->leaf = leaf;
    p->count = 0;
    p->next = NULL;
    for (int i = 0; i < BP_ORDER; ++i) {
        p->item[i].key = p->item[i].value = 0;
        p->child[i] = NULL;
    }
    return p;
}

// *T 必须为 NULL。失败时释放本次分配的所有结点，*T 仍为 NULL。
bool BuildBPlusSorted(BPTree *T, const SearchRecord a[], int n) {
    if (*T != NULL || n < 0 || n > MAX_SEARCH_RECORDS) { return false; }
    if (n > 0 && a == NULL) { return false; }
    for (int i = 1; i < n; ++i) {
        if (a[i - 1].key >= a[i].key) { return false; }
    }
    if (n == 0) { return true; }
    BPNode *level[MAX_SEARCH_RECORDS];
    BPNode *upper[MAX_SEARCH_RECORDS];
    BPNode *owned[2 * MAX_SEARCH_RECORDS];
    int ownedCount = 0;
    int groups = (n + BP_ORDER - 1) / BP_ORDER;
    int base = n / groups, extra = n % groups, pos = 0;
    for (int g = 0; g < groups; ++g) {
        BPNode *p = NewBPNode(true);
        if (p == NULL) {
            for (int j = 0; j < ownedCount; ++j) { free(owned[j]); }
            return false;
        }
        owned[ownedCount++] = p;
        level[g] = p;
        p->count = base + (g < extra ? 1 : 0);
        for (int j = 0; j < p->count; ++j) { p->item[j] = a[pos++]; }
        if (g > 0) { level[g - 1]->next = p; }
    }
    int width = groups;
    while (width > 1) {
        groups = (width + BP_ORDER - 1) / BP_ORDER;
        base = width / groups;
        extra = width % groups;
        pos = 0;
        for (int g = 0; g < groups; ++g) {
            BPNode *p = NewBPNode(false);
            if (p == NULL) {
                for (int j = 0; j < ownedCount; ++j) { free(owned[j]); }
                return false;
            }
            owned[ownedCount++] = p;
            upper[g] = p;
            p->count = base + (g < extra ? 1 : 0);
            for (int j = 0; j < p->count; ++j) {
                BPNode *q = level[pos++];
                p->child[j] = q;
                p->item[j].key = q->item[q->count - 1].key;
            }
        }
        width = groups;
        for (int i = 0; i < width; ++i) { level[i] = upper[i]; }
    }
    *T = level[0];
    return true;
}
```

该实现辅助指针数组 O(n)，本例有明确上限；分配失败按 `owned` 数组逐个释放结点本体，不再沿孩子递归释放，避免重复释放。非根结点的容量条件来自均匀分组，不是把末尾余数随便单独放一结点。

#### B+树的单值查找、范围查找与数据修改

```cpp
BPNode *BPlusLowerLeaf(BPTree T, int key) {
    if (T == NULL) { return NULL; }
    while (!T->leaf) {
        int i = 0;
        while (i < T->count && T->item[i].key < key) { ++i; }
        if (i == T->count) { return NULL; } // key 大于整棵子树最大 key。
        T = T->child[i];
    }
    return T;
}

SearchRecord *BPlusFind(BPTree T, int key) {
    BPNode *p = BPlusLowerLeaf(T, key);
    if (p == NULL) { return NULL; }
    for (int i = 0; i < p->count; ++i) {
        if (p->item[i].key == key) { return &p->item[i]; }
        if (p->item[i].key > key) { break; }
    }
    return NULL;
}

// 取闭区间 [low, high]。空间不足返回 false，out 保留已输出前缀。
bool BPlusRange(BPTree T, int low, int high,
                SearchRecord out[], int capacity, int *written) {
    if (written == NULL) { return false; }
    *written = 0;
    if (low > high || capacity < 0 || (capacity > 0 && out == NULL)) {
        return false;
    }
    BPNode *p = BPlusLowerLeaf(T, low);
    while (p != NULL) {
        for (int i = 0; i < p->count; ++i) {
            int key = p->item[i].key;
            if (key < low) { continue; }
            if (key > high) { return true; }
            if (*written == capacity) { return false; }
            out[(*written)++] = p->item[i];
        }
        p = p->next;
    }
    return true;
}

bool BPlusUpdateValue(BPTree T, int key, int value) {
    SearchRecord *p = BPlusFind(T, key);
    if (p == NULL) { return false; }
    p->value = value;
    return true;
}

void DestroyBPlusNodes(BPNode *p) {
    if (p == NULL) { return; }
    if (!p->leaf) {
        for (int i = 0; i < p->count; ++i) { DestroyBPlusNodes(p->child[i]); }
    }
    free(p); // 不再沿 next 释放，叶已通过孩子关系访问一次。
}

void ClearBPlusTree(BPTree *T) {
    DestroyBPlusNodes(*T);
    *T = NULL;
}
```

固定阶数时单值查找 O(log n)；输出 k 条范围记录时通常记 O(log n+k)，在外存分析中还应数实际读取的叶页。上面的树查找从同一根出发，成功都到叶层，但不同结点内的比较次数仍可能不同；**“路径层数相同”不等于精确 ASL 都相同。**

## 7.5 散列（Hash）表

### 7.5.1 散列表的基本概念

#### 散列地址、同义词与装填因子

散列函数 H(key) 根据关键字计算存储地址或桶号，再通过冲突处理找到记录。理想情况下，查找主要处理目标地址附近的位置，不必逐个排除全表记录。

- **冲突：**两个不同关键字 k₁≠k₂，却有 H(k₁)=H(k₂)。
- **同义词：**具有相同散列地址的不同关键字。重复插入相同 key 是重复记录问题，不是两个不同关键字产生的冲突。
- **散列表：**按散列规则组织记录的查找结构；散列不是天然有序的存储方式。
- **装填因子：**α=n/M，n 是实际记录数，M 是地址或桶的数量。不是散列函数中取模的质数 p，除非 p=M。

开放定址每槽最多一条记录，0≤α≤1；链地址一个桶可接多条记录，α 可以大于 1。装填因子通常影响冲突程度，但**相同 α 不能唯一确定 ASL**，还要看函数、冲突规则、关键字分布、删除标记和查找概率。

> [!warning] 平均O(1)的条件
> 良好的散列分布、合理装填和冲突处理可使查找期望 O(1)。最坏情况仍可能 O(n)。散列通常适合按 key 精确查找，不直接提供最小值、前驱后继、排序与范围查询；需要额外结构或遍历。

### 7.5.2 散列函数的构造方法

#### 常见构造方法及适用条件

设计要求：计算简便、地址落在合法范围、尽量均匀；关键字同一时计算结果必须一致。

| 方法 | 基本想法 | 适用条件与易错点 |
|---|---|---|
| 直接定址法 | H(key)=a·key+b | key 分布较连续且范围可控；可能浪费大量地址；须检查越界与整数溢出 |
| 除留余数法 | H(key)=key mod p | 常选不大于表长的质数 p；若 p<M，部分原始散列地址不会出现 |
| 数字分析法 | 从关键字选择分布较均匀的若干位 | 需了解该批关键字规律；不能选择几乎固定的数字位 |
| 平方取中法 | key 平方后取中间若干位 | 中间位受多个原始位影响；仍需映射到合法地址，计算要防溢出 |
| 折叠法 | 分段相加，再处理到地址范围 | 可作移位折叠或边界折叠；不能省略最终范围处理 |

除留余数法选质数是常用经验，不保证任意关键字都均匀。即使 p 是质数，若 key 都相差 p 的倍数仍会集中到同一地址。散列函数的地址计算与冲突时的探测计算是两个步骤。

#### 负关键字的取模与本章散列函数

C/C++ 的负数 `%` 结果可能为负，不能直接当数组下标。下面把余数规范到 0～10；避免用 `abs(key)`，因为最小负整数取绝对值可能溢出。

```cpp
enum { HASH_CAPACITY = 11 };

int KeyHash(int key) {
    int r = key % HASH_CAPACITY;
    return r < 0 ? r + HASH_CAPACITY : r;
}
```

例如 H(19)=8、H(1)=1、H(23)=1、H(−1)=10。本章代码与算例都用这个函数。

### 7.5.3 处理冲突的方法

#### 开放定址的探测序列与聚集

开放定址：所有记录放在同一个槽数组中，初始地址冲突后沿某个序列寻找其他槽。

| 方法 | 探测地址 | 要记住的条件 |
|---|---|---|
| 线性探测 | (H(key)+i) mod M，i=0…M−1 | 步长 1 可访问全部槽；容易形成连续占用区，即一次聚集 |
| 平方探测 | (H(key)+dᵢ) mod M，常见 dᵢ=0,1²,−1²,2²,−2²,… | 同一初始地址仍共享序列；能否遍历全表取决于 M 与序列 |
| 再散列／双散列 | (H₁(key)+i·H₂(key)) mod M | H₂(key) 非 0 且与 M 互质，才能遍历 M 个槽 |
| 伪随机探测 | (H(key)+dᵢ) mod M，dᵢ 来自固定伪随机序列 | 插入与查找必须重现相同序列；不能每次随意换随机数 |

线性探测中，原本初始地址不同的记录也可能加入同一连续簇。平方探测仍可能有同义词沿相同序列的二次聚集。

**平方探测不要只背“质数表长”。**例如只用正平方增量，M=7、i=0…6，增量模 7 为 0、1、4、2、2、4、1，只覆盖 4 个地址。若题设使用正负交替平方增量，则要按那套序列计算；常见 M=4j+3 的质数配合正负平方具有相应覆盖性质，不能把不同版本的条件混用。

双散列示例：M=11，H₂(key)=1+(规范后的 key mod 10)，步长落在 1～10，与 11 互质。若写成 H₂(key)=key mod 11，可能得到 0，探测就停在原地址。

#### 线性探测的三态表示与查找函数

开放定址删除不能直接恢复 EMPTY；需要区分：

| 状态 | 查找时 | 插入时 |
|---|---|---|
| EMPTY 从未使用／重新建表后空槽 | 可确定失败并停止 | 可使用，停止寻找重复 key |
| USED 正常记录 | 比较 key | 比较是否重复，冲突则继续 |
| DELETED 删除标记 | 继续探测 | 记住可复用位置，但继续检查后方是否已有同 key |

本版整数取值不限，不用特殊 key（如 −1）代表空槽。每次最多探测 M 个槽，避免满表时无限循环。

```cpp
enum { SLOT_EMPTY = 0, SLOT_USED = 1, SLOT_DELETED = 2 };

typedef struct {
    SearchRecord record;
    int state;
} HashSlot;

typedef struct {
    HashSlot slot[HASH_CAPACITY];
    int count;
} OpenHash;

void InitOpenHash(OpenHash *H) {
    H->count = 0;
    for (int i = 0; i < HASH_CAPACITY; ++i) {
        H->slot[i].state = SLOT_EMPTY;
        H->slot[i].record.key = H->slot[i].record.value = 0;
    }
}

// 返回槽下标或 -1；probes 可为 NULL，否则记录访问槽的次数，空槽也算一次。
int OpenHashFind(const OpenHash *H, int key, int *probes) {
    if (probes != NULL) { *probes = 0; }
    int start = KeyHash(key);
    for (int i = 0; i < HASH_CAPACITY; ++i) {
        int pos = (start + i) % HASH_CAPACITY;
        if (probes != NULL) { ++(*probes); }
        if (H->slot[pos].state == SLOT_EMPTY) { return -1; }
        if (H->slot[pos].state == SLOT_USED && H->slot[pos].record.key == key) {
            return pos;
        }
    }
    return -1;
}
```

这里 `probes` 统计探测槽次数，不是只统计与有效 key 比较的次数；本章开放定址 ASL 也采用该口径。若题目明确另有定义，按题设调整。

#### 线性探测的插入、删除与数据修改

```cpp
bool OpenHashInsert(OpenHash *H, SearchRecord r) {
    int firstDeleted = -1;
    int start = KeyHash(r.key);
    for (int i = 0; i < HASH_CAPACITY; ++i) {
        int pos = (start + i) % HASH_CAPACITY;
        if (H->slot[pos].state == SLOT_USED) {
            if (H->slot[pos].record.key == r.key) { return false; }
        } else if (H->slot[pos].state == SLOT_DELETED) {
            if (firstDeleted == -1) { firstDeleted = pos; }
        } else {
            int target = firstDeleted == -1 ? pos : firstDeleted;
            H->slot[target].record = r;
            H->slot[target].state = SLOT_USED;
            ++H->count;
            return true;
        }
    }
    if (firstDeleted != -1) {
        H->slot[firstDeleted].record = r;
        H->slot[firstDeleted].state = SLOT_USED;
        ++H->count;
        return true;
    }
    return false; // 没有空槽、没有删除槽：表满。
}

bool OpenHashDelete(OpenHash *H, int key) {
    int pos = OpenHashFind(H, key, NULL);
    if (pos == -1) { return false; }
    H->slot[pos].state = SLOT_DELETED;
    --H->count;
    return true;
}

bool OpenHashUpdateValue(OpenHash *H, int key, int value) {
    int pos = OpenHashFind(H, key, NULL);
    if (pos == -1) { return false; }
    H->slot[pos].record.value = value;
    return true;
}

// 同容量重建，清除删除标记。原表内容可在重建后整体赋值。
void RebuildOpenHash(OpenHash *H) {
    OpenHash fresh;
    InitOpenHash(&fresh);
    for (int i = 0; i < HASH_CAPACITY; ++i) {
        if (H->slot[i].state == SLOT_USED) {
            OpenHashInsert(&fresh, H->slot[i].record);
        }
    }
    *H = fresh;
}
```

删除标记不计入实际记录数 n，但会增加探测成本，所以 α 小也可能查得慢。同容量重建能清掉标记，不能增加容量；动态扩容时，应按**新表容量与新函数**重新插入有效记录，不能只把槽数组复制过去。

`RebuildOpenHash` 在本例固定表长下最坏 O(M²)，因为最多 M 次插入、每次最多 M 次探测；在分布良好、装填合理时通常按期望 O(M) 分析。它不提供一般意义的最坏线性保证。

#### 链地址法的表示与查找函数

链地址法又称拉链法：同义词链接到同一个桶，桶数组存链表首指针。链表不要求有序；下面采用头插。访问桶数组不算关键字比较，`comparisons` 只统计实际链结点 key 的比较。

```cpp
typedef struct HashNode {
    SearchRecord record;
    struct HashNode *next;
} HashNode;

typedef struct {
    HashNode *bucket[HASH_CAPACITY];
    int count;
} ChainHash;

void InitChainHash(ChainHash *H) {
    H->count = 0;
    for (int i = 0; i < HASH_CAPACITY; ++i) { H->bucket[i] = NULL; }
}

HashNode *ChainHashFind(const ChainHash *H, int key, int *comparisons) {
    if (comparisons != NULL) { *comparisons = 0; }
    HashNode *p = H->bucket[KeyHash(key)];
    while (p != NULL) {
        if (comparisons != NULL) { ++(*comparisons); }
        if (p->record.key == key) { return p; }
        p = p->next;
    }
    return NULL;
}
```

#### 链地址法的插入、删除、修改与清空

```cpp
bool ChainHashInsert(ChainHash *H, SearchRecord r) {
    if (ChainHashFind(H, r.key, NULL) != NULL) { return false; }
    HashNode *p = (HashNode *)malloc(sizeof(HashNode));
    if (p == NULL) { return false; }
    int index = KeyHash(r.key);
    p->record = r;
    p->next = H->bucket[index];
    H->bucket[index] = p;
    ++H->count;
    return true;
}

bool ChainHashDelete(ChainHash *H, int key) {
    HashNode **link = &H->bucket[KeyHash(key)];
    while (*link != NULL && (*link)->record.key != key) {
        link = &(*link)->next;
    }
    if (*link == NULL) { return false; }
    HashNode *old = *link;
    *link = old->next;
    free(old);
    --H->count;
    return true;
}

bool ChainHashUpdateValue(ChainHash *H, int key, int value) {
    HashNode *p = ChainHashFind(H, key, NULL);
    if (p == NULL) { return false; }
    p->record.value = value;
    return true;
}

void ClearChainHash(ChainHash *H) {
    for (int i = 0; i < HASH_CAPACITY; ++i) {
        HashNode *p = H->bucket[i];
        while (p != NULL) {
            HashNode *next = p->next;
            free(p);
            p = next;
        }
        H->bucket[i] = NULL;
    }
    H->count = 0;
}
```

链地址删除直接摘下结点，不需要开放定址的删除标记。无序桶链查找失败必须扫描完整条链；若桶链有序，则能提前停止，但建表与维护规则也改变。链地址除了桶数组，还需为每条记录的链接字段付出空间。

#### 其他冲突处理与“再散列”的两种语境

- **公共溢出区：**基本表之外单设溢出区域；冲突记录进入溢出区。查找不能仅检查基本地址，必要时还要访问溢出记录。
- **多个散列函数探测：**题目说“再散列法”时，可能指开放定址中利用另一个函数形成探测序列。
- **扩容重建／rehash：**程序实践里又常指调整容量后重新计算所有记录位置。它是整表维护，不等于上一个定义。

做题根据给出的 Hᵢ 或扩容过程辨认，不能只根据中文名称决定操作。

### 7.5.4 散列查找及性能分析的应用

#### 线性探测建表与成功ASL例子

表长 M=11，H(key)=key mod 11。按顺序插入：

```text
19，14，23，1，68，20，84，27
```

均为正整数，无删除标记，使用线性探测：

| 关键字 | 初始地址 | 最终位置 | 成功查找探测次数 |
|---|---|---|---|
| 19 | 8 | 8 | 1 |
| 14 | 3 | 3 | 1 |
| 23 | 1 | 1 | 1 |
| 1 | 1 | 2 | 2 |
| 68 | 2 | 4 | 3 |
| 20 | 9 | 9 | 1 |
| 84 | 7 | 7 | 1 |
| 27 | 5 | 5 | 1 |

```text
下标： 0    1   2   3   4   5    6    7   8   9   10
内容：空   23   1  14  68  27    空   84  19  20   空
```

8 个已存在 key 等概率被查，成功 ASL 为：

$$ASL_{成功}=\frac{1+1+1+2+3+1+1+1}{8}=\frac{11}{8}$$

α=8/11。无删除、无重建且探测规则相同，本例某条记录的插入探测次数等于其在最终表中的成功查找次数；经历重建或其他结构变化后应以当前表重新计算。

#### 线性探测失败ASL与删除标记例子

假设**未命中 key 的初始散列地址在 0～10 上等概率**，失败查询沿序列走到第一个 EMPTY，空槽访问也计一次：

| 初始地址 | 探测位置（终点为空） | 次数 |
|---|---|---|
| 0 | 0 | 1 |
| 1 | 1、2、3、4、5、6 | 6 |
| 2 | 2、3、4、5、6 | 5 |
| 3 | 3、4、5、6 | 4 |
| 4 | 4、5、6 | 3 |
| 5 | 5、6 | 2 |
| 6 | 6 | 1 |
| 7 | 7、8、9、10 | 4 |
| 8 | 8、9、10 | 3 |
| 9 | 9、10 | 2 |
| 10 | 10 | 1 |

$$ASL_{失败}=\frac{1+6+5+4+3+2+1+4+3+2+1}{11}=\frac{32}{11}$$

**失败平均分母是 11 个等概率初始地址，不是 8 条已存记录，也不是 3 个空槽。**如果 H 的值域只有 0～p−1 且这些地址等概率，分母应按 p；概率不均则加权。

删除 key=23（槽 1）后：

- 若错误改成 EMPTY，查找 key=1 从槽 1 出发立刻失败，尽管 key=1 还在槽 2。
- 正确改成 DELETED，查找 key=1 继续到槽 2 成功。
- 再插入 key=1，不能看见 DELETED 就立刻放入；必须先发现后方已有 key=1，拒绝重复。
- 该删除没有产生新的 EMPTY，因此失败探测次数仍与上表一致；实际记录数已从 8 变为 7。成功 ASL 则按剩余记录重新平均。

满表且无 EMPTY 时，失败探测 M 次结束；即使有 DELETED，也要用有限次数保证终止。

#### 链地址建表与两种ASL计数口径

使用同一批记录与函数，采用头插：

```text
桶1： 1 → 23
桶2： 68
桶3： 14
桶5： 27
桶7： 84
桶8： 19
桶9： 20
其余桶为空。
```

按本章“只数实际 key 比较”的口径：

- 成功：桶 1 两条记录的次数为 1、2，其余 6 条各 1 次；等概率成功 ASL=(1+2+6)/8=9/8。
- 失败：初始桶号 0～10 等概率，失败扫描该桶整条链；空桶 0 次。ASL=所有桶链长之和/11=8/11=α。

若题目把**访问桶数组也算一步**，则每次多 1：成功为 17/8，失败为 19/11。这是计数口径变化，并不意味着代码跳过了桶访问。

不均匀失败桶概率 qⱼ 时：

$$ASL_{失败}=\sum_{j=0}^{M-1}q_j\ell_j$$

其中 ℓⱼ 是第 j 条无序桶链长度。等概率成功时，各桶成功比较次数之和为 ℓⱼ(ℓⱼ+1)/2，因此：

$$ASL_{成功}=\frac1n\sum_{j=0}^{M-1}\frac{\ell_j(\ell_j+1)}2\quad(n>0)$$

空表没有“在已存记录中等概率成功查找”的分布，不能把 n=0 代入成功平均式。

#### 负载、聚集与复杂度结论

影响性能的是分布与冲突处理的共同作用。减少 α 通常有利，但不能单靠 α 从任意一张表算出精确 ASL。

| 结构／操作 | 常见期望 | 最坏情况 | 说明 |
|---|---|---|---|
| 开放定址精确查找、插入、删除 | 装填合理且散列良好时 O(1) | O(M) | 删除先查找；M 与 n 同数量级时常记 O(n) |
| 无序链地址查找、带查重插入、删除 | 均匀散列时 O(1+α) | O(n) | 同一桶可能包含全部记录 |
| 链地址清空 | O(M+n) | O(M+n) | 遍历桶数组与全部结点 |
| 散列表范围查询 | 一般需 O(M+n) 扫描 | 同左 | 无额外有序索引时，不能按 key 区间直接定位连续记录 |

扩展理解：大表、近似随机散列、没有删除标记的线性探测，常用近似为：

$$ASL_{成功}\approx\frac12\left(1+\frac1{1-\alpha}\right),\qquad
ASL_{失败}\approx\frac12\left(1+\frac1{(1-\alpha)^2}\right)$$

这不是任意有限表的精确公式，α<1；不能代替题目给定表格的逐项计数。采用理想均匀探测等其他模型时，公式也会不同。复习优先掌握**画表、复现序列、数比较或探测、明确概率、最后加权平均**。

## 本章综合回顾

### 查找结构选择与复杂度总表

| 结构 | 关键条件 | 查找 | 插入／删除 | 适用复习重点 |
|---|---|---|---|---|
| 无序顺序表 | 无序亦可 | O(n) | 保持顺序搬移时 O(n) | 哨兵、失败计数、概率优化 |
| 有序数组折半 | 有序且可随机访问 | O(log n) | O(n) | 区间边界、判定树、ASL |
| 分块查找 | 块间有序，块内可无序 | 顺序索引 O(b+s)；折半索引 O(log b+s) | 取决于块组织与维护规则 | 索引最大值、适用条件、最优块长 |
| 普通 BST | 左小右大 | O(h)，最坏 O(n) | O(h) | 构造次序、退化、双孩子删除 |
| AVL | 任一结点两子树高度差≤1 | 最坏 O(log n) | 最坏 O(log n) | LL/RR/LR/RL，删除向上修复 |
| 红黑树 | 红黑性质与相等黑高 | 最坏 O(log n) | 最坏 O(log n) | NIL、插删变色与旋转、实际删除颜色 |
| B 树 | 多路平衡、结点容量范围 | 固定阶 O(log n) | 固定阶 O(log n) | 结点内查找、分裂、借并、外存 |
| B+ 树 | 记录全在叶、叶链有序 | 单值 O(log n)，范围 O(log n+k) | 标准动态算法 O(log n) | 定义约定、索引更新、范围扫描 |
| 散列表 | 函数与冲突处理一致 | 良好条件下期望 O(1) | 良好条件下期望 O(1) | α、冲突、删除标记、成功/失败 ASL |

表中 B+ 树动态复杂度是标准增删算法的结论，**本章所给 `BuildBPlusSorted` 是 O(n) 的批量建立函数**。树中 n 是记录数；范围查询 k 是实际输出记录数。散列删除的常数时间预期包含先查找，不只是摘结点或改状态的那一步。

### ASL公式与适用条件速查

| 情况 | 公式／结论 | 条件 |
|---|---|---|
| 一般 ASL | ΣpᵢCᵢ | 明确成功/失败样本空间与计数规则 |
| 无序顺序成功 | (n+1)/2 | 每条记录等概率；无重复歧义 |
| 无哨兵顺序失败 | n | 比较全部 n 条实际记录 |
| 本章后向哨兵失败 | n+1 | 包括哨兵比较 |
| 有序顺序失败 | n(n+3)/[2(n+1)] | n+1 个失败间隙等概率，遇大即停 |
| 满判定树折半成功 | [(h−1)2ʰ+1]/(2ʰ−1) | n=2ʰ−1，每条记录等概率 |
| 满判定树折半失败 | h | 上述满树，各失败路径 h 次 |
| 等长分块成功 | (b+s)/2+1 | n=bs，顺序查索引，记录等概率 |
| 无序链地址失败 | α=n/M | 各桶等概率，只数实际 key 比较 |
| 无序链地址成功 | Σℓⱼ(ℓⱼ+1)/(2n) | 每条实际记录等概率，只数 key 比较 |
| 任意给定开放定址表 | 按每条探测路径加权 | 不能用 α 单独确定精确 ASL |

**解题模板：**写条件与概率 → 明确一次比较/探测怎么算 → 画结构或表 → 列每个样本的 C → 检查分母对应的样本个数 → 求和。

### 易错点与考点清单

- [ ] 查找失败的平均不能直接沿用成功的分母；空表的成功等概率平均未定义。
- [ ] 有序不是折半的充分条件，还要能高效按下标随机访问；普通链表不因此获得 O(log n) 的整体查找时间。
- [ ] 折半的 `mid`、左右边界和返回值规则一致；重复 key 的“任意一个”与“第一个”算法不同。
- [ ] 分块要求“前一块最大值 < 后一块最小值”，不只是索引最大值递增。
- [ ] 普通 BST 的平均／理想平衡情况不能当最坏 O(log n)；有序插入可退化。
- [ ] 树中两孩子删除复制整条记录，不能只换 key 而保留错误的 value。
- [ ] AVL 旋转名称说的是失衡路径；LL 用右旋、RR 用左旋。
- [ ] AVL 删除时孩子 BF=0 也可能要旋转；删除可在多个祖先处继续修复。
- [ ] 红黑树允许局部高度差大于 1；红结点的孩子黑，不要求黑结点的孩子红。
- [ ] 红黑删除看实际被移除位置的原颜色；NIL 哨兵的 parent 可能临时参与修复。
- [ ] B 树阶 m 是最大孩子数；非根最少关键字 ⌈m/2⌉−1；根可例外。
- [ ] B 树关键字上移后从孩子移除；B+ 树叶中记录保留。
- [ ] B+ 树先确定索引约定，再数内部关键字和孩子；所有单值成功查找都到叶。
- [ ] B+ 树最大 key 变化也要维护祖先索引，未分裂不代表不用更新。
- [ ] 开放定址删除保留标记，查找越过标记，插入复用前先确认无重复。
- [ ] 平方探测、双散列的覆盖性要由表长、增量序列和步长共同判断。
- [ ] H(key) 的合法值域、负数取模、整数溢出与终止条件都要检查。
- [ ] 散列的“期望常数时间”有前提，最坏情况可能线性；α 不唯一决定 ASL。
- [ ] 只改 value 可以原地进行；改 key 必须重新维护排序关系、索引或散列地址。

### 典型复习小题与解释

以下为自拟回顾题，不对应教材试题精选或官方答案。

1. **为什么有序链表不能直接套数组折半复杂度？**找到中间结点需走指针，单次定位不是 O(1)；按这种方式反复找中点，整体无法得到数组的 O(log n) 时间保证。
2. **7 条记录的成功查找为什么折半是 17/7，而顺序是 4？**折半判定树层数分布 1、2、4；加权和 1×1+2×2+4×3=17。顺序成本为 1～7，平均为 4。都假设记录等概率。
3. **AVL 插入发生 LR，为什么不能只做右旋？**新记录落在左孩子的右子树，单右旋不能恢复该局部高度关系；先对左孩子左旋，再对失衡祖先右旋。
4. **红黑树根为黑，是否能说明整棵树合法？**不能；还要检查红红相邻、各路径黑高相同和 NIL 黑等规则，同时仍须满足 BST 的顺序关系。
5. **5 阶 B 树非根至少几个关键字？5 阶本节 B+ 树分支至少几个索引关键字？**B 树 ⌈5/2⌉−1=2；本节 B+ 树分支至少 3 个孩子、配 3 个最大关键字索引。定义不同造成数量不同。
6. **为什么开放定址看见 DELETED 还要继续查？**后方可能仍有因先前冲突而放到远处的记录；DELETED 只能说明该槽可复用，不能证明目标不存在。
7. **链地址失败 ASL 能小于 1 吗？**只数实际 key 比较时可以，空桶不比较；把桶访问也计入则至少加 1。应说明口径，不能据此判断结果必错。
8. **查找结构是否有一种全面胜出？**没有。有序范围与磁盘页读取可偏向 B+ 树，动态有序内存结构可用平衡查找树，精确 key 查询可用散列，静态小表用顺序或折半即可；比较时把维护成本与最坏情况一起考虑。

### 使用说明与参考

本页按照用户提供的王道 2027 版第 7 章目录组织，表述、函数和复习算例为独立整理；没有书页全文，因此不声称逐字覆盖教材全部说明、题目或官方解析。

- [电子工业出版社：2027 数据结构考研复习指导](https://phei.com.cn/module/goods/wssd_content.jsp?bookid=68851)：版本与书目参考。
- [Virginia Tech OpenDSA：B Trees](https://opendsa-server.cs.vt.edu/ODSA/Books/pubbook/odsa-all/fall-2019/Public_Instance/html/BTree.html)：多路平衡查找树与外存索引延伸阅读；其中 B+ 树分隔符约定可能与本页最大关键字约定不同。
- [IISc：Red-black tree deletion](https://gtl.csa.iisc.ac.in/dsa/node117.html)：红黑删除修复的延伸说明。

返回 [[B00-查找导航|第7章导航]]。
