import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { generateBubbleSteps } from '../shared/algorithms/bubbleSort.js';
import { buildPrompt } from '../backend/src/agent/prompt.js';
import { publicQuestion } from '../frontend/src/features/exercises/model.js';

test('bubble sort snapshots and boundaries agree with independently specified examples', () => {
  const cases = [
    { input: [], result: [], swaps: 0, passes: 0 },
    { input: [7], result: [7], swaps: 0, passes: 0 },
    { input: [1, 2, 3], result: [1, 2, 3], swaps: 0, passes: 2 },
    { input: [3, 2, 1], result: [1, 2, 3], swaps: 3, passes: 2 },
    { input: [2, -1, 2], result: [-1, 2, 2], swaps: 1, passes: 2 },
  ];
  for (const { input, result, swaps, passes } of cases) {
    const initial = [...input];
    const run = generateBubbleSteps(input);
    assert.deepEqual(input, initial);
    assert.deepEqual(run.steps[0].array, initial);
    assert.deepEqual(run.steps.at(-1).array, result);
    assert.deepEqual(run.result, result);
    assert.equal(run.steps.filter(step => step.event === 'swap').length, swaps);
    assert.equal(run.steps.filter(step => step.event === 'pass-end').length, passes);
  }
});

test('sorting prompt carries the actual swap and its previous snapshot', () => {
  const run = { ...generateBubbleSteps([5, 1, 4, 2]), algorithm: 'bubble-sort' };
  const [, prompt] = buildPrompt(run, run.steps[2], 2, '为什么交换？');
  assert.match(prompt.content, /数组: \[1, 5, 4, 2\]/);
  assert.match(prompt.content, /当前相邻比较或交换的下标: \[0, 1\]/);
  assert.match(prompt.content, /"event":"compare","array":\[5,1,4,2\]/);
  assert.match(prompt.content, /"activeLineId":"swap"/);
  assert.doesNotMatch(prompt.content, /目标值:|闭区间:|undefined/);
});

test('all sorting exercises have unique IDs, valid public scenarios and usable private answers', () => {
  const questions = JSON.parse(readFileSync(new URL('../content/exercises/bubble-sort.json', import.meta.url), 'utf8'));
  assert.equal(new Set(questions.map(question => question.id)).size, 10);
  for (const question of questions) {
    const displayed = publicQuestion(question);
    assert.equal(displayed.topicId, 'bubble-sort');
    assert.ok(!Object.hasOwn(displayed, 'answer'));
    assert.ok(!Object.hasOwn(displayed, 'hints'));
    assert.equal(question.hints.length, 2);
    if (question.type === 'choice') assert.ok(displayed.options.some(option => option.id === question.answer));
    if (question.type === 'judgement') assert.equal(typeof question.answer, 'boolean');
    if (question.type === 'value') assert.ok(Number.isSafeInteger(question.answer));
  }
});
