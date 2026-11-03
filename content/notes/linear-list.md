# 第2章 线性表

> 面向 408 复习，按王道 2027 版的知识章节组织。知识讲解、函数和例题为独立整理；代表性例题直接放在对应知识点下。
>
> [[B00-线性表导航|返回线性表导航]]

## 代码与位序约定

- **逻辑位序从 1 开始**：第 $i$ 个元素是 $a_i$。数组下标从 0 开始，第 $i$ 个元素对应 `data[i - 1]`。
- 长度为 $n$ 时，读取、修改、删除的合法位序是 $1\le i\le n$；插入的合法位序是 $1\le i\le n+1$。
- 按值查找返回第一次匹配的**逻辑位序**；返回 `0` 表示未找到。按位查找返回 `bool`，通过输出参数得到元素。
- 代码使用 C++ 的函数、基本类型与 `bool`，以结构体、数组、指针和 `malloc/free` 实现；不使用类、模板或 STL。
- 修改表长、数组指针等字段时传入结构体指针；修改头指针本身时传入指针的地址。调用示例：`SqInsert(&L, 2, 10)`、`InitLinkList(&L)`。
- 输出参数不能为空。失败时，除明确说明的建表回滚外，不改变原有表和输出值。
- 所有传入的非空指针必须指向有效对象；代码中的空指针检查不能识别悬空指针。数组容量和申请字节数应在整数可表示范围内。
- 初始化只用于尚未持有资源的对象；再次初始化前应先释放旧资源。各段函数可在共用以下类型与头文件的条件下组合使用。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

typedef int ElemType;
```

## 2.1 线性表的定义和基本操作

### 2.1.1 线性表的定义

#### 定义、长度与空表

线性表是具有**相同数据类型**的 $n$ 个数据元素的有限序列，记为：

$$
L=(a_1,a_2,\ldots,a_n),\qquad n\ge0
$$

- $n$ 是表长；$n=0$ 时为空表。
- 有限：元素数量有限。
- 同类型：元素按统一类型组织，不代表元素值互不相同。
- 有序：元素有确定的逻辑先后次序，**不要求按值递增或递减**。

**例：** $(7,2,7)$ 是线性表。它的值没有排好序，且允许两个元素取相同值。

#### 线性关系的边界

对非空表：

- $a_1$ 是表头元素，没有直接前驱。
- $a_n$ 是表尾元素，没有直接后继。
- 其余相应元素有唯一的直接前驱、直接后继。
- 当 $n=1$ 时，唯一元素同时是表头和表尾，无直接前驱、直接后继。

线性关系描述的是逻辑次序。顺序表与链表是它的存储实现，不是两种不同的线性表逻辑关系。

**易错点：** “表头元素”是第一个数据元素；“头结点”是链表中可能额外设置的辅助结点。两者不等价。

#### 位序与数组下标

| 逻辑对象 | 位序 | 在顺序表中的下标 |
| --- | --- | --- |
| 第一个元素 | $1$ | $0$ |
| 第 $i$ 个元素 | $i$ | $i-1$ |
| 最后一个元素 | $n$ | $n-1$ |
| 在尾部插入新元素的位置 | $n+1$ | 新元素写入 `data[n]` |

**例：** 在 $(10,20,30)$ 的位序 2 插入 15，得到 $(10,15,20,30)$，新值写入下标 1。

### 2.1.2 线性表的基本操作

#### 基本操作的语义

| 操作 | 要说明的作用或约束 |
| --- | --- |
| 初始化 | 建立可使用的空表，包括必要的空间和状态 |
| 求长度 | 返回当前元素个数，不是容量 |
| 判空 | 判断当前元素个数是否为 0 |
| 按位查找 | 返回第 $i$ 个元素；要求 $1\le i\le n$ |
| 按值查找 | 按约定返回第一次匹配的位置或结点，失败有明确标记 |
| 插入 | 把新元素放到指定位置；原有元素相对次序不变 |
| 删除 | 删除指定位置的元素，可同时返回其值 |
| 修改 | 替换指定元素的值；通常不改变表长和结构关系 |
| 遍历 | 按逻辑次序访问全部数据元素 |
| 清空 | 删除全部数据元素，使表成为仍可使用的空表 |
| 销毁 | 释放表所占资源，使该表不再处于已初始化的可用状态 |

初始化与销毁是生命周期操作；清空与销毁的效果不同。带头结点链表清空后保留头结点，销毁后连头结点也释放。

#### 插入与删除的边界

| 场景 | 允许的位置 |
| --- | --- |
| 空表插入 | 只能在位序 1 插入 |
| 非空表插入到第一个元素之前 | $i=1$ |
| 非空表尾部追加 | $i=n+1$ |
| 删除表头元素 | $i=1$，且 $n>0$ |
| 删除表尾元素 | $i=n$，且 $n>0$ |
| 空表读取、删除或修改 | 都没有合法数据位序 |

**考点提示：** 插入允许的位置比现有元素数量多一个；按位操作要先检查位序，再换算下标或定位结点。

## 2.2 线性表的顺序表示

### 2.2.1 顺序表的定义

#### 顺序存储与地址计算

用一组地址连续的存储单元依次存放线性表的元素，以物理相邻体现逻辑相邻。元素等长时可直接计算第 $i$ 个元素的地址：

$$
\operatorname{LOC}(a_i)=\operatorname{LOC}(a_1)+(i-1)\times\operatorname{sizeof}(\mathrm{ElemType})
$$

由此支持**随机访问**：已知合法位序时，读取元素为 $O(1)$。随机访问指能直接定位任意位序，不是随机选择元素。

#### 静态顺序表与容量

```cpp
const int SQ_CAPACITY = 100;

typedef struct {
    ElemType data[SQ_CAPACITY];
    int length;
} SqList;

void InitSqList(SqList *L) {
    L->length = 0;
}

int SqLength(const SqList *L) {
    return L->length;
}

bool SqEmpty(const SqList *L) {
    return L->length == 0;
}

void SqClear(SqList *L) {
    L->length = 0;
}
```

有效元素区间是 `data[0]` 到 `data[length - 1]`。`length` 与 `SQ_CAPACITY` 含义不同；未使用的数组单元不计入表长。

静态数组随 `SqList` 对象存在，不能对 `L->data` 调用 `free`。清空只需置表长为 0，旧内容留在数组中不代表仍属于表。

#### 动态顺序表与扩容

```cpp
typedef struct {
    ElemType *data;
    int length;
    int capacity;
} DynamicSqList;

bool InitDynamicSqList(DynamicSqList *L, int initialCapacity) {
    if (L == NULL || initialCapacity <= 0) {
        return false;
    }
    ElemType *p = (ElemType *)malloc(
        (size_t)initialCapacity * sizeof(ElemType));
    if (p == NULL) {
        return false;
    }
    L->data = p;
    L->length = 0;
    L->capacity = initialCapacity;
    return true;
}

// 前置条件：L 已成功初始化。
// 申请新连续空间，复制有效元素，成功后再释放旧空间。
bool DynamicReserve(DynamicSqList *L, int newCapacity) {
    if (L == NULL || newCapacity < L->length) {
        return false;
    }
    if (newCapacity <= L->capacity) {
        return true;
    }
    ElemType *p = (ElemType *)malloc(
        (size_t)newCapacity * sizeof(ElemType));
    if (p == NULL) {
        return false;
    }
    for (int j = 0; j < L->length; ++j) {
        p[j] = L->data[j];
    }
    free(L->data);
    L->data = p;
    L->capacity = newCapacity;
    return true;
}

