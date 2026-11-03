# 第5章 树与二叉树

> 面向 408 复习，按王道 2027 版及用户提供的章节目录组织。知识说明、函数和例子为独立整理，不摘录教材习题与答案。
>
> [[B00-树与二叉树导航|返回本章导航]]

## 本章约定与代码使用

- 根在第 **1 层**，非空树高度按最长根到叶路径上的**结点数**计；空树高度为 0。若题目按边数定义高度，非空树相差 1。
- 普通树的结点度是孩子数；图中的顶点度另有定义。普通树不预设左、右位置，二叉树明确区分左右子树。
- 顺序存储二叉树采用 1 基数组，双亲数组与并查集采用 0 基元素编号；各段会单独说明。
- 代码使用 C++ 的基础语法与 C 中的结构体、数组、指针、malloc/free，不使用 STL、类或模板。代码均嵌在 Markdown 中。
- 普通链式二叉树没有共享子树或环；结点值可重复。由遍历序列重建时，另要求结点标识唯一。
- 固定工作数组容量 `MAX_TREE_NODES=511`；相关迭代函数返回 false 表示容量不足或参数不合法。输出访问可能已部分执行，应事先确保容量足够。
- 动态构造失败会释放本次已建结点；构造输出指针要求先置为 NULL。已存在的树先销毁再重新构造。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

enum { MAX_TREE_NODES = 511 };
```

## 5.1 树的基本概念

### 5.1.1 树的定义

#### 树的递归定义与层次关系

树是 n 个结点组成的有限集合。空树 n=0；非空树满足：

1. 有唯一根结点。
2. 其余结点划分成若干互不相交的集合，每个集合又是一棵树，称为根的子树。

由定义可知：根没有双亲，每个非根结点恰有一个双亲；任意根到指定结点的路径唯一；子树之间不共享结点。

树描述一对多的层次关系。递归处理通常是“处理根 + 递归处理各子树”，空树是自然的终止情况。

**易错点：** 一个结点被两个不同双亲共同指向，或沿孩子指针能回到祖先，都不符合本章树的结构要求。

#### 有序树、无序树与森林

- 有序树：每个结点的子树之间有先后次序，交换次序一般得到不同的有序树。
- 无序树：不考虑兄弟子树之间的次序。
- 森林：若干棵互不相交的树的集合，也可以为空。
- 删去一棵非空树的根，根的各子树组成森林；给森林增加一个新根并把各树根作为它的孩子，可以得到一棵树。

遍历和孩子兄弟转换需要固定孩子及各棵树的排列顺序；即使原对象不强调顺序，算法也要先规定处理次序。

### 5.1.2 基本术语

#### 度、结点关系与路径

| 术语 | 含义 | 复习提醒 |
| --- | --- | --- |
| 结点的度 | 该结点的孩子数 | 叶结点度为 0 |
| 树的度 | 各结点度的最大值 | 不是结点度之和 |
| 叶结点 | 度为 0 的结点 | 根也可能是叶结点 |
| 分支结点 | 度大于 0 的结点 | 又称非终端结点 |
| 双亲、孩子 | 一条父子边连接的两个结点 | 每个非根结点双亲唯一 |
| 兄弟 | 同一双亲的孩子 | 不是同层就一定是兄弟 |
| 祖先、子孙 | 沿双亲或孩子关系可达的结点 | 是否包含自身看题目，一般不包含 |
| 路径 | 沿边连接的一串结点 | 树中两结点间简单路径唯一 |
| 路径长度 | 路径包含的边数 | h 个结点的链有 h-1 条边 |

一棵非空树总边数为 n-1。不要把“根到叶路径上的结点数”和“路径长度”写成同一个值。

#### 层次、高度与深度

- 结点层次：根为 1，它的孩子为 2，依次递增。
- 树高度：最大层次；本页单结点树高度为 1。
- 结点深度：本页按从根到该结点路径的结点数，等于层次；有些资料按边数，从 0 开始。
- 结点高度：以该结点为根的子树高度，叶结点高度为 1。

**例：** 根 A → 孩子 B → 孩子 C，树高 3；A 到 C 的路径长 2；C 的层次为 3、子树高度为 1。

### 5.1.3 树的性质

#### 总结点数、边数与叶结点公式

设非空树中度为 i 的结点数为 n_i，总结点数为 n，最大度为 d：

$$
n=\sum_{i=0}^{d}n_i,\qquad n-1=\sum_{i=1}^{d}i n_i
$$

原因：每个非根结点贡献一条双亲到自己的边；每条边又对应双亲的一个孩子。

消去 n：

$$
n_0=1+\sum_{i=2}^{d}(i-1)n_i
$$

度为 1 的结点不会增加叶结点数量。二叉树只允许度 0、1、2，因此得到 n_0=n_2+1。

**例：** 某树 n_1=3、n_2=2、n_3=1，则叶数为 `1+2+2×1=5`，总结点数 11，边数 `3+2×2+3×1=10`。

**易错点：** 空树不能代入 n-1 的边数公式；森林有 r 棵非空树时，总边数为 n-r，叶数公式的常数项相应为 r。

#### 度数上限、每层数量与高度界

若每个结点最多有 m 个孩子，m≥2：

$$
\text{第 }i\text{ 层至多 }m^{i-1}\text{ 个结点}
$$

$$
\text{高度为 }h\text{ 时至多 }1+m+\cdots+m^{h-1}
=\frac{m^h-1}{m-1}\text{ 个结点}
$$

因此有 n 个结点的这类树的最小可能高度为：

$$
h_{min}=\left\lceil\log_m\bigl(n(m-1)+1\bigr)\right\rceil
$$

允许每个结点只带一个孩子时，最大高度为 n。m=1 要单独处理，非空树只能是链，高度就是 n；不能把 m=1 代入分母 m-1 或对数底数。

#### 度为m与每个分支有m个孩子的区别

看到“m 叉树”“度为 m 的树”先确认题目的精确定义：

| 条件 | 可以推出什么 |
| --- | --- |
| 每个结点度不超过 m | 不必存在度恰为 m 的结点，可以是一条链 |
| 树的度恰为 m | 至少有一个结点有 m 个孩子，其他分支可少于 m |
| 每个非叶结点恰有 m 个孩子 | 若分支数 I，则 n=mI+1、叶数 L=(m-1)I+1 |

对树的度**恰为 m≥1**、高度 h≥2 的树，至少需要 `h+m-1` 个结点：先有长 h 的根到叶链，再为链上某个分支增加 m-1 个孩子。等价地，给定 n≥m+1，其最大高度为 n-m+1。

只有“每个分支恰有 m 个孩子”才能直接令 n=mI+1。仅知道树的最大度为 m 不足以这样计算。

## 5.2 二叉树的概念

### 5.2.1 二叉树的定义及其主要特性

#### 二叉树与度为2的普通树

二叉树是空树，或由一个根和两棵互不相交的左右二叉子树组成。每个结点最多有两个孩子，并且**左右位置固定**。

- 二叉树可为空，也可只有一个结点，不要求实际出现度为 2 的结点。
- 只有一个孩子时，左孩子和右孩子是不同结构。
- 普通有序树的“第一个孩子”与二叉树的“左孩子位置”并不完全相同：普通有序树只有一个孩子时，没有额外的左右空位区别。

**最小例子：** A 只有左孩子 B，与 A 只有右孩子 B，是两棵不同二叉树，尽管先序都为 AB，后序都为 BA。

#### 满二叉树、完全二叉树与常见结构

| 类型 | 定义或特点 | 关键判断 |
| --- | --- | --- |
| 满二叉树（本章通常用法） | 高 h、结点数 2^h-1，各层均满 | 叶均在第 h 层，非叶均有两个孩子 |
| 完全二叉树 | 与同高满二叉树的前 n 个层序位置一一对应 | 除最末层外均满，末层从左到右连续排列 |
| 斜树 | 非叶结点都只有一个孩子 | 高度可为 n |
| 每个非叶结点有两个孩子的二叉树 | 可称严格/正则二叉树，名称需看材料 | 叶不必同层，不一定是本章的满二叉树 |

满二叉树一定完全；完全二叉树不一定满。单结点树同时满足满与完全；以下数量公式对非空树讨论。

**完全二叉树判断：** 按层序从左到右看位置，一旦出现空位，后面不能再出现结点。不能有“无左孩子却有右孩子”的结点；有左孩子、无右孩子的结点最多一个，而且它的左孩子必须为叶。

#### 二叉树的数量性质

1. 第 i 层最多 $2^{i-1}$ 个结点。
2. 高 h 的二叉树最多 $2^h-1$ 个结点，最少 h 个结点。
3. n 个结点的二叉树，高度满足：

$$
\left\lceil\log_2(n+1)\right\rceil\le h\le n
$$

4. 对任何非空二叉树：

$$
n_0=n_2+1,\qquad n=n_0+n_1+n_2=2n_2+n_1+1
$$

5. n 个链式结点共 2n 个孩子指针，真实父子边占 n-1 个，所以空孩子指针共 n+1 个。这也是线索化可利用的空间。

**例：** n=20、n_1=5，则 n_2=(20-5-1)/2=7，n_0=8。若得到分数或负数，条件不可能构成合法二叉树。

#### 完全二叉树的编号与结点个数

按层序从 1 到 n 编号：

| 对编号 i 的结点 | 条件与编号 |
| --- | --- |
| 双亲 | i>1 时为 ⌊i/2⌋ |
| 左孩子 | 2i≤n 时为 2i，否则不存在 |
| 右孩子 | 2i+1≤n 时为 2i+1，否则不存在 |
| 叶结点 | ⌊n/2⌋+1 到 n |
| 非叶结点 | 1 到 ⌊n/2⌋ |

非空完全二叉树：

$$
h=\lfloor\log_2 n\rfloor+1=\lceil\log_2(n+1)\rceil
$$

$$
n_0=\lceil n/2\rceil,\quad n_2=\lfloor(n-1)/2\rfloor,
\quad n_1=\begin{cases}0,&n\text{ 为奇数}\\1,&n\text{ 为偶数}\end{cases}
$$

高为 h 的完全二叉树：$2^{h-1}\le n\le2^h-1$。偶数 n 时，唯一度为 1 的结点是编号 n/2，它只有左孩子。

**例：** n=10 时高 4，叶编号 6..10，n_0=5、n_1=1、n_2=4；末层结点数 `10-(2^3-1)=3`。

#### 二叉树结构数量的补充

n 个结点、左右有别的二叉树结构数量为 Catalan 数：

$$
C_n=\frac{1}{n+1}\binom{2n}{n},\quad C_0=1
$$

递推来自按左子树结点数分组：$C_n=\sum_{k=0}^{n-1}C_kC_{n-1-k}$。n=0、1、2、3 时分别为 1、1、2、5。

它数的是结构，不是额外给 n 个不同结点任意排列标签后的数量，也不是完全二叉树的种数。固定 n 的完全二叉树结构唯一。

### 5.2.2 二叉树的存储结构

#### 顺序存储与位置空洞

以同高满二叉树的位置编号放入数组；对任意二叉树可以保留空位，从而维持双亲与左右孩子的编号关系。

```cpp
typedef struct {
    char data[MAX_TREE_NODES + 1];
    bool used[MAX_TREE_NODES + 1];
} SeqBiTree;

