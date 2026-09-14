import { test, expect } from '@playwright/test';

async function ready(page) {
  await page.goto('./');
  await expect(page.getByRole('button', { name: '시작', exact: true })).toBeEnabled();
}

async function routeImage(page, filename, handler) {
  await page.route((url) => url.pathname.endsWith(filename), (route) => {
    if (route.request().resourceType() === 'image') return handler(route);
    return route.continue();
  });
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
  const response = await request.get('./');
  expect(await response.text()).toContain('aria-labelledby="score-label">0</output>');
});

test('real button, keyboard, boundaries, fire and blur', async ({ page }) => {
  await ready(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole('button', { name: '시작', exact: true }).click();
  await expect(page.locator('#score')).toHaveText('0');
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
  expect(Number(await page.locator('#score').textContent()) % 10).toBe(0);
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
  await routeImage(page, '.png', async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#action')).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(page.locator('#action')).toBeVisible();
  await expect(page.locator('#status')).toContainText('준비하고');
  release();
  await expect(page.locator('#action')).toBeEnabled();
});

test('failed image shows explicit error and never substitutes a shape', async ({ page }) => {
  await routeImage(page, '.png', (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('#status')).toContainText('불러오지 못했습니다');
  await expect(page.locator('#action')).toBeDisabled();
  await page.keyboard.press('Enter');
  await expect(page.locator('#action')).toBeVisible();
  expect((await shipBounds(page)).pixels).toBe(0);
});

async function controlledStart(page) {
  await ready(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
}

test('normal keyboard sweep wins, card stays fixed, terminal freezes, R resets', async ({ page }) => {
  await controlledStart(page);
  const card = await page.locator('.stat-card').boundingBox();
  await page.keyboard.down('Space');
  for (let step = 0; step < 40; step++) {
    const key = step % 2 === 0 ? 'ArrowRight' : 'ArrowLeft';
    await page.keyboard.down(key);
    await page.clock.runFor(2000);
    await page.keyboard.up(key);
    if (await page.locator('#action').isVisible()) break;
  }
  await expect(page.locator('#status')).toContainText('승리!');
  await expect(page.locator('#score')).toHaveText('240');
  expect(await page.locator('.stat-card').boundingBox()).toEqual(card);
  const frozen = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL());
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(1000);
  await page.keyboard.press('Enter');
  expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).toBe(frozen);
  await expect(page.locator('#score')).toHaveText('240');
  await page.keyboard.press('r');
  await expect(page.locator('#action')).toBeHidden();
  await expect(page.locator('#score')).toHaveText('0');
  await page.clock.runFor(32);
  const initial = await shipBounds(page);
  expect(initial.minX).toBeGreaterThanOrEqual(380);
  expect(initial.maxX).toBeLessThan(420);
  await page.clock.runFor(300);
  expect(await shipBounds(page)).toEqual(initial);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.up('Space');
});

test('loss freezes, repeat R ignored, button restarts repeatedly with a single loop', async ({ page }) => {
  test.setTimeout(120000);
  await controlledStart(page);
  for (let round = 0; round < 3; round++) {
    await page.keyboard.down('r');
    await page.clock.runFor(56000);
    await expect(page.locator('#status')).toContainText('패배.');
    const frozen = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL());
    await page.keyboard.down('r');
    await page.keyboard.down('Space');
    await page.keyboard.down('ArrowRight');
    await page.clock.runFor(1000);
    expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).toBe(frozen);
    await page.keyboard.up('r');
    await page.keyboard.up('Space');
    await page.getByRole('button', { name: '재시작', exact: true }).click();
    await page.clock.runFor(32);
    const initial = await shipBounds(page);
    await page.clock.runFor(250);
    expect(await shipBounds(page)).toEqual(initial);
    await page.keyboard.up('ArrowRight');
    await page.keyboard.down('d');
    await page.clock.runFor(500);
    expect((await shipBounds(page)).minX - initial.minX).toBeCloseTo(160, -1);
    await page.keyboard.up('d');
    await page.keyboard.press('Enter');
    await page.keyboard.press('r');
    expect((await shipBounds(page)).minX).toBeGreaterThan(530);
  }
});

