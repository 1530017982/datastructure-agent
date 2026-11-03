# 第6章 图

> 面向 408 复习，按王道 2027 版及用户提供的目录组织。知识说明、例子和代码为独立整理，不摘录教材试题与答案。
>
> [[B00-图导航|返回本章导航]]

## 本章约定与代码使用

- 顶点编号为 **0..n-1**，顶点标签只是显示值；即使标签重复，仍按编号区分顶点。
- 基础存储代码表示简单图：不允许自环和重边；有向图中 u→v 与 v→u 是不同弧，无向边只算一条逻辑边。
- 允许零权和负权，是否能使用某个算法要看算法条件。用独立存在标志区分无边，不把权值 0 当成无边。
- `GRAPH_INF` 表示距离不可达，不表示一条真实边的权。有限边权限制在 ±10^12，便于在 long long 范围内计算。
- DFS、BFS 等非加权遍历沿有向边的出边走。指定邻接次序才有确定遍历序列；同一图不同邻接表次序可能产生不同序列。
- 代码使用结构体、数组、指针、malloc/free 和基础 C++ 语法，不使用 STL。动态图使用前初始化，再次初始化前释放旧边结点。
- 工作数组固定上限 100 个顶点；按算法分析的 O(n)、O(n²) 指随输入规模配置时的规模，示例数组实际预留空间按 MAX_GRAPH_V 计算。
- 所有图对象要求结构合法、无悬空链；输出数组按注明容量提供。顶点紧凑删除会改变编号，旧编号和此前算出的路径等结果需重新处理。

```cpp
#include <stdio.h>
#include <stdlib.h>
#include <limits.h>

enum {
    MAX_GRAPH_V = 100,
    MAX_UNDIRECTED_EDGES = MAX_GRAPH_V * (MAX_GRAPH_V - 1) / 2
};
const long long GRAPH_INF = LLONG_MAX / 4;
const long long EDGE_WEIGHT_LIMIT = 1000000000000LL;

bool ValidEdgeWeight(long long w) {
    return -EDGE_WEIGHT_LIMIT <= w && w <= EDGE_WEIGHT_LIMIT;
}

// 参数均在 [-GRAPH_INF,GRAPH_INF]；调用者先排除不可达项。
// Floyd 有负环时中间数值可能不断下降，因此作饱和处理。
long long AddDistance(long long a, long long b) {
    long long sum = a + b;
    if (sum > GRAPH_INF) { return GRAPH_INF; }
    if (sum < -GRAPH_INF) { return -GRAPH_INF; }
    return sum;
}
```

## 6.1 图的基本概念

### 6.1.1 图的定义

#### 顶点、边、有向图与无向图

图 G=(V,E) 由顶点集合 V 和边集合 E 组成。常见教材定义要求 V 非空；程序可额外用 n=0 表示尚未建立或已清空的图，不要把接口空状态当作题目的默认数学定义。

- 无向边用无序对 (u,v) 表示，两端地位相同。
- 有向边称弧，用有序对 ⟨u,v⟩ 表示，u 为弧尾、v 为弧头。
- 带权图又称网，权可表示距离、费用或持续时间；不同场景对权的限制不同。
- 图是多对多关系；顶点可以没有邻接点，也可以被很多不同顶点连接。

#### 简单图、完全图与子图

简单图没有自环和重边；多重图允许平行边等，具体定义以题目为准。

| 对象，n 个顶点 | 最大边或弧数 |
| --- | --- |
| 简单无向图 | n(n-1)/2 |
| 简单有向图 | n(n-1) |
| 简单有向无环图 | n(n-1)/2 |

无向完全图任意两个不同顶点间都有一条边；有向完全图任意两个不同顶点间两个方向的弧都有。DAG 的上界来自选定拓扑次序后，只允许从前到后连接，不是允许每对顶点任意双向连接。

子图 G'=(V',E') 要求 V'⊆V、E'⊆E 且所选边端点都在 V' 中；生成子图保留全部顶点。稀疏、稠密描述边数与顶点数的相对规模，并非所有题目都采用同一个固定阈值。

#### 度、入度、出度与计数公式

| 图类型 | 公式 |
| --- | --- |
| 无向图 | Σdeg(v)=2m |
| 有向图 | Σindeg(v)=Σoutdeg(v)=m |
| 有向图的总度 | deg(v)=indeg(v)+outdeg(v)，总度和为 2m |

无向图奇度顶点数一定为偶数，来自度数和为偶数。本页无自环；若题目允许无向自环，一条自环对该顶点的度贡献 2。

**例：** 6 个顶点度数和为 14，无向边数为 7；同一条件若说的是有向图出度和，弧数就是 14，不应再除以 2。

#### 路径、回路、可达与距离

- 路径按相邻顶点形成序列，有向图必须遵守弧方向。
- 路径长度在无权图中是边数；带权最短路通常比较边权之和。
- 简单路径不重复顶点；简单回路除首尾相同外不重复顶点，术语的细节按题目。
- u 可达 v 表示存在 u 到 v 的路径；有向可达不具有对称性。
- 无权距离是最少边数，带权距离是最小权和；不可达记为 ∞。

若允许重复经过负权回路，路径权可无限下降，不存在有限最短距离。标准最短路算法讨论此情况时需检测负环；不能把“任意最短路一定不重复顶点”无条件用于负环输入。

#### 连通、强连通与连通分量

- 无向图任意两顶点互相可达称连通；极大连通子图称连通分量。
- 有向图任意两顶点互相可达称强连通；极大强连通子图称强连通分量。
- 有向图忽略弧方向后连通称弱连通，不等于强连通。
- “极大”表示不能再加入顶点保持该性质，不是“所有候选中结点数最多”。

无向图连通分量构成顶点划分；有向图强连通分量也构成顶点划分。一个有向 DFS 能到达所有顶点，仅说明所选起点可达全部，不证明任意两点互相可达。

#### 生成树、生成森林与连通边数界

连通无向图的一棵生成树包含全部 n 个顶点、n-1 条边，连通且无环。原图有环时，通过删去部分环上边可得到生成树。

无向图有 c 个连通分量，则生成森林含 n-c 条边。树也是一种无向连通图；对简单无向图，以下任意两项可推出第三项：连通、无环、恰有 n-1 条边。

**易错点：** 仅有 n-1 条边不保证连通或无环。例如 4 个顶点，其中 3 个构成三角形、另 1 个孤立，边数 3，仍不连通。

| 性质 | 必要边数或保证 |
| --- | --- |
| 非空无向连通图 | m≥n-1，但反向不成立 |
| n≥2 的强连通有向图 | m≥n，但反向不成立 |
| n≥2 的简单无向图，m>(n-1)(n-2)/2 | 一定连通 |

最后一行：不连通图最多把 n-1 个顶点做成完全图，另留一个孤立点，达到 (n-1)(n-2)/2 条边。

有向生成树需要另说明根及方向，不直接套无向生成树定义。割点和桥分别指删除后增加无向连通分量数的顶点、边；并非每条生成树边都是原图的桥。

## 6.2 图的存储及基本操作

### 6.2.1 邻接矩阵法

#### 矩阵含义、权与度的计算

邻接矩阵按顶点对记录边是否存在；无向图矩阵对称。有向图行对应出边，列对应入边。

- 无权 0/1 矩阵中，行或列求和可算相应度。
- 带权矩阵中不能直接把权值相加当度，要数存在的边。
- 最短路初始化时 d[i][i]=0 表示零条边的空路径，不等于输入图有自环。
- 矩阵乘幂：对无权邻接矩阵 A，(A^k)[i][j] 统计长为 k 的游走数，可以重复顶点，不是简单路径数；k=0 用单位矩阵。

本页把存在性与权分开，零权、负权都能表示；空间 O(n²)，查一条边 O(1)，扫描一个顶点全部邻居 O(n)。

#### 邻接矩阵的初始化与边操作

```cpp
typedef struct {
    char vex[MAX_GRAPH_V];
    bool edge[MAX_GRAPH_V][MAX_GRAPH_V];
    long long weight[MAX_GRAPH_V][MAX_GRAPH_V];
    int n;
    int m;
    bool directed;
} MGraph;

bool InitMGraph(MGraph *G, int n, bool directed, const char labels[]) {
    if (G == NULL || n < 0 || n > MAX_GRAPH_V ||
        (n > 0 && labels == NULL)) { return false; }
    G->n = n;
    G->m = 0;
    G->directed = directed;
    for (int i = 0; i < MAX_GRAPH_V; ++i) {
        G->vex[i] = i < n ? labels[i] : '\0';
        for (int j = 0; j < MAX_GRAPH_V; ++j) {
            G->edge[i][j] = false;
            G->weight[i][j] = 0;
        }
    }
    return true;
}

bool MatrixVertexValid(const MGraph *G, int v) {
    return G != NULL && v >= 0 && v < G->n;
}

bool AddMatrixEdge(MGraph *G, int u, int v, long long w) {
    if (!MatrixVertexValid(G, u) || !MatrixVertexValid(G, v) ||
        u == v || !ValidEdgeWeight(w) || G->edge[u][v]) { return false; }
    G->edge[u][v] = true;
    G->weight[u][v] = w;
    if (!G->directed) { G->edge[v][u] = true; G->weight[v][u] = w; }
    ++G->m;
    return true;
}

bool DeleteMatrixEdge(MGraph *G, int u, int v) {
    if (!MatrixVertexValid(G, u) || !MatrixVertexValid(G, v) ||
        !G->edge[u][v]) { return false; }
    G->edge[u][v] = false;
    G->weight[u][v] = 0;
    if (!G->directed) { G->edge[v][u] = false; G->weight[v][u] = 0; }
    --G->m;
    return true;
}

bool SetMatrixWeight(MGraph *G, int u, int v, long long w) {
    if (!MatrixVertexValid(G, u) || !MatrixVertexValid(G, v) ||
        !G->edge[u][v] || !ValidEdgeWeight(w)) { return false; }
    G->weight[u][v] = w;
    if (!G->directed) { G->weight[v][u] = w; }
    return true;
}

bool GetMatrixWeight(const MGraph *G, int u, int v, long long *out) {
    if (out == NULL || !MatrixVertexValid(G, u) || !MatrixVertexValid(G, v) ||
        !G->edge[u][v]) { return false; }
    *out = G->weight[u][v];
    return true;
}

int FirstMatrixNeighbor(const MGraph *G, int u) {
    if (!MatrixVertexValid(G, u)) { return -1; }
    for (int v = 0; v < G->n; ++v) {
        if (G->edge[u][v]) { return v; }
    }
    return -1;
}

int NextMatrixNeighbor(const MGraph *G, int u, int after) {
    if (!MatrixVertexValid(G, u) || after < -1 || after >= G->n) { return -1; }
    for (int v = after + 1; v < G->n; ++v) {
        if (G->edge[u][v]) { return v; }
    }
    return -1;
}
```

