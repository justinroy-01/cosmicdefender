const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const gameOverElement = document.getElementById("gameOver");
const finalScoreElement = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");
const powerElement = document.getElementById("power");

const keys = new Set();
const stars = [];
let player;
let bullets;
let enemyBeams;
let obstacles;
let aliens;
let boosters;
let score;
let lives;
let elapsed;
let lastTime;
let obstacleTimer;
let alienTimer;
let boosterTimer;
let animationId;
let isGameOver;

const alienTypes = {
  scout: { score: 100, speed: 75, color: "#a36aff", attack: "straight", health: 1 },
  striker: { score: 150, speed: 65, color: "#ff6aa8", attack: "diagonal", health: 1 },
  bomber: { score: 250, speed: 48, color: "#ffb45e", attack: "ring", health: 2 },
  tank: { score: 400, speed: 37, color: "#ff625e", attack: "burst", health: 3 },
  phantom: { score: 600, speed: 82, color: "#58e6ff", attack: "zigzag", health: 2 }
};

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(bounds.width * ratio);
  canvas.height = Math.floor(bounds.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function width() { return canvas.clientWidth; }
function height() { return canvas.clientHeight; }
function random(min, max) { return min + Math.random() * (max - min); }

function createStars() {
  stars.length = 0;
  for (let i = 0; i < 90; i += 1) {
    stars.push({ x: Math.random() * width(), y: Math.random() * height(), size: random(0.5, 1.8), speed: random(12, 45), alpha: random(0.25, 0.85) });
  }
}

function resetGame() {
  player = { x: width() / 2, y: height() - 58, width: 34, height: 38, speed: 430, spreadUntil: 0, invulnerableUntil: 0 };
  bullets = [];
  enemyBeams = [];
  obstacles = [];
  aliens = [];
  boosters = [];
  score = 0;
  lives = 3;
  elapsed = 0;
  obstacleTimer = 0;
  alienTimer = 1.8;
  boosterTimer = 8;
  lastTime = performance.now();
  isGameOver = false;
  gameOverElement.hidden = true;
  updateHud();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(gameLoop);
}

function updateHud() {
  scoreElement.textContent = Math.floor(score);
  livesElement.textContent = lives;
  if (powerElement) {
    const now = performance.now();
    const powers = [];
    if (player.spreadUntil > now) powers.push(`Spread ${((player.spreadUntil - now) / 1000).toFixed(1)}s`);
    if (player.invulnerableUntil > now) powers.push(`Shield ${((player.invulnerableUntil - now) / 1000).toFixed(1)}s`);
    powerElement.textContent = powers.join(" | ") || "None";
  }
}

function loseLife() {
  if (performance.now() < player.invulnerableUntil || isGameOver) return;
  lives -= 1;
  player.invulnerableUntil = performance.now() + 1000;
  updateHud();
  if (lives <= 0) {
    isGameOver = true;
    finalScoreElement.textContent = Math.floor(score);
    gameOverElement.hidden = false;
  }
}

function fire() {
  if (isGameOver || bullets.length >= 10) return;
  const angles = performance.now() < player.spreadUntil ? [-0.16, -0.08, 0, 0.08, 0.16] : [0];
  angles.forEach((angle) => {
    bullets.push({
      x: player.x,
      y: player.y - 21,
      previousX: player.x,
      previousY: player.y - 21,
      width: 4,
      height: 15,
      speed: 650,
      vx: Math.sin(angle) * 650
    });
  });
}

function spawnObstacle() {
  const size = random(18, 34);
  obstacles.push({ x: random(size, width() - size), y: -size, size, speed: random(75, 115) + elapsed * 1.8, rotation: Math.random() * Math.PI, spin: random(-2, 2) });
}

function spawnAlien() {
  const roll = Math.random();
  let type = elapsed < 15 ? "scout" : roll < 0.5 ? "scout" : roll < 0.78 ? "striker" : "bomber";
  if (score >= 5000) {
    type = roll < 0.22 ? "tank" : roll < 0.42 ? "phantom" : type;
  }
  const profile = alienTypes[type];
  aliens.push({
    type, profile, x: random(28, width() - 28), y: -25, width: type === "bomber" ? 50 : 42, height: type === "bomber" ? 29 : 25,
    hitWidth: type === "bomber" ? 54 : type === "tank" ? 58 : 48,
    hitHeight: type === "bomber" ? 40 : type === "tank" ? 34 : 34,
    speed: profile.speed + elapsed * 0.8, shotTimer: random(0.9, 2.2), health: profile.health, phase: Math.random() * Math.PI * 2
  });
}

function spawnBooster() {
  const roll = Math.random();
  const type = roll < 0.55 ? "spread" : roll < 0.8 ? "life" : roll < 0.96 ? "points" : "shield";
  boosters.push({ type, x: random(22, width() - 22), y: -18, size: 14, speed: 70 + elapsed * 0.5, pulse: 0 });
}

function fireAlienBeam(alien) {
  const { attack } = alien.profile;
  if (attack === "ring") {
    enemyBeams.push({ type: "ring", x: alien.x, y: alien.y + 16, radius: 5, maxRadius: 50, speed: 75, life: 0 });
  } else if (attack === "burst") {
    [-0.22, 0, 0.22].forEach((angle) => {
      enemyBeams.push({ type: "diagonal", x: alien.x, y: alien.y + 15, vx: Math.sin(angle) * 180, vy: 250, width: 7, height: 20 });
    });
  } else if (attack === "zigzag") {
    enemyBeams.push({ type: "zigzag", x: alien.x, y: alien.y + 15, vx: 140, vy: 220, width: 7, height: 18, phase: 0 });
  } else if (attack === "diagonal") {
    const direction = player.x >= alien.x ? 1 : -1;
    enemyBeams.push({ type: "diagonal", x: alien.x, y: alien.y + 15, vx: direction * 90, vy: 230, width: 6, height: 18 });
  } else {
    enemyBeams.push({ type: "straight", x: alien.x, y: alien.y + 15, vx: 0, vy: 260, width: 6, height: 18 });
  }
}

function overlaps(a, b) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
}

