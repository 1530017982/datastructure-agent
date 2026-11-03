# 第4章 串

> 面向 408 复习，按王道 2027 版的知识目录组织。知识讲解、函数和代表性例子为独立整理。
>
> [[B00-串导航|返回串导航]]

## 本章代码与下标约定

- 主版本 `SString` 的字符位序和数组有效下标都从 **1** 开始，`ch[0]` 不存字符，`length` 记录长度。它不依赖结尾的 `\0`。
- 匹配返回首次出现的 **1 基起始位序**；返回 0 表示未找到或参数无效。空模式串在合法起始位序 `pos` 处返回 `pos`。
- 查找、截取与插删的 `pos` 都是逻辑位序；允许插入或截取空串的位置可到 `length+1`。
- KMP 主版本 `next[1]=0`，`j==0` 为哨兵状态，失配时 `j=next[j]`，主串指针 `i` 不回退。
- 代码只使用基础类型、结构体、数组、指针和函数，不使用类、模板或 STL。C 字符串输入必须以 `\0` 结束；本页按单字节字符处理，UTF-8 的一个汉字可能包含多个字节。
- 所有非空指针都应有效，输出数组容量足够，字符串对象处于合法状态。固定容量操作超长时直接失败，不截断；动态对象再次初始化前先释放旧资源。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

enum { MAX_STR_LEN = 255 };

typedef struct {
    char ch[MAX_STR_LEN + 1];
    int length;
} SString;
```

## 4.1 串的定义和实现

### 4.1.1 串的定义

#### 字符序列、串长与空串

串是由零个或多个字符组成的有限序列，可记为：

$$
S='a_1a_2\cdots a_n',\qquad n\ge0
$$

- 串长是字符个数，不包含书写时用于标示串值的引号。
- 长度为 0 的串是空串，记为 `''`。
- 空格也是字符。空格串含一个或多个空格，长度不为 0。
- 串是特殊的线性表，数据元素是字符；串操作通常以子串整体为对象，而不只是单个元素。

**例：** `'ab c'` 长度是 4；`' '` 长度是 1；`''` 长度是 0。字符编码与逻辑字符的区分按题目约定，不把“占几个字节”无条件等同于“有几个字符”。

#### 子串、主串与位置

子串是主串中**连续**的一段字符序列。子串的位置通常指它第一个字符在主串中的位序。

- `'abcde'` 的子串包括 `'bcd'`；`'ace'` 虽按原顺序出现，却不连续，不是子串。
- `'ababa'` 中 `'aba'` 出现在位序 1 和 3，两个出现可以重叠。
- 空串是任意串的子串；算法接口仍需明确空串位置如何返回，本页首次匹配返回请求的合法 `pos`。
- 对长为 $n$ 的串，按位置枚举的非空子串共 $n(n+1)/2$ 段，加上空串共 $n(n+1)/2+1$。

**易错点：** 最后一条数的是位置区间，不是不同的串值。例如 `'aaa'` 有 6 段非空位置子串，但不同非空串值只有 `'a'`、`'aa'`、`'aaa'`。

#### 串相等与字典序比较

两个串相等，当且仅当长度相等且对应位置字符相同。

字典序从前向后比较：首个不同字符决定大小；若较短串是较长串的前缀，较短串较小。

**例：** `'abc' < 'abd'`，`'ab' < 'abc'`。不是先比较串长：`'z' > 'aaaa'`。

本页比较函数按字符的无符号字节值排序；实际语言字母排序、大小写折叠或中文排序需要额外规则。

#### 前缀、后缀与真前后缀

- 前缀：从串首开始的连续片段。
- 后缀：到串尾结束的连续片段。
- 真前缀、真后缀：不包含整个串自身；是否把空串列入其中需看术语约定，KMP 以长度 0 表示无非空公共部分。
- 公共真前后缀（border）：同一串的一个真前缀和一个真后缀内容相等。

**例：** `'ababa'` 的非空公共真前后缀是 `'a'` 和 `'aba'`，最长长度为 3。把整个 `'ababa'` 算作真前后缀会让 KMP 失配回退无法取得进展。

### 4.1.2 串的基本操作

#### 基本操作及接口语义

| 操作 | 作用与约束 |
| --- | --- |
| 赋值 | 由字符序列建立串值 |
| 复制 | 得到内容相同的独立逻辑串 |
| 判空、求长 | 查看当前有效字符数量 |
| 比较 | 按字符和长度判断相等或字典序大小 |
| 连接 | 把两串首尾相接 |
| 求子串 | 从合法位置取指定长度的连续字符 |
| 插入 | 在给定位置之前插入一串，原字符相对次序不变 |
| 删除 | 删除给定位置开始的指定长度片段 |
| 模式匹配 | 查找模式串在主串中的出现位置 |
| 替换 | 把指定匹配片段换成另一串，需说明重叠与扫描规则 |
| 清空、销毁 | 置为空串；对动态表示还需释放存储区 |

下列定长函数允许输出对象与输入对象相同：需要时先建立临时结果，再复制有效字符，避免覆盖尚未读取的输入。

#### 初始化、赋值、复制与比较

```cpp
void InitSString(SString *S) {
    S->length = 0;
}

int StrLength(const SString *S) {
    return S->length;
}

bool StrEmpty(const SString *S) {
    return S->length == 0;
}

void StrClear(SString *S) {
    S->length = 0;
}

// 内部辅助：只复制有效区间，不读取未使用单元。
void CopyValidChars(SString *dest, const SString *src) {
    for (int i = 1; i <= src->length; ++i) {
        dest->ch[i] = src->ch[i];
    }
    dest->length = src->length;
}

