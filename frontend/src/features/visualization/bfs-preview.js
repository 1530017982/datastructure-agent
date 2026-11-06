const svgNamespace = 'http://www.w3.org/2000/svg';

function svg(tag, attributes) {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

export function buildGraphPreview({ nodes, edges, directed, start }, name) {
  const canvas = svg('svg', { viewBox: '0 0 600 600', width: 440, height: 440, role: 'img' });
  canvas.setAttribute('aria-label', name + ' 图，' + (start === undefined ? '' : '起点 ' + start + '，') + '顶点 ' + nodes.join('、'));
  const marker = svg('marker', {
    id: 'graph-preview-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5,
    markerWidth: 6, markerHeight: 6, orient: 'auto'
  });
  marker.append(svg('path', { d: 'M 0 0 L 10 5 L 0 10 Z', fill: 'context-stroke' }));
  canvas.append(marker);
  const positions = new Map(nodes.map((node, index) => {
    const angle = index * 2 * Math.PI / nodes.length - Math.PI / 2;
    const radius = nodes.length === 1 ? 0 : Math.min(245, 92 + nodes.length * 6);
    return [node, [300 + radius * Math.cos(angle), 300 + radius * Math.sin(angle)]];
  }));
  const edgeElements = edges.map(([from, to, weight]) => {
    const [x1, y1] = positions.get(from);
    const [x2, y2] = positions.get(to);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dx = 19 * Math.cos(angle);
    const dy = 19 * Math.sin(angle);
    const reverse = directed && from !== to && edges.some(([u, v]) => u === to && v === from);
    const offset = reverse ? 12 : 0;
    const mx = (x1 + x2) / 2 - Math.sin(angle) * offset;
    const my = (y1 + y2) / 2 + Math.cos(angle) * offset;
    const d = from === to
      ? 'M ' + (x1 - 11) + ' ' + (y1 - 14) + ' c -28 -42 50 -42 22 0'
      : 'M ' + (x1 + dx) + ' ' + (y1 + dy) + ' Q ' + mx + ' ' + my + ' ' + (x2 - dx) + ' ' + (y2 - dy);
    const path = svg('path', { d, fill: 'none', stroke: '#8796ab', 'stroke-width': 2 });
    if (directed) path.setAttribute('marker-end', 'url(#graph-preview-arrow)');
    canvas.append(path);
    if (weight !== undefined) {
      const label = svg('text', {
        x: from === to ? x1 : mx, y: from === to ? y1 - 43 : my - (reverse ? 0 : 5),
        'text-anchor': 'middle', 'font-size': 14, fill: '#243049', stroke: 'white',
        'stroke-width': 4, 'paint-order': 'stroke'
      });
      label.textContent = weight;
      canvas.append(label);
    }
    return { from, to, path };
  });
  const circles = new Map();
  for (const [node, [x, y]] of positions) {
    const circle = svg('circle', { cx: x, cy: y, r: 18, fill: '#fff', stroke: '#65728a', 'stroke-width': 2 });
    const label = svg('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 14, fill: '#243049' });
    const name = Array.from(node);
    label.textContent = name.length > 4 ? name.slice(0, 3).join('') + '…' : node;
    const title = svg('title', {});
    title.textContent = node;
    const group = svg('g', { 'data-bfs-node': node });
    group.setAttribute('data-graph-node', node);
    group.append(title, circle, label);
    circles.set(node, circle);
    canvas.append(group);
  }

  return {
    element: canvas,
    showStep({ variables }) {
      const { currentNode, currentEdge, currentK, currentI, currentJ } = variables;
      const visited = variables.visited ?? variables.inMST ?? variables.resultOrder ?? [];
      const activeNodes = new Set([currentNode, currentK, currentI, currentJ]);
      for (const [node, circle] of circles) {
        circle.setAttribute('fill', activeNodes.has(node) ? '#ffdf9c' : visited.includes(node) ? '#ccebd7' : '#fff');
      }
      for (const { from, to, path } of edgeElements) {
        const active = currentEdge && ((from === currentEdge[0] && to === currentEdge[1]) ||
          (!directed && from === currentEdge[1] && to === currentEdge[0]));
        path.setAttribute('stroke', active ? '#a55b08' : '#8796ab');
        path.setAttribute('stroke-width', active ? '4' : '2');
      }
    }
  };
}
