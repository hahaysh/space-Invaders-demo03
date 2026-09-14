import { expect } from '@playwright/test';

export async function controlledReady(page) {
  // Install before navigation so the game's first rAF uses the controlled clock.
  const time = new Date('2026-01-01T00:00:00Z');
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto('./');
  await expect(page.getByRole('button', { name: '시작', exact: true })).toBeEnabled();
  await page.clock.runFor(16);
}

export async function advanceToLoss(page) {
  // Keep the original 56-second budget, but observe the terminal state as it occurs.
  const stepMs = 500;
  const maxSteps = 112;
  for (let step = 0; step < maxSteps; step++) {
    await page.clock.runFor(stepMs);
    if ((await page.locator('#status').textContent()).includes('패배.')) return;
  }
  await expect(page.locator('#status'), 'No loss within 112 controlled 500ms steps').toContainText('패배.');
}
