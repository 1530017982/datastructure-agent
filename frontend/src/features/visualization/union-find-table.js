export function createUnionFindTable(input) {
  const element = document.createElement('div');
  const note = document.createElement('p');
  note.textContent = '树形动画待接入 · 父节点表随步骤更新';
  const table = document.createElement('table');
  table.className = 'uf-table';
  table.setAttribute('aria-label', '并查集父节点表');
  const head = table.createTHead().insertRow();
  for (const text of ['元素', '父节点', '秩']) {
    const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = text; head.append(cell);
  }
  const body = table.createTBody();
  const rows = new Map();
  for (const name of input.elements) {
    const row = body.insertRow();
    for (const value of [name, name, '0']) row.insertCell().textContent = value;
    rows.set(name, row);
  }
  element.append(note, table);
  return {
    element,
    showStep(step, previous) {
      for (const [name, row] of rows) {
        row.cells[1].textContent = step.variables.parent[name];
        row.cells[2].textContent = step.variables.rank[name];
        row.dataset.changed = String(Boolean(previous && previous.variables.parent[name] !== step.variables.parent[name]));
      }
    }
  };
}