bool StrAssign(SString *S, const char *text) {
    if (S == NULL || text == NULL) {
        return false;
    }
    size_t n = strlen(text);
    if (n > MAX_STR_LEN) {
        return false;
    }
    SString temp;
    temp.length = (int)n;
    for (int i = 1; i <= temp.length; ++i) {
        temp.ch[i] = text[i - 1];
    }
    CopyValidChars(S, &temp);
    return true;
}

bool StrCopy(SString *dest, const SString *src) {
    if (dest == NULL || src == NULL) {
        return false;
    }
    CopyValidChars(dest, src);
    return true;
}

int StrCompare(const SString *S, const SString *T) {
    int n = (S->length < T->length) ? S->length : T->length;
    for (int i = 1; i <= n; ++i) {
        unsigned char a = (unsigned char)S->ch[i];
        unsigned char b = (unsigned char)T->ch[i];
        if (a < b) { return -1; }
        if (a > b) { return 1; }
    }
    if (S->length < T->length) { return -1; }
    if (S->length > T->length) { return 1; }
    return 0;
}
```

`StrCompare` 以有效输入对象为前提，返回 -1、0、1。定长串清空只改长度；旧字符留在数组中不再属于有效串值，不能对嵌入数组调用 `free`。

#### 连接与求子串

```cpp
bool StrConcat(SString *result, const SString *A, const SString *B) {
    if (result == NULL || A == NULL || B == NULL ||
        A->length + B->length > MAX_STR_LEN) {
        return false;
    }
    SString temp;
    temp.length = A->length + B->length;
    for (int i = 1; i <= A->length; ++i) {
        temp.ch[i] = A->ch[i];
    }
    for (int j = 1; j <= B->length; ++j) {
        temp.ch[A->length + j] = B->ch[j];
    }
    CopyValidChars(result, &temp);
    return true;
}

bool SubString(SString *result, const SString *S, int pos, int len) {
    if (result == NULL || S == NULL || len < 0 ||
        pos < 1 || pos > S->length + 1 || len > S->length - pos + 1) {
        return false;
    }
    SString temp;
    temp.length = len;
    for (int j = 1; j <= len; ++j) {
        temp.ch[j] = S->ch[pos + j - 1];
    }
    CopyValidChars(result, &temp);
    return true;
}
```

非空子串要求 $1\le pos\le n$、$0<len\le n-pos+1$。本页允许 `len=0`，其中 `pos=n+1` 也合法，但此处不能读取字符。

**例：** `'abcde'` 从位序 2 取长 3，得到 `'bcd'`，不是下标 2 开始的 `'cde'`。

#### 串插入与删除

```cpp
bool StrInsert(SString *S, int pos, const SString *T) {
    if (S == NULL || T == NULL || pos < 1 || pos > S->length + 1 ||
        S->length + T->length > MAX_STR_LEN) {
        return false;
    }
    SString temp;
    int k = 1;
    for (int i = 1; i < pos; ++i) {
        temp.ch[k++] = S->ch[i];
    }
    for (int j = 1; j <= T->length; ++j) {
        temp.ch[k++] = T->ch[j];
    }
    for (int i = pos; i <= S->length; ++i) {
        temp.ch[k++] = S->ch[i];
    }
    temp.length = k - 1;
    CopyValidChars(S, &temp);
    return true;
}

bool StrDelete(SString *S, int pos, int len) {
    if (S == NULL || len < 0 || pos < 1 || pos > S->length + 1 ||
        len > S->length - pos + 1) {
        return false;
    }
    for (int i = pos + len; i <= S->length; ++i) {
        S->ch[i - len] = S->ch[i];
    }
    S->length -= len;
    return true;
}
```

**例：** `'ace'` 在位序 2 插入 `'bd'` 得到 `'abdce'`。再从位序 2 删除长 2，恢复 `'ace'`。

插入保持原字符和插入串各自次序，不表示把字符按值排序；删除是按连续片段删除，不是删除所有同值字符。

#### 非重叠替换的函数与语义

本页从左向右在原串上选择不重叠匹配，用 V 替换 T；新写出的 V 不再次参加本次匹配。T 不能为空，V 可以为空。

```cpp
bool AppendChar(SString *S, char ch) {
    if (S->length == MAX_STR_LEN) {
        return false;
    }
    S->ch[++S->length] = ch;
    return true;
}

bool AppendString(SString *S, const SString *T) {
    if (S->length + T->length > MAX_STR_LEN) {
        return false;
    }
    int n = T->length; // 先记录原长度，也允许把 S 追加到自身。
    for (int j = 1; j <= n; ++j) {
        S->ch[++S->length] = T->ch[j];
    }
    return true;
}

