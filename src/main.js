import './style.css';
import playerUrl from './assets/ships/playerShip1_blue.png';
import { createGame, updateGame } from './model.js';

const canvas = document.querySelector('#game');
const context = canvas.getContext('2d');
const score = document.querySelector('#score');
const status = document.querySelector('#status');
const action = document.querySelector('#action');
const keys = new Set();
const movementKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']);
let game = createGame();
let playerImage;
let ready = false;
let previousTime = null;

function start() {
  if (!ready || game.status !== 'title') return;
  game = createGame('playing');
  keys.clear();
  previousTime = null;
  action.hidden = true;
  status.textContent = '좌우로 이동하며 Space로 발사하세요.';
  score.textContent = String(game.score);
}

action.addEventListener('click', start);
window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLElement &&
      event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
  if (event.code === 'Enter' && !event.repeat && game.status === 'title') {
    event.preventDefault();
    start();
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
  if (playerImage) {
    context.drawImage(playerImage, game.player.x, game.player.y,
      40, 40 * playerImage.naturalHeight / playerImage.naturalWidth);
  }
  context.fillStyle = '#bce9ff';
  for (const bullet of game.bullets) {
    context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function frame(time) {
  const dt = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  updateGame(game, dt, {
    left: keys.has('ArrowLeft') || keys.has('KeyA'),
    right: keys.has('ArrowRight') || keys.has('KeyD'),
    fire: keys.has('Space'),
  });
  draw();
  requestAnimationFrame(frame);
}

async function loadPlayer() {
  try {
    const image = new Image();
    image.src = playerUrl;
    await image.decode();
    playerImage = image;
    ready = true;
    action.disabled = false;
    status.textContent = '준비 완료. 시작 버튼 또는 Enter를 누르세요.';
  } catch (error) {
    console.error('플레이어 이미지 준비 실패', error);
    status.textContent = '기체 이미지를 불러오지 못했습니다. 새로고침 후 다시 시도하세요.';
    action.disabled = true;
  }
}

score.textContent = String(game.score);
draw();
requestAnimationFrame(frame);
void loadPlayer();