初始化为演示完整清空固定容量，实际循环为 O(MAX_GRAPH_V²)；若按实际 n 分配并初始化，就是通常的 O(n²)。无向逻辑边只增加一次 m，但需要同时维护两个对称单元。

#### 矩阵顶点新增、改值与删除

```cpp
bool AddMatrixVertex(MGraph *G, char value) {
    if (G == NULL || G->n == MAX_GRAPH_V) { return false; }
    int v = G->n;
    G->vex[v] = value;
    for (int i = 0; i <= v; ++i) {
        G->edge[v][i] = G->edge[i][v] = false;
        G->weight[v][i] = G->weight[i][v] = 0;
    }
    ++G->n;
    return true;
}

bool UpdateMatrixVertex(MGraph *G, int v, char value) {
    if (!MatrixVertexValid(G, v)) { return false; }
    G->vex[v] = value;
    return true;
}

int LocateMatrixVertex(const MGraph *G, char value) {
    if (G == NULL) { return -1; }
    for (int i = 0; i < G->n; ++i) { if (G->vex[i] == value) { return i; } }
    return -1;
}

bool DeleteMatrixVertex(MGraph *G, int v) {
    if (!MatrixVertexValid(G, v)) { return false; }
    int oldN = G->n;
    for (int i = v; i < oldN - 1; ++i) {
        G->vex[i] = G->vex[i + 1];
        for (int j = 0; j < oldN; ++j) {
            G->edge[i][j] = G->edge[i + 1][j];
            G->weight[i][j] = G->weight[i + 1][j];
        }
    }
    for (int i = 0; i < oldN - 1; ++i) {
        for (int j = v; j < oldN - 1; ++j) {
            G->edge[i][j] = G->edge[i][j + 1];
            G->weight[i][j] = G->weight[i][j + 1];
        }
    }
    --G->n;
    G->m = 0;
    for (int i = 0; i < G->n; ++i) {
        for (int j = 0; j < G->n; ++j) {
            if (G->edge[i][j] && (G->directed || i < j)) { ++G->m; }
        }
    }
    return true;
}
```

删除顶点需要删除所有关联边、移去相应行列并重算 m，时间 O(n²)。v 之后的顶点编号减 1；只修改标签不改变结构。按标签查找返回第一个同值顶点。

### 6.2.2 邻接表法

#### 顶点表、边表与逆邻接表

每个顶点保存一条邻接链表；无向图一条边对应两条邻接表项，有向图一条弧通常只在弧尾的出边表中保存一次。

- 无向图各链表长度之和 2m；有向出边表长度之和 m。
- 普通有向邻接表找出边方便；找入边需要扫描所有出边表。
- 逆邻接表改为按弧头组织，找入边方便；不会改变原图的弧方向。
- 空间 O(n+m)，适合稀疏图；找 u→v 通常需扫描 u 的链，不能默认 O(1)。

#### 邻接表的初始化、插边与边查改

```cpp
typedef struct ArcNode {
    int adjvex;
    long long weight;
    struct ArcNode *next;
} ArcNode;

typedef struct {
    char data;
    ArcNode *first;
} ALVertex;

typedef struct {
    ALVertex vertices[MAX_GRAPH_V];
    int n;
    int m;
    bool directed;
} ALGraph;

bool InitALGraph(ALGraph *G, int n, bool directed, const char labels[]) {
    if (G == NULL || n < 0 || n > MAX_GRAPH_V ||
        (n > 0 && labels == NULL)) { return false; }
    G->n = n;
    G->m = 0;
    G->directed = directed;
    for (int i = 0; i < MAX_GRAPH_V; ++i) {
        G->vertices[i].data = i < n ? labels[i] : '\0';
        G->vertices[i].first = NULL;
    }
    return true;
}

bool ALVertexValid(const ALGraph *G, int v) {
    return G != NULL && v >= 0 && v < G->n;
}

ArcNode *FindALArc(const ALGraph *G, int u, int v) {
    if (!ALVertexValid(G, u) || !ALVertexValid(G, v)) { return NULL; }
    for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
        if (p->adjvex == v) { return p; }
    }
    return NULL;
}

ArcNode *NewALArc(int v, long long w) {
    ArcNode *p = (ArcNode *)malloc(sizeof(ArcNode));
    if (p == NULL) { return NULL; }
    p->adjvex = v;
    p->weight = w;
    p->next = NULL;
    return p;
}

void AppendALArc(ALVertex *vertex, ArcNode *p) {
    ArcNode **slot = &vertex->first;
    while (*slot != NULL) { slot = &(*slot)->next; }
    *slot = p;
}

bool AddALEdge(ALGraph *G, int u, int v, long long w) {
    if (!ALVertexValid(G, u) || !ALVertexValid(G, v) || u == v ||
        !ValidEdgeWeight(w) || FindALArc(G, u, v) != NULL) { return false; }
    ArcNode *a = NewALArc(v, w);
    if (a == NULL) { return false; }
    ArcNode *b = NULL;
    if (!G->directed) {
        b = NewALArc(u, w);
        if (b == NULL) { free(a); return false; }
    }
    AppendALArc(&G->vertices[u], a);
    if (b != NULL) { AppendALArc(&G->vertices[v], b); }
    ++G->m;
    return true;
}

bool SetALWeight(ALGraph *G, int u, int v, long long w) {
    if (!ValidEdgeWeight(w)) { return false; }
    ArcNode *a = FindALArc(G, u, v);
    if (a == NULL) { return false; }
    a->weight = w;
    if (!G->directed) { FindALArc(G, v, u)->weight = w; }
    return true;
}

bool GetALWeight(const ALGraph *G, int u, int v, long long *out) {
    if (out == NULL) { return false; }
    ArcNode *p = FindALArc(G, u, v);
    if (p == NULL) { return false; }
    *out = p->weight;
    return true;
}
```

本页尾插保留输入边的链表顺序，插入含查重和尾部定位，不能把整段函数说成 O(1)。采用头插且已保证无重复时，单次链接才可为 O(1)。无向两表项先申请成功再链接，防止只插入半条边。

#### 邻接表删除与资源释放

```cpp
// 内部：删除指定链中的一个表项，不修改逻辑边计数。
void RemoveOneALArc(ALGraph *G, int u, int v) {
    ArcNode **slot = &G->vertices[u].first;
    while (*slot != NULL && (*slot)->adjvex != v) {
        slot = &(*slot)->next;
    }
    if (*slot != NULL) {
        ArcNode *p = *slot;
        *slot = p->next;
        free(p);
    }
}

bool DeleteALEdge(ALGraph *G, int u, int v) {
    if (FindALArc(G, u, v) == NULL) { return false; }
    RemoveOneALArc(G, u, v);
    if (!G->directed) { RemoveOneALArc(G, v, u); }
    --G->m;
    return true;
}

void ClearALGraph(ALGraph *G) {
    for (int i = 0; i < G->n; ++i) {
        ArcNode *p = G->vertices[i].first;
        while (p != NULL) {
            ArcNode *next = p->next;
            free(p);
            p = next;
        }
        G->vertices[i].first = NULL;
    }
    G->n = 0;
    G->m = 0;
}

bool AddALVertex(ALGraph *G, char value) {
    if (G == NULL || G->n == MAX_GRAPH_V) { return false; }
    G->vertices[G->n].data = value;
    G->vertices[G->n].first = NULL;
    ++G->n;
    return true;
}

bool DeleteALVertex(ALGraph *G, int v) {
    if (!ALVertexValid(G, v)) { return false; }
    ArcNode *p = G->vertices[v].first;
    while (p != NULL) { ArcNode *next = p->next; free(p); p = next; }
    G->vertices[v].first = NULL;
    for (int u = 0; u < G->n; ++u) {
        if (u == v) { continue; }
        ArcNode **slot = &G->vertices[u].first;
        while (*slot != NULL) {
            ArcNode *a = *slot;
            if (a->adjvex == v) {
                *slot = a->next;
                free(a);
            } else {
                if (a->adjvex > v) { --a->adjvex; }
                slot = &a->next;
            }
        }
    }
    for (int u = v; u < G->n - 1; ++u) { G->vertices[u] = G->vertices[u + 1]; }
    --G->n;
    G->vertices[G->n].first = NULL;
    int entries = 0;
    for (int u = 0; u < G->n; ++u) {
        for (ArcNode *a = G->vertices[u].first; a != NULL; a = a->next) {
            ++entries;
        }
    }
    G->m = G->directed ? entries : entries / 2;
    return true;
}
```

清空 O(n+m)，删除顶点扫描并修改所有表项也为 O(n+m)。无向邻接表的两表项是**两块独立内存**，都要释放；这与后面的邻接多重表共享一个边结点不同。

### 6.2.3 十字链表

#### 一条有向弧同时属于出边链和入边链

十字链表用于有向图，每条弧只建一个结点，保存：tailvex（弧尾）、headvex（弧头）、tlink（同弧尾下一条出弧）、hlink（同弧头下一条入弧）。顶点记录 firstout 与 firstin。

查顶点出度沿 tlink，查入度沿 hlink；不能从 firstin 出发却一直用 tlink。空间 O(n+m)，入出边查询均方便。

#### 十字链表的插弧、删弧与释放

```cpp
typedef struct OArc {
    int tailvex;
    int headvex;
    long long weight;
    struct OArc *tlink;
    struct OArc *hlink;
} OArc;

typedef struct {
    char data;
    OArc *firstin;
    OArc *firstout;
} OVertex;

typedef struct {
    OVertex vertices[MAX_GRAPH_V];
    int n;
    int m;
} OLGraph;

bool InitOLGraph(OLGraph *G, int n, const char labels[]) {
    if (G == NULL || n < 0 || n > MAX_GRAPH_V ||
        (n > 0 && labels == NULL)) { return false; }
    G->n = n;
    G->m = 0;
    for (int i = 0; i < MAX_GRAPH_V; ++i) {
        G->vertices[i].data = i < n ? labels[i] : '\0';
        G->vertices[i].firstin = G->vertices[i].firstout = NULL;
    }
    return true;
}

OArc *FindOLArc(const OLGraph *G, int u, int v) {
    if (G == NULL || u < 0 || v < 0 || u >= G->n || v >= G->n) { return NULL; }
    for (OArc *p = G->vertices[u].firstout; p != NULL; p = p->tlink) {
        if (p->headvex == v) { return p; }
    }
    return NULL;
}

bool AddOLArc(OLGraph *G, int u, int v, long long w) {
    if (G == NULL || u < 0 || v < 0 || u >= G->n || v >= G->n ||
        u == v || !ValidEdgeWeight(w) || FindOLArc(G, u, v) != NULL) {
        return false;
    }
    OArc *p = (OArc *)malloc(sizeof(OArc));
    if (p == NULL) { return false; }
    p->tailvex = u;
    p->headvex = v;
    p->weight = w;
    p->tlink = G->vertices[u].firstout;
    p->hlink = G->vertices[v].firstin;
    G->vertices[u].firstout = G->vertices[v].firstin = p;
    ++G->m;
    return true;
}

bool DeleteOLArc(OLGraph *G, int u, int v) {
    OArc *p = FindOLArc(G, u, v);
    if (p == NULL) { return false; }
    OArc **outSlot = &G->vertices[u].firstout;
    while (*outSlot != p) { outSlot = &(*outSlot)->tlink; }
    OArc **inSlot = &G->vertices[v].firstin;
    while (*inSlot != p) { inSlot = &(*inSlot)->hlink; }
    *outSlot = p->tlink;
    *inSlot = p->hlink;
    free(p);
    --G->m;
    return true;
}

void ClearOLGraph(OLGraph *G) {
    // 每条弧只会出现在一个顶点的出弧链中，按出弧链释放一次。
    for (int u = 0; u < G->n; ++u) {
        OArc *p = G->vertices[u].firstout;
        while (p != NULL) { OArc *next = p->tlink; free(p); p = next; }
        G->vertices[u].firstout = G->vertices[u].firstin = NULL;
    }
    G->n = G->m = 0;
}
```