void DestroyDynamicSqList(DynamicSqList *L) {
    if (L == NULL) {
        return;
    }
    free(L->data);
    L->data = NULL;
    L->length = 0;
    L->capacity = 0;
}
```

**复习要点：**

- 动态分配不改变顺序存储的性质：有效元素仍连续，仍可按位随机访问。
- 扩容可能获得不同的首地址，之前保存的元素地址可能失效。
- 上述成功扩容复制 $n$ 个有效元素，时间 $O(n)$；新的存储区需要按新容量计算空间，复制期间新旧空间同时存在。
- 销毁前应成功初始化，或者先把对象置为 `DynamicSqList L = {NULL, 0, 0};`，避免释放未初始化指针。

### 2.2.2 顺序表上基本操作的实现

#### 顺序表按位查找、按值查找与修改

```cpp
bool SqGet(const SqList *L, int i, ElemType *value) {
    if (L == NULL || value == NULL || i < 1 || i > L->length) {
        return false;
    }
    *value = L->data[i - 1];
    return true;
}

int SqLocate(const SqList *L, ElemType value) {
    if (L == NULL) {
        return 0;
    }
    for (int j = 0; j < L->length; ++j) {
        if (L->data[j] == value) {
            return j + 1;
        }
    }
    return 0;
}

bool SqSet(SqList *L, int i, ElemType value) {
    if (L == NULL || i < 1 || i > L->length) {
        return false;
    }
    L->data[i - 1] = value;
    return true;
}
```

按位读取和修改 $O(1)$；无序表按值查找最坏 $O(n)$。只有在元素满足有序等条件时，才可采用相应的更高效查找算法。

#### 顺序表插入

```cpp
bool SqInsert(SqList *L, int i, ElemType value) {
    if (L == NULL || i < 1 || i > L->length + 1) {
        return false;
    }
    if (L->length == SQ_CAPACITY) {
        return false;
    }
    // 从后向前移动，防止覆盖尚未搬走的元素。
    for (int j = L->length; j >= i; --j) {
        L->data[j] = L->data[j - 1];
    }
    L->data[i - 1] = value;
    ++L->length;
    return true;
}
```

在原长为 $n$ 的表中按位序 $i$ 插入，移动次数为 $n-i+1$。

- 最好：尾部插入，移动 0 次，容量充足时 $O(1)$。
- 最坏：头部插入，移动 $n$ 次，$O(n)$。
- 若 $n+1$ 个插入位置等概率，平均移动次数：

$$
\frac{1}{n+1}\sum_{i=1}^{n+1}(n-i+1)=\frac n2
$$

**例：** $(10,20,30)$ 在位序 2 插入 15：先把 30 移到下标 3，再把 20 移到下标 2，最后写入 `data[1] = 15`。

**易错点：** 从前向后右移会覆盖数据；插入前必须检查容量。

#### 动态顺序表插入

```cpp
// 前置条件：L 已成功初始化。
bool DynamicInsert(DynamicSqList *L, int i, ElemType value) {
    if (L == NULL || i < 1 || i > L->length + 1) {
        return false;
    }
    if (L->length == L->capacity) {
        if (L->capacity > INT_MAX / 2) {
            return false;
        }
        if (!DynamicReserve(L, L->capacity * 2)) {
            return false;
        }
    }
    for (int j = L->length; j >= i; --j) {
        L->data[j] = L->data[j - 1];
    }
    L->data[i - 1] = value;
    ++L->length;
    return true;
}
```

读、查、删、改的数组操作逻辑与静态顺序表相同，容量检查改用 `capacity`。不要把 `DynamicSqList *` 强制转换成 `SqList *` 来复用函数，二者的结构布局不同。

**扩容考点：** 尾插遇到扩容，单次代价可为 $O(n)$；若始终按倍增容量扩容，连续尾插的均摊代价可为 $O(1)$。这是补充分析，不能据此把一次扩容写成常数时间。

#### 顺序表删除

```cpp
bool SqDelete(SqList *L, int i, ElemType *value) {
    if (L == NULL || value == NULL || i < 1 || i > L->length) {
        return false;
    }
    *value = L->data[i - 1];
    // 从前向后左移，防止覆盖尚未搬走的元素。
    for (int j = i; j < L->length; ++j) {
        L->data[j - 1] = L->data[j];
    }
    --L->length;
    return true;
}
```

删除原表中第 $i$ 个元素，移动次数为 $n-i$。

- 最好：删除末元素，移动 0 次，$O(1)$。
- 最坏：删除首元素，移动 $n-1$ 次，$O(n)$。
- $n$ 个删除位置等概率时，平均移动次数为 $(n-1)/2$。

**易错点：** 保存被删元素应在覆盖之前；末尾旧值不必清零，减小表长就使它离开有效区间。

#### 顺序表遍历与基本操作复杂度

```cpp
void SqPrint(const SqList *L) {
    if (L == NULL) {
        return;
    }
    for (int j = 0; j < L->length; ++j) {
        printf("%d ", L->data[j]);
    }
    printf("\n");
}
```

| 操作 | 最好时间 | 最坏时间 | 限定条件 |
| --- | --- | --- | --- |
| 按位读取、按位修改 | $O(1)$ | $O(1)$ | 位序已知、合法 |
| 无序表按值查找 | $O(1)$ | $O(n)$ | 空表可直接失败 |
| 插入 | $O(1)$ | $O(n)$ | 容量足够，不含扩容 |
| 删除 | $O(1)$ | $O(n)$ | 位序合法 |
| 遍历全部元素 | $O(n)$ | $O(n)$ | 访问每个元素 |
| 求长度、判空、清空 | $O(1)$ | $O(1)$ | 维护 `length`，清空不逐一处理资源 |

上述基本操作仅用常数辅助变量；顺序表本身的存储空间按容量计数，不要把它与操作的辅助空间混淆。

#### 顺序表常见算法：逆置与区间删除

```cpp
void SqReverse(SqList *L) {
    int left = 0;
    int right = L->length - 1;
    while (left < right) {
        ElemType temp = L->data[left];
        L->data[left] = L->data[right];
        L->data[right] = temp;
        ++left;
        --right;
    }
}

// 删除值处于闭区间 [low, high] 的全部元素，保持剩余次序。
bool SqEraseRange(SqList *L, ElemType low, ElemType high) {
    if (L == NULL || low > high) {
        return false;
    }
    int write = 0;
    for (int read = 0; read < L->length; ++read) {
        if (L->data[read] < low || L->data[read] > high) {
            L->data[write++] = L->data[read];
        }
    }
    L->length = write;
    return true;
}
```

逆置使用左右下标，区间删除使用读、写下标；二者时间 $O(n)$、辅助空间 $O(1)$。

**例：** 对 $(4,1,5,2,8)$ 删除闭区间 $[2,5]$，保留 $(1,8)$。读下标扫描原表，写下标只在保留元素时前进。

**考点：** 删除多个元素时，反复调用单次删除可能造成重复移动，最坏 $O(n^2)$；一次扫描集中压缩可以做到 $O(n)$。

#### 顺序表常见算法：有序去重与合并

```cpp
// 前置条件：L 非空指针，元素按非递减次序排列。
void SqUniqueSorted(SqList *L) {
    if (L->length <= 1) {
        return;
    }
    int write = 1;
    for (int read = 1; read < L->length; ++read) {
        if (L->data[read] != L->data[write - 1]) {
            L->data[write++] = L->data[read];
        }
    }
    L->length = write;
}

