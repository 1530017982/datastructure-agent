# 第3章 栈、队列和数组

> 面向 408 复习，按王道 2027 版知识章节组织。正文、函数及代表性例子为独立整理，易错点直接放在对应知识点下。
>
> [[B00-栈、队列与数组导航|返回本章导航]]

## 本章代码与下标约定

- 代码使用基本类型、结构体、数组、指针与函数，不使用类、模板或 STL；动态内存用 `malloc/free`。
- 栈元素、队列元素统一用 `int`。表达式运算用 `long long`；层次遍历的队列单独保存树结点指针，不能把地址强转为 `int`。
- 顺序栈主版本：`top == -1` 表示空，`top` 指向当前栈顶元素。
- 循环队列主版本：`front` 指向队头元素，`rear` 指向下一次入队位置，**空出一个单元**区分满和空。
- 数组与压缩数组的下标从 0 开始；矩阵公式中行号、列号 $i,j$ 从 1 开始。矩阵第一个存储元素对应压缩下标 0。
- 非空指针必须指向有效对象；初始化前不应持有尚未释放的旧资源。输出参数不可为空，失败是否留下部分结果以各函数说明为准。
- 算术与申请字节数应在类型可表示范围内。本页复杂度采用基本运算为常数时间的常见考试模型。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <limits.h>

typedef int ElemType;
enum { DS_CAPACITY = 100 };
```

## 3.1 栈

### 3.1.1 栈的基本概念

#### 栈、栈顶与后进先出

栈是只允许在一端进行插入和删除的线性表。允许操作的一端叫**栈顶**，另一端叫**栈底**；不含元素时为空栈。

- 入栈（Push）：把元素放到栈顶。
- 出栈（Pop）：删除并返回当前栈顶元素。
- 读栈顶（GetTop）：读取而不删除当前栈顶元素。
- 顺序原则：**后进先出，LIFO**。栈仍是线性逻辑结构。

**例：** 依次入栈 1、2、3，全部入栈后连续出栈得到 3、2、1。但允许入栈与出栈交替时，输出不一定是输入的完全逆序。

#### 栈的基本操作与边界

初始化、判空、求长度、入栈、出栈、读栈顶、清空、销毁是常见操作。

- 空栈不能出栈或读取栈顶，称为下溢。
- 定长顺序栈满后不能继续入栈，称为上溢。
- 链栈不受固定数组容量约束，但仍可能因内存申请失败而入栈失败。
- 栈的抽象操作不允许直接删除任意中间元素；底层用数组存储不改变这个约束。

#### 合法出栈序列与卡特兰数

固定输入顺序为互不相同的 $1,2,\ldots,n$，可任意交替入栈与出栈，并且每个元素恰好入、出一次。容量不限时，合法输出序列数为：

$$
C_n=\frac{1}{n+1}\binom{2n}{n}
$$

$C_0=1,C_1=1,C_2=2,C_3=5,C_4=14$。可把入栈记为左括号、出栈记为右括号：任何前缀中出栈次数不能超过入栈次数，总次数各为 $n$。

输入 1、2、3 的合法输出为：123、132、213、231、321；312 不合法。要先输出 3 必须把 1、2 压在其下方，输出 3 后当前栈顶是 2，不能先取 1。

**限定条件：** 固定输入、互异元素、单栈、容量不限。容量受限时合法序列可能变少；元素值重复时不同操作路径可能产生相同的值序列。

#### 出栈序列的模拟判断

```cpp
// 输入与输出各 n 个元素；容量足够且输入元素互异时，
// 可用于判断给定输出是否是合法的单栈排列。
bool IsStackOutput(const int input[], const int output[], int n) {
    if (n < 0 || (n > 0 && (input == NULL || output == NULL))) {
        return false;
    }
    if (n == 0) {
        return true;
    }
    int *stack = (int *)malloc((size_t)n * sizeof(int));
    if (stack == NULL) {
        return false;
    }
    int top = -1;
    int next = 0;
    for (int i = 0; i < n; ++i) {
        stack[++top] = input[i];
        while (top >= 0 && next < n && stack[top] == output[next]) {
            --top;
            ++next;
        }
    }
    bool valid = (next == n);
    free(stack);
    return valid;
}
```

每个元素最多入栈、出栈一次，时间 $O(n)$、辅助空间 $O(n)$。这里内层 `while` 的次数是跨外层累加的，不能直接判断为 $O(n^2)$。

### 3.1.2 栈的顺序存储结构

#### 顺序栈定义与指针含义

```cpp
typedef struct {
    ElemType data[DS_CAPACITY];
    int top;
} SqStack;

void InitSqStack(SqStack *S) {
    S->top = -1;
}

bool SqStackEmpty(const SqStack *S) {
    return S->top == -1;
}

bool SqStackFull(const SqStack *S) {
    return S->top == DS_CAPACITY - 1;
}

int SqStackLength(const SqStack *S) {
    return S->top + 1;
}
```

有效区间为 `data[0..top]`，最多存 `DS_CAPACITY` 个元素。

#### 顺序栈入栈、出栈与读栈顶

```cpp
bool SqPush(SqStack *S, ElemType value) {
    if (S == NULL || SqStackFull(S)) {
        return false;
    }
    S->data[++S->top] = value;
    return true;
}

bool SqPop(SqStack *S, ElemType *value) {
    if (S == NULL || value == NULL || SqStackEmpty(S)) {
        return false;
    }
    *value = S->data[S->top--];
    return true;
}

bool SqGetTop(const SqStack *S, ElemType *value) {
    if (S == NULL || value == NULL || SqStackEmpty(S)) {
        return false;
    }
    *value = S->data[S->top];
    return true;
}

void SqStackClear(SqStack *S) {
    S->top = -1;
}
```

这些操作均为 $O(1)$ 时间，使用 $O(1)$ 辅助空间。定长数组本身不应调用 `free`。

**易错点：** 主版本先增加 `top` 再写入；出栈先读原栈顶再减少 `top`。不能与下面的另一种约定混用。

#### 两种top约定的对照

| 项目 | top 指向栈顶元素 | top 指向下一可写位置 |
| --- | --- | --- |
| 初值与空栈 | `top = -1` | `top = 0` |
| 满栈 | `top == N - 1` | `top == N` |
| 长度 | `top + 1` | `top` |
| 入栈 | `data[++top] = x` | `data[top++] = x` |
| 出栈 | `x = data[top--]` | `x = data[--top]` |
| 读栈顶 | `data[top]` | `data[top - 1]` |

第二种也正确；题目给出初值时，应先推断 `top` 的意义，再使用公式。

#### 共享栈

两个栈共享一段数组，分别从两端向中间增长。栈 0 的栈底在左端，栈 1 的栈底在右端。

```cpp
typedef struct {
    ElemType data[DS_CAPACITY];
    int top0;
    int top1;
} SharedStack;

void InitSharedStack(SharedStack *S) {
    S->top0 = -1;
    S->top1 = DS_CAPACITY;
}

bool SharedPush(SharedStack *S, int which, ElemType value) {
    if (S == NULL || (which != 0 && which != 1) ||
        S->top0 + 1 == S->top1) {
        return false;
    }
    if (which == 0) {
        S->data[++S->top0] = value;
    } else {
        S->data[--S->top1] = value;
    }
    return true;
}

bool SharedPop(SharedStack *S, int which, ElemType *value) {
    if (S == NULL || value == NULL || (which != 0 && which != 1)) {
        return false;
    }
    if (which == 0) {
        if (S->top0 == -1) {
            return false;
        }
        *value = S->data[S->top0--];
    } else {
        if (S->top1 == DS_CAPACITY) {
            return false;
        }
        *value = S->data[S->top1++];
    }
    return true;
}
```

满条件是 `top0 + 1 == top1`；总元素数为 $(top0+1)+(N-top1)$。共享栈可以利用两栈增长不均衡时的空闲空间，但总容量仍为 $N$，不能消除容量限制。

### 3.1.3 栈的链式存储结构

#### 链栈结构与基本操作

本页链栈不带头结点，以链头作为栈顶，空栈指针为 `NULL`。

```cpp
typedef struct StackNode {
    ElemType data;
    struct StackNode *next;
} StackNode, *LinkStack;

