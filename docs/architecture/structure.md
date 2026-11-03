# 模块结构与依赖

技术方案为原生 HTML/CSS/JavaScript 和 Node.js。内置算法与练习可直接运行，步骤问答可配置 DeepSeek。Windows 本机自定义代码另需 Open Watcom。浏览器回归需要 Playwright 和浏览器。

| 目录 | 职责 | 负责人 |
|---|---|---|
| frontend/src/features/workbench | 输入、代码变量、模块装配 | 02 |
| frontend/src/features/visualization、playback | 动画、播放指针 | 03 |
| frontend/src/features/agent | 步骤聊天、提示级别、原步骤归属 | 05 |
| frontend/src/features/exercises、records | 练习、本机记录 | 07 |
| frontend/src/services | 同源接口调用；错误统一呈现 | 02，公共契约01 |
| backend/src/algorithms | 引擎目录说明；当前实现见shared/algorithms | 04 |
| backend/src/runs | 服务端run保存、step查询 | 04 |
| backend/src/routes | 内置算法运行、练习、判分和查询 | 04，01 集成 |
| backend/src/custom-code | 校验受限 C/C++ 源码，调用本机工具链，生成数组快照和源码行号 | 01 |
| backend/src/agent | 模型适配、工具协调、使用记录 | 05 |
| backend/src/knowledge | 检索已核验知识卡 | 05，数据06 |
| shared/algorithms | 二分查找和冒泡排序的确定性引擎、C/C++ 展示函数与行号映射 | 04，01 集成 |
| shared/schemas、examples | 版本化契约，人工协议示例 | 01+04 |
| content | 知识、题目、出处、覆盖表 | 06 |
| docs/product、prototype、architecture/diagrams | 需求v0.9、独立交互原型、标志、覆盖规划与领域图 | 09，01协调复核 |

## 单一执行来源

内置算法由确定性引擎生成 `run.steps`，自定义代码由实际执行记录生成步骤。动画、源码和变量使用同一播放位置。步骤问答读取内置算法的服务端快照。

一次运行的输入固定，更改后创建新运行。旧播放、聊天关联和练习上下文按 `runId` 隔离。

## 当前接入

PR #42 合并后，两个内置算法共用 SVG 动画、步骤问答、过程题和本机记录。学习笔记按章节加载 HTML，小节链接可选中对应工作台。早期设计原型位于 `docs/prototype`，使用专用预览服务和独立存储。现行功能与验证范围见[当前状态](current-status.md)。

测试统一放tests/，内容校验保留content/validate.mjs，实际验收证据放docs/architecture/evidence/；日常命令见[测试说明](../../tests/README.md)。早期完整dev页面及模拟fixtures已由正式入口替代；其中03可复用窗口已在主分支恢复为生产模块window.js/window.css，并按用户确认改为白底及并排工作台；根目录不再存放临时审查脚本和输出。