// 前置条件：A、B 分别非递减有序；C 不与 A、B 指向同一对象。
// 合并保留重复元素，结果写入 C。
bool SqMergeSorted(const SqList *A, const SqList *B, SqList *C) {
    if (A == NULL || B == NULL || C == NULL || C == A || C == B) {
        return false;
    }
    if (A->length + B->length > SQ_CAPACITY) {
        return false;
    }
    int i = 0, j = 0, k = 0;
    while (i < A->length && j < B->length) {
        if (A->data[i] <= B->data[j]) {
            C->data[k++] = A->data[i++];
        } else {
            C->data[k++] = B->data[j++];
        }
    }
    while (i < A->length) {
        C->data[k++] = A->data[i++];
    }
    while (j < B->length) {
        C->data[k++] = B->data[j++];
    }
    C->length = k;
    return true;
}
```

- 有序去重：相等值连续出现，比较最后保留值即可；时间 $O(n)$、辅助空间 $O(1)$。无序表不能直接套用。
- 有序合并：每次取当前较小值，时间 $O(m+n)$；输出表容纳 $m+n$ 个元素，输出空间应单独说明。除输出表外只使用常量工作变量。
- 合并和去重是两种不同的操作；上面的合并不会删除相等元素。

## 2.3 线性表的链式表示

### 2.3.1 单链表的定义

#### 单链表结点与链接

每个结点包含数据域和指向后继的指针域。逻辑次序由链接表示，结点地址不要求连续。

```cpp
typedef struct LNode {
    ElemType data;
    struct LNode *next;
} LNode, *LinkList;

LNode *NewLNode(ElemType value) {
    LNode *p = (LNode *)malloc(sizeof(LNode));
    if (p == NULL) {
        return NULL;
    }
    p->data = value;
    p->next = NULL;
    return p;
}
```

`LinkList` 和 `LNode *` 是同一种指针类型；前者通常强调“头指针”，后者强调“某个结点指针”。类型名并不会自动判断一个结点是否在某条链表中。

#### 头指针、头结点与首元结点

| 名称 | 含义 |
| --- | --- |
| 头指针 | 标识链表入口的指针变量 |
| 头结点 | 可选的辅助结点，放在第一个数据结点之前，通常不存有效表元素 |
| 首元结点 | 存放第一个数据元素的结点；空表时不存在 |

本页普通单链表统一**带头结点**：

```text
L → [头结点] → [a1] → [a2] → … → [an] → NULL
```

- 空表：`L != NULL` 且 `L->next == NULL`。
- `L == NULL`：本页表示未建立或已销毁，不是已初始化的带头结点空表。
- 头结点不计入表长；为了统一内部定位，可把它视作“位序 0”。
- 不带头结点的表：头指针直接指向首元结点，空表头指针为 `NULL`。

**作用：** 带头结点后，首位置插入、删除也可以统一为“修改前驱结点的链接”，无需单独修改头指针。

#### 单链表初始化

```cpp
bool InitLinkList(LinkList *L) {
    if (L == NULL) {
        return false;
    }
    *L = NewLNode(0);           // 头结点 data 不作为表元素
    return *L != NULL;
}

// 调用方式：LinkList L = NULL; InitLinkList(&L);
```

**指针层次：** `L` 是输出参数，`*L` 才是调用者的头指针。若仅按值传入一个空头指针并在函数内给它赋值，不能改变调用者的指针变量。

#### 不带头结点时的首位置操作

```cpp
// 这里的 *L 直接指向首元结点，空表时为 NULL。
bool HeadlessPushFront(LinkList *L, ElemType value) {
    if (L == NULL) {
        return false;
    }
    LNode *s = NewLNode(value);
    if (s == NULL) {
        return false;
    }
    s->next = *L;
    *L = s;
    return true;
}

bool HeadlessPopFront(LinkList *L, ElemType *value) {
    if (L == NULL || *L == NULL || value == NULL) {
        return false;
    }
    LNode *q = *L;
    *value = q->data;
    *L = q->next;
    free(q);
    return true;
}
```

这两段用于对比头指针的修改，不可直接把带头结点的表传给它们，否则会把辅助头结点当作数据结点处理。

### 2.3.2 单链表上基本操作的实现

#### 单链表按位定位、读取与修改

```cpp
// 内部定位函数：i == 0 返回头结点；i >= 1 定位数据结点。
LNode *LinkNodeAt(LinkList L, int i) {
    if (L == NULL || i < 0) {
        return NULL;
    }
    LNode *p = L;
    int j = 0;
    while (p != NULL && j < i) {
        p = p->next;
        ++j;
    }
    return p;
}

bool LinkGet(LinkList L, int i, ElemType *value) {
    if (i < 1 || value == NULL) {
        return false;
    }
    LNode *p = LinkNodeAt(L, i);
    if (p == NULL) {
        return false;
    }
    *value = p->data;
    return true;
}

bool LinkSet(LinkList L, int i, ElemType value) {
    if (i < 1) {
        return false;
    }
    LNode *p = LinkNodeAt(L, i);
    if (p == NULL) {
        return false;
    }
    p->data = value;
    return true;
}
```

定位第 $i$ 个数据结点需要沿链接走 $i$ 步，最坏 $O(n)$。已持有该数据结点的有效指针时，直接读写其数据域为 $O(1)$。

**易错点：** `L + i` 是地址运算，不是“沿链表走到第 $i$ 个结点”。链表没有顺序表那样的按位随机访问能力。

#### 单链表按值查找

```cpp
int LinkLocate(LinkList L, ElemType value) {
    if (L == NULL) {
        return 0;
    }
    LNode *p = L->next;
    int i = 1;
    while (p != NULL) {
        if (p->data == value) {
            return i;
        }
        p = p->next;
        ++i;
    }
    return 0;
}
```

最坏 $O(n)$。若接口要求返回结点地址，可在命中时返回 `p`，失败返回 `NULL`，但不能把位序和指针混为同一种返回值。

#### 单链表后插与按位插入

```cpp
// 前置条件：p 是目标单链表中的有效结点，可为头结点。
bool LinkInsertAfter(LNode *p, ElemType value) {
    if (p == NULL) {
        return false;
    }
    LNode *s = NewLNode(value);
    if (s == NULL) {
        return false;
    }
    s->next = p->next;          // 先保存原后继
    p->next = s;
    return true;
}

bool LinkInsert(LinkList L, int i, ElemType value) {
    if (i < 1) {
        return false;
    }
    LNode *p = LinkNodeAt(L, i - 1);
    if (p == NULL) {
        return false;
    }
    return LinkInsertAfter(p, value);
}
```

```text
修改前：p → q
修改后：p → s → q
```

- 已知前驱 `p`：链接修改为 $O(1)$；常见考试模型把单结点申请视作常量代价。
- 按位插入：先寻找第 $i-1$ 个结点，最坏 $O(n)$。
- 带头结点的空表，位序 1 插入的前驱就是头结点。

**易错点：** 若先执行 `p->next = s`，再写 `s->next = p->next`，会让 `s` 指向自己，并丢失原来的后继链。

#### 单链表删除后继与按位删除

```cpp
bool LinkDeleteAfter(LNode *p, ElemType *value) {
    if (p == NULL || p->next == NULL || value == NULL) {
        return false;
    }
    LNode *q = p->next;
    *value = q->data;
    p->next = q->next;
    free(q);
    return true;
}

