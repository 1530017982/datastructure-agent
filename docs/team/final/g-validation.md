# G 包算法验收与接入说明

G 包 10 项算法的模块、步骤轨迹和 C 展示源码已交付。层序遍历随 [PR #64](https://github.com/tw1l1ghtcc/datastructure-agent/pull/64) 合并并接入工作台。前序、中序、后序及本批六项的实现与验收汇总见 [PR #70](https://github.com/tw1l1ghtcc/datastructure-agent/pull/70)。递归栈及回退说明见[深度优先遍历验收](g-depth-first-validation.md)。

## 本批六项算法

各模块位于 `shared/algorithms/final/g/`，均导出默认输入、源码版本、展示源码行和下表的生成函数。每步记录 `stepIndex`、`event`、`lineId`、中文解释和独立的 `variables` 快照，结束步骤附结果。结果结构和展示所需的变量见下表。

| 算法 | 生成函数及输入 | 状态与默认结果 | 边界 |
|---|---|---|---|
| 二叉树重建 | `generateBinaryTreeReconstructionSteps({preorder,inorder})` | `stack` 记录前序和中序的左闭右开区间及左右子区间，`edge` 给出新增链接。返回 `{root,nodes}`，还原 A 的孩子 B、C 及 B 的右孩子 D。 | 空输入返回空树，拒绝重复标识、不同长度或不能构造同一棵树的序列。 |
| 二叉树线索化 | `generateThreadedBinaryTreeSteps({root,nodes})` | `currentNode`、`previous` 和 `edge` 标注新增前驱或后继。节点以 `leftThread`、`rightThread` 区分线索与孩子边。返回 `{root,nodes,order}`，沿线索访问 B、D、A、C。 | 首节点的前驱和末节点的后继为空。一个节点的两个空链接均标为线索。 |
| 树与森林转换 | `generateTreeForestConversionSteps({mode,roots,nodes})` 或 `({mode,root,nodes})` | `to-binary` 按首个孩子和右兄弟连边，返回 `{root,nodes}`。默认结果为 A 的左链接 B、右链接 D，B 的右链接 C。`to-forest` 按孩子兄弟链恢复有序的 `{roots,nodes}`。状态提供 `forestNodes`、`binaryNodes` 与变化的 `edge`。 | 支持空森林、多个根和单链；拒绝环、重复访问、缺失引用及不可达节点。 |
| 树与森林遍历 | `generateTreeForestTraversalSteps({mode,roots,nodes})` | `preorder` 默认输出 A、B、C、D，`postorder` 输出 B、C、A、D。用从 1 开始的 `treeIndex`、`stack` 和 `currentNode` 回放进入、访问与回退。 | 空森林结果为空，从输入顺序逐一访问根。 |
| 哈夫曼编码 | `generateHuffmanCodingSteps({symbols:[{id,weight}]})` | `candidates`、`selected` 和 `nodes` 展示选取与合并。权重 2、3、7 生成码字 00、01、1，带权路径长 17。返回 `{root,nodes,codes,weightedPathLength,encodedBitLength}`，其中编码项含输入编号、ID、权重及码字。 | 支持空输入。等权重时先取编号较小者，内部节点按创建顺序继续编号。单符号码字为 0，树的带权路径长为 0，实际编码位数为该符号权重。 |
| 二叉排序树 | `generateBinarySearchTreeSteps({operations:[{type,key}]})` | `type` 为 `insert` 或 `search`。`path` 保存比较过的节点编号，`edge` 标注下一条链接。返回 `{root,nodes,operations,inorder}`，默认查找 4 的路径键为 5、3、4，中序为 3、4、5、7。 | 重复键保留原节点，未命中返回空节点。允许 32 位有符号键、64 个不同键和 128 次操作。 |

普通二叉树使用 `{root,nodes:[{id,left,right}]}`，空树的 `root` 为 null。有序森林使用 `{roots,nodes:[{id,children}]}`，空森林的 `roots` 为空数组。两种表示的 ID 均为唯一的非空字符串，节点上限 64。哈夫曼编码的符号上限 64，输入权重为 1 到 2147483647 的整数。

C 源码使用数组下标表示节点，`-1` 表示空链接。森林使用根下标数组、按节点顺序拼接的孩子数组和偏移表。树和森林结构在传给 C 函数前完成输入验证。哈夫曼累计权重和代价使用 64 位整数。

## 复现

在 Windows x64 项目根目录执行以下命令。

```powershell
npm.cmd run check
node --test tests/final-g-*.test.mjs
```

G 包专项包含 28 项测试。仓库自带的 Open Watcom 从返回的 `SOURCE_LINES` 编译和运行全部 10 份 C 源码，共 357 组原生用例。其中层序遍历 5 组，前序、中序、后序各 105 组，本批六项共 37 组。层序默认结果为 A、B、C、D，D 在第 3 层。空树、单节点以及左偏、右偏的 64 节点树均已实跑。专项同时校验 `enqueue-root`、`enqueue-left`、`enqueue-right` 的高亮和入队状态。

六项新增轨迹使用现有播放器验证前进、回退和重置，回看步骤快照保持独立。浏览器工作台入口、状态字段、步骤问答和树动画由 01、02 按小组分工复核接入。本次全仓静态检查通过，共 157 个 JavaScript 文件和 13 个 JSON 文件。全仓测试 108 项中 89 项通过，16 项 HTTP 测试因本机回环连接返回 EACCES 失败，3 项依赖 C++ 工具链的用例跳过。
