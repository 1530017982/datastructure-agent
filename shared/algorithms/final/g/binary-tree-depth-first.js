import { normalizeTree } from './binary-tree-util.js';

export function createTraversalSource(functionName, actions) {
  const lines = [
    ['node', 'typedef struct { int left, right; } Node;'],
    ['entry', 'typedef struct { int node, level; } Entry;'],
    ['helper', `void ${functionName}_visit(const Node nodes[], int node, int level, Entry output[], int *count) {`],
    ['enter', '  int left = nodes[node].left;'],
    ['right-child', '  int right = nodes[node].right;'],
  ];
  for (const action of actions) {
    if (action === 'visit') {
      lines.push(
        ['visit', '  output[*count].node = node;'],
        ['visit-level', '  output[*count].level = level;'],
        ['visit-advance', '  (*count)++;'],
      );
    } else {
      lines.push(
        [`${action}-check`, `  if (${action} >= 0) {`],
        [`traverse-${action}`, `    ${functionName}_visit(nodes, ${action}, level + 1, output, count);`],
        [`resume-${action}`, '  }'],
      );
    }
  }
  lines.push(
    ['return', '  return;'],
    ['helper-end', '}'],
    ['function', `int ${functionName}(const Node nodes[], int root, Entry output[]) {`],
    ['init', '  int count = 0;'],
    ['root-check', '  if (root >= 0) {'],
    ['traverse-root', `    ${functionName}_visit(nodes, root, 1, output, &count);`],
    ['root-check-end', '  }'],
    ['done', '  return count;'],
    ['function-end', '}'],
  );
  return lines.map(([lineId, text]) => ({ lineId, text }));
}

export function generateDepthFirstSteps(input, { algorithm, actions, sourceVersion, sourceLines }) {
  const nodes = normalizeTree(input);
  const stack = [];
  const order = [];
  const steps = [];

  function record(event, lineId, description, childNode = null) {
    const current = stack.at(-1);
    const done = event === 'done';
    steps.push({
      schemaVersion: '1.0',
      algorithm,
      stepIndex: steps.length,
      event,
      sourceVersion,
      lineId,
      description,
      variables: {
        root: input.root,
        nodes: Array.from(nodes.values(), node => ({ ...node })),
        stack: stack.map(frame => ({ ...frame })),
        currentNode: current?.id ?? null,
        level: current?.level ?? null,
        childNode,
        order: [...order],
      },
      done,
      result: done ? [...order] : null,
    });
  }

  function visit(id, level) {
    const node = nodes.get(id);
    const frame = { id, level, phase: 'enter' };
    stack.push(frame);
    record('enter', 'enter', `进入第 ${level} 层节点 ${id}，压入递归栈。`);
    for (const action of actions) {
      frame.phase = action;
      if (action === 'visit') {
        order.push(id);
        record('visit', 'visit', `访问节点 ${id}，追加到访问序列。`);
      } else {
        const child = node[action];
        if (child === null) continue;
        const side = action === 'left' ? '左' : '右';
        record('descend', `traverse-${action}`, `从 ${id} 递归进入${side}孩子 ${child}。`, child);
        visit(child, level + 1);
        record('resume', `resume-${action}`, `${side}子树处理完成，回到节点 ${id}。`, child);
      }
    }
    frame.phase = 'return';
    record('return', 'return', `节点 ${id} 处理完成，返回上一层。`);
    stack.pop();
  }

  record('init', 'init', '初始化访问序列和递归栈。');
  if (input.root !== null) visit(input.root, 1);
  record('done', 'done', order.length ? '递归栈已空，遍历结束。' : '空树没有可访问的节点。');
  return { steps, result: order, sourceVersion, sourceLines };
}