bool ReplaceAll(SString *result, const SString *S,
                const SString *T, const SString *V) {
    if (result == NULL || S == NULL || T == NULL || V == NULL ||
        T->length == 0) {
        return false;
    }
    SString temp;
    temp.length = 0;
    int pos = 1;
    while (pos <= S->length) {
        bool matched = T->length <= S->length - pos + 1;
        for (int j = 1; matched && j <= T->length; ++j) {
            if (S->ch[pos + j - 1] != T->ch[j]) {
                matched = false;
            }
        }
        if (matched) {
            if (!AppendString(&temp, V)) { return false; }
            pos += T->length;
        } else {
            if (!AppendChar(&temp, S->ch[pos])) { return false; }
            ++pos;
        }
    }
    CopyValidChars(result, &temp);
    return true;
}
```

**例：** `'aaaa'` 中用 `'b'` 替换 `'aa'`，结果 `'bb'`；`'aaa'` 得到 `'ba'`。把 `'a'` 替换为 `'aa'` 不会反复替换新结果而陷入循环。

结果过长时返回 false，原输出对象不改变。该版本用朴素比较，最坏时间可写 $O(nm+r)$，其中 $r$ 是写出的结果长度；并不是 KMP 线性替换版本。

#### 基本操作的复杂度与缓冲区

| 操作 | 时间上界 | 实现依据 |
| --- | --- | --- |
| 判空、求长度、定长清空 | $O(1)$ | 有长度字段 |
| 复制、由 C 字符串赋值 | $O(n)$ | 逐字符处理 |
| 比较 | $O(\min(n,m))$，空串情形为常量 | 找首个不同字符，最后比较长度 |
| 连接 | $O(n+m)$ | 复制两串 |
| 求长为 l 的子串 | $O(l)$，l=0 为常量 | 复制选中片段 |
| 插入 | $O(n+m)$ | 建立完整结果 |
| 删除 | $O(n)$ | 后续字符前移 |

部分函数使用 `SString temp`，工作区容量是固定上限 `MAX_STR_LEN`，按此定长实现计为 $O(MAX\_STR\_LEN)$；若上限与输入规模一起增长，则不能把这一结果缓冲当成与规模无关的常量。原地删除只需常量辅助变量。

### 4.1.3 串的存储结构

#### 定长顺序存储与长度表示

定长顺序存储预先分配固定容量的连续字符数组，串长不能超过该容量。教材中的具体数组布局可能不同，先认清有效字符范围再写操作。

| 表示方式 | 有效字符区 | 如何知道串长 | 需要注意 |
| --- | --- | --- | --- |
| 本页 SString | `ch[1..length]` | 独立 length 字段 | ch[0] 不用，不要求末尾有 `\0` |
| 从 0 开始、另设长度 | `ch[0..length-1]` | 独立 length 字段 | 逻辑第 i 个字符对应 ch[i-1] |
| 首单元存长度 | 如 `ch[1..ch[0]]` | ch[0] | 长度范围受首单元类型限制 |
| C 字符串 | 从 ch[0] 到首个 `\0` 之前 | 扫描结束标记 | 容量要包含末尾的 `\0`，内部 `\0` 会提前结束 |

本页 `char ch[MAX_STR_LEN+1]` 多出的一个单元用于空置的 `ch[0]`，可以保存 255 个有效字符，**并没有同时为结尾标记保留额外单元**。

**易错点：** 不可直接对本页 SString 使用 `strlen(S.ch)`、`printf("%s", S.ch+1)`。按长度逐个输出，或复制到另一个容量足够的数组并补上结束标记。

```cpp
void PrintSString(const SString *S) {
    for (int i = 1; i <= S->length; ++i) {
        printf("%c", S->ch[i]);
    }
}
```

定长串发生容量不足时，可以规定截断，也可以规定失败。本页统一返回失败且保留原输出，做题时服从题目对“串连接”“串赋值”的具体定义。

#### 堆分配存储与动态空间

堆分配存储仍是顺序表示，只是字符空间按需要动态申请；“堆分配”中的堆指动态内存区，不是优先队列中的堆结构。

下面的 HString 采用 **0 基字符数组**，维护独立长度，并额外保留末尾 `\0`。这是此组函数的实现选择；堆分配表示本身并不强制使用结束标记。

```cpp
typedef struct {
    char *ch;
    int length;
} HString;

void InitHString(HString *S) {
    S->ch = NULL;
    S->length = 0;
}

void DestroyHString(HString *S) {
    free(S->ch);
    S->ch = NULL;
    S->length = 0;
}

bool HAssign(HString *S, const char *text) {
    if (S == NULL || text == NULL) {
        return false;
    }
    size_t n = strlen(text);
    if (n > INT_MAX) {
        return false;
    }
    char *buffer = (char *)malloc(n + 1);
    if (buffer == NULL) {
        return false;
    }
    for (size_t i = 0; i < n; ++i) {
        buffer[i] = text[i];
    }
    buffer[n] = '\0';
    // 完成读取后才释放旧空间，text 指向旧缓冲区时仍可工作。
    free(S->ch);
    S->ch = buffer;
    S->length = (int)n;
    return true;
}

bool HConcat(HString *result, const HString *A, const HString *B) {
    if (result == NULL || A == NULL || B == NULL) {
        return false;
    }
    if (A->length > INT_MAX - B->length) {
        return false;
    }
    int n = A->length + B->length;
    char *buffer = (char *)malloc((size_t)n + 1);
    if (buffer == NULL) {
        return false;
    }
    for (int i = 0; i < A->length; ++i) {
        buffer[i] = A->ch[i];
    }
    for (int i = 0; i < B->length; ++i) {
        buffer[A->length + i] = B->ch[i];
    }
    buffer[n] = '\0';
    // result 可以就是 A 或 B；复制完成后再释放。
    free(result->ch);
    result->ch = buffer;
    result->length = n;
    return true;
}
```

使用前先初始化，每个对象独立拥有自己的字符区；合法非空对象的 `ch` 必须指向至少 `length+1` 个单元。初始化后的空串可以是 `ch==NULL`，赋值后的空串可以拥有一个仅存 `\0` 的单元，判空应看 `length`。

**考点与易错点：**

- 连续存储不等于定长存储；堆分配也能按下标访问。
- 增长空间通常要重新申请、复制并释放旧区，不能默认串插入只需 $O(1)$。
- `HString B = A` 只复制指针，是浅复制；两个对象不能各自释放同一块空间。复制串值需要深复制。
- 重新分配后，原字符区的外部指针可能失效；申请失败时应保留原对象。
- HAssign 与 HConcat 的时间分别为 $O(n)$、$O(n+m)$，额外结果空间与新串长成正比。

#### 块链存储与存储密度

链式串可以每个结点放一个字符，也可以每个结点放多个字符；后者称为块链表示。块内顺序、块间链接。

```cpp
enum { BLOCK_SIZE = 4 };