bool LinkDelete(LinkList L, int i, ElemType *value) {
    if (i < 1 || value == NULL) {
        return false;
    }
    LNode *p = LinkNodeAt(L, i - 1);
    return LinkDeleteAfter(p, value);
}
```

先保存目标结点及其信息，完成断链，再释放。已知前驱时 $O(1)$；按位定位并删除最坏 $O(n)$。

**易错点：** 释放后不能再访问 `q->next`；只断链却不释放动态申请的数据结点会造成内存泄漏。

#### 仅给定结点时的前插与删除技巧

单链表不能由 `p` 直接取得它的前驱。若只要求实现**元素序列的变化**，可以借助复制数据做局部变换。

```cpp
// p 必须是数据结点；把 value 插到原 p 元素之前。
bool LinkInsertBeforeByCopy(LNode *p, ElemType value) {
    if (p == NULL) {
        return false;
    }
    LNode *s = NewLNode(p->data);
    if (s == NULL) {
        return false;
    }
    s->next = p->next;
    p->next = s;
    p->data = value;
    return true;
}

// p 必须是非尾部数据结点；从序列中删除原 p 的元素。
bool LinkDeleteKnownByCopy(LNode *p, ElemType *value) {
    if (p == NULL || p->next == NULL || value == NULL) {
        return false;
    }
    LNode *q = p->next;
    *value = p->data;
    p->data = q->data;
    p->next = q->next;
    free(q);
    return true;
}
```

**必须记住限制：**

- 前插技巧把新值写进 `p`，原值移到新结点；不能用于辅助头结点。
- 删除技巧保留 `p` 的物理地址，实际释放其后继；不能删除尾结点。
- 若题目要求真正释放指定结点、保持结点身份，或外部还保存其他结点指针，这些技巧不一定符合要求。
- 要真正删除给定结点，一般仍需从头查找它的前驱，最坏 $O(n)$。

#### 单链表长度、遍历、清空与销毁

```cpp
int LinkLength(LinkList L) {
    if (L == NULL) {
        return 0;
    }
    int n = 0;
    for (LNode *p = L->next; p != NULL; p = p->next) {
        ++n;
    }
    return n;
}

bool LinkEmpty(LinkList L) {
    return L != NULL && L->next == NULL;
}

void LinkPrint(LinkList L) {
    if (L == NULL) {
        return;
    }
    for (LNode *p = L->next; p != NULL; p = p->next) {
        printf("%d ", p->data);
    }
    printf("\n");
}

void LinkClear(LinkList L) {
    if (L == NULL) {
        return;
    }
    LNode *p = L->next;
    while (p != NULL) {
        LNode *next = p->next;
        free(p);
        p = next;
    }
    L->next = NULL;
}

void DestroyLinkList(LinkList *L) {
    if (L == NULL || *L == NULL) {
        return;
    }
    LinkClear(*L);
    free(*L);
    *L = NULL;
}
```

本页单链表没有维护额外长度字段，求长度为 $O(n)$；若维护并正确更新长度字段，可以 $O(1)$ 取得长度。清空、销毁都需要逐一释放数据结点，时间 $O(n)$。

#### 头插法与尾插法建表

```cpp
// 前置条件：L 是已初始化的空表；n >= 0。
// 申请失败时清除本次已建结点，使 L 恢复为空表。
bool LinkBuildHead(LinkList L, const ElemType a[], int n) {
    if (L == NULL || L->next != NULL || n < 0 || (n > 0 && a == NULL)) {
        return false;
    }
    for (int j = 0; j < n; ++j) {
        if (!LinkInsertAfter(L, a[j])) {
            LinkClear(L);
            return false;
        }
    }
    return true;
}

bool LinkBuildTail(LinkList L, const ElemType a[], int n) {
    if (L == NULL || L->next != NULL || n < 0 || (n > 0 && a == NULL)) {
        return false;
    }
    LNode *tail = L;
    for (int j = 0; j < n; ++j) {
        LNode *s = NewLNode(a[j]);
        if (s == NULL) {
            LinkClear(L);
            return false;
        }
        tail->next = s;
        tail = s;
    }
    return true;
}
```

输入 $(1,2,3)$：头插结果为 $(3,2,1)$，尾插结果为 $(1,2,3)$。

- 头插法每次在首部插入，顺序与输入相反。
- 尾插法维护尾指针，保留输入顺序，总时间 $O(n)$。
- 若每插入一个元素都从头寻找表尾，总时间可能是 $O(n^2)$。
- 尾指针初值设为头结点；新尾结点的 `next` 必须为 `NULL`。

#### 单链表基本操作复杂度

| 操作与已知信息 | 最坏时间 | 原因 |
| --- | --- | --- |
| 按位读取、修改 | $O(n)$ | 需要遍历定位 |
| 按值查找 | $O(n)$ | 可能扫描全表 |
| 按位插入、删除 | $O(n)$ | 查找前驱占主导 |
| 已知前驱，插入或删除其后继 | $O(1)$ | 常量次链接修改 |
| 真正删除指定结点，只给它的指针 | $O(n)$ | 一般要找前驱 |
| 复制后继值实现删除元素 | $O(1)$ | 仅适用于非尾结点且题意允许 |
| 未维护长度的求长度、全表遍历 | $O(n)$ | 逐结点访问 |
| 判空 | $O(1)$ | 检查头结点后继 |
| 保持尾指针的连续尾插建表 | $O(n)$ | 每个元素一次插入 |

以上常见迭代操作辅助空间为 $O(1)$，新申请的数据结点属于结果链表本身的存储空间。

#### 单链表常见算法：原地逆置

```cpp
// 带头结点，头结点保留；原数据结点重新链接。
void LinkReverse(LinkList L) {
    if (L == NULL) {
        return;
    }
    LNode *prev = NULL;
    LNode *current = L->next;
    while (current != NULL) {
        LNode *next = current->next;  // 改链接前保存未处理链
        current->next = prev;
        prev = current;
        current = next;
    }
    L->next = prev;
}
```

每轮把一个结点接到已逆置部分之前，最后头结点指向原尾结点。时间 $O(n)$、辅助空间 $O(1)$，不申请新数据结点。

**边界：** 空表与单元素表同样可用。原首元结点成为尾结点，`next` 最终为 `NULL`。

#### 单链表常见算法：删除所有指定值

```cpp
void LinkEraseValue(LinkList L, ElemType value) {
    if (L == NULL) {
        return;
    }
    LNode *prev = L;
    LNode *current = L->next;
    while (current != NULL) {
        if (current->data == value) {
            prev->next = current->next;
            free(current);
            current = prev->next;  // 前驱不动，继续检查新的后继
        } else {
            prev = current;
            current = current->next;
        }
    }
}
```

时间 $O(n)$、辅助空间 $O(1)$。

**例：** $(2,2,3,2)$ 删除所有 2 后为 $(3)$。命中并删除时若错误地同时推进前驱，会漏掉连续匹配元素，甚至访问已释放结点。

#### 单链表常见算法：倒数第k个结点

```cpp
LNode *LinkKthFromEnd(LinkList L, int k) {
    if (L == NULL || k <= 0) {
        return NULL;
    }
    LNode *fast = L->next;
    LNode *slow = L->next;
    for (int j = 0; j < k; ++j) {
        if (fast == NULL) {
            return NULL;         // 表长不足 k
        }
        fast = fast->next;
    }
    while (fast != NULL) {
        fast = fast->next;
        slow = slow->next;
    }
    return slow;
}
```

快指针先前进 $k$ 步，随后二者同步前进。快指针到 `NULL` 时，慢指针指向倒数第 $k$ 个结点。时间 $O(n)$、辅助空间 $O(1)$，不必先求表长。

**边界：** $k=1$ 返回尾结点；$k=n$ 返回首元结点；$k\le0$ 或 $k>n$ 返回 `NULL`。

#### 单链表常见算法：有序合并并复用结点

```cpp
// 前置条件：A、*B 是不同且不共享任何结点的带头结点单链表；
// 两者非递减有序。结果保存在 A，B 的头结点释放，*B 置 NULL。
// 不复制数据结点，保留所有元素，包括重复值。
bool LinkMergeSorted(LinkList A, LinkList *B) {
    if (A == NULL || B == NULL || *B == NULL || A == *B) {
        return false;
    }
    LNode *p = A->next;
    LNode *q = (*B)->next;
    LNode *tail = A;
    while (p != NULL && q != NULL) {
        if (p->data <= q->data) {
            tail->next = p;
            p = p->next;
        } else {
            tail->next = q;
            q = q->next;
        }
        tail = tail->next;
    }
    tail->next = (p != NULL) ? p : q;
    free(*B);                  // 只释放不再使用的 B 头结点
    *B = NULL;
    return true;
}
```

最坏时间 $O(m+n)$、辅助空间 $O(1)$。合并后，原 B 的数据结点归结果 A 所有，不能再沿原 B 独立销毁，否则可能重复释放。

**考点提示：** 原结点复用、另外新建结果链表、输出升序或降序，是不同题目约束；不能不看条件直接套代码。

#### 单链表常见算法：两个表的公共结点

若两条非循环单链表在某个数据结点处相交，由于每个结点只有一个后继，从相交点起必然共享同一条后缀。元素值相等不代表结点相同，应比较**结点地址**。

```cpp
// 输入允许共享后缀；函数只读取链接，不修改或释放结点。
LNode *LinkFirstCommon(LinkList A, LinkList B) {
    if (A == NULL || B == NULL) {
        return NULL;
    }
    int m = LinkLength(A);
    int n = LinkLength(B);
    LNode *p = A->next;
    LNode *q = B->next;
    while (m > n) {
        p = p->next;
        --m;
    }
    while (n > m) {
        q = q->next;
        --n;
    }
    while (p != q) {
        p = p->next;
        q = q->next;
    }
    return p;                  // 无公共结点时二者同时到 NULL
}
```

时间 $O(m+n)$、辅助空间 $O(1)$。这类结构存在共享所有权，不能对两张表分别调用普通销毁函数而重复释放共享部分。

### 2.3.3 双链表

#### 双链表结构与边界

结点增加 `prior` 指针，分别指向直接前驱和直接后继。这里先使用**带头结点、非循环**双链表：

```cpp
typedef struct DNode {
    ElemType data;
    struct DNode *prior;
    struct DNode *next;
} DNode, *DLinkList;