void InitSeqBiTree(SeqBiTree *T) {
    for (int i = 0; i <= MAX_TREE_NODES; ++i) {
        T->used[i] = false;
    }
}

bool SeqGet(const SeqBiTree *T, int i, char *out) {
    if (T == NULL || out == NULL || i < 1 || i > MAX_TREE_NODES ||
        !T->used[i]) {
        return false;
    }
    *out = T->data[i];
    return true;
}

bool SeqSet(SeqBiTree *T, int i, char value) {
    if (T == NULL || i < 1 || i > MAX_TREE_NODES) {
        return false;
    }
    // 除根外，所在位置的双亲必须存在。
    if (i > 1 && !T->used[i / 2]) {
        return false;
    }
    T->data[i] = value;
    T->used[i] = true;
    return true;
}

void SeqDeleteSubtree(SeqBiTree *T, int i) {
    if (T == NULL || i < 1 || i > MAX_TREE_NODES || !T->used[i]) {
        return;
    }
    if (i <= MAX_TREE_NODES / 2) {
        SeqDeleteSubtree(T, 2 * i);
    }
    if (i <= (MAX_TREE_NODES - 1) / 2) {
        SeqDeleteSubtree(T, 2 * i + 1);
    }
    T->used[i] = false;
}
```

used 区分“没有结点”和“结点值恰好为某字符”，不依赖特殊字符作为空位。完全二叉树使用前 n 个位置，空间 $O(n)$；右斜树高 h 时最深位置为 $2^h-1$，即使只有 h 个结点也可能要求指数级位置范围。

**易错点：** 一般二叉树若把空位删掉后紧凑排列，就不能继续使用 2i、2i+1 查孩子；数组顺序存放也不能自动说明它是完全二叉树。

#### 二叉链表与三叉链表

```cpp
typedef struct BiNode {
    char data;
    struct BiNode *lchild;
    struct BiNode *rchild;
} BiNode, *BiTree;

BiTree NewBiNode(char value) {
    BiTree p = (BiTree)malloc(sizeof(BiNode));
    if (p == NULL) { return NULL; }
    p->data = value;
    p->lchild = NULL;
    p->rchild = NULL;
    return p;
}

void DestroyBiTree(BiTree *T) {
    if (T == NULL || *T == NULL) { return; }
    DestroyBiTree(&(*T)->lchild);
    DestroyBiTree(&(*T)->rchild);
    free(*T);
    *T = NULL;
}

typedef struct TriNode {
    char data;
    struct TriNode *lchild;
    struct TriNode *rchild;
    struct TriNode *parent;
} TriNode;
```

二叉链表按实际结点申请空间，找左右孩子方便；只有根指针和孩子指针时，从任意结点找双亲通常要从根查找。三叉链表增加 parent 指针，方便向上走，但创建、插删、镜像时要维护双亲关系。

两者均不能由“结点值”自动得到结点位置；一般二叉树查找值仍需要遍历。

#### 普通二叉树的查找、修改与插删

```cpp
// 先序找到第一个值为 value 的结点，允许值重复。
BiTree FindBiNode(BiTree T, char value) {
    if (T == NULL || T->data == value) { return T; }
    BiTree p = FindBiNode(T->lchild, value);
    if (p != NULL) { return p; }
    return FindBiNode(T->rchild, value);
}

bool UpdateBiValue(BiTree p, char value) {
    if (p == NULL) { return false; }
    p->data = value;
    return true;
}

// 只在指定空孩子位置插入新叶，不挤走原子树。
bool InsertBiLeaf(BiTree parent, bool asLeft, char value) {
    if (parent == NULL) { return false; }
    BiTree *slot = asLeft ? &parent->lchild : &parent->rchild;
    if (*slot != NULL) { return false; }
    BiTree p = NewBiNode(value);
    if (p == NULL) { return false; }
    *slot = p;
    return true;
}

bool DeleteBiChildSubtree(BiTree parent, bool leftSide) {
    if (parent == NULL) { return false; }
    BiTree *slot = leftSide ? &parent->lchild : &parent->rchild;
    DestroyBiTree(slot);
    return true;
}
```

普通二叉树没有“左边值小、右边值大”的默认性质。本章插入和删除明确指定结构位置；二叉排序树的按关键字插删在查找章节讨论。

给定结点指针后改值和插叶为 $O(1)$；按值定位最坏 $O(n)$；删除含 k 个结点的子树为 $O(k)$，递归辅助空间取决于该子树高度。销毁后原子树内的外部指针失效。

## 5.3 二叉树的遍历和线索二叉树

### 5.3.1 二叉树的遍历

#### 四种遍历顺序与统一例子

设 D 表示访问根，L、R 表示遍历左右子树：先序 DLR，中序 LDR，后序 LRD。层序从根开始，按层从左到右。

本节统一例子：

```text
        A
       / \
      B   C
     / \   \
    D   E   F
```

| 遍历 | 结果 | 用途提示 |
| --- | --- | --- |
| 先序 | ABDECF | 先处理根，带空标记时可序列化结构 |
| 中序 | DBEACF | 左、根、右；排序意义需要额外的排序树性质 |
| 后序 | DEBFCA | 先得到子树结果再处理根，适合求高和释放 |
| 层序 | ABCDEF | 使用队列，适合逐层统计和完整性判断 |

**易错点：** 先序不是“先沿左边到底后任意处理其他结点”；每个子树都必须遵守同一递归规则。普通二叉树的中序结果不保证有序。

#### 递归遍历函数

```cpp
void VisitBiNode(BiTree p) {
    printf("%c", p->data);
}

void PreOrder(BiTree T) {
    if (T == NULL) { return; }
    VisitBiNode(T);
    PreOrder(T->lchild);
    PreOrder(T->rchild);
}

void InOrder(BiTree T) {
    if (T == NULL) { return; }
    InOrder(T->lchild);
    VisitBiNode(T);
    InOrder(T->rchild);
}

void PostOrder(BiTree T) {
    if (T == NULL) { return; }
    PostOrder(T->lchild);
    PostOrder(T->rchild);
    VisitBiNode(T);
}
```

访问每个实际结点一次，时间 $O(n)$；递归栈 $O(h)$，平衡形态约 $O(\log n)$，斜树最坏 $O(n)$。不能把递归调用栈遗漏而写成辅助空间 $O(1)$。

#### 非递归遍历的栈与队列工具

```cpp
typedef struct {
    BiTree data[MAX_TREE_NODES];
    int top; // 已存数量，也是下一个入栈下标。
} BiStack;

void InitBiStack(BiStack *S) { S->top = 0; }

bool PushBiStack(BiStack *S, BiTree p) {
    if (S->top == MAX_TREE_NODES) { return false; }
    S->data[S->top++] = p;
    return true;
}

BiTree PopBiStack(BiStack *S) {
    if (S->top == 0) { return NULL; }
    return S->data[--S->top];
}

BiTree PeekBiStack(const BiStack *S) {
    if (S->top == 0) { return NULL; }
    return S->data[S->top - 1];
}

typedef struct {
    BiTree data[MAX_TREE_NODES];
    int front;
    int rear;
    int count;
} BiQueue;

void InitBiQueue(BiQueue *Q) {
    Q->front = 0;
    Q->rear = 0;
    Q->count = 0;
}

bool EnqueueBi(BiQueue *Q, BiTree p) {
    if (Q->count == MAX_TREE_NODES) { return false; }
    Q->data[Q->rear] = p;
    Q->rear = (Q->rear + 1) % MAX_TREE_NODES;
    ++Q->count;
    return true;
}

BiTree DequeueBi(BiQueue *Q) {
    if (Q->count == 0) { return NULL; }
    BiTree p = Q->data[Q->front];
    Q->front = (Q->front + 1) % MAX_TREE_NODES;
    --Q->count;
    return p;
}
```

只把非空结点放入这组工具；通过 top、count 判断空。队列使用 count 区分满与空，不牺牲一个数组单元。

#### 非递归先序与中序遍历

```cpp
bool PreOrderIter(BiTree T) {
    BiStack S;
    InitBiStack(&S);
    if (T != NULL && !PushBiStack(&S, T)) { return false; }
    while (S.top > 0) {
        BiTree p = PopBiStack(&S);
        VisitBiNode(p);
        // 后进先出，要先压右，再压左。
        if (p->rchild != NULL && !PushBiStack(&S, p->rchild)) {
            return false;
        }
        if (p->lchild != NULL && !PushBiStack(&S, p->lchild)) {
            return false;
        }
    }
    return true;
}

bool InOrderIter(BiTree T) {
    BiStack S;
    InitBiStack(&S);
    BiTree p = T;
    while (p != NULL || S.top > 0) {
        if (p != NULL) {
            if (!PushBiStack(&S, p)) { return false; }
            p = p->lchild;
        } else {
            p = PopBiStack(&S);
            VisitBiNode(p);
            p = p->rchild;
        }
    }
    return true;
}
```

先序访问后把后续子树保存起来；中序在第一次到达结点时暂不访问，先入栈等左子树完成。两者时间 $O(n)$，所需栈容量最坏按高度为 $O(h)$；具体实现的局部数组固定预留 MAX_TREE_NODES 个单元。

#### 单栈非递归后序遍历

```cpp
bool PostOrderIter(BiTree T) {
    BiStack S;
    InitBiStack(&S);
    BiTree p = T;
    BiTree lastVisited = NULL;
    while (p != NULL || S.top > 0) {
        if (p != NULL) {
            if (!PushBiStack(&S, p)) { return false; }
            p = p->lchild;
        } else {
            BiTree q = PeekBiStack(&S);
            if (q->rchild != NULL && lastVisited != q->rchild) {
                p = q->rchild;
            } else {
                VisitBiNode(q);
                lastVisited = PopBiStack(&S);
            }
        }
    }
    return true;
}
```

只有“右子树为空”或“右子树的根刚作为最后访问结点”时，才能访问栈顶根。后序访问完右子树时，它的根最后访问，因此 lastVisited 可判定其已经完成。

**易错点：** lastVisited 保存结点地址，不能只保存值；不同结点可能同值。不能在右子树处理前弹出根而丢失返回位置。时间 $O(n)$，所需栈 $O(h)$。

#### 层序遍历与逐层统计

```cpp
bool LevelOrder(BiTree T) {
    BiQueue Q;
    InitBiQueue(&Q);
    if (T != NULL && !EnqueueBi(&Q, T)) { return false; }
    while (Q.count > 0) {
        BiTree p = DequeueBi(&Q);
        VisitBiNode(p);
        if (p->lchild != NULL && !EnqueueBi(&Q, p->lchild)) {
            return false;
        }
        if (p->rchild != NULL && !EnqueueBi(&Q, p->rchild)) {
            return false;
        }
    }
    return true;
}