void InitLinkStack(LinkStack *S) {
    *S = NULL;
}

bool LinkStackEmpty(LinkStack S) {
    return S == NULL;
}

bool LinkPush(LinkStack *S, ElemType value) {
    if (S == NULL) {
        return false;
    }
    StackNode *p = (StackNode *)malloc(sizeof(StackNode));
    if (p == NULL) {
        return false;
    }
    p->data = value;
    p->next = *S;
    *S = p;
    return true;
}

bool LinkPop(LinkStack *S, ElemType *value) {
    if (S == NULL || *S == NULL || value == NULL) {
        return false;
    }
    StackNode *p = *S;
    *value = p->data;
    *S = p->next;
    free(p);
    return true;
}

bool LinkGetTop(LinkStack S, ElemType *value) {
    if (S == NULL || value == NULL) {
        return false;
    }
    *value = S->data;
    return true;
}

void LinkStackClear(LinkStack *S) {
    if (S == NULL) {
        return;
    }
    while (*S != NULL) {
        StackNode *p = *S;
        *S = p->next;
        free(p);
    }
}
```

入、出、读栈顶均为 $O(1)$，清空为 $O(n)$。本实现没有单独维护长度字段，求长度需遍历 $O(n)$；清空后已无任何结点资源。

#### 顺序栈与链栈的比较

- 顺序栈：连续数组、无需每元素链接域、访问局部性较好；固定容量满时不能继续入栈。
- 链栈：按结点申请、有链接域开销、可随实际长度增长；申请失败仍需处理。
- 单链表链头便于常数时间插删，通常用作栈顶。若用单链表尾部作栈顶，删除尾结点往往还要找前驱。
- 同一种 LIFO 逻辑可用两种存储实现；不能因“链式”就认为出栈需要线性时间。

## 3.2 队列

### 3.2.1 队列的基本概念

#### 队头、队尾与先进先出

队列只允许在一端插入、另一端删除。入队端是队尾，出队端是队头，遵守**先进先出，FIFO**。

固定顺序入队 1、2、3，即使入、出交替，只要最终全部出队，输出仍是 1、2、3。这个结论针对普通队列，不适用于双端队列或优先队列。

基本操作是初始化、判空、求长度、入队、出队、读取队头、清空和销毁。空队列不能出队或读取队头。

### 3.2.2 队列的顺序存储结构

#### 普通顺序队列与假溢出

若线性数组队列采用 `front` 指向队头、`rear` 指向下一可写位置：初始两者为 0，入队推进 `rear`，出队推进 `front`。

当 `rear == N` 时，数组前部可能因出队留下空闲单元，但不能再按原线性规则入队。这称为**假溢出**。循环使用数组可复用这些单元，不需要每次出队都搬移所有元素。

**易错点：** 假溢出不是“元素个数已经达到数组全部容量”；应同时查看 `front` 和 `rear`。

#### 循环队列的指针、空满与长度

主版本空出一个数组单元：

$$
\begin{aligned}
\text{空}&:\ front=rear\\
\text{满}&:\ (rear+1)\bmod N=front\\
\text{长度}&:\ (rear-front+N)\bmod N
\end{aligned}
$$

数组容量为 $N$，最大有效元素数是 $N-1$。`rear` 是下一次入队的位置，不是最后一个有效元素的下标。

```cpp
typedef struct {
    ElemType data[DS_CAPACITY];
    int front;
    int rear;
} CircularQueue;

void InitCircularQueue(CircularQueue *Q) {
    Q->front = 0;
    Q->rear = 0;
}

bool CircularQueueEmpty(const CircularQueue *Q) {
    return Q->front == Q->rear;
}

bool CircularQueueFull(const CircularQueue *Q) {
    return (Q->rear + 1) % DS_CAPACITY == Q->front;
}

int CircularQueueLength(const CircularQueue *Q) {
    return (Q->rear - Q->front + DS_CAPACITY) % DS_CAPACITY;
}
```

#### 循环队列入队、出队与读队头

```cpp
bool CircularEnqueue(CircularQueue *Q, ElemType value) {
    if (Q == NULL || CircularQueueFull(Q)) {
        return false;
    }
    Q->data[Q->rear] = value;
    Q->rear = (Q->rear + 1) % DS_CAPACITY;
    return true;
}

bool CircularDequeue(CircularQueue *Q, ElemType *value) {
    if (Q == NULL || value == NULL || CircularQueueEmpty(Q)) {
        return false;
    }
    *value = Q->data[Q->front];
    Q->front = (Q->front + 1) % DS_CAPACITY;
    return true;
}

bool CircularGetFront(const CircularQueue *Q, ElemType *value) {
    if (Q == NULL || value == NULL || CircularQueueEmpty(Q)) {
        return false;
    }
    *value = Q->data[Q->front];
    return true;
}

void CircularQueueClear(CircularQueue *Q) {
    Q->front = 0;
    Q->rear = 0;
}
```

这些基本操作都是 $O(1)$ 时间、$O(1)$ 辅助空间。

**例：** $N=5,front=3,rear=1$，有效位置依次为 3、4、0，长度 $(1-3+5)\bmod5=3$。再入队一个元素后 `rear=2`，队列满。

#### 不空出单元的两种判满方法

| 方法 | 空条件 | 满条件 | 状态更新 |
| --- | --- | --- | --- |
| 元素计数 count | `count == 0` | `count == N` | 入队加一、出队减一 |
| 操作标志 tag | `front == rear` 且 `tag == 0` | `front == rear` 且 `tag == 1` | 初始化为 0；成功入队置 1、成功出队置 0 |

这两种方法可用满 $N$ 个单元。计数版示例：

```cpp
typedef struct {
    ElemType data[DS_CAPACITY];
    int front;
    int rear;
    int count;
} CountQueue;

void InitCountQueue(CountQueue *Q) {
    Q->front = Q->rear = Q->count = 0;
}

bool CountEnqueue(CountQueue *Q, ElemType value) {
    if (Q == NULL || Q->count == DS_CAPACITY) {
        return false;
    }
    Q->data[Q->rear] = value;
    Q->rear = (Q->rear + 1) % DS_CAPACITY;
    ++Q->count;
    return true;
}

bool CountDequeue(CountQueue *Q, ElemType *value) {
    if (Q == NULL || value == NULL || Q->count == 0) {
        return false;
    }
    *value = Q->data[Q->front];
    Q->front = (Q->front + 1) % DS_CAPACITY;
    --Q->count;
    return true;
}
```

**易错点：** 用计数或标志区分空满时，`front == rear` 既可能空也可能满；模差公式在满时得 0，不能直接当真实长度。遇到题目采用其他 `rear` 初值或“指向最后元素”的约定，要重新推导公式。

### 3.2.3 队列的链式存储结构

#### 带头结点链队列的结构

`front` 指向头结点，`rear` 指向最后一个数据结点。空队列时二者都指向头结点，且头结点 `next == NULL`。

```cpp
typedef struct QueueNode {
    ElemType data;
    struct QueueNode *next;
} QueueNode;

typedef struct {
    QueueNode *front;
    QueueNode *rear;
} LinkQueue;

bool InitLinkQueue(LinkQueue *Q) {
    if (Q == NULL) {
        return false;
    }
    QueueNode *head = (QueueNode *)malloc(sizeof(QueueNode));
    if (head == NULL) {
        return false;
    }
    head->next = NULL;
    Q->front = Q->rear = head;
    return true;
}

