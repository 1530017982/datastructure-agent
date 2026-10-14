# 团队任务看板

更新日期：2026-10-14（北京时间）。用户已授权 Codex 按成员01辅助统筹与集成；这不代表真实姓名、学号或账号已登记，成员登记表保持原有五列和待填信息。

本次核验基线为 main `de37330386c595c47bf433252122d06a9e0a1c34`，创建本轮分支前 GitHub 没有 PR 或 Issue。仓库只实现静态页面与健康检查，业务接口仍为占位。下表的“未开始（仓库）”表示未见可核验实现或成果，线下进度与真实认领情况待队员补充，不据此推断队员没有工作。

| 成员 | 任务 | 主责路径 | 状态 | PR/成果链接 | 阻塞或下一步 | 验收证据 |
|---|---|---|---|---|---|---|
| 01 | 统筹与集成 | docs/team、docs/architecture、shared/schemas、scripts、根配置协调 | 开发中：首批统筹文档待审核；业务集成未开始 | [文档PR #2](https://github.com/tw1l1ghtcc/datastructure-agent/pull/2)、[接口对齐清单](../architecture/contract-alignment.md)、[集成清单](integration-checklist.md) | 收集真实登记、负责人确认及模块 PR；不代填身份 | [本地核验](../architecture/takeover-check.md)；尚未完成全流程验收 |
| 02 | 工作台 | frontend/index.html、src/app.js、styles、features/workbench、services | 未开始（仓库） | 待提交 | 确认输入、响应、行映射与步骤通知契约 | 待真实页面操作证据 |
| 03 | 动画与播放 | frontend/src/features/visualization、playback | 未开始（仓库） | 待提交 | 与02对齐模块接口，接04真实轨迹 | 待播放、回看及计时器检查 |
| 04 | 引擎与接口 | backend/src/algorithms、runs、routes、server.js、shared/algorithms | 未开始（仓库） | 待提交 | 提供限制、源码行映射及实际轨迹；与01和消费者确认 | 待08独立预期核验 |
| 05 | Agent | backend/src/agent、knowledge、frontend/src/features/agent | 未开始（仓库） | 待提交 | 需要真实状态、核验知识及团队模型账户；当前不做付费调用 | 待真实引用、失败处理与用量记录 |
| 06 | 知识与题目 | content/knowledge、exercises、sources、coverage | 未开始（仓库） | 待提交 | 卡片/题库为空；教材章节页码待实际核验 | 待内容、答案及出处复核 |
| 07 | 练习记录与调研 | frontend/src/features/exercises、records、docs/research | 未开始（仓库） | 待提交 | 对齐判分/提示格式；真实访谈及试用证据待提供 | 待刷新记录、提示及匿名调研汇总 |
| 08 | 测试与效果对比 | tests、docs/evaluation | 未开始（仓库） | 待提交 | 先独立推演预期；真实对比待实现和模型条件具备 | 待边界、联动、异常和三案例证据 |
| 09 | 原型与需求 | docs/product、prototype、architecture/diagrams | 未开始（仓库） | 待提交 | 完善正式版设计；调研及官方覆盖依据待补 | 待原型、需求、图示与范围核对 |
| 10 | PPT博客与演示 | docs/presentation；登记与01协作 | 未开始（仓库） | 待提交 | 收集真实团队资料和成果；样例运行后录屏 | 待材料一致性及10分钟演练 |

## 更新方式

每次更新写明实际成果/PR、下一步、阻塞和证据。使用未开始/开发中/待联调/已验收，协议mock、文档计划和静态检查不计为业务验收。负责人确认记录归入 [接口对齐清单](../architecture/contract-alignment.md)，集成结果归入 [集成清单](integration-checklist.md)。

每位队员至少一个可复核PR。17日首次联调，19日第二次集成，21日全流程验收，22日完成并冻结范围；23日至24日答辩前修复、复测和演练，24日答辩，25日博客提交。每次核验远程后更新基线和PR记录，不把本页初次核验状态沿用为后续实时状态。
