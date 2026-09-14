import './style.css';
import playerUrl from './assets/ships/playerShip1_blue.png';
import enemyUrl from './assets/ships/enemyRed1.png';
import { createGame, startGame, updateGame, RULES } from './model.js';

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const score = document.querySelector('#score');
const status = document.querySelector('#status');
const action = document.querySelector('#action');
const keys = new Set();
const movementKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']);
let game = createGame();
let playerImage;
let enemyImage;
let ready = false;
let previousTime = null;

function beginRound(command) {
  if (!ready) return;
  const next = startGame(game, command);
  if (next === game) return;
  game = next;
  keys.clear();
  previousTime = null;
  syncUI();
  draw();
}

function syncUI() {
  score.textContent = String(game.score);
  action.hidden = game.status === 'playing';
  action.textContent = game.status === 'title' ? '시작' : '재시작';
  if (game.status === 'playing') {
    status.textContent = '적 편대를 모두 제거하세요. 방어선에 도달하면 패배합니다.';
  } else if (game.status === 'won') {
    status.textContent = '승리! 모든 적을 막았습니다. 재시작 버튼 또는 R을 누르세요.';
  } else if (game.status === 'lost') {
    status.textContent = '패배. 적이 방어선에 도달했습니다. 재시작 버튼 또는 R을 누르세요.';
  }
}

action.addEventListener('click', () => beginRound(game.status === 'title' ? 'start' : 'restart'));
window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLElement &&
      event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
  if (event.code === 'Enter' && !event.repeat && game.status === 'title') {
    event.preventDefault();
    beginRound('start');
  }
  if (event.code === 'KeyR' && !event.repeat && (game.status === 'won' || game.status === 'lost')) {
    event.preventDefault();
    beginRound('restart');
  }
  if (game.status === 'playing' && movementKeys.has(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) keys.clear();
});

function draw() {
  context.fillStyle = '#0b1428';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#536580';
  context.fillRect(0, RULES.defenseLine, canvas.width, 1);
  if (playerImage) {
    context.drawImage(playerImage, game.player.x, game.player.y,
      40, 40 * playerImage.naturalHeight / playerImage.naturalWidth);
  }
  if (enemyImage) {
    const height = 40 * enemyImage.naturalHeight / enemyImage.naturalWidth;
    for (const enemy of game.enemies) {
      context.drawImage(enemyImage, enemy.x, enemy.y + enemy.height - height, 40, height);
    }
  }
  context.fillStyle = '#bce9ff';
  for (const bullet of game.bullets) {
    context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function frame(time) {
  const dt = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  const previousStatus = game.status;
  updateGame(game, dt, {
    left: keys.has('ArrowLeft') || keys.has('KeyA'),
    right: keys.has('ArrowRight') || keys.has('KeyD'),
    fire: keys.has('Space'),
  });
  if (game.status !== previousStatus) keys.clear();
  if (game.status !== previousStatus || score.textContent !== String(game.score)) syncUI();
  draw();
  requestAnimationFrame(frame);
}

async function loadImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function loadImages() {
  try {
    [playerImage, enemyImage] = await Promise.all([loadImage(playerUrl), loadImage(enemyUrl)]);
    ready = true;
    action.disabled = false;
    status.textContent = '준비 완료. 시작 버튼 또는 Enter를 누르세요.';
  } catch (error) {
    console.error('기체 이미지 준비 실패', error);
    status.textContent = '기체 이미지를 불러오지 못했습니다. 새로고침 후 다시 시도하세요.';
    action.disabled = true;
  }
}

score.textContent = String(game.score);
draw();
requestAnimationFrame(frame);
void loadImages();
