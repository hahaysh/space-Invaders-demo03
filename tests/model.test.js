import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startGame, updateGame, overlaps } from '../src/model.js';

const idle = { left: false, right: false, fire: false };

test('title is stationary and starts at PRD values', () => {
  const game = createGame();
  const before = structuredClone(game);
  updateGame(game, 1, { left: true, right: false, fire: true });
  assert.deepEqual(game, before);
  assert.deepEqual(game.player, { x: 380, y: 550, width: 40, height: 20 });
  assert.equal(game.score, 0);
});

test('movement clamps whole model and opposite input cancels', () => {
  const game = createGame('playing');
  updateGame(game, 0.5, { ...idle, right: true });
  assert.equal(game.player.x, 540);
  updateGame(game, 3, { ...idle, right: true });
  assert.equal(game.player.x, 760);
  updateGame(game, 3, { ...idle, left: true });
  assert.equal(game.player.x, 0);
  updateGame(game, 1, { ...idle, left: true, right: true });
  assert.equal(game.player.x, 0);
});

test('bullets originate above player, repeat at 0.2s, move and expire', () => {
  const game = createGame('playing');
  updateGame(game, 0, { ...idle, fire: true });
  assert.deepEqual(game.bullets, [{ x: 398, y: 538, width: 4, height: 12 }]);
  updateGame(game, 0.1, { ...idle, fire: true });
  assert.equal(game.bullets.length, 1);
  assert.equal(game.bullets[0].y, 478);
  updateGame(game, 0.1, { ...idle, fire: true });
  assert.equal(game.bullets.length, 2);
  assert.equal(game.bullets[1].y, 538);
  updateGame(game, 1, idle);
  assert.equal(game.bullets.length, 0);
});

test('non-divisible frame times preserve the shot interval without accumulated drift', () => {
  const game = createGame('playing');
  updateGame(game, 0, { ...idle, fire: true });
  for (let i = 0; i < 25; i++) updateGame(game, 0.016, { ...idle, fire: true });
  assert.equal(game.bullets.length, 3);
  assert.ok(Math.abs(game.bullets[2].y - 538) < 1e-8);
  assert.ok(Math.abs(game.shotWait - 0.2) < 1e-8);
});

test('formation has PRD coordinates, speed, direction and single edge descent', () => {
  const game = createGame('playing');
  assert.equal(game.enemies.length, 24);
  assert.deepEqual(game.enemies[0], { x: 112, y: 72, width: 40, height: 24 });
  assert.deepEqual(game.enemies[23], { x: 616, y: 168, width: 40, height: 24 });
  updateGame(game, 1, idle);
  assert.equal(game.enemies[0].x, 176);
  updateGame(game, 1.25, idle);
  assert.equal(game.direction, -1);
  assert.equal(game.enemies[7].x, 760);
  assert.equal(game.enemies[0].y, 96);
  updateGame(game, 0.05, idle);
  assert.equal(game.direction, -1);
  assert.equal(game.enemies[0].y, 96);
  game.enemies = [{ x: 0.5, y: 72, width: 40, height: 24 }];
  updateGame(game, 0.05, idle);
  assert.equal(game.enemies[0].x, 0);
  assert.equal(game.enemies[0].y, 96);
  assert.equal(game.direction, 1);
});

test('strict overlap excludes each touching edge and includes small penetration', () => {
  const target = { x: 100, y: 100, width: 40, height: 24 };
  for (const bullet of [
    { x: 96, y: 101 }, { x: 140, y: 101 },
    { x: 101, y: 88 }, { x: 101, y: 124 },
  ]) assert.equal(overlaps({ ...bullet, width: 4, height: 12 }, target), false);
  assert.equal(overlaps({ x: 96.001, y: 101, width: 4, height: 12 }, target), true);
});

test('one bullet consumes only one overlapping enemy; dead enemies cannot score again', () => {
  const game = createGame('playing');
  const enemy = { x: 100, y: 100, width: 40, height: 24 };
  const bullet = { x: 110, y: 110, width: 4, height: 12 };
  game.enemies = [{ ...enemy }, { ...enemy }];
  game.bullets = [{ ...bullet }];
  updateGame(game, 0, idle);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.score, 10);
  assert.equal(game.bullets.length, 0);
  game.bullets = [{ ...bullet }, { ...bullet }];
  updateGame(game, 0, idle);
  assert.equal(game.score, 20);
  assert.equal(game.bullets.length, 1);
  assert.equal(game.status, 'won');
  updateGame(game, 1, { ...idle, fire: true });
  assert.equal(game.score, 20);
});

test('collision runs after movement and last kill wins over same-step defense arrival', () => {
  const game = createGame('playing');
  game.enemies = [{ x: 760, y: 472, width: 40, height: 24 }];
  game.bullets = [{ x: 780, y: 526, width: 4, height: 12 }];
  updateGame(game, 0.05, idle);
  assert.equal(game.status, 'won');
  assert.equal(game.score, 10);
  const loss = createGame('playing');
  loss.enemies = [{ x: 100, y: 496, width: 40, height: 24 }];
  updateGame(loss, 0, idle);
  assert.equal(loss.status, 'lost');
  const notYet = createGame('playing');
  notYet.enemies = [{ x: 100, y: 495.999, width: 40, height: 24 }];
  updateGame(notYet, 0, idle);
  assert.equal(notYet.status, 'playing');
});

test('both terminal states freeze every field and restart restores every model value', () => {
  for (const status of ['won', 'lost']) {
    const game = createGame('playing');
    updateGame(game, 1, { ...idle, left: true, fire: true });
    game.status = status;
    game.score = 100;
    game.direction = -1;
    game.enemies.pop();
    const before = structuredClone(game);
    updateGame(game, 10, { ...idle, right: true, fire: true });
    assert.deepEqual(game, before);
    const restarted = startGame(game, 'restart');
    assert.notEqual(restarted, game);
    assert.deepEqual(restarted, createGame('playing'));
    assert.equal(startGame(game, 'start'), game);
  }
  const title = createGame();
  assert.equal(startGame(title, 'restart'), title);
  assert.deepEqual(startGame(title, 'start'), createGame('playing'));
  const playing = createGame('playing');
  assert.equal(startGame(playing, 'start'), playing);
  assert.equal(startGame(playing, 'restart'), playing);
});

test('bounded normal sweep wins at 240, idle play loses, no model shortcuts', () => {
  for (const fire of [true, false]) {
    const game = createGame('playing');
    for (let i = 0; i < 60 * 120 && game.status === 'playing'; i++) {
      const right = Math.floor(i / 120) % 2 === 0;
      updateGame(game, 1 / 60, { left: fire && !right, right: fire && right, fire });
    }
    assert.equal(game.status, fire ? 'won' : 'lost');
    assert.equal(game.score, fire ? 240 : 0);
  }
});
