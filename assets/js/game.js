// ===== BROWSER COMPATIBILITY CHECK =====
(function() {
  const missing = [];
  try {
    const testCanvas = document.createElement('canvas');
    if (!testCanvas.getContext || !testCanvas.getContext('2d')) missing.push('Canvas');
  } catch(e) { missing.push('Canvas'); }
  if (!(window.AudioContext || window.webkitAudioContext)) missing.push('Web Audio');
  if (!window.requestAnimationFrame) missing.push('Animation');
  if (!window.fetch) missing.push('Fetch');
  if (missing.length > 0) {
    const banner = document.getElementById('compatBanner');
    if (banner) banner.style.display = 'block';
    console.warn('[Galactic Math] Unsupported browser features:', missing.join(', '));
  }
})();

// ===== STARS =====
let currentStarColor = '220, 240, 255';

(function() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 7000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        op: Math.random(),
        speed: Math.random() * 0.00015 + 0.00002,  // glacially slow twinkle
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function draw(t) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Slow-rotating nebula gradient — two glowing blobs drifting around
    const angle = t * 0.00006; // very slow rotation ~100s per full cycle
    const cx1 = W * (0.5 + 0.45 * Math.cos(angle));
    const cy1 = H * (0.5 + 0.45 * Math.sin(angle));
    const cx2 = W * (0.5 + 0.45 * Math.cos(angle + Math.PI));
    const cy2 = H * (0.5 + 0.45 * Math.sin(angle + Math.PI));
    const cx3 = W * (0.5 + 0.35 * Math.cos(angle + Math.PI * 0.67));
    const cy3 = H * (0.5 + 0.35 * Math.sin(angle + Math.PI * 0.67));

    const g1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, W * 0.55);
    g1.addColorStop(0, 'rgba(26, 39, 68, 0.55)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, W * 0.45);
    g2.addColorStop(0, 'rgba(60, 20, 80, 0.4)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    const g3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, W * 0.35);
    g3.addColorStop(0, 'rgba(0, 40, 80, 0.3)');
    g3.addColorStop(1, 'transparent');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    // Stars — subtle twinkle only (opacity 0.25 to 0.6)
    stars.forEach(s => {
      const op = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * s.speed * 1000 + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${currentStarColor}, ${op})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();

// ===== AUDIO ENGINE (Web Audio API) =====
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type, duration, vol = 0.18, attack = 0.005, decay = 0.1) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  } catch(e) { console.warn('Audio error (playTone):', e); }
}

function playFreqSweep(startFreq, endFreq, type, duration, vol = 0.15) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  } catch(e) { console.warn('Audio error (playFreqSweep):', e); }
}

let _noiseBuffer = null;
function playNoise(duration, vol = 0.06, highpass = 800) {
  try {
    const ctx = getAudio();
    // Cache a 2s white-noise buffer; all calls reuse it (content is perceptually identical)
    if (!_noiseBuffer || _noiseBuffer.sampleRate !== ctx.sampleRate) {
      const bufSize = ctx.sampleRate * 2;
      _noiseBuffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = _noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    }
    const buf = _noiseBuffer;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration + 0.05);
  } catch(e) { console.warn('Audio error (playNoise):', e); }
}