bool GetTreeWidth(BiTree T, int *width) {
    if (width == NULL) { return false; }
    BiQueue Q;
    InitBiQueue(&Q);
    int maximum = 0;
    if (T != NULL && !EnqueueBi(&Q, T)) { return false; }
    while (Q.count > 0) {
        int levelCount = Q.count;
        if (levelCount > maximum) { maximum = levelCount; }
        for (int k = 0; k < levelCount; ++k) {
            BiTree p = DequeueBi(&Q);
            if (p->lchild != NULL && !EnqueueBi(&Q, p->lchild)) {
                return false;
            }
            if (p->rchild != NULL && !EnqueueBi(&Q, p->rchild)) {
                return false;
            }
        }
    }
    *width = maximum;
    return true;
}
```

进入每轮先固定当前层数量，再只取这些结点，之后新入队的是下一层。本例各层数量 1、2、3，宽度为 3。

层序时间 $O(n)$，所需队列空间 $O(w)$，w 为最大层宽；处理中队列可能同时保存两层的部分结点，但数量上界仍是层宽的常数倍，最坏 $O(n)$。固定数组的实际预分配空间仍按容量计算。

#### 求高、计数、镜像与结构比较

```cpp
int BiHeight(BiTree T) {
    if (T == NULL) { return 0; }
    int left = BiHeight(T->lchild);
    int right = BiHeight(T->rchild);
    return (left > right ? left : right) + 1;
}

int CountBiNodes(BiTree T) {
    if (T == NULL) { return 0; }
    return 1 + CountBiNodes(T->lchild) + CountBiNodes(T->rchild);
}

int CountBiLeaves(BiTree T) {
    if (T == NULL) { return 0; }
    if (T->lchild == NULL && T->rchild == NULL) { return 1; }
    return CountBiLeaves(T->lchild) + CountBiLeaves(T->rchild);
}

int CountDegreeTwo(BiTree T) {
    if (T == NULL) { return 0; }
    int here = T->lchild != NULL && T->rchild != NULL ? 1 : 0;
    return here + CountDegreeTwo(T->lchild) + CountDegreeTwo(T->rchild);
}

void MirrorBiTree(BiTree T) {
    if (T == NULL) { return; }
    BiTree temp = T->lchild;
    T->lchild = T->rchild;
    T->rchild = temp;
    MirrorBiTree(T->lchild);
    MirrorBiTree(T->rchild);
}

bool SameBiTree(BiTree A, BiTree B) {
    if (A == NULL || B == NULL) { return A == B; }
    return A->data == B->data &&
           SameBiTree(A->lchild, B->lchild) &&
           SameBiTree(A->rchild, B->rchild);
}
```

都按子树分解；求高、计数、镜像为 $O(n)$ 时间、$O(h)$ 递归空间。SameBiTree 可能提前返回，完整相同情况下访问所有对应结点。

本例 n=6、高 3、叶 3、度为 2 的结点 2，验证 `3=2+1`。只比较遍历序列可能不能判断结构相同，SameBiTree 同时比较空位、左右位置和结点值。

#### 完全二叉树的层序判定函数

```cpp
// 返回值表示执行是否成功；isComplete 单独输出判断结果。
bool CheckComplete(BiTree T, bool *isComplete) {
    if (isComplete == NULL) { return false; }
    BiQueue Q;
    InitBiQueue(&Q);
    bool seenGap = false;
    if (T != NULL && !EnqueueBi(&Q, T)) { return false; }
    while (Q.count > 0) {
        BiTree p = DequeueBi(&Q);
        BiTree child[2] = { p->lchild, p->rchild };
        for (int k = 0; k < 2; ++k) {
            if (child[k] == NULL) {
                seenGap = true;
            } else {
                if (seenGap) {
                    *isComplete = false;
                    return true;
                }
                if (!EnqueueBi(&Q, child[k])) { return false; }
            }
        }
    }
    *isComplete = true; // 本接口把空树也视为满足完整性条件。
    return true;
}
```

按左右顺序检查每个孩子位置，出现第一个空孩子位置后，只要再见到非空孩子，就不完全。本例 C 无左孩子却有右孩子 F，因此不完全。时间 $O(n)$，所需队列 $O(w)$。

#### 祖先路径与最近公共祖先

```cpp
// path 从根起记录结点地址，调用前 *length=0；容量至少为树高。
bool FindBiPath(BiTree T, BiTree target, BiTree path[],
                int capacity, int *length) {
    if (T == NULL || target == NULL) { return false; }
    if (*length == capacity) { return false; }
    path[(*length)++] = T;
    if (T == target) { return true; }
    if (FindBiPath(T->lchild, target, path, capacity, length) ||
        FindBiPath(T->rchild, target, path, capacity, length)) {
        return true;
    }
    --*length;
    return false;
}

BiTree LowestCommonAncestor(BiTree T, BiTree a, BiTree b) {
    if (a == NULL || b == NULL) { return NULL; }
    BiTree pa[MAX_TREE_NODES];
    BiTree pb[MAX_TREE_NODES];
    int na = 0;
    int nb = 0;
    if (!FindBiPath(T, a, pa, MAX_TREE_NODES, &na) ||
        !FindBiPath(T, b, pb, MAX_TREE_NODES, &nb)) {
        return NULL;
    }
    BiTree answer = NULL;
    for (int i = 0; i < na && i < nb && pa[i] == pb[i]; ++i) {
        answer = pa[i];
    }
    return answer;
}
```

路径最后一个公共结点就是最近公共祖先。本例 D、E 为 B；D、F 为 A；如果一个目标本身是另一个的祖先，就返回该祖先。按地址区分结点，两个目标必须都在树中。寻找路径最坏 $O(n)$；路径有效长度与递归栈 $O(h)$，代码固定预留数组容量。

#### 带空标记的先序序列建树

仅给先序序列不能唯一恢复一般二叉树；加入空子树标记就可以。约定 `#` 不作为真实结点值。

本例的带空标记先序是 `ABD##E##C#F##`，含 n 个结点字符和 n+1 个空标记，共 2n+1 个标记。

```cpp
BiTree ReadPreMarked(const char seq[], int size, int *pos, bool *ok) {
    if (!*ok) { return NULL; }
    if (*pos >= size) { *ok = false; return NULL; }
    char c = seq[(*pos)++];
    if (c == '#') { return NULL; }
    BiTree p = NewBiNode(c);
    if (p == NULL) { *ok = false; return NULL; }
    p->lchild = ReadPreMarked(seq, size, pos, ok);
    p->rchild = ReadPreMarked(seq, size, pos, ok);
    if (!*ok) { DestroyBiTree(&p); }
    return p;
}

bool BuildPreMarked(const char seq[], int size, BiTree *out) {
    if (seq == NULL || size < 1 || out == NULL || *out != NULL) {
        return false;
    }
    int pos = 0;
    bool ok = true;
    BiTree T = ReadPreMarked(seq, size, &pos, &ok);
    if (!ok || pos != size) {
        DestroyBiTree(&T);
        return false;
    }
    *out = T;
    return true;
}
```

size 是输入标记数量，不包括 C 字符串末尾的 `\0`。单个 `#` 表示空树；缺少空标记或尾部多余标记会失败。每个标记只读取一次，时间 $O(n)$，递归栈 $O(h)$。

#### 用遍历序列重建二叉树的条件

在结点标识各不相同的前提下：

| 已知序列 | 一般二叉树能否唯一重建 | 原因 |
| --- | --- | --- |
| 先序 + 中序 | 能 | 先序首项是根，中序划分左右 |
| 后序 + 中序 | 能 | 后序末项是根，中序划分左右 |
| 层序 + 中序 | 能 | 当前子集层序最先出现的是根，再按中序划分 |
| 先序 + 后序 | 一般不能 | 一个孩子时无法确定它在左还是右 |
| 单一未带空标记的序列 | 一般不能 | 缺少结构信息 |

**例：** 先序 AB、后序 BA，对应 A 的左孩子为 B 或右孩子为 B。若额外保证每个非叶结点都有两个孩子，且标识唯一，先序与后序可以唯一重建，但这是增加结构限制后的结论。

值重复时，根在中序中的位置可能不唯一；不能不加条件地说“两种遍历一定唯一”。

#### 先序或后序加中序重建的函数

```cpp
// 一个 char 作为一个唯一标识；检查重复以及两组元素是否相同。
bool ValidTraversalPair(const char a[], const char in[], int n) {
    bool sa[UCHAR_MAX + 1] = { false };
    bool si[UCHAR_MAX + 1] = { false };
    for (int i = 0; i < n; ++i) {
        unsigned char x = (unsigned char)a[i];
        unsigned char y = (unsigned char)in[i];
        if (sa[x] || si[y]) { return false; }
        sa[x] = true;
        si[y] = true;
    }
    for (int i = 0; i <= UCHAR_MAX; ++i) {
        if (sa[i] != si[i]) { return false; }
    }
    return true;
}

// order 为当前子树的先序或后序区间，in 为其中序区间。
BiTree RebuildWithIn(const char order[], const char in[], int n,
                     bool usePostOrder, bool *ok) {
    if (!*ok || n == 0) { return NULL; }
    char root = order[usePostOrder ? n - 1 : 0];
    int k = 0;
    while (k < n && in[k] != root) { ++k; }
    if (k == n) { *ok = false; return NULL; }
    BiTree p = NewBiNode(root);
    if (p == NULL) { *ok = false; return NULL; }
    int first = usePostOrder ? 0 : 1;
    p->lchild = RebuildWithIn(order + first, in, k, usePostOrder, ok);
    p->rchild = RebuildWithIn(order + first + k, in + k + 1,
                             n - k - 1, usePostOrder, ok);
    if (!*ok) { DestroyBiTree(&p); }
    return p;
}

bool BuildWithIn(const char order[], const char in[], int n,
                  bool usePostOrder, BiTree *out) {
    if (n < 0 || out == NULL || *out != NULL ||
        (n > 0 && (order == NULL || in == NULL))) {
        return false;
    }
    if (!ValidTraversalPair(order, in, n)) { return false; }
    bool ok = true;
    BiTree T = RebuildWithIn(order, in, n, usePostOrder, &ok);
    if (!ok) { DestroyBiTree(&T); return false; }
    *out = T;
    return true;
}
```

调用 `BuildWithIn("ABDECF", "DBEACF", 6, false, &T)` 或 `BuildWithIn("DEBFCA", "DBEACF", 6, true, &T)`，T 事先为 NULL，重建本例。n=0 可生成空树。

每次线性查根位置，最坏时间 $O(n^2)$；递归栈 $O(h)$，新树本身 $O(n)$。预先建立“标识 → 中序位置”表可以把查根改成 $O(1)$，总构造时间降为 $O(n)$。本接口用单字节唯一标识，因此实际不同标识数受字符取值范围限制。

#### 表达式树与遍历结果

二元表达式树的叶为操作数，内部结点为运算符。`(a+b)*c` 的根是 `*`，左子树根为 `+`，右子树为 c。

- 先序：`*+abc`，对应前缀表达式。
- 后序：`ab+c*`，对应后缀表达式。
- 普通中序：`a+b*c`，**丢失必要括号**；还原原表达式要输出括号。

```cpp
// 前提：叶为单字符操作数，每个非叶都是二元运算符。
void PrintInfixExpression(BiTree T) {
    if (T == NULL) { return; }
    bool isLeaf = T->lchild == NULL && T->rchild == NULL;
    if (!isLeaf) { printf("("); }
    PrintInfixExpression(T->lchild);
    printf("%c", T->data);
    PrintInfixExpression(T->rchild);
    if (!isLeaf) { printf(")"); }
}
```

