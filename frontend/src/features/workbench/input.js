function integer(text, label) {
  if (!/^[+-]?\d+$/.test(text) || !Number.isSafeInteger(Number(text))) throw new Error(`${label}必须为十进制安全整数。`);
  return Number(text);
}
function parseArray(arrayText, limit) {
  const text = arrayText.trim();
  const values = text ? text.split(/[,，]/).map(value => value.trim()) : [];
  if (values.length > limit) throw new Error(`数组最多包含 ${limit} 个元素。`);
  return values.map(value => integer(value, '数组元素'));
}

export function parseInput(arrayText, targetText, algorithm = 'binary-search') {
  if (algorithm === 'bubble-sort') return { array: parseArray(arrayText, 24) };
  if (algorithm === 'custom-array') {
    const array = parseArray(arrayText, 24);
    if (array.some(value => value < -2147483648 || value > 2147483647)) throw new Error('自定义代码使用 32 位整数。');
    return { array };
  }
  const targetValue = targetText.trim();
  if (!targetValue) throw new Error('目标不能为空。');
  const target = integer(targetValue, '目标');
  const array = parseArray(arrayText, 100);
  if (array.some((value,i) => i > 0 && value < array[i-1])) throw new Error('数组必须按非递减顺序排列，请勿自动排序或去重。');
  return { array, target };
}

function validVariables(step, algorithm) {
  const variables = step.variables;
  if (!variables) return false;
  if (algorithm === 'custom-array') {
    const { line, index, writes } = variables;
    return typeof step.description === 'string' && Number.isInteger(line) && line > 0 && String(line) === step.lineId &&
      Number.isInteger(writes) && writes >= 0 &&
      (index === null || (Number.isInteger(index) && index >= 0 && index < step.array.length));
  }
  if (algorithm === 'bubble-sort') {
    const { index, pass, sortedFrom } = variables;
    return typeof step.description === 'string' && Number.isInteger(pass) && pass >= 0 &&
      Number.isInteger(sortedFrom) && sortedFrom >= 0 && sortedFrom <= step.array.length &&
      (index === null || (Number.isInteger(index) && index >= 0 && index + 1 < step.array.length));
  }
  return Number.isSafeInteger(variables.left) && Number.isSafeInteger(variables.right) &&
    (variables.mid === null || Number.isSafeInteger(variables.mid));
}

export function validateRun(run, algorithm = 'binary-search') {
  if (!run || typeof run.runId !== 'string' || !run.runId || run.algorithm !== algorithm || typeof run.sourceVersion !== 'string' || !run.sourceVersion ||
      !Array.isArray(run.steps) || !run.steps.length || !Array.isArray(run.sourceLines) || !run.sourceLines.length) throw new Error('运行数据不完整，无法展示步骤。');
  const ids = new Set(run.sourceLines.map(line => line?.lineId));
  if (ids.size !== run.sourceLines.length || run.sourceLines.some(line => typeof line?.lineId !== 'string' || typeof line.text !== 'string') ||
      run.steps.some((step,i) => !step || step.stepIndex !== i || !ids.has(step.lineId) || !Array.isArray(step.array) ||
        !validVariables(step, algorithm))) throw new Error('步骤或源码映射不完整，无法同步展示。');
  return run;
}
