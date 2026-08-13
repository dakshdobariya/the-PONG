const canvas = document.getElementById('pongCanvas') || document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Canvas Dimensions Setup
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 500;

// Game State Variables
let p1Score = 0;
let p2Score = 0;
let shakeTime = 0;

// Paddles Setup
const paddleWidth = 12;
const paddleHeight = 90;

const p1 = { 
    x: 25, 
    y: canvas.height / 2 - 45, 
    w: paddleWidth, 
    h: paddleHeight, 
    color: '#ccff00', // Lime Green Glow
    speed: 8 
};

const p2 = { 
    x: canvas.width - 37, 
    y: canvas.height / 2 - 45, 
    w: paddleWidth, 
    h: paddleHeight, 
    color: '#00f3ff', // Cyan Glow
    speed: 8 
};

// Ball & Trail
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 7,
    speed: 7,
    dx: 5,
    dy: 5,
    trail: [],
    maxTrail: 15
};

// Visual FX Particles
let particles = [];

function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 6,
            dy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 2.5 + 1,
            color: color,
            alpha: 1,
            life: 0.04
        });
    }
}

// Controls Handling
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function resetBall(winner) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 7;
    ball.dx = winner === 1 ? -ball.speed : ball.speed;
    ball.dy = (Math.random() - 0.5) * 8;
    ball.trail = [];
    shakeTime = 8;
}

function update() {
    // Player 1 Movement (W / S)
    if (keys['w'] || keys['W']) p1.y -= p1.speed;
    if (keys['s'] || keys['S']) p1.y += p1.speed;

    // Player 2 Movement (Arrow Keys or Adaptive AI)
    if (keys['ArrowUp']) {
        p2.y -= p2.speed;
    } else if (keys['ArrowDown']) {
        p2.y += p2.speed;
    } else {
        // AI Logic
        let target = ball.y - (p2.h / 2);
        p2.y += (target - p2.y) * 0.09;
    }

    // Keep Paddles inside Screen
    p1.y = Math.max(0, Math.min(canvas.height - p1.h, p1.y));
    p2.y = Math.max(0, Math.min(canvas.height - p2.h, p2.y));

    // Ball Movement & Trail Array
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > ball.maxTrail) ball.trail.shift();

    ball.x += ball.dx;
    ball.y += ball.dy;

    // Wall Bounces
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
        ball.dy *= -1;
        createParticles(ball.x, ball.y, '#ffffff');
    }

    // Paddle Collisions
    let player = (ball.x < canvas.width / 2) ? p1 : p2;

    if (collision(ball, player)) {
        let collidePoint = (ball.y - (player.y + player.h / 2)) / (player.h / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;

        ball.speed = Math.min(ball.speed + 0.6, 18);
        ball.dx = direction * ball.speed * Math.cos(angleRad);
        ball.dy = ball.speed * Math.sin(angleRad);

        createParticles(ball.x, ball.y, player.color);
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        p2Score++;
        resetBall(2);
    } else if (ball.x + ball.radius > canvas.width) {
        p1Score++;
        resetBall(1);
    }

    // Update Particles
    particles.forEach((p, index) => {
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= p.life;
        if (p.alpha <= 0) particles.splice(index, 1);
    });

    if (shakeTime > 0) shakeTime--;
}

function collision(b, p) {
    return b.x - b.radius < p.x + p.w &&
           b.x + b.radius > p.x &&
           b.y + b.radius > p.y &&
           b.y - b.radius < p.y + p.h;
}

// Deep Space Cyber Nebulae Background
function drawDeepSpaceBackground() {
    // 1. Dark Space Base
    ctx.fillStyle = '#030407';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Left Player Glow (Lime Green Nebula Effect)
    let leftGlow = ctx.createRadialGradient(0, canvas.height / 2, 10, 0, canvas.height / 2, canvas.width * 0.5);
    leftGlow.addColorStop(0, 'rgba(204, 255, 0, 0.15)');
    leftGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Right Player Glow (Cyan Nebula Effect)
    let rightGlow = ctx.createRadialGradient(canvas.width, canvas.height / 2, 10, canvas.width, canvas.height / 2, canvas.width * 0.5);
    rightGlow.addColorStop(0, 'rgba(0, 243, 255, 0.15)');
    rightGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = rightGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Center Dashed Line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Center Field Ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 75, 0, Math.PI * 2);
    ctx.stroke();
}

function draw() {
    ctx.save();

    // Screen Shake Effect
    if (shakeTime > 0) {
        let dx = (Math.random() - 0.5) * 6;
        let dy = (Math.random() - 0.5) * 6;
        ctx.translate(dx, dy);
    }

    // Draw Deep Space Background
    drawDeepSpaceBackground();

    // Draw Ball Trail
    ball.trail.forEach((t, i) => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.radius * (i / ball.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(204, 255, 0, ${i / ball.trail.length * 0.35})`;
        ctx.fill();
    });

    // Draw Glowing Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Paddles
    [p1, p2].forEach(p => {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 18;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.shadowBlur = 0;
    });

    // Draw FX Particles
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    ctx.restore();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start Game Engine
gameLoop();
