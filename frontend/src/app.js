import { createRun, requestJSON } from './services/api.js';
import { parseInput, validateRun } from './features/workbench/input.js';
import { describeStep } from './features/visualization/index.js';
import { createVizWindow } from './features/visualization/window.js';
import { createPlayback } from './features/playback/index.js';
import { createExercises } from './features/exercises/index.js';
import { createAgentChat } from './features/agent/panel.js';
import { createWorkbenchUI } from './features/workbench/ui.js';

const $ = id => document.getElementById(id);
const algorithmPicker = $('algorithm-select');
const isSorting = () => algorithmPicker.value === 'bubble-sort';
const isCustom = () => algorithmPicker.value === 'custom-array';
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
const ui = createWorkbenchUI({
  onNavigate(page, algorithm) {
    if (page !== 'workbench' && playback?.getState().playing) playback.pause();
    if (algorithm && algorithmPicker.value !== algorithm) {
      algorithmPicker.value = algorithm;
      configureAlgorithm();
    }
  },
});
function mountWindow() {
  $('visualization-panel').replaceChildren();
  viz = createVizWindow($('visualization-panel'), {
    algorithm: algorithmPicker.value,
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
function clearRun() {
  generation++; pending?.abort(); pending=null;
  playback?.destroy(); viz?.destroy(); playback=null;viz=null;run=null;
  sourceNodes.clear(); $('code-lines').replaceChildren();
  const placeholder=document.createElement('li');placeholder.textContent='开始分析后显示对应源码。';$('code-lines').append(placeholder);
  mountWindow();
  for (const id of variableIds) $(id).textContent = '—';
  if (!isSorting() && !isCustom()) $('varMid').textContent = '未计算';
  $('stepText').textContent='尚未开始';$('step-description').textContent='';$('source-version').textContent='C/C++';
  $('startBtn').disabled=false;$('startBtn').textContent=isCustom()?'编译并运行':'开始分析';$('run-form').removeAttribute('aria-busy');
  publish(null);
}
function render(state) {
  if(!run || state.runId!==run.runId || !state.step)return;
  const step=state.step;
  viz.setStep(step, state);
  const { left, right, mid, pass, index, sortedFrom, line, writes } = step.variables;
  let values;
  if (run.algorithm === 'custom-array') values = [line, index ?? '—', index === null ? '—' : step.array[index], writes];
  else if (run.algorithm === 'bubble-sort') values = [pass || '—', index ?? '—', index === null ? '—' : index + 1, step.array.length - sortedFrom];
  else values = [left, right, mid ?? '未计算', mid === null ? '—' : step.array[mid]];
  variableIds.forEach((id, i) => { $(id).textContent = values[i]; });
  $('stepText').textContent=`第 ${state.stepIndex+1} 步 / 共 ${state.total} 步`;
  $('step-description').textContent=describeStep(step);
  for(const [lineId,node] of sourceNodes){const active=lineId===step.lineId;node.classList.toggle('active',active);if(active)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');}
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
  event.preventDefault(); clearRun();
  const algorithm = algorithmPicker.value;
  let input;try{input=parseInput($('arrInput').value,$('targetInput').value,algorithm);}catch(error){message(error.message,true);return;}
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
    run=result;$('code-lines').replaceChildren();
    for(const line of run.sourceLines){const node=document.createElement('li');node.textContent=line.text;node.dataset.lineId=line.lineId;sourceNodes.set(line.lineId,node);$('code-lines').append(node);}
    $('source-version').textContent=custom ? `${input.language === 'c' ? 'C' : 'C++'} · Open Watcom` : `C/C++ · ${run.sourceVersion}`;
    viz.setRun(run);
    playback=createPlayback({runId:run.runId,steps:run.steps,intervalMs:speedMs,onStepChange:render});
    render({...playback.getState(),step:run.steps[0]});
    message('运行已创建。从第 1 步开始，可单步查看或播放。');
  }catch(error){if(ticket!==generation||error.name==='AbortError')return;clearRun();message(error.message,true);}
  finally{if(ticket===generation){pending=null;$('startBtn').disabled=false;$('startBtn').textContent=custom?'编译并运行':'开始分析';$('run-form').removeAttribute('aria-busy');}}
}
$('run-form').addEventListener('submit',start);
function configureAlgorithm() {
  const sorting = isSorting();
  const custom = isCustom();
  $('workbench-heading').textContent = custom ? '自定义代码' : sorting ? '冒泡排序' : '二分查找';
  $('source-file').textContent = custom ? '用户源码' : sorting ? 'bubble_sort.cpp' : 'binary_search.cpp';
  $('array-label').textContent = custom ? '输入数组' : sorting ? '待排序数组' : '有序数组';
  $('arrInput').value = '';
  $('arrInput').placeholder = sorting || custom ? '例如：5, 1, 4, 2' : '例如：1, 3, 5, 7, 9';
  $('target-field').hidden = sorting || custom;
  $('custom-code-fields').hidden = !custom;
  $('run-form').classList.toggle('sorting-input', sorting || custom);
  $('input-help').textContent = custom ? '本机 Windows 编译运行。最多 24 个 32 位整数，逗号分隔；留空为空数组。'
    : sorting ? '最多 24 个安全整数，逗号分隔；留空为空数组。允许负数和重复值。' : binaryHelp;
  const labels = custom ? ['源码行', '写入下标', '写入值', '写入次数']
    : sorting ? ['轮次', 'i', 'i + 1', '已就位'] : ['left', 'right', 'mid', 'A[mid]'];
  variableIds.forEach((id, i) => { $(id).previousElementSibling.textContent = labels[i]; });
  ui.setAlgorithm(algorithmPicker.value);
  clearRun();
  if (!custom) exercises.setTopic(algorithmPicker.value);
  message('');
}
algorithmPicker.addEventListener('change', () => {
  configureAlgorithm();
  ui.navigate('workbench', { algorithm: algorithmPicker.value, replace: true });
});
function invalidateInput() {
  const old = Boolean(run || pending);
  if (old) clearRun();
  message(old ? (isCustom() ? '输入已更改，请重新编译运行。' : '输入已更改，请重新开始分析。') : '');
}
for (const id of ['arrInput','targetInput','code-input']) $(id).addEventListener('input', invalidateInput);
$('code-language').addEventListener('change', invalidateInput);
$('fillDemo').addEventListener('click', () => {
  clearRun();
  $('arrInput').value = isSorting() || isCustom() ? '5,1,4,2' : '1,3,5,7,9';
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
window.addEventListener('pagehide',()=>{generation++;pending?.abort();playback?.destroy();viz?.destroy();ui.destroy();agent.destroy();unsubscribeExercises();exercises.destroy();listeners.clear();},{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
mountWindow();
publish(null);
ui.start();
