# 看懂每一步

面向 408 数据结构学习的可视化工作台。输入一组数据，沿时间轴逐步查看算法执行，动画、源码高亮和变量同步变化。遇到看不懂的一步，可以提问，再做一道过程题检验自己的理解。

## 现在能做什么

| 功能 | 当前支持 |
| --- | --- |
| 算法工作台 | 二分查找、冒泡排序。支持换输入、播放、单步、回看和源码高亮。 |
| 课程目录与笔记 | 八章笔记、71 个目录入口。二分查找和冒泡排序可从笔记跳到对应工作台。 |
| 步骤辅导 | 对当前运行步骤提问，支持三级提示和同次运行内的连续追问。 |
| 过程练习与错题 | 二分查找、冒泡排序各 10 道固定过程题。程序判分，支持分级提示和错题重练，记录保存在当前浏览器。 |
| 自定义代码 | Windows x64 本机可编译受限的 C/C++ 整数数组函数，回放实际写入并高亮对应源码。 |

详细的实现范围和验收状态见[当前项目状态](docs/architecture/current-status.md)。

## 本地运行

需要 Node.js 22.9 或以上版本。在 PowerShell 中执行：

```powershell
git clone https://github.com/tw1l1ghtcc/datastructure-agent.git
Set-Location datastructure-agent
npm start
```

打开 <http://127.0.0.1:3000>。可以先选**二分查找**，输入数组 `1,3,5,7,9` 和目标 `7`，运行后单步查看如何缩小区间，最终命中下标 `3`。内置动画、学习笔记和过程题可直接使用。

### 步骤辅导

需要体验问答时，将 `.env.example` 复制为 `.env` 并重启服务。示例默认用 `AGENT_MOCK=true` 返回开发模板。要调用真实模型，将其设为 `false` 并填写 `DEEPSEEK_API_KEY`。密钥放在本地 `.env`。配置项和用量说明见[步骤辅导服务](backend/src/agent/README.md)。

### 自定义代码

Windows x64 所需的 Open Watcom 编译器、链接器、头文件和库随仓库提供。克隆或更新仓库后，用 `npm start` 启动即可。工具链来源和许可证见 [Open Watcom 说明](third_party/open-watcom/README.md)。

打开[自定义代码工作台](http://127.0.0.1:3000/#workbench?algorithm=custom-array)，点「填入示例」，编辑 `void sort(int a[], int n)` 后点「编译并运行」。支持整数、数组读写、条件和循环。

## 最终阶段分工

01 负责统筹和集成，02 负责动画和播放，03 负责 PPT、博客和演示。04–10 依次负责 A–G 七个算法包。本轮计划接入 **54 个演示项**，每项已有独立实现文件。各组先交一个代表算法，与工作台联调通过后再分批接入。

| 要找什么 | 入口 |
| --- | --- |
| 本轮编号与负责人 | [最终任务登记表](docs/team/final/roster.md) |
| 算法分工、实现文件和验收要求 | [最终任务清单](docs/team/final/README.md) |
| PR、交付状态和验收证据 | [最终进度表](docs/team/final/progress.md) |

开发前看 [Fork / PR 协作规范](CONTRIBUTING.md)、[接口约定](docs/architecture/api-contract.md)和[执行状态约定](docs/architecture/trace-contract.md)。提交前运行 `npm run check` 和相关测试，附正常与边界样例。完整测试命令见[测试说明](tests/README.md)。

<a name="09原型预览"></a>

## 设计与展示资料

[墨刀交互原型](https://modao.cc/proto/3HJhnZvjtnx1qi8zOJuwJ2/sharing?view_mode=device&screen=rbpVZtVdCQxwcw14I&canvasId=rcVZvCWugvUqKI16) · [系统设计说明书](docs/design/看懂每一步_系统设计说明书.pdf) · [数据库设计说明书](docs/design/看懂每一步_数据库设计说明书.pdf)

第一次作业以二分查找演示为主。原分工、日程和验收记录见[第一阶段归档](docs/team/phase-1/README.md)。

## 代码目录

| 目录 | 内容 |
| --- | --- |
| `frontend/` | 学习页面、动画、步骤辅导和本地错题记录 |
| `backend/src/` | Node.js 服务、运行接口、判分、模型调用和本机编译 |
| `shared/algorithms/` | 已接入的算法实现，`final/` 存放本轮各包的实现文件 |
| `content/` | 知识卡、题库、资料出处和覆盖规划 |
| `docs/`、`tests/` | 设计与协作文档、自动化检查和回归测试 |