删除前分别定位两条链中指向该弧的链接槽，再摘链并释放一次。代码以结构合法为前提，同一弧必须同时出现在对应的入链和出链中。

**易错点：** 清空时若把所有入链和出链各释放一遍，一条弧会释放两次。查到 OArc 后改 weight，会自然反映在入出两条链，因为它们共享同一个弧对象。

### 6.2.4 邻接多重表

#### 无向边结点由两个端点共享

邻接多重表用于无向图，一条边一个结点，保存两端 ivex、jvex，以及各端点关联链中的下一条边 ilink、jlink；可另设 mark 表示是否已处理。

沿顶点 v 的边链前进时：若 v==ivex 就走 ilink，否则走 jlink。另一个端点也是按这条条件确定，不能永远只读 jvex。

“多重表”是存储结构名，不表示代码一定允许重边；本页仍表示简单无向图。

#### 邻接多重表的边操作与释放

```cpp
typedef struct MLEdge {
    int ivex;
    int jvex;
    long long weight;
    bool mark;
    struct MLEdge *ilink;
    struct MLEdge *jlink;
} MLEdge;

typedef struct {
    char data;
    MLEdge *first;
} MLVertex;

typedef struct {
    MLVertex vertices[MAX_GRAPH_V];
    int n;
    int m;
} AMLGraph;

bool InitAMLGraph(AMLGraph *G, int n, const char labels[]) {
    if (G == NULL || n < 0 || n > MAX_GRAPH_V ||
        (n > 0 && labels == NULL)) { return false; }
    G->n = n;
    G->m = 0;
    for (int i = 0; i < MAX_GRAPH_V; ++i) {
        G->vertices[i].data = i < n ? labels[i] : '\0';
        G->vertices[i].first = NULL;
    }
    return true;
}

MLEdge *NextIncident(MLEdge *p, int v) {
    return p->ivex == v ? p->ilink : p->jlink;
}

int OtherEndpoint(const MLEdge *p, int v) {
    return p->ivex == v ? p->jvex : p->ivex;
}

MLEdge *FindMLEdge(const AMLGraph *G, int u, int v) {
    if (G == NULL || u < 0 || v < 0 || u >= G->n || v >= G->n) { return NULL; }
    for (MLEdge *p = G->vertices[u].first; p != NULL; p = NextIncident(p, u)) {
        if (OtherEndpoint(p, u) == v) { return p; }
    }
    return NULL;
}

bool AddMLEdge(AMLGraph *G, int u, int v, long long w) {
    if (G == NULL || u < 0 || v < 0 || u >= G->n || v >= G->n ||
        u == v || !ValidEdgeWeight(w) || FindMLEdge(G, u, v) != NULL) {
        return false;
    }
    MLEdge *p = (MLEdge *)malloc(sizeof(MLEdge));
    if (p == NULL) { return false; }
    p->ivex = u;
    p->jvex = v;
    p->weight = w;
    p->mark = false;
    p->ilink = G->vertices[u].first;
    p->jlink = G->vertices[v].first;
    G->vertices[u].first = G->vertices[v].first = p;
    ++G->m;
    return true;
}

MLEdge **FindIncidentSlot(AMLGraph *G, int v, MLEdge *target) {
    MLEdge **slot = &G->vertices[v].first;
    while (*slot != NULL && *slot != target) {
        MLEdge *p = *slot;
        slot = p->ivex == v ? &p->ilink : &p->jlink;
    }
    return *slot == target ? slot : NULL;
}

bool DeleteMLEdge(AMLGraph *G, int u, int v) {
    MLEdge *p = FindMLEdge(G, u, v);
    if (p == NULL) { return false; }
    MLEdge **a = FindIncidentSlot(G, u, p);
    MLEdge **b = FindIncidentSlot(G, v, p);
    if (a == NULL || b == NULL) { return false; }
    *a = NextIncident(p, u);
    *b = NextIncident(p, v);
    free(p);
    --G->m;
    return true;
}

void ClearAMLGraph(AMLGraph *G) {
    MLEdge *owned[MAX_UNDIRECTED_EDGES];
    int count = 0;
    // 先遍历所有链，尚不释放；以 ivex 对应的端点收集一次。
    for (int v = 0; v < G->n; ++v) {
        for (MLEdge *p = G->vertices[v].first; p != NULL; p = NextIncident(p, v)) {
            if (p->ivex == v) { owned[count++] = p; }
        }
        G->vertices[v].first = NULL;
    }
    for (int i = 0; i < count; ++i) { free(owned[i]); }
    G->n = G->m = 0;
}
```

清空先收集、再释放，避免另一端点的链仍指向已释放边；时间 O(n+m)，额外暂存 O(m) 个指针，代码预留简单无向图的最大边容量。

**易错点：** m 个边结点会在顶点关联链中被访问 2m 次，但只有 m 块边内存；不能按链出现次数释放。

### 6.2.5 图的基本操作

#### 操作接口与存储结构的关系

| 抽象操作 | 本页对应实现或含义 |
| --- | --- |
| Adjacent(G,u,v) | 检查 edge[u][v] 或 FindALArc 是否存在 |
| Neighbors(G,u) | 枚举出邻接点；无向图为所有邻接点 |
| InsertVertex / DeleteVertex | 新增顶点；删顶点和所有关联边 |
| AddEdge / RemoveEdge | 新增或删除一条逻辑边，维护 m |
| GetVertex / SetVertex | 按编号读或修改显示值，不改变边 |
| FirstNeighbor / NextNeighbor | 返回首邻居或下一个邻居，无则 -1 |
| GetEdgeValue / SetEdgeValue | 读写已存在边权，不把“改权”偷偷变成“插边” |

邻接表可以直接沿链枚举邻居。若接口返回邻居编号，再次调用 NextNeighbor 时从链头重新查当前位置，会额外增加扫描成本；实现 BFS/DFS 时本页直接保存或使用边表游标。

#### 度计算与邻接表顶点读写

```cpp
int ALOutDegree(const ALGraph *G, int u) {
    if (!ALVertexValid(G, u)) { return -1; }
    int count = 0;
    for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) { ++count; }
    return count;
}

int ALInDegree(const ALGraph *G, int v) {
    if (!ALVertexValid(G, v)) { return -1; }
    if (!G->directed) { return ALOutDegree(G, v); }
    int count = 0;
    for (int u = 0; u < G->n; ++u) {
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            if (p->adjvex == v) { ++count; }
        }
    }
    return count;
}

bool GetALVertex(const ALGraph *G, int v, char *out) {
    if (!ALVertexValid(G, v) || out == NULL) { return false; }
    *out = G->vertices[v].data;
    return true;
}

bool SetALVertex(ALGraph *G, int v, char value) {
    if (!ALVertexValid(G, v)) { return false; }
    G->vertices[v].data = value;
    return true;
}
```

有向邻接表计算一个顶点入度通常 O(n+m)，出度按链长；无向图入出度术语不分，本接口返回普通度。

#### 邻接矩阵与邻接表的转换

```cpp
// out 要是已初始化的空邻接表，n=0，尚未拥有边结点。
bool MatrixToAL(const MGraph *G, ALGraph *out) {
    if (G == NULL || out == NULL || out->n != 0) { return false; }
    ALGraph temp;
    InitALGraph(&temp, G->n, G->directed, G->vex);
    for (int u = 0; u < G->n; ++u) {
        for (int v = 0; v < G->n; ++v) {
            if (G->edge[u][v] && (G->directed || u < v)) {
                if (!AddALEdge(&temp, u, v, G->weight[u][v])) {
                    ClearALGraph(&temp);
                    return false;
                }
            }
        }
    }
    *out = temp;
    return true;
}

bool ALToMatrix(const ALGraph *G, MGraph *out) {
    if (G == NULL || out == NULL) { return false; }
    char labels[MAX_GRAPH_V];
    for (int i = 0; i < G->n; ++i) { labels[i] = G->vertices[i].data; }
    MGraph temp;
    InitMGraph(&temp, G->n, G->directed, labels);
    for (int u = 0; u < G->n; ++u) {
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            if (G->directed || u < p->adjvex) {
                if (!AddMatrixEdge(&temp, u, p->adjvex, p->weight)) { return false; }
            }
        }
    }
    *out = temp;
    return true;
}
```

矩阵需要扫描顶点对；表转矩阵需要清矩阵并扫描表项。MatrixToAL 为复用带查重、尾插的函数，额外有链定位成本，最坏可到 O(n²+nm)；若已知输入无重复，给各链维护尾指针直接建表，可做到 O(n²+m)。

只转换存储不改变顶点、权和有向性；不同邻接次序可能改变 DFS/BFS 次序，不改变连通关系或正确最短距离。

#### 四种存储结构的比较

| 结构 | 常用图类型 | 边结点或单元 | 适合操作 |
| --- | --- | --- | --- |
| 邻接矩阵 | 有向或无向，尤其稠密 | n² 个位置，无向对称 | O(1) 查边，矩阵式算法 |
| 邻接表 | 有向或无向，尤其稀疏 | 有向 m 个、无向 2m 个表项 | 顺序枚举出边/邻边，遍历 |
| 十字链表 | 有向 | 每弧一个对象，入出两链共享 | 同时查入弧、出弧 |
| 邻接多重表 | 无向 | 每边一个对象，两端共享 | 从任一端找关联边，共享边标志与信息 |

两个共享结构删除前都要摘除两处链接；修改共享对象权值只改一次。各结构能表示的图类型取决于字段与约定，而不是“链式结构都一样”。

## 6.3 图的遍历

### 6.3.1 广度优先搜索

#### BFS的队列、访问标记与最短层次

BFS 从起点出发，先访问距起点一条边的顶点，再访问两条边的顶点，按最少边数逐层扩展，使用先进先出队列。

**关键规则：** 顶点第一次发现、准备入队时就标记已访问，不能等出队才标记；否则多个前驱可能重复把它入队，破坏队列容量和单次处理保证。

