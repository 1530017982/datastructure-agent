import { selectWorkbenchAlgorithm } from './select-workbench-algorithm.mjs';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.TEST_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.TEST_PLAYWRIGHT_MODULE).href : 'playwright');
const server = spawn(process.execPath, ['backend/src/server.js'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  env: { ...process.env, PORT: '0', HOST: '127.0.0.1', AGENT_MOCK: 'true', RATE_LIMIT: 'false' },
  windowsHide: true
});
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Backend startup timed out')), 10000);
    server.once('error', reject);
    server.stdout.on('data', chunk => {
      const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base+'/#workbench?algorithm=hash-linear-probing');
  const ids=['hash-linear-probing','hash-quadratic-probing','hash-double-hashing','hash-chaining','avl-tree','red-black-tree'];
  for(const id of ids){
    await selectWorkbenchAlgorithm(page,id);
    await page.click('#fillDemo');
    const tree=id==='avl-tree'||id==='red-black-tree';
    if(tree){
      await page.click('#c-next');await page.click('#c-back');await page.click('#c-next');
      assert.equal(await page.inputValue('#c-queries'),id==='avl-tree'?'10':'15');
    }else assert.equal(await page.inputValue('#d-target'),'24');
    const pending=page.waitForResponse(response=>response.url().endsWith('/api/algorithms/'+id+'/runs'));
    await page.click('#startBtn');
    const response=await pending;assert.equal(response.status(),200,id);
    const run=await response.json();
    assert.equal(run.steps.at(-1).event,'found',id);
    if(id==='avl-tree')assert.equal(run.steps.find(step=>step.event==='rotate').variables.root,20);
    await page.locator('#c-edit').waitFor();
    const view=page.locator('.d-state-tables');
    await view.waitFor();
    for(let step=1;step<run.steps.length;step++){
      await page.click('#nextBtn');
      assert.equal(await page.locator('#code-lines .active').getAttribute('data-line-id'),run.steps[step].lineId,id);
      assert.doesNotMatch(await view.innerText(),/undefined|NaN/);
    }
    assert.match(await view.innerText(),/查询结果/);
    assert.equal(await view.locator('[data-found="true"]').count(),1,id);
    if(!tree && id!=='hash-chaining') {
      const slots=await view.locator('table').first().locator('tbody tr').evaluateAll(rows=>rows.map(row=>row.cells[1].textContent));
      assert.deepEqual(slots,run.result.map(value=>value===null?'空':String(value)));
    }
    await page.click('#resetBtn');await page.click('#nextBtn');
    const answer=await page.request.post(base+'/api/agent/explain',{
      data:{runId:run.runId,stepIndex:1,question:'解释这一步',hintLevel:2}
    });
    assert.equal(answer.status(),200);
    assert.deepEqual((await answer.json()).stepRefs[0].variables,run.steps[1].variables);
    await page.click('#c-edit');
    if(tree)await page.fill('#c-queries','');else await page.fill('#d-target','');
    const buildPending=page.waitForResponse(response=>response.url().endsWith('/api/algorithms/'+id+'/runs'));
    await page.click('#startBtn');
    assert.equal((await (await buildPending).json()).steps.at(-1).event,'done');
    await page.locator('#c-edit').waitFor();
  }
  for(const id of ['hash-quadratic-probing','hash-double-hashing']){
    await selectWorkbenchAlgorithm(page,id);await page.click('#fillDemo');await page.fill('#c-param','4');
    await page.click('#startBtn');assert.match(await page.locator('#msgBox').innerText(),/素数/);
  }
  const cases=[
    ['hash-linear-probing',{keys:[0,-7,7],capacity:7,target:0},run=>assert.equal(run.steps.at(-1).variables.searchResult,0)],
    ['hash-quadratic-probing',{keys:[0,7,14,21,28],capacity:7},run=>assert.ok(run.steps.some(step=>step.event==='probe-exhausted'))],
    ['hash-double-hashing',{keys:[0],capacity:2,target:9},run=>assert.equal(run.steps.at(-1).event,'not-found')],
    ['hash-chaining',{keys:[0,7],bucketCount:7,target:7},run=>assert.deepEqual(run.result[0],[0,7])],
    ['avl-tree',{keys:[0],target:0},run=>assert.equal(run.result.found,0)],
    ['red-black-tree',{keys:[],target:0},run=>assert.equal(run.result.found,null)]
  ];
  for(const [id,input,check]of cases){
    const response=await page.request.post(base+'/api/algorithms/'+id+'/runs',{data:input});
    assert.equal(response.status(),200);check(await response.json());
  }
  const invalid=await page.request.post(base+'/api/algorithms/hash-double-hashing/runs',{data:{keys:[1],capacity:4}});
  assert.equal(invalid.status(),400);
  await selectWorkbenchAlgorithm(page,'binary-search');await page.click('#fillDemo');await page.click('#startBtn');
  await page.locator('#code-lines [data-line-id="init-left"].active').waitFor();
  assert.deepEqual(errors,[]);
  console.log('D package workbench acceptance passed.');
}finally{
  await browser?.close();server.kill();
}
