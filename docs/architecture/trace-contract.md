# 二分查找执行状态 v1

更新：2026-11-03。二分查找实现位于 [binarySearch.js](../../shared/algorithms/binarySearch.js)，导出 `generateSteps`、`SOURCE_VERSION` 和 `SOURCE_LINES`。冒泡排序和自定义代码的步骤字段另见[API 契约](api-contract.md#运行与步骤)。

## 算法及版本

采用闭区间[left,right]，零下标，mid向下取整。重复值命中返回任一实际匹配下标，未找到为-1。初始化left=0、right=array.length-1、mid=null；空数组产生初始化与not-found两步，不访问元素。

schemaVersion 固定为 `1.0`，二分查找的 sourceVersion 当前为 `c-v2`。每步字段：schemaVersion、algorithm、stepIndex、event、sourceVersion、lineId、array、target、variables、done、result。variables 含 left/right/mid；步骤数组从0连续编号，array 和 variables 为独立快照。

probe 显示当前比较位置；边界更新后 mid=null；not-found 结束时 mid=null。仅 found/not-found 的 done=true，result 分别为命中下标/-1；其他步骤 result=null。

## 当前源码映射

API 的 `sourceLines` 是完整的 15 行 C/C++ 函数 `binary_search`，参数为数组、长度与目标值。以下为稳定映射，事件名称与 `lineId` 可以不同。

| event | lineId | 展示语句 |
|---|---|---|
| init | init-left | int left = 0; |
| probe | calc-mid | int mid = left + (right - left) / 2; |
| move-left | update-left | left = mid + 1; |
| move-right | update-right | right = mid - 1; |
| found | found | return mid; |
| not-found | not-found | return -1; |

其余源码行标识包括 `function-start`、`function-end`、`init-right`、`loop-check`、`probe-match`、`probe-less`、`probe-greater`、`loop-end` 和 `loop-end-2`。前端使用 API 的 `sourceLines` 渲染。

## 标准轨迹

输入 `[1,3,5,7,9]`，target=7；当前引擎输出5步，result=3：

| stepIndex | event | left | right | mid | lineId | done | result |
|---|---|---|---|---|---|---|---|
| 0 | init | 0 | 4 | null | init-left | false | null |
| 1 | probe | 0 | 4 | 2 | calc-mid | false | null |
| 2 | move-left | 3 | 4 | null | update-left | false | null |
| 3 | probe | 3 | 4 | 3 | calc-mid | false | null |
| 4 | found | 3 | 4 | 3 | found | true | 3 |

[单步人工样例](../../shared/examples/step.example.json)与标准轨迹第 0 步一致。[历史后端核验记录](backend-check-20261019.md)与 [PR #42 的本地回归](https://github.com/tw1l1ghtcc/datastructure-agent/pull/42)分别记录各自的验证范围。

## 消费者联调边界

播放、代码高亮和辅导共享同一 `runId` 与 `stepIndex`。回看读取已有步骤，问答保留发问时的步骤归属。前端挂载、通知、重置与销毁见[工作台说明](../../frontend/src/features/workbench/README.md)。

现有 Schema 约束字段类型、枚举及部分范围；安全整数、有序性、索引关系、事件/result一致性和快照独立性需业务验证。npm run check 不执行 Schema 或算法正确性验证。已实现行为与待确认事项见[接口对齐清单](contract-alignment.md)。