输出 `((a+b)*c)`，外层括号可以另行省略。表达式求值通常用后序思想，先求左右操作数再计算当前运算符。

### 5.3.2 线索二叉树

#### 线索的目的、标志与限制

遍历序列中，每个结点有前驱、后继关系；普通孩子指针只表达结构，不能直接表达这些遍历邻接关系。线索化利用空孩子指针：

- 原空左指针改指向指定遍历序列中的前驱，ltag=1。
- 原空右指针改指向指定遍历序列中的后继，rtag=1。
- 原本存在孩子的指针保持孩子语义，tag=0。

同一棵树按先序、中序、后序线索化，所得线索不同；必须知道采用哪种顺序。

**易错点：** 不是每个结点都同时保存前驱和后继。某结点有真实左右孩子时，其两个指针都保留孩子，找遍历前驱或后继仍可能要沿子树或寻找双亲。

```cpp
enum { LINK_TAG = 0, THREAD_TAG = 1 };

typedef struct TNode {
    char data;
    struct TNode *lchild;
    struct TNode *rchild;
    int ltag;
    int rtag;
} TNode, *ThreadTree;

// 只沿真实孩子销毁，不能沿线索递归。
void DestroyThreadTree(ThreadTree *T) {
    if (T == NULL || *T == NULL) { return; }
    if ((*T)->ltag == LINK_TAG) { DestroyThreadTree(&(*T)->lchild); }
    if ((*T)->rtag == LINK_TAG) { DestroyThreadTree(&(*T)->rchild); }
    free(*T);
    *T = NULL;
}

ThreadTree CopyToThreadNodes(BiTree T, bool *ok) {
    if (!*ok || T == NULL) { return NULL; }
    ThreadTree p = (ThreadTree)malloc(sizeof(TNode));
    if (p == NULL) { *ok = false; return NULL; }
    p->data = T->data;
    p->ltag = LINK_TAG;
    p->rtag = LINK_TAG;
    p->lchild = NULL;
    p->rchild = NULL;
    p->lchild = CopyToThreadNodes(T->lchild, ok);
    p->rchild = CopyToThreadNodes(T->rchild, ok);
    if (!*ok) { DestroyThreadTree(&p); }
    return p;
}
```

普通 BiNode 与带 tag 的 TNode 是两种不同类型，不能强制转换后当作同一种结点操作。复制构造可保留原树；复制所需新结点空间 $O(n)$。

#### 三种线索化的统一访问动作

本页实现**不带头结点**的线索树；遍历首项的空左线索为 NULL，末项若有空右指针，则设右线索为 NULL。

```cpp
// pre 是当前遍历序列中刚刚访问的前一个结点。
void ThreadVisit(ThreadTree p, ThreadTree *pre) {
    if (p->lchild == NULL) {
        p->ltag = THREAD_TAG;
        p->lchild = *pre;
    }
    if (*pre != NULL && (*pre)->rchild == NULL) {
        (*pre)->rtag = THREAD_TAG;
        (*pre)->rchild = p;
    }
    *pre = p;
}

void InThread(ThreadTree T, ThreadTree *pre) {
    if (T == NULL) { return; }
    if (T->ltag == LINK_TAG) { InThread(T->lchild, pre); }
    ThreadVisit(T, pre);
    if (T->rtag == LINK_TAG) { InThread(T->rchild, pre); }
}

void PreThread(ThreadTree T, ThreadTree *pre) {
    if (T == NULL) { return; }
    ThreadVisit(T, pre);
    if (T->ltag == LINK_TAG) { PreThread(T->lchild, pre); }
    if (T->rtag == LINK_TAG) { PreThread(T->rchild, pre); }
}

void PostThread(ThreadTree T, ThreadTree *pre) {
    if (T == NULL) { return; }
    if (T->ltag == LINK_TAG) { PostThread(T->lchild, pre); }
    if (T->rtag == LINK_TAG) { PostThread(T->rchild, pre); }
    ThreadVisit(T, pre);
}

// 前提：T 是未线索化的合法 TNode 树，所有 tag 初始为 0。
// order=0 先序，1 中序，2 后序。
bool CreateThreads(ThreadTree T, int order) {
    if (order < 0 || order > 2) { return false; }
    ThreadTree pre = NULL;
    if (order == 0) { PreThread(T, &pre); }
    if (order == 1) { InThread(T, &pre); }
    if (order == 2) { PostThread(T, &pre); }
    if (pre != NULL && pre->rchild == NULL) {
        pre->rtag = THREAD_TAG;
        pre->rchild = NULL;
    }
    return true;
}

bool MakeThreadTree(BiTree T, int order, ThreadTree *out) {
    if (out == NULL || *out != NULL || order < 0 || order > 2) {
        return false;
    }
    bool ok = true;
    ThreadTree copy = CopyToThreadNodes(T, &ok);
    if (!ok) { return false; }
    CreateThreads(copy, order);
    *out = copy;
    return true;
}
```

pre 必须随递归持续更新，不能每层递归都重新初始化。首结点之前 pre=NULL，所以不能直接访问 `pre->rchild`。

先序在线索化当前结点后再递归，左空指针可能已经改为前驱；必须看 tag 才能递归。后序最后访问根，根若有真实右孩子就不能把该指针改为 NULL 或终止线索。

线索化时间 $O(n)$，递归空间 $O(h)$；它利用的是原空指针，另增加标志字段，并没有消除线索化过程中使用的递归栈。

#### 中序线索的前驱、后继与遍历

```cpp
ThreadTree FirstInNode(ThreadTree T) {
    if (T == NULL) { return NULL; }
    while (T->ltag == LINK_TAG && T->lchild != NULL) {
        T = T->lchild;
    }
    return T;
}

ThreadTree LastInNode(ThreadTree T) {
    if (T == NULL) { return NULL; }
    while (T->rtag == LINK_TAG && T->rchild != NULL) {
        T = T->rchild;
    }
    return T;
}

ThreadTree NextInNode(ThreadTree p) {
    if (p == NULL) { return NULL; }
    if (p->rtag == THREAD_TAG) { return p->rchild; }
    return FirstInNode(p->rchild);
}

ThreadTree PrevInNode(ThreadTree p) {
    if (p == NULL) { return NULL; }
    if (p->ltag == THREAD_TAG) { return p->lchild; }
    return LastInNode(p->lchild);
}

void InOrderThreaded(ThreadTree T) {
    for (ThreadTree p = FirstInNode(T); p != NULL; p = NextInNode(p)) {
        printf("%c", p->data);
    }
}

void ReverseInOrderThreaded(ThreadTree T) {
    for (ThreadTree p = LastInNode(T); p != NULL; p = PrevInNode(p)) {
        printf("%c", p->data);
    }
}
```

中序后继：有右线索就直接取；有真实右子树则取其最左结点。前驱左右对称。

本例中序 `DBEACF`：D 的前驱 NULL、后继 B；E 的前驱 B、后继 A；A 有真实右孩子 C，其后继是右子树最左结点 C；F 的后继 NULL。

单次查前驱/后继可能沿子树走 $O(h)$；完整中序线索遍历总时间 $O(n)$，辅助空间 $O(1)$。不能因为有线索，就说任意结点的任意邻接查找都严格为 $O(1)$。

#### 中序带头结点的教材约定

常见中序线索树额外设置一个头结点 H：

| 指针位置 | 非空树中的常见约定 |
| --- | --- |
| H.lchild | 指向真实根，H.ltag=0 |
| H.rchild | 指向中序最后结点，H.rtag=1 |
| 首结点的左线索 | 指向 H |
| 末结点的右线索 | 指向 H |

空树常规定 H 的两指针指向 H 自身；遍历要先判断空树，并以到达 H 为结束，不是以 NULL 为结束。具体 tag 设置以题目为准。

本页函数是无头版本，不能直接传 H：否则把头当真实结点、循环不终止或访问错误。这张表只描述中序头结点，不应照搬去覆盖后序根的真实右孩子。

#### 先序后继与后序前驱

```cpp
// 先序：有左孩子先走左，否则右指针就是孩子或后继线索。
ThreadTree NextPreNode(ThreadTree p) {
    if (p == NULL) { return NULL; }
    if (p->ltag == LINK_TAG && p->lchild != NULL) {
        return p->lchild;
    }
    return p->rchild;
}

void PreOrderThreaded(ThreadTree T) {
    for (ThreadTree p = T; p != NULL; p = NextPreNode(p)) {
        printf("%c", p->data);
    }
}

// 后序：右子树根在当前根之前；无右孩子时再考虑左子树根。
ThreadTree PrevPostNode(ThreadTree p) {
    if (p == NULL) { return NULL; }
    if (p->rtag == LINK_TAG && p->rchild != NULL) {
        return p->rchild;
    }
    if (p->ltag == LINK_TAG && p->lchild != NULL) {
        return p->lchild;
    }
    return p->lchild; // 叶结点的左线索是前驱。
}

void ReversePostOrderThreaded(ThreadTree T) {
    for (ThreadTree p = T; p != NULL; p = PrevPostNode(p)) {
        printf("%c", p->data);
    }
}
```

上述函数分别只能用于先序线索树、后序线索树。先序后继和后序前驱可以依靠当前结点的指针与 tag 在 $O(1)$ 内取得。

**易错点：** 后序中右线索表示后继，不是前驱；找前驱时，有真实右孩子应先取右孩子根。不要把中序“子树最左/最右”的公式套进去。

#### 先序前驱与后序后继的双亲问题

先序中，有左线索则前驱可直接取；否则常需找双亲。后序中，有右线索则后继可直接取；否则通常也需找双亲。

普通两指针线索结点没有 parent。本页用从根查找双亲来给出完整函数，说明它**不是每步常量时间的优化遍历**。

```cpp
ThreadTree FindThreadParent(ThreadTree root, ThreadTree target) {
    if (root == NULL || target == NULL || root == target) { return NULL; }
    ThreadTree left = root->ltag == LINK_TAG ? root->lchild : NULL;
    ThreadTree right = root->rtag == LINK_TAG ? root->rchild : NULL;
    if (left == target || right == target) { return root; }
    ThreadTree p = FindThreadParent(left, target);
    if (p != NULL) { return p; }
    return FindThreadParent(right, target);
}

ThreadTree LastPreNode(ThreadTree T) {
    if (T == NULL) { return NULL; }
    while (true) {
        if (T->rtag == LINK_TAG && T->rchild != NULL) {
            T = T->rchild;
        } else if (T->ltag == LINK_TAG && T->lchild != NULL) {
            T = T->lchild;
        } else { return T; }
    }
}

ThreadTree PrevPreNode(ThreadTree root, ThreadTree p) {
    if (p == NULL || p == root) { return NULL; }
    if (p->ltag == THREAD_TAG) { return p->lchild; }
    ThreadTree parent = FindThreadParent(root, p);
    if (parent == NULL) { return NULL; }
    if (parent->ltag == LINK_TAG && parent->lchild != NULL &&
        parent->lchild != p) {
        return LastPreNode(parent->lchild);
    }
    return parent;
}

ThreadTree FirstPostNode(ThreadTree T) {
    if (T == NULL) { return NULL; }
    while (true) {
        if (T->ltag == LINK_TAG && T->lchild != NULL) {
            T = T->lchild;
        } else if (T->rtag == LINK_TAG && T->rchild != NULL) {
            T = T->rchild;
        } else { return T; }
    }
}

ThreadTree NextPostNode(ThreadTree root, ThreadTree p) {
    if (p == NULL || p == root) { return NULL; }
    if (p->rtag == THREAD_TAG) { return p->rchild; }
    ThreadTree parent = FindThreadParent(root, p);
    if (parent == NULL) { return NULL; }
    if (parent->rtag == LINK_TAG && parent->rchild != NULL &&
        parent->rchild != p) {
        return FirstPostNode(parent->rchild);
    }
    return parent;
}
```

