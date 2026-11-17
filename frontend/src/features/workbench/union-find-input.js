export function validateUnionFindInput(input) {
  if (!input || !Array.isArray(input.elements) || !Array.isArray(input.operations)) throw new Error('请提供元素列表和操作列表。');
  const { elements, operations } = input;
  if (!elements.length || elements.length > 30) throw new Error('请输入 1 到 30 个元素。');
  if (elements.some(value => typeof value !== 'string' || !value.trim()) || new Set(elements).size !== elements.length) {
    throw new Error('元素名称必须为非空且不能重复。');
  }
  if (operations.length > 60) throw new Error('最多添加 60 个操作。');
  operations.forEach((op, index) => {
    if (!Array.isArray(op) || !['find', 'union'].includes(op[0]) || op.length !== (op[0] === 'find' ? 2 : 3)) {
      throw new Error('第 ' + (index + 1) + ' 个操作格式有误。');
    }
    if (op.slice(1).some(value => !elements.includes(value))) {
      throw new Error('第 ' + (index + 1) + ' 个操作引用了无效或已删除的元素。');
    }
  });
  return { elements: [...elements], operations: operations.map(op => [...op]) };
}
