import { createTraversalSource, generateDepthFirstSteps } from './binary-tree-depth-first.js';
export { MAX_NODES, DEFAULT_INPUT } from './binary-tree-util.js';

export const SOURCE_VERSION = 'binary-tree-inorder-c-v1';
const actions = ["left","visit","right"];
export const SOURCE_LINES = createTraversalSource('inorder', actions);

export function generateBinaryTreeInorderSteps(input) {
  return generateDepthFirstSteps(input, {
    algorithm: 'binary-tree-inorder',
    actions,
    sourceVersion: SOURCE_VERSION,
    sourceLines: SOURCE_LINES,
  });
}