bool LinkQueueEmpty(const LinkQueue *Q) {
    return Q->front == Q->rear;
}
```

判空函数以已经初始化为前提。销毁后两者虽然都可能为 `NULL`，但它不再是可继续入队的已初始化队列。

#### 带头结点链队列的入队、出队与读取

```cpp
bool LinkEnqueue(LinkQueue *Q, ElemType value) {
    if (Q == NULL || Q->front == NULL || Q->rear == NULL) {
        return false;
    }
    QueueNode *p = (QueueNode *)malloc(sizeof(QueueNode));
    if (p == NULL) {
        return false;
    }
    p->data = value;
    p->next = NULL;
    Q->rear->next = p;
    Q->rear = p;
    return true;
}

bool LinkDequeue(LinkQueue *Q, ElemType *value) {
    if (Q == NULL || Q->front == NULL || value == NULL ||
        LinkQueueEmpty(Q)) {
        return false;
    }
    QueueNode *p = Q->front->next;
    *value = p->data;
    Q->front->next = p->next;
    if (Q->rear == p) {
        Q->rear = Q->front;      // 删除唯一元素后恢复空队列
    }
    free(p);
    return true;
}

bool LinkGetFront(const LinkQueue *Q, ElemType *value) {
    if (Q == NULL || Q->front == NULL || value == NULL ||
        LinkQueueEmpty(Q)) {
        return false;
    }
    *value = Q->front->next->data;
    return true;
}

void LinkQueueClear(LinkQueue *Q) {
    if (Q == NULL || Q->front == NULL) {
        return;
    }
    QueueNode *p = Q->front->next;
    while (p != NULL) {
        QueueNode *next = p->next;
        free(p);
        p = next;
    }
    Q->front->next = NULL;
    Q->rear = Q->front;
}

void DestroyLinkQueue(LinkQueue *Q) {
    if (Q == NULL) {
        return;
    }
    LinkQueueClear(Q);
    free(Q->front);
    Q->front = Q->rear = NULL;
}
```

入、出、读队头为 $O(1)$；清空、销毁为 $O(n)$。没有长度字段时求长度要遍历；维护计数后可常数时间求长度。

**易错点：** 删除唯一元素后若不重置 `rear`，它会指向已经释放的结点，后续入队可能访问悬空指针。

#### 不带头结点链队列的边界

复用 `LinkQueue` 的字段，但头尾指针直接指向数据结点，初始化为 `NULL`，不能混用上一组函数。

```cpp
void InitHeadlessQueue(LinkQueue *Q) {
    Q->front = Q->rear = NULL;
}

bool HeadlessEnqueue(LinkQueue *Q, ElemType value) {
    if (Q == NULL) {
        return false;
    }
    QueueNode *p = (QueueNode *)malloc(sizeof(QueueNode));
    if (p == NULL) {
        return false;
    }
    p->data = value;
    p->next = NULL;
    if (Q->rear == NULL) {
        Q->front = p;
    } else {
        Q->rear->next = p;
    }
    Q->rear = p;
    return true;
}

bool HeadlessDequeue(LinkQueue *Q, ElemType *value) {
    if (Q == NULL || Q->front == NULL || value == NULL) {
        return false;
    }
    QueueNode *p = Q->front;
    *value = p->data;
    Q->front = p->next;
    if (Q->front == NULL) {
        Q->rear = NULL;
    }
    free(p);
    return true;
}
```

空队列插入第一个元素，需要同时建立 `front` 和 `rear`；删除最后一个元素，需要同时恢复为 `NULL`。清空可反复调用此版本出队，不能用带头结点版本的清空函数。

### 3.2.4 双端队列

#### 双端队列与受限变体

双端队列（Deque）允许两端入队、两端出队，仍是一种受限的线性表。

| 类型 | 允许入队的端 | 允许出队的端 |
| --- | --- | --- |
| 普通队列 | 一端 | 另一端 |
| 双端队列 | 两端 | 两端 |
| 输入受限双端队列 | 一端 | 两端 |
| 输出受限双端队列 | 两端 | 一端 |

双端队列可以只操作一端模拟栈，也可以一端入、另一端出模拟普通队列。输入受限和输出受限都不能简单当作无约束双端队列来判断序列。

#### 顺序双端队列的四种操作

复用空出一个单元的 `CircularQueue` 结构及其判空、判满、初始化函数；`front` 指向左端元素，`rear` 指向右端之后的位置。

```cpp
bool DequePushBack(CircularQueue *Q, ElemType value) {
    return CircularEnqueue(Q, value);
}

bool DequePopFront(CircularQueue *Q, ElemType *value) {
    return CircularDequeue(Q, value);
}

bool DequePushFront(CircularQueue *Q, ElemType value) {
    if (Q == NULL || CircularQueueFull(Q)) {
        return false;
    }
    Q->front = (Q->front - 1 + DS_CAPACITY) % DS_CAPACITY;
    Q->data[Q->front] = value;
    return true;
}

bool DequePopBack(CircularQueue *Q, ElemType *value) {
    if (Q == NULL || value == NULL || CircularQueueEmpty(Q)) {
        return false;
    }
    Q->rear = (Q->rear - 1 + DS_CAPACITY) % DS_CAPACITY;
    *value = Q->data[Q->rear];
    return true;
}
```

四种操作均为 $O(1)$，容量仍是 $N-1$。向前退下标时要加 $N$ 再取模；C/C++ 中不能把 `(-1) % N` 当作 $N-1$ 使用。

#### 双端队列序列题的判断方法

逐步模拟当前两端，明确哪一端可入、哪一端可出。所需元素若在中间，不能直接跳过端点取走。

**例：** 输入受限队列只从右端输入 1、2、3，可输出 3、1、2：全部入队后，先从右端取 3，再从左端取 1、2。但输入 1、2、3、4 时不能输出 4、2、3、1：先取 4 后，2 被 1 与 3 夹在中间，两端都不能直接取 2。

这个例子也说明：能产生普通栈或队列没有的输出，不代表能产生任意排列。

## 3.3 栈和队列的应用

### 3.3.1 栈在括号匹配中的应用

#### 括号匹配的规则与函数

遇左括号入栈，遇右括号必须与当前栈顶匹配，然后弹出。结束时栈必须为空。

```cpp
bool BracketPair(char left, char right) {
    return (left == '(' && right == ')') ||
           (left == '[' && right == ']') ||
           (left == '{' && right == '}');
}

