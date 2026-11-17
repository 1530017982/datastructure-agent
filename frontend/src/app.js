import { createRun, requestJSON } from './services/api.js';
import { createLevelOrderForm } from './features/workbench/level-order-form.js';
import { stateText } from './features/workbench/c-algorithms.js';
import { dataAlgorithm } from './features/workbench/data-algorithms.js';
import { createDataForm } from './features/workbench/data-form.js';
import { createUnionFindForm } from './features/workbench/union-find-form.js';
import { createGraphForm } from './features/workbench/bfs-form.js';
import { displaySourceLines, displayLineId } from './features/workbench/display-source.js';
import { arraySearch } from './features/workbench/array-search.js';
import { createAlgorithmMenu } from './features/workbench/algorithm-menu.js';
import { graphAlgorithm } from './features/workbench/graph-algorithms.js';
import { parseInput, validateRun } from './features/workbench/input.js';
import { describeStep } from './features/visualization/index.js';
import { createVizWindow } from './features/visualization/window.js';
import { createPlayback } from './features/playback/index.js';
import { createExercises } from './features/exercises/index.js';
import { createAgentChat } from './features/agent/panel.js';
import { createWorkbenchUI } from './features/workbench/ui.js';

const $ = id => document.getElementById(id);
let selectedAlgorithm = 'binary-search';
const isSorting = () => selectedAlgorithm === 'bubble-sort';
const selectedGraph = () => graphAlgorithm(selectedAlgorithm);
const isUnionFind = () => selectedAlgorithm === 'union-find';
const selectedC = () => dataAlgorithm(selectedAlgorithm);
const isLevelOrder = () => selectedAlgorithm === 'binary-tree-level-order';
const structuredInput = () => Boolean(selectedGraph() || isUnionFind() || selectedC() || isLevelOrder());
const isCustom = () => selectedAlgorithm === 'custom-array';
const customExample = `void sort(int a[], int n) {
  for (int end = n - 1; end > 0; end--) {
    for (int i = 0; i < end; i++) {
      if (a[i] > a[i + 1]) {
        int tmp = a[i];
        a[i] = a[i + 1];
        a[i + 1] = tmp;
      }
    }
  }
}`;
const variableIds = ['varLeft', 'varRight', 'varMid', 'varValue'];
const binaryHelp = $('input-help').textContent;
let run = null, playback = null, viz = null, pending = null, generation = 0;
let currentContext = null;
let practiceTopic = 'binary-search';
const speedMs = 1000;
const graphForm = createGraphForm({ message, onChange: updateGraphDraft });
const unionFindForm = createUnionFindForm({ message, onChange: updateGraphDraft });
const cForm = createDataForm({ message, onChange: updateGraphDraft });
const levelOrderForm = createLevelOrderForm({ message, onChange: updateGraphDraft });
const runButtonLabel = () => structuredInput() ? (run ? '重新运行' : '运行 ' + (selectedC()?.title ?? (isLevelOrder() ? '层序遍历' : isUnionFind() ? '并查集' : selectedGraph().name))) : isCustom() ? '编译并运行' : '开始分析';
const ui = createWorkbenchUI({
  onNavigate(page, algorithm) {
    if (page !== 'workbench' && playback?.getState().playing) playback.pause();
    if (algorithm && selectedAlgorithm !== algorithm) {
      selectedAlgorithm = algorithm;
      configureAlgorithm();
    }
  },
});
const algorithmMenu = createAlgorithmMenu($('algorithm-menu'), algorithm => {
  if (algorithm === selectedAlgorithm) return;
  selectedAlgorithm = algorithm;
  configureAlgorithm();
  ui.navigate('workbench', { algorithm, replace: true });
});
algorithmMenu.setSelected(selectedAlgorithm);
function mountWindow() {
  $('visualization-panel').replaceChildren();
  viz = createVizWindow($('visualization-panel'), {
    algorithm: selectedAlgorithm,
    onSeek(index) { playback?.seek(index); },
    onTransport(action) { playback?.[action]?.(); }
  });
}
const listeners = new Set();
const sourceNodes = new Map();
const agent = createAgentChat($('agent-panel'), {embedded:true,onBeforeSend:()=>playback?.pause()});