这些函数要求 p 属于 root 所表示的、对应顺序的线索树。找双亲最坏 $O(n)$、递归栈 $O(h)$；反复从根找双亲的完整遍历最坏可为 $O(n^2)$。若增加 parent 指针或借助栈保存回溯路径，可以避免反复全树查找。

#### 去掉线索与修改后的重新线索化

```cpp
void RemoveThreads(ThreadTree T) {
    if (T == NULL) { return; }
    ThreadTree left = T->ltag == LINK_TAG ? T->lchild : NULL;
    ThreadTree right = T->rtag == LINK_TAG ? T->rchild : NULL;
    if (T->ltag == THREAD_TAG) { T->lchild = NULL; }
    if (T->rtag == THREAD_TAG) { T->rchild = NULL; }
    T->ltag = LINK_TAG;
    T->rtag = LINK_TAG;
    RemoveThreads(left);
    RemoveThreads(right);
}
```

可在 RemoveThreads 后按新的顺序重新 CreateThreads。它只去掉线索，不释放结点。

改变结构时，原线索可能失效。本章复习采用“去线索 → 改真实结构 → 重新线索化”的清晰做法，重建 $O(n)$；不能把普通二叉树插删函数原样作用于 TNode 并忽略 tag。

## 5.4 树、森林

### 5.4.1 树的存储结构

#### 双亲表示法与查找方向

用数组保存结点，每个结点记录双亲的数组下标；根的 parent=-1。本组下标从 0 开始，不使用完全二叉树编号公式。

```cpp
typedef struct {
    char data;
    int parent;
} PTNode;

typedef struct {
    PTNode nodes[MAX_TREE_NODES];
    int n;
} PTree;

void InitPTree(PTree *T) { T->n = 0; }

// 建一棵树：首结点的 parent=-1，后续结点指定已有双亲。
bool AddPTNode(PTree *T, int parent, char value) {
    if (T == NULL || T->n == MAX_TREE_NODES) { return false; }
    if ((T->n == 0 && parent != -1) ||
        (T->n > 0 && (parent < 0 || parent >= T->n))) {
        return false;
    }
    T->nodes[T->n].data = value;
    T->nodes[T->n].parent = parent;
    ++T->n;
    return true;
}

int ParentIndex(const PTree *T, int i) {
    if (T == NULL || i < 0 || i >= T->n) { return -1; }
    return T->nodes[i].parent;
}

int FirstChildIndex(const PTree *T, int parent) {
    if (T == NULL || parent < 0 || parent >= T->n) { return -1; }
    for (int i = 0; i < T->n; ++i) {
        if (T->nodes[i].parent == parent) { return i; }
    }
    return -1;
}

int NextSiblingIndex(const PTree *T, int i) {
    if (T == NULL || i < 0 || i >= T->n || T->nodes[i].parent == -1) {
        return -1;
    }
    for (int j = i + 1; j < T->n; ++j) {
        if (T->nodes[j].parent == T->nodes[i].parent) { return j; }
    }
    return -1;
}

bool UpdatePTValue(PTree *T, int i, char value) {
    if (T == NULL || i < 0 || i >= T->n) { return false; }
    T->nodes[i].data = value;
    return true;
}
```

找双亲 $O(1)$；没有额外孩子索引时，找孩子和兄弟需扫描，最坏 $O(n)$。本函数按数组下标定义兄弟次序，新增结点只指向已有结点，避免新建时产生环。

森林也可用双亲表示，多个根的 parent=-1；此时需放宽新增根的限制，并另外保存或规定各树次序。

#### 双亲数组删除子树与下标重映射

删除不能只把某个数组单元移走：所有子孙也要删除，剩余结点的双亲下标要更新。

```cpp
bool DeletePTSubtree(PTree *T, int root) {
    if (T == NULL || root < 0 || root >= T->n) { return false; }
    bool removed[MAX_TREE_NODES] = { false };
    int map[MAX_TREE_NODES];
    for (int i = 0; i < T->n; ++i) {
        int p = i;
        while (p != -1) {
            if (p == root) { removed[i] = true; break; }
            p = T->nodes[p].parent;
        }
    }
    int count = 0;
    for (int i = 0; i < T->n; ++i) {
        map[i] = removed[i] ? -1 : count++;
    }
    for (int i = 0; i < T->n; ++i) {
        if (!removed[i]) {
            int parent = T->nodes[i].parent;
            T->nodes[map[i]].data = T->nodes[i].data;
            T->nodes[map[i]].parent = parent == -1 ? -1 : map[parent];
        }
    }
    T->n = count;
    return true;
}
```

前提是 parent 关系合法、无环。先沿祖先链确定是否在目标子树，再紧凑复制并重映射；存活结点的双亲不会被删除。时间 $O(nh)$，工作数组 $O(MAX\_TREE\_NODES)$；若按 n 分配则为 $O(n)$。

**易错点：** 删除后旧数组下标不再代表原结点，应让外部引用同步更新或采用稳定编号的另一种表示。

#### 孩子表示法与孩子链表

结点主体可顺序保存，各结点另有孩子链表，链表中存孩子的数组下标。

```cpp
typedef struct ChildLink {
    int child;
    struct ChildLink *next;
} ChildLink;

typedef struct {
    char data;
    ChildLink *first;
} CTNode;

typedef struct {
    CTNode nodes[MAX_TREE_NODES];
    int n;
    int root; // 空树为 -1。
} ChildTree;

void InitChildTree(ChildTree *T) {
    T->n = 0;
    T->root = -1;
    for (int i = 0; i < MAX_TREE_NODES; ++i) {
        T->nodes[i].first = NULL;
    }
}

int ChildCount(const ChildTree *T, int parent) {
    if (T == NULL || parent < 0 || parent >= T->n) { return -1; }
    int count = 0;
    for (ChildLink *p = T->nodes[parent].first; p != NULL; p = p->next) {
        ++count;
    }
    return count;
}

void ClearChildTree(ChildTree *T) {
    for (int i = 0; i < T->n; ++i) {
        ChildLink *p = T->nodes[i].first;
        while (p != NULL) {
            ChildLink *q = p->next;
            free(p);
            p = q;
        }
        T->nodes[i].first = NULL;
    }
    T->n = 0;
    T->root = -1;
}
```

找第一个孩子方便，顺着孩子链表能访问全部孩子；找双亲通常需扫描各孩子链表。非空单树所有孩子链表总共有 n-1 个表项；n 个结点、r 个根的森林有 n-r 个表项。

可以同时增加 parent 字段形成双亲孩子表示，兼顾上下两个方向。若给每个结点固定分配 m 个孩子指针，访问指定孩子方便，但会有闲置空间，且 m 不宜无限大。

#### 孩子兄弟表示与基本操作

每个结点只保存第一个孩子和下一个兄弟：

```cpp
typedef struct CSNode {
    char data;
    struct CSNode *firstchild;
    struct CSNode *nextsibling;
} CSNode, *CSTree;

CSTree NewCSNode(char value) {
    CSTree p = (CSTree)malloc(sizeof(CSNode));
    if (p == NULL) { return NULL; }
    p->data = value;
    p->firstchild = NULL;
    p->nextsibling = NULL;
    return p;
}

// F 可为一棵树或由根的兄弟链连接的森林。
void DestroyCSForest(CSTree *F) {
    if (F == NULL) { return; }
    CSTree p = *F;
    while (p != NULL) {
        CSTree next = p->nextsibling;
        DestroyCSForest(&p->firstchild);
        free(p);
        p = next;
    }
    *F = NULL;
}

// child 为独立树根：与 parent 所在结构不相交，且无根兄弟。
bool AppendCSChild(CSTree parent, CSTree child) {
    if (parent == NULL || child == NULL || child == parent ||
        child->nextsibling != NULL) {
        return false;
    }
    CSTree *slot = &parent->firstchild;
    while (*slot != NULL) { slot = &(*slot)->nextsibling; }
    *slot = child;
    return true;
}

// k 为从 1 开始的孩子次序，删除该孩子及其子孙。
bool DeleteCSChild(CSTree parent, int k) {
    if (parent == NULL || k < 1) { return false; }
    CSTree *slot = &parent->firstchild;
    for (int i = 1; i < k && *slot != NULL; ++i) {
        slot = &(*slot)->nextsibling;
    }
    if (*slot == NULL) { return false; }
    CSTree victim = *slot;
    *slot = victim->nextsibling;
    victim->nextsibling = NULL; // 先断开兄弟，保留其余孩子。
    DestroyCSForest(&victim);
    return true;
}

CSTree FindCSNode(CSTree F, char value) {
    for (CSTree p = F; p != NULL; p = p->nextsibling) {
        if (p->data == value) { return p; }
        CSTree q = FindCSNode(p->firstchild, value);
        if (q != NULL) { return q; }
    }
    return NULL;
}
```

追加成功后 child 的所有权归入 parent 所在树；上面的独立性前提必须由调用者保证，不能插入已有祖先或让两个双亲共享同一子树。

找首孩子、已有结点的下一兄弟为 $O(1)$；找第 k 个孩子需沿兄弟链；尾部追加不带尾指针时为 $O(\text{孩子数})$；删除先定位再按子树大小释放。

**易错点：** 删除某个孩子时，若未先断开其 nextsibling，按“森林销毁”会把后面的兄弟也删除。

#### 三种普通树表示的比较

| 表示 | 找双亲 | 找孩子 | 主要特点 |
| --- | --- | --- | --- |
| 双亲数组 | 由 parent 为 $O(1)$ | 扫描最坏 $O(n)$ | 向上走方便，紧凑删除需重编号 |
| 孩子链表 | 无双亲字段时需查找 | 首孩子方便，全部孩子顺序访问 | 对度数变化灵活，另需孩子表项 |
| 孩子兄弟 | 无双亲字段时需查找 | 首孩子及下一兄弟方便 | 每结点两指针，便于转换成二叉树 |

比较时说明已知的是结点地址还是结点值；从值定位结点通常还要一次搜索。

### 5.4.2 树、森林与二叉树的转换

#### 左孩子右兄弟的转换规则

把孩子兄弟结构中的 firstchild 当作二叉树左孩子，把 nextsibling 当作二叉树右孩子：

1. 同一个双亲的孩子按顺序用兄弟链连接。
2. 双亲只保留到第一个孩子的连接。
3. 画成二叉树时，第一个孩子放左边，下一个兄弟放右边。

