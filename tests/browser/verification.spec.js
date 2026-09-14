import { test, expect } from '@playwright/test';

for (const width of [99, 93]) {
  for (const outcome of ['delay', 'reject']) {
    test(`portable decode ${width} independently ${outcome}s after successful image loading`, async ({ page }) => {
      await page.addInitScript(({ width, outcome }) => {
        const decode = HTMLImageElement.prototype.decode;
        window.decodeProbe = { loaded: false };
        HTMLImageElement.prototype.decode = async function () {
          await decode.call(this);
          if (this.naturalWidth !== width) return;
          window.decodeProbe.loaded = this.complete && this.naturalHeight > 0;
          if (outcome === 'reject') throw new DOMException('Test decode rejection', 'EncodingError');
          await new Promise((resolve) => { window.decodeProbe.release = resolve; });
        };
      }, { width, outcome });
      await page.goto('./');
      await expect.poll(() => page.evaluate(() => window.decodeProbe.loaded)).toBe(true);
      await expect(page.locator('#action')).toBeDisabled();
      await page.keyboard.press('Enter');
      await expect(page.locator('#action')).toBeVisible();
      if (outcome === 'delay') {
        await expect(page.locator('#status')).toContainText('준비하고');
        await page.evaluate(() => window.decodeProbe.release());
        await expect(page.locator('#action')).toBeEnabled();
        await page.keyboard.press('Enter');
        await expect(page.locator('#action')).toBeHidden();
      } else {
        await expect(page.locator('#status')).toContainText('불러오지 못했습니다');
        await expect(page.locator('#action')).toBeDisabled();
        const painted = await page.locator('canvas').evaluate((canvas) => {
          const data = canvas.getContext('2d').getImageData(0, 540, 800, 60).data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 11 || data[i + 1] !== 20 || data[i + 2] !== 40) return true;
          }
          return false;
        });
        expect(painted).toBe(false);
      }
    });
  }
}

test('portable game keys prevent scrolling only during play and leave editing controls alone', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#action')).toBeEnabled();
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.evaluate(() => {
    window.keyObservations = [];
    window.addEventListener('keydown', (event) => {
      window.keyObservations.push({ code: event.code, prevented: event.defaultPrevented });
    });
  });
  await page.locator('h1').click();
  for (const key of ['ArrowLeft', 'ArrowRight', 'a', 'd', 'Space']) await page.keyboard.press(key);
  expect(await page.evaluate(() => window.keyObservations.every((event) => !event.prevented))).toBe(true);
  await page.keyboard.press('Enter');
  await page.clock.runFor(32);
  await page.evaluate(() => { window.keyObservations = []; });
  await page.locator('h1').click();
  const scrollBefore = await page.evaluate(() => scrollY);
  for (const key of ['ArrowLeft', 'ArrowRight', 'a', 'd', 'Space']) await page.keyboard.press(key);
  await page.clock.runFor(100);
  expect(await page.evaluate(() => window.keyObservations)).toEqual([
    { code: 'ArrowLeft', prevented: true }, { code: 'ArrowRight', prevented: true },
    { code: 'KeyA', prevented: true }, { code: 'KeyD', prevented: true },
    { code: 'Space', prevented: true },
  ]);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  await page.evaluate(() => {
    const controls = document.createElement('div');
    controls.id = 'editing-probe';
    controls.innerHTML = '<input aria-label="Probe input"><textarea aria-label="Probe textarea"></textarea>' +
      '<select aria-label="Probe select"><option>One</option><option>Two</option></select>' +
      '<div contenteditable="true" aria-label="Probe editable"></div>';
    document.body.append(controls);
  });
  for (const label of ['Probe input', 'Probe textarea', 'Probe select', 'Probe editable']) {
    await page.getByLabel(label).focus();
    await page.evaluate(() => { window.keyObservations = []; });
    for (const key of ['ArrowLeft', 'ArrowRight', 'a', 'd', 'Space', 'Enter', 'r']) {
      await page.keyboard.press(key);
    }
    const lowerCanvas = () => page.locator('canvas').evaluate((canvas) => {
      const region = document.createElement('canvas');
      region.width = 800;
      region.height = 200;
      region.getContext('2d').drawImage(canvas, 0, 400, 800, 200, 0, 0, 800, 200);
      return region.toDataURL();
    });
    const before = await lowerCanvas();
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.clock.runFor(300);
    expect(await lowerCanvas()).toEqual(before);
    await page.keyboard.up('Space');
    await page.keyboard.up('ArrowRight');
    expect(await page.evaluate(() => window.keyObservations.every((event) => !event.prevented))).toBe(true);
    await expect(page.locator('#action')).toBeHidden();
    if (label !== 'Probe select') {
      expect(await page.getByLabel(label).evaluate((element) => element.value ?? element.textContent)).toContain('ad');
    }
  }
  await page.locator('#editing-probe').evaluate((element) => element.remove());
});