// 07 may subscribe immediately on mount, including the current initial step.
export function subscribeStep(listener) {
  listeners.add(listener); listener(currentContext);
  return () => listeners.delete(listener);
}
const exercises = createExercises($('exercise-mount'), {
  onBeforeAnswer: () => playback?.pause(),
  recordsContainer: $('records-mount'),
  onPracticeRequested: () => ui.navigate('practice'),
  onTopicChanged(topic) {
    practiceTopic = topic;
    $('exercise-title').textContent = topic === 'bubble-sort' ? '冒泡排序过程题' : '二分查找过程题';
    updatePracticeContext(currentContext);
  },
});
const unsubscribeExercises = subscribeStep(exercises.setContext);
function updatePracticeContext(context) {
  const linked = context?.algorithm === practiceTopic ? context : null;
  $('exercise-context').textContent = linked ? `当前运行：第 ${linked.stepIndex+1} 步 / 共 ${linked.total} 步。题目仍使用自己的固定情境。`
    : context ? '当前运行属于另一算法，可以独立完成本题。' : '当前无工作台运行，可独立完成固定题练习。';
  const host = $('exercise-mount');
  if (linked) { host.dataset.runId=linked.runId; host.dataset.stepIndex=String(linked.stepIndex); }
  else { delete host.dataset.runId;delete host.dataset.stepIndex; }
}
function publish(context) {
  currentContext = context;
  agent.setContext(isCustom() ? null : context);
  ui.setContext(context);
  updatePracticeContext(context);
  for (const listener of listeners) { try { listener(context); } catch(error) { console.error('步骤订阅失败',error); } }
  document.dispatchEvent(new CustomEvent('workbench:step',{detail:context}));
}
function message(text, error=false) { $('msgBox').textContent=text;$('msgBox').className=error?'error':''; }
function clearRun({ keepRequest = false } = {}) {
  if (!keepRequest) { generation++; pending?.abort(); pending=null; }
  playback?.destroy(); viz?.destroy(); playback=null;viz=null;run=null;
  sourceNodes.clear(); $('code-lines').replaceChildren();
  const placeholder=document.createElement('li');placeholder.textContent='开始分析后显示对应源码。';$('code-lines').append(placeholder);
  mountWindow();
  for (const id of variableIds) $(id).textContent = '—';
  if (selectedAlgorithm === 'binary-search') $('varMid').textContent = '未计算';
  $('stepText').textContent='尚未开始';$('step-description').textContent='';$('source-version').textContent='C/C++';
  $('startBtn').disabled=false;$('startBtn').textContent=runButtonLabel();$('run-form').removeAttribute('aria-busy');
  publish(null);
}
function render(state) {
  if(!run || state.runId!==run.runId || !state.step)return;
  const step=state.step;
  viz.setStep(step, state);
  const { left, right, mid, pass, index, sortedFrom, line, writes } = step.variables;
  let values;
  if (isLevelOrder()) {
    const {currentNode,level,queue,order}=step.variables;
    values=[currentNode??'—',level??'—',queue.map(entry=>entry.id+'（第'+entry.level+'层）').join('、')||'空',order.join(' → ')||'空'];
  } else if (selectedC()) {
    values = selectedC().fields.map(([key]) => stateText(step.variables[key]));
  } else if (isUnionFind()) {
    const { currentOp, findPath, setCount } = step.variables;
    values = [currentOp ? currentOp[0] + '(' + currentOp.slice(1).join(', ') + ')' : '—', findPath?.join(' → ') ?? '—', setCount, step.done ? run.result.failedOps.length : '—'];
  } else if (run.graph) {
    values = selectedGraph().fields.map(([key]) => {
      const value = step.variables[key];
      if (key === 'matrix') {
        const nodes = run.graph.nodes;
        return ['列顺序：' + nodes.join('、'), ...value.map((row, index) => nodes[index] + '：' + row)].join('\n');
      }
      if (key === 'currentEdge' && value) {
        const [from, to, weight] = value;
        return from + (run.graph.directed ? ' → ' : ' — ') + to + (weight === undefined ? '' : '（' + weight + '）');
      }
      if (Array.isArray(value)) return value.join('、') || '空';
      if (value && typeof value === 'object') {
        return run.graph.nodes.map(node => node + '：' + (value[node] ?? '—')).join('、');
      }
      return value ?? '—';
    });
  } else if (arraySearch(run.algorithm)) {
    const { index, current, comparisons, blockIndex, blockMax } = step.variables;
    values = run.algorithm === 'block-search'
      ? [blockIndex ?? '—', blockMax ?? '—', index ?? '—', current ?? '—']
      : [index ?? '—', current ?? '—', step.target, comparisons];
  } else if (run.algorithm === 'custom-array') values = [line, index ?? '—', index === null ? '—' : step.array[index], writes];
  else if (run.algorithm === 'bubble-sort') values = [pass || '—', index ?? '—', index === null ? '—' : index + 1, step.array.length - sortedFrom];
  else values = [left, right, mid ?? '未计算', mid === null ? '—' : step.array[mid]];
  variableIds.forEach((id, i) => { $(id).textContent = values[i]; });
  $('stepText').textContent=`第 ${state.stepIndex+1} 步 / 共 ${state.total} 步`;
  $('step-description').textContent=structuredInput() ? step.description : describeStep(step);
  const activeId = displayLineId(run.algorithm, step.lineId);
  for(const [lineId,node] of sourceNodes){const active=lineId===activeId;node.classList.toggle('active',active);if(active)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');}
  if (run.algorithm === 'custom-array') {
    const list = $('code-lines');
    const activeLine = sourceNodes.get(step.lineId).getBoundingClientRect();
    const viewport = list.getBoundingClientRect();
    if (activeLine.top < viewport.top) list.scrollTop += activeLine.top - viewport.top;
    else if (activeLine.bottom > viewport.bottom) list.scrollTop += activeLine.bottom - viewport.bottom;
  }
  publish({runId:run.runId,algorithm:run.algorithm,stepIndex:state.stepIndex,step,total:state.total,playing:state.playing,sourceVersion:run.sourceVersion});
}
async function start(event) {
  event.preventDefault();
  const structured = structuredInput();
  if (structured && pending) return;
  if (!structured) clearRun();
  const algorithm = selectedAlgorithm;
  let input;
  try {
    input = isLevelOrder() ? levelOrderForm.read() : selectedC() ? cForm.read() : isUnionFind() ? unionFindForm.read() : selectedGraph() ? graphForm.read() : parseInput($('arrInput').value, $('targetInput').value, algorithm);
  } catch (error) {
    message(error.message, true);
    return;
  }
  if (!input) return;
  const custom = algorithm === 'custom-array';
  if (custom) {
    input.language = $('code-language').value;
    input.source = $('code-input').value;
    if (!input.source.trim()) { message('请输入代码，或先填入示例。', true); return; }
  }
  const ticket=generation;const controller=new AbortController();pending=controller;
  message(custom ? '正在编译并记录实际执行步骤…' : '正在生成执行步骤…');
  $('startBtn').disabled=true;$('startBtn').textContent=custom?'编译运行中…':'分析中…';$('run-form').setAttribute('aria-busy','true');
  try{
    const result=validateRun(await createRun(input,controller.signal,algorithm),algorithm);
    if(ticket!==generation)return;
    if (structured) clearRun({ keepRequest: true });
    run=result;$('code-lines').replaceChildren();
    for(const line of displaySourceLines(run)){const node=document.createElement('li');node.textContent=line.text;node.dataset.lineId=line.lineId;sourceNodes.set(line.lineId,node);$('code-lines').append(node);}
    $('source-version').textContent=custom ? `${input.language === 'c' ? 'C' : 'C++'} · Open Watcom` : `C/C++ · ${run.sourceVersion}`;
    viz.setRun(run);
    playback=createPlayback({runId:run.runId,steps:run.steps,intervalMs:speedMs,onStepChange:render});
    render({...playback.getState(),step:run.steps[0]});
    if (structured) {
      if (isLevelOrder()) levelOrderForm.summarize(run.input);
      else if (selectedC()) cForm.summarize(run.input);
      else if (isUnionFind()) unionFindForm.summarize(run.input);
      else graphForm.summarize(run.graph);
      message('');
    } else {
      message('运行已创建。从第 1 步开始，可单步查看或播放。');
    }
  }catch(error){if(ticket!==generation||error.name==='AbortError')return;if (!structured) clearRun();message(error.message,true);}
  finally{if(ticket===generation){pending=null;$('startBtn').disabled=false;$('startBtn').textContent=runButtonLabel();$('run-form').removeAttribute('aria-busy');}}
}
$('run-form').addEventListener('submit',start);
function configureAlgorithm() {
  const sorting = isSorting();
  const custom = isCustom();
  const graph = selectedGraph();
  const search = arraySearch(selectedAlgorithm);
  const uf = isUnionFind();
  const c = selectedC();
  const tree = isLevelOrder();
  graphForm.setAlgorithm(graph);
  unionFindForm.setActive(uf);
  cForm.setAlgorithm(c);
  levelOrderForm.setActive(tree);
  $('run-form').hidden = false;
  $('arrInput').closest('label').hidden = Boolean(graph || uf || c || tree);
  $('input-help').hidden = Boolean(graph || uf || c || tree);
  $('run-form').classList.toggle('bfs-input', Boolean(graph || uf || c || tree));
  $('code-panel').classList.toggle('graph-workspace', Boolean(graph || uf || c || tree));
  $('code-panel').classList.toggle('floyd-workspace', selectedAlgorithm === 'floyd');
  $('workbench-footer-detail').textContent = tree ? '队列先进先出，左右孩子依次入队' : c ? '状态表与源码随真实步骤同步' : uf ? '每个元素的父节点指向自己时，它就是根' : graph ? '图结构和步骤来自本次运行' : '数组下标从 0 开始';
  $('visualization-panel').setAttribute('aria-label', tree ? '二叉树层序遍历状态表' : c ? c.title + ' 执行状态表' : uf ? '并查集执行状态表' : graph ? graph.name + ' 执行过程，可用左右方向键单步操作' : '数组动画，可用左右方向键单步操作');
  $('workbench-heading').textContent = (tree ? '二叉树层序遍历' : c?.title ?? (uf ? '并查集' : graph?.title)) ?? search?.title ?? (custom ? '自定义代码' : sorting ? '冒泡排序' : '二分查找');
  $('source-file').textContent = tree ? 'binary_tree_level_order.cpp' : c ? selectedAlgorithm.replaceAll('-', '_') + '.cpp' : uf ? 'union_find.cpp' : graph ? selectedAlgorithm.replace('-', '_') + '.cpp' : search?.file ?? (custom ? '用户源码' : sorting ? 'bubble_sort.cpp' : 'binary_search.cpp');
  $('array-label').textContent = selectedAlgorithm === 'block-search' ? '分块数组' : custom || search ? '输入数组' : sorting ? '待排序数组' : '有序数组';
  $('arrInput').value = '';
  $('arrInput').placeholder = search ? '例如：' + search.example : sorting || custom ? '例如：5, 1, 4, 2' : '例如：1, 3, 5, 7, 9';
  $('target-field').hidden = sorting || custom || Boolean(graph) || uf || Boolean(c) || tree;
  $('custom-code-fields').hidden = !custom;
  $('run-form').classList.toggle('sorting-input', sorting || custom);
  $('input-help').textContent = custom ? '本机 Windows 编译运行。最多 24 个 32 位整数，逗号分隔；留空为空数组。'
    : sorting ? '最多 24 个安全整数，逗号分隔；留空为空数组。允许负数和重复值。' : search?.help ?? binaryHelp;
  const labels = tree ? ['当前节点','当前层号','队列（队首在左）','访问顺序'] : c ? c.fields.map(([, label]) => label) : uf ? ['当前操作', '查找路径', '集合数量', '失败操作数'] : graph ? graph.fields.map(([, label]) => label) : custom ? ['源码行', '写入下标', '写入值', '写入次数']
    : selectedAlgorithm === 'block-search' ? ['当前块', '块最大值', '数组下标', '当前元素']
    : search ? ['当前下标', '当前元素', '目标值', '比较次数']
    : sorting ? ['轮次', 'i', 'i + 1', '已就位'] : ['left', 'right', 'mid', 'A[mid]'];
  variableIds.forEach((id, i) => { $(id).previousElementSibling.textContent = labels[i]; });
  algorithmMenu.setSelected(selectedAlgorithm);
  ui.setAlgorithm(selectedAlgorithm);
  clearRun();
  if (!custom && !graph && !search && !uf && !c && !tree) exercises.setTopic(selectedAlgorithm);
  message('');
}
function updateGraphDraft() {
  if (pending) {
    generation++;
    pending.abort();
    pending = null;
    $('startBtn').disabled = false;
    $('startBtn').textContent = runButtonLabel();
    $('run-form').removeAttribute('aria-busy');
  }
  message(run ? '输入已更改，点击「重新运行」应用。' : '');
}
function invalidateInput() {
  const old = Boolean(run || pending);
  if (old) clearRun();
  message(old ? (isCustom() ? '输入已更改，请重新编译运行。' : '输入已更改，请重新开始分析。') : '');
}
for (const id of ['arrInput','targetInput','code-input']) $(id).addEventListener('input', invalidateInput);
$('code-language').addEventListener('change', invalidateInput);
$('fillDemo').addEventListener('click', () => {
  if(isLevelOrder()){updateGraphDraft();levelOrderForm.fillDemo();message('示例已填入，点「下一步」设置左右孩子。');return;}
  if (selectedC()) {
    updateGraphDraft(); cForm.fillDemo();
    message('示例已填入，可修改输入后运行。');
    return;
  }
  if (isUnionFind()) {
    updateGraphDraft();
    unionFindForm.fillDemo();
    message('示例已填入，点击「下一步」查看操作。');
    return;
  }
  if (selectedGraph()) {
    updateGraphDraft();
    graphForm.fillDemo();
    message('示例顶点和边已填入，点「下一步」查看。');
    return;
  }
  clearRun();
  $('arrInput').value = arraySearch(selectedAlgorithm)?.example ?? (isSorting() || isCustom() ? '5,1,4,2' : '1,3,5,7,9');
  $('targetInput').value = '7';
  if (isCustom()) $('code-input').value = customExample;
  message(isCustom() ? '示例已填入，可以修改代码或直接编译运行。' : '示例已填入，点击开始分析。');
});
$('visualization-panel').addEventListener('keydown',event=>{
  if(event.target.closest('input,textarea,select,button,a,[contenteditable]')||!playback)return;
  if(event.key==='ArrowLeft'){event.preventDefault();playback.prev();}
  else if(event.key==='ArrowRight'){event.preventDefault();playback.next();}
  else if(event.key===' '){event.preventDefault();playback.getState().playing?playback.pause():playback.play();}
});
requestJSON('/api/health').then(data=>{$('service-status').textContent=data.mode==='mock'?'服务已连接 · 辅导为 Mock 开发模板':data.modelCallsEnabled?'服务已连接 · 辅导使用真实模型':'服务已连接 · 模型未配置，动画仍可使用';}).catch(()=>{$('service-status').textContent='服务未连接，请按启动说明重试。';});
window.addEventListener('pagehide',()=>{generation++;pending?.abort();playback?.destroy();viz?.destroy();ui.destroy();algorithmMenu.destroy();agent.destroy();unsubscribeExercises();exercises.destroy();listeners.clear();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
mountWindow();
publish(null);
ui.start();
