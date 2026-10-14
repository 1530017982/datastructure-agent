# 内容数据规范（成员 06 主责）

当前题库和知识卡为空，不能据此声称检索或教学内容已经完成。

知识卡字段：`id, topicId, title, content, keywords, sourceId, chapter, pages, verified`。只让 `verified=true` 且出处已核验的知识卡进入正式 Agent 检索。未提供原文时不猜页码。

题目字段：`id, topicId, type, prompt, context, options, answer, explanation, hints, sourceRefs, verified`。`type` 首版为 choice/judgement/value；hints 最多三级。程序评分依据 answer，不交给模型自行决定。展示题目接口不得提前返回答案。

首版题目建议：中点计算、更新哪一边、找不到目标、重复值、空数组。排序范围和代码版本必须与题目一致。

知识来源以团队手头《王道数据结构 2027》实际内容为准；保存团队整理的说明和定位信息，不把整本扫描件放进公开仓库。
