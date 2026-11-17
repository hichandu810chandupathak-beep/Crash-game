(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    $("overlayTitle").textContent = "GAME COULD NOT START";
    $("overlayText").textContent = "Your browser does not support the canvas game.";
    $("startBtn").disabled = true;
    return;
  }

  const W = 900, H = 420, GROUND = 350;
  const STORAGE_KEY = "memeRunBestV1";
  const quips = [
    "Aaj nahi toh kal… par obstacle aaj hi kyun?",
    "Main runner hoon, traffic police nahi!",
    "Leg day ka asli practical chal raha hai.",
    "Chai thandi ho rahi hai. SPEED BADHAO!",
    "Obstacle ko bolo appointment leke aaye."
  ];
  const jumpLines = ["YEH HUI NA SKY-HIGH ENTRY! 🚀", "HOPPAAA! FULL FILMY MODE!", "UP UP AUR AWAY!"];
  const crashLines = ["Na bhai main toh haar gaya 😭", "Oof! Road ne dhoka de diya.", "Ek aur run? Is baar pakka bachenge!"];

  let best = readBest();
  let score = 0;
  let speed = 360;
  let elapsed = 0;
  let spawnTimer = 1;
  let running = false;
  let gameOver = false;
  let lastTime = 0;
  let rafId = 0;
  let frame = 0;
  let soundOn = true;
  let audioContext = null;
  let popupTimer = 0;
  let shakeTime = 0;
  let obstacles = [];
  let particles = [];
  let clouds = [
    {x:100,y:82,s:1.1},{x:440,y:130,s:.72},{x:760,y:72,s:.9}
  ];

  const player = {
    x:112, bottom:GROUND, vy:0, w:42, h:74,
    ducking:false, duckUntil:0, onGround:true
  };

  function readBest() {
    try { return Math.max(0, Number(localStorage.getItem(STORAGE_KEY)) || 0); }
    catch (_) { return 0; }
  }
  function saveBest() {
    try { localStorage.setItem(STORAGE_KEY, String(best)); } catch (_) {}
  }
  function formatScore(value) { return String(Math.floor(value)).padStart(5, "0"); }
  function updateHud() {
    $("score").textContent = formatScore(score);
    $("best").textContent = formatScore(best);
    $("level").textContent = String(1 + Math.floor(score / 250)).padStart(2, "0");
  }
  function random(min, max) { return min + Math.random() * (max - min); }
  function showPopup(message) {
    const popup = $("popup");
    popup.textContent = message;
    popup.classList.remove("show");
    void popup.offsetWidth;
    popup.classList.add("show");
    window.clearTimeout(popupTimer);
    popupTimer = window.setTimeout(() => popup.classList.remove("show"), 1000);
  }
  function setQuip() {
    $("quip").textContent = "“" + quips[Math.floor(Math.random() * quips.length)] + "”";
  }
  function beep(frequency = 520, duration = .09, type = "sine") {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext = audioContext || new AudioCtx();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(.055, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) {}
  }
  function burst(x, y, amount = 12) {
    const emojis = ["✨","💨","⭐","😂"];
    for (let i = 0; i < amount; i++) {
      particles.push({
        x, y, vx:random(-150,150), vy:random(-210,-45),
        life:random(.35,.8), maxLife:.8,
        emoji:emojis[Math.floor(Math.random()*emojis.length)]
      });
    }
  }

  function resetGame() {
    score = 0;
    speed = 360;
    elapsed = 0;
    spawnTimer = .9;
    obstacles = [];
    particles = [];
    frame = 0;
    shakeTime = 0;
    player.bottom = GROUND;
    player.vy = 0;
    player.ducking = false;
    player.duckUntil = 0;
    player.onGround = true;
    updateHud();
  }

  function startGame() {
    if (running) return;
    if (rafId) cancelAnimationFrame(rafId);
    resetGame();
    running = true;
    gameOver = false;
    lastTime = performance.now();
    $("overlay").classList.add("hidden");
    $("status").textContent = "RUNNING — DON'T BLINK!";
    setQuip();
    beep(660,.1);
    rafId = requestAnimationFrame(loop);
  }

  function endGame() {
    if (!running) return;
    running = false;
    gameOver = true;
    shakeTime = .32;
    burst(player.x + 20, player.bottom - 30, 22);
    beep(150,.22,"sawtooth");
    if (score > best) {
      best = score;
      saveBest();
    }
    updateHud();
    $("status").textContent = "RUN ENDED — LEGENDARY EFFORT";
    $("overlayEmoji").textContent = "😭";
    $("overlayTitle").textContent = crashLines[Math.floor(Math.random() * crashLines.length)];
    $("overlayText").textContent = "Final score: " + score + ". Best score: " + best + ". One more try?";
    $("startBtn").innerHTML = "RUN IT BACK <span>↻</span>";
    $("overlay").classList.remove("hidden");
    $("canvasWrap").classList.remove("shake");
    void $("canvasWrap").offsetWidth;
    $("canvasWrap").classList.add("shake");
    showPopup("Na bhai main toh haar gaya 😭");
    setQuip();
  }

  function jump() {
    if (!running) {
      if (!gameOver) startGame();
      return;
    }
    if (!player.onGround) return;
    player.ducking = false;
    player.vy = -760;
    player.onGround = false;
    burst(player.x + 20, player.bottom - 5, 5);
    showPopup(jumpLines[Math.floor(Math.random() * jumpLines.length)]);
    beep(760,.08);
  }

  function setDuck(active) {
    if (!running) return;
    if (active) {
      player.ducking = true;
      player.duckUntil = elapsed + .48;
    } else {
      player.ducking = false;
    }
  }

  function spawnObstacle() {
    const carChance = Math.min(.43, .2 + score / 1800);
    const isCar = Math.random() < carChance;
    if (isCar) {
      const width = random(100,132);
      obstacles.push({type:"car",x:W+25,w:width,h:62,passed:false,color:["#ff6b7f","#ffbd4a","#65a9ff"][Math.floor(Math.random()*3)]});
    } else {
      const width = random(34,44);
      obstacles.push({type:"cone",x:W+25,w:width,h:56,passed:false});
    }
  }

  function update(dt) {
    elapsed += dt;
    frame += dt * 60;
    speed = Math.min(720, 360 + score * 1.12);
    score += dt * (speed / 14);
    if (score > best) best = score;

    if (!player.onGround) {
      player.vy += 2050 * dt;
      player.bottom += player.vy * dt;
      if (player.bottom >= GROUND) {
        player.bottom = GROUND;
        player.vy = 0;
        player.onGround = true;
      }
    }
    if (player.ducking && elapsed >= player.duckUntil) player.ducking = false;

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      const difficulty = Math.min(.5, score / 2400);
      spawnTimer = random(1.05,1.55) - difficulty;
    }

    for (const obstacle of obstacles) {
      obstacle.x -= speed * dt;
      if (!obstacle.passed && obstacle.x + obstacle.w < player.x) {
        obstacle.passed = true;
        score += 8;
        beep(880,.045);
      }
      if (collides(obstacle)) {
        endGame();
        return;
      }
    }
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.w > -40);

    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 500 * dt;
      particle.life -= dt;
    }
    particles = particles.filter(particle => particle.life > 0);
    for (const cloud of clouds) {
      cloud.x -= speed * .055 * dt;
      if (cloud.x < -100) cloud.x = W + random(20,180);
    }
    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
    updateHud();
  }

  function collides(obstacle) {
    const px = player.x + 7;
    const pw = player.w - 14;
    const ph = player.ducking ? 34 : 67;
    const py = player.bottom - ph;
    const ox = obstacle.x + (obstacle.type === "car" ? 8 : 5);
    const ow = obstacle.w - (obstacle.type === "car" ? 16 : 10);
    const oy = GROUND - obstacle.h + 5;
    const oh = obstacle.h - 5;
    return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
  }

  function roundedRect(x,y,w,h,r,color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
    ctx.fill();
  }
  function drawCloud(x,y,s) {
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.beginPath();
    ctx.arc(x,y,20*s,0,Math.PI*2);
    ctx.arc(x+25*s,y-10*s,26*s,0,Math.PI*2);
    ctx.arc(x+53*s,y,19*s,0,Math.PI*2);
    ctx.fill();
  }
  function drawBackground() {
    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,"#a8e9ee");
    sky.addColorStop(1,"#f9e8c4");
    ctx.fillStyle = sky;
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#ffe18a";
    ctx.beginPath();
    ctx.arc(755,78,39,0,Math.PI*2);
    ctx.fill();
    clouds.forEach(cloud => drawCloud(cloud.x,cloud.y,cloud.s));

    ctx.fillStyle = "#83c9a5";
    ctx.beginPath();
    ctx.moveTo(0,280);
    for (let x=0; x<=W; x+=45) ctx.lineTo(x,245+Math.sin(x*.014+frame*.008)*20);
    ctx.lineTo(W,GROUND);
    ctx.lineTo(0,GROUND);
    ctx.fill();

    ctx.fillStyle = "#5c596d";
    ctx.fillRect(0,GROUND,W,H-GROUND);
    ctx.fillStyle = "#454257";
    ctx.fillRect(0,GROUND,W,9);
    ctx.fillStyle = "#f9d66d";
    const offset = (frame * speed / 60) % 100;
    for (let x=-offset; x<W; x+=100) roundedRect(x,GROUND+40,54,7,3,"#f9d66d");
    ctx.fillStyle = "rgba(25,32,49,.35)";
    ctx.font = "800 13px Nunito, sans-serif";
    ctx.fillText("LOL-PUR EXPRESSWAY",18,27);
  }

  function drawPlayer() {
    const x = player.x + 20;
    const bottom = player.bottom;
    const duck = player.ducking;
    const headY = duck ? bottom-32 : bottom-62;
    const swing = player.onGround ? Math.sin(frame*.34)*15 : 7;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#25243a";
    ctx.fillStyle = "#25243a";
    ctx.beginPath();
    ctx.arc(x,headY-10,11,0,Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    if (duck) {
      ctx.moveTo(x,headY+2); ctx.lineTo(x+18,headY+12);
      ctx.moveTo(x,headY+2); ctx.lineTo(x-16,headY+12);
      ctx.moveTo(x,headY+12); ctx.lineTo(x+13,bottom-2);
      ctx.moveTo(x,headY+12); ctx.lineTo(x-11,bottom-2);
    } else {
      ctx.moveTo(x,headY+2); ctx.lineTo(x,bottom-22);
      ctx.moveTo(x,headY+13); ctx.lineTo(x-15,headY+25+swing*.25);
      ctx.moveTo(x,headY+13); ctx.lineTo(x+15,headY+25-swing*.25);
      ctx.moveTo(x,bottom-22); ctx.lineTo(x-11+swing,bottom);
      ctx.moveTo(x,bottom-22); ctx.lineTo(x+11-swing,bottom);
    }
    ctx.stroke();
    ctx.fillStyle = "#ff5fa2";
    ctx.fillRect(x-5,headY+2,10,5);
    ctx.restore();
  }

  function drawObstacle(obstacle) {
    const y = GROUND - obstacle.h;
    ctx.save();
    if (obstacle.type === "cone") {
      ctx.fillStyle = "#ff7948";
      ctx.beginPath();
      ctx.moveTo(obstacle.x+obstacle.w/2,y);
      ctx.lineTo(obstacle.x+obstacle.w,y+obstacle.h);
      ctx.lineTo(obstacle.x,y+obstacle.h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff3d6";
      ctx.fillRect(obstacle.x+8,y+obstacle.h*.66,obstacle.w-16,6);
      roundedRect(obstacle.x-3,GROUND-7,obstacle.w+6,8,3,"#d95036");
    } else {
      roundedRect(obstacle.x,y+17,obstacle.w,obstacle.h-17,13,obstacle.color);
      roundedRect(obstacle.x+10,y,obstacle.w-20,30,9,"#eaf8ff");
      ctx.fillStyle = "#27334b";
      ctx.fillRect(obstacle.x+17,y+7,obstacle.w-34,17);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(obstacle.x+23,GROUND-4,10,0,Math.PI*2);
      ctx.arc(obstacle.x+obstacle.w-23,GROUND-4,10,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#34334a";
      ctx.beginPath();
      ctx.arc(obstacle.x+23,GROUND-4,5,0,Math.PI*2);
      ctx.arc(obstacle.x+obstacle.w-23,GROUND-4,5,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0,particle.life / particle.maxLife);
      ctx.font = "23px sans-serif";
      ctx.fillText(particle.emoji,particle.x,particle.y);
    }
    ctx.globalAlpha = 1;
  }
  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.save();
    if (shakeTime > 0) {
      const amount = shakeTime * 15;
      ctx.translate(random(-amount,amount),random(-amount,amount));
    }
    drawBackground();
    drawPlayer();
    obstacles.forEach(drawObstacle);
    drawParticles();
    ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(.033,Math.max(0,(now-lastTime)/1000));
    lastTime = now;
    update(dt);
    draw();
    if (running) rafId = requestAnimationFrame(loop);
  }

  $("startBtn").addEventListener("click",startGame);
  $("restartBtn").addEventListener("click",startGame);
  $("jumpBtn").addEventListener("pointerdown",event => {event.preventDefault();jump();});
  $("duckBtn").addEventListener("pointerdown",event => {event.preventDefault();setDuck(true);});
  $("duckBtn").addEventListener("pointerup",() => setDuck(false));
  $("duckBtn").addEventListener("pointercancel",() => setDuck(false));
  $("duckBtn").addEventListener("pointerleave",() => setDuck(false));
  canvas.addEventListener("pointerdown",event => {
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      event.preventDefault();
      jump();
    }
  });

  window.addEventListener("keydown",event => {
    if (["Space","ArrowUp","KeyW"].includes(event.code)) {
      event.preventDefault();
      if (!event.repeat) jump();
    } else if (["ArrowDown","KeyS"].includes(event.code)) {
      event.preventDefault();
      setDuck(true);
    }
  });
  window.addEventListener("keyup",event => {
    if (["ArrowDown","KeyS"].includes(event.code)) setDuck(false);
  });
  window.addEventListener("blur",() => setDuck(false));
  document.addEventListener("visibilitychange",() => {
    if (document.hidden && running) {
      running = false;
      $("status").textContent = "PAUSED — TAP START TO RESUME";
      $("overlayEmoji").textContent = "⏸️";
      $("overlayTitle").textContent = "QUICK BREAK!";
      $("overlayText").textContent = "Your run is paused while this tab is away. Start a fresh run when ready.";
      $("startBtn").innerHTML = "START RUN <span>→</span>";
      $("overlay").classList.remove("hidden");
    }
  });
  $("soundBtn").addEventListener("click",() => {
    soundOn = !soundOn;
    $("soundBtn").textContent = soundOn ? "🔊 SOUND ON" : "🔇 SOUND OFF";
    $("soundBtn").setAttribute("aria-pressed",String(soundOn));
    if (soundOn) beep(520,.07);
  });

  updateHud();
  draw();
})();