import { graphAlgorithm, graphAlgorithmIds } from './graph-algorithms.js';

const chapters = [
  ['第六章 · 图', graphAlgorithmIds.map(id => [id, graphAlgorithm(id).title])],
  ['第七章 · 查找', [['binary-search', '二分查找'], ['linear-search', '顺序查找'], ['block-search', '分块查找']]],
  ['第八章 · 排序', [['bubble-sort', '冒泡排序']]],
  ['自定义', [['custom-array', '自定义代码']]]
];

export function createAlgorithmMenu(root, onSelect) {
  const trigger = root.querySelector('#algorithm-trigger');
  const selection = root.querySelector('#algorithm-selection');
  const list = root.querySelector('#algorithm-chapters');
  const choices = new Map();
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let activeChapter = null;
  let hoverTimer;

  function cancelHover() {
    clearTimeout(hoverTimer);
  }

  function showChapter(chapter) {
    cancelHover();
    if (activeChapter) {
      activeChapter.button.setAttribute('aria-expanded', 'false');
      activeChapter.submenu.hidden = true;
    }
    activeChapter = chapter;
    if (chapter) {
      chapter.button.setAttribute('aria-expanded', 'true');
      chapter.submenu.hidden = false;
    }
  }

  function setOpen(open) {
    trigger.setAttribute('aria-expanded', String(open));
    list.hidden = !open;
    if (!open) showChapter(null);
  }

  function close() {
    setOpen(false);
    if (root.contains(document.activeElement)) trigger.focus({ preventScroll: true });
  }

  for (const [index, [name, algorithms]] of chapters.entries()) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    const arrow = document.createElement('span');
    arrow.textContent = '▸';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(name, arrow);
    button.setAttribute('aria-expanded', 'false');

    const submenu = document.createElement('ul');
    submenu.className = 'algorithm-menu-list algorithm-submenu';
    submenu.id = 'algorithm-chapter-' + index;
    submenu.setAttribute('aria-label', name);
    submenu.hidden = true;
    button.setAttribute('aria-controls', submenu.id);

    const chapter = { button, submenu };
    row.append(button, submenu);
    list.append(row);
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      cancelHover();
      if (!activeChapter) showChapter(chapter);
      else if (activeChapter !== chapter) hoverTimer = setTimeout(() => showChapter(chapter), 160);
    }, options);
    submenu.addEventListener('pointerenter', cancelHover, options);
    button.addEventListener('click', () => showChapter(chapter), options);
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight') return;
      event.preventDefault();
      showChapter(chapter);
      submenu.querySelector('button').focus();
    }, options);
    submenu.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft') return;
      event.preventDefault();
      showChapter(null);
      button.focus();
    }, options);
    for (const [id, title] of algorithms) {
      const item = document.createElement('li');
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.dataset.algorithmChoice = id;
      choice.textContent = title;
      choice.addEventListener('click', () => {
        close();
        onSelect(id);
      }, options);
      choices.set(id, choice);
      item.append(choice);
      submenu.append(item);
    }
  }

  trigger.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setOpen(true);
  }, options);
  trigger.addEventListener('click', () => {
    if (list.hidden) setOpen(true);
    else if (document.activeElement === trigger) list.querySelector('button').focus();
  }, options);
  trigger.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    setOpen(true);
    list.querySelector('button').focus();
  }, options);
  root.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') close();
  }, options);
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || list.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  }, options);
  root.addEventListener('focusout', event => {
    if (event.relatedTarget && !root.contains(event.relatedTarget)) setOpen(false);
  }, options);
  document.addEventListener('pointerdown', event => {
    if (!root.contains(event.target)) setOpen(false);
  }, options);

  return {
    setSelected(id) {
      const choice = choices.get(id);
      if (!choice) return;
      trigger.dataset.algorithm = id;
      selection.textContent = choice.textContent;
      for (const item of choices.values()) {
        if (item === choice) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      }
      setOpen(false);
    },
    destroy() {
      cancelHover();
      controller.abort();
    }
  };
}
