# 二分查找执行状态 v1

本页是待实现模块的共同规范。`shared/examples/step.example.json`只是人工协议示例，不是引擎运行结果。

现有事件与字段保持不变；C/C++展示源码和正式行映射待04提供，再由相关成员核对。Schema目前约束字段类型、枚举及部分范围，没有完整验证安全整数、有序性、索引关系或事件与结果的对应关系；`npm run check`也不执行Schema验证。待确认及核验责任见 [接口对齐清单](contract-alignment.md)。

## 算法约定

首版采用闭区间[left,right]，零起始下标，mid向下取整。找到返回匹配位置；未找到返回-1。允许重复值，不承诺返回第一个或最后一个。

初始化left=0，right=array.length-1，mid=null；空数组right=-1，产生初始化及未找到结束步骤。区间为空不能访问数组。

## 每一步

格式见`shared/schemas/step.schema.json`。固定字段：schemaVersion、algorithm、stepIndex、event、sourceVersion、lineId、array、target、variables、done、result。

- event：init、probe、move-left、move-right、found、not-found。
- probe：展示本轮比较时的left/right/mid。
- move-left：更新左边界后的快照；move-right：更新右边界后的快照。更新后mid置null，下一probe再计算，避免过期指针被解释成新状态。
- found/not-found：done=true，result为匹配下标或-1。未结束result=null。
- 每一步必须独立快照，后续修改不能改变历史步骤。
- lineId使用稳定标识（如init、probe、update-left），不是随排版变化的行号。展示代码映射由04提供。

03播放任意step时，02、05、07收到同一个runId/stepIndex。回看恢复旧状态，不重新生成轨迹。Agent答案应标明针对哪个step，切换步骤不改写已经回答的引用。

## 联调顺序

01/04先锁定sourceVersion与行映射；02/03用协议样例做布局；04输出标准案例完整轨迹；08独立核验；最后05接入状态工具。Agent解释不能替代轨迹正确性验证。
