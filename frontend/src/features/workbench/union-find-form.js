import { validateUnionFindInput } from './union-find-input.js';

export function createUnionFindForm({ onChange, message }) {
  const byId = id => document.getElementById(id);
  const input = byId('uf-elements');
  const operations = byId('uf-operations');
  let active = false, second = false, collapsed = false;
  let elements = [];
  function update() {
    byId('uf-summary').hidden = !active || !collapsed;
    byId('uf-fields').hidden = !active || collapsed;
    byId('uf-elements-step').hidden = second;
    byId('uf-operations-step').hidden = !second;
    if (active) {
      byId('fillDemo').parentElement.hidden = collapsed;
      byId('startBtn').hidden = collapsed || !second;
      byId('bfs-next').hidden = true;
      byId('bfs-back').hidden = true;
    }
  }
  function options(select, value) {
    select.replaceChildren(new Option('请选择', ''), ...elements.map(name => new Option(name, name)));
    if (value && !elements.includes(value)) select.add(new Option('已删除：' + value, value));
    select.value = value;
    select.setAttribute('aria-invalid', String(Boolean(value && !elements.includes(value))));
  }
  function count() {
    byId('uf-count').textContent = '共 ' + input.value.trim().split(/[,，\s]+/).filter(Boolean).length + ' 个元素（最多 30 个）';
  }
  function next() {
    try {
      elements = validateUnionFindInput({ elements: input.value.trim().split(/[,，\s]+/).filter(Boolean), operations: [] }).elements;
    } catch (error) { message(error.message, true); return; }
    for (const select of operations.querySelectorAll('[data-element]')) options(select, select.value);
    byId('uf-elements-summary').textContent = '元素：' + elements.join('、');
    second = true;
    update();
    byId('uf-add').focus();
    message(operations.querySelector('[aria-invalid="true"]') ? '有操作引用了已删除的元素，请修改或删除。' : '');
  }
  function addOperation([type = 'union', x = '', y = ''] = []) {
    const row = document.createElement('div');
    row.className = 'uf-operation';
    const action = document.createElement('select');
    action.setAttribute('aria-label', '操作类型');
    action.append(new Option('合并 union', 'union'), new Option('查找 find', 'find'));
    action.value = type;
    row.append(action);
    const selects = [x, y].map((value, index) => {
      const select = document.createElement('select');
      select.dataset.element = '';
      select.setAttribute('aria-label', '元素 ' + (index + 1));
      options(select, value);
      row.append(select);
      return select;
    });
    function toggle() { selects[1].hidden = action.value === 'find'; }
    toggle();
    action.addEventListener('change', toggle);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'secondary'; remove.textContent = '删除';
    remove.addEventListener('click', () => { row.remove(); byId('uf-add').disabled = false; onChange(); });
    row.append(remove);
    operations.append(row);
    byId('uf-add').disabled = operations.children.length >= 60;
    return action;
  }
  input.addEventListener('input', () => { count(); onChange(); });
  byId('uf-next').addEventListener('click', next);
  byId('uf-back').addEventListener('click', () => { second = false; update(); message(''); input.focus(); });
  byId('uf-add').addEventListener('click', () => { addOperation().focus(); onChange(); });
  operations.addEventListener('change', event => {
    const select = event.target;
    if (select.hasAttribute('data-element')) select.setAttribute('aria-invalid', String(!elements.includes(select.value)));
    onChange();
  });
  byId('uf-edit').addEventListener('click', () => { collapsed = false; update(); message(''); byId('uf-add').focus(); });
  return {
    setActive(value) { active = value; collapsed = false; update(); },
    fillDemo() {
      input.value = 'A, B, C, D'; elements = ['A', 'B', 'C', 'D'];
      operations.replaceChildren();
      [['union', 'A', 'B'], ['union', 'B', 'C'], ['find', 'C']].forEach(op => addOperation(op));
      second = false; collapsed = false; count(); update();
    },
    read() {
      if (collapsed) return null;
      if (!second) { next(); return null; }
      const values = Array.from(operations.children, row => {
        const [action, x, y] = row.querySelectorAll('select');
        return action.value === 'find' ? ['find', x.value] : ['union', x.value, y.value];
      });
      return validateUnionFindInput({ elements, operations: values });
    },
    summarize(value) {
      byId('uf-summary-text').textContent = value.elements.length + ' 个元素 · ' + value.operations.length + ' 个操作';
      collapsed = true; update(); byId('uf-edit').focus();
    }
  };
}
