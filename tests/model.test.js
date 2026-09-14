import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame } from '../src/model.js';

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
