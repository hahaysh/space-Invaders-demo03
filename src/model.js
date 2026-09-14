export const RULES = Object.freeze({
  width: 800,
  height: 600,
  playerSpeed: 320,
  bulletSpeed: 600,
  shotInterval: 0.2,
});

export function createGame(status = 'title') {
  return {
    status,
    score: 0,
    elapsed: 0,
    shotWait: 0,
    player: { x: 380, y: 550, width: 40, height: 20 },
    bullets: [],
  };
}

export function updateGame(game, dt, input) {
  if (game.status !== 'playing') return;
  game.elapsed += dt;
  const movement = Number(input.right) - Number(input.left);
  game.player.x = Math.max(0, Math.min(
    RULES.width - game.player.width,
    game.player.x + movement * RULES.playerSpeed * dt,
  ));
  for (const bullet of game.bullets) bullet.y -= RULES.bulletSpeed * dt;
  game.bullets = game.bullets.filter((bullet) => bullet.y + bullet.height > 0);
  game.shotWait = Math.max(0, game.shotWait - dt);
  if (input.fire && game.shotWait <= 1e-9) {
    game.bullets.push({
      x: game.player.x + game.player.width / 2 - 2,
      y: game.player.y - 12,
      width: 4,
      height: 12,
    });
    game.shotWait = RULES.shotInterval;
  }
}