// Sound library
const sounds = {
  keypress(key) {
    const keyFreqs = { '0':523, '1':587, '2':659, '3':698, '4':784, '5':880, '6':988, '7':1047, '8':1175, '9':1319 };
    const freq = keyFreqs[key] ?? 880;
    playTone(freq, 'sine', 0.08, 0.06);
  },
  correct() {
    // Ascending lightsaber hum + chime
    playFreqSweep(300, 900, 'sine', 0.25, 0.12);
    setTimeout(() => playTone(1200, 'sine', 0.2, 0.1), 80);
    setTimeout(() => playTone(1600, 'sine', 0.15, 0.08), 180);
  },
  wrong() {
    // Descending imperial-style buzz
    playFreqSweep(400, 80, 'sawtooth', 0.35, 0.1);
    setTimeout(() => playFreqSweep(300, 60, 'square', 0.25, 0.2), 100);
  },
  navigate() {
    playTone(660, 'sine', 0.1, 0.07);
  },
  submit() {
    // Beep-boop R2D2 style
    playTone(1320, 'sine', 0.07, 0.1);
    setTimeout(() => playTone(1760, 'sine', 0.07, 0.08), 80);
  },
  missionStart() {
    // Rocket launch: ignition rumble → building thrust → liftoff shriek
    playNoise(1.8, 0.08, 40);
    playFreqSweep(55, 180, 'sawtooth', 1.2, 0.15);
    setTimeout(() => playFreqSweep(120, 600, 'sawtooth', 0.7, 0.12), 600);
    setTimeout(() => playNoise(0.25, 0.1, 80), 1000);
    setTimeout(() => playFreqSweep(400, 2400, 'sine', 0.5, 0.07), 1100);
  },
  victory() {
    // Triumphant fanfare (Star Wars-ish 4-note motif)
    const notes = [392, 523, 659, 784];
    notes.forEach((f, i) => {
      setTimeout(() => {
        playTone(f, 'sine', 0.4, 0.15);
        playTone(f * 0.5, 'triangle', 0.3, 0.08);
      }, i * 130);
    });
    setTimeout(() => {
      playTone(1047, 'sine', 0.6, 0.18);
      playTone(784, 'sine', 0.4, 0.12);
    }, 560);
  },
  modeActivate() {
    // Powering-up synthesizer hum — short rising tone with shimmer
    playFreqSweep(200, 600, 'sine', 0.18, 0.08);
    setTimeout(() => playTone(900, 'sine', 0.15, 0.1), 80);
    setTimeout(() => playTone(1200, 'sine', 0.08, 0.12), 200);
  },
  blasterFlyby() {
    // Tie-fighter-like whoosh for comet celebration
    playNoise(0.15, 0.12, 200);
    playFreqSweep(1200, 180, 'sawtooth', 0.4, 0.08);
    setTimeout(() => playFreqSweep(800, 120, 'square', 0.3, 0.06), 80);
  },
  shockwaveImpact() {
    // Deep bass thud as rings expand outward
    playTone(80, 'sine', 0.5, 0.3);
    playTone(55, 'sine', 0.4, 0.4);
    playNoise(0.15, 0.1, 50);
    setTimeout(() => playTone(110, 'sine', 0.2, 0.2), 200);
  },
  burstPop() {
    // Sharp crack + sparkle for particle explosion
    playNoise(0.06, 0.28, 350);
    playFreqSweep(900, 180, 'sine', 0.3, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.1, 0.08), 60);
    setTimeout(() => playTone(1600, 'sine', 0.07, 0.06), 130);
  },
  hyperspaceJump() {
    // Rising roar as ship jumps to hyperspace
    playFreqSweep(80, 3000, 'sawtooth', 2.0, 0.12);
    setTimeout(() => playFreqSweep(120, 4500, 'sine', 1.8, 0.08), 200);
    setTimeout(() => playNoise(1.5, 0.1, 50), 400);
    setTimeout(() => playFreqSweep(300, 8000, 'sine', 1.0, 0.1), 900);
  },
  hyperspaceTimeout() {
    // Failure — hyperdrive not ready
    playFreqSweep(600, 80, 'sawtooth', 0.5, 0.15);
    setTimeout(() => playFreqSweep(400, 60, 'square', 0.4, 0.1), 350);
    setTimeout(() => playTone(120, 'square', 0.4, 0.12), 700);
  },
  hyperspaceCountdownTick(secondsLeft) {
    // Tense tick — pitch rises as time runs out
    const freq = 440 + (10 - secondsLeft) * 40;
    playTone(freq, 'square', 0.07, 0.09);
  },
  hyperspaceActivate() {
    // Hyperdrive charging up — low rumble builds to a high-energy peak
    playFreqSweep(60, 300, 'sawtooth', 0.4, 0.1);
    setTimeout(() => playFreqSweep(200, 700, 'sine', 0.45, 0.08), 200);
    setTimeout(() => playFreqSweep(400, 1100, 'sine', 0.35, 0.07), 450);
    setTimeout(() => playNoise(0.15, 0.08, 400), 700);
    setTimeout(() => playTone(1400, 'sine', 0.2, 0.1), 720);
  },
  kesselRunActivate() {
    // Countdown beeps + engine burst — race start signal
    playTone(660, 'square', 0.07, 0.1);
    setTimeout(() => playTone(660, 'square', 0.07, 0.1), 200);
    setTimeout(() => playTone(660, 'square', 0.07, 0.1), 400);
    setTimeout(() => playFreqSweep(880, 1760, 'sawtooth', 0.25, 0.12), 650);
  },
  abortMission() {
    // Deflating power-down — engines losing thrust then silence
    playFreqSweep(480, 60, 'sawtooth', 0.7, 0.14);
    setTimeout(() => playFreqSweep(300, 40, 'sine', 0.5, 0.1), 300);
    setTimeout(() => playNoise(0.3, 0.04, 80), 500);
    setTimeout(() => playFreqSweep(80, 20, 'sine', 0.4, 0.06), 700);
  },
  dock() {
    // Resume context in case browser suspended it between user gesture and this setTimeout
    const ctx = getAudio();
    const play = () => {
      playTone(1047, 'sine', 0.15, 0.35);
      setTimeout(() => playTone(784, 'sine', 0.15, 0.35), 150);
      setTimeout(() => playTone(523, 'sine', 0.25, 0.4), 300);
    };
    if (ctx.state === 'suspended') ctx.resume().then(play);
    else play();
  }
};

// ===== SPACESHIP FLYBY =====
const shipCanvas = document.getElementById('shipCanvas');
const shipCtx = shipCanvas.getContext('2d');
let shipAnimFrame = null;

function resizeShipCanvas() {
  shipCanvas.width = window.innerWidth;
  shipCanvas.height = window.innerHeight;
}
resizeShipCanvas();
window.addEventListener('resize', resizeShipCanvas);

// ===== RING SHOCKWAVE CELEBRATION =====
let celebrationActive = false;

