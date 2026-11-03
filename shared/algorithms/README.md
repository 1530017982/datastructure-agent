# 算法与展示代码（成员04，06核对内容）

最终阶段的空实现文件按 A–G 放在 [final/](final/)。每个文件对应一个待做算法或演示项。负责人和逐项交付要求见[最终任务清单](../../docs/team/final/README.md)。工作台由本轮 01 统一协调接入通过验收的实现。

binarySearch.js 已实现确定性二分查找，导出 generateSteps、SOURCE_VERSION=c-v2、SOURCE_LINES。工作台展示完整的 C/C++ 函数 binary_search，由同一文件提供稳定 lineId。HTTP 输入校验位于后端路由。

引擎轨迹与展示源码同版本；内容题目允许用独立 algorithmContractId 标识静态场景，不把 sourceVersion=null 误认为真实run。见[状态契约](../../docs/architecture/trace-contract.md)。01已独立核对，06内容/03播放/02高亮及08交叉验收仍需联调。
