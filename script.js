// PONG — original game logic preserved and extended with site-wide theme support.
// Original mechanics: mouse + arrow keys, CPU paddle, wall/paddle bounces, scoring,
// reset and pause/resume.

const themeBtn = document.getElementById('themeBtn');

if (localStorage.getItem('pong-theme') === 'light') {
  document.documentElement.classList.add('light');
}

function updateThemeIcon() {
  if (themeBtn) {
    themeBtn.textContent =
      document.documentElement.classList.contains('light') ? '☀' : '☾';
  }
}

updateThemeIcon();

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    localStorage.setItem(
      'pong-theme',
      document.documentElement.classList.contains('light') ? 'light' : 'dark'
    );
    updateThemeIcon();
  });
}

// Game code only runs on game.html.
const canvas = document.getElementById('game');

if (canvas) {
  const ctx = canvas.getContext('2d');

  const scoreLeftEl = document.getElementById('leftScore');
  const scoreRightEl = document.getElementById('rightScore');
  const resetBtn = document.getElementById('resetBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const statusText = document.getElementById('statusText');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const paddleWidth = 12;
  const paddleHeight = 110;
  const paddleSpeed = 6;
  const aiSpeed = 4.2;

  let leftScore = 0;
  let rightScore = 0;
  let paused = false;

  const leftPaddle = {
    x: 12,
    y: (HEIGHT - paddleHeight) / 2,
    w: paddleWidth,
    h: paddleHeight,
    dy: 0
  };

  const rightPaddle = {
    x: WIDTH - paddleWidth - 12,
    y: (HEIGHT - paddleHeight) / 2,
    w: paddleWidth,
    h: paddleHeight,
    dy: 0
  };

  const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    r: 9,
    speed: 6,
    vx: 0,
    vy: 0,
    stuck: true
  };

  function setStatus(text) {
    if (statusText) statusText.textContent = text;
  }

  function resetBall(toRight = true) {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ball.speed = 6;

    const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
    const sign = toRight ? 1 : -1;

    ball.vx = sign * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
    ball.stuck = false;
  }

  function serveAfterDelay(toRight) {
    ball.stuck = true;
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    setStatus(paused ? 'PAUSED' : 'SERVING');

    setTimeout(() => {
      if (!paused) {
        resetBall(toRight);
        setStatus('LIVE');
      }
    }, 600);
  }

  function clamp(val, a, b) {
    return Math.max(a, Math.min(b, val));
  }

  function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNet() {
    const light = document.documentElement.classList.contains('light');

    ctx.strokeStyle = light ? '#c9cdd5' : '#444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 10);
    ctx.lineTo(WIDTH / 2, HEIGHT - 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    const light = document.documentElement.classList.contains('light');

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = light ? '#f8f9fa' : '#0b0b0b';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawNet();

    drawRect(
      leftPaddle.x, leftPaddle.y, leftPaddle.w, leftPaddle.h,
      light ? '#16181d' : '#8ecae6'
    );

    drawRect(
      rightPaddle.x, rightPaddle.y, rightPaddle.w, rightPaddle.h,
      light ? '#555b66' : '#ffb703'
    );

    drawCircle(
      ball.x, ball.y, ball.r,
      light ? '#111318' : '#ffd166'
    );
  }

  function update() {
    if (paused) return;

    leftPaddle.y += leftPaddle.dy;
    leftPaddle.y = clamp(leftPaddle.y, 0, HEIGHT - leftPaddle.h);

    const targetY = ball.y - rightPaddle.h / 2;
    const diff = targetY - rightPaddle.y;

    if (Math.abs(diff) > 2) {
      rightPaddle.y += Math.sign(diff) * aiSpeed;
    }

    rightPaddle.y = clamp(rightPaddle.y, 0, HEIGHT - rightPaddle.h);

    if (!ball.stuck) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y - ball.r <= 0) {
        ball.y = ball.r;
        ball.vy *= -1;
      } else if (ball.y + ball.r >= HEIGHT) {
        ball.y = HEIGHT - ball.r;
        ball.vy *= -1;
      }

      if (ball.x - ball.r <= leftPaddle.x + leftPaddle.w) {
        if (
          ball.y >= leftPaddle.y &&
          ball.y <= leftPaddle.y + leftPaddle.h
        ) {
          const relativeY =
            ball.y - (leftPaddle.y + leftPaddle.h / 2);
          const normalized = relativeY / (leftPaddle.h / 2);
          const maxBounce = Math.PI / 3;
          const bounceAngle = normalized * maxBounce;

          ball.speed *= 1.03;
          ball.vx = ball.speed * Math.cos(bounceAngle);
          ball.vy = ball.speed * Math.sin(bounceAngle);
          ball.x =
            leftPaddle.x + leftPaddle.w + ball.r + 0.1;
        }
      }

      if (ball.x + ball.r >= rightPaddle.x) {
        if (
          ball.y >= rightPaddle.y &&
          ball.y <= rightPaddle.y + rightPaddle.h
        ) {
          const relativeY =
            ball.y - (rightPaddle.y + rightPaddle.h / 2);
          const normalized = relativeY / (rightPaddle.h / 2);
          const maxBounce = Math.PI / 3;
          const bounceAngle = normalized * maxBounce;

          ball.speed *= 1.03;
          ball.vx = -ball.speed * Math.cos(bounceAngle);
          ball.vy = ball.speed * Math.sin(bounceAngle);
          ball.x = rightPaddle.x - ball.r - 0.1;
        }
      }

      if (ball.x < -50) {
        rightScore += 1;
        updateScores();
        serveAfterDelay(true);
      } else if (ball.x > WIDTH + 50) {
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

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const scaleY = HEIGHT / rect.height;

    leftPaddle.y = clamp(
      mouseY * scaleY - leftPaddle.h / 2,
      0,
      HEIGHT - leftPaddle.h
    );
  });

  const keys = {};

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      leftPaddle.dy = -paddleSpeed;
      keys.ArrowUp = true;
    } else if (e.key === 'ArrowDown') {
      leftPaddle.dy = paddleSpeed;
      keys.ArrowDown = true;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      paused = !paused;
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      setStatus(paused ? 'PAUSED' : 'LIVE');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') {
      keys.ArrowUp = false;
      leftPaddle.dy = keys.ArrowDown ? paddleSpeed : 0;
    } else if (e.key === 'ArrowDown') {
      keys.ArrowDown = false;
      leftPaddle.dy = keys.ArrowUp ? -paddleSpeed : 0;
    }
  });

  resetBtn.addEventListener('click', () => {
    leftScore = 0;
    rightScore = 0;
    updateScores();
    serveAfterDelay(Math.random() >= 0.5);
  });

  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    setStatus(paused ? 'PAUSED' : 'LIVE');
  });

  updateScores();
  serveAfterDelay(Math.random() >= 0.5);
  requestAnimationFrame(loop);
}