**考点：** 单棵普通树的根没有兄弟，转换后根的右子树为空；普通结点在转换后的二叉树中，右孩子可能是原来的兄弟，而非它的孩子。

#### 森林转换与统一例子

森林各棵树按次序把根连接为兄弟链，第一棵树的根成为二叉树根，后续树根沿其右链出现。

本节森林：第一棵根 A，孩子 B、C，B 的孩子 D、E；第二棵根 F，孩子 G。

| 原结点 | 二叉树左孩子（原首孩子） | 二叉树右孩子（原下一兄弟） |
| --- | --- | --- |
| A | B | F |
| B | D | C |
| C | 空 | 空 |
| D | 空 | E |
| E | 空 | 空 |
| F | G | 空 |
| G | 空 | 空 |

所有 7 个结点保留，森林有 `7-2=5` 条父子边，转换后的二叉树有 6 条边；额外连接来自根兄弟链及重新解释的兄弟关系，不能把两类边当成同一关系。

#### 二叉树还原为树或森林

- 从二叉根开始，沿连续右孩子链得到森林各树根。
- 每个结点的左孩子是首孩子；从这个首孩子沿右链得到它的所有孩子。
- 递归恢复每个孩子的子树。

固定排列顺序后，森林与二叉树相互对应。若二叉根无右孩子，恢复的是一棵普通树；否则通常是多棵树组成的森林。

**易错点：** 森林树的数量是从二叉根开始的右链结点数，不是整棵二叉树里所有右孩子的个数。

#### 转换的复制实现

孩子兄弟表示与二叉链表具有相同的两指针结构；概念转换可只改变解释，耗时 $O(1)$。若像下面这样创建独立类型的新对象，则要复制全部结点，时间和新对象空间都为 $O(n)$。

```cpp
BiTree CopyForestToBinary(CSTree F, bool *ok) {
    if (!*ok || F == NULL) { return NULL; }
    BiTree p = NewBiNode(F->data);
    if (p == NULL) { *ok = false; return NULL; }
    p->lchild = CopyForestToBinary(F->firstchild, ok);
    p->rchild = CopyForestToBinary(F->nextsibling, ok);
    if (!*ok) { DestroyBiTree(&p); }
    return p;
}

CSTree CopyBinaryToForest(BiTree T, bool *ok) {
    if (!*ok || T == NULL) { return NULL; }
    CSTree p = NewCSNode(T->data);
    if (p == NULL) { *ok = false; return NULL; }
    p->firstchild = CopyBinaryToForest(T->lchild, ok);
    p->nextsibling = CopyBinaryToForest(T->rchild, ok);
    if (!*ok) { DestroyCSForest(&p); }
    return p;
}

int CountForestRootsFromBinary(BiTree T) {
    int count = 0;
    for (BiTree p = T; p != NULL; p = p->rchild) { ++count; }
    return count;
}
```

调用复制函数前令 `bool ok=true`，检查 ok 再使用返回对象。源结构不变；按地址复制时要真正创建新结点，不能把两种对象强制转换后分别销毁。

#### 转换后的叶、度与高度判断

- 原树叶结点：没有孩子，即转换后二叉结点**无左孩子**；它可以有右兄弟，所以不一定是二叉树叶。
- 原树结点的度：从其二叉左孩子开始，沿右链数结点。
- 原树根没有兄弟；森林首根可以有根兄弟。
- 原树中孩子下降一层、兄弟仍在同层；二叉树中左边和右边都会下降一层，所以高度通常变化。

本例原森林最大树高 3，原叶 C、D、E、G 共 4；二叉树叶 C、E、G 共 3，二叉高度为 4（A→B→D→E）。不能直接调用 CountBiLeaves 或 BiHeight 得到原森林的叶数、高度。

### 5.4.3 树和森林的遍历

#### 树的先根与后根遍历

普通树没有固有的二叉“中序”，因为孩子可以多于两个；常用：

- 先根：先访问根，再按顺序先根遍历各孩子子树。
- 后根：先按顺序后根遍历各孩子子树，再访问根。

树 A 的先根为 ABDEC，后根为 DEBCA。若题目额外规定“第几个孩子前后访问根”的其他遍历，就按其定义，不能直接当成二叉中序。

#### 森林先序与中序的递归定义

设森林第一棵树的根为 R，R 的子树组成子森林 F_child，剩下各树组成 F_rest：

| 遍历 | 处理顺序 |
| --- | --- |
| 森林先序 | R → F_child 的先序 → F_rest 的先序 |
| 森林中序（常用教材定义） | F_child 的中序 → R → F_rest 的中序 |

森林先序等价于依次先根遍历各树；森林中序等价于依次后根遍历各树。

**本例：** 森林先序 ABDECFG，森林中序 DEBCAGF。

#### 遍历与转换后的二叉树的对应

| 原对象遍历 | 转换后二叉树遍历 |
| --- | --- |
| 树的先根 / 森林先序 | 二叉先序 |
| 树的后根 / 森林中序 | 二叉中序 |

“孩子子树先处理，再访问根，再处理兄弟”正对应二叉左、根、右。

**易错点：** 原树后根不是转换后二叉后序。本例二叉后序为 EDCBGFA，与森林中序 DEBCAGF 不同。不要只因名字中有“后”就机械对应。

#### 孩子兄弟表示的遍历与统计函数

```cpp
void PreOrderForest(CSTree F) {
    for (CSTree p = F; p != NULL; p = p->nextsibling) {
        printf("%c", p->data);
        PreOrderForest(p->firstchild);
    }
}

// 森林中序 = 各树依次后根遍历。
void InOrderForest(CSTree F) {
    for (CSTree p = F; p != NULL; p = p->nextsibling) {
        InOrderForest(p->firstchild);
        printf("%c", p->data);
    }
}

int CountForestNodes(CSTree F) {
    int count = 0;
    for (CSTree p = F; p != NULL; p = p->nextsibling) {
        count += 1 + CountForestNodes(p->firstchild);
    }
    return count;
}

int CountForestLeaves(CSTree F) {
    int count = 0;
    for (CSTree p = F; p != NULL; p = p->nextsibling) {
        if (p->firstchild == NULL) { ++count; }
        else { count += CountForestLeaves(p->firstchild); }
    }
    return count;
}

int ForestHeight(CSTree F) {
    int maximum = 0;
    for (CSTree p = F; p != NULL; p = p->nextsibling) {
        int h = 1 + ForestHeight(p->firstchild);
        if (h > maximum) { maximum = h; }
    }
    return maximum;
}

int CSDegree(CSTree p) {
    if (p == NULL) { return -1; }
    int degree = 0;
    for (CSTree q = p->firstchild; q != NULL; q = q->nextsibling) {
        ++degree;
    }
    return degree;
}
```

统计与遍历时间 $O(n)$；此处用循环处理兄弟、只对孩子递归，栈深与原树高度成正比。森林高度表示各树高度最大值，不把根兄弟当成更深层。

对单棵树调用以上函数时，根的 nextsibling 应为 NULL；否则函数处理的是从该根开始的整个森林。

## 5.5 树与二叉树的应用

### 5.5.1 哈夫曼树和哈夫曼编码

#### 权、带权路径长度与最优二叉树

结点的权是题目赋给它的数值。哈夫曼问题给定叶结点的非负权，路径长度按根到叶的**边数**计算：

$$
WPL=\sum_{i=1}^{n}w_i l_i
$$

其中 n 是叶数，l_i 是第 i 个叶的深度边数。对同一组叶权，WPL 最小的二叉树称为哈夫曼树（最优二叉树）。

**易错点：** WPL 不是所有结点权的总和，也不是只把叶权相加；根层次为 1 时，位于第 k 层的叶对 WPL 的贡献为 `w×(k-1)`。

普通树的“高按结点数”和此处“路径长按边数”同时存在，不能混用。

#### 哈夫曼构造的贪心步骤

1. 每个权先形成一棵单结点树，构成候选森林。
2. 选根权最小的两棵树。
3. 增加新根，把这两棵树作为左右子树，新根权为两权之和。
4. 从森林删去被合并的两棵树，加入新树。
5. 重复到森林只剩一棵。

每次选择的是**当前森林中的两棵最小权树**，包含之前新生成的合并权，不是每次只从原始叶权中选。

直观理由：最深层可安排一对兄弟叶，把最小权放在最长路径不会增加 WPL；合并为一个权为两权之和的叶后得到更小规模的同类问题。

#### 逐步合并与WPL计算例子

符号 A、B、C、D、E、F 的权分别为 2、3、7、9、18、25：

| 步骤 | 选出两权 | 新权 | 剩余森林根权（升序） |
| --- | --- | --- | --- |
| 初始 | — | — | 2，3，7，9，18，25 |
| 1 | 2、3 | 5 | 5，7，9，18，25 |
| 2 | 5、7 | 12 | 9，12，18，25 |
| 3 | 9、12 | 21 | 18，21，25 |
| 4 | 18、21 | 39 | 25，39 |
| 5 | 25、39 | 64 | 64 |

令较小权子树放左、左边记 0、右边记 1，可得到：

| 符号 | 权 | 编码 | 路径长 | 带权贡献 |
| --- | --- | --- | --- | --- |
| A | 2 | 11100 | 5 | 10 |
| B | 3 | 11101 | 5 | 15 |
| C | 7 | 1111 | 4 | 28 |
| D | 9 | 110 | 3 | 27 |
| E | 18 | 10 | 2 | 36 |
| F | 25 | 0 | 1 | 25 |

$$
WPL=10+15+28+27+36+25=141
$$

也等于全部合并权之和 `5+12+21+39+64=141`。根权 64 只是原权之和，不等于 WPL。

#### 哈夫曼树的结构性质与非唯一性

- n 个叶共做 n-1 次合并，产生 n-1 个内部结点，总结点数 2n-1。
- 每次新增内部结点都有两个孩子，所以没有度为 1 的结点；但叶不一定同层，不一定是完全二叉树或本章的满二叉树。
- 每个内部结点权是它所有后代叶权之和。
- WPL 等于所有内部结点权之和：每次经过一个祖先内部结点，叶权被计入一次。
- 左右互换不改变深度和 WPL；权相同时不同选择可能得到不同结构和编码，最小 WPL 仍相同。
- 权越大通常应获得越短编码；具体长度由整体构造决定，不保证每个不同权都对应不同长度。

**单符号边界：** n=1 时，数学上的树只有根叶，路径长 0，WPL=0。实际编码若采用空码字会丢失重复次数，本页约定单符号编码为 `0`；这时实际码长为 1，必须与数学 WPL 分开说明。

#### 静态数组构造哈夫曼树的函数

用 1 基数组：1..n 是叶，n+1..2n-1 是内部结点；0 表示没有双亲或孩子。字符标识各不相同，本接口不把 `\0` 当成可编码符号。

