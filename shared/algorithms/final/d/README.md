# D 包 · 查找与哈希（本轮 07）

任务单见 [d-search-hash.md](../../../../docs/team/final/tasks/d-search-hash.md)，自测脚本见 [tests/final-d.test.mjs](../../../../tests/final-d.test.mjs)。工作台接入与动画渲染分别由 01、02 负责。

## 模块与入口

| 文件 | 导出函数 | 输入 | `result` |
|---|---|---|---|
| `linear-search.js` | `generateLinearSearchSteps` | `{ array, target }` | 命中下标，未命中 `-1` |
| `block-search.js` | `generateBlockSearchSteps` | `{ blocks, target }` | 展平后命中下标，未命中 `-1` |
| `hash-linear-probing.js` | `generateHashLinearProbingSteps` | `{ keys, capacity, target? }` | 最终表（`null` 为空槽） |
| `hash-quadratic-probing.js` | `generateHashQuadraticProbingSteps` | 同上 | 最终表 |
| `hash-double-hashing.js` | `generateHashDoubleHashingSteps` | 同上 | 最终表 |
| `hash-chaining.js` | `generateHashChainingSteps` | `{ keys, bucketCount, target? }` | 桶数组的二维数组 |
| `avl-tree.js` | `generateAvlSteps` | `{ keys, target? }` | `{ root, nodes }` 或 `{ found, path, root }` |
| `red-black-tree.js` | `generateRedBlackSteps` | `{ keys, target? }` | `{ root, nodes, checked }` 或 `{ found, path, root }` |

每个文件同时导出 `SOURCE_VERSION` 与 `SOURCE_LINES`，返回 `{ steps, result, sourceVersion, sourceLines }`，与 `binarySearch.js`、`bubbleSort.js` 一致。

### 输入约束

所有上限都在**生成快照之前**校验，避免大输入撑爆内存或触发 `RangeError`。

- `capacity` / `bucketCount`：正整数，上限 `MAX_CAPACITY = 1024`。
- `keys`（哈希与树）：不超过 `MAX_KEYS = 64` 个。树的每步快照包含全部结点，键数过多会让步骤数按平方增长。
- `array`（顺序查找）：不超过 `MAX_ARRAY_ELEMENTS = 2048` 个元素。
- `blocks`（分块查找）：块数不超过 `MAX_BLOCK_COUNT = 64`，元素总数不超过 `MAX_BLOCK_ELEMENTS = 2048`。块最值用循环计算，不使用 `Math.max(...block)` —— 展开运算符在元素过多时会抛出 `RangeError`。
- **双散列容量必须是素数**，否则步长与表长不互素，探测只在部分槽位循环并错误地报告"表已满"，直接抛 `TypeError`。
- **平方探测容量必须是奇素数**（按任务单约定），否则正平方序列的覆盖性无法保证，抛 `TypeError`。
- 分块查找要求非空块的取值范围依次分离，重叠时抛 `TypeError`。

> 上限数值当前由本包暂定，待与 01 对齐后再调整；数值只影响拒绝边界，不改变算法行为。

## 步骤字段

公共字段沿用现有契约：`schemaVersion`（`1.0`）、`algorithm`、`stepIndex`（从 0 连续编号）、`event`、`sourceVersion`、`lineId`、`variables`、`description`（中文）、`done`、`result`（仅结束步非 null）。

- 数组类（顺序查找、分块查找）与 `bubbleSort.js` 一样在顶层带 `array` 和 `target`。
- 哈希与树不使用顶层 `array`，结构数据放在 `variables`：哈希为 `table`/`used`/`buckets`，分块查找另有 `blocks`/`ranges`/`blockMaxValues`；树为 `nodes`（每项含 `key/left/right`，AVL 另带 `height/bf`，红黑树另带 `color/parent`）加 `root`。

> **待确认**：树与哈希的 `variables` 子字段由本包暂定，尚未与 01 对齐；接入前需要 01 确认命名、02 确认渲染方式。

## 事件名与失败语义

| 算法 | `event` 取值 |
|---|---|
| 顺序查找 | `init` `compare` `found` `not-found` |
| 分块查找 | `init` `index-skip` `index-compare` `block-selected` `inner-compare` `found` `not-found` |
| 哈希（线性/平方/双散列） | `init` `calc-hash` `probe` `place` `duplicate` `table-full` `probe-exhausted` `found` `not-found` `done` |
| 哈希拉链法 | `init` `calc-hash` `compare` `insert-tail` `duplicate` `found` `not-found` `done` |
| 平衡二叉树 | `init` `compare` `insert` `unbalanced` `rotate-inner` `rotate` `found` `not-found` `done` |
| 红黑树 | `init` `compare` `insert-red` `fixup` `root-black` `found` `not-found` `done` |

**哈希失败步骤**（消费方需要区分）：

- `table-full`：该键探测满 `capacity` 次且表内空槽为 0。`variables.emptySlots` 给出当时的空槽数。
- `probe-exhausted`：平方探测专用。探测序列耗尽但**表中仍有空槽**，`variables.emptySlots > 0`，描述里会明确说明这是增量局限而非表满。
- 两种失败都**只结束当前键**，后续键继续插入，末尾仍执行可选查询。因此一个 run 里可能出现多个失败步骤，**不是终止信号**。
- 平方探测的 `probe` 步骤带 `visited` 数组，用于展示"同一槽被重复访问"。