// 非括号字符忽略；false 表示不匹配、参数无效或申请失败。
bool MatchBrackets(const char *text) {
    if (text == NULL) {
        return false;
    }
    size_t n = strlen(text);
    if (n == 0) {
        return true;
    }
    char *stack = (char *)malloc(n * sizeof(char));
    if (stack == NULL) {
        return false;
    }
    size_t top = 0;             // 这里 top 是下一可写位置
    for (size_t i = 0; i < n; ++i) {
        char ch = text[i];
        if (ch == '(' || ch == '[' || ch == '{') {
            stack[top++] = ch;
        } else if (ch == ')' || ch == ']' || ch == '}') {
            if (top == 0 || !BracketPair(stack[top - 1], ch)) {
                free(stack);
                return false;
            }
            --top;
        }
    }
    bool valid = (top == 0);
    free(stack);
    return valid;
}
```

时间 $O(n)$、本代码辅助空间 $O(n)$。左括号最多同时嵌套的数量决定实际栈元素峰值，代码预留的是整个字符串长度。

#### 括号匹配的三种失败

- 右括号到来时栈空：右括号过多，例如 `())`。
- 类型与最近未匹配的左括号不同：例如 `([)]`。
- 扫描结束栈非空：左括号过多，例如 `(()`。

左右括号总数相等只是必要条件之一，不能保证次序与类型匹配。

### 3.3.2 栈在表达式求值中的应用

#### 中缀、后缀与前缀表达式

| 形式 | 运算符位置 | 例子 |
| --- | --- | --- |
| 中缀 | 操作数之间 | `12 + 3 * (8 - 6)` |
| 后缀 | 操作数之后 | `12 3 8 6 - * +` |
| 前缀 | 操作数之前 | `+ 12 * 3 - 8 6` |

后缀、前缀把运算关系体现在符号次序中，不再依赖括号与中缀优先级来确定运算树。多位数之间必须有明确的分隔或 token 结构，不能把 `12` 当作 1 和 2 两个操作数。

#### 运算优先级与结合性

- 括号规定局部先后次序；在转换过程中用作边界，不输出到后缀结果。
- `*`、`/` 高于 `+`、`-`。
- 同级二元 `+ - * /` 按左结合处理；例如 `8 - 3 - 2` 是 `(8 - 3) - 2`。
- 下列代码只处理**二元** `+ - * /`、圆括号、非负十进制整数和空白。不处理一元负号、小数、变量或乘方。要表示负数，可写 `(0-3)`。
- 代码使用整数运算，`/` 按 C++ 整数除法向零截断；数学实数表达式不能直接用该函数解释。

#### 中缀转后缀的操作规则

从左到右扫描：

1. 操作数直接输出。
2. 左括号入运算符栈。
3. 右括号：弹出并输出，直到左括号；丢弃这对括号。
4. 二元运算符：把栈顶优先级高于或等于它的运算符弹出并输出，直到栈空、左括号或更低优先级，然后压入当前运算符。
5. 扫描结束，把剩余运算符弹出输出；若剩余括号则表达式不合法。

第 4 步的“等于”适用于本页的左结合运算符；右结合运算符不能不加区分地套用。

#### 中缀转后缀的逐步例子

输入 `12 + 3 * (8 - 6)`，栈按“底 → 顶”写：

| 读到 | 运算符栈 | 已输出后缀 |
| --- | --- | --- |
| 12 | 空 | `12` |
| + | `+` | `12` |
| 3 | `+` | `12 3` |
| * | `+ *` | `12 3` |
| ( | `+ * (` | `12 3` |
| 8 | `+ * (` | `12 3 8` |
| - | `+ * ( -` | `12 3 8` |
| 6 | `+ * ( -` | `12 3 8 6` |
| ) | `+ *` | `12 3 8 6 -` |
| 扫描结束 | 空 | `12 3 8 6 - * +` |

#### 中缀转后缀的函数实现

用 token 区分数字和运算符，避免混淆多位数。

```cpp
enum { EXPR_NUMBER = 0, EXPR_OPERATOR = 1 };

typedef struct {
    int kind;
    long long number;
    char op;
} ExprToken;

int OperatorPriority(char op) {
    if (op == '+' || op == '-') {
        return 1;
    }
    if (op == '*' || op == '/') {
        return 2;
    }
    return 0;
}

bool EmitOperator(ExprToken out[], int capacity, int *used, char op) {
    if (*used >= capacity) {
        return false;
    }
    out[*used].kind = EXPR_OPERATOR;
    out[*used].op = op;
    out[*used].number = 0;
    ++*used;
    return true;
}

// out 是调用者提供的 token 数组，capacity 是其容量。
// 成功才修改 *outCount；失败时 out 可能留下部分转换结果。
bool InfixToPostfix(const char *expr, ExprToken out[],
                    int capacity, int *outCount) {
    if (expr == NULL || out == NULL || outCount == NULL || capacity <= 0) {
        return false;
    }
    size_t n = strlen(expr);
    if (n == 0) {
        return false;
    }
    char *ops = (char *)malloc(n + 1);
    if (ops == NULL) {
        return false;
    }
    int top = 0, used = 0;
    size_t pos = 0;
    bool needOperand = true;
    while (pos < n) {
        char ch = expr[pos];
        if (isspace((unsigned char)ch)) {
            ++pos;
            continue;
        }
        if (isdigit((unsigned char)ch)) {
            if (!needOperand || used >= capacity) {
                goto fail;
            }
            long long value = 0;
            while (pos < n && isdigit((unsigned char)expr[pos])) {
                int digit = expr[pos] - '0';
                if (value > (LLONG_MAX - digit) / 10) {
                    goto fail;
                }
                value = value * 10 + digit;
                ++pos;
            }
            out[used].kind = EXPR_NUMBER;
            out[used].number = value;
            out[used].op = 0;
            ++used;
            needOperand = false;
        } else if (ch == '(') {
            if (!needOperand) {
                goto fail;          // 本实现不接受隐式乘法
            }
            ops[top++] = ch;
            ++pos;
        } else if (ch == ')') {
            if (needOperand) {
                goto fail;          // 拒绝空括号或缺操作数
            }
            while (top > 0 && ops[top - 1] != '(') {
                if (!EmitOperator(out, capacity, &used, ops[--top])) {
                    goto fail;
                }
            }
            if (top == 0) {
                goto fail;
            }
            --top;                  // 丢弃左括号
            ++pos;
        } else if (OperatorPriority(ch) > 0) {
            if (needOperand) {
                goto fail;
            }
            while (top > 0 && ops[top - 1] != '(' &&
                   OperatorPriority(ops[top - 1]) >= OperatorPriority(ch)) {
                if (!EmitOperator(out, capacity, &used, ops[--top])) {
                    goto fail;
                }
            }
            ops[top++] = ch;
            needOperand = true;
            ++pos;
        } else {
            goto fail;
        }
    }
    if (needOperand) {
        goto fail;
    }
    while (top > 0) {
        char op = ops[--top];
        if (op == '(' || !EmitOperator(out, capacity, &used, op)) {
            goto fail;
        }
    }
    free(ops);
    *outCount = used;
    return true;

fail:
    free(ops);
    return false;
}
```

每个符号进入、离开运算符栈至多一次，时间 $O(n)$；运算符工作栈和输出 token 数组都是 $O(n)$ 规模。

#### 后缀求值与操作数次序

从左到右扫描后缀：数字入操作数栈；遇二元运算符，先弹出**右操作数** $b$，再弹出**左操作数** $a$，计算 $a\mathbin{op}b$ 后入栈。结束时应恰有一个结果。

| 读到 | 操作数栈，底 → 顶 |
| --- | --- |
| 12 | `12` |
| 3 | `12 3` |
| 8 | `12 3 8` |
| 6 | `12 3 8 6` |
| - | `12 3 2` |
| * | `12 6` |
| + | `18` |

**易错点：** `8 6 -` 是 $8-6$，不是 $6-8$；加法、乘法的交换律会掩盖错误，应用减法、除法检查。

```cpp
// 前置条件：所有中间运算结果在 long long 范围内。
bool ApplyBinary(char op, long long a, long long b, long long *result) {
    if (result == NULL) {
        return false;
    }
    switch (op) {
        case '+': *result = a + b; return true;
        case '-': *result = a - b; return true;
        case '*': *result = a * b; return true;
        case '/':
            if (b == 0 || (a == LLONG_MIN && b == -1)) {
                return false;
            }
            *result = a / b;
            return true;
        default: return false;
    }
}

bool EvaluatePostfix(const ExprToken tokens[], int count, long long *result) {
    if (tokens == NULL || result == NULL || count <= 0) {
        return false;
    }
    long long *stack = (long long *)malloc((size_t)count * sizeof(long long));
    if (stack == NULL) {
        return false;
    }
    int top = 0;
    for (int i = 0; i < count; ++i) {
        if (tokens[i].kind == EXPR_NUMBER) {
            stack[top++] = tokens[i].number;
        } else if (tokens[i].kind == EXPR_OPERATOR) {
            if (top < 2) {
                free(stack);
                return false;
            }
            long long b = stack[--top];
            long long a = stack[--top];
            long long value = 0;
            if (!ApplyBinary(tokens[i].op, a, b, &value)) {
                free(stack);
                return false;
            }
            stack[top++] = value;
        } else {
            free(stack);
            return false;
        }
    }
    if (top != 1) {
        free(stack);
        return false;
    }
    *result = stack[0];
    free(stack);
    return true;
}
```

时间 $O(t)$、辅助空间 $O(t)$，$t$ 为 token 个数。操作数不足、结束后多余操作数、非法运算符或除数为零，均不能当作合法结果。

#### 前缀求值与转换方向辨析

前缀求值从**右向左**扫描：数字入栈；遇运算符时先弹出的数是左操作数 $a$，后弹出的是右操作数 $b$，计算 $a\mathbin{op}b$。

| 项目 | 后缀求值 | 前缀求值 |
| --- | --- | --- |
| 扫描方向 | 左 → 右 | 右 → 左 |
| 首次弹出的操作数 | 右操作数 | 左操作数 |
| 二次弹出的操作数 | 左操作数 | 右操作数 |

如果用从右到左的中缀扫描法生成前缀，最后要反转输出 token 序列，并正确处理同级结合性。不能简单“把后缀字符串反转”得到前缀，也不能逐字符反转多位数。

#### 表达式应用的复杂度与检查点

- 转换和求值中的单个 token 都只需常量次入、出栈，总时间线性。
- 运算符栈和操作数栈职责不同，不能把优先级与操作数的入栈条件混在一起。
- 普通括号匹配成功，并不保证表达式语法合法，例如 `1+()`、`1 2`。
- 乘方、一元运算、小数或变量需要额外的词法、结合性和计算规则，本页函数不自动支持这些扩展。

### 3.3.3 栈在递归中的应用

#### 递归工作栈与调用现场

函数调用需要保存返回位置、参数、局部变量和等待使用的中间结果。后调用的函数先返回，符合栈的 LIFO 特性。

递归必须有终止条件，并使子问题朝终止条件缩小。相同函数在不同层的局部变量属于不同调用现场。

#### 阶乘递归与非递归对照

```cpp
// 前置条件：0 <= n <= 20，保证 long long 结果可表示。
long long FactorialRecursive(int n) {
    if (n == 0) {
        return 1;
    }
    return n * FactorialRecursive(n - 1);
}

long long FactorialIterative(int n) {
    long long result = 1;
    for (int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}
```

递归计算 $4!$ 时，先等待 $3!$、$2!$、$1!$、$0!$，再逐层返回相乘。两版时间都为 $O(n)$；按通常调用栈模型，递归辅助空间 $O(n)$，循环版 $O(1)$。

#### 递归时间与栈空间分开计算

- 时间看总调用及各调用的工作量。
- 调用栈空间看最大同时活动的调用深度及每层保存内容。
- 普通斐波那契递归产生大量重复子问题，时间可用 $O(2^n)$ 作上界，活动调用栈仅为 $O(n)$。
- 单支折半且每层常量工作的递归，时间与栈空间通常都是 $O(\log n)$。
- 非递归不自动等于常量辅助空间：用显式栈模拟递归仍可能需要线性空间。
- 不能默认编译器一定执行尾调用优化；考试中按题目规定的模型分析。

### 3.3.4 队列在层次遍历中的应用

#### 层次遍历的入队出队规则

先把根入队；反复取出队头并访问，把它的孩子按指定顺序入队。队头较早发现的结点先被处理，形成由浅到深的顺序。

对于二叉树，若要求同层从左到右，则先入左孩子、再入右孩子。

```text
        A
       / \
      B   C
     / \   \
    D   E   F

层次序列：A B C D E F
```

#### 保存树指针的队列与遍历函数

为避免定长队列容量不足，本例使用动态链队列。打印过程中若申请失败，函数返回 false，已经打印的部分不会撤回。

```cpp
typedef struct TreeNode {
    ElemType data;
    struct TreeNode *left;
    struct TreeNode *right;
} TreeNode;

typedef struct TreeQueueNode {
    TreeNode *data;
    struct TreeQueueNode *next;
} TreeQueueNode;

typedef struct {
    TreeQueueNode *front;
    TreeQueueNode *rear;
} TreeQueue;

bool TreeEnqueue(TreeQueue *Q, TreeNode *node) {
    TreeQueueNode *p = (TreeQueueNode *)malloc(sizeof(TreeQueueNode));
    if (p == NULL) {
        return false;
    }
    p->data = node;
    p->next = NULL;
    if (Q->rear == NULL) {
        Q->front = p;
    } else {
        Q->rear->next = p;
    }
    Q->rear = p;
    return true;
}

bool TreeDequeue(TreeQueue *Q, TreeNode **node) {
    if (Q->front == NULL) {
        return false;
    }
    TreeQueueNode *p = Q->front;
    *node = p->data;
    Q->front = p->next;
    if (Q->front == NULL) {
        Q->rear = NULL;
    }
    free(p);
    return true;
}

void TreeQueueClear(TreeQueue *Q) {
    TreeNode *node = NULL;
    while (TreeDequeue(Q, &node)) {
        // 只释放队列结点，不释放树结点。
    }
}

bool LevelOrder(TreeNode *root) {
    if (root == NULL) {
        return true;
    }
    TreeQueue Q = {NULL, NULL};
    if (!TreeEnqueue(&Q, root)) {
        return false;
    }
    TreeNode *p = NULL;
    while (TreeDequeue(&Q, &p)) {
        printf("%d ", p->data);
        if (p->left != NULL && !TreeEnqueue(&Q, p->left)) {
            TreeQueueClear(&Q);
            return false;
        }
        if (p->right != NULL && !TreeEnqueue(&Q, p->right)) {
            TreeQueueClear(&Q);
            return false;
        }
    }
    printf("\n");
    return true;
}
```

树结点各入、出队一次，时间 $O(n)$；辅助队列空间与待处理结点的峰值有关，对二叉树是 $O(w)$，$w$ 为最大层宽，最坏 $O(n)$。

**图的补充：** 广度优先搜索也使用队列。一般应在发现并准备入队时标记已访问，防止同一顶点被重复加入；无权图中可按层数求从起点出发的最短边数。

### 3.3.5 队列在计算机系统中的应用

#### 缓冲、服务与调度

- **缓冲区：** 生产和消费速度不一致时，把尚未处理的数据暂存，按约定顺序取出，例如输入输出缓冲。
- **先来先服务：** 普通 FIFO 队列可表示按到达顺序等待的请求。
- **任务调度：** 就绪任务可组织为队列，实际调度可能有优先级、时间片、多级队列等策略，不能断言所有调度都是 FIFO。
- **循环使用存储：** 循环队列能复用数组单元；表示结构的“循环”不等于调度策略一定是轮转。

#### 栈与队列应用的识别

“最近进入、尚未处理的对象先处理”，如括号匹配、撤销、调用返回，常对应栈；“较早发现或到达的对象先处理”，如层次遍历、FIFO 缓冲，常对应队列。

识别时应根据具体处理规则，不要仅凭题目出现“计算机系统”“缓存”就直接选某一种结构。

## 3.4 数组和特殊矩阵

### 3.4.1 数组的定义

#### 数组元素、维数与下标界

数组由相同类型的元素按一定维数和下标范围组织。每个元素可用一组下标唯一定位，是线性表的推广。

- 维数是定位一个元素所需要的下标个数。
- 第 $r$ 维的下标范围若为 $l_r\le i_r\le u_r$，该维长度为 $n_r=u_r-l_r+1$。
- 元素总数为 $\prod_{r=1}^d n_r$，不是各维长度相加。
- 确定数组的形状后，基本操作是按下标读取或修改；没有普通线性表那样不改变结构含义的任意位置插删操作。
- 逻辑形状固定不等于只能静态分配内存；数组存储区也可以在运行时申请。

**例：** $A[1..3][2..5]$ 有 $3\times4=12$ 个元素，下标下界不必为 0，也不必为 1。

### 3.4.2 数组的存储结构

#### 行优先与列优先

一段线性内存要规定多维下标到线性位置的映射：

- 行优先：同一行相邻列连续，最后一个下标变化最快。
- 列优先：同一列相邻行连续，第一个下标变化最快。
- C/C++ 的普通连续多维数组采用行优先；一个“指针数组”指向分散的行时，不自动具有同样的整体连续布局。

#### 二维数组地址公式与例子

设 $B$ 是 $A[l_1][l_2]$ 的首地址，每个元素占 $w$ 字节，行数为 $m$、列数为 $n$。

行优先：

$$
\operatorname{LOC}(A[i][j])=B+\big[(i-l_1)n+(j-l_2)\big]w
$$

列优先：

$$
\operatorname{LOC}(A[i][j])=B+\big[(j-l_2)m+(i-l_1)\big]w
$$

**例：** $A[1..3][1..4]$，首地址 100，每元素 4 字节，求 $A[2][3]$。

- 行优先：线性下标为 $(2-1)\times4+(3-1)=6$，地址 $100+6\times4=124$。
- 列优先：线性下标为 $(3-1)\times3+(2-1)=7$，地址 $100+7\times4=128$。

**易错点：** 地址偏移先数“前面有多少个元素”，再乘元素字节数；不能把位序、元素偏移和字节偏移混用。

#### 三维与多维数组地址

三维行优先，维长为 $n_1,n_2,n_3$：

$$
\operatorname{LOC}(A[i][j][k])
=B+\big[(i-l_1)n_2n_3+(j-l_2)n_3+(k-l_3)\big]w
$$

推广到 $d$ 维行优先：

$$
\operatorname{LOC}(A[i_1]\cdots[i_d])
=B+w\sum_{r=1}^{d}(i_r-l_r)\prod_{s=r+1}^{d}n_s
$$

最后一项的空乘积为 1。列优先可按相反方向推导：第 $r$ 个下标的权重是它之前各维长度之积。

**推导方法：** 第一维增加 1 要跨过完整的后续维度块，第二维增加 1 要跨过更小的块，最后一维增加 1 只跨过一个元素。

### 3.4.3 特殊矩阵的压缩存储

#### 压缩存储的共同方法

将大量相同元素只存一次，或不存约定为零的元素；按已知规律把需要保留的元素映射到一维数组。

解题先确认：

1. 矩阵阶数、行列下标起点。
2. 存上三角还是下三角，是否包含主对角线。
3. 按行优先还是列优先。
4. 压缩数组下标从 0 还是 1 开始。
5. 非保留区域为 0、共用常量，还是通过对称性得到。

核心始终是：**目标之前完整存了多少组，再加目标在当前组内的偏移**。

#### 对称矩阵的下三角行优先

对称矩阵满足 $a_{ij}=a_{ji}$，只需保存含主对角线的一侧，共 $n(n+1)/2$ 个元素。

下三角逐行长度为 $1,2,\ldots,n$。对 $i\ge j$：

$$
k=\frac{i(i-1)}2+j-1
$$

若 $i<j$，访问对称位置 $(j,i)$。统一公式为：

$$
k=\frac{\max(i,j)(\max(i,j)-1)}2+\min(i,j)-1
$$

```cpp
long long SymLowerIndex(int n, int i, int j) {
    if (n <= 0 || i < 1 || j < 1 || i > n || j > n) {
        return -1;
    }
    if (i < j) {
        int temp = i;
        i = j;
        j = temp;
    }
    return (long long)i * (i - 1) / 2 + j - 1;
}

// packed 至少有 n(n+1)/2 个元素。
bool SymLowerGet(const ElemType packed[], int n, int i, int j,
                  ElemType *value) {
    long long k = SymLowerIndex(n, i, j);
    if (packed == NULL || value == NULL || k < 0) {
        return false;
    }
    *value = packed[k];
    return true;
}

bool SymLowerSet(ElemType packed[], int n, int i, int j, ElemType value) {
    long long k = SymLowerIndex(n, i, j);
    if (packed == NULL || k < 0) {
        return false;
    }
    packed[k] = value;
    return true;
}
```

修改一个存储值会同时改变逻辑位置 $(i,j)$ 和 $(j,i)$。若希望二者独立修改，原结构就不再是按此规则表示的对称矩阵。

**例：** $n=4$ 时存储顺序为 $(1,1),(2,1),(2,2),(3,1),(3,2),(3,3),(4,1),(4,2),(4,3),(4,4)$。访问 $(2,4)$ 映射到 $(4,2)$，下标 $k=4\times3/2+2-1=7$。

#### 上三角及列优先公式对照

公式均含主对角线，$k$ 从 0 开始：

| 保留区域与次序 | 有效区域内的下标公式 |
| --- | --- |
| 下三角行优先，$i\ge j$ | $i(i-1)/2+j-1$ |
| 上三角行优先，$i\le j$ | $(i-1)(2n-i+2)/2+j-i$ |
| 下三角列优先，$i\ge j$ | $(j-1)(2n-j+2)/2+i-j$ |
| 上三角列优先，$i\le j$ | $j(j-1)/2+i-1$ |

对称矩阵访问非保留一侧时先交换 $i,j$，再代入相应公式。

```cpp
long long SymUpperIndex(int n, int i, int j) {
    if (n <= 0 || i < 1 || j < 1 || i > n || j > n) {
        return -1;
    }
    if (i > j) {
        int temp = i;
        i = j;
        j = temp;
    }
    return (long long)(i - 1) * (2LL * n - i + 2) / 2 + j - i;
}
```

**考点：** 不要把“上三角行优先”误写成 $j(j-1)/2+i-1$，后者对应上三角**列优先**。

#### 三角矩阵与共用常量

数学上的下三角矩阵在主对角线上方为 0，上三角矩阵在主对角线下方为 0。教材压缩题也可能把非保留区域设为同一个常量 $c$；此时这些位置可共用一个存储单元。

采用“保留三角区、末尾再存 $c$”的方式，共 $n(n+1)/2+1$ 个单元，常量的下标为 $n(n+1)/2$。若区域已知恒为 0 且由算法隐含返回 0，可以不额外存这一单元，以题目约定为准。

```cpp
long long LowerTriIndex(int n, int i, int j) {
    if (n <= 0 || i < 1 || j < 1 || i > n || j > n) {
        return -1;
    }
    if (i < j) {
        return (long long)n * (n + 1LL) / 2;  // 共用常量
    }
    return (long long)i * (i - 1) / 2 + j - 1;
}

long long UpperTriIndex(int n, int i, int j) {
    if (n <= 0 || i < 1 || j < 1 || i > n || j > n) {
        return -1;
    }
    if (i > j) {
        return (long long)n * (n + 1LL) / 2;
    }
    return (long long)(i - 1) * (2LL * n - i + 2) / 2 + j - i;
}
```

**易错点：** 三角矩阵非保留区应返回零或常量，不能像对称矩阵那样交换行列号，去读取另一侧的任意值。直接修改共用常量单元会影响整个非保留区域。

#### 三对角矩阵的压缩与逆映射

三对角矩阵只在主对角线及其上下各一条对角线上可能非零，即 $\lvert i-j\rvert\le1$，其余元素为 0。

保留 $3n-2$ 个位置（$n\ge1$），按行优先压缩。保留区域内：

$$
k=2i+j-3
$$

反求行列号：

$$
i=\left\lfloor\frac{k+1}{3}\right\rfloor+1,\qquad
j=k-2i+3
$$

```cpp
long long TriDiagonalIndex(int n, int i, int j) {
    if (n <= 0 || i < 1 || j < 1 || i > n || j > n ||
        i - j > 1 || j - i > 1) {
        return -1;
    }
    return 2LL * i + j - 3;
}

bool TriDiagonalCoordinate(int n, long long k, int *i, int *j) {
    if (n <= 0 || i == NULL || j == NULL || k < 0 || k >= 3LL * n - 2) {
        return false;
    }
    int row = (int)((k + 1) / 3 + 1);
    int col = (int)(k - 2LL * row + 3);
    *i = row;
    *j = col;
    return true;
}

bool TriDiagonalGet(const ElemType packed[], int n, int i, int j,
                     ElemType *value) {
    if (packed == NULL || value == NULL || n <= 0 ||
        i < 1 || j < 1 || i > n || j > n) {
        return false;
    }
    long long k = TriDiagonalIndex(n, i, j);
    *value = (k < 0) ? 0 : packed[k];
    return true;
}
```

**推导：** 第 1 行保留两个位置，中间行保留三个，最后一行保留两个；$n=1$ 单独只有一个位置，结果也符合 $3n-2$。对中间行先计前面整行，再加行内偏移，可化简得到 $2i+j-3$。

**例：** $n=4$，存储顺序是 $(1,1),(1,2),(2,1),(2,2),(2,3),(3,2),(3,3),(3,4),(4,3),(4,4)$。下标 7 对应 $(3,4)$，代回 $2\times3+4-3=7$。

#### 特殊矩阵公式的边界检查

- 对称矩阵：验证 $(1,1)$ 对应 0，保留区域末元素对应 $n(n+1)/2-1$。
- 对称矩阵交换 $(i,j)$ 与 $(j,i)$ 后，压缩下标必须相同。
- 三角矩阵：非保留区域应统一落到常量位置，而不是映射到对称值。
- 三对角矩阵：第一行、最后一行和 $n=1$ 单独检查；最后下标为 $3n-3$。
- 若压缩数组从 1 开始，零基下标整体加 1；若求地址，再乘单元素字节数加首地址。

### 3.4.4 稀疏矩阵

#### 稀疏性与特殊矩阵的区别

非零元素相对矩阵总元素很少的矩阵称为稀疏矩阵，常用 $t/(mn)$ 描述非零比例，$t$ 为非零元素数。

- 特殊矩阵利用对称、三角、带状等已知规律定位；稀疏矩阵的非零位置通常没有这样的固定规律。
- 稀疏表示要保存非零值，还要保存它的位置。
- “零很多”不意味着任何压缩方法都一定节省空间，位置字段和组织结构也有开销。

#### 三元组顺序表

每个非零元素保存 `(行号, 列号, 值)`，再保存矩阵行数、列数和非零个数。这里三元组按行号、同一行按列号递增排列，不保存零值，不允许重复坐标。

```cpp
enum { SPARSE_CAPACITY = 1000 };

typedef struct {
    int row;
    int col;
    ElemType value;
} Triple;

typedef struct {
    int rows;
    int cols;
    int count;
    Triple data[SPARSE_CAPACITY];
} SparseMatrix;

bool InitSparseMatrix(SparseMatrix *M, int rows, int cols) {
    if (M == NULL || rows <= 0 || cols <= 0) {
        return false;
    }
    M->rows = rows;
    M->cols = cols;
    M->count = 0;
    return true;
}
```

三元组数组下标从 0 开始，三元组里的行号、列号从 1 开始。矩阵全为 0 时 `count == 0`，行数和列数仍有意义。

#### 三元组的读取、修改、插入与删除

```cpp
// 坐标合法但没有三元组时返回 0，不是查找失败。
bool SparseGet(const SparseMatrix *M, int i, int j, ElemType *value) {
    if (M == NULL || value == NULL || i < 1 || j < 1 ||
        i > M->rows || j > M->cols) {
        return false;
    }
    for (int k = 0; k < M->count; ++k) {
        if (M->data[k].row == i && M->data[k].col == j) {
            *value = M->data[k].value;
            return true;
        }
        if (M->data[k].row > i ||
            (M->data[k].row == i && M->data[k].col > j)) {
            break;
        }
    }
    *value = 0;
    return true;
}

// 非零→非零是修改；零→非零是插入；非零→零是删除。
bool SparseSet(SparseMatrix *M, int i, int j, ElemType value) {
    if (M == NULL || i < 1 || j < 1 || i > M->rows || j > M->cols) {
        return false;
    }
    int k = 0;
    while (k < M->count && (M->data[k].row < i ||
           (M->data[k].row == i && M->data[k].col < j))) {
        ++k;
    }
    if (k < M->count && M->data[k].row == i && M->data[k].col == j) {
        if (value != 0) {
            M->data[k].value = value;
        } else {
            for (int p = k + 1; p < M->count; ++p) {
                M->data[p - 1] = M->data[p];
            }
            --M->count;
        }
        return true;
    }
    if (value == 0) {
        return true;
    }
    if (M->count == SPARSE_CAPACITY) {
        return false;
    }
    for (int p = M->count; p > k; --p) {
        M->data[p] = M->data[p - 1];
    }
    M->data[k].row = i;
    M->data[k].col = j;
    M->data[k].value = value;
    ++M->count;
    return true;
}
```

本实现线性定位，最坏 $O(t)$；插入或删除还可能移动三元组。稀疏压缩不是普通二维数组的直接下标访问，不能把这些操作一概写成 $O(1)$。

#### 稀疏矩阵转置与快速转置

转置将 `(i,j,value)` 改成 `(j,i,value)`，同时交换行列数。仅把每个三元组的行列字段交换，并不保证结果仍按行列次序排好。

- 普通转置：按原矩阵各列依次扫描三元组，把该列的元素放入结果，常见复杂度记为 $O(ct)$，$c$ 为列数；考虑空矩阵仍有外层扫描，严格可写 $O(c(t+1))$。
- 快速转置：统计每列的非零数 `num`，计算该列转为结果行时的起始位置 `start`，再一次扫描直接放置。

```cpp
// 前置条件：A 合法且三元组按行列有序；B 与 A 不同对象。
bool SparseTransposeFast(const SparseMatrix *A, SparseMatrix *B) {
    if (A == NULL || B == NULL || A == B || A->cols <= 0) {
        return false;
    }
    int *num = (int *)malloc((size_t)(A->cols + 1) * sizeof(int));
    int *start = (int *)malloc((size_t)(A->cols + 1) * sizeof(int));
    if (num == NULL || start == NULL) {
        free(num);
        free(start);
        return false;
    }
    for (int c = 0; c <= A->cols; ++c) {
        num[c] = 0;
    }
    for (int k = 0; k < A->count; ++k) {
        ++num[A->data[k].col];
    }
    start[1] = 0;
    for (int c = 2; c <= A->cols; ++c) {
        start[c] = start[c - 1] + num[c - 1];
    }
    B->rows = A->cols;
    B->cols = A->rows;
    B->count = A->count;
    for (int k = 0; k < A->count; ++k) {
        int c = A->data[k].col;
        int p = start[c]++;      // 每放一个，该结果行的写位置推进
        B->data[p].row = c;
        B->data[p].col = A->data[k].row;
        B->data[p].value = A->data[k].value;
    }
    free(num);
    free(start);
    return true;
}
```

快速转置时间 $O(c+t)$，除结果表外辅助空间 $O(c)$。原三元组按行有序，顺序扫描放到相应结果行时，也保持该结果行的列次序。

**例：** $2\times3$ 矩阵的三元组为 `(1,2,5),(2,1,7),(2,3,9)`。转置后为 $3\times2$，有序三元组为 `(1,2,7),(2,1,5),(3,2,9)`。

#### 十字链表的结构与定位

每个非零结点同时处于其所在行和所在列的链中。`right` 指向同一行下一非零结点，`down` 指向同一列下一非零结点；行、列各有头指针数组。

```cpp
typedef struct OLNode {
    int row;
    int col;
    ElemType value;
    struct OLNode *right;
    struct OLNode *down;
} OLNode, *OLink;

typedef struct {
    OLink *rowHead;
    OLink *colHead;
    int rows;
    int cols;
    int count;
} CrossMatrix;

bool InitCrossMatrix(CrossMatrix *M, int rows, int cols) {
    if (M == NULL || rows <= 0 || cols <= 0) {
        return false;
    }
    OLink *r = (OLink *)malloc((size_t)(rows + 1) * sizeof(OLink));
    OLink *c = (OLink *)malloc((size_t)(cols + 1) * sizeof(OLink));
    if (r == NULL || c == NULL) {
        free(r);
        free(c);
        return false;
    }
    for (int i = 0; i <= rows; ++i) {
        r[i] = NULL;
    }
    for (int j = 0; j <= cols; ++j) {
        c[j] = NULL;
    }
    M->rowHead = r;
    M->colHead = c;
    M->rows = rows;
    M->cols = cols;
    M->count = 0;
    return true;
}

bool CrossGet(const CrossMatrix *M, int i, int j, ElemType *value) {
    if (M == NULL || value == NULL || i < 1 || j < 1 ||
        i > M->rows || j > M->cols) {
        return false;
    }
    OLNode *p = M->rowHead[i];
    while (p != NULL && p->col < j) {
        p = p->right;
    }
    *value = (p != NULL && p->col == j) ? p->value : 0;
    return true;
}
```

各行按列号、各列按行号递增。每个非零值只对应一个结点，不是行链和列链各存一份数据。

#### 十字链表的增删改与销毁

```cpp
// M 已初始化且行列链一致；仅存非零结点。
bool CrossSet(CrossMatrix *M, int i, int j, ElemType value) {
    if (M == NULL || i < 1 || j < 1 || i > M->rows || j > M->cols) {
        return false;
    }
    OLink *rowLink = &M->rowHead[i];
    while (*rowLink != NULL && (*rowLink)->col < j) {
        rowLink = &(*rowLink)->right;
    }
    if (*rowLink != NULL && (*rowLink)->col == j) {
        OLNode *p = *rowLink;
        if (value != 0) {
            p->value = value;
            return true;
        }
        OLink *colLink = &M->colHead[j];
        while (*colLink != p) {
            colLink = &(*colLink)->down;
        }
        *rowLink = p->right;
        *colLink = p->down;
        free(p);
        --M->count;
        return true;
    }
    if (value == 0) {
        return true;
    }
    OLNode *p = (OLNode *)malloc(sizeof(OLNode));
    if (p == NULL) {
        return false;
    }
    OLink *colLink = &M->colHead[j];
    while (*colLink != NULL && (*colLink)->row < i) {
        colLink = &(*colLink)->down;
    }
    p->row = i;
    p->col = j;
    p->value = value;
    p->right = *rowLink;
    p->down = *colLink;
    *rowLink = p;
    *colLink = p;
    ++M->count;
    return true;
}

void DestroyCrossMatrix(CrossMatrix *M) {
    if (M == NULL) {
        return;
    }
    for (int i = 1; i <= M->rows; ++i) {
        OLNode *p = M->rowHead[i];
        while (p != NULL) {
            OLNode *next = p->right;
            free(p);
            p = next;
        }
    }
    free(M->rowHead);
    free(M->colHead);
    M->rowHead = M->colHead = NULL;
    M->rows = M->cols = M->count = 0;
}
```

`rowLink` 和 `colLink` 是“指向链接字段的指针”，可统一处理行列链的首位置和中间位置。插入、删除需同时维护两个方向，最坏定位 $O(t)$；知道相应位置后，接链和断链为常量操作。

**易错点：** 行链、列链共享同一个结点，销毁时只沿行链释放一遍；不能再沿列链重复释放。销毁函数适用于成功初始化或预先置零的对象。

#### 稀疏存储方式比较

| 方式 | 优点 | 注意事项 |
| --- | --- | --- |
| 三元组顺序表 | 记录紧凑，易顺序扫描和集中处理 | 需要保存坐标；插删可能移动记录，定长实现有容量限制 |
| 十字链表 | 可沿行或列访问，局部插删不搬移其他记录 | 多指针和行列头数组有开销，两个方向必须同步维护 |

两种表示均改变了普通二维数组按下标直接定位的方式。稀疏程度较低时，坐标、链接开销可能抵消压缩收益。

## 高频考点与易错点

| 容易误判的说法或步骤 | 正确判断 |
| --- | --- |
| 栈的输出一定是输入逆序 | 只有全部入栈后再全部出栈才必然逆序 |
| n 个元素有 n! 个单栈输出 | 固定互异输入、容量不限时是卡特兰数 |
| 顺序栈 top 的公式固定 | 先判断它指向当前元素还是下一可写位置 |
| 共享栈每个栈固定只能用一半 | 两栈共享全部容量，满时两个栈顶相邻 |
| 链栈永远不会满 | 没有固定数组满条件，仍可能申请失败 |
| rear 总指向最后一个元素 | 本页循环队列 rear 指向下一次入队位置 |
| N 个循环队列单元能存 N 个元素 | 空出一个单元版最多 N−1 个；计数或标志版可存 N 个 |
| front == rear 总是空 | 计数或标志版也可能满 |
| rear < front 时长度为负 | 使用带模运算的长度公式 |
| 链队列最后一次出队只改 front | 还要使 rear 回到头结点或 NULL，视表示而定 |
| 后缀表达式先弹出左操作数 | 后缀先弹右；前缀反向扫描时先弹左 |
| 中缀同级运算符一律不弹 | 左结合时应弹出同级运算符 |
| 括号匹配等于表达式合法 | 还需检查操作数、运算符、空括号等语法 |
| 非递归一定只用常数空间 | 显式栈也可能占线性空间 |
| 递归总调用次数就是栈深度 | 空间看同时活动调用，不是累计调用次数 |
| 层次遍历把结点值入队即可继续找孩子 | 通常需要树结点指针或可恢复结点的索引 |
| 数组地址只加行列号 | 需要按存储次序算元素偏移，再乘字节数 |
| 对称与三角矩阵的非保留区相同处理 | 对称用镜像；三角用约定零或共用常量 |
| 所有上三角压缩都用同一公式 | 行优先与列优先不同 |
| 三对角矩阵存 3n 个位置 | 边界两行不足三个，总数为 3n−2 |
| 稀疏矩阵只存非零值就够 | 还需要坐标及矩阵形状信息 |
| 交换三元组行列号就保持有序 | 转置后通常需要重排或按列放置 |
| 十字链表销毁行链后还要销毁列链结点 | 同一结点共享，重复释放错误 |

## 题目处理与复习自检

### 栈队列模拟题的作答步骤

1. 写出输入顺序、允许操作的端点和容量。
2. 写明 top、front、rear 的初值与含义。
3. 每步只执行合法操作，必要时列出当前元素顺序。
4. 检查空操作、满操作、回绕和最后一个元素删除。
5. 时间统计所有元素的总入出次数，不按表面循环层数猜阶。

### 地址与压缩公式题的作答步骤

1. 把行列下标和数组下标的起点写在纸上。
2. 明确行优先、列优先及保留区域。
3. 目标在非保留区时先做镜像、常量或零的判断。
4. 计数目标之前的完整行、列或块，再加组内偏移。
5. 若问地址，乘单元素字节数后加首地址。
6. 用首元素、末元素、主对角线与小阶矩阵验证。

### 本章边界与掌握检查

- [ ] 能判单栈合法输出，并说明卡特兰公式的前提。
- [ ] 能分别写出两种 top 约定和共享栈的空满条件。
- [ ] 能写顺序栈、链栈的入栈、出栈、读栈顶。
- [ ] 能推导循环队列空满与长度，区分三种方案容量。
- [ ] 能处理链队列空表、唯一元素和生命周期。
- [ ] 能写双端队列四种操作，区分输入受限与输出受限。
- [ ] 能指出括号匹配三种失败，并解释线性复杂度。
- [ ] 能手工转换中缀为后缀，正确处理同级结合性。
- [ ] 能用减法、除法验证前缀后缀的弹栈顺序。
- [ ] 能分别分析递归的总时间与最大调用栈空间。
- [ ] 能写层次遍历并明确队列保存的是结点指针。
- [ ] 能推导任意下标下界的二维、三维地址公式。
- [ ] 能算对称、三角、三对角压缩下标，反求三对角位置。
- [ ] 能说明三元组与十字链表的信息、操作和空间开销。
- [ ] 能处理全零稀疏矩阵、值改为零、转置次序和共享结点释放。

## 参考与后续补充

- [电子工业出版社：2027年数据结构考研复习指导](https://phei.com.cn/module/goods/wssd_content.jsp?bookid=68851)：用于核对章节目录；可在相应知识点补充自己的教材题号、错题和课堂强调内容。

[[B00-栈、队列与数组导航|返回本章导航]]