在无权图或各边等权非负的图中，BFS 的发现层次就是最短边数距离。若边权不同，BFS 不保证权和最小。

#### 邻接表BFS与遍历整个图

```cpp
void BFSComponentAL(const ALGraph *G, int s, bool visited[],
                      int parent[], int distance[], int order[], int *count) {
    int queue[MAX_GRAPH_V];
    int front = 0;
    int rear = 0;
    visited[s] = true;
    parent[s] = -1;
    distance[s] = 0;
    queue[rear++] = s;
    while (front < rear) {
        int u = queue[front++];
        order[(*count)++] = u;
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            int v = p->adjvex;
            if (!visited[v]) {
                visited[v] = true;
                parent[v] = u;
                distance[v] = distance[u] + 1;
                queue[rear++] = v;
            }
        }
    }
}

bool BFSFromAL(const ALGraph *G, int s, int distance[],
                 int parent[], int order[], int *count) {
    if (!ALVertexValid(G, s) || distance == NULL || parent == NULL ||
        order == NULL || count == NULL) { return false; }
    bool visited[MAX_GRAPH_V] = { false };
    *count = 0;
    for (int i = 0; i < G->n; ++i) { distance[i] = parent[i] = -1; }
    BFSComponentAL(G, s, visited, parent, distance, order, count);
    return true;
}

// 返回发起 BFS 的根数；无向图中就是连通分量数，错误返回 -1。
int BFSTraverseAL(const ALGraph *G, int parent[], int distance[], int order[]) {
    if (G == NULL || parent == NULL || distance == NULL || order == NULL) {
        return -1;
    }
    bool visited[MAX_GRAPH_V] = { false };
    int count = 0;
    int roots = 0;
    for (int i = 0; i < G->n; ++i) { parent[i] = distance[i] = -1; }
    for (int s = 0; s < G->n; ++s) {
        if (!visited[s]) {
            ++roots;
            BFSComponentAL(G, s, visited, parent, distance, order, &count);
        }
    }
    return roots;
}
```

每个顶点至多入队一次，rear 不超过 n，因此固定 100 个队列单元足够。本组输出数组容量至少 n；order 是编号访问序列，读取标签时再查 vertices[编号].data。

BFSFromAL 的 distance=-1 表示起点不可达；全图遍历的 distance 则是到**各自遍历树根**的距离，不是到某一个公共起点的距离。

#### 邻接矩阵BFS与复杂度

```cpp
bool BFSFromMatrix(const MGraph *G, int s, int distance[], int parent[]) {
    if (!MatrixVertexValid(G, s) || distance == NULL || parent == NULL) {
        return false;
    }
    int queue[MAX_GRAPH_V];
    int front = 0;
    int rear = 0;
    for (int i = 0; i < G->n; ++i) { distance[i] = parent[i] = -1; }
    distance[s] = 0;
    queue[rear++] = s;
    while (front < rear) {
        int u = queue[front++];
        for (int v = 0; v < G->n; ++v) {
            if (G->edge[u][v] && distance[v] == -1) {
                distance[v] = distance[u] + 1;
                parent[v] = u;
                queue[rear++] = v;
            }
        }
    }
    return true;
}
```

全图 BFS：邻接表 O(n+m)，邻接矩阵 O(n²)；队列与访问数组需要 O(n) 空间。即使矩阵只有很少边，也要扫描相应行的 n 个位置。

#### BFS统一例子与父结点路径恢复

无向无权图顶点 A..F，边为 AB、AC、BD、BE、CE、DF、EF，邻接点按编号升序访问。

| 出队顶点 | 新发现顶点 | 此后队列 |
| --- | --- | --- |
| A | B、C | B，C |
| B | D、E | C，D，E |
| C | 无，E 已入队 | D，E |
| D | F | E，F |
| E | 无，F 已入队 | F |
| F | 无 | 空 |

访问 ABCDEF，distance=[0,1,1,2,2,3]，parent=[-1,A,A,B,B,D]。到 F 的一条最短路径是 A→B→D→F；A→B→E→F 或 A→C→E→F 也长 3，算法按发现顺序保存其中一条。

```cpp
// 可复用于 BFS、Dijkstra 等 parent 结果；必须最终回溯到指定源 s。
bool BuildParentPath(int n, int s, int t, const int parent[],
                      int path[], int capacity, int *length) {
    if (n < 1 || n > MAX_GRAPH_V || s < 0 || t < 0 || s >= n || t >= n ||
        parent == NULL || path == NULL || length == NULL) { return false; }
    int reversed[MAX_GRAPH_V];
    int count = 0;
    int v = t;
    while (v != -1 && count < n) {
        if (v < 0 || v >= n) { return false; }
        reversed[count++] = v;
        if (v == s) { break; }
        v = parent[v];
    }
    if (count == 0 || reversed[count - 1] != s || capacity < count) {
        return false;
    }
    for (int i = 0; i < count; ++i) { path[i] = reversed[count - i - 1]; }
    *length = count;
    return true;
}
```

parent[t]=-1 不一定表示不可达：t 就是源时也为 -1，要结合源编号或 distance。不同最短路径可能具有相同距离而不同 parent。

### 6.3.2 深度优先搜索

#### DFS的递归、回溯与全图遍历

DFS 沿一个未访问邻居深入，直到没有可继续的顶点，再回溯寻找其他分支。进入顶点时立即标记 visited，避免沿环无限递归。

```cpp
void DFSVisitAL(const ALGraph *G, int u, bool visited[],
                  int parent[], int order[], int *count) {
    visited[u] = true;
    order[(*count)++] = u;
    for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
        int v = p->adjvex;
        if (!visited[v]) {
            parent[v] = u;
            DFSVisitAL(G, v, visited, parent, order, count);
        }
    }
}

int DFSTraverseAL(const ALGraph *G, int parent[], int order[]) {
    if (G == NULL || parent == NULL || order == NULL) { return -1; }
    bool visited[MAX_GRAPH_V] = { false };
    int count = 0;
    int roots = 0;
    for (int i = 0; i < G->n; ++i) { parent[i] = -1; }
    for (int u = 0; u < G->n; ++u) {
        if (!visited[u]) {
            ++roots;
            DFSVisitAL(G, u, visited, parent, order, &count);
        }
    }
    return roots;
}
```

外层枚举未访问顶点才能覆盖非连通图。visited 必须在整次遍历中共享，不能每递归到一个结点就清空。

#### 显式栈模拟递归DFS

```cpp
typedef struct {
    int vertex;
    ArcNode *next;
} DFSFrame;

// 从 s 出发；保存下一条待检查的弧，顺序与递归版本一致。
bool DFSFromIterAL(const ALGraph *G, int s, int parent[],
                     int order[], int *count) {
    if (!ALVertexValid(G, s) || parent == NULL || order == NULL ||
        count == NULL) { return false; }
    bool visited[MAX_GRAPH_V] = { false };
    DFSFrame stack[MAX_GRAPH_V];
    int top = 0;
    for (int i = 0; i < G->n; ++i) { parent[i] = -1; }
    *count = 0;
    visited[s] = true;
    order[(*count)++] = s;
    stack[top].vertex = s;
    stack[top++].next = G->vertices[s].first;
    while (top > 0) {
        DFSFrame *frame = &stack[top - 1];
        ArcNode *p = frame->next;
        while (p != NULL && visited[p->adjvex]) { p = p->next; }
        if (p == NULL) {
            --top;
        } else {
            frame->next = p->next;
            int v = p->adjvex;
            parent[v] = frame->vertex;
            visited[v] = true;
            order[(*count)++] = v;
            stack[top].vertex = v;
            stack[top++].next = G->vertices[v].first;
        }
    }
    return true;
}
```

每层栈帧保留当前顶点和接下来要扫描的边，回溯后从原位置继续。简单地“把所有邻居一次入栈”可能产生不同的发现次序和遍历树，不应直接声称完全模拟递归。

#### DFS例子、复杂度与路径限制

沿前面的无权图、邻居升序，从 A 开始：

```text
A → B → D → F → E → C
```

访问 ABDFEC；到 C 的发现路径 A→B→D→F→E→C 长 5，而真正最短边数是 1（AC）。DFS 能找可达路径，**一般不能保证最短**。

邻接表全图 DFS O(n+m)，邻接矩阵 O(n²)；visited 与递归/显式栈最坏 O(n)。递归栈深是 DFS 树深，不能统一假设为 O(log n)。

### 6.3.3 图的遍历与图的连通性

#### 遍历树、遍历森林与无向连通分量

每个新发现顶点记录一条父边，就得到 BFS 或 DFS 的生成树/森林。

- 连通无向图：从任意起点一次遍历覆盖全部顶点，发现边 n-1 条。
- 非连通无向图：外层发起次数等于连通分量数 c，森林发现边 n-c 条。
- 原图可能有非发现边；遍历树只是保留发现关系，并不等于原图本身。

无向图直接使用 DFSTraverseAL 或 BFSTraverseAL 的根数统计连通分量，包括孤立顶点。

#### 有向图不能用遍历根数代替强连通分量数

例：只有 A→B。从 A 开始 DFS 一次即可访问两个顶点，但强连通分量有 {A}、{B} 两个；从 B 开始全图遍历又可能需要两个根。

正确强连通判定可检查：某个顶点在原图可达所有顶点，并且在反向图也可达所有顶点。计算所有强连通分量通常使用专门算法，不能把无向图计数方法直接照搬。

下面给出更直观的逐源可达性判定，便于复习条件；它不是线性时间的强连通分量算法。

```cpp
bool IsStronglyConnectedSimple(const ALGraph *G) {
    if (G == NULL || !G->directed || G->n == 0) { return false; }
    int distance[MAX_GRAPH_V];
    int parent[MAX_GRAPH_V];
    int order[MAX_GRAPH_V];
    int count;
    for (int s = 0; s < G->n; ++s) {
        BFSFromAL(G, s, distance, parent, order, &count);
        if (count != G->n) { return false; }
    }
    return true;
}
```

时间 O(n(n+m))、辅助数组 O(n)。单顶点无弧图按零长路径约定是强连通的，本函数返回 true。

#### DFS判环中的有向与无向区别

有向 DFS 用三色状态：0 未发现，1 当前递归路径中，2 已完成。遇到指向状态 1 的边才证明有向环；指向已完成顶点的边不一定有环。

无向图一条边保存两次，发现父子边后沿反向看到双亲不是新环，应跳过父顶点；遇到已访问、非双亲的邻点才说明有环。本规则以无重边为前提。

```cpp
bool DirectedCycleVisit(const ALGraph *G, int u, int state[]) {
    state[u] = 1;
    for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
        int v = p->adjvex;
        if (state[v] == 1) { return true; }
        if (state[v] == 0 && DirectedCycleVisit(G, v, state)) { return true; }
    }
    state[u] = 2;
    return false;
}

bool CheckDirectedCycle(const ALGraph *G, bool *hasCycle) {
    if (G == NULL || !G->directed || hasCycle == NULL) { return false; }
    int state[MAX_GRAPH_V] = { 0 };
    for (int u = 0; u < G->n; ++u) {
        if (state[u] == 0 && DirectedCycleVisit(G, u, state)) {
            *hasCycle = true;
            return true;
        }
    }
    *hasCycle = false;
    return true;
}
```

