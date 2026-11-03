// Layout state never owns or changes the algorithm's playback cursor.
export function createWorkbenchUI({ onNavigate = () => {} } = {}) {
  const $ = id => document.getElementById(id);
  const lifetime = new AbortController();
  const listen = (node, type, fn) => node.addEventListener(type, fn, { signal: lifetime.signal });
  const panel = $('tutor-window'), ball = $('tutor-toggle'), sidebar = $('sidebar-toggle');
  const uiKey = 'datastructure-agent:workbench-ui:v1';
  const nav = document.querySelector('.sidebar nav');
  function syncNavIndicator() {
    const active = nav.querySelector('.nav-item.active');
    if (!active?.getClientRects().length) return;
    const item = active.getBoundingClientRect(), bounds = nav.getBoundingClientRect();
    nav.style.setProperty('--nav-active-y', (item.top-bounds.top)+'px');
    nav.style.setProperty('--nav-active-height', item.height+'px');
    if (!nav.dataset.indicatorReady) {
      nav.dataset.indicatorReady = 'true';
      nav.getBoundingClientRect(); // Place the initial highlight before enabling transitions.
      nav.classList.add('indicator-animated');
    }
  }
  const navObserver = new ResizeObserver(syncNavIndicator); navObserver.observe(nav);
  let open = false, returnFocus = ball, drag = null;
  const notePicker = $('note-unit'), noteContent = $('note-content'), noteStatus = $('note-status');
  let activeNote = '', renderedUnit = '', noteRequest = null;
  let positionFrame = null;
  function queuePosition() {
    if (positionFrame !== null) return;
    positionFrame = requestAnimationFrame(() => {
      positionFrame = null;
      // Leave every timeline step reachable even when its bar is near the screen bottom.
      const timeline = document.querySelector('.vizwin .timeline')?.getBoundingClientRect();
      const base = innerWidth <= 540 ? 14 : 24, right = innerWidth <= 540 ? 14 : 26;
      const x = innerWidth - right - ball.offsetWidth, y = innerHeight - base - ball.offsetHeight;
      const overlaps = timeline && timeline.bottom > y && timeline.top < innerHeight - base && timeline.right > x && timeline.left < innerWidth - right;
      ball.style.bottom = (overlaps ? innerHeight - timeline.top + 12 : base) + 'px';
    });
  }
  try { document.body.dataset.sidebarCollapsed = localStorage.getItem(uiKey) !== 'expanded' ? 'true' : 'false'; } catch { /* Layout preference is optional. */ }
  function updateSidebar() {
    const collapsed = document.body.dataset.sidebarCollapsed === 'true';
    sidebar.setAttribute('aria-expanded', String(!collapsed));
    sidebar.setAttribute('aria-label', collapsed ? '展开侧栏' : '收起侧栏');
    sidebar.title = collapsed ? '展开侧栏' : '收起侧栏';
    sidebar.querySelector('[data-sidebar-arrow]').textContent = collapsed ? '›' : '‹';
    syncNavIndicator();
  }
  updateSidebar();
  listen(sidebar, 'click', () => {
    document.body.dataset.sidebarCollapsed = document.body.dataset.sidebarCollapsed === 'true' ? 'false' : 'true';
    updateSidebar();
    try { localStorage.setItem(uiKey, document.body.dataset.sidebarCollapsed === 'true' ? 'collapsed' : 'expanded'); } catch { /* Optional preference. */ }
  });
  async function showNote(unit, section) {
    noteRequest?.abort();
    noteStatus.hidden = true;
    notePicker.value = unit;
    noteContent.hidden = !unit || renderedUnit !== unit;
    if (!unit) return;
    if (renderedUnit !== unit) {
      const request = new AbortController();
      noteRequest = request;
      try {
        const response = await fetch('/assets/notes/' + encodeURIComponent(unit) + '.html', { signal: request.signal });
        if (!response.ok) throw new Error('笔记读取失败');
        const html = await response.text();
        if (request.signal.aborted) return;
        // This fragment is generated from the repository's Markdown during build.
        noteContent.innerHTML = html;
        renderedUnit = unit;
        noteContent.hidden = false;
      } catch {
        if (request.signal.aborted) return;
        noteContent.hidden = true;
        noteStatus.textContent = '笔记读取失败，请重新选择单元。';
        noteStatus.hidden = false;
        return;
      }
    }
    if (section) {
      const heading = noteContent.querySelector('#' + CSS.escape(section));
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'start' });
    }
  }
  const pages = { catalog: '课程目录', workbench: '算法工作台', knowledge: '学习笔记', practice: '过程练习', records: '错题与记录' };
  let currentPage = null;
  function route() {
    const [hash, query] = location.hash.slice(1).split('?');
    const name = ({ 'exercise-panel': 'practice', 'records-mount': 'records', 'tutor-knowledge-view': 'knowledge' })[hash] || hash;
    const params = new URLSearchParams(query);
    const legacyIntro = params.get('topic') === 'overview-1';
    return [name, {
      replace: true,
      unit: legacyIntro ? 'intro' : params.get('unit'),
      section: legacyIntro ? 'basics' : params.get('section')
    }];
  }
  function navigate(name, { replace = false, unit = '', section = '' } = {}) {
    if (!Object.hasOwn(pages,name)) name = 'workbench';
    const query = new URLSearchParams();
    if (name === 'knowledge' && unit && Array.from(notePicker.options).some(option => option.value === unit)) {
      query.set('unit', unit);
      if (section && /^[a-z0-9-]{1,50}$/.test(section)) query.set('section', section);
    }
    const hash = '#' + name + (query.size ? '?' + query : '');
    if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null,'',hash);
    const pageChanged = currentPage !== name;
    if (!pageChanged && (name !== 'knowledge' || activeNote === hash)) return;
    if (name !== 'knowledge') noteRequest?.abort();
    document.querySelector('.vizwin[data-full="true"] [data-viz-full]')?.click();
    onNavigate(name);
    if (open) show(false, false);
    for (const view of document.querySelectorAll('[data-page-view]')) view.hidden = view.dataset.pageView !== name;
    for (const link of document.querySelectorAll('.nav-item[data-page-link]')) {
      const active = link.dataset.pageLink === name;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
    }
    syncNavIndicator();
    currentPage = name; document.body.dataset.page = name;
    if (innerWidth <= 540) { document.body.dataset.sidebarCollapsed = 'true'; updateSidebar(); }
    $('page-breadcrumb').textContent = pages[name]; document.title = pages[name] + ' · 看懂每一步';
    ball.hidden = name !== 'workbench';
    if (pageChanged) document.querySelector('[data-page-view="'+name+'"] h1')?.focus({preventScroll:true});
    window.scrollTo(0,0); queuePosition();
    if (name === 'knowledge') {
      activeNote = hash;
      showNote(query.get('unit') ?? '', query.get('section'));
    }
  }
  for (const link of document.querySelectorAll('[data-page-link]')) listen(link, 'click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(link.dataset.pageLink);
  });
  listen(window,'hashchange',()=>navigate(...route()));
  listen(window,'popstate',()=>navigate(...route()));

  function clampPosition() {
    if (!open || !panel.style.left) return;
    const rect = panel.getBoundingClientRect();
    panel.style.left = Math.max(12, Math.min(innerWidth - rect.width - 12, rect.left)) + 'px';
    panel.style.top = Math.max(12, Math.min(innerHeight - rect.height - 12, rect.top)) + 'px';
  }
  function show(value, restoreFocus = true) {
    open = value; panel.hidden = !value; ball.setAttribute('aria-expanded', String(value));
    ball.setAttribute('aria-label', value ? '收起步骤辅导' : '打开步骤辅导');
    if (value) {
      clampPosition(); $('tutor-close').focus({ preventScroll: true });
    } else if (restoreFocus) returnFocus.focus({ preventScroll: true });
  }
  listen(ball, 'click', () => { returnFocus = ball; show(!open); });
  listen($('tutor-close'), 'click', () => show(false));
  // Dismiss without consuming the click or moving focus away from the outside control.
  listen(document, 'pointerdown', event => {
    if (open && !drag && !panel.contains(event.target) && !ball.contains(event.target)) show(false, false);
  });
  listen(notePicker, 'change', () => navigate('knowledge', { unit: notePicker.value }));
  listen(panel, 'keydown', event => {
    if (event.key === 'Escape' && !document.body.classList.contains('is-viz-full')) { event.preventDefault(); event.stopPropagation(); show(false); }
  });
  const handle = panel.querySelector('[data-tutor-drag]');
  listen(handle, 'pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button')) return;
    const rect = panel.getBoundingClientRect();
    drag = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    panel.style.left = rect.left + 'px'; panel.style.top = rect.top + 'px'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
    handle.setPointerCapture(event.pointerId); event.preventDefault();
  });
  listen(handle, 'pointermove', event => {
    if (!drag) return;
    panel.style.left = (event.clientX - drag.x) + 'px'; panel.style.top = (event.clientY - drag.y) + 'px'; clampPosition();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(handle, type, () => { drag = null; });
  listen(window, 'resize', () => { clampPosition(); queuePosition(); });
  listen(window, 'scroll', queuePosition);
  const layoutObserver = new ResizeObserver(queuePosition);
  layoutObserver.observe($('visualization-panel'));
  const prompts = {
    init: '二分查找为什么要求数组有序？',
    probe: '这次比较后，可以排除哪一半区间？',
    'move-left': '更新左边界后，为什么 mid 暂时是“未计算”？',
    'move-right': '更新右边界后，为什么 mid 暂时是“未计算”？',
    found: '如果数组有重复值，这次一定返回第一个位置吗？',
    'not-found': '哪个边界条件说明目标已经不在数组中了？'
  };
  navigate(...route());
  return {
    navigate,
    setContext(context) { $('tutor-prompt').textContent = prompts[context?.step?.event] || prompts.init; queuePosition(); },
    destroy() { lifetime.abort(); noteRequest?.abort(); navObserver.disconnect(); delete nav.dataset.indicatorReady; nav.classList.remove('indicator-animated'); layoutObserver.disconnect(); if (positionFrame !== null) cancelAnimationFrame(positionFrame); }
  };
}
