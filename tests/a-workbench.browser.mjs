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
  await page.goto(base+'/#workbench?algorithm=insertion-sort');
  for(const algorithm of ['insertion-sort','binary-insertion-sort','shell-sort','selection-sort','quick-sort','heap-sort','merge-sort']){
    await selectWorkbenchAlgorithm(page,algorithm);
    await page.click('#fillDemo');
    const pending=page.waitForResponse(response=>response.url().endsWith('/api/algorithms/'+algorithm+'/runs'));
    await page.click('#startBtn');
    const response=await pending;assert.equal(response.status(),200,algorithm);
    const run=await response.json();assert.deepEqual(run.result,[1,2,4,5]);
    await page.locator('#code-lines .active').waitFor();
    for(let index=0;index<run.steps.length;index++){
      if(index)await page.click('#nextBtn');
      assert.equal(await page.locator('#code-lines .active').getAttribute('data-line-id'),run.steps[index].lineId,algorithm);
      assert.doesNotMatch(await page.locator('.variables').innerText(),/undefined|NaN/);
    }
    const values=await page.locator('.prototype-array-value').allTextContents();
    assert.deepEqual(values,['1','2','4','5'],algorithm);
    await page.click('#prevBtn');
    await page.click('#resetBtn');
    const answer=await page.request.post(base+'/api/agent/explain',{data:{runId:run.runId,stepIndex:1,question:'解释本步'}});
    assert.equal(answer.status(),200);
    assert.deepEqual((await answer.json()).stepRefs[0].variables,run.steps[1].variables);
  }
  assert.deepEqual(errors,[]);
  console.log('A package workbench acceptance passed.');
}finally{await browser?.close();server.kill();}