function projectileHitsAlien(bullet, alien) {
  const left = Math.min(bullet.x, bullet.previousX) - bullet.width / 2;
  const right = Math.max(bullet.x, bullet.previousX) + bullet.width / 2;
  const top = Math.min(bullet.y, bullet.previousY) - bullet.height / 2;
  const bottom = Math.max(bullet.y, bullet.previousY) + bullet.height / 2;
  return right >= alien.x - alien.hitWidth / 2 &&
    left <= alien.x + alien.hitWidth / 2 &&
    bottom >= alien.y - alien.hitHeight / 2 &&
    top <= alien.y + alien.hitHeight / 2;
}

function update(delta) {
  elapsed += delta;
  const direction = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  player.x += direction * player.speed * delta;
  player.x = Math.max(player.width / 2, Math.min(width() - player.width / 2, player.x));

  if (keys.has(" ") && (!player.lastShot || performance.now() - player.lastShot > 220)) {
    fire();
    player.lastShot = performance.now();
  }

  obstacleTimer -= delta;
  if (obstacleTimer <= 0) {
    spawnObstacle();
    obstacleTimer = Math.max(0.38, 1.1 - elapsed * 0.004);
  }
  alienTimer -= delta;
  if (alienTimer <= 0) {
    spawnAlien();
    alienTimer = Math.max(1.2, 2.8 - elapsed * 0.008);
  }
  boosterTimer -= delta;
  if (boosterTimer <= 0) {
    spawnBooster();
    boosterTimer = random(10, 16);
  }

  stars.forEach((star) => {
    star.y += star.speed * delta;
    if (star.y > height()) star.y = -star.size;
  });
  bullets.forEach((bullet) => {
    bullet.previousX = bullet.x;
    bullet.previousY = bullet.y;
    bullet.x += bullet.vx * delta;
    bullet.y -= bullet.speed * delta;
  });
  obstacles.forEach((obstacle) => { obstacle.y += obstacle.speed * delta; obstacle.rotation += obstacle.spin * delta; });
  boosters.forEach((booster) => { booster.y += booster.speed * delta; booster.pulse += delta * 5; });
  aliens.forEach((alien) => {
    alien.y += alien.speed * delta;
    alien.shotTimer -= delta;
    if (alien.shotTimer <= 0 && alien.y > 20 && alien.y < height() * 0.7) {
      fireAlienBeam(alien);
      alien.shotTimer = alien.profile.attack === "ring" ? 3.1 : alien.profile.attack === "burst" ? 3.4 : 2.1;
    }
  });
  enemyBeams.forEach((beam) => {
    if (beam.type === "ring") { beam.radius += beam.speed * delta; beam.life += delta; }
    else {
      beam.y += beam.vy * delta;
      beam.x += beam.vx * delta;
      if (beam.type === "zigzag") {
        beam.phase += delta * 8;
        beam.x += Math.sin(beam.phase) * 120 * delta;
      }
    }
  });

  bullets = bullets.filter((bullet) => bullet.y > -25 && bullet.x > -25 && bullet.x < width() + 25);
  obstacles = obstacles.filter((obstacle) => obstacle.y - obstacle.size < height() + 20);
  aliens = aliens.filter((alien) => alien.y - alien.height < height() + 20);
  boosters = boosters.filter((booster) => booster.y < height() + 25);
  enemyBeams = enemyBeams.filter((beam) => beam.type === "ring" ? beam.radius < beam.maxRadius : beam.y < height() + 30 && beam.x > -30 && beam.x < width() + 30);

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    for (let j = aliens.length - 1; j >= 0; j -= 1) {
      if (projectileHitsAlien(bullets[i], aliens[j])) {
        aliens[j].health -= 1;
        bullets.splice(i, 1);
        if (aliens[j].health <= 0) {
          score += aliens[j].profile.score;
          aliens.splice(j, 1);
        }
        break;
      }
    }
  }

  const playerHitbox = { x: player.x, y: player.y, width: 26, height: 27 };
  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = { x: obstacles[i].x, y: obstacles[i].y, width: obstacles[i].size * 1.5, height: obstacles[i].size * 1.5 };
    if (overlaps(playerHitbox, obstacle)) { obstacles.splice(i, 1); loseLife(); }
  }
  for (let i = aliens.length - 1; i >= 0; i -= 1) {
    if (overlaps(playerHitbox, aliens[i])) { aliens.splice(i, 1); loseLife(); }
  }
  for (let i = enemyBeams.length - 1; i >= 0; i -= 1) {
    const beam = enemyBeams[i];
    const hit = beam.type === "ring"
      ? Math.hypot(beam.x - player.x, beam.y - player.y) < beam.radius + 14 && Math.hypot(beam.x - player.x, beam.y - player.y) > beam.radius - 14
      : overlaps(playerHitbox, beam);
    if (hit) { enemyBeams.splice(i, 1); loseLife(); }
  }
  for (let i = boosters.length - 1; i >= 0; i -= 1) {
    const booster = boosters[i];
    if (overlaps(playerHitbox, { ...booster, width: booster.size * 2, height: booster.size * 2 })) {
      if (booster.type === "life") lives = Math.min(5, lives + 1);
      else if (booster.type === "points") score += 500;
      else if (booster.type === "shield") player.invulnerableUntil = performance.now() + 10000;
      else player.spreadUntil = performance.now() + 8000;
      boosters.splice(i, 1);
      updateHud();
    }
  }
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, height());
  gradient.addColorStop(0, "#080d2d");
  gradient.addColorStop(1, "#111333");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width(), height());
  stars.forEach((star) => { context.globalAlpha = star.alpha; context.fillStyle = "#bfefff"; context.fillRect(star.x, star.y, star.size, star.size); });
  context.globalAlpha = 1;
}