for (const file of ['playerShip1_blue.png', 'enemyRed1.png']) {
  test(`only ${file} delayed still blocks the whole game`, async ({ page }) => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    await routeImage(page, file, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#action')).toBeDisabled();
    await page.keyboard.down('Enter');
    release();
    await expect(page.locator('#action')).toBeEnabled();
    await page.keyboard.down('Enter');
    await expect(page.locator('#action')).toBeVisible();
    await page.keyboard.up('Enter');
    await page.keyboard.press('Enter');
    await expect(page.locator('#action')).toBeHidden();
  });

  test(`only ${file} failing is an explicit blocked state`, async ({ page }) => {
    await routeImage(page, file, (route) => route.abort());
    await page.goto('./');
    await expect(page.locator('#status')).toContainText('불러오지 못했습니다');
    await expect(page.locator('#action')).toBeDisabled();
  });
}

test('actual decoded PNG raster is multicolor with transparency and exact alignment', async ({ page }) => {
  const failures = [];
  const external = [];
  page.on('requestfailed', (request) => failures.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(test.info().project.use.baseURL).origin) {
      external.push(request.url());
    }
  });
  await page.addInitScript(() => {
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    window.rasterObservations = [];
    CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
      if (this.canvas.id === 'game') {
        window.rasterObservations.push({ image, args });
        if (window.rasterObservations.length > 25) window.rasterObservations.shift();
      }
      return draw.call(this, image, ...args);
    };
  });
  await ready(page);
  await expect.poll(() => page.evaluate(() => window.rasterObservations.length)).toBe(25);
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('#game');
    return window.rasterObservations.map(({ image, args }) => {
      const [x, y, width, height] = args;
      const reference = document.createElement('canvas');
      reference.width = 800;
      reference.height = 600;
      const ctx = reference.getContext('2d');
      ctx.drawImage(image, x, y, width, height);
      const expected = ctx.getImageData(0, 0, 800, 600).data;
      const actual = canvas.getContext('2d').getImageData(0, 0, 800, 600).data;
      const colors = new Set();
      let opaque = 0;
      let different = 0;
      for (let i = 0; i < expected.length; i += 4) {
        if (expected[i + 3] === 0) continue;
        colors.add(`${expected[i]},${expected[i + 1]},${expected[i + 2]}`);
        if (expected[i + 3] === 255) {
          opaque++;
          if (expected[i] !== actual[i] || expected[i + 1] !== actual[i + 1] ||
              expected[i + 2] !== actual[i + 2]) different++;
        }
      }
      return { args, natural: [image.naturalWidth, image.naturalHeight],
        opaque, different, colors: colors.size, decoded: image.complete };
    });
  });
  expect(result).toHaveLength(25);
  const player = result.find((item) => item.natural[0] === 99);
  expect(player.args).toEqual([380, 550, 40, 40 * 75 / 99]);
  const enemies = result.filter((item) => item.natural[0] === 93);
  expect(enemies).toHaveLength(24);
  for (let i = 0; i < 24; i++) {
    expect(enemies[i].args).toEqual([
      112 + 72 * (i % 8), 72 + 48 * Math.floor(i / 8) + 24 - 40 * 84 / 93, 40, 40 * 84 / 93,
    ]);
  }
  for (const item of result) {
    expect(item.opaque).toBeGreaterThan(100);
    expect(item.different).toBe(0);
    expect(item.colors).toBeGreaterThan(20);
    expect(item.decoded).toBe(true);
  }
  expect(failures).toEqual([]);
  expect(external).toEqual([]);
});

test('native browser frame focus clears held movement without pausing the game', async ({ page }) => {
  await controlledStart(page);
  await page.bringToFront();
  await page.evaluate(() => {
    window.observedBlur = false;
    window.addEventListener('blur', () => { window.observedBlur = true; });
  });
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(200);
  await page.evaluate(() => {
    const frame = document.createElement('iframe');
    frame.id = 'focus-probe';
    frame.srcdoc = '<button>Focus target</button>';
    frame.style.cssText = 'position:fixed;top:0;left:0;width:150px;height:50px';
    document.body.append(frame);
  });
  await page.frameLocator('#focus-probe').getByRole('button', { name: 'Focus target' }).click();
  await expect.poll(() => page.evaluate(() => window.observedBlur)).toBe(true);
  const before = await shipBounds(page);
  const canvasBefore = await page.locator('canvas').evaluate((canvas) => canvas.toDataURL());
  await page.clock.runFor(500);
  expect(await shipBounds(page)).toEqual(before);
  expect(await page.locator('canvas').evaluate((canvas) => canvas.toDataURL())).not.toEqual(canvasBefore);
  await page.locator('#focus-probe').evaluate((frame) => frame.remove());
  await page.locator('h1').click();
  await page.keyboard.up('ArrowRight');
});