bool InitDLinkList(DLinkList *L) {
    if (L == NULL) {
        return false;
    }
    *L = (DNode *)malloc(sizeof(DNode));
    if (*L == NULL) {
        return false;
    }
    (*L)->prior = NULL;
    (*L)->next = NULL;
    return true;
}
```

- 头结点 `prior == NULL`，尾结点 `next == NULL`。
- 首元结点 `prior` 指向头结点。
- 数据结点之间应满足：有后继时 `p->next->prior == p`，有前驱时 `p->prior->next == p`。
- 增加反向链接不会把线性表变成非线性结构。

#### 双链表后插

```cpp
// p 为本表中的有效结点，可为头结点。
bool DInsertAfter(DNode *p, ElemType value) {
    if (p == NULL) {
        return false;
    }
    DNode *s = (DNode *)malloc(sizeof(DNode));
    if (s == NULL) {
        return false;
    }
    s->data = value;
    s->prior = p;
    s->next = p->next;
    if (p->next != NULL) {
        p->next->prior = s;
    }
    p->next = s;
    return true;
}
```

```text
修改前：p ⇄ q
修改后：p ⇄ s ⇄ q
```

已有 `p` 时为 $O(1)$。尾插时没有原后继，不能无条件访问 `p->next->prior`。

**记忆顺序：** 先让新结点保存两侧，再修改原后继的前驱，最后修改原前驱的后继。其他正确顺序也可用，但不能提前丢失原后继。

#### 双链表删除已知结点

```cpp
// p 必须是本表中的数据结点，不能是头结点。
bool DDeleteNode(DNode *p, ElemType *value) {
    if (p == NULL || p->prior == NULL || value == NULL) {
        return false;
    }
    *value = p->data;
    p->prior->next = p->next;
    if (p->next != NULL) {
        p->next->prior = p->prior;
    }
    free(p);
    return true;
}
```

给定数据结点 `p`，可通过 `p->prior` 直接取得前驱，真正删除该结点为 $O(1)$，包括删除尾结点。这是它与单链表的重要区别。

#### 双链表按位操作、查找与修改

```cpp
DNode *DNodeAt(DLinkList L, int i) {
    if (L == NULL || i < 0) {
        return NULL;
    }
    DNode *p = L;
    for (int j = 0; j < i && p != NULL; ++j) {
        p = p->next;
    }
    return p;
}

bool DGet(DLinkList L, int i, ElemType *value) {
    if (i < 1 || value == NULL) {
        return false;
    }
    DNode *p = DNodeAt(L, i);
    if (p == NULL) {
        return false;
    }
    *value = p->data;
    return true;
}

int DLocate(DLinkList L, ElemType value) {
    if (L == NULL) {
        return 0;
    }
    int i = 1;
    for (DNode *p = L->next; p != NULL; p = p->next, ++i) {
        if (p->data == value) {
            return i;
        }
    }
    return 0;
}

bool DSet(DLinkList L, int i, ElemType value) {
    if (i < 1) {
        return false;
    }
    DNode *p = DNodeAt(L, i);
    if (p == NULL) {
        return false;
    }
    p->data = value;
    return true;
}

bool DInsert(DLinkList L, int i, ElemType value) {
    if (i < 1) {
        return false;
    }
    return DInsertAfter(DNodeAt(L, i - 1), value);
}

bool DDelete(DLinkList L, int i, ElemType *value) {
    if (i < 1) {
        return false;
    }
    return DDeleteNode(DNodeAt(L, i), value);
}
```

按位定位仍最坏 $O(n)$，双向访问不等于随机访问。若另有尾指针和表长，可按位置选择从前或从后定位，但最坏仍为线性阶。

#### 双链表清空与销毁

```cpp
void DClear(DLinkList L) {
    if (L == NULL) {
        return;
    }
    DNode *p = L->next;
    while (p != NULL) {
        DNode *next = p->next;
        free(p);
        p = next;
    }
    L->next = NULL;
}

void DestroyDLinkList(DLinkList *L) {
    if (L == NULL || *L == NULL) {
        return;
    }
    DClear(*L);
    free(*L);
    *L = NULL;
}
```

**易错点：** 只更新 `next`、忘记 `prior`，可能导致正向遍历看似正确、反向遍历错误。销毁时保存后继后再释放，不能对 `malloc` 申请的结点使用不匹配的释放方式。

### 2.3.4 循环链表

#### 循环单链表结构与判空

带头结点循环单链表中，尾结点的 `next` 指向头结点，而不是 `NULL`。

```text
L → [头结点] → [a1] → … → [an]
      ↑___________________|
```

空表时头结点的 `next` 指向它自己。本小节使用**头指针**调用常规函数：

```cpp
typedef LNode *CLinkList;

bool InitCLinkList(CLinkList *L) {
    if (L == NULL) {
        return false;
    }
    *L = NewLNode(0);
    if (*L == NULL) {
        return false;
    }
    (*L)->next = *L;
    return true;
}

bool CListEmpty(CLinkList L) {
    return L != NULL && L->next == L;
}

