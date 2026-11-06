const commentAnchors = {
  floyd: { 'init-dist': 'init' },
  'topological-sort': { 'calc-degree': 'init-degree', 'push-zero': 'init-queue' },
  'block-search': { 'block-selected': 'inner-loop' }
};

// Match quoted literals before comments so comment markers inside literals stay visible.
const sourceTokens = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[^]*?\*\/|\/\/[^\r\n]*/g;

export function displaySourceLines(run) {
  const lines = run.sourceLines ?? [];
  if (run.algorithm === 'custom-array') return lines;
  return lines
    .map(line => ({ ...line, text: line.text.replace(sourceTokens, token => token.startsWith('/') ? ' ' : token).trimEnd() }))
    .filter(line => line.text.trim());
}

export function displayLineId(algorithm, lineId) {
  const anchors = Object.hasOwn(commentAnchors, algorithm) ? commentAnchors[algorithm] : null;
  return anchors && Object.hasOwn(anchors, lineId) ? anchors[lineId] : lineId;
}