function drawPlayer() {
  context.save();
  context.translate(player.x, player.y);
  context.shadowBlur = 16;
  context.shadowColor = "#4deaff";
  context.fillStyle = "#4deaff";
  context.beginPath();
  context.moveTo(0, -22); context.lineTo(18, 17); context.lineTo(7, 13); context.lineTo(0, 20); context.lineTo(-7, 13); context.lineTo(-18, 17); context.closePath(); context.fill();
  context.shadowBlur = 0;
  context.fillStyle = "#15285e";
  context.beginPath(); context.moveTo(0, -13); context.lineTo(7, 5); context.lineTo(-7, 5); context.closePath(); context.fill();
  context.restore();
}

function drawEntities() {
  bullets.forEach((bullet) => { context.fillStyle = "#f6ff9a"; context.shadowBlur = 12; context.shadowColor = "#fff86a"; context.fillRect(bullet.x - 2, bullet.y - bullet.height / 2, bullet.width, bullet.height); context.shadowBlur = 0; });
  obstacles.forEach((obstacle) => {
    context.save(); context.translate(obstacle.x, obstacle.y); context.rotate(obstacle.rotation); context.fillStyle = "#bd6884"; context.strokeStyle = "#f09ab4"; context.lineWidth = 2; context.beginPath();
    for (let i = 0; i < 8; i += 1) { const radius = obstacle.size * (i % 2 ? 0.78 : 1); const angle = (i / 8) * Math.PI * 2; context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); }
    context.closePath(); context.fill(); context.stroke(); context.restore();
  });
  boosters.forEach((booster) => {
    const colors = { life: "#ff718f", spread: "#70ffca", points: "#ffd45e", shield: "#66b8ff" };
    const symbols = { life: "+", spread: "✦", points: "500", shield: "S" };
    context.save(); context.translate(booster.x, booster.y); context.rotate(booster.pulse * 0.2); context.shadowBlur = 16; context.shadowColor = colors[booster.type]; context.fillStyle = colors[booster.type]; context.fillRect(-12, -12, 24, 24); context.fillStyle = "#08132c"; context.font = `bold ${booster.type === "points" ? 9 : 16}px sans-serif`; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(symbols[booster.type], 0, 1); context.restore();
  });
  aliens.forEach((alien) => {
    context.save(); context.translate(alien.x, alien.y); context.fillStyle = alien.profile.color; context.strokeStyle = "#f1ddff"; context.lineWidth = 2; context.beginPath();
    if (alien.type === "bomber") { context.arc(0, 0, 22, Math.PI, 0); context.lineTo(22, 8); context.lineTo(-22, 8); }
    else if (alien.type === "tank") { context.rect(-24, -12, 48, 24); context.moveTo(-24, 7); context.lineTo(-32, 14); context.moveTo(24, 7); context.lineTo(32, 14); }
    else if (alien.type === "phantom") { context.moveTo(0, -16); context.lineTo(19, 10); context.lineTo(0, 5); context.lineTo(-19, 10); }
    else { context.moveTo(-21, 5); context.lineTo(-12, -7); context.lineTo(12, -7); context.lineTo(21, 5); context.lineTo(10, 3); context.lineTo(0, 10); context.lineTo(-10, 3); }
    context.closePath(); context.fill(); context.stroke(); context.fillStyle = "#f8ff98"; context.fillRect(-10, -2, 5, 5); context.fillRect(5, -2, 5, 5); context.restore();
  });
  enemyBeams.forEach((beam) => {
    context.save(); context.strokeStyle = beam.type === "ring" ? "#ffb45e" : "#ff557d"; context.shadowBlur = 14; context.shadowColor = context.strokeStyle; context.lineWidth = beam.type === "ring" ? 5 : 4;
    if (beam.type === "ring") { context.beginPath(); context.arc(beam.x, beam.y, beam.radius, 0, Math.PI * 2); context.stroke(); }
    else { context.translate(beam.x, beam.y); context.rotate(Math.atan2(beam.vx, beam.vy)); context.strokeRect(-beam.width / 2, -beam.height / 2, beam.width, beam.height); }
    context.restore();
  });
}

function draw() { drawBackground(); drawEntities(); drawPlayer(); }

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  if (!isGameOver) { update(delta); draw(); updateHud(); animationId = requestAnimationFrame(gameLoop); }
  else draw();
}

window.addEventListener("resize", () => { resizeCanvas(); createStars(); if (!isGameOver) player.x = Math.min(player.x, width() - player.width / 2); });
window.addEventListener("keydown", (event) => { if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault(); keys.add(event.key); if (event.key.toLowerCase() === "r" && isGameOver) resetGame(); });
window.addEventListener("keyup", (event) => keys.delete(event.key));
restartButton.addEventListener("click", resetGame);
resizeCanvas();
createStars();
resetGame();