int CListLength(CLinkList L) {
    if (L == NULL) {
        return 0;
    }
    int n = 0;
    for (LNode *p = L->next; p != L; p = p->next) {
        ++n;
    }
    return n;
}
```

**终止条件：** 从首元结点开始，回到头结点时结束。不能沿用普通单链表的 `p != NULL`，否则会无限循环。

#### 循环单链表定位与增删改查

```cpp
LNode *CNodeAt(CLinkList L, int i) {
    if (L == NULL || i < 0) {
        return NULL;
    }
    LNode *p = L;
    for (int j = 0; j < i; ++j) {
        p = p->next;
        if (p == L) {
            return NULL;          // 已绕回头结点，位序超界
        }
    }
    return p;                     // i == 0 返回头结点
}

bool CGet(CLinkList L, int i, ElemType *value) {
    if (i < 1 || value == NULL) {
        return false;
    }
    LNode *p = CNodeAt(L, i);
    if (p == NULL) {
        return false;
    }
    *value = p->data;
    return true;
}

int CLocate(CLinkList L, ElemType value) {
    if (L == NULL) {
        return 0;
    }
    int i = 1;
    for (LNode *p = L->next; p != L; p = p->next, ++i) {
        if (p->data == value) {
            return i;
        }
    }
    return 0;
}

bool CSet(CLinkList L, int i, ElemType value) {
    if (i < 1) {
        return false;
    }
    LNode *p = CNodeAt(L, i);
    if (p == NULL) {
        return false;
    }
    p->data = value;
    return true;
}

bool CInsert(CLinkList L, int i, ElemType value) {
    if (i < 1) {
        return false;
    }
    LNode *p = CNodeAt(L, i - 1);
    if (p == NULL) {
        return false;
    }
    LNode *s = NewLNode(value);
    if (s == NULL) {
        return false;
    }
    s->next = p->next;
    p->next = s;
    return true;
}

bool CDelete(CLinkList L, int i, ElemType *value) {
    if (i < 1 || value == NULL) {
        return false;
    }
    LNode *p = CNodeAt(L, i - 1);
    if (p == NULL || p->next == L) {
        return false;
    }
    LNode *q = p->next;
    *value = q->data;
    p->next = q->next;
    free(q);
    return true;
}
```

一般按位操作最坏 $O(n)$；已知前驱时链接修改仍是 $O(1)$。删除最后一个数据结点后，其前驱重新指向头结点；删除唯一数据结点后恢复 `L->next == L`。

#### 循环单链表遍历、清空与销毁

```cpp
void CPrint(CLinkList L) {
    if (L == NULL) {
        return;
    }
    for (LNode *p = L->next; p != L; p = p->next) {
        printf("%d ", p->data);
    }
    printf("\n");
}

void CClear(CLinkList L) {
    if (L == NULL) {
        return;
    }
    LNode *p = L->next;
    while (p != L) {
        LNode *next = p->next;
        free(p);
        p = next;
    }
    L->next = L;
}

void DestroyCLinkList(CLinkList *L) {
    if (L == NULL || *L == NULL) {
        return;
    }
    CClear(*L);
    free(*L);
    *L = NULL;
}
```

同样的 `LNode` 类型可以表示普通或循环单链表，但它们的终止条件不同，清空与销毁函数不能混用。

#### 循环单链表的尾指针与连接

若用尾指针 `R` 标识带头结点循环单链表：

- 头结点是 `R->next`。
- 首元结点是 `R->next->next`，前提是非空。
- 空表时 `R` 指向头结点，`R->next == R`。
- 已知尾指针时可 $O(1)$ 获取头结点、首元结点和尾结点。
- 只有头指针时，寻找尾结点仍需要 $O(n)$。

下面把两表连接为 A 在前、B 在后，保留 A 头结点、释放 B 头结点。**此函数参数是尾指针变量的地址，与上面的头指针接口不同。**

```cpp
// 前置条件：两个有效且互不共享结点的带头结点循环单链表。
// 成功后 *tailA 为结果尾指针，*tailB 置 NULL。
bool CConcatTails(CLinkList *tailA, CLinkList *tailB) {
    if (tailA == NULL || tailB == NULL ||
        *tailA == NULL || *tailB == NULL || *tailA == *tailB) {
        return false;
    }
    LNode *headA = (*tailA)->next;
    LNode *headB = (*tailB)->next;
    if (*tailB == headB) {          // B 为空
        free(headB);
        *tailB = NULL;
        return true;
    }
    (*tailA)->next = headB->next;  // A 尾接 B 的首元结点
    (*tailB)->next = headA;        // B 尾回到 A 头结点
    *tailA = *tailB;
    free(headB);
    *tailB = NULL;
    return true;
}
```

时间 $O(1)$、辅助空间 $O(1)$。A 空而 B 非空时，A 的“尾”就是头结点，上述接链仍成立；B 空必须先处理，不能把将要释放的 B 头结点当作结果尾。

**易错点：** 两表连接不能把 B 的头结点留在数据结点序列中，否则遍历会把辅助结点当成表元素。

#### 循环双链表结构与基本操作

带头结点循环双链表中，头结点的 `next` 指向首元结点、`prior` 指向尾结点；空表两个方向都指向头结点自身。

```cpp
typedef DNode *CDLinkList;

bool InitCDLinkList(CDLinkList *L) {
    if (L == NULL) {
        return false;
    }
    *L = (DNode *)malloc(sizeof(DNode));
    if (*L == NULL) {
        return false;
    }
    (*L)->next = *L;
    (*L)->prior = *L;
    return true;
}

// p 是本表中的有效结点，允许 p 为头结点。
bool CDInsertAfter(CDLinkList L, DNode *p, ElemType value) {
    if (L == NULL || p == NULL) {
        return false;
    }
    DNode *s = (DNode *)malloc(sizeof(DNode));
    if (s == NULL) {
        return false;
    }
    s->data = value;
    s->next = p->next;
    s->prior = p;
    p->next->prior = s;
    p->next = s;
    return true;
}

// p 是本表中的有效数据结点，显式拒绝删除头结点。
bool CDDeleteNode(CDLinkList L, DNode *p, ElemType *value) {
    if (L == NULL || p == NULL || p == L || value == NULL) {
        return false;
    }
    *value = p->data;
    p->prior->next = p->next;
    p->next->prior = p->prior;
    free(p);
    return true;
}

void CDPrintReverse(CDLinkList L) {
    if (L == NULL) {
        return;
    }
    for (DNode *p = L->prior; p != L; p = p->prior) {
        printf("%d ", p->data);
    }
    printf("\n");
}

void CDClear(CDLinkList L) {
    if (L == NULL) {
        return;
    }
    DNode *p = L->next;
    while (p != L) {
        DNode *next = p->next;
        free(p);
        p = next;
    }
    L->next = L;
    L->prior = L;
}

