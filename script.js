// Simple Pong-like game: left paddle controlled by mouse + arrow keys, right paddle is computer.
// Ball bounces off paddles and walls, scoreboard updates.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreLeftEl = document.getElementById('leftScore');
const scoreRightEl = document.getElementById('rightScore');
const resetBtn = document.getElementById('resetBtn');
const pauseBtn = document.getElementById('pauseBtn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const paddleWidth = 12;
const paddleHeight = 110;
const paddleSpeed = 6;
const aiSpeed = 4.2;

let leftScore = 0;
let rightScore = 0;
let paused = false;

const leftPaddle = { x: 12, y: (HEIGHT - paddleHeight) / 2, w: paddleWidth, h: paddleHeight, dy: 0 };
const rightPaddle = { x: WIDTH - paddleWidth - 12, y: (HEIGHT - paddleHeight) / 2, w: paddleWidth, h: paddleHeight, dy: 0 };

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  r: 9,
  speed: 6,
  vx: 0,
  vy: 0,
  stuck: true
};

function resetBall(toRight = true) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = 6;
  // launch at a random small angle
  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6); // -30deg .. +30deg
  const sign = toRight ? 1 : -1;
  ball.vx = sign * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
  ball.stuck = false;
}

function serveAfterDelay(toRight) {
  ball.stuck = true;
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  setTimeout(() => resetBall(toRight), 600);
}

function clamp(val, a, b) { return Math.max(a, Math.min(b, val)); }

function drawRect(x, y, w, h, color = '#fff') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color = '#fff') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawNet() {
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 10);
  ctx.lineTo(WIDTH / 2, HEIGHT - 10);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw() {
  // clear
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // background subtle grid
  // draw middle net
  drawNet();

  // paddles
  drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.w, leftPaddle.h, '#8ecae6');
  drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.w, rightPaddle.h, '#ffb703');

  // ball
  drawCircle(ball.x, ball.y, ball.r, '#ffd166');
}

function update() {
  if (paused) return;

  // Move left paddle by keyboard
  leftPaddle.y += leftPaddle.dy;
  // Keep left paddle in bounds
  leftPaddle.y = clamp(leftPaddle.y, 0, HEIGHT - leftPaddle.h);

  // Simple AI for right paddle: move toward ball center
  const targetY = ball.y - rightPaddle.h / 2;
  const diff = targetY - rightPaddle.y;
  if (Math.abs(diff) > 2) {
    rightPaddle.y += Math.sign(diff) * aiSpeed;
  }
  rightPaddle.y = clamp(rightPaddle.y, 0, HEIGHT - rightPaddle.h);

  if (!ball.stuck) {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // top/bottom wall collision
    if (ball.y - ball.r <= 0) {
      ball.y = ball.r;
      ball.vy *= -1;
    } else if (ball.y + ball.r >= HEIGHT) {
      ball.y = HEIGHT - ball.r;
      ball.vy *= -1;
    }

    // left paddle collision
    if (ball.x - ball.r <= leftPaddle.x + leftPaddle.w) {
      if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + leftPaddle.h) {
        // calculate bounce based on where it hit the paddle
        const relativeY = (ball.y - (leftPaddle.y + leftPaddle.h / 2));
        const normalized = relativeY / (leftPaddle.h / 2);
        const maxBounce = Math.PI / 3; // 60 degrees
        const bounceAngle = normalized * maxBounce;
        const sign = 1; // bounce to right
        ball.speed *= 1.03; // small speedup
        ball.vx = sign * ball.speed * Math.cos(bounceAngle);
        ball.vy = ball.speed * Math.sin(bounceAngle);
        ball.x = leftPaddle.x + leftPaddle.w + ball.r + 0.1;
      }
    }

    // right paddle collision
    if (ball.x + ball.r >= rightPaddle.x) {
      if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + rightPaddle.h) {
        const relativeY = (ball.y - (rightPaddle.y + rightPaddle.h / 2));
        const normalized = relativeY / (rightPaddle.h / 2);
        const maxBounce = Math.PI / 3;
        const bounceAngle = normalized * maxBounce;
        const sign = -1; // bounce to left
        ball.speed *= 1.03;
        ball.vx = sign * ball.speed * Math.cos(bounceAngle);
        ball.vy = ball.speed * Math.sin(bounceAngle);
        ball.x = rightPaddle.x - ball.r - 0.1;
      }
    }

    // scoring
    if (ball.x < -50) {
      // right player scores
      rightScore += 1;
      updateScores();
      serveAfterDelay(true); // serve to the right (toward right side) => ball moves right
    } else if (ball.x > WIDTH + 50) {
      // left player scores
      leftScore += 1;
      updateScores();
      serveAfterDelay(false);
    }
  }
}

function updateScores() {
  scoreLeftEl.textContent = leftScore;
  scoreRightEl.textContent = rightScore;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Controls: mouse move
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  // center paddle on mouse
  leftPaddle.y = clamp(mouseY - leftPaddle.h / 2, 0, HEIGHT - leftPaddle.h);
});

// Keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    leftPaddle.dy = -paddleSpeed;
    keys['ArrowUp'] = true;
  } else if (e.key === 'ArrowDown') {
    leftPaddle.dy = paddleSpeed;
    keys['ArrowDown'] = true;
  } else if (e.key === ' ' || e.key === 'Spacebar') {
    // space to pause/unpause
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') {
    keys['ArrowUp'] = false;
    if (keys['ArrowDown']) leftPaddle.dy = paddleSpeed;
    else leftPaddle.dy = 0;
  } else if (e.key === 'ArrowDown') {
    keys['ArrowDown'] = false;
    if (keys['ArrowUp']) leftPaddle.dy = -paddleSpeed;
    else leftPaddle.dy = 0;
  }
});

// Buttons
resetBtn.addEventListener('click', () => {
  leftScore = 0;
  rightScore = 0;
  updateScores();
  serveAfterDelay(Math.random() >= 0.5);
});
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
});

// Start game
updateScores();
serveAfterDelay(Math.random() >= 0.5);
requestAnimationFrame(loop);