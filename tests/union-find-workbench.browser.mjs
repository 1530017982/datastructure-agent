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
  await page.goto(base + '/#workbench?algorithm=union-find');
  await page.click('#fillDemo');
  await page.click('#uf-next');
  assert.equal(await page.locator('.uf-operation').count(), 3);
  await page.click('#uf-back');
  await page.click('#uf-next');
  assert.equal(await page.locator('.uf-operation').count(), 3);
  const pending = page.waitForResponse(response => response.url().endsWith('/api/algorithms/union-find/runs'));
  await page.click('#startBtn');
  const response = await pending;
  assert.equal(response.status(), 200);
  const run = await response.json();
  assert.deepEqual(run.result, { setCount: 2, failedOps: [] });
  await page.locator('#uf-edit').waitFor();
  assert.equal(await page.locator('#uf-fields').isHidden(), true);
  const rows = page.locator('.uf-table tbody tr');
  assert.equal(await rows.count(), 4);
  await page.click('[data-t="last"]');
  assert.deepEqual(await rows.evaluateAll(rows => rows.map(row => row.cells[1].textContent)), ['A', 'A', 'A', 'D']);
  assert.equal(await page.locator('#varMid').innerText(), '2');
  await page.click('#resetBtn');
  assert.deepEqual(await rows.evaluateAll(rows => rows.map(row => row.cells[1].textContent)), ['A', 'B', 'C', 'D']);
  await page.click('#nextBtn');
  assert.equal(await page.locator('#code-lines .active').getAttribute('data-line-id'), 'parent-self');
  await page.click('#tutor-toggle');
  await page.fill('#question-input', '为什么父节点是自己？');
  const explainPending = page.waitForResponse(response => response.url().endsWith('/api/agent/explain'));
  await page.click('#send-btn');
  const reply = await (await explainPending).json();
  assert.equal(reply.stepIndex, 1);
  assert.deepEqual(reply.stepRefs[0].variables.parent, run.steps[1].variables.parent);
  await page.click('#tutor-close');
  await page.click('#uf-edit');
  await page.click('#uf-back');
  await page.fill('#uf-elements','A, D');
  await page.click('#uf-next');
  await page.click('#startBtn');
  assert.match(await page.locator('#msgBox').innerText(), /无效或已删除/);
  assert.equal(await rows.count(), 4);
  const invalid = await page.request.post(base + '/api/algorithms/union-find/runs', {
    data: { elements: ['A'], operations: [['find', 'Z']] }
  });
  assert.equal(invalid.status(), 400);
  for (const input of [
    { elements: ['X'], operations: [] },
    { elements: ['X'], operations: [['find', 'X'], ['union', 'X', 'X']] }
  ]) {
    const single = await page.request.post(base + '/api/algorithms/union-find/runs', { data: input });
    assert.equal(single.status(), 200);
    assert.equal((await single.json()).result.setCount, 1);
  }
  await selectWorkbenchAlgorithm(page, 'binary-search');
  await page.click('#fillDemo');
  await page.click('#startBtn');
  await page.locator('#code-lines [data-line-id="init-left"].active').waitFor();
  assert.deepEqual(errors, []);
  console.log('Union-find workbench acceptance passed.');
} finally {
  await browser?.close();
  server.kill();
}