void DestroyCDLinkList(CDLinkList *L) {
    if (L == NULL || *L == NULL) {
        return;
    }
    CDClear(*L);
    free(*L);
    *L = NULL;
}
```

已知结点的插入、删除为 $O(1)$。取首尾结点均为 $O(1)$；按位定位仍需沿链接走，最坏 $O(n)$。查找、读取、修改可用 `p = L->next` 开始且 `p != L` 结束的正向遍历，不可混用普通双链表的 `NULL` 终止条件。

**例：** 只有一个数据结点时删除它，前驱和后继都为头结点，两条链接更新后同时恢复头结点自环。

#### 四种链表的终止与判空对照

| 带头结点的表 | 空表判断 | 正向遍历结束 | 头尾的特殊链接 |
| --- | --- | --- | --- |
| 普通单链表 | `L->next == NULL` | `p == NULL` | 尾结点 `next == NULL` |
| 普通双链表 | `L->next == NULL` | `p == NULL` | 头 `prior == NULL`，尾 `next == NULL` |
| 循环单链表 | `L->next == L` | `p == L` | 尾结点 `next == L` |
| 循环双链表 | `L->next == L` | `p == L` | 头 `prior` 指向尾，尾 `next` 指向头 |

表中的判断均以 `L` 是有效头结点为前提。循环双链表空表还应有 `L->prior == L`。

### 2.3.5 静态链表

#### 静态链表结构与游标约定

用数组保存结点，用数组下标（游标）表示链接。虽然数组连续，**逻辑次序仍由游标链决定**，不要求有效结点下标连续。

本页明确采用以下约定：下标 0 是主链头结点，`-1` 为空游标，1 到容量减 1 为可用数据结点。不同教材代码可能采用 0 作为空游标；读题时应先确认约定，不能混用。

```cpp
enum {
    STATIC_CAPACITY = 100,
    STATIC_HEAD = 0,
    STATIC_NULL = -1
};

typedef struct {
    ElemType data;
    int next;
} StaticNode;

typedef struct {
    StaticNode node[STATIC_CAPACITY];
    int freeHead;               // 备用链首游标
    int length;
} StaticList;

void InitStaticList(StaticList *L) {
    L->node[STATIC_HEAD].next = STATIC_NULL;
    L->freeHead = 1;
    L->length = 0;
    for (int k = 1; k < STATIC_CAPACITY - 1; ++k) {
        L->node[k].next = k + 1;
    }
    L->node[STATIC_CAPACITY - 1].next = STATIC_NULL;
}
```

本实现最多容纳 99 个数据元素。主链保存有效元素，备用链保存未使用位置；同一个数据槽不能同时出现在两条链中。

**例：** 主链游标 `0 → 6 → 2 → 9 → -1`，逻辑第 2 个元素存放在 `node[2]`。这次下标与位序碰巧相同，不能据此把 `node[i]` 当作普遍的第 $i$ 个元素。

#### 备用链的申请与回收

```cpp
// 内部函数：从备用链取一个槽位，失败返回 -1。
int StaticAlloc(StaticList *L) {
    int k = L->freeHead;
    if (k == STATIC_NULL) {
        return STATIC_NULL;
    }
    L->freeHead = L->node[k].next;
    return k;
}

// 内部函数：k 为不再属于主链的有效数据槽，不能为头结点。
void StaticFree(StaticList *L, int k) {
    L->node[k].next = L->freeHead;
    L->freeHead = k;
}
```

这里的“申请、释放”是数组槽位的逻辑分配与回收，不是调用堆内存的 `malloc/free`。从备用链首部取、还槽位均为 $O(1)$。

#### 静态链表定位、查找与修改

```cpp
// i == 0 返回头结点游标；i >= 1 返回对应数据结点游标。
int StaticNodeAt(const StaticList *L, int i) {
    if (L == NULL || i < 0) {
        return STATIC_NULL;
    }
    int k = STATIC_HEAD;
    for (int j = 0; j < i && k != STATIC_NULL; ++j) {
        k = L->node[k].next;
    }
    return k;
}

bool StaticGet(const StaticList *L, int i, ElemType *value) {
    if (i < 1 || value == NULL) {
        return false;
    }
    int k = StaticNodeAt(L, i);
    if (k == STATIC_NULL) {
        return false;
    }
    *value = L->node[k].data;
    return true;
}

int StaticLocate(const StaticList *L, ElemType value) {
    if (L == NULL) {
        return 0;
    }
    int i = 1;
    for (int k = L->node[STATIC_HEAD].next;
         k != STATIC_NULL; k = L->node[k].next, ++i) {
        if (L->node[k].data == value) {
            return i;
        }
    }
    return 0;
}

bool StaticSet(StaticList *L, int i, ElemType value) {
    if (i < 1) {
        return false;
    }
    int k = StaticNodeAt(L, i);
    if (k == STATIC_NULL) {
        return false;
    }
    L->node[k].data = value;
    return true;
}
```

知道物理槽位下标时可 $O(1)$ 访问该槽；只知道逻辑位序时仍要沿游标遍历，最坏 $O(n)$。静态链表不具备顺序表那样的按位随机访问。

#### 静态链表插入与删除

```cpp
bool StaticInsert(StaticList *L, int i, ElemType value) {
    if (L == NULL || i < 1 || i > L->length + 1) {
        return false;
    }
    int prev = StaticNodeAt(L, i - 1);
    int k = StaticAlloc(L);
    if (k == STATIC_NULL) {
        return false;
    }
    L->node[k].data = value;
    L->node[k].next = L->node[prev].next;
    L->node[prev].next = k;
    ++L->length;
    return true;
}

bool StaticDelete(StaticList *L, int i, ElemType *value) {
    if (L == NULL || value == NULL || i < 1 || i > L->length) {
        return false;
    }
    int prev = StaticNodeAt(L, i - 1);
    int k = L->node[prev].next;
    *value = L->node[k].data;
    L->node[prev].next = L->node[k].next;
    StaticFree(L, k);
    --L->length;
    return true;
}