test('portable PC card controls and canvas do not overlap in title playing or loss', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('./');
  await expect(page.locator('#action')).toBeEnabled();
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  for (const state of ['title', 'playing', 'lost']) {
    if (state === 'playing') {
      await page.getByRole('button', { name: '시작', exact: true }).click();
      await page.clock.runFor(32);
    }
    if (state === 'lost') {
      await page.clock.runFor(56000);
      await expect(page.locator('#status')).toContainText('패배.');
    }
    for (const width of [1100, 820, 640]) {
      await page.setViewportSize({ width, height: 1000 });
      const geometry = await page.evaluate(() => {
        const rect = (selector) => {
          const box = document.querySelector(selector).getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        };
        const hud = getComputedStyle(document.querySelector('.hud'));
        const card = getComputedStyle(document.querySelector('.stat-card'));
        const label = getComputedStyle(document.querySelector('.stat-label'));
        const value = getComputedStyle(document.querySelector('#score'));
        return {
          width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          hud: rect('.hud'), card: rect('.stat-card'), controls: rect('.controls'),
          status: rect('#status'), button: document.querySelector('#action').hidden ? null : rect('#action'),
          canvas: rect('canvas'), count: document.querySelectorAll('.stat-card').length,
          styles: { hud: hud.backgroundColor, card: card.backgroundColor, border: card.borderTopColor,
            radius: card.borderRadius, label: label.fontSize, value: value.fontSize, weight: value.fontWeight },
        };
      });
      expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
      expect(geometry.count).toBe(1);
      for (const rect of [geometry.hud, geometry.card, geometry.controls, geometry.canvas]) {
        expect(rect.left).toBeGreaterThanOrEqual(0);
        expect(rect.right).toBeLessThanOrEqual(width);
      }
      expect(geometry.card.top).toBeGreaterThan(geometry.hud.top);
      expect(geometry.card.bottom).toBeLessThan(geometry.hud.bottom);
      expect(geometry.hud.bottom).toBeLessThanOrEqual(geometry.controls.top);
      expect(geometry.controls.bottom).toBeLessThanOrEqual(geometry.canvas.top);
      expect(geometry.status.top).toBeGreaterThanOrEqual(geometry.controls.top);
      expect(geometry.status.bottom).toBeLessThanOrEqual(geometry.controls.bottom);
      if (geometry.button) {
        expect(geometry.status.right).toBeLessThan(geometry.button.left);
        expect(geometry.button.bottom).toBeLessThanOrEqual(geometry.controls.bottom);
      }
      expect(geometry.styles).toEqual({
        hud: 'rgb(16, 28, 50)', card: 'rgb(26, 42, 68)', border: 'rgb(52, 69, 96)',
        radius: '12px', label: '12px', value: '32px', weight: '750',
      });
    }
  }
});

test('portable normal resources have correct MIME without errors or external requests', async ({ page }) => {
  const errors = [];
  const resources = [];
  const origin = new URL(test.info().project.use.baseURL).origin;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (request) => errors.push(request.url()));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) errors.push(request.url());
  });
  page.on('response', (response) => {
    resources.push({ status: response.status(), type: response.request().resourceType(),
      mime: response.headers()['content-type'] || '' });
  });
  await page.goto('./');
  await expect(page.locator('#action')).toBeEnabled();
  await expect(page.locator('#status')).toContainText('준비 완료');
  for (const response of resources) {
    expect(response.status).toBeLessThan(400);
    if (response.type === 'document') expect(response.mime).toContain('text/html');
    if (response.type === 'stylesheet') expect(response.mime).toContain('text/css');
    if (response.type === 'script') expect(response.mime).toMatch(/(?:java|ecma)script/);
    if (response.type === 'image') expect(response.mime).toContain('image/png');
  }
  expect(resources.some((response) => response.type === 'document')).toBe(true);
  expect(resources.some((response) => response.type === 'script')).toBe(true);
  expect(errors).toEqual([]);
});