function launchCelebration() {
  if (celebrationActive) return;
  celebrationActive = true;

  // Design system palette
  const palette = [
    [0, 212, 255],    // saber-blue
    [57, 255, 20],    // saber-green
    [185, 79, 255],   // saber-purple
    [255, 215, 0],    // gold
    [232, 244, 255],  // star-white
    [0, 212, 255],    // saber-blue (close the loop)
  ];

  let rings = [];
  let ringCount = 0;

  function spawnRing() {
    const cx = shipCanvas.width / 2;
    const cy = shipCanvas.height / 2;
    const maxR = Math.hypot(cx, cy) * 1.15;
    const col = palette[ringCount % palette.length];
    ringCount++;
    rings.push({ cx, cy, radius: 0, maxRadius: maxR, life: 1, r: col[0], g: col[1], b: col[2] });
  }

  // 9 rings staggered over ~2.5s
  for (let i = 0; i < 9; i++) {
    setTimeout(spawnRing, i * 280);
  }

  sounds.shockwaveImpact();

  setTimeout(() => {
    const banner = document.getElementById('congratsBanner');
    banner.classList.add('show');
    sounds.victory();
    setTimeout(() => {
      banner.classList.remove('show');
      banner.style.animation = 'none';
    }, 3500);
  }, 300);

  const loopUntil = Date.now() + 5000;

  function frame() {
    const W = shipCanvas.width;
    const H = shipCanvas.height;
    shipCtx.clearRect(0, 0, W, H);

    rings = rings.filter(r => r.life > 0.01);

    rings.forEach(r => {
      r.radius += 5 + (1 - r.life) * 4;
      r.life = Math.max(0, 1 - r.radius / r.maxRadius);

      const alpha = r.life * 0.85;
      const lw = 4 + r.life * 8;

      // Soft outer glow
      shipCtx.beginPath();
      shipCtx.arc(r.cx, r.cy, r.radius, 0, Math.PI * 2);
      shipCtx.strokeStyle = `rgba(${r.r},${r.g},${r.b},${alpha * 0.3})`;
      shipCtx.lineWidth = lw * 3;
      shipCtx.stroke();

      // Core ring
      shipCtx.beginPath();
      shipCtx.arc(r.cx, r.cy, r.radius, 0, Math.PI * 2);
      shipCtx.strokeStyle = `rgba(${r.r},${r.g},${r.b},${alpha})`;
      shipCtx.lineWidth = lw;
      shipCtx.stroke();

      // Bright white inner edge
      shipCtx.beginPath();
      shipCtx.arc(r.cx, r.cy, r.radius * 0.97, 0, Math.PI * 2);
      shipCtx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
      shipCtx.lineWidth = 1.5;
      shipCtx.stroke();
    });

    if (Date.now() < loopUntil || rings.length > 0) {
      requestAnimationFrame(frame);
    } else {
      shipCtx.clearRect(0, 0, W, H);
      celebrationActive = false;
    }
  }

  requestAnimationFrame(frame);
}

