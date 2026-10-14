# Fork 与 PR 协作

## 先认领

成员编号代表角色，不是实际账号。先在 `docs/team/roster.md` 登记，由成员 01 确认角色。每人读自己的任务单；公共文件由成员 01 协调修改。

## 建立自己的副本

在 GitHub 上点击 Fork。下面把 `YOUR_USERNAME` 替换为自己的 GitHub 用户名：

```powershell
git clone https://github.com/YOUR_USERNAME/datastructure-agent.git
cd datastructure-agent
git remote add upstream https://github.com/tw1l1ghtcc/datastructure-agent.git
git fetch upstream
git switch -c feat/m02-workbench upstream/main
```

分支名称换成个人任务单中的建议名称。每次新任务开始前从最新 `upstream/main` 建新分支。

## 提交与同步

只提交自己负责的文件，提交消息写清结果。同步过程中有冲突时，核对双方实现后再解决，不直接覆盖别人的代码。

```powershell
npm run check
git status
git add frontend/index.html frontend/src/features/workbench/
git commit -m "feat: add binary search input workbench"
git push -u origin feat/m02-workbench
```

以上文件路径只是成员 02 的示例；其他成员使用自己的实际路径。

GitHub 创建 PR：base=`tw1l1ghtcc/datastructure-agent:main`，compare=自己的功能分支。按 PR 模板填写结果、运行方式、验收截图/输出、未完成项。

## 合并节奏

- 10 月 15 日前提交模块接口或初步成果；不等全部做完才发第一次 PR。
- 10 月 17 日前提交可联调版本；10 月 19 日前完成主要功能集成。
- 10 月 22 日完成并冻结本次演示范围；23 日至 24 日答辩前预留约一天半，优先修复、复测和演练，不增加新功能。
- 成员 01 负责集成；相关模块负责人复核。确认公共字段与实际验收后合并。

## 主分支保护与审核

2026-10-14 已通过 GitHub API 重新确认 `main` 的 `protected=true`。此前初始化时“没有修改分支保护”的说明已过时。

交接记录中的详细配置为：必须通过 PR、至少一次批准、新的可审核提交撤销旧批准、禁止强制推送及删除 main；未开启管理员强制遵守或必过状态检查。本轮连接器读取详细保护配置返回 403，因此这些细项属于交接记录，尚未重新核验。当前仓库没有 CI 工作流文件，不能把本地检查通过说成 GitHub CI 已通过。

团队流程由成员 01/所有者组织审核合并，相关模块负责人复核；没有证据表明已配置“只能由所有者批准”的 Code Owners 规则。所有者也按独立分支和 PR 工作。需要调整保护规则时另行协调，本次文档修改不更改 GitHub 设置。

公共契约待确认事项见 [接口对齐清单](docs/architecture/contract-alignment.md)。在相关负责人确认前，不把候选字段或限制当作已冻结约定；PR 写明确认依据和受影响消费者。

## 使用 AI 辅助开发

把个人任务单、接口文档和状态格式一并提供给 AI。本人负责理解输出、执行验收及解释代码。不要把未运行的代码、协议 mock 或 AI 编造的出处当作真实结果。
