import { createTraversalSource, generateDepthFirstSteps } from './binary-tree-depth-first.js';
export { MAX_NODES, DEFAULT_INPUT } from './binary-tree-util.js';

export const SOURCE_VERSION = 'binary-tree-preorder-c-v1';
const actions = ["visit","left","right"];
export const SOURCE_LINES = createTraversalSource('preorder', actions);

export function generateBinaryTreePreorderSteps(input) {
  return generateDepthFirstSteps(input, {
    algorithm: 'binary-tree-preorder',
    actions,
    sourceVersion: SOURCE_VERSION,
    sourceLines: SOURCE_LINES,
  });
}
