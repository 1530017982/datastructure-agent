import { graphMaxEdges, graphMaxWeight } from './graph-algorithms.js';

const demoNodes = ['A', 'B', 'C', 'D', 'E'];
const demoEdges = [['A', 'B'], ['A', 'C'], ['B', 'D']];

export function createGraphForm({ message, onChange }) {
  const byId = id => document.getElementById(id);
  const nodesInput = byId('bfs-nodes');
  const start = byId('bfs-start');
  const directed = byId('bfs-directed');
  const edgeList = byId('bfs-edges');
  const add = byId('bfs-add-edge');
  let nodes = [];
  let config = null;
  const maxNodes = () => config?.maxNodes ?? 30;
  const isDirected = () => config?.directed ?? (directed.value === 'true');
  const focusConnections = () => (config.start ? start : add).focus();
  let connections = false;
  let collapsed = false;

  const readNodes = () => nodesInput.value.trim().split(/[,，\s]+/).filter(Boolean);

  function updateCount() {
    byId('bfs-count').textContent = '共 ' + readNodes().length + ' 个顶点（最多 ' + maxNodes() + ' 个）';
  }

  function setOptions(select, previous) {
    select.replaceChildren(new Option('请选择', ''), ...nodes.map(node => new Option(node, node)));
    if (previous && !nodes.includes(previous)) {
      select.add(new Option('已删除：' + previous, previous));
    }
    select.value = previous || '';
    select.setAttribute('aria-invalid', String(Boolean(previous && !nodes.includes(previous))));
  }

  function updateButtons() {
    const active = Boolean(config);
    const editing = active && !collapsed;
    byId('bfs-run-summary').hidden = !active || !collapsed;
    byId('bfs-fields').hidden = !editing;
    byId('fillDemo').parentElement.hidden = active && collapsed;
    byId('bfs-next').hidden = !editing || connections;
    byId('bfs-back').hidden = !editing || !connections;
    byId('startBtn').hidden = active && (!editing || !connections);
    byId('bfs-vertices').hidden = connections;
    byId('bfs-connections').hidden = !connections;
  }

  function updateEdgeFields() {
    const arrow = isDirected();
    byId('graph-edge-help').textContent = (arrow ? '按起点 → 终点添加边。' : '无向边只需添加一次。') +
      (config.weighted ? '每条边都需要填写权重。' : '边可以留空。');
    for (const row of edgeList.children) {
      const [from, to] = row.querySelectorAll('label span');
      from.textContent = arrow ? '起点' : '端点 1';
      to.textContent = arrow ? '终点' : '端点 2';
      row.querySelector('.graph-weight').hidden = !config.weighted;
      row.classList.toggle('weighted-edge', Boolean(config.weighted));
    }
  }

  function next() {
    const values = readNodes();
    if (!values.length || values.length > maxNodes()) {
      message('请输入 1 到 ' + maxNodes() + ' 个顶点。', true);
      return;
    }
    if (new Set(values).size !== values.length) {
      message('顶点名称不能重复。', true);
      return;
    }
    nodes = values;
    byId('bfs-summary').textContent = '第 2 步 · 填写边' + (config.start ? '和起点' : '') + '。顶点：' + nodes.join('、');
    setOptions(start, start.value || nodes[0]);
    for (const select of edgeList.querySelectorAll('select')) setOptions(select, select.value);
    connections = true;
    updateButtons();
    updateEdgeFields();
    focusConnections();
    if ((config.start && start.getAttribute('aria-invalid') === 'true') || edgeList.querySelector('[aria-invalid="true"]')) {
      message('有起点或边引用了已删除的顶点，请修改或删除对应边。', true);
    } else {
      message('');
    }
  }

  function appendEdge([from, to, weight] = ['', '']) {
    const row = document.createElement('div');
    row.className = 'bfs-row bfs-edge';
    for (const [labelText, value] of [['端点 1', from], ['端点 2', to]]) {
      const label = document.createElement('label');
      const select = document.createElement('select');
      const caption = document.createElement('span');
      caption.textContent = labelText;
      label.append(caption, select);
      setOptions(select, value);
      row.append(label);
    }
    const weightLabel = document.createElement('label');
    weightLabel.className = 'graph-weight';
    const weightInput = document.createElement('input');
    weightInput.type = 'text';
    weightInput.inputMode = 'decimal';
    weightInput.value = weight ?? '';
    weightLabel.append('权重', weightInput);
    row.append(weightLabel);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary';
    remove.textContent = '删除';
    remove.addEventListener('click', () => {
      row.remove();
      add.disabled = false;
      add.focus();
      onChange();
    });
    row.append(remove);
    edgeList.append(row);
    add.disabled = edgeList.children.length >= graphMaxEdges;
    updateEdgeFields();
    return row;
  }

  byId('bfs-edit').addEventListener('click', () => {
    collapsed = false;
    updateButtons();
    message('');
    focusConnections();
  });
  byId('bfs-next').addEventListener('click', next);
  byId('bfs-back').addEventListener('click', () => {
    connections = false;
    updateButtons();
    message('');
    nodesInput.focus();
  });
  nodesInput.addEventListener('input', () => { updateCount(); onChange(); });
  add.addEventListener('click', () => {
    appendEdge().querySelector('select').focus();
    onChange();
  });
  edgeList.addEventListener('input', event => {
    if (event.target.matches('input')) onChange();
  });
  byId('bfs-connections').addEventListener('change', event => {
    if (event.target === directed) updateEdgeFields();
    if (!event.target.matches('select')) return;
    event.target.removeAttribute('aria-invalid');
    if (event.target !== directed && !nodes.includes(event.target.value)) {
      event.target.setAttribute('aria-invalid', 'true');
    }
    onChange();
  });

  return {
    setAlgorithm(value) {
      if (config !== value && value) connections = false;
      config = value;
      if (config) {
        byId('graph-start-field').hidden = !config.start;
        byId('graph-direction-field').hidden = config.directed !== undefined;
        const fixed = byId('graph-fixed-direction');
        fixed.hidden = config.directed === undefined;
        fixed.textContent = config.directed ? '图类型：有向图' : '图类型：无向图';
        updateCount();
        updateEdgeFields();
      }
      collapsed = false;
      updateButtons();
    },
    summarize(graph) {
      const restoreFocus = byId('run-form').contains(document.activeElement);
      byId('bfs-run-detail').textContent = [
        graph.directed ? '有向图' : '无向图',
        graph.nodes.length + ' 个顶点',
        graph.edges.length + ' 条边',
        ...(config.start ? ['起点 ' + graph.start] : [])
      ].join(' · ');
      collapsed = true;
      updateButtons();
      if (restoreFocus) byId('bfs-edit').focus();
    },
    fillDemo() {
      nodesInput.value = demoNodes.join(', ');
      nodes = [...demoNodes];
      edgeList.replaceChildren();
      const edges = config.weighted ? [
        ['A', 'B', 2], ['A', 'C', 5], ['B', 'C', 1], ['B', 'D', 4], ['C', 'D', 2], ['D', 'E', 3]
      ] : demoEdges;
      edges.forEach(edge => appendEdge(edge));
      setOptions(start, 'A');
      directed.value = 'false';
      connections = false;
      updateCount();
      updateButtons();
      nodesInput.focus();
    },
    read() {
      if (collapsed) return null;
      if (!connections) { next(); return null; }
      if (config.start && !nodes.includes(start.value)) throw new Error('请选择有效的起点。');
      const edges = Array.from(edgeList.children, (row, index) => {
        const edge = Array.from(row.querySelectorAll('select'), select => select.value);
        if (edge.some(node => !nodes.includes(node))) {
          throw new Error('第 ' + (index + 1) + ' 条边需要两个有效顶点。');
        }
        if (config.weighted) {
          const raw = row.querySelector('input').value.trim();
          const weight = Number(raw);
          if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) || !Number.isFinite(weight) || Math.abs(weight) > graphMaxWeight) {
            throw new Error('第 ' + (index + 1) + ' 条边需要有效权重，绝对值不超过 ' + graphMaxWeight + '。');
          }
          if (config.name === 'Dijkstra' && weight < 0) {
            throw new Error('第 ' + (index + 1) + ' 条边为负权，Dijkstra 只接受非负权重。');
          }
          edge.push(weight);
        }
        return edge;
      });
      return { nodes, edges, directed: isDirected(), ...(config.start ? { start: start.value } : {}) };
    }
  };
}