**易错点：** “遇到 visited 顶点就有环”对有向图不成立；“有向 DFS 根数就是连通分量数”也不成立。

## 6.4 图的应用

### 6.4.1 最小生成树

#### 最小生成树的任务与适用条件

连通无向带权图中，找一棵包含全部顶点、总边权最小的生成树，称最小生成树 MST。它有 n-1 条边，目标是整棵树的总权最小。

- 不连通图不存在覆盖全部顶点的生成树，可以求最小生成森林。
- 允许负权、零权；负权不会使 Prim/Kruskal 的贪心原则失效，因为生成树没有回路。
- 一般有向图不能直接用本章 Prim/Kruskal 求有向生成树。
- 所有边权各不相同可保证 MST 唯一；有相同权不必然不唯一。
- MST 不保证从某个源到每个顶点的树上路径都是最短路。

**区分例：** 三角形 AB=2、AC=2、BC=1。MST 可选 AB、BC，总权 3；从 A 出发的最短路径树选 AB、AC，总权 4，但到 B、C 都是 2。两类目标不同。

#### 割性质、环性质与贪心依据

把顶点分为两个非空集合，连接两侧的边是跨割边。若已选边可扩展成 MST，且没有已选边跨过该割，则一条最轻跨割边可安全加入并保持可扩展性；若它是这个割的唯一最轻边，则属于所有 MST。

一个回路中，若某边是唯一最重边，它不属于任何 MST；若最重权有并列，不能说所有并列最重边都必然不在 MST。

Prim 每次跨“已加入顶点 / 未加入顶点”的割选最轻边；Kruskal 逐边把不同连通集合合并。都不允许选边后产生环。

#### Prim的数组含义与函数

key[v] 表示把未选顶点 v 接到当前树上的最小**单条边权**；parent[v] 是对应已选端点。它不是从起点到 v 的累计距离。

```cpp
// -1 参数无效；0 不连通（输出只含当前可达部分）；1 成功。
int PrimMST(const MGraph *G, int start, int parent[],
              long long chosenWeight[], long long *total) {
    if (!MatrixVertexValid(G, start) || G->directed || parent == NULL ||
        chosenWeight == NULL || total == NULL) { return -1; }
    bool inTree[MAX_GRAPH_V] = { false };
    long long key[MAX_GRAPH_V];
    for (int v = 0; v < G->n; ++v) {
        key[v] = GRAPH_INF;
        parent[v] = -1;
        chosenWeight[v] = GRAPH_INF;
    }
    key[start] = 0;
    *total = 0;
    for (int k = 0; k < G->n; ++k) {
        int u = -1;
        for (int v = 0; v < G->n; ++v) {
            if (!inTree[v] && (u == -1 || key[v] < key[u])) { u = v; }
        }
        if (u == -1 || key[u] == GRAPH_INF) { return 0; }
        inTree[u] = true;
        chosenWeight[u] = key[u];
        *total += key[u]; // 根的 key=0，不对应真实边。
        for (int v = 0; v < G->n; ++v) {
            if (!inTree[v] && G->edge[u][v] && G->weight[u][v] < key[v]) {
                key[v] = G->weight[u][v];
                parent[v] = u;
            }
        }
    }
    return 1;
}
```

独立 inTree 标记能正确处理零权和负权；不能用 key[v]==0 代替“已加入”。选择顶点和更新各扫描 n，矩阵版 O(n²)，辅助数组 O(n)。邻接表配最小堆可做 O((n+m)log n)。

#### Kruskal的边排序、并查集与函数

边按权非降序检查：两端根不同才接受，根相同则会形成环，跳过。接受 n-1 条边后完成。

```cpp
typedef struct {
    int u;
    int v;
    long long weight;
} GraphEdge;

int CompareGraphEdges(const void *a, const void *b) {
    const GraphEdge *x = (const GraphEdge *)a;
    const GraphEdge *y = (const GraphEdge *)b;
    if (x->weight < y->weight) { return -1; }
    if (x->weight > y->weight) { return 1; }
    if (x->u != y->u) { return x->u < y->u ? -1 : 1; }
    if (x->v != y->v) { return x->v < y->v ? -1 : 1; }
    return 0;
}

int GraphFindRoot(int parent[], int x) {
    int root = x;
    while (parent[root] >= 0) { root = parent[root]; }
    while (x != root) {
        int next = parent[x];
        parent[x] = root;
        x = next;
    }
    return root;
}

bool GraphUnion(int parent[], int u, int v) {
    int ru = GraphFindRoot(parent, u);
    int rv = GraphFindRoot(parent, v);
    if (ru == rv) { return false; }
    if (parent[ru] > parent[rv]) { int temp = ru; ru = rv; rv = temp; }
    parent[ru] += parent[rv];
    parent[rv] = ru;
    return true;
}

// selected 容量至少 n-1；0 时输出最小生成森林，1 为 MST。
// -1 参数无效。空图按接口要求不求 MST，单顶点成功、总权0。
int KruskalMST(const MGraph *G, GraphEdge selected[],
                 int *count, long long *total) {
    if (G == NULL || G->directed || G->n < 1 || selected == NULL ||
        count == NULL || total == NULL) { return -1; }
    GraphEdge edges[MAX_UNDIRECTED_EDGES];
    int m = 0;
    for (int u = 0; u < G->n; ++u) {
        for (int v = u + 1; v < G->n; ++v) {
            if (G->edge[u][v]) {
                edges[m].u = u;
                edges[m].v = v;
                edges[m++].weight = G->weight[u][v];
            }
        }
    }
    qsort(edges, (size_t)m, sizeof(GraphEdge), CompareGraphEdges);
    int parent[MAX_GRAPH_V];
    for (int v = 0; v < G->n; ++v) { parent[v] = -1; }
    *count = 0;
    *total = 0;
    for (int i = 0; i < m && *count < G->n - 1; ++i) {
        if (GraphUnion(parent, edges[i].u, edges[i].v)) {
            selected[(*count)++] = edges[i];
            *total += edges[i].weight;
        }
    }
    return *count == G->n - 1 ? 1 : 0;
}
```

比较器不把 long long 权差强转 int，避免溢出破坏排序。无向矩阵只提取 u<v 的上三角，每条边一次。

已有边集时，常写 Kruskal O(m log m)，并查集摊还操作较小；本函数先从矩阵提边，完整时间 O(n²+m log m)，工作边数组 O(m) 的逻辑规模。

#### Prim与Kruskal的逐步例子

本节及 Dijkstra 共用无向带权图 A..F：

| 边 | AB | AC | BC | BD | CD | CE | DE | DF | EF |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 权 | 4 | 2 | 1 | 5 | 8 | 10 | 2 | 6 | 3 |

Prim 从 A：

| 新顶点 | 加入边 | 本次权 | 当前总权 |
| --- | --- | --- | --- |
| A | 根，无边 | 0 | 0 |
| C | AC | 2 | 2 |
| B | CB | 1 | 3 |
| D | BD | 5 | 8 |
| E | DE | 2 | 10 |
| F | EF | 3 | 13 |

Kruskal 依次接受 BC(1)、AC(2)、DE(2)、EF(3)；AB(4) 两端已在同集合，跳过；接受 BD(5)，总权 13，已有 5 条边完成。

Prim 的下一次边权可以小于上一次，因为新顶点会带来新的跨割边；Kruskal 处理的全局边权按排序不下降。不同起点、同权处理或算法可能得到不同 MST，但最小总权相同。

### 6.4.2 最短路径

#### 单源、各顶点对与算法选择

| 任务或权条件 | 常用方法 | 关键限制 |
| --- | --- | --- |
| 无权图最少边数 | BFS | 不按不同边权优化 |
| 单源、全部边权非负 | Dijkstra | 一般负权输入不能保证正确 |
| 所有顶点对，可有负权边 | Floyd | 受负环影响的顶点对不存在有限最短距离 |
| DAG 的单源路径 | 拓扑次序松弛 | 无环，可以按依赖一次处理，允许负边 |

一般单源负权图可使用 Bellman-Ford 等方法，作为扩展认识；本章主体实现 BFS、Dijkstra、Floyd，并用 DAG 说明拓扑应用。

**松弛：** 若已经知道 s→u 的距离估计，把 u→v 接上，比较 `dist[u]+w(u,v)` 是否比 dist[v] 更小；只有 dist[u] 可达时才能计算。

#### Dijkstra的确定集合与函数

每轮从未确定顶点中选 dist 最小者，将其最短距离确定，再松弛其出边。非负边保证以后经过更远的未确定点，不能反而使它更短。

```cpp
bool DijkstraMatrix(const MGraph *G, int s, long long dist[], int parent[]) {
    if (!MatrixVertexValid(G, s) || dist == NULL || parent == NULL) {
        return false;
    }
    for (int u = 0; u < G->n; ++u) {
        for (int v = 0; v < G->n; ++v) {
            if (G->edge[u][v] && G->weight[u][v] < 0) { return false; }
        }
    }
    bool settled[MAX_GRAPH_V] = { false };
    for (int v = 0; v < G->n; ++v) { dist[v] = GRAPH_INF; parent[v] = -1; }
    dist[s] = 0;
    for (int k = 0; k < G->n; ++k) {
        int u = -1;
        for (int v = 0; v < G->n; ++v) {
            if (!settled[v] && (u == -1 || dist[v] < dist[u])) { u = v; }
        }
        if (u == -1 || dist[u] == GRAPH_INF) { break; }
        settled[u] = true;
        for (int v = 0; v < G->n; ++v) {
            if (!settled[v] && G->edge[u][v]) {
                long long candidate = AddDistance(dist[u], G->weight[u][v]);
                if (candidate < dist[v]) { dist[v] = candidate; parent[v] = u; }
            }
        }
    }
    return true;
}
```

不可达顶点保留 GRAPH_INF、parent=-1，不是算法执行失败。零权合法，不能用 dist==0 代表已确定。路径通过 BuildParentPath 恢复，使用前先检查 dist[t] 是否可达。

矩阵实现时间 O(n²)、辅助数组 O(n)。邻接表配堆一般写 O((n+m)log n)，不等于直接把矩阵改成链表就自动获得该上界。

#### Dijkstra计算表与负权反例

沿前面带权图从 A 出发：

| 本轮确定顶点 | A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- | --- |
| A | 0 | 4 | 2 | ∞ | ∞ | ∞ |
| C | 0 | 3 | 2 | 10 | 12 | ∞ |
| B | 0 | 3 | 2 | 8 | 12 | ∞ |
| D | 0 | 3 | 2 | 8 | 10 | 14 |
| E | 0 | 3 | 2 | 8 | 10 | 13 |
| F | 0 | 3 | 2 | 8 | 10 | 13 |