typedef struct BlockNode {
    char ch[BLOCK_SIZE];
    int used;
    struct BlockNode *next;
} BlockNode;

typedef struct {
    BlockNode *head;
    BlockNode *tail;
    int length;
} BlockString;

void InitBlockString(BlockString *S) {
    S->head = NULL;
    S->tail = NULL;
    S->length = 0;
}

void ClearBlockString(BlockString *S) {
    BlockNode *p = S->head;
    while (p != NULL) {
        BlockNode *q = p->next;
        free(p);
        p = q;
    }
    InitBlockString(S);
}

// 取得逻辑位序 pos 的字符；块内数组从 0 开始。
bool BlockGet(const BlockString *S, int pos, char *out) {
    if (S == NULL || out == NULL || pos < 1 || pos > S->length) {
        return false;
    }
    BlockNode *p = S->head;
    int offset = pos;
    while (p != NULL && offset > p->used) {
        offset -= p->used;
        p = p->next;
    }
    if (p == NULL) {
        return false;
    }
    *out = p->ch[offset - 1];
    return true;
}
```

合法块的 `used` 在 1 到 BLOCK_SIZE 之间，只把 `ch[0..used-1]` 算作串内容。尾块未使用的位置是空闲单元；若题目用特殊字符作填充，应先明确该字符是否可能出现在原串中，不能无条件把填充当作实际字符。

存储密度通常定义为：

$$
\text{存储密度}=\frac{\text{有效串值占用的存储空间}}{\text{实际分配的总存储空间}}
$$

若每个满块有 $k$ 个单字节字符、指针占 $p$ 字节，且题目忽略其他字段、填充和对齐，满块密度是 $k/(k+p)$。本页结点还含 used 字段，实际计算需计入它及内存对齐；尾块未满会进一步降低密度。

块越大，通常指针开销占比越小，但块内移动、拆块与合块操作更复杂。块链串不能仅凭逻辑下标直接找到任意块；没有额外索引时需要沿链定位。

#### 三种存储结构的比较

| 方面 | 定长顺序 | 堆分配顺序 | 块链 |
| --- | --- | --- | --- |
| 字符空间 | 预分配固定容量 | 动态连续空间 | 多个相互链接的块 |
| 随机访问 | $O(1)$ | $O(1)$ | 通常需沿链定位 |
| 容量 | 受预定上限限制 | 受可用内存与长度类型限制 | 可逐块增长 |
| 插删 | 常需移动字符 | 常需移动或重建字符区 | 定位后可能拆块、合块、块内移动 |
| 额外开销 | 可能有闲置容量 | 指针、长度与可能的预留空间 | 指针、管理字段、块内空闲单元 |
| 匹配实现 | 下标实现方便 | 下标实现方便 | 需顺序游标或其他定位方法 |

**考点：** 比较存储结构时，分开分析定位、修改和空间管理。不能把链表“已知结点后插入方便”的结论直接推广成“串的任意插删都是常量时间”。

## 4.2 串的模式匹配

### 4.2.1 简单的模式匹配算法

#### 模式匹配的任务与边界

主串 S 长为 $n$，模式串 T 长为 $m$，从主串位序 pos 开始寻找 T 的首次完整出现。本页只返回起始位序，不复制子串。

- 非空模式的候选起点范围是 `pos..n-m+1`。
- 剩余主串长度小于模式长度时，直接失败。
- 空模式按本页约定返回合法 pos，包括 `n+1`；pos 不在 `1..n+1` 则返回 0。
- 匹配必须连续；找子序列、字典序比较都不是此处的模式匹配。

#### BF算法的思想与函数

BF（朴素匹配）逐个尝试候选起点。从模式首字符向后比较；一旦失配，将候选起点右移一位，模式从头再比。

```cpp
int IndexBF(const SString *S, const SString *T, int pos) {
    if (S == NULL || T == NULL || pos < 1 || pos > S->length + 1) {
        return 0;
    }
    if (T->length == 0) {
        return pos;
    }
    if (T->length > S->length - pos + 1) {
        return 0;
    }
    for (int start = pos; start <= S->length - T->length + 1; ++start) {
        int j = 1;
        while (j <= T->length && S->ch[start + j - 1] == T->ch[j]) {
            ++j;
        }
        if (j > T->length) {
            return start;
        }
    }
    return 0;
}
```

另一种教材写法用 i、j 分别指向主串和模式当前字符。失配时：

$$
i\leftarrow i-j+2,\qquad j\leftarrow1
$$

推导：当前候选起点是 `i-j+1`，下一个起点是 `i-j+2`。这是 **1 基、i 与 j 指向当前待比较字符** 时的公式，不能原样套进其他下标约定。

#### BF匹配过程与时间复杂度

**例：** S=`'aaaab'`，T=`'aab'`。

| 候选起点 | 比较过程 | 结果 |
| --- | --- | --- |
| 1 | a=a、a=a、a≠b | 改试起点 2 |
| 2 | a=a、a=a、a≠b | 改试起点 3 |
| 3 | a=a、a=a、b=b | 返回 3 |

从 pos=1 开始、有 $n-m+1$ 个候选且每次最多比较 m 个字符，最坏比较次数是 $(n-m+1)m$，通常写时间上界 $O(nm)$，辅助空间 $O(1)$。

- 当主串全为 a、模式为若干 a 后接 b 时，每次都可能到模式末尾才失败，重复比较明显。
- 第一个候选就成功时，比较 m 次，耗时 $O(m)$。
- 连续多个候选都在首字符失配时，比较次数与候选数成正比。

**易错点：** “最好情况”应说明是否要求找到、是否允许模式长于剩余主串及 m 是否视为变量。不能无条件把 BF 的所有成功匹配都说成 $O(n)$ 或所有最优输入都说成 $O(1)$。

### 4.2.2 串的模式匹配算法——KMP算法

#### 为什么失配后主串不必回退

若已经匹配 `T[1..j-1]`，但 `S[i] != T[j]`，主串刚匹配的那一段与模式的这个前缀完全相同。要保留其中一部分匹配结果，新模式前缀必须等于这段已匹配内容的后缀。

因此可利用模式自身的公共真前后缀，直接确定模式回退位置；已验证的字符无需从主串重新读取。

设 `T[1..j-1]` 的最长公共真前后缀长为 ℓ：

- 已匹配后缀的 ℓ 个字符，可以继续对应新模式的前 ℓ 个字符。
- 下一次比较模式的第 `ℓ+1` 个字符。
- 当前主串字符 `S[i]` **尚未匹配成功**，i 保持不变。
- 若这个候选仍失配，再沿更短的公共真前后缀继续回退。

**例：** 模式 `'ababaa'` 的前 5 个字符 `'ababa'` 已匹配，模式第 6 位 a 失配。`'ababa'` 的最长公共真前后缀为 `'aba'`，长 3；保留它，下一次比较模式第 4 位 b。

#### next数组的准确含义

本页只在这一节采用如下主约定：

$$
next[1]=0
$$

$$
next[j]=1+\max\{\ell:\ 0\le\ell<j-1,\quad
T[1..\ell]=T[j-\ell..j-1]\},\qquad j\ge2
$$

也就是说，**next[j] 看的是当前字符之前的 `T[1..j-1]`**，记录失配后“下一次要比较的模式位序”，不是直接记录公共前后缀长度。

- `next[j]=k>0`：保留 k-1 个已匹配字符，随后比较 `T[k]`。
- 对 j≥2，无非空公共真前后缀时 next[j]=1，回到模式首字符。
- `next[1]=0`：首字符也失配，进入哨兵状态；下一步 i、j 同时加 1，跳过当前主串字符。
- 对 j≥2，总有 `1 <= next[j] < j`；回退必须取得进展。
- next 只取决于模式串，与主串无关；同一模式可复用预处理结果。

若当前模式 j 失配且 next[j]=k>0，模式相对主串右移 `j-k` 位。若 k=0，算法通过哨兵分支推进主串一位，不能把“对齐到第 0 个字符”当成实际字符比较。

#### 手算next的完整例子

模式 T=`'ababaa'`：

| j | T[j] | 之前已匹配的前缀 T[1..j-1] | 最长公共真前后缀 | 长度 ℓ | next[j] |
| --- | --- | --- | --- | --- | --- |
| 1 | a | 空 | 首位单独规定 | — | 0 |
| 2 | b | a | 空 | 0 | 1 |
| 3 | a | ab | 空 | 0 | 1 |
| 4 | b | aba | a | 1 | 2 |
| 5 | a | abab | ab | 2 | 3 |
| 6 | a | ababa | aba | 3 | 4 |

所以 next=`[0,1,1,2,3,4]`，这里列出的第一项对应 next[1]，不是 next[0]。

**手算步骤：** 标出 j → 只取它之前的 j-1 个字符 → 列出真前缀与真后缀 → 找最长相等部分 → 长度加 1。首位写 0。

#### 线性时间求next的函数

```cpp
bool GetNext(const SString *T, int next[], int capacity) {
    if (T == NULL || next == NULL || capacity < T->length + 1) {
        return false;
    }
    if (T->length == 0) {
        return true;
    }
    int j = 1;
    int k = 0;
    next[1] = 0;
    while (j < T->length) {
        if (k == 0 || T->ch[j] == T->ch[k]) {
            ++j;
            ++k;
            next[j] = k;
        } else {
            k = next[k];
        }
    }
    return true;
}
```

这里 `j` 是已求出 next 的位置，`k=next[j]` 是候选回退位序：

1. 若 `T[j]==T[k]`，原来的公共部分能再延长一个字符，所以 `next[j+1]=k+1`。
2. 若不相等，长的候选不能扩展，令 `k=next[k]` 尝试更短候选；j 不变。
3. 若 k=0，没有候选可保留，推进后写入 1。

`k==0 || ...` 的短路求值保证不比较 `T->ch[0]`。`next[0]` 不需要初始化，也不应读取。

预处理 $O(m)$：j 只向前；k 的增加次数受 j 的推进次数限制，回退使 k 严格减小，因此累计回退次数也是线性的。不能因为代码有 while 和回退，就直接判成 $O(m^2)$。

#### KMP首次匹配的函数

```cpp
// next 必须是为当前 T 正确生成的 next 或 nextval 表。
int IndexKMP(const SString *S, const SString *T, int pos,
             const int next[]) {
    if (S == NULL || T == NULL || pos < 1 || pos > S->length + 1) {
        return 0;
    }
    if (T->length == 0) {
        return pos;
    }
    if (next == NULL || T->length > S->length - pos + 1) {
        return 0;
    }
    int i = pos;
    int j = 1;
    while (i <= S->length && j <= T->length) {
        if (j == 0 || S->ch[i] == T->ch[j]) {
            ++i;
            ++j;
        } else {
            j = next[j];
        }
    }
    if (j > T->length) {
        return i - T->length;
    }
    return 0;
}
```

- 成功时 j=m+1，i 已越过匹配片段的最后一个字符，起点为 `i-m`。
- 失败时 i 超过主串末尾，而模式没有完整匹配。
- 普通失配只改 j；只有比较成功或 j=0 时才推进 i。
- 数组需有至少 m+1 个单元，实际使用 `next[1..m]`；本函数成功后直接返回，不需要 next[m+1]。

#### 主串不回退的逐步匹配例子

S=`'ababababaa'`，T=`'ababaa'`，next=`[0,1,1,2,3,4]`，pos=1。

| 步骤 | 当前 i、j | 比较或动作 | 随后的状态 |
| --- | --- | --- | --- |
| 1 | i=1，j=1 | 连续匹配前 5 个字符 ababa | i=6，j=6 |
| 2 | i=6，j=6 | b≠a，j=next[6]=4 | i=6，j=4 |
| 3 | i=6，j=4 | b=b，随后 a=a | i=8，j=6 |
| 4 | i=8，j=6 | b≠a，j=4 | i=8，j=4 |
| 5 | i=8，j=4 | b=b、a=a、a=a | i=11，j=7 |
| 6 | j>6 | 模式完整匹配，返回 11-6 | 起点 5 |

两次失配时 i 分别保持为 6 和 8，模式各右移 2 位。右移时跳过的对齐位置不可能成功，因为它们不能保留已有匹配内容。

只计匹配阶段的字符比较：本例 KMP 共 `5+1+2+1+3=12` 次；BF 依次尝试起点 1 到 5，共 `6+1+6+1+6=20` 次。nextval 在本例同样为 12 次，因为两次失配都发生在第 6 位，而 nextval[6]=next[6]=4。

#### KMP的时间与空间复杂度

| 阶段 | 时间 | 辅助空间 |
| --- | --- | --- |
| 求 next | $O(m)$ | next 表 $O(m)$，另有常量变量 |
| 使用已有表进行首次匹配 | $O(n)$ | 函数自身 $O(1)$ |
| 预处理加一次匹配 | $O(n+m)$ | $O(m)$ |

匹配阶段中，i 不回退，j 的增加与主串的推进同步；j 每次回退都严格减少，累计回退次数受累计增加次数限制，所以总比较次数线性。空模式或长度不足的输入可以立即返回。

**考点：**

- “i 不回退”不等于“每个主串字符只比较一次”，同一 `S[i]` 可能与几个不同模式字符比较。
- 若题目询问总复杂度，要计入预处理；同一模式用于多次查找时，可以只预处理一次。
- 从主串 pos 开始查找可以写成剩余长度的上界，本页 $O(n)$ 是方便的统一上界。
- 逻辑复杂度按可增长的 n、m 分析；示例 SString 的固定容量仅是代码表示选择。

#### 与0基next及前缀函数的对应

不同资料可能都把数组叫 next，但数组内容和回退语句不同。做题先检查：**字符下标、首项值、数组记录长度还是位序、失配时怎样使用**。

| 约定 | 首项 | 每项含义 | 失配动作 |
| --- | --- | --- | --- |
| 本页 1 基 next | next[1]=0 | 当前位 j 失配后再比较的位序 | j=next[j]，0 为哨兵 |
| 0 基、-1 哨兵 next0 | next0[0]=-1 | 当前下标 q 失配后再比较的下标 | q=next0[q]，-1 时推进 |
| 0 基前缀函数 pi | pi[0]=0 | **包含当前字符**的前缀最长公共真前后缀长度 | 已匹配 j 个时，回退到 pi[j-1] 个 |

对同一模式、未优化的上述两种 next：

$$
next0[q]=next[q+1]-1
$$

与前缀函数的对应为：

$$
next[j]=pi[j-2]+1\quad(j\ge2),\qquad next[1]=0
$$

模式 `'ababaa'` 的对照：

| 数组 | 按自身下标顺序列出 |
| --- | --- |
| next[1..6] | 0，1，1，2，3，4 |
| next0[0..5] | -1，0，0，1，2，3 |
| pi[0..5] | 0，0，1，2，3，1 |

**易错点：** pi 的最后一项是整个 `'ababaa'` 的最长公共真前后缀长度 1；next[6] 看的是 `'ababa'`，所以是 4。两者差异不仅是把所有值加 1，还存在所考察前缀的位置差异。

#### 重叠匹配与完整匹配后的继续查找

首次匹配成功后若还要继续查找，必须决定是否允许重叠。S=`'ababa'`、T=`'aba'`：允许重叠有起点 1、3；从前一次片段之后再查，只保留起点 1。

为避免读取不存在的 next[m+1]，下面单独使用前缀函数实现“统计所有重叠出现”。这里 j 表示已匹配字符个数，从 0 开始；SString 仍是 1 基存储，因此读取 `T->ch[j+1]`。

```cpp
bool BuildPrefix0(const SString *T, int pi[], int capacity) {
    if (T == NULL || pi == NULL || capacity < T->length) {
        return false;
    }
    if (T->length == 0) {
        return true;
    }
    pi[0] = 0;
    for (int q = 1; q < T->length; ++q) {
        int k = pi[q - 1];
        while (k > 0 && T->ch[q + 1] != T->ch[k + 1]) {
            k = pi[k - 1];
        }
        if (T->ch[q + 1] == T->ch[k + 1]) {
            ++k;
        }
        pi[q] = k;
    }
    return true;
}

