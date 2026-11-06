export async function selectWorkbenchAlgorithm(page, algorithm) {
  const choice = page.locator('[data-algorithm-choice="' + algorithm + '"]');
  const chapter = page.locator('#algorithm-chapters > li').filter({ has: choice }).locator('> button');
  await page.locator('#algorithm-trigger').hover();
  await chapter.hover();
  await choice.click();
}