void StaticClear(StaticList *L) {
    int k = L->node[STATIC_HEAD].next;
    while (k != STATIC_NULL) {
        int next = L->node[k].next;
        StaticFree(L, k);
        k = next;
    }
    L->node[STATIC_HEAD].next = STATIC_NULL;
    L->length = 0;
}
```

按位插入、删除的最坏时间 $O(n)$，确定前驱后的游标修改为 $O(1)$。清空将全部有效槽放回备用链，时间 $O(n)$。

**易错点：** 删除后必须回收游标，否则可用槽越来越少；先回收再读取原 `next` 会丢失主链后继，因为回收函数已经改写该字段。

#### 静态链表的使用特点

- 不需为每个结点单独申请动态内存，可以用数组与游标模拟链接。
- 仍需预留固定容量，容量不足时不能继续插入。
- 插入、删除不需要搬移大量数据元素，但需要维护主链和备用链。
- `freeHead == -1` 表示无可用槽；主链头结点的 `next == -1` 表示表空。这两种状态不同。
- 本实现维护 `length`，求长度与判空为 $O(1)$；这并非所有静态链表实现都必然提供的字段。

### 2.3.6 顺序表和链表的比较

#### 存储与访问方式的比较

| 维度 | 顺序表 | 链表 |
| --- | --- | --- |
| 逻辑结构 | 线性关系 | 同样是线性关系 |
| 关系的表示 | 用连续存储体现先后次序 | 用指针或游标表示先后次序 |
| 存储地址 | 有效元素连续 | 动态结点可不连续；静态链表的逻辑邻接由游标决定 |
| 按逻辑位序访问 | $O(1)$ | 最坏 $O(n)$ |
| 无序表按值查找 | 最坏 $O(n)$ | 最坏 $O(n)$ |
| 存储开销 | 可能预留未使用容量 | 需要链接域；动态分配还可能有管理开销 |
| 扩展 | 静态表容量固定；动态表扩容需要连续空间，可能复制 | 动态链表可按结点申请；静态链表仍受数组容量限制 |
| 访问局部性 | 连续访问通常有较好的局部性 | 动态结点可能分散 |

**存储密度：** 常指结点中数据部分占结点总空间的比例。链式存储有链接域，不能只计算数据域；若题目给出字节数，按给定大小计算，注意结构体填充可能影响实际 `sizeof`。

顺序表没有每元素的指针域，但容量远大于表长时仍会有未使用空间。不能不看容量、数据大小和链接开销就断言哪一种实现总空间一定更少。

#### 插入删除的比较前提

| 条件 | 顺序表 | 单链表 | 双链表 |
| --- | --- | --- | --- |
| 给定逻辑位序插入 | 定位 $O(1)$，移动最坏 $O(n)$ | 找前驱最坏 $O(n)$，接链 $O(1)$ | 定位最坏 $O(n)$，接链 $O(1)$ |
| 给定逻辑位序删除 | 定位 $O(1)$，移动最坏 $O(n)$ | 找前驱最坏 $O(n)$，断链 $O(1)$ | 定位最坏 $O(n)$，断链 $O(1)$ |
| 已知前驱结点，插入后继 | 数组仍可能需要移动 | $O(1)$ | $O(1)$ |
| 已知前驱，删除后继 | 数组仍可能需要移动 | $O(1)$ | $O(1)$ |
| 只知待删数据结点地址，要求真正删该结点 | 按数组表示处理，通常仍需移动 | 一般找前驱，最坏 $O(n)$ | $O(1)$ |
| 尾部追加，已有足够容量或有效尾指针 | $O(1)$ | 已有尾指针为 $O(1)$ | 已有尾指针为 $O(1)$ |

**典型辨析：** “经常插删就一定选链表”说得不够完整。若每次只给一个位序，链表仍需先定位；若操作集中于已知结点附近，链接修改才体现优势。

**同阶不等于同工作量：** 按随机位序插入时，顺序表主要搬移数据，单链表主要遍历前驱；二者都可为线性阶，但元素大小、访问模式和分配方式会影响实际代价。

#### 按使用场景选择结构

- 经常按序号读取、需要直接访问中间元素：优先考虑顺序表。
- 已知操作结点位置、经常局部插入或删除：链式结构可避免移动其他元素。
- 经常删除给定结点、或需从结点向前访问：双链表更合适。
- 经常在首尾操作：考虑维护尾指针，或使用带头结点循环双链表。
- 规模难预估：动态顺序表或动态链表都可考虑，但扩容与分配代价不同。
- 使用受限环境，只能用预分配数组模拟链接：考虑静态链表。
- 有序查找需要频繁直接取中点：顺序表适合；链表不能直接以常数代价按位取得中点。

**作答方法：** 先写关键操作及已知信息，再分别比较定位、修改、存储开销；不要只写“链表方便”“顺序表快”。

## 高频考点与易错点

| 题目或代码中的信号 | 应检查什么 |
| --- | --- |
| “有序的线性表” | “有序”是定义中的逻辑次序，还是题目额外规定的按值排序？ |
| 第 $i$ 个元素 | 位序从 1 开始，下标或前驱定位要换算 |
| 表头、头结点、头指针 | 第一个元素、辅助结点、指针变量不能混为一谈 |
| 空表 | 带头、无头、循环的空表条件不同 |
| 顺序表插入 | 合法位序到 $n+1$，容量必须足够，右移从后往前 |
| 顺序表删除 | 合法位序只到 $n$，左移从前往后，先保存被删值 |
| 平均移动次数 | 是否给出位置等概率？插入 $n/2$，删除 $(n-1)/2$ |
| 动态顺序表 | 扩容不改变顺序存储；首地址可能变化 |
| “已知结点” | 已知的是前驱、目标本身、还是仅逻辑位序？ |
| 单链表删除目标 | 真正删除目标需要前驱；复制后继技巧不能删尾结点 |
| 给头指针赋值 | 修改调用者头指针要通过输出参数，或按约定返回新指针 |
| 遍历中删除 | 先存后继或通过前驱保留后继，不能访问已释放结点 |
| 头插法建表 | 一般逆序；尾插法需要正确维护尾指针 |
| 双链表插删 | 正反两侧链接都要更新，普通表的尾部有 `NULL` 边界 |
| 循环链表 | 遍历不能等 `NULL`，必须识别回到头结点 |
| 循环双链表空表 | `next`、`prior` 都指向头结点 |
| 静态链表 | 下标不等于位序；空游标、头下标和备用链约定要明确 |
| 结点复用合并 | 结果所有权改变，不能再独立销毁被合并的原表 |
| 两表相交 | 判断结点地址相同，值相同不够；共享后缀不能重复释放 |
| 比较复杂度 | 区分定位时间与链接修改时间，区分表存储空间与辅助空间 |

## 算法题的解题模板

### 顺序表题的读写下标模板

遇到“删除所有满足条件的元素”“稳定保留一类元素”“有序去重”，先考虑：

1. `read` 扫描原有效区间。
2. `write` 指向结果中下一可写位置。
3. 只在保留元素时写入并推进 `write`。
4. 扫描结束后，用 `write` 更新表长。

其核心不变式是：`data[0..write-1]` 已经保存原已扫描部分中应保留的元素，且次序正确。通常一次扫描 $O(n)$、辅助空间 $O(1)$。

### 链表题的前驱与后继保存模板

遇到删除、重排、拆分、逆置：

1. 先明确头结点是否存在，目标结点是否合法。
2. 需要改掉某结点时，确定前驱是否已知。
3. 改链接或释放之前保存未处理部分的入口。
4. 区分结点保留、结点转移、结点释放，保证每个结点有明确归属。
5. 结束时检查尾部链接，循环表还要恢复回环关系。

如果一次遍历能同时完成修改，避免每一步又从头定位，否则线性过程容易变成平方阶。

### 最小边界测试清单

- 空表；只有一个元素。
- 首位置、末位置、尾后插入位置。
- 位序 0、负数、超过合法上界。
- 顺序表满容量；动态扩容申请失败。
- 删除首元素、尾元素、唯一元素。
- 所有元素都匹配、无元素匹配、连续多个匹配。
- 重复值、有序表中全相等值。
- 循环表删除唯一结点后恢复自环。
- 静态链表用完全部槽位，再删除并重新插入。
- 合并时任一输入为空，以及输出容量或共享结点约束。

## 复习自检

- [ ] 能说明“有限、有序、同类型”各自的准确含义。
- [ ] 能区分逻辑位序与数组下标，并写出插删合法范围。
- [ ] 能推导顺序表地址公式、插入和删除的移动次数。
- [ ] 能写出顺序表的增、删、改、查，并确定移动方向。
- [ ] 能解释动态分配、动态扩容为什么仍是顺序存储。
- [ ] 能用图示区分头指针、头结点与首元结点。
- [ ] 能写出单链表前驱定位、后插、删除后继和按位包装函数。
- [ ] 能说清复制数据的前插、删除技巧改变了什么结点身份。
- [ ] 能写头插、尾插、逆置、删除指定值、倒数第 k 个等常见算法。
- [ ] 能维护双链表插删的两侧链接及尾部边界。
- [ ] 能给出普通、循环、单向、双向链表的空表与终止条件。
- [ ] 能解释用尾指针连接循环单链表为什么可以是常数时间。
- [ ] 能维护静态链表的主链、备用链以及游标回收。
- [ ] 能按已知信息、定位代价与修改代价比较顺序表和链表。

## 参考与后续补充

- [电子工业出版社：2027年数据结构考研复习指导](https://phei.com.cn/module/goods/wssd_content.jsp?bookid=68851)：用于核对章节目录与教材信息。正文函数与代表性例题为独立编写，可继续补充自己的题号、错题和课堂强调点。

[[B00-线性表导航|返回线性表导航]]
