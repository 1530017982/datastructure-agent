# API 契约 v1（设计，业务接口尚未实现）

同源前后端；`Content-Type: application/json`。当前只有GET `/api/health`返回200；下面业务接口全部返回501。成员04/05实现后更新本页状态。

| 方法与路径 | 输入/用途 | 计划返回 | 主责 |
|---|---|---|---|
| POST /api/algorithms/binary-search/runs | `{array:[1,3,5,7,9],target:7}` | runId、algorithm、sourceVersion、sourceLines、steps、result | 04 |
| GET /api/runs/:runId | 查服务端完整run | 同创建结果 | 04 |
| GET /api/runs/:runId/steps/:stepIndex | 查某个真实step | `{runId,step}` | 04 |
| POST /api/agent/explain | `{runId,stepIndex,question,hintLevel}` | answer、stepRefs、sourceRefs、usage | 05 |
| GET /api/knowledge/cards?topicId=binary-search | 已核验知识卡 | `{cards:[...]}` | 05+06 |
| GET /api/exercises?topicId=binary-search | 题目与选项，不提前返回答案 | `{exercises:[...]}` | 04+06 |
| POST /api/exercises/check | `{exerciseId,answer,hintLevel}` | correct、hint、必要时explanation | 04+07 |

## 字段口径

- 下标从0开始。重复值命中时返回一个实际匹配下标；未找到为-1。
- runId由后端生成，stepIndex是数组位置，不由模型猜。
- sourceLines为`[{lineId,text}]`，lineId与实际step对应。
- Agent hintLevel为1/2/3，question不能为空。客户端不传一份可被篡改的权威variables作为工具结果。
- sourceRefs至少包含cardId、sourceId、chapter、pages；引用只能来自已核验卡片。
- usage记录真实provider返回信息；没有token数据时注明unknown，不编造。价格、汇率与账单记录另作核验。

## 计划错误

统一形状`{error:{code,message}}`：INVALID_INPUT/400、RUN_NOT_FOUND/404、STEP_OUT_OF_RANGE/400、MODEL_NOT_CONFIGURED/503、MODEL_TIMEOUT/504、MODEL_UNAVAILABLE/502、BUDGET_LIMIT/429。骨架NOT_IMPLEMENTED/501不能当模型失败反馈。

输入建议限制为安全整数、小规模数组。具体长度与请求大小在04实现时冻结到本页；前后端一致。数组无序应提示修改，不偷偷排序改变学生输入。

题目评分由程序执行。固定提示由06整理，模型不可用时题目仍可完成。是否显示完整解析由提示等级及作答结果决定。
