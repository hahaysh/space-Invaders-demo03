import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '시작', exact: true })).toBeEnabled();
}

async function shipBounds(page) {
  return page.locator('canvas').evaluate((canvas) => {
    const { data } = canvas.getContext('2d').getImageData(0, 540, 800, 60);
    const points = [];
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 800; x++) {
        const i = (y * 800 + x) * 4;
        if (data[i + 3] > 0 && data[i + 2] > data[i] + 25 && data[i + 1] > 55) {
          points.push([x, y + 540]);
        }
      }
    }
    return {
      minX: Math.min(...points.map(([x]) => x)),
      maxX: Math.max(...points.map(([x]) => x)),
      minY: Math.min(...points.map(([, y]) => y)),
      maxY: Math.max(...points.map(([, y]) => y)),
      pixels: points.length,
    };
  });
}

test('initial HTML score exists before scripts or first rAF', async ({ request }) => {
  const response = await request.get('/');
  expect(await response.text()).toContain('aria-labelledby="score-label">0</output>');
});

test('real button, keyboard, boundaries, fire and blur', async ({ page }) => {
  await ready(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole('button', { name: '시작', exact: true }).click();
  await page.clock.runFor(32);
  const initial = await shipBounds(page);
  expect(initial.minX).toBeGreaterThanOrEqual(380);
  expect(initial.maxX).toBeLessThan(420);
  expect(initial.minY).toBeGreaterThanOrEqual(550);
  expect(initial.maxY).toBeGreaterThan(570);
  expect(initial.pixels).toBeGreaterThan(100);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(500);
  expect((await shipBounds(page)).minX - initial.minX).toBeCloseTo(160, -1);
  await page.keyboard.down('ArrowLeft');
  const stopped = await shipBounds(page);
  await page.clock.runFor(500);
  expect(await shipBounds(page)).toEqual(stopped);
  await page.keyboard.up('ArrowLeft');
  await page.clock.runFor(2000);
  expect((await shipBounds(page)).maxX).toBeLessThan(800);
  expect((await shipBounds(page)).maxX).toBeGreaterThan(790);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('KeyA');
  await page.clock.runFor(3000);
  expect((await shipBounds(page)).minX).toBeLessThan(5);
  await page.keyboard.up('KeyA');
  await page.keyboard.down('Space');
  await page.clock.runFor(250);
  expect(await page.locator('canvas').evaluate((canvas) => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, 800, 538).data;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] === 188 && pixels[i + 1] === 233 && pixels[i + 2] === 255) count++;
    }
    return count;
  })).toBeGreaterThan(0);
  await page.keyboard.up('Space');
  await page.keyboard.down('KeyD');
  await page.clock.runFor(100);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const blurred = await shipBounds(page);
  await page.clock.runFor(250);
  expect(await shipBounds(page)).toEqual(blurred);
  await page.keyboard.up('KeyD');
  await expect(page.locator('#score')).toHaveText('0');
});

test('Enter starts and title movement is ignored', async ({ page }) => {
  await ready(page);
  const before = await shipBounds(page);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  expect(await shipBounds(page)).toEqual(before);
  await page.keyboard.press('Enter');
  await expect(page.locator('#action')).toBeHidden();
});

test('score is an HTML card with stable dimensions and controls outside', async ({ page }) => {
  await ready(page);
  const styles = await page.locator('.stat-card').evaluate((card) => {
    const css = getComputedStyle(card);
    const value = getComputedStyle(card.querySelector('output'));
    return { width: css.width, height: css.height, padding: css.padding,
      numeric: value.fontVariantNumeric, size: value.fontSize,
      controls: card.querySelectorAll('button, #status').length };
  });
  expect(styles).toEqual({ width: '160px', height: '96px', padding: '16px 20px',
    numeric: 'tabular-nums', size: '32px', controls: 0 });
  for (const width of [1100, 820, 640]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('delayed image blocks button and Enter until decode', async ({ page }) => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/*.png', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#action')).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(page.locator('#action')).toBeVisible();
  await expect(page.locator('#status')).toContainText('준비하고');
  release();
  await expect(page.locator('#action')).toBeEnabled();
});

test('failed image shows explicit error and never substitutes a shape', async ({ page }) => {
  await page.route('**/*.png', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#status')).toContainText('불러오지 못했습니다');
  await expect(page.locator('#action')).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(page.locator('#action')).toBeVisible();
  expect((await shipBounds(page)).pixels).toBe(0);
});