到 F 为 A→C→B→D→E→F，总权 `2+1+5+2+3=13`。表格是每轮完成松弛后的估计，已确定者不再变化。

**负权反例：** 有向弧 S→A=2、S→B=5、B→A=-4。先确定 A=2 后，真正更短的 S→B→A=1 尚未发现，普通 Dijkstra 会错。负边不必组成负环，也足以破坏算法的一般保证。

#### Floyd的动态规划与函数

令 D^(k)[i][j] 表示中间顶点只允许取编号 0..k 时的最短距离，D^(-1) 为初始距离矩阵：

$$
D^{(k)}[i][j]=\min\bigl(D^{(k-1)}[i][j],\ D^{(k-1)}[i][k]+D^{(k-1)}[k][j]\bigr)
$$

具体代码编号从 0 开始，把 k 放在最外层；内层 i、j 可交换，但不能随意把 k 移到内层仍声称一轮得到同一结果。

```cpp
// dist、nextHop、undefined 均为 MAX_GRAPH_V 列、至少 n 行的数组。
// undefined[i][j] 表示该顶点对受可达负环影响，不应使用数值作有限最短路。
bool FloydAllPairs(const MGraph *G, long long dist[][MAX_GRAPH_V],
                    int nextHop[][MAX_GRAPH_V], bool undefined[][MAX_GRAPH_V]) {
    if (G == NULL || dist == NULL || nextHop == NULL || undefined == NULL) {
        return false;
    }
    for (int i = 0; i < G->n; ++i) {
        for (int j = 0; j < G->n; ++j) {
            dist[i][j] = i == j ? 0 : (G->edge[i][j] ? G->weight[i][j] : GRAPH_INF);
            nextHop[i][j] = i == j ? i : (G->edge[i][j] ? j : -1);
            undefined[i][j] = false;
        }
    }
    for (int k = 0; k < G->n; ++k) {
        for (int i = 0; i < G->n; ++i) {
            for (int j = 0; j < G->n; ++j) {
                if (dist[i][k] == GRAPH_INF || dist[k][j] == GRAPH_INF) { continue; }
                long long candidate = AddDistance(dist[i][k], dist[k][j]);
                if (candidate < dist[i][j]) {
                    dist[i][j] = candidate;
                    nextHop[i][j] = nextHop[i][k];
                }
            }
        }
    }
    for (int k = 0; k < G->n; ++k) {
        if (dist[k][k] < 0) {
            for (int i = 0; i < G->n; ++i) {
                for (int j = 0; j < G->n; ++j) {
                    if (dist[i][k] != GRAPH_INF && dist[k][j] != GRAPH_INF) {
                        undefined[i][j] = true;
                    }
                }
            }
        }
    }
    return true;
}

bool BuildFloydPath(int n, int s, int t, const int nextHop[][MAX_GRAPH_V],
                     const bool undefined[][MAX_GRAPH_V], int path[],
                     int capacity, int *length) {
    if (n < 1 || n > MAX_GRAPH_V || s < 0 || t < 0 || s >= n || t >= n ||
        nextHop == NULL || undefined == NULL || path == NULL || length == NULL ||
        capacity < 1 || undefined[s][t] || nextHop[s][t] < 0) { return false; }
    int count = 1;
    int v = s;
    path[0] = s;
    while (v != t) {
        v = nextHop[v][t];
        if (v < 0 || v >= n || count == n || count == capacity) { return false; }
        path[count++] = v;
    }
    *length = count;
    return true;
}
```

dist[k][k]<0 可检测负环。只有能从 i 到达负环、又从负环到达 j 的顶点对受影响，不是图里出现一个负环就使所有不相关顶点对都失去有限距离。

Floyd 时间 O(n³)，距离及路径矩阵 O(n²)。运算前排除 ∞，不能把大整数哨兵当正常值随意加减。无向图存在负边时，可以沿该边反复往返无限下降，因此标准可重复路径意义下不能得到有限最短距离。

#### Floyd负边无负环例子

有向弧 AB=3、AC=8、BC=-2、BD=5、CD=2。处理 B 后 AC 从 8 变为 1、AD 从 ∞ 变为 8；处理 C 后 AD 变为 3、BD 变为 0。

| 最终距离 | A | B | C | D |
| --- | --- | --- | --- | --- |
| A | 0 | 3 | 1 | 3 |
| B | ∞ | 0 | -2 | 0 |
| C | ∞ | ∞ | 0 | 2 |
| D | ∞ | ∞ | ∞ | 0 |

A 到 D 为 A→B→C→D，权和 3；该图无环，负边没有造成负环。对角线仍为 0。

#### Prim、Dijkstra与Floyd的辨析

| 方法 | 维护的量 | 更新公式 |
| --- | --- | --- |
| Prim | 未选顶点连接现有树的最轻边 | key[v]=min(key[v],w(u,v)) |
| Dijkstra | 源到未确定顶点的最短距离估计 | dist[v]=min(dist[v],dist[u]+w(u,v)) |
| Floyd | 每一对顶点的距离 | dist[i][j]=min(dist[i][j],dist[i][k]+dist[k][j]) |

都可能出现“取最小/更新”的语句，但选取对象、累计含义和正确条件不同。Prim 可有负权，Dijkstra 不具备这一一般保证；Floyd 不是最小生成树算法。

### 6.4.3 有向无环图描述表达式

#### 表达式树到DAG的公共子表达式共享

表达式树重复展开每次出现的操作数和子表达式；DAG 可让多个使用位置指向同一子表达式结点，减少存储和重复计算。

例：`(a+b)*(a+b)+(a+b)*c`。

| 结点 | 表示 | 依赖 |
| --- | --- | --- |
| a、b、c | 三个操作数 | 无 |
| P | a+b | a、b |
| Q | P*P | P、P |
| R | P*c | P、c |
| Root | Q+R | Q、R |

普通二元表达式树展开后 13 个结点，共享 DAG 只需 7 个。P 被多个位置引用，但它本身只保存一次。

同一个 P 可以同时作为 Q 的左右操作数，两个操作数槽仍要保留；底层依赖图若把重复依赖合并成一条边，也不能丢掉“P*P”的两次取值含义。这组表达式专用结构不使用前面禁止重边的 AddEdge 来代替操作数槽。

#### 共享条件、边方向与求值次序

- 只有相同运算符、相同且有顺序的操作数，才能直接复用同一运算结点。
- `a-b` 与 `b-a` 不可合并；本页也不自动把 `a+b` 和 `b+a` 合并，避免擅自增加交换、浮点或语义规则。
- 共享按纯表达式、同一份变量取值快照理解；有赋值、副作用或执行过程中变量变化时，不能随意复用旧结果。
- 若画“运算结点 → 操作数”边，求值要先处理子依赖，可用反向拓扑或带记忆的递归；若画“操作数 → 使用者”边，则按正向拓扑求值。
- DAG 有共享但没有环；有环的相互依赖不能按普通表达式 DAG 一次求值。

#### 表达式DAG的建立、查重与记忆求值

本页 token 是单字符变量名或二元运算符；新增运算的孩子必须已存在，所以构造次序本身保证无环。

```cpp
typedef struct {
    char token;
    bool leaf;
    int left;
    int right;
} ExprNode;

typedef struct {
    ExprNode nodes[MAX_GRAPH_V];
    int n;
} ExprDAG;

void InitExprDAG(ExprDAG *D) { D->n = 0; }

int InternOperand(ExprDAG *D, char name) {
    if (D == NULL) { return -1; }
    for (int i = 0; i < D->n; ++i) {
        if (D->nodes[i].leaf && D->nodes[i].token == name) { return i; }
    }
    if (D->n == MAX_GRAPH_V) { return -1; }
    int i = D->n++;
    D->nodes[i].token = name;
    D->nodes[i].leaf = true;
    D->nodes[i].left = D->nodes[i].right = -1;
    return i;
}

int InternOperator(ExprDAG *D, char op, int left, int right) {
    if (D == NULL || left < 0 || right < 0 || left >= D->n || right >= D->n ||
        (op != '+' && op != '-' && op != '*' && op != '/')) { return -1; }
    for (int i = 0; i < D->n; ++i) {
        if (!D->nodes[i].leaf && D->nodes[i].token == op &&
            D->nodes[i].left == left && D->nodes[i].right == right) { return i; }
    }
    if (D->n == MAX_GRAPH_V) { return -1; }
    int i = D->n++;
    D->nodes[i].token = op;
    D->nodes[i].leaf = false;
    D->nodes[i].left = left;
    D->nodes[i].right = right;
    return i;
}

bool EvaluateExprNode(const ExprDAG *D, int i, const double variables[],
                       int state[], double cache[]) {
    if (i < 0 || i >= D->n || state[i] == 1) { return false; }
    if (state[i] == 2) { return true; }
    state[i] = 1;
    const ExprNode *p = &D->nodes[i];
    if (p->leaf) {
        cache[i] = variables[(unsigned char)p->token];
    } else {
        if (!EvaluateExprNode(D, p->left, variables, state, cache) ||
            !EvaluateExprNode(D, p->right, variables, state, cache)) { return false; }
        double a = cache[p->left];
        double b = cache[p->right];
        if (p->token == '+') { cache[i] = a + b; }
        else if (p->token == '-') { cache[i] = a - b; }
        else if (p->token == '*') { cache[i] = a * b; }
        else if (p->token == '/' && b != 0.0) { cache[i] = a / b; }
        else { return false; }
    }
    state[i] = 2;
    return true;
}

// variables 有 UCHAR_MAX+1 项，按无符号字符值给变量赋值。
bool EvaluateExprDAG(const ExprDAG *D, int root,
                       const double variables[], double *out) {
    if (D == NULL || variables == NULL || out == NULL ||
        root < 0 || root >= D->n) { return false; }
    int state[MAX_GRAPH_V] = { 0 };
    double cache[MAX_GRAPH_V];
    if (!EvaluateExprNode(D, root, variables, state, cache)) { return false; }
    *out = cache[root];
    return true;
}
```

建立 a、b、c，再建立 P=InternOperator('+',a,b)、Q=InternOperator('*',P,P)、R=InternOperator('*',P,c)、Root=InternOperator('+',Q,R)。a=1、b=2、c=4 时结果为 21。

没有记忆的递归即使在共享 DAG 上，也可能重复计算 P。state=2 才表示缓存可用；每次求值重新清状态，变量改变后不会错误复用上次缓存。只处理 root 可达依赖，未参与表达式的其他结点不影响结果。

线性扫描查重每次 O(n)，逐个建立最坏 O(n²)；记忆求值只访问相关结点及依赖一次，O(n_r+m_r)，状态、缓存和递归最坏 O(n_r)。此演示不负责把任意表达式文本解析成 DAG。

### 6.4.4 拓扑排序

#### AOV网、拓扑序与存在条件

