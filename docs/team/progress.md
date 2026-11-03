# 团队任务看板

更新：2026-11-03（北京时间）。核对至 `main` 的 `8a909c2`（PR #42）。本表记录仓库可核验交付，独立验收与线下成果按实际证据记录。详见[当前项目状态](../architecture/current-status.md)。

团队名称为「看懂每一步」，十名成员已登记。见[成员登记表](roster.md)。

## 当前交付

- 04已交付确定性二分查找、运行与单步接口、输入限制、内存保存与过期清理。PR #42 将展示源码补成完整的 `binary_search` 函数。
- 06已交付自编二分查找知识卡、10 道题及固定提示、11 组人工预期和早期覆盖规划。PR #42 的 10 道冒泡排序题由 01 后续补齐。自编来源的口径见[范围记录](../product/scope.md)。
- 04已接入06题库，公开题目不泄露答案，程序判分及提示接口可用。01独立后端检查26/26通过，见[核验记录](../architecture/backend-check-20261019.md)。
- 09需求v0.9、五页可点击原型、七张截图、彩色/单色标志与导出、思维导图/领域模型、40项覆盖规划已合并。见[原型入口](../prototype/README.md)和[09检查记录](../product/review-20261020.md)；本轮核对文件与入口，不把PR中的浏览器检查报告视为01重跑或08验收。
- 03动画/播放核心已合并；02正式工作台已装配04真实run、03动画/播放和05共享辅导并合并。当前主分支补齐07固定过程练习、三级提示、错题重练、版本快照和本机学习记录，已完成无模型Key的本地浏览器检查。
- 01本地检查不代表08交叉验收，也不代表真实模型效果或真实学生试用已经通过。
- PR #18模型适配/聊天/用量/限流预算、#20按问题检索已合并；当前主分支聊天按用户确认改为直接模型问答，带当前/上一步、源码和最近10轮；不再检索或显示知识卡出处，知识阅读接口保留。显式Mock优先，真实模式需后端Key；本地测试未访问付费模型，真实效果案例仍无验收证据。

- [PR #38](https://github.com/tw1l1ghtcc/datastructure-agent/pull/38) 加入八章笔记与 71 个目录入口。[PR #39](https://github.com/tw1l1ghtcc/datastructure-agent/pull/39) 合并两份设计说明书。
- [PR #40](https://github.com/tw1l1ghtcc/datastructure-agent/pull/40) 加入新版数组动画与冒泡排序演示。[PR #42](https://github.com/tw1l1ghtcc/datastructure-agent/pull/42) 补齐冒泡步骤问答、练习、错题重练、笔记入口与本机代码编译回放。
- [PR #36](https://github.com/tw1l1ghtcc/datastructure-agent/pull/36) 的展示与博客材料已合并，旧 PPT 草稿 PR #19 已关闭。

## 成员进度

| 成员 | 主责 | 当前可核验状态 | 依据 | 下一步 |
|---|---|---|---|---|
| 01 包学丰 | 统筹与集成、公共契约 | 统筹文档已合并；后端审查完成，本轮同步现状与契约；核心程序已接入并完成01本地回归；08独立验收待完成 | [#2](https://github.com/tw1l1ghtcc/datastructure-agent/pull/2)、[#8](https://github.com/tw1l1ghtcc/datastructure-agent/pull/8)、[接口对齐](../architecture/contract-alignment.md) | 同步现行文档、收集08独立验收及真实材料 |
| 02 蒋书瑞 | 工作台、前端入口 | PR #17已合并：输入/请求隔离、源码/变量、03播放动画、05辅导已装配并通过本地检查 | [#17](https://github.com/tw1l1ghtcc/datastructure-agent/pull/17)、[验收](../architecture/workbench-check-20261022.md) | 08独立复核；当前主分支由01完成代码/动画并排、横排变量、可收起侧栏及悬浮辅导，已接07挂载/上下文 |
| 03 冯玄 | 动画与播放 | 核心已合并，当前主分支02已在正式入口消费；08复核待完成 | [#14](https://github.com/tw1l1ghtcc/datastructure-agent/pull/14)、[02接入说明](../../frontend/src/features/visualization/C02-INTEGRATION.md) | 当前主分支由01恢复03窗口、平移缩放和真实时间轴，并按用户确认改为白底；配合08复核 |
| 04 林为峰 | 引擎、run、后端入口 | 后端模块已合并并通过01独立检查，已由02/03/05消费；当前主分支07读题/判分联调通过，08独立复核待完成 | [#10](https://github.com/tw1l1ghtcc/datastructure-agent/pull/10) | 配合08独立复核和后续容量策略确认 |
| 05 郑瀚 | Agent、检索与聊天 | 模型适配/聊天与问题检索已合并；当前主分支已消费工作台上下文，真实效果待验收 | [#18](https://github.com/tw1l1ghtcc/datastructure-agent/pull/18)、[#20](https://github.com/tw1l1ghtcc/datastructure-agent/pull/20) | 真实Key联调，配合08提供真实对比及用量证据 |
| 06 秦文贵 | 知识与题目 | 已提交二分查找知识卡与题库，程序判分已接入并由 01 本地检查 | [#7](https://github.com/tw1l1ghtcc/datastructure-agent/pull/7)、[接入说明](../../content/exercises/HANDOFF.md) | 配合后续内容扩展和 08 复核 |
| 07 吴圣洲 | 练习记录与真实调研 | PR #21由01按用户授权代补代码并已合并，练习/三级提示/错题/本机进度通过本地检查；不计为07本人提交 | 登记[#9](https://github.com/tw1l1ghtcc/datastructure-agent/pull/9)、实现[#21](https://github.com/tw1l1ghtcc/datastructure-agent/pull/21)、[代码检查](../architecture/exercises-check-20261023.md) | 配合08独立验收；07仍须提供真实访谈/试用及匿名汇总 |
| 08 乔震宇 | 测试与效果对比 | 已登记；未见本人提交的业务测试/效果验收成果 | 登记[#4](https://github.com/tw1l1ghtcc/datastructure-agent/pull/4)、[#5](https://github.com/tw1l1ghtcc/datastructure-agent/pull/5) | 独立复核04/06，验收联动并组织真实模型三案例对比 |
| 09 王元豪 | 原型与需求 | 可审阅设计成果已合并 | [#12](https://github.com/tw1l1ghtcc/datastructure-agent/pull/12)、[需求](../product/requirements.md)、[原型](../prototype/README.md) | 配合核对设计与现行功能的一致性 |
| 10 刘运昆 | PPT、博客与演示 | 展示、博客及演示材料已有仓库交付 | [#16](https://github.com/tw1l1ghtcc/datastructure-agent/pull/16)、[#36](https://github.com/tw1l1ghtcc/datastructure-agent/pull/36) | 按课程要求核对发布和提交情况 |

主责路径仍按[十人分工](assignments.md)和[个人任务单](tasks/)执行；02整合前端入口，04整合后端入口，01协调公共契约及依赖。未见合并实现不等于队员线下没有工作。

## 剩余检查点

- PR #42 已通过 01 本地回归。08 独立验收、真实模型对比和学生试用仍需各自记录证据。
- 原日期计划见[详细方案](plan-a-detailed.md)。第二次作业的原型与说明书入口见[仓库 README](../../README.md#09原型预览)。

每次更新填写实际PR、下一步、阻塞与证据。静态检查、后端离线检查与完整业务验收分别记录；联调结果归入[集成清单](integration-checklist.md)。