// 本接口只统计非空模式：参数无效、空模式或申请失败返回 -1。
int CountOverlappingKMP(const SString *S, const SString *T) {
    if (S == NULL || T == NULL || T->length == 0) {
        return -1;
    }
    if (T->length > S->length) {
        return 0;
    }
    int *pi = (int *)malloc((size_t)T->length * sizeof(int));
    if (pi == NULL) {
        return -1;
    }
    BuildPrefix0(T, pi, T->length);
    int j = 0;
    int count = 0;
    for (int i = 1; i <= S->length; ++i) {
        while (j > 0 && S->ch[i] != T->ch[j + 1]) {
            j = pi[j - 1];
        }
        if (S->ch[i] == T->ch[j + 1]) {
            ++j;
        }
        if (j == T->length) {
            ++count;
            // 保留整个模式的最长公共真前后缀，允许出现重叠。
            j = pi[T->length - 1];
        }
    }
    free(pi);
    return count;
}
```

若要统计不重叠出现，在每次完整匹配后把 j 置为 0。本函数是 $O(n+m)$ 时间、$O(m)$ 辅助空间；不要与本章前面的“非重叠替换”接口混淆。

### 4.2.3 KMP算法的进一步优化

#### 普通next为什么会重复比较

若 `S[i] != T[j]`，普通 next 会回退到 k=next[j]。如果 `T[k]==T[j]`，已经知道 `S[i]` 也不等于 `T[k]`，再比较一次必定失败，可以直接跳到 k 的回退位置。

优化只跳过这些能确定失败的候选，不跳过可能成功的候选；主串 i 仍保持不变。

**例：** T=`'ababaa'`，在 j=5 处与主串字符 c 失配：

```text
普通 next：模式第5位 a → 第3位 a → 第1位 a → 哨兵0
nextval：模式第5位 a → 哨兵0
```

三处候选字符都是 a，已知 c≠a，就不必反复比较。若主串字符是 a，则第 5 位已经成功，不走这条回退链。

#### nextval的定义与手算方法

在本页 1 基约定下：

$$
nextval[1]=0
$$

$$
nextval[j]=
\begin{cases}
nextval[next[j]],&next[j]>0\ \text{且}\ T[j]=T[next[j]]\\
next[j],&\text{其他情况}
\end{cases}
$$

从小到大计算，依赖的 nextval[next[j]] 已经求出。不能只做一次 `next[next[j]]` 就停止，因为回退链上可能有多个重复字符。

仍用 T=`'ababaa'`：

| j | T[j] | next[j] | 回退候选字符 | 是否重复 | nextval[j] |
| --- | --- | --- | --- | --- | --- |
| 1 | a | 0 | 哨兵 | 首位规定 | 0 |
| 2 | b | 1 | a | 否 | 1 |
| 3 | a | 1 | a | 是，取 nextval[1] | 0 |
| 4 | b | 2 | b | 是，取 nextval[2] | 1 |
| 5 | a | 3 | a | 是，取 nextval[3] | 0 |
| 6 | a | 4 | b | 否 | 4 |

所以 nextval=`[0,1,0,1,0,4]`。

**易错点：** 普通 next 的 j≥2 项至少为 1，nextval 却可能为 0；优化表记录跳过必失败候选后的位序，不能用 `nextval[j]-1` 直接回答最长公共真前后缀长度。

#### 直接求nextval的函数

```cpp
bool GetNextVal(const SString *T, int nextval[], int capacity) {
    if (T == NULL || nextval == NULL || capacity < T->length + 1) {
        return false;
    }
    if (T->length == 0) {
        return true;
    }
    int j = 1;
    int k = 0;
    nextval[1] = 0;
    while (j < T->length) {
        if (k == 0 || T->ch[j] == T->ch[k]) {
            ++j;
            ++k;
            if (T->ch[j] != T->ch[k]) {
                nextval[j] = k;
            } else {
                nextval[j] = nextval[k];
            }
        } else {
            k = nextval[k];
        }
    }
    return true;
}
```

与 GetNext 的区别有两处：扩展成功后依据下一对候选字符是否相同决定表项；扩展失败时沿优化表回退。本实现计算到 j=m 即结束，不读取 T[m+1]。

匹配函数直接复用 `IndexKMP`，传入 nextval 即可；不要同时把主串指针回退。

#### 统一查找接口与调用示例

下面封装“建表 → 查找 → 释放表”，普通 next 与 nextval 可切换。先把本页之前的类型、GetNext、GetNextVal 与 IndexKMP 定义放在一起。

```cpp
int FindKMP(const SString *S, const SString *T, int pos,
            bool useNextVal) {
    if (S == NULL || T == NULL || pos < 1 || pos > S->length + 1) {
        return 0;
    }
    if (T->length == 0) {
        return pos;
    }
    if (T->length > S->length - pos + 1) {
        return 0;
    }
    int capacity = T->length + 1;
    int *table = (int *)malloc((size_t)capacity * sizeof(int));
    if (table == NULL) {
        return 0;
    }
    bool ok;
    if (useNextVal) {
        ok = GetNextVal(T, table, capacity);
    } else {
        ok = GetNext(T, table, capacity);
    }
    int position = 0;
    if (ok) {
        position = IndexKMP(S, T, pos, table);
    }
    free(table);
    return position;
}