AOV 网用顶点表示活动，弧 u→v 表示 u 必须先于 v。拓扑序是顶点的一种线性排列，使每条弧的弧尾都在弧头之前。

- 有向图存在拓扑序，当且仅当无有向环。
- 拓扑序不要求每对顶点之间都有依赖，也不要求边权递增。
- 有环时无法完成包含全部顶点的拓扑排序。
- “图连通”与“图是 DAG”不是同一条件；不连通 DAG 也可拓扑排序。

#### Kahn算法的入度队列与函数

反复取当前入度为 0 的顶点输出，相当于删去它及其出边；把新变为 0 的顶点加入候选队列。本页只改入度副本，不破坏图。

```cpp
// unique 可为 NULL；count 输出实际排出的数量。
// false 表示参数无效或有环；有环时 order 保留可排出的前缀。
bool TopoSortAL(const ALGraph *G, int order[], int *count, bool *unique) {
    if (G == NULL || !G->directed || order == NULL || count == NULL) {
        return false;
    }
    int indegree[MAX_GRAPH_V] = { 0 };
    int queue[MAX_GRAPH_V];
    int front = 0;
    int rear = 0;
    for (int u = 0; u < G->n; ++u) {
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            ++indegree[p->adjvex];
        }
    }
    for (int v = 0; v < G->n; ++v) { if (indegree[v] == 0) { queue[rear++] = v; } }
    *count = 0;
    bool oneChoice = true;
    while (front < rear) {
        if (rear - front > 1) { oneChoice = false; }
        int u = queue[front++];
        order[(*count)++] = u;
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            if (--indegree[p->adjvex] == 0) { queue[rear++] = p->adjvex; }
        }
    }
    bool acyclic = *count == G->n;
    if (unique != NULL) { *unique = acyclic && oneChoice; }
    return acyclic;
}
```

每条弧计一次入度、删除一次，时间 O(n+m)，队列和入度 O(n)。邻接矩阵处理时需扫描行，时间 O(n²)。空程序图返回空序列成功。

#### DFS完成时间的逆序拓扑

DAG 中，沿 u→v 递归后 v 应先于 u 完成；把 DFS 完成序列反转，就得到拓扑序。必须用状态检测环，不能对有环图也返回一个“看起来像拓扑”的排列。

```cpp
bool TopoDFSVisit(const ALGraph *G, int u, int state[], int finish[], int *count) {
    state[u] = 1;
    for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
        int v = p->adjvex;
        if (state[v] == 1) { return false; }
        if (state[v] == 0 && !TopoDFSVisit(G, v, state, finish, count)) {
            return false;
        }
    }
    state[u] = 2;
    finish[(*count)++] = u;
    return true;
}

bool TopoSortDFS(const ALGraph *G, int order[]) {
    if (G == NULL || !G->directed || order == NULL) { return false; }
    int state[MAX_GRAPH_V] = { 0 };
    int count = 0;
    for (int u = 0; u < G->n; ++u) {
        if (state[u] == 0 && !TopoDFSVisit(G, u, state, order, &count)) {
            return false;
        }
    }
    for (int i = 0; i < count / 2; ++i) {
        int temp = order[i];
        order[i] = order[count - i - 1];
        order[count - i - 1] = temp;
    }
    return true;
}
```

同样 O(n+m)，递归栈最坏 O(n)。成功时 order 包含全部顶点；失败时里面的部分完成序列不能当完整拓扑使用。

#### 拓扑顺序例子、唯一性与判环

弧 AC、BC、BD、CE、DE、EF，顶点 A..F。初始零入度为 A、B；依次处理 A、B 后 C、D 都可选；再处理 E、F。

ABCDEF 和 BADCEF 都是合法序列，所以不唯一。Kahn 在任何一步出现两个或更多可选顶点时，DAG 拓扑序不唯一；每步恰一个候选才唯一。

有环时输出数量小于 n。剩余顶点不仅可能是环上顶点，还可能包含依赖这些环的后续顶点；不能说“所有未输出顶点都在环上”。

对 DAG，唯一拓扑序中每对相邻顶点之间必须有从前到后的直接弧；否则这两个相邻顶点可以交换而仍保持合法，出现第二种序列。

#### DAG的最短或最长路径松弛

按拓扑次序处理顶点，所有前驱先于当前顶点完成，沿出边一次松弛即可。最短路取 min，最长路取 max，时间 O(n+m)，允许负边因为不存在回路。

单源最短路初始化源为 0、其他为 ∞；单源最长路初始化源为 0、其他为 -∞，都要跳过不可达源项。关键路径是在特定工程模型下采用最长路径思想，不是把 Dijkstra 的“选最小”改成“选最大”就能用于任意图。

```cpp
// longest=false 求最短，true 求最长；只支持 DAG。
bool DAGPathsAL(const ALGraph *G, int s, bool longest,
                  long long best[], int parent[]) {
    if (!ALVertexValid(G, s) || !G->directed || best == NULL || parent == NULL) {
        return false;
    }
    int topo[MAX_GRAPH_V];
    int count;
    if (!TopoSortAL(G, topo, &count, NULL)) { return false; }
    long long unreachable = longest ? -GRAPH_INF : GRAPH_INF;
    for (int v = 0; v < G->n; ++v) { best[v] = unreachable; parent[v] = -1; }
    best[s] = 0;
    for (int k = 0; k < G->n; ++k) {
        int u = topo[k];
        if (best[u] == unreachable) { continue; }
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            long long candidate = AddDistance(best[u], p->weight);
            int v = p->adjvex;
            if ((longest && candidate > best[v]) || (!longest && candidate < best[v])) {
                best[v] = candidate;
                parent[v] = u;
            }
        }
    }
    return true;
}
```

最短与最长结果都能用 BuildParentPath 恢复，但先检查 best[t] 是否为对应不可达值。

### 6.4.5 关键路径

#### AOE网、事件、活动与工期

AOE 网是有向无环带权图：顶点表示事件，弧表示活动，弧权表示活动持续时间。事件发生要求其入弧活动全部完成；从事件出发的活动只有该事件发生后才能开始。

| 模型 | 顶点 | 弧 |
| --- | --- | --- |
| AOV | 活动 | 活动的先后约束 |
| AOE | 事件 | 具有持续时间的活动 |

项目在满足依赖、允许独立活动并行的前提下，最早完成时间等于从开始到完成的**最长路径长度**。关键路径是决定该工期的路径，可能有多条。

经典题目常有唯一源点和汇点；多个源/汇可以增加虚拟开始/结束，用零时长弧连接。下面代码等价采用“所有源从时刻 0 可开始，所有汇都需在项目工期内完成”的统一模型。

活动时长非负，可以为 0；有环或负时长不按本页工程模型计算。该模型没有额外人力、机器资源数量约束，不等于任意实际排程问题的全部条件。

#### 事件最早时间ve与最迟时间vl

顺拓扑求事件最早发生时间：

$$
ve[v]=\max_{u\to v}\{ve[u]+w(u,v)\},\qquad ve[\text{源}]=0
$$

所有汇的 ve 最大值为工期 T。反拓扑求不拖延项目的事件最迟发生时间：

$$
vl[u]=\min_{u\to v}\{vl[v]-w(u,v)\},\qquad vl[\text{汇}]=T
$$

最早是所有入活动完成的最晚时刻，因此取 max；最迟必须满足所有出活动按期完成，因此取 min。

**易错点：** vl 不是对 ve 取逆序或简单用 T-ve；它要根据后续活动重新计算。

#### 活动最早、最迟与余量

对活动 u→v、时长 w：

$$
e(u,v)=ve[u],\qquad l(u,v)=vl[v]-w,\qquad slack=l-e
$$

e 是弧尾事件的最早时间，l 用弧头事件的最迟时间减去活动时长。**e=l 的活动是关键活动**，总余量为 0。

事件 ve=vl 称事件无时间余量；两个端点都无余量，也不一定使连接它们的活动成为关键活动，仍需计算 l-e。

#### 关键路径的拓扑计算函数

```cpp
bool CriticalTimesAL(const ALGraph *G, long long ve[], long long vl[],
                       long long *duration, int topo[]) {
    if (G == NULL || !G->directed || G->n == 0 || ve == NULL || vl == NULL ||
        duration == NULL || topo == NULL) { return false; }
    for (int u = 0; u < G->n; ++u) {
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            if (p->weight < 0) { return false; }
        }
    }
    int count;
    if (!TopoSortAL(G, topo, &count, NULL)) { return false; }
    for (int v = 0; v < G->n; ++v) { ve[v] = 0; }
    for (int k = 0; k < G->n; ++k) {
        int u = topo[k];
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            long long candidate = AddDistance(ve[u], p->weight);
            if (candidate > ve[p->adjvex]) { ve[p->adjvex] = candidate; }
        }
    }
    long long total = 0;
    for (int v = 0; v < G->n; ++v) {
        if (G->vertices[v].first == NULL && ve[v] > total) { total = ve[v]; }
    }
    for (int v = 0; v < G->n; ++v) { vl[v] = total; }
    for (int k = G->n - 1; k >= 0; --k) {
        int u = topo[k];
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            long long candidate = vl[p->adjvex] - p->weight;
            if (candidate < vl[u]) { vl[u] = candidate; }
        }
    }
    *duration = total;
    return true;
}

typedef struct {
    int tail;
    int head;
    long long duration;
    long long earliest;
    long long latest;
    long long slack;
    bool critical;
} ActivityTime;

// 前提：ve、vl 来自本图成功的 CriticalTimesAL；result 容量至少 m。
bool GetActivityTimes(const ALGraph *G, const long long ve[],
                       const long long vl[], ActivityTime result[],
                       int capacity, int *count) {
    if (G == NULL || !G->directed || ve == NULL || vl == NULL || result == NULL ||
        count == NULL || capacity < G->m) { return false; }
    *count = 0;
    for (int u = 0; u < G->n; ++u) {
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            ActivityTime *a = &result[(*count)++];
            a->tail = u;
            a->head = p->adjvex;
            a->duration = p->weight;
            a->earliest = ve[u];
            a->latest = vl[p->adjvex] - p->weight;
            a->slack = a->latest - a->earliest;
            a->critical = a->slack == 0;
        }
    }
    return true;
}
```

关键时间和活动计算均 O(n+m)，事件工作数组 O(n)，保存所有活动结果另需 O(m)。结果先与弧对应，不是把关键顶点列表当成关键路径。

#### 两条关键路径的完整例子

顶点 S、A、B、C、D、T；活动 SA=3、SB=2、AC=2、AD=4、BC=4、CT=3、DT=2。合法拓扑次序例如 S、A、B、C、D、T。

| 事件 | S | A | B | C | D | T |
| --- | --- | --- | --- | --- | --- | --- |
| ve | 0 | 3 | 2 | 6 | 7 | 9 |
| vl | 0 | 3 | 2 | 6 | 7 | 9 |