**树事件补充**：AVL 的 `variables.rotation` 取 `LL`/`RR`/`LR`/`RL`；`rotate-inner` 事件额外取 `LR-1`/`RL-1`，表示 LR/RL 的第一次内旋，第二次外旋记在 `rotate` 事件里，两者高亮不同代码行。红黑树的 `fixup` 用 `variables.fixupCase` 区分 `case1-uncle-red`、`case2-inside`、`case3-outside`。

## 验收样例

| 算法 | 输入 | 预期结果 |
|---|---|---|
| 顺序查找 | `{array:[4,2,4],target:4}` | `0`（重复键取首个） |
| 顺序查找 | `{array:[],target:4}` | `-1`，共 2 步 |
| 分块查找 | `{blocks:[[3,1],[8,5]],target:3}` | `0`；索引表 `[3,8]` |
| 分块查找 | `{blocks:[[3,1],[8,5]],target:4}` | `-1`，检查第二块后终止 |
| 分块查找 | `{blocks:[[],[2],[9]],target:9}` | `1`，空块跳过 |
| 哈希线性探测 | `{keys:[4,9,14],capacity:5,target:14}` | 表 `[9,14,null,null,4]`，命中槽 `1` |
| 哈希线性探测 | `{keys:[0,1,2,3],capacity:3,target:1}` | 表 `[0,1,2]`，键 3 失败，仍命中槽 `1` |
| 哈希平方探测 | `{keys:[0,7,14,21],capacity:7}` | 表 `[0,7,21,null,14,null,null]` |
| 哈希平方探测 | `{keys:[0,7,14,21,28],capacity:7}` | 键 28 `probe-exhausted`，剩余空槽 3 |
| 哈希平方探测 | `{keys:[0,1,2,3],capacity:3}` | 键 3 `table-full`，剩余空槽 0 |
| 哈希平方探测 | `{keys:[0,7,14,21,28,3],capacity:7,target:3}` | 28 失败；3 落槽 3；查询命中槽 3 |
| 哈希双散列 | `{keys:[1,6,11],capacity:5}` | 表 `[11,1,null,null,6]`，步长 2/3/4 |
| 哈希双散列 | `{keys:[1,3,13],capacity:4}` | 抛错：容量必须为素数 |
| 哈希拉链法 | `{keys:[1,6],bucketCount:5,target:6}` | 桶 1 为 `[1,6]`，比较 2 次命中 |
| 哈希拉链法 | `{keys:[1,6],bucketCount:5,target:7}` | 空桶，比较 0 次未命中 |
| 平衡二叉树 | `{keys:[3,2,1]}` / `[1,2,3]` / `[3,1,2]` / `[1,3,2]` | 分别触发 LL/RR/LR/RL，根均为 `2` |
| 红黑树 | `{keys:[10,5,1]}` | 旋转后根 `5`，颜色 `5B 1R 10R` |
| 红黑树 | `{keys:[10,5,15,1]}` | 叔红变色，`10B 5B(1R) 15B` |

## 代表项人工核对记录：哈希线性探测

输入 `{keys: [4, 9, 14], capacity: 5, target: 14}`，按 `h(k) = k mod 5`、增量 1 手工推演：

| 键 | 初始槽 h | 探测序列 | 结果 |
|---|---:|---|---|
| 4 | 4 | 槽 4 空 | 放入槽 4 |
| 9 | 4 | 槽 4 已占（4）→ 槽 0 空 | 放入槽 0 |
| 14 | 4 | 槽 4 已占 → 槽 0 已占（9）→ 槽 1 空 | 放入槽 1 |

最终表 `[9, 14, null, null, 4]`。查询 14：h=4，槽 4 值为 4 不符 → 槽 0 值为 9 不符 → 槽 1 值为 14 命中，返回 **1**，共探测 3 次。与测试中 `hash-linear` 用例的断言一致。

## 展示代码

每个模块的 `SOURCE_LINES` 拼接后是**自包含、可编译**的 C 单元，不依赖任何外部桩：

- 使用 `malloc` 的模块（拉链法、AVL、红黑树）自带 `#include <stdlib.h>`。
- 红黑树包含 `new_node()` 的完整定义，并在 `insert()` 之前给出 `void fixup(RBNode **root, RBNode *z);` 前置声明——`insert` 定义在 `fixup` 之前，缺声明会触发隐式声明。
- 未出现在任何 `step.lineId` 中的行（如备用分支）属正常现象：展示的是完整函数，轨迹只走实际执行路径。

验证方式（拼接后直接编译，不加桩）：

```powershell
gcc -fsyntax-only -std=c99 -Wall -Wextra <模块>.c
```

本包已在 Windows x64 的 gcc 16.2.0 上实测八项全部通过，`-Wall -Wextra` 下零警告。

## 自测

```powershell
node --test tests/final-d.test.mjs
npm run check
```

`npm run check` 只做静态检查，不代表业务功能通过；工作台接入与画面联调仍需 01、02 完成。
