# G 包深度优先遍历交付与复现

本批覆盖前序、中序、后序三项。层序遍历已随 PR #64 合并。本批算法模块等待 PR 复核，工作台入口、状态表消费和树动画由 01、02 协调接入。

## 输入与限制

沿用层序遍历的 `{root, nodes}` 格式，节点为 `{id, left, right}`。ID 必须是非空唯一字符串，左右孩子引用已有 ID，省略孩子等价于 null。空树使用 `{root:null,nodes:[]}`，最多 64 个节点，拒绝环、共享孩子和不可达节点。数组中的节点顺序不影响遍历。

树校验及默认样例提取到 `shared/algorithms/final/g/binary-tree-util.js`，层序遍历保留已有导出、字段及行为。三种深度优先遍历共享源码生成和回放逻辑，访问动作分别安排在左右递归之前、之间、之后。

## 模块及字段

| 模块 | 函数 | 默认结果 |
|---|---|---|
| binary-tree-preorder.js | generateBinaryTreePreorderSteps(input) | A、B、D、C |
| binary-tree-inorder.js | generateBinaryTreeInorderSteps(input) | B、D、A、C |
| binary-tree-postorder.js | generateBinaryTreePostorderSteps(input) | D、B、C、A |

每项导出 `SOURCE_VERSION`、`SOURCE_LINES`、`DEFAULT_INPUT`、`MAX_NODES` 和上述生成函数。返回 `{steps,result,sourceVersion,sourceLines}`。每步保持现有 `schemaVersion`、`algorithm`、`stepIndex`、`event`、`sourceVersion`、`lineId`、`description`、`variables`、`done`、`result` 结构。

`variables` 包含 root、nodes、stack、currentNode、level、childNode、order。`stack` 从栈底到栈顶排列，帧为 `{id,level,phase}`，层号从 1 开始。phase 为 enter、visit、left、right 或 return。所有步骤的树、栈、序列与最终结果使用独立快照。

| 事件 | lineId | 状态含义 |
|---|---|---|
| init | init | 访问序列与递归栈为空 |
| enter | enter | 当前节点入栈，读取其左右孩子 |
| visit | visit | 追加当前节点与层号，对应展示源码的连续三条输出语句 |
| descend | traverse-left / traverse-right | 当前帧准备递归进入 childNode |
| resume | resume-left / resume-right | 孩子已返回，当前帧恢复为父节点 |
| return | return | 当前帧即将退出，快照仍保留该帧 |
| done | done | 栈为空，currentNode 和 level 为 null，result 是访问序列 |

空树只有 init、done 两步。单节点为 init、enter、visit、return、done。节点进入顺序在三种遍历中均为 A、B、D、C，退出顺序均为 D、B、C、A，正式访问时点随遍历方式变化。

默认样例中，进入 D 时递归栈为 A、B、D，层号为 1、2、3。D 返回后在 resume-right 恢复 B，栈为 A、B。后序在 B 的右孩子 D 处理完后访问 B，在 C 处理完后才访问 A。

## 复现

在 Windows x64 项目根目录执行以下命令。

```powershell
npm.cmd run check
node --test tests/final-g-level-order.test.mjs tests/final-g-depth-first.test.mjs
npm.cmd test
```

专项测试覆盖默认树、空树、单节点、64 节点左偏树与右偏树，以及 100 棵固定种子生成树。参考实现独立计算三种访问序列及每个节点的层号，同时核对映射、回退状态、非法输入和快照独立性。

原生测试使用仓库 `third_party/open-watcom` 下的 C 编译器和链接器，直接编译三份 `SOURCE_LINES`，逐项核对 105 组输入的访问节点及层号，共 315 组。它复用项目的 `-za99 -bt=nt` 和 Windows 链接参数，编译运行失败会使测试失败。缺少 Windows 工具链时会明确跳过该项。链接器可能输出未用 Windows 库缺失警告，以实际生成程序的运行和校验退出码判定结果。

## 本次执行结果

以团队 main 的 `eee4170` 为基线，2026-11-18 实际执行结果如下。

- `node scripts/check.mjs` 通过，共 153 个 JS 文件和 13 个 JSON 文件。
- G 包层序与三种深度优先遍历专项测试共 14 项通过，无失败或跳过。
- 三份展示 C 使用仓库自带 Open Watcom 编译、链接并执行，315 组用例全部通过。工具链文件按 Git blob SHA 核对。链接器有未用 Windows 库缺失警告，程序正常退出。
- `node --test tests/*.test.mjs` 共 94 项，75 通过、16 失败、3 跳过。16 项 HTTP 测试均因本机 `connect EACCES 127.0.0.1` 失败，未完成 HTTP 全仓验收。GitHub 内容接口对大于 1 MB 的 C++ 编译器未返回内容，因此两项 C 包原生测试和一项双语言自定义代码测试跳过。本批 C 编译及运行测试实际执行且通过。
- 当前环境无法使用 Git 直接克隆，代码与工具链通过已连接 GitHub 读取。上述检查通过 Node 直接执行 package.json 中的对应命令。

## 联调交接

请 01 复核函数与新增 variables 字段并接入现有运行入口、输入表单和步骤问答。请 02 根据 stack、currentNode、childNode 和 order 核对当前节点、递归路径、单步前进、回退及重新播放。该批模块的单元与原生程序验收结果不包含浏览器动画验收。