ve[C]=max(3+2,2+4)=6；ve[T]=max(6+3,7+2)=9。反向 vl[A]=min(6-2,7-4)=3，vl[S]=min(3-3,2-2)=0。

| 活动 | w | e=ve[尾] | l=vl[头]-w | 余量 | 是否关键 |
| --- | --- | --- | --- | --- | --- |
| S→A | 3 | 0 | 0 | 0 | 是 |
| S→B | 2 | 0 | 0 | 0 | 是 |
| A→C | 2 | 3 | 4 | 1 | 否 |
| A→D | 4 | 3 | 3 | 0 | 是 |
| B→C | 4 | 2 | 2 | 0 | 是 |
| C→T | 3 | 6 | 6 | 0 | 是 |
| D→T | 2 | 7 | 7 | 0 | 是 |

两条关键路径：S→A→D→T 和 S→B→C→T，长度都为 9。S→A→C→T 长 8。

本例所有事件都 ve=vl，但 A→C 不是关键活动，直接反驳“两个关键事件之间的活动必关键”。

#### 枚举关键路径与输出代价

只沿关键活动，从关键源事件到完成工期的汇事件搜索，可列出真实路径，而非随意把所有关键活动拼成一条链。

```cpp
void PrintCriticalDFS(const ALGraph *G, int u, const long long ve[],
                         const long long vl[], long long duration,
                         int path[], int length) {
    path[length++] = u;
    if (G->vertices[u].first == NULL) {
        if (ve[u] == duration) {
            for (int i = 0; i < length; ++i) {
                printf("%c%s", G->vertices[path[i]].data, i + 1 == length ? "\n" : "->");
            }
        }
        return;
    }
    for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
        if (ve[u] == vl[p->adjvex] - p->weight) {
            PrintCriticalDFS(G, p->adjvex, ve, vl, duration, path, length);
        }
    }
}

// 仅在 CriticalTimesAL 成功后使用，不支持带环输入。
void PrintAllCriticalPaths(const ALGraph *G, const long long ve[],
                             const long long vl[], long long duration) {
    int indegree[MAX_GRAPH_V] = { 0 };
    int path[MAX_GRAPH_V];
    for (int u = 0; u < G->n; ++u) {
        for (ArcNode *p = G->vertices[u].first; p != NULL; p = p->next) {
            ++indegree[p->adjvex];
        }
    }
    for (int s = 0; s < G->n; ++s) {
        if (indegree[s] == 0 && ve[s] == vl[s]) {
            PrintCriticalDFS(G, s, ve, vl, duration, path, 0);
        }
    }
}
```

ve/vl 计算是线性的，**枚举全部路径不一定线性**；DAG 可能有指数多条关键路径，输出成本就很大。递归只对当前路径保存编号，DAG 路径长不超过 n 个顶点。

#### 缩短工期、非关键余量与常见误判

- 关键活动延长会拖延项目；在本模型中，单个关键活动增加 δ，工期增加 δ。
- 缩短某一个关键活动不保证缩短总工期，可能还有未受影响的其他关键路径。
- 多条关键路径时，要让所有原最长路径都缩短才有机会缩短工期，还要看次长路径是否成为新的约束。
- 非关键活动增加的时长不超过其总余量时，不改变工期；超过余量后要重新计算。
- 原关键活动缩短后未必仍关键，非关键活动也可能变关键，不能沿用旧标记。

本例把 D→T 从 2 改为 1，S→A→D→T 变 8，但另一条 S→B→C→T 仍为 9，工期不变。A→C 的余量 1，时长从 2 增至 3 时不延长工期，并形成新的长度 9 路径。

“关键路径”按工程持续时间取最长，不是边数最多的路径，也不是最短路；活动有不同权时，三者可能完全不同。

## 本章综合回顾

### 图的计数与存储速查

| 条件 | 结论 |
| --- | --- |
| 无向图 m 条边 | 总度 2m，奇度顶点数为偶数 |
| 有向图 m 条弧 | 总入度 m，总出度 m |
| 简单无向图 | 最大边数 n(n-1)/2 |
| 简单有向图 | 最大弧数 n(n-1) |
| 简单 DAG | 最大弧数 n(n-1)/2 |
| 连通无向图生成树 | n 个顶点、n-1 条边 |
| 无向图 c 个连通分量 | 生成森林 n-c 条边 |
| 无向邻接表 | 2m 个表项，实际两份对象 |
| 有向邻接表 / 十字链表 | m 个表项 / m 个共享弧对象 |
| 邻接多重表 | m 个共享边对象，在关联链中出现 2m 次 |

### 应用算法与复杂度速查

| 算法 | 任务及条件 | 常见时间 | 额外空间或结果 |
| --- | --- | --- | --- |
| BFS / DFS，邻接表 | 遍历，BFS 无权最短边数 | O(n+m) | 访问、队列或栈 O(n) |
| BFS / DFS，矩阵 | 遍历 | O(n²) | O(n) |
| Prim，矩阵 | 无向连通网 MST，可负权 | O(n²) | O(n) |
| Kruskal，已有边集 | 无向网 MST/森林，可负权 | 常写 O(m log m) | 边和并查集 O(n+m) |
| 本页 Kruskal，从矩阵提边 | 同上 | O(n²+m log m) | O(n+m) 逻辑规模 |
| Dijkstra，矩阵 | 单源最短，非负边 | O(n²) | O(n) |
| Floyd | 全部顶点对，标记负环影响 | O(n³) | 距离、路径、影响矩阵 O(n²) |
| 拓扑排序，邻接表 | 有向无环图的线性次序 | O(n+m) | O(n) |
| DAG 最短/最长路径 | 单源，无环，可负边 | O(n+m) | O(n) |
| 关键时间与关键活动 | AOE，非负持续时间、DAG | O(n+m) | 事件 O(n)，活动输出 O(m) |
| 枚举全部关键路径 | 输出所有完整关键链 | 受输出数量影响，可指数级 | 当前路径及递归 O(n) |

存储图本身的空间与算法额外空间分开；固定上限数组的实际预留量按上限计，不能把预留大数组说成只占当前实际链长。

### 常用函数结果与失败处理

| 函数 | 怎样读结果 |
| --- | --- |
| BFSFromAL | 执行成功不代表所有点可达，distance=-1 代表不可达 |
| BFSTraverseAL / DFSTraverseAL | 无向图根数是分量数；有向图不据此计强分量 |
| PrimMST | 1 为 MST，0 为不连通且只含起点可达部分，-1 为参数无效 |
| KruskalMST | 1 为 MST，0 为最小生成森林，-1 为参数无效 |
| DijkstraMatrix | 拒绝负边；成功结果中仍可有 GRAPH_INF |
| FloydAllPairs | 成功表示完成计算，仍要检查 undefined[i][j] 与是否可达 |
| TopoSortAL | 有环时只输出可完成前缀，不是完整拓扑序 |
| CriticalTimesAL | 成功后才使用 ve/vl、活动和路径结果 |

### 高频易错点检查清单

1. 弧尾、弧头与矩阵行列是否用对？无向边是否只算一次 m？
2. 度数和是 2m、入度/出度和是 m，是否混用？
3. n-1 条边是否被错误当成连通保证？“极大分量”是否误作最大规模？
4. 无边与零权是否分开？∞ 是否在加法前排除？
5. 十字链表 tlink/hlink、邻接多重表 ilink/jlink 是否按所属顶点走？
6. 共享边是否两处摘链、只释放一次？无向邻接表两份表项是否都释放？
7. BFS 是否在入队时标记？全图遍历是否有外层未访问顶点循环？
8. 邻接次序是否明确？DFS 的找到路径是否误称最短？
9. 有向 DFS 遇到已完成点是否误判环？遍历根数是否误当强分量数？
10. Prim 是否比较单边权，而 Dijkstra 比较累计距离？
11. MST 可负权与 Dijkstra 的非负条件是否混淆？重复最重/最轻权的结论是否过强？
12. Floyd 是否 k 最外层？负环是否只影响能经过它的顶点对？
13. 表达式共享是否保留操作数顺序与同一时刻变量值？是否用了记忆避免重复计算？
14. 拓扑是否覆盖全部顶点？未输出点是否误认为全在环内？
15. AOV 的顶点活动与 AOE 的弧活动是否分清？
16. ve 取 max、vl 取 min，e 用弧尾、l 用弧头减时长是否正确？
17. 关键事件之间的弧是否直接被误认关键活动？
18. 多条关键路径时，缩短一个关键活动是否真的缩短全部最长链？

### 八个代表性回顾问题

**一：** 无向简单图 8 个顶点，各度和为 18，边数多少？最大可能边数多少？

边数 9，最大 28。若说的是有向出度和 18，弧数就是 18。

**二：** 6 个顶点、5 条边一定是树吗？

不一定。还需连通或无环的条件；三角形加一条三结点链就有 6 个顶点、5 条边，但不连通且有环。

**三：** 同一图 BFS 次序不同，最短距离会变吗？

改变邻接次序可能改变访问和 parent，但无权最短边数不变。

**四：** 图里有负边，Prim 和 Dijkstra 都不能用吗？

Prim 在无向连通网仍可用；Dijkstra 对一般负边输入不保证正确。

**五：** 存在拓扑序意味着拓扑序唯一吗？

不是，存在只说明无环；若某一步有多个零入度候选，就存在不同拓扑序。

**六：** 一个有向图从 A 能访问所有顶点，就是强连通吗？

不是，只有 A→B 已是反例；还需其他顶点能回到 A，或等价检查反向图可达性。

**七：** AOE 中 ve[A]=vl[A]、ve[C]=vl[C]，A→C 就关键吗？

不一定。本章例子 ve[A]=3、vl[C]=6，AC 时长 2，e=3、l=4，有余量 1。

**八：** 关键路径有两条，缩短其中一条上的活动一定缩短工期吗？

不一定；如果另一条原最长路径不受影响，它仍决定原工期。本章把 DT 从 2 减到 1，工期仍是 9。

## 资料与使用说明

- 章节目录与[电子工业出版社《2027年数据结构考研复习指导》书目](https://phei.com.cn/module/goods/wssd_content.jsp?bookid=68851)对应，按用户指定的小节整理。
- [MIT 算法课程讲义](https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2012/b1e5ac3c8f7d60db9b8d5b66c40bc55e_MIT6_046JS12_Notes.pdf)可用于扩展核对最短路算法条件；[Princeton 关键路径文档](https://algs4.cs.princeton.edu/code/javadoc/edu/princeton/cs/algs4/CPM.html)说明关键路径与 DAG 最长路的联系，具体工程建模与本页 AOE 表示可不同。
- 代码按知识点拆开，公共类型和辅助函数需一并使用；按本页定义顺序组织，无需额外 cpp 文件。
- 作为复习应做到：看图算度和连通关系，画四种存储结构，写基本操作与遍历，手算 MST 和最短路，识别 DAG 共享与拓扑约束，完整求 ve/vl/e/l 并判断工期变化。