void ExampleStringMatch(void) {
    SString S;
    SString T;
    InitSString(&S);
    InitSString(&T);
    if (!StrAssign(&S, "ababababaa") || !StrAssign(&T, "ababaa")) {
        return;
    }
    int p1 = IndexBF(&S, &T, 1);
    int p2 = FindKMP(&S, &T, 1, false);
    int p3 = FindKMP(&S, &T, 1, true);
    printf("%d %d %d\n", p1, p2, p3); // 三个结果都应为 5。
}
```

本页查找接口为了简洁，把未找到、参数无效和申请失败都用 0 表示；要区分错误原因时，可以用 bool 返回执行状态，并通过 `int *position` 单独输出位置。

#### 优化效果与考试中的判断

- nextval 消除普通 next 回退链上的部分重复字符比较。
- 普通 KMP 和优化 KMP 的总时间上界都是 $O(n+m)$，辅助空间都是 $O(m)$。
- 不是所有模式都有可跳过的重复候选，不能声称每次匹配都严格减少比较次数。
- 题目要求 next 时就写普通 next；要求 nextval 时再优化，不能用优化结果替换普通表的答案。
- 求“比较次数”时先固定表和算法版本，只统计真正执行的字符比较。`j==0` 的哨兵分支不比较字符；next 的预处理比较是否计入，按题目要求区分。

**比较次数例：** S=`'aaabaaaa'`、T=`'aaaa'`，首次起点为 5。普通 next=`[0,1,2,3]`，nextval=`[0,0,0,0]`。

| 算法 | 匹配阶段字符比较次数 | 计算依据 |
| --- | --- | --- |
| BF | 14 | 候选 1 到 5 分别比较 4、3、2、1、4 次 |
| 普通 KMP | 11 | 前 3 次成功；主串 b 对模式 4、3、2、1 位各失败一次；最后 4 次成功 |
| nextval KMP | 8 | 前 3 次成功；b 对第 4 位失败后直接到哨兵；最后 4 次成功 |

以上均不计建表过程。即使优化版只比较 8 次，也不能据此推断它对每个主串字符都只比较一次。

## 本章考点与易错点回顾

### 概念与存储检查清单

1. 空串长度为 0，空格串长度大于 0；子串必须连续。
2. 串相等要同时检查长度与对应字符；字典序不是先按长度排序。
3. 区分逻辑位序、数组下标和长度；认清 ch[0] 是字符、长度还是空置。
4. C 字符串靠 `\0` 结束，显式长度串不必采用此规则；容量是否含结束标记需看表示。
5. 堆分配是动态顺序存储；块链需要计入指针、空闲单元及题目给出的其他开销。
6. 插删、连接和替换要检查容量、范围、输出与输入重合，以及失败时是否改变原串。
7. 置空与释放空间的语义要看实现；动态对象只改 length 而遗失原指针会泄漏。

### KMP做题检查清单

1. 先写明采用哪种 next 约定；不要凭记忆把 0、-1 和 1 基下标混在一起。
2. 本页 next[j] 只看 `T[1..j-1]`，最长公共真前后缀长度加 1；next[1]=0。
3. 正常失配只令 j=next[j]，i 不回退，也不马上加 1。
4. j=0 时进入推进分支，不读取或比较第 0 个模式字符。
5. 成功返回 i-m；此时 i 已经越过整个匹配片段。
6. nextval 要比较 T[j] 与 T[next[j]]；同字符时继续取优化后的回退值。
7. nextval 不是最长公共真前后缀长度表；包含当前字符的 pi 也不是本页 next。
8. 找全部出现要处理完整匹配后的回退与重叠；不能越界读取 next[m+1]。
9. 计字符比较时，区分普通 next、nextval、预处理与匹配，哨兵推进不算字符比较。
10. 写复杂度时，BF 最坏 $O(nm)$；KMP 建表加查找 $O(n+m)$，表空间 $O(m)$。

### 三个代表性回顾问题

**问题一：** `'aaaaa'` 的普通 next 与 nextval 是什么？

按本页约定，next=`[0,1,2,3,4]`；nextval=`[0,0,0,0,0]`。普通表可保留较长的全 a 前后缀，优化表则知道失配字符不等于 a，会跳过所有仍为 a 的候选。

**问题二：** 模式末位失配时，能直接把 i 加 1、j 置为 1 吗？

不能作为一般正确的 KMP 回退规则。这样会丢失当前主串字符及可能保留的匹配后缀，可能漏掉合法匹配；应按 next 或 nextval 回退 j，并保持 i。

**问题三：** S=`'aaaa'`、T=`'aa'`，允许重叠出现有几次？非重叠替换为 b 后是什么？

重叠起点为 1、2、3，共 3 次；按本页从左到右非重叠替换得到 `'bb'`。两种操作的规则不同。

## 资料与使用说明

- 章节结构依据用户给出的目录，与[电子工业出版社《2027年数据结构考研复习指导》书目](https://phei.com.cn/module/goods/wssd_content.jsp?bookid=68851)对应；不整理教材习题与答案页。
- [Princeton KMP 文档](https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/KMP.html)可作扩展参考，其实现采用有限自动机表示，不能把它的代码下标与本页 next 表直接混用。
- 本页代码块按知识点拆开，公共类型及被调用函数需要一并使用；均保留在 Markdown 内，不另建 cpp 文件。