```cpp
enum { HUFF_LEAF_LIMIT = 128, HUFF_NODE_LIMIT = 255 };

typedef struct {
    long long weight;
    int parent;
    int lchild;
    int rchild;
    char symbol;
} HuffNode;

typedef struct {
    HuffNode nodes[HUFF_NODE_LIMIT + 1];
    int leaves;
    int total;
} Huffman;

bool SelectTwoMin(const Huffman *H, int last, int *s1, int *s2) {
    *s1 = 0;
    *s2 = 0;
    for (int i = 1; i <= last; ++i) {
        if (H->nodes[i].parent != 0) { continue; }
        if (*s1 == 0 || H->nodes[i].weight < H->nodes[*s1].weight) {
            *s2 = *s1;
            *s1 = i;
        } else if (*s2 == 0 ||
                   H->nodes[i].weight < H->nodes[*s2].weight) {
            *s2 = i;
        }
    }
    return *s1 != 0 && *s2 != 0;
}

bool BuildHuffman(Huffman *H, const char symbols[],
                   const long long weights[], int n) {
    if (H == NULL || symbols == NULL || weights == NULL ||
        n < 1 || n > HUFF_LEAF_LIMIT) {
        return false;
    }
    Huffman temp = { 0 };
    temp.leaves = n;
    temp.total = 2 * n - 1;
    bool seen[UCHAR_MAX + 1] = { false };
    for (int i = 1; i <= n; ++i) {
        unsigned char c = (unsigned char)symbols[i - 1];
        if (c == 0 || seen[c] || weights[i - 1] < 0) { return false; }
        seen[c] = true;
        temp.nodes[i].weight = weights[i - 1];
        temp.nodes[i].symbol = symbols[i - 1];
    }
    for (int i = n + 1; i <= temp.total; ++i) {
        int a;
        int b;
        if (!SelectTwoMin(&temp, i - 1, &a, &b)) { return false; }
        if (temp.nodes[a].weight > LLONG_MAX - temp.nodes[b].weight) {
            return false;
        }
        temp.nodes[i].weight = temp.nodes[a].weight + temp.nodes[b].weight;
        temp.nodes[i].lchild = a;
        temp.nodes[i].rchild = b;
        temp.nodes[a].parent = i;
        temp.nodes[b].parent = i;
    }
    *H = temp;
    return true;
}

bool HuffmanWPL(const Huffman *H, long long *out) {
    if (H == NULL || out == NULL || H->leaves < 1) { return false; }
    long long sum = 0;
    for (int i = H->leaves + 1; i <= H->total; ++i) {
        if (sum > LLONG_MAX - H->nodes[i].weight) { return false; }
        sum += H->nodes[i].weight;
    }
    *out = sum;
    return true;
}
```

同权时按扫描先后确定较小数组下标优先，使这一实现的结果可重复；这不是哈夫曼树必须满足的唯一选择。只选择 parent=0 的当前树根，已经参与合并的结点不再作为独立候选。

每次线性选两最小值，总时间 $O(n^2)$；用最小堆管理候选可降至 $O(n\log n)$。数组占用与叶数成正比的容量，代码预留固定上限。非负权总和及 WPL 都需避免整数溢出，WPL 可能大于根权，即使根权未溢出也要另检查。

#### 前缀编码与编码生成函数

前缀码要求任何一个符号的码字都不是另一码字的前缀。哈夫曼码把符号放在叶上，沿根到叶的 0/1 路径编码，所以满足这一条件。

前缀码允许从左到右即时译码，不需要符号间的分隔符。“唯一可译”不应无条件与“前缀码”当成同义词；前缀性质是更强的方便条件。

```cpp
bool GetHuffmanCode(const Huffman *H, int leaf, char code[], int capacity) {
    if (H == NULL || code == NULL || leaf < 1 || leaf > H->leaves) {
        return false;
    }
    if (H->leaves == 1) {
        if (capacity < 2) { return false; }
        code[0] = '0';
        code[1] = '\0';
        return true;
    }
    char reversed[HUFF_LEAF_LIMIT];
    int length = 0;
    int child = leaf;
    int parent = H->nodes[child].parent;
    while (parent != 0) {
        reversed[length++] = H->nodes[parent].lchild == child ? '0' : '1';
        child = parent;
        parent = H->nodes[child].parent;
    }
    if (capacity < length + 1) { return false; }
    for (int i = 0; i < length; ++i) {
        code[i] = reversed[length - i - 1];
    }
    code[length] = '\0';
    return true;
}

int FindHuffmanLeaf(const Huffman *H, char symbol) {
    for (int i = 1; i <= H->leaves; ++i) {
        if (H->nodes[i].symbol == symbol) { return i; }
    }
    return 0;
}
```

从叶向上得到的 0/1 次序是反的，输出前要反转。最长叶路径不超过 n-1 条边；代码保留足够的临时空间以及输出结束标记。

#### 文本编码与按树译码的函数

本组把输入输出当 C 字符串，按单字节符号处理。文本中出现未登记符号、位串含非 0/1、译码停在内部结点或输出空间不足都返回 false，输出原值不变。

```cpp
bool EncodeHuffman(const Huffman *H, const char text[],
                    char bits[], int capacity) {
    if (H == NULL || H->leaves < 1 || text == NULL || bits == NULL ||
        capacity < 1) {
        return false;
    }
    char *temp = (char *)malloc((size_t)capacity);
    if (temp == NULL) { return false; }
    int used = 0;
    for (size_t i = 0; text[i] != '\0'; ++i) {
        int leaf = FindHuffmanLeaf(H, text[i]);
        char code[HUFF_LEAF_LIMIT + 1];
        if (leaf == 0 || !GetHuffmanCode(H, leaf, code, HUFF_LEAF_LIMIT + 1)) {
            free(temp);
            return false;
        }
        int length = (int)strlen(code);
        if (length > capacity - 1 - used) { free(temp); return false; }
        for (int j = 0; j < length; ++j) { temp[used++] = code[j]; }
    }
    temp[used] = '\0';
    for (int i = 0; i <= used; ++i) { bits[i] = temp[i]; }
    free(temp);
    return true;
}

bool DecodeHuffman(const Huffman *H, const char bits[],
                    char text[], int capacity) {
    if (H == NULL || H->leaves < 1 || bits == NULL || text == NULL ||
        capacity < 1) {
        return false;
    }
    char *temp = (char *)malloc((size_t)capacity);
    if (temp == NULL) { return false; }
    int used = 0;
    int root = H->total;
    int p = root;
    for (size_t i = 0; bits[i] != '\0'; ++i) {
        if (bits[i] != '0' && bits[i] != '1') { free(temp); return false; }
        if (H->leaves == 1) {
            if (bits[i] != '0' || used == capacity - 1) {
                free(temp);
                return false;
            }
            temp[used++] = H->nodes[1].symbol;
            continue;
        }
        p = bits[i] == '0' ? H->nodes[p].lchild : H->nodes[p].rchild;
        if (H->nodes[p].lchild == 0 && H->nodes[p].rchild == 0) {
            if (used == capacity - 1) { free(temp); return false; }
            temp[used++] = H->nodes[p].symbol;
            p = root;
        }
    }
    if (p != root) { free(temp); return false; }
    temp[used] = '\0';
    for (int i = 0; i <= used; ++i) { text[i] = temp[i]; }
    free(temp);
    return true;
}
```

前提是 H 来自成功构造且结构未被破坏。译码从根出发，0 走左、1 走右；到叶就输出符号并回根，位串结束时必须已经回到根。

本例 FEA 编码为 `0|10|11100`，连接后 `01011100`。译码读 0 得 F，读 10 得 E，读 11100 得 A。读到叶之前不能仅因当前字符看似匹配某码字片段就输出。

编码函数为讲清过程，每个符号线性找叶并现求码字；若文本长 t、码长上界 h，时间可按 $O(t(n+h))$ 分析，预先生成“符号 → 码字”表可以提高效率。译码每个输入位只走一步，时间与位串长及输出长度成正比；两函数的临时结果区按 capacity 分配。

#### 码长、平均长度与压缩判断

若权是出现次数，WPL 表示编码有效载荷的总位数；若权是概率，WPL 是平均码长。

本例频数总和 64，平均码长为 `141/64≈2.203` 位；6 种符号若采用等长二进制码，至少 3 位/符号，同频数有效载荷为 192 位。

但实际文件还可能保存码表、树结构、频数、原长度及填充信息；短文本不一定总体更小。数组中的字符 `'0'`、`'1'` 各占一个字节，演示函数产生的是可读位串，并没有按 8 位打包成压缩字节。

给定已构造的哈夫曼树，修改叶权或增加、删除符号可能改变最优结构。本章采用重新 BuildHuffman，而不是局部改权后声称原编码仍最优。

### 5.5.2 并查集

#### 不相交集合与双亲森林

并查集维护一个集合划分：每个元素恰属于一个集合，集合间不相交。用若干棵双亲树表示，各树根作为该集合的代表。

基本操作：

- 初始化：每个元素独立成集合。
- Find：找所在树根，也就是集合代表。
- Union：把两个不同集合合为一个。
- 同集合判断：比较两个元素的根。

集合代表只是维护过程中选出的根，不一定是最小元素、最大元素，也不保证长期不变。Find 返回根，不是直接返回集合大小或直接双亲。

#### 数组约定与初始化

本页元素编号 0..n-1：非根 parent[x] 是双亲编号；根的 parent[x] 保存**集合大小的负值**。

```cpp
enum { MAX_DSU_ELEMENTS = 1024 };

typedef struct {
    int parent[MAX_DSU_ELEMENTS];
    int n;
    int sets;
} UnionFind;

bool InitUnionFind(UnionFind *U, int n) {
    if (U == NULL || n < 0 || n > MAX_DSU_ELEMENTS) { return false; }
    U->n = n;
    U->sets = n;
    for (int i = 0; i < n; ++i) { U->parent[i] = -1; }
    return true;
}

int FindRootBasic(const UnionFind *U, int x) {
    if (U == NULL || x < 0 || x >= U->n) { return -1; }
    while (U->parent[x] >= 0) { x = U->parent[x]; }
    return x;
}

// 返回 -1 参数无效，0 已在同集合，1 完成一次合并。
int UnionBasic(UnionFind *U, int x, int y) {
    int rx = FindRootBasic(U, x);
    int ry = FindRootBasic(U, y);
    if (rx < 0 || ry < 0) { return -1; }
    if (rx == ry) { return 0; }
    U->parent[rx] += U->parent[ry];
    U->parent[ry] = rx;
    --U->sets;
    return 1;
}
```

**易错点：** 根并不永远保存 -1，合并后可能为 -2、-6 等；判断根应为 parent[x]<0。0 是合法双亲编号，不能用 parent[x]>0 才继续查找。

合并应连接**两个根**，不能直接把任意 x 指向 y。若不先找根而改中间结点，可能只转移部分元素，甚至产生环。

#### 普通合并的退化与按大小合并

无优化时可能形成长链，单次 Find 最坏 $O(n)$。按大小合并让小集合根挂到大集合根，限制深度增长。

下面暂不压缩路径，以便单独看大小策略：

```cpp
int UnionBySizeOnly(UnionFind *U, int x, int y) {
    int rx = FindRootBasic(U, x);
    int ry = FindRootBasic(U, y);
    if (rx < 0 || ry < 0) { return -1; }
    if (rx == ry) { return 0; }
    // 负值越小，集合越大。
    if (U->parent[rx] > U->parent[ry]) {
        int temp = rx;
        rx = ry;
        ry = temp;
    }
    U->parent[rx] += U->parent[ry];
    U->parent[ry] = rx;
    --U->sets;
    return 1;
}
```