// ===== KESSEL RUN COMET CELEBRATION =====
function launchKesselCelebration() {
  if (celebrationActive) return;
  celebrationActive = true;

  const colors = [
    [255, 215, 0],
    [0, 212, 255],
    [57, 255, 20],
    [232, 244, 255],
    [185, 79, 255]
  ];

  let comets = [];

  function spawnComet() {
    const W = shipCanvas.width;
    const H = shipCanvas.height;
    const fromLeft = Math.random() > 0.4;
    const col = colors[Math.floor(Math.random() * colors.length)];
    const angle = fromLeft
      ? (Math.random() * 0.5 - 0.1)
      : (Math.PI * 0.4 + Math.random() * 0.5);
    const spd = 6 + Math.random() * 8;
    comets.push({
      x: fromLeft ? -60 : W * (0.1 + Math.random() * 0.8),
      y: fromLeft ? H * (0.1 + Math.random() * 0.8) : -60,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 1,
      decay: 0.005 + Math.random() * 0.005,
      tailLen: 80 + Math.random() * 120,
      width: 2 + Math.random() * 2.5,
      r: col[0], g: col[1], b: col[2]
    });
  }

  // 22 comets staggered over ~4s
  for (let i = 0; i < 22; i++) {
    setTimeout(spawnComet, i * 185);
  }

  sounds.blasterFlyby();

  setTimeout(() => {
    const banner = document.getElementById('congratsBanner');
    banner.classList.add('show');
    sounds.victory();
    setTimeout(() => {
      banner.classList.remove('show');
      banner.style.animation = 'none';
    }, 3500);
  }, 300);

  const loopUntil = Date.now() + 9000;

  function frame() {
    const W2 = shipCanvas.width;
    const H2 = shipCanvas.height;
    shipCtx.clearRect(0, 0, W2, H2);

    comets = comets.filter(c => c.life > 0.02);

    comets.forEach(c => {
      const tailX = c.x - c.vx / Math.hypot(c.vx, c.vy) * c.tailLen * c.life;
      const tailY = c.y - c.vy / Math.hypot(c.vx, c.vy) * c.tailLen * c.life;

      const grad = shipCtx.createLinearGradient(tailX, tailY, c.x, c.y);
      grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0)`);
      grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},${c.life * 0.9})`);

      shipCtx.beginPath();
      shipCtx.moveTo(tailX, tailY);
      shipCtx.lineTo(c.x, c.y);
      shipCtx.strokeStyle = grad;
      shipCtx.lineWidth = c.width * c.life;
      shipCtx.lineCap = 'round';
      shipCtx.stroke();

      const glowGrad = shipCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.width * 5 * c.life);
      glowGrad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${c.life})`);
      glowGrad.addColorStop(1, 'transparent');
      shipCtx.beginPath();
      shipCtx.arc(c.x, c.y, c.width * 5 * c.life, 0, Math.PI * 2);
      shipCtx.fillStyle = glowGrad;
      shipCtx.fill();

      c.x += c.vx;
      c.y += c.vy;
      if (c.x > W2 + 100 || c.y > H2 + 100 || c.x < -100 || c.y < -100) {
        c.life -= 0.08;
      } else {
        c.life -= c.decay;
      }
    });

    if (Date.now() < loopUntil || comets.length > 0) {
      requestAnimationFrame(frame);
    } else {
      shipCtx.clearRect(0, 0, W2, H2);
      celebrationActive = false;
    }
  }

  requestAnimationFrame(frame);
}

// ===== HYPERSPACE JUMP ANIMATION =====
function launchHyperspace(onComplete) {
  const W = shipCanvas.width;
  const H = shipCanvas.height;
  const cx = W / 2;
  const cy = H / 2;

  const streaks = [];
  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2;
    streaks.push({
      angle,
      dist: 10 + Math.random() * 60,
      speed: 1.5 + Math.random() * 2.5,
      width: 0.5 + Math.random() * 1
    });
  }

  let t = 0;
  const duration = 180; // ~3s at 60fps

  function frame() {
    const W2 = shipCanvas.width;
    const H2 = shipCanvas.height;
    shipCtx.clearRect(0, 0, W2, H2);

    const progress = t / duration;
    const accel = Math.pow(progress, 1.5);

    // Deep blue ambient glow that builds as speed increases
    const glowAlpha = 0.15 + accel * 0.45;
    shipCtx.fillStyle = `rgba(0, 40, 120, ${glowAlpha})`;
    shipCtx.fillRect(0, 0, W2, H2);

    // Bright blue flash at start
    if (progress < 0.12) {
      shipCtx.fillStyle = `rgba(0, 120, 255, ${(0.12 - progress) / 0.12 * 0.7})`;
      shipCtx.fillRect(0, 0, W2, H2);
    }

    streaks.forEach(s => {
      s.dist += s.speed * (1 + accel * 25);
      if (s.dist > Math.max(W2, H2)) s.dist = 5 + Math.random() * 30;

      const x2 = cx + Math.cos(s.angle) * s.dist;
      const y2 = cy + Math.sin(s.angle) * s.dist;
      const tailLen = Math.max(2, s.dist * 0.12 * (1 + accel * 6));
      const x1 = cx + Math.cos(s.angle) * Math.max(0, s.dist - tailLen);
      const y1 = cy + Math.sin(s.angle) * Math.max(0, s.dist - tailLen);

      const alpha = Math.min(1, 0.4 + accel * 0.6);

      // Gradient streak: deep blue tail → bright cyan-white head
      const streakGrad = shipCtx.createLinearGradient(x1, y1, x2, y2);
      streakGrad.addColorStop(0, `rgba(0, 60, 180, ${alpha * 0.5})`);
      streakGrad.addColorStop(0.6, `rgba(30, 140, 255, ${alpha})`);
      streakGrad.addColorStop(1, `rgba(140, 210, 255, ${alpha})`);

      shipCtx.beginPath();
      shipCtx.moveTo(x1, y1);
      shipCtx.lineTo(x2, y2);
      shipCtx.strokeStyle = streakGrad;
      shipCtx.lineWidth = s.width + accel * 1.5;
      shipCtx.stroke();
    });

    t++;
    if (t < duration) {
      requestAnimationFrame(frame);
    } else {
      shipCtx.clearRect(0, 0, W2, H2);
      if (onComplete) onComplete();
    }
  }

  requestAnimationFrame(frame);
}

// ===== APP STATE =====
const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === '1';
const SESSION_LENGTH = DEBUG_MODE ? 1 : 20;
let selectedNums = new Set([2,3,4,5,6,7,8,9,10,11,12]);
const sessionScores = [];
let questions = [];
let questionOps = [];   // 'multiply' | 'divide' per question
let answers = [];
let currentQ = 0;
let score = 0;
let selectedOps = new Set(['multiply']);

// Hyperspace mode state
let hyperspaceEnabled = false;
let hyperspaceDiff = 'wicked-easy';
const HYPERSPACE_LIMITS = { 'wicked-easy': 300, 'harder': 180, 'hyperdrive': 60 };
let hyperspaceTimer = null;
let hyperspaceTimeRemaining = 0;
let hyperspaceHalfwayShown = false;
let hyperspaceHandled = false;

// Kessel Run mode state
let kesselRunEnabled = false;
let kesselRunTimer = null;
let kesselRunElapsed = 0;
let kesselRunPenalties = 0;

// ===== SETUP =====
const grid = document.getElementById('numGrid');
for (let i = 0; i <= 13; i++) {
  const btn = document.createElement('button');
  btn.className = 'num-btn' + (i >= 2 && i <= 12 ? ' selected' : '');
  btn.textContent = i;
  btn.dataset.num = i;
  if (i === 7) btn.style.gridColumn = '1';
  btn.onclick = () => toggleNum(i, btn);
  grid.appendChild(btn);
}

function toggleNum(n, btn) {
  if (selectedNums.has(n)) {
    selectedNums.delete(n);
    btn.classList.remove('selected');
  } else {
    selectedNums.add(n);
    btn.classList.add('selected');
  }
  setActivePreset(null);
  sounds.navigate();
  document.getElementById('setupError').textContent = '';
}

function setActivePreset(id) {
  ['presetBasic', 'presetAll', 'presetClear'].forEach(pid => {
    document.getElementById(pid).classList.toggle('active-preset', pid === id);
  });
}

function selectAll() {
  selectedNums = new Set([...Array(14).keys()]);
  document.querySelectorAll('.num-btn').forEach(b => b.classList.add('selected'));
  setActivePreset('presetAll');
  sounds.navigate();
}

function selectNone() {
  selectedNums.clear();
  document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
  setActivePreset(null);
  sounds.navigate();
}

function toggleOp(op) {
  if (selectedOps.has(op)) selectedOps.delete(op);
  else selectedOps.add(op);
  updateOpButtons();
  sounds.navigate();
  document.getElementById('setupError').textContent =
    selectedOps.size === 0 ? '⚠ Select at least one operation to begin' : '';
}

function selectAllOps() {
  selectedOps = new Set(['multiply', 'divide', 'add', 'subtract']);
  updateOpButtons();
  sounds.navigate();
  document.getElementById('setupError').textContent = '';
}

function resetOps() {
  selectedOps = new Set(['multiply']);
  updateOpButtons();
  sounds.navigate();
  document.getElementById('setupError').textContent = '';
}

function updateOpButtons() {
  document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    const mode = btn.dataset.mode;
    if (mode === 'all') {
      btn.classList.toggle('selected-mode', selectedOps.size === 4);
    } else {
      btn.classList.toggle('selected-mode', selectedOps.has(mode));
    }
  });
}

function selectRange(a, b, presetId) {
  selectedNums.clear();
  document.querySelectorAll('.num-btn').forEach(btn => {
    const n = parseInt(btn.dataset.num);
    if (n >= a && n <= b) { selectedNums.add(n); btn.classList.add('selected'); }
    else btn.classList.remove('selected');
  });
  setActivePreset(presetId || null);
  sounds.navigate();
}

// ===== HYPERSPACE MODE =====
function toggleHyperspace() {
  hyperspaceEnabled = !hyperspaceEnabled;
  const btn = document.getElementById('hyperspaceToggle');
  btn.classList.toggle('selected-mode', hyperspaceEnabled);
  document.getElementById('hyperspaceBadge').textContent = hyperspaceEnabled ? 'ON' : 'OFF';
  document.getElementById('hyperspaceOptions').classList.toggle('open', hyperspaceEnabled);
  if (hyperspaceEnabled) {
    sounds.hyperspaceActivate();
    if (kesselRunEnabled) {
      kesselRunEnabled = false;
      document.getElementById('kesselToggle').classList.remove('selected-mode');
      document.getElementById('kesselBadge').textContent = 'OFF';
    }
  } else {
    sounds.navigate();
  }
}

function setDifficulty(diff) {
  hyperspaceDiff = diff;
  document.querySelectorAll('#difficultyBtns .diff-btn').forEach(btn => {
    btn.classList.toggle('selected-mode', btn.dataset.diff === diff);
  });
  sounds.navigate();
}

function startHyperspaceTimer() {
  stopHyperspaceTimer();
  hyperspaceTimeRemaining = HYPERSPACE_LIMITS[hyperspaceDiff];
  hyperspaceHalfwayShown = false;
  const total = hyperspaceTimeRemaining;

  function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  document.getElementById('hyperspaceCountdown').textContent = fmt(hyperspaceTimeRemaining);
  document.getElementById('hyperspaceCountdown').classList.remove('warning');
  document.getElementById('hyperspaceBarFill').style.width = '100%';
  document.getElementById('hyperspaceBarFill').classList.remove('warning');
  document.getElementById('hyperspaceStatusMsg').textContent = '';

  hyperspaceTimer = setInterval(() => {
    hyperspaceTimeRemaining--;
    const pct = hyperspaceTimeRemaining / total;

    document.getElementById('hyperspaceCountdown').textContent = fmt(hyperspaceTimeRemaining);
    document.getElementById('hyperspaceBarFill').style.width = `${pct * 100}%`;

    const warn = pct < 0.25;
    document.getElementById('hyperspaceCountdown').classList.toggle('warning', warn);
    document.getElementById('hyperspaceBarFill').classList.toggle('warning', warn);

    if (!hyperspaceHalfwayShown && pct <= 0.5) {
      hyperspaceHalfwayShown = true;
      document.getElementById('hyperspaceStatusMsg').textContent = '▸ COORDINATES CHECKED, ALMOST READY';
    }

    if (hyperspaceTimeRemaining > 0 && hyperspaceTimeRemaining <= 10) {
      sounds.hyperspaceCountdownTick(hyperspaceTimeRemaining);
    }

    if (hyperspaceTimeRemaining <= 0) {
      stopHyperspaceTimer();
      hyperspaceFailure();
    }
  }, 1000);
}

function stopHyperspaceTimer() {
  if (hyperspaceTimer) { clearInterval(hyperspaceTimer); hyperspaceTimer = null; }
}

function hyperspaceSuccess() {
  stopHyperspaceTimer();
  hyperspaceHandled = true;
  document.getElementById('hyperspaceStatusMsg').textContent = '▸ LAUNCH SEQUENCE COMPLETE!';

  const banner = document.getElementById('hyperWinBanner');
  banner.classList.add('show');
  sounds.hyperspaceJump();

  launchHyperspace(() => {
    setTimeout(() => {
      banner.classList.remove('show');
      banner.style.animation = 'none';
      showResults();
    }, 800);
  });
}

function hyperspaceFailure() {
  hyperspaceHandled = true;
  const input = document.getElementById('answerInput');
  if (input) input.setAttribute('disabled', '');
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.disabled = true;
  sounds.hyperspaceTimeout();

  const banner = document.getElementById('hyperFailBanner');
  banner.classList.add('show');
  setTimeout(() => {
    banner.classList.remove('show');
    banner.style.animation = 'none';
    showResults();
  }, 2500);
}

// ===== KESSEL RUN MODE =====
function toggleKesselRun() {
  kesselRunEnabled = !kesselRunEnabled;
  const btn = document.getElementById('kesselToggle');
  btn.classList.toggle('selected-mode', kesselRunEnabled);
  document.getElementById('kesselBadge').textContent = kesselRunEnabled ? 'ON' : 'OFF';
  if (kesselRunEnabled) {
    sounds.kesselRunActivate();
    if (hyperspaceEnabled) {
      hyperspaceEnabled = false;
      document.getElementById('hyperspaceToggle').classList.remove('selected-mode');
      document.getElementById('hyperspaceBadge').textContent = 'OFF';
      document.getElementById('hyperspaceOptions').classList.remove('open');
    }
  } else {
    sounds.navigate();
  }
}

// ===== ALIEN INVASION MODE =====
// Double-clicks are guarded with a plain flag rather than the button's
// `.launching` CSS, the way Begin Mission does it. The launch animation runs for
// 1.9s before navigating, and any way of coming back to this page that keeps the
// DOM — the browser's Back button restoring it from the back/forward cache, most
// obviously — brings that class back with it. When the class was what disabled
// the button, that left it permanently unclickable. A flag cannot outlive the
// page, so a restored page always has a working button.
let alienLaunchPending = false;

function launchAlienInvasion() {
  if (alienLaunchPending) return;
  if (selectedOps.size === 0) {
    document.getElementById('setupError').textContent = '⚠ Select at least one operation to begin';
    return;
  }
  if (selectedNums.size < 3) {
    document.getElementById('setupError').textContent = '⚠ Select at least 3 numbers';
    return;
  }
  const nums = [...selectedNums].join(',');
  const ops = [...selectedOps].join(',');
  const btn = document.querySelector('.alien-invasion-link');
  alienLaunchPending = true;
  if (btn) btn.classList.add('launching');
  sounds.missionStart();
  setTimeout(() => {
    window.location.href = `pages/alien-invasion.html?nums=${encodeURIComponent(nums)}&ops=${encodeURIComponent(ops)}`;
  }, 1900);
}

// A page restored from the back/forward cache is shown exactly as it was left,
// mid-launch-animation. Clearing the launch state on every `pageshow` resets the
// glow and the pending flag so the buttons look and behave idle again.
function clearLaunchState() {
  alienLaunchPending = false;
  const alienBtn = document.querySelector('.alien-invasion-link');
  if (alienBtn) alienBtn.classList.remove('launching');
  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.classList.remove('launching', 'liftoff');
}

window.addEventListener('pageshow', clearLaunchState);

function startKesselTimer() {
  stopKesselTimer();
  kesselRunElapsed = 0;
  kesselRunPenalties = 0;
  document.getElementById('kesselElapsed').textContent = '0:00';
  document.getElementById('kesselPenalties').textContent = '+0s';
  kesselRunTimer = setInterval(() => {
    kesselRunElapsed++;
    const m = Math.floor(kesselRunElapsed / 60);
    const s = String(kesselRunElapsed % 60).padStart(2, '0');
    document.getElementById('kesselElapsed').textContent = `${m}:${s}`;
  }, 1000);
}

function stopKesselTimer() {
  if (kesselRunTimer) { clearInterval(kesselRunTimer); kesselRunTimer = null; }
}

function addKesselPenalty() {
  kesselRunPenalties += 5;
  document.getElementById('kesselPenalties').textContent = `+${kesselRunPenalties}s`;
  const flash = document.getElementById('kesselPenaltyFlash');
  flash.classList.remove('show');
  void flash.offsetWidth;
  flash.classList.add('show');
  setTimeout(() => flash.classList.remove('show'), 1400);
}

function startQuiz() {
  if (selectedOps.size === 0) {
    document.getElementById('setupError').textContent = '⚠ Select at least one operation to begin';
    return;
  }
  if (selectedNums.size < 3) {
    document.getElementById('setupError').textContent = '⚠ Select at least 3 numbers';
    return;
  }
  const nums = [...selectedNums];
  questions = [];
  questionOps = [];

  // Build a separate question pool for each selected operation
  const ops = [...selectedOps];
  const perOpPool = {};
  ops.forEach(op => {
    const pool = [];
    if (op === 'multiply') {
      nums.forEach(a => nums.forEach(b => pool.push([a, b])));
    } else if (op === 'divide') {
      nums.forEach(a => nums.forEach(b => { if (b > 0) pool.push([a * b, b]); }));
    } else if (op === 'add') {
      nums.forEach(a => nums.forEach(b => pool.push([a, b])));
    } else if (op === 'subtract') {
      nums.forEach(a => nums.forEach(b => { if (a >= b) pool.push([a, b]); }));
    }
    perOpPool[op] = pool;
  });

  const totalAvailable = ops.reduce((sum, op) => sum + perOpPool[op].length, 0);
  if (totalAvailable === 0) {
    document.getElementById('setupError').textContent = '⚠ No valid problems — select non-zero numbers for division';
    return;
  }

  // Evenly distribute SESSION_LENGTH questions across selected operations
  const opCount = ops.length;
  const baseCount = Math.floor(SESSION_LENGTH / opCount);
  const remainder = SESSION_LENGTH % opCount;
  const combined = [];

  ops.forEach((op, idx) => {
    const quota = baseCount + (idx < remainder ? 1 : 0);
    const pool = perOpPool[op];
    // Shuffle this operation's pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Pick quota questions, repeating if the pool is smaller than the quota
    const picked = pool.slice(0, Math.min(quota, pool.length));
    while (picked.length < quota) {
      picked.push([...pool[Math.floor(Math.random() * pool.length)]]);
    }
    picked.forEach(q => combined.push({ q, op }));
  });

  // Shuffle the combined set so operations are interleaved randomly
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  questions = combined.map(x => x.q);
  questionOps = combined.map(x => x.op);

  // Animate button fill left-to-right, then launch
  const btn = document.getElementById('startBtn');
  if (btn.classList.contains('launching')) return;
  btn.classList.add('launching');
  sounds.missionStart();

  // At liftoff (1100ms) — burst flash on the fill
  setTimeout(() => btn.classList.add('liftoff'), 1100);

  // At 1300ms — transition to quiz screen
  setTimeout(() => {
    btn.classList.remove('launching', 'liftoff');
    answers = new Array(SESSION_LENGTH).fill(null);
    currentQ = 0;
    score = 0;
    hyperspaceHandled = false;
    buildNavDots();
    showScreen('quiz');
    loadQuestion(0);
    setTimeout(() => document.getElementById('answerInput').focus(), 200);
    if (hyperspaceEnabled) startHyperspaceTimer();
    if (kesselRunEnabled) startKesselTimer();
  }, 1300);
}

// ===== HELPERS =====
function getCorrectAnswer(i) {
  const [a, b] = questions[i];
  if (questionOps[i] === 'divide')   return a / b;
  if (questionOps[i] === 'add')      return a + b;
  if (questionOps[i] === 'subtract') return a - b;
  return a * b;
}

function getQuestionText(i) {
  const [a, b] = questions[i];
  if (questionOps[i] === 'divide')   return `${a} ÷ ${b} = ?`;
  if (questionOps[i] === 'add')      return `${a} + ${b} = ?`;
  if (questionOps[i] === 'subtract') return `${a} − ${b} = ?`;
  return `${a} × ${b} = ?`;
}

// ===== QUIZ =====
function buildNavDots() {
  const container = document.getElementById('navDots');
  container.innerHTML = '';
  for (let i = 0; i < questions.length; i++) {
    const dot = document.createElement('div');
    dot.className = 'nav-dot';
    dot.dataset.idx = i;
    container.appendChild(dot);
  }
}

function updateNavDots() {
  const dots = document.querySelectorAll('.nav-dot');
  dots.forEach((dot, i) => {
    dot.className = 'nav-dot';
    if (answers[i] !== null) {
      dot.classList.add(answers[i] === getCorrectAnswer(i) ? 'answered-correct' : 'answered-wrong');
    }
    if (i === currentQ) dot.classList.add('current');
  });
}

function loadQuestion(idx) {
  currentQ = idx;
  document.getElementById('questionNum').textContent = `PROBLEM ${idx + 1} OF ${questions.length}`;
  document.getElementById('questionText').textContent = getQuestionText(idx);
  document.getElementById('progressText').textContent = `${idx + 1} / ${questions.length}`;
  document.getElementById('progressFill').style.width = `${((idx + 1) / questions.length) * 100}%`;

  const input = document.getElementById('answerInput');
  input.value = answers[idx] !== null ? answers[idx] : '';
  input.className = 'answer-input';
  if (!hyperspaceHandled) {
    input.removeAttribute('disabled');
    document.getElementById('quizError').textContent = '';
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = false;
  }

  // recolor if already answered
  if (answers[idx] !== null) {
    input.classList.add(answers[idx] === getCorrectAnswer(idx) ? 'correct' : 'wrong');
  }

  updateNavDots();
  updateScoreLive();
  input.focus();
}

function updateScoreLive() {
  let s = 0;
  answers.forEach((ans, i) => {
    if (ans !== null && ans === getCorrectAnswer(i)) s++;
  });
  score = s;
  document.getElementById('scoreLive').textContent = `${s} ✓`;
}

function handleKey(e) {
  if (e.key === 'Enter') {
    sounds.submit();
    submitAnswer();
  } else if (e.key.length === 1 && /[0-9]/.test(e.key)) {
    sounds.keypress(e.key);
  }
}

function submitAnswerTouch() {
  sounds.submit();
  submitAnswer();
}

function clearError() {
  document.getElementById('quizError').textContent = '';
}

function submitAnswer() {
  const input = document.getElementById('answerInput');
  if (input.disabled) return;
  const val = input.value.trim();
  if (val === '') {
    document.getElementById('quizError').textContent = 'Enter a number!';
    return;
  }
  const num = parseInt(val);
  if (isNaN(num)) {
    document.getElementById('quizError').textContent = 'Numbers only!';
    return;
  }

  answers[currentQ] = num;
  const correct = getCorrectAnswer(currentQ);
  const isCorrect = num === correct;

  input.className = 'answer-input ' + (isCorrect ? 'correct' : 'wrong');
  input.setAttribute('disabled', '');
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.disabled = true;

  showFeedback(isCorrect);
  if (!isCorrect && kesselRunEnabled) addKesselPenalty();
  updateScoreLive();
  updateNavDots();

  // Check if all answered
  const allDone = answers.every(a => a !== null);
  if (allDone) {
    if (hyperspaceEnabled) {
      setTimeout(hyperspaceSuccess, 900);
    } else {
      setTimeout(showResults, 900);
    }
  } else {
    setTimeout(() => {
      // find next unanswered
      let next = -1;
      for (let i = currentQ + 1; i < questions.length; i++) {
        if (answers[i] === null) { next = i; break; }
      }
      if (next === -1) {
        for (let i = 0; i < currentQ; i++) {
          if (answers[i] === null) { next = i; break; }
        }
      }
      if (next !== -1) {
        loadQuestion(next);
      }
    }, 600);
  }
}

function showFeedback(isCorrect) {
  const flash = document.getElementById('feedbackFlash');
  flash.textContent = isCorrect ? '✓' : '✗';
  flash.className = 'feedback-flash ' + (isCorrect ? 'show-correct' : 'show-wrong');
  if (isCorrect) sounds.correct(); else sounds.wrong();
  setTimeout(() => flash.className = 'feedback-flash', 700);
}

// ===== RESULTS =====
function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function renderSessionRow(s, i, isCurrent) {
  const scoreStr = s.time != null ? fmt(s.time) : `${s.correct}/${s.total}`;
  const detailStr = s.time != null
    ? `${Math.round(s.pct * 100)}% · ${fmt(s.elapsed)}${s.penalties > 0 ? ` +${s.penalties}s` : ''}`
    : `${Math.round(s.pct * 100)}%`;
  const barPct = Math.round(s.pct * 100);
  const barColor = s.pct >= 0.75 ? 'rgba(57,255,20,0.15)' : s.pct >= 0.5 ? 'rgba(255,215,0,0.15)' : 'rgba(255,45,85,0.15)';
  return `<div class="session-score-row${isCurrent ? ' current-run' : ''}">
    <div class="session-score-bar" style="width:${barPct}%;background:${barColor};"></div>
    <span class="session-score-rank">#${i + 1}</span>
    <span class="session-score-mode">${s.mode}</span>
    <span class="session-score-time">${scoreStr}</span>
    <span class="session-score-detail">${detailStr}</span>
  </div>`;
}

function showResults() {
  let correct = 0;
  const missed = [];
  answers.forEach((ans, i) => {
    const correctAns = getCorrectAnswer(i);
    if (ans === correctAns) correct++;
    else missed.push({ q: getQuestionText(i).replace(' = ?', ''), yours: ans, correct: correctAns });
  });

  const pct = correct / questions.length;
  let rank, emoji;
  if (pct === 1)       { rank = 'JEDI MASTER';     emoji = '🌟'; }
  else if (pct >= 0.9) { rank = 'JEDI KNIGHT';     emoji = '⚔️'; }
  else if (pct >= 0.75){ rank = 'PADAWAN';          emoji = '🔵'; }
  else if (pct >= 0.5) { rank = 'REBEL RECRUIT';   emoji = '🚀'; }
  else                 { rank = 'YOUNGLING';        emoji = '🌱'; }

  document.getElementById('rankBadge').textContent = emoji;
  document.getElementById('rankTitle').textContent = rank;
  document.getElementById('scoreBig').textContent = `${correct}/${questions.length}`;
  document.getElementById('correctCount').textContent = correct;
  document.getElementById('wrongCount').textContent = missed.length;

  const missedSec = document.getElementById('missedSection');
  if (missed.length > 0) {
    missedSec.style.display = 'block';
    const list = document.getElementById('missedList');
    list.innerHTML = missed.map(m =>
      `<div class="missed-item">
        <span class="missed-q">${m.q}</span>
        <span class="missed-yours">You: ${m.yours === null ? 'Skipped' : m.yours}</span>
        <span class="missed-correct">✓ ${m.correct}</span>
      </div>`
    ).join('');
  } else {
    missedSec.style.display = 'none';
  }

  if (kesselRunEnabled) {
    stopKesselTimer();
    const total = kesselRunElapsed + kesselRunPenalties;
    document.getElementById('kesselResult').style.display = 'block';
    document.getElementById('kesselResultTime').textContent = fmt(total);
    document.getElementById('kesselResultBreakdown').textContent =
      `${fmt(kesselRunElapsed)} elapsed${kesselRunPenalties > 0 ? ` + ${kesselRunPenalties}s penalties` : ''}`;
    sessionScores.push({ mode: 'Kessel Run', correct, total: questions.length, pct,
      time: total, elapsed: kesselRunElapsed, penalties: kesselRunPenalties });
  } else {
    document.getElementById('kesselResult').style.display = 'none';
    sessionScores.push({ mode: hyperspaceEnabled ? 'Hyperspace' : 'Standard', correct, total: questions.length, pct });
  }
  // Always show unified session history
  document.getElementById('kesselSessionSection').style.display = 'none';
  document.getElementById('sessionSection').style.display = 'block';
  document.getElementById('sessionList').innerHTML = sessionScores.map((s, i) =>
    renderSessionRow(s, i, i === sessionScores.length - 1)
  ).join('');

  showScreen('results');

  // Mode-specific celebrations on passing (≥ 75%)
  if (pct >= 0.75 && !hyperspaceHandled) {
    setTimeout(kesselRunEnabled ? launchKesselCelebration : launchCelebration, 400);
  }
}

function restartQuiz() {
  stopHyperspaceTimer();
  stopKesselTimer();
  hyperspaceHandled = false;
  answers = new Array(questions.length).fill(null);
  currentQ = 0;
  score = 0;
  buildNavDots();
  showScreen('quiz');
  loadQuestion(0);
  if (hyperspaceEnabled) startHyperspaceTimer();
  if (kesselRunEnabled) startKesselTimer();
}

function retryQuiz() {
  stopHyperspaceTimer();
  stopKesselTimer();
  hyperspaceHandled = false;
  answers = new Array(questions.length).fill(null);
  currentQ = 0;
  score = 0;
  // reshuffle questions and ops together
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
    [questionOps[i], questionOps[j]] = [questionOps[j], questionOps[i]];
  }
  buildNavDots();
  showScreen('quiz');
  loadQuestion(0);
  if (hyperspaceEnabled) startHyperspaceTimer();
  if (kesselRunEnabled) startKesselTimer();
}

function newMission() {
  stopHyperspaceTimer();
  stopKesselTimer();
  showScreen('setup');
}

// ===== THEME CYCLER =====
const THEMES = [
  { id: 'dark',      label: '◑ DARK',      starColor: '220, 240, 255' },
  { id: 'dim',       label: '◑ DIM',       starColor: '180, 200, 220' },
  { id: 'midnight',  label: '◑ MIDNIGHT',  starColor: '200, 185, 255' },
  { id: 'deep-blue', label: '◑ DEEP BLUE', starColor: '180, 220, 255' },
  { id: 'retro',     label: '◑ RETRO',     starColor: '0, 255, 80' },
];
let currentThemeIdx = 0;

function cycleTheme() {
  currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
  const theme = THEMES[currentThemeIdx];
  document.documentElement.setAttribute('data-theme', theme.id);
  document.getElementById('themeBtn').textContent = theme.label;
  currentStarColor = theme.starColor;
}

// ===== SESSION HISTORY MODAL =====
function openHistoryModal() {
  const listEl = document.getElementById('historyModalList');
  if (sessionScores.length === 0) {
    listEl.innerHTML = '<div class="history-empty">NO SESSIONS YET</div>';
  } else {
    listEl.innerHTML = sessionScores.map((s, i) =>
      renderSessionRow(s, i, false)
    ).join('');
  }
  document.getElementById('historyModal').classList.add('open');
}

function closeHistoryModal() {
  document.getElementById('historyModal').classList.remove('open');
}

function closeHistoryOnBackdrop(e) {
  if (e.target === document.getElementById('historyModal')) closeHistoryModal();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeHistoryModal();
});


function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  document.getElementById('hyperspaceContainer').style.display =
    (name === 'quiz' && hyperspaceEnabled) ? 'block' : 'none';
  document.getElementById('kesselContainer').style.display =
    (name === 'quiz' && kesselRunEnabled) ? 'block' : 'none';
  if (name === 'quiz') {
    setTimeout(() => document.getElementById('answerInput').focus(), 200);
  }
}
