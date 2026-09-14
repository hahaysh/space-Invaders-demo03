export const RULES = Object.freeze({
  width: 800,
  height: 600,
  playerSpeed: 320,
  bulletSpeed: 600,
  shotInterval: 0.2,
  enemySpeed: 64,
  descent: 24,
  defenseLine: 520,
});

export function createGame(status = 'title') {
  return {
    status,
    score: 0,
    elapsed: 0,
    shotWait: 0,
    player: { x: 380, y: 550, width: 40, height: 20 },
    bullets: [],
    direction: 1,
    enemies: Array.from({ length: 24 }, (_, index) => ({
      x: 112 + 72 * (index % 8),
      y: 72 + 48 * Math.floor(index / 8),
      width: 40,
      height: 24,
    })),
  };
}

export function startGame(game, command) {
  if ((command === 'start' && game.status === 'title') ||
      (command === 'restart' && (game.status === 'won' || game.status === 'lost'))) {
    return createGame('playing');
  }
  return game;
}

export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
    a.y < b.y + b.height && a.y + a.height > b.y;
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
  if (input.fire) {
    let shotTime = game.shotWait;
    while (shotTime <= dt + 1e-9) {
      game.bullets.push({
        x: game.player.x + game.player.width / 2 - 2,
        y: game.player.y - 12 - RULES.bulletSpeed * Math.max(0, dt - shotTime),
        width: 4,
        height: 12,
      });
      shotTime += RULES.shotInterval;
    }
    game.shotWait = shotTime - dt;
  } else {
    game.shotWait = Math.max(0, game.shotWait - dt);
  }
  game.bullets = game.bullets.filter((bullet) => bullet.y + bullet.height > 0);

  if (game.enemies.length > 0) {
    const left = Math.min(...game.enemies.map((enemy) => enemy.x));
    const right = Math.max(...game.enemies.map((enemy) => enemy.x + enemy.width));
    const travel = game.direction * RULES.enemySpeed * dt;
    const touchesEdge = travel > 0 ? right + travel >= RULES.width : travel < 0 && left + travel <= 0;
    const shift = Math.max(-left, Math.min(RULES.width - right, travel));
    for (const enemy of game.enemies) {
      enemy.x += shift;
      if (touchesEdge) enemy.y += RULES.descent;
    }
    if (touchesEdge) game.direction *= -1;
  }

  game.bullets = game.bullets.filter((bullet) => {
    const index = game.enemies.findIndex((enemy) => overlaps(bullet, enemy));
    if (index < 0) return true;
    game.enemies.splice(index, 1);
    game.score += 10;
    return false;
  });
  if (game.enemies.length === 0) {
    game.status = 'won';
  } else if (game.enemies.some((enemy) => enemy.y + enemy.height >= RULES.defenseLine)) {
    game.status = 'lost';
  }
}