从初始化起一直按大小合并，一个结点深度每增加 1，它所在集合大小至少翻倍，因此深度至多 $O(\log n)$。相同大小时本页保留第一个根 rx；不同实现可以另定规则。

按秩合并是另一种策略：秩可表示高度的上界，相等时合并才增加秩。**集合大小与秩不是同一个数**，路径压缩后秩也不应被当成实时树高。

#### 两趟路径压缩与组合优化

路径压缩在 Find 时，把搜索路径上的所有非根结点直接连接到根；集合划分和根所记录的集合大小不改变。

```cpp
int FindRootCompress(UnionFind *U, int x) {
    if (U == NULL || x < 0 || x >= U->n) { return -1; }
    int root = x;
    while (U->parent[root] >= 0) { root = U->parent[root]; }
    while (x != root) {
        int next = U->parent[x];
        U->parent[x] = root;
        x = next;
    }
    return root;
}

int UnionBySize(UnionFind *U, int x, int y) {
    int rx = FindRootCompress(U, x);
    int ry = FindRootCompress(U, y);
    if (rx < 0 || ry < 0) { return -1; }
    if (rx == ry) { return 0; }
    if (U->parent[rx] > U->parent[ry]) {
        int temp = rx;
        rx = ry;
        ry = temp;
    }
    U->parent[rx] += U->parent[ry];
    U->parent[ry] = rx;
    --U->sets;
    return 1;
}

bool SameSet(UnionFind *U, int x, int y, bool *answer) {
    if (answer == NULL) { return false; }
    int rx = FindRootCompress(U, x);
    int ry = FindRootCompress(U, y);
    if (rx < 0 || ry < 0) { return false; }
    *answer = rx == ry;
    return true;
}

int SetSize(UnionFind *U, int x) {
    int root = FindRootCompress(U, x);
    if (root < 0) { return -1; }
    return -U->parent[root];
}

int SetCount(const UnionFind *U) {
    return U == NULL ? -1 : U->sets;
}
```

第二趟先保存旧双亲，再修改当前双亲，避免失去继续走原路径的位置；不能把根也改为自己的非负编号，否则根标志被破坏。

**易错点：** 路径压缩改变的是 Find 路径上的连接，并非一次 Find 就把整个集合所有结点全压成一层。

#### 双亲数组变化的完整例子

n=6，始终使用 UnionBySize；同大小时保留第一个根。

| 操作 | parent[0..5] | 集合数 |
| --- | --- | --- |
| 初始化 | -1，-1，-1，-1，-1，-1 | 6 |
| Union(0,1) | -2，0，-1，-1，-1，-1 | 5 |
| Union(2,3) | -2，0，-2，2，-1，-1 | 4 |
| Union(0,2) | -4，0，0，2，-1，-1 | 3 |
| Find(3) | -4，0，0，0，-1，-1 | 3 |
| Union(4,5) | -4，0，0，0，-2，4 | 2 |
| Union(3,4) | -6，0，0，0，0，4 | 1 |
| Find(5) | -6，0，0，0，0，0 | 1 |

第三次合并后，3→2→0；Find(3) 把 3 直接连到 0。最后一次合并后 5 仍指向 4，直到 Find(5) 才压缩到 0。

反复 Union 已在同集合的元素，不再减少集合数，也不重复把大小相加。

#### 复杂度与操作限制

| 策略 | Find/Union 的代价 | 条件 |
| --- | --- | --- |
| 无平衡、无压缩 | 单次最坏 $O(n)$ | 可能退化成链 |
| 按大小合并、不压缩 | 单次 $O(\log n)$ | 从初始化起始终遵守大小策略 |
| 按大小/秩合并 + 路径压缩 | 操作序列的摊还代价 $O(\alpha(n))$ | α 为反 Ackermann 函数，增长极慢 |

初始化 $O(n)$；n 个元素上 q 次操作常用总上界 $O(n+q\alpha(n))$ 表述。数组逻辑空间 $O(n)$，本代码固定预留 MAX_DSU_ELEMENTS 个单元；两趟 Find 自身只需 $O(1)$ 辅助变量。

摊还几乎常量不等于“每一次操作都严格 $O(1)$”。以上优化界不能直接套到混用任意 UnionBasic 形成长链的过程。

普通并查集支持合并，不支持一般意义的拆分集合、删除一条联系后自动重算连通关系。直接删根或修改一个双亲不等价于这些操作。

#### 连通分量、判环与应用函数

无向图中，初始每个顶点各成集合；逐条边合并两端，最后集合数就是连通分量数，包括孤立顶点。

```cpp
// edges[k][0]、edges[k][1] 为边端点；编号 0..n-1。
bool CountComponentsByUF(int n, const int edges[][2], int m, int *out) {
    if (m < 0 || out == NULL || (m > 0 && edges == NULL)) { return false; }
    UnionFind U;
    if (!InitUnionFind(&U, n)) { return false; }
    for (int i = 0; i < m; ++i) {
        if (UnionBySize(&U, edges[i][0], edges[i][1]) < 0) { return false; }
    }
    *out = U.sets;
    return true;
}
```

若新加入无向边的两个端点已经同集合，这条边会在已有连接中形成环；这也是 Kruskal 最小生成树判断是否接受边的基础。并查集查找的是**集合关系**，不能单凭它处理有向图的方向可达性。

集合分组、等价关系归类也可以用同样模型。图的完整算法在下一章展开，本章先掌握根、合并、大小字段和压缩过程。

## 本章综合回顾

### 公式速查与使用条件

| 对象与前提 | 公式 |
| --- | --- |
| 非空单树，n 个结点 | 边数 n-1 |
| n 个结点、r 棵非空树的森林 | 边数 n-r |
| 非空普通树，n_i 个度为 i 的结点 | n_0=1+Σ(i-1)n_i，求和 i≥2 |
| 每个分支恰有 m 个孩子 | n=mI+1，L=(m-1)I+1 |
| 非空二叉树 | n_0=n_2+1 |
| 高 h 的二叉树，根层次为 1 | 最大结点数 2^h-1，最少 h |
| n 个结点的完全二叉树 | h=⌊log₂n⌋+1，叶数 ⌈n/2⌉ |
| 非空二叉链表，n 个结点 | 空孩子指针 n+1 |
| n 个叶的哈夫曼树，n≥1 | 总结点 2n-1，内部结点 n-1 |
| 哈夫曼 WPL，路径按边数 | Σ叶权×叶路径长 = Σ内部权 = Σ合并权 |

### 算法选择与复杂度速查

| 任务 | 常用方法 | 时间 / 所需辅助空间 |
| --- | --- | --- |
| 先中后序遍历 | 递归或显式栈 | $O(n)$ / $O(h)$ |
| 层序遍历、宽度、完整性 | 队列 | $O(n)$ / $O(w)$ |
| 高度、叶数、镜像 | 子树递归 | $O(n)$ / $O(h)$ |
| 先序/后序+中序重建 | 递归划分，线性查根 | 最坏 $O(n^2)$ / 栈 $O(h)$，另有结果树 |
| 带空标记先序建树 | 顺序消费输入，递归 | $O(n)$ / 栈 $O(h)$，另有结果树 |
| 线索化 | 遍历并维护 pre | $O(n)$ / $O(h)$ |
| 中序线索全遍历 | 首项+后继 | $O(n)$ / $O(1)$ |
| 森林复制转换 | 两指针递归对应 | $O(n)$ / 栈按转换结构高度，另有新对象 |
| 哈夫曼建树，本页扫描选最小 | 每次找两最小根 | $O(n^2)$ / 树数组 $O(n)$ |
| 并查集，大小+压缩 | 连根与压缩路径 | 摊还 $O(\alpha(n))$ / Find 自身 $O(1)$ |

表中栈、队列的辅助空间表示算法所需规模；本页固定数组实现的实际预留空间按容量计。n 在哈夫曼行表示叶数，在其他树算法中通常表示实际结点数。

### 高频易错点检查清单

1. 根层次、高度、路径长是否按同一种计数约定？
2. 单树与森林的边数公式是否用对？是否把空树套入非空公式？
3. 最大度为 m 与所有分支度为 m 是否混淆？
4. 满二叉树、完全二叉树、无度为 1 的二叉树是否混淆？
5. 二叉位置编号是否保留空位？双亲数组是否误用 i/2？
6. 非递归先序是否先压右再压左？后序是否确认右子树已完成？
7. 遍历重建是否需要唯一标识？先序+后序是否存在单孩子歧义？
8. 线索指针是否检查 tag？是否混用无头、带头及不同线索顺序？
9. 先序前驱、后序后继是否具备所需的双亲信息？
10. 左孩子右兄弟的右指针是否仍被误当成原树孩子？
11. 原树叶、度、高度是否直接套了转换后二叉树的统计结果？
12. 树后根 / 森林中序是否正确对应二叉中序？
13. 哈夫曼每轮是否考虑新合并权？WPL 是否漏乘边数？
14. 哈夫曼单符号编码、同权选择、码表额外开销是否按题意处理？
15. 并查集是否连两个根、正确更新负大小、同集合时不重复合并？
16. 根判断是否用负值而非仅 -1？路径压缩是否保存了旧双亲？

### 六个代表性回顾问题

**一：** 完全二叉树有 100 个结点，叶数、高度、度为 1 的结点数是多少？

叶数 50，高 7，度为 1 的结点数 1；该结点编号 50，只有左孩子 100。

**二：** 二叉树叶数 8，度为 1 的结点有 3 个，总结点数是多少？

度为 2 的结点数 7，总数 `8+3+7=18`。

**三：** 中序线索树结点 p 有真实右孩子 q，它的后继一定是 q 吗？

不一定，是 q 子树的最左结点；只有 q 没有真实左孩子时才恰为 q。

**四：** 转换后的二叉结点没有左孩子但有右孩子，它在原树中是叶吗？

是。没有左孩子表示没有原孩子；右孩子表示原下一兄弟。

**五：** 哈夫曼权 2、3、7，WPL 是 12 吗？

不是。先合并 2+3=5，再合并 5+7=12，WPL=`5+12=17`；12 是根权。编码长度为 2、2、1 时也得到 `2×2+3×2+7×1=17`。

**六：** parent=[-4,0,0,2]，Find(3) 压缩后是什么？集合大小变吗？

数组为 [-4,0,0,0]，代表仍为 0，大小仍为 4。只是 3 的双亲由 2 改为根 0。

## 资料与使用说明

- 章节范围依据用户给出的目录，与[电子工业出版社《2027年数据结构考研复习指导》书目](https://phei.com.cn/module/goods/wssd_content.jsp?bookid=68851)对应。
- 知识和代码为复习整理，教材具体符号、头结点及函数接口与本页不同时，先按题目约定转换。
- 每组代码块依赖前面公共类型或辅助函数；整合时按本页定义次序放入同一份代码即可。普通树、线索树、孩子兄弟树各有类型和销毁函数。
- 本章作为知识回顾应能做到：套公式前说明条件，写出遍历与主要操作，手工重建和画线索，转换森林并核对遍历，计算哈夫曼码及 WPL，逐步更新并查集数组。
