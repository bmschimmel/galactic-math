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

// ===== MOTION PREFERENCE =====
// When the OS asks for reduced motion, the starfield is drawn once and left
// still, and the celebration and hyperspace animations are skipped. Sounds
// and the banners still play — they carry the reward without the motion.
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== STARS =====
let currentStarColor = '220, 240, 255';

// The starfield is composed from two offscreen layers so the per-frame work
// is three cheap blits instead of three full-screen gradient fills and a few
// hundred arc() calls:
//   - nebula: the three rotating gradient blobs, repainted at ~10fps
//   - stars:  every star, drawn once per resize or theme change; the twinkle
//             comes from cross-fading two halves of the field via globalAlpha
// The loop also stops while the tab is hidden and never runs at all under
// prefers-reduced-motion.
const starBackground = (function() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  const nebula = document.createElement('canvas');
  const nebulaCtx = nebula.getContext('2d');
  const starLayers = [document.createElement('canvas'), document.createElement('canvas')];
  const NEBULA_INTERVAL_MS = 100;   // ~10fps is plenty for a 100s rotation
  const RESIZE_DEBOUNCE_MS = 150;
  let stars = [];
  let running = false;
  let lastNebulaAt = -Infinity;
  let paintedStarColor = '';
  let resizeTimer = null;

  function resize() {
    for (const c of [canvas, nebula, ...starLayers]) {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    buildStars();
    paintStarLayers();
    paintNebula(performance.now());
    compose(performance.now());
  }

  function buildStars() {
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 7000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        layer: i % 2
      });
    }
  }

  // Draw every star at full opacity into its layer; compose() sets the alpha.
  function paintStarLayers() {
    starLayers.forEach((layer, idx) => {
      const lctx = layer.getContext('2d');
      lctx.clearRect(0, 0, layer.width, layer.height);
      lctx.fillStyle = `rgb(${currentStarColor})`;
      lctx.beginPath();
      stars.forEach(s => {
        if (s.layer !== idx) return;
        lctx.moveTo(s.x + s.r, s.y);
        lctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      });
      lctx.fill();
    });
    paintedStarColor = currentStarColor;
  }

  // Slow-rotating nebula gradient — two glowing blobs drifting around
  function paintNebula(t) {
    const W = nebula.width;
    const H = nebula.height;
    const angle = t * 0.00006; // very slow rotation ~100s per full cycle
    const blobs = [
      { a: angle,                  reach: 0.45, radius: 0.55, color: 'rgba(26, 39, 68, 0.55)' },
      { a: angle + Math.PI,        reach: 0.45, radius: 0.45, color: 'rgba(60, 20, 80, 0.4)' },
      { a: angle + Math.PI * 0.67, reach: 0.35, radius: 0.35, color: 'rgba(0, 40, 80, 0.3)' },
    ];
    nebulaCtx.clearRect(0, 0, W, H);
    blobs.forEach(b => {
      const cx = W * (0.5 + b.reach * Math.cos(b.a));
      const cy = H * (0.5 + b.reach * Math.sin(b.a));
      const g = nebulaCtx.createRadialGradient(cx, cy, 0, cx, cy, W * b.radius);
      g.addColorStop(0, b.color);
      g.addColorStop(1, 'transparent');
      nebulaCtx.fillStyle = g;
      nebulaCtx.fillRect(0, 0, W, H);
    });
    lastNebulaAt = t;
  }

  // Stars — subtle twinkle only (opacity 0.25 to 0.6), the two halves of the
  // field breathing in opposite phase so the whole sky never pulses at once.
  function compose(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(nebula, 0, 0);
    const twinkle = REDUCED_MOTION ? 0.5 : 0.5 + 0.5 * Math.sin(t * 0.0015);
    ctx.globalAlpha = 0.25 + 0.35 * twinkle;
    ctx.drawImage(starLayers[0], 0, 0);
    ctx.globalAlpha = 0.25 + 0.35 * (1 - twinkle);
    ctx.drawImage(starLayers[1], 0, 0);
    ctx.globalAlpha = 1;
  }

  function draw(t) {
    if (!running) return;
    if (t - lastNebulaAt >= NEBULA_INTERVAL_MS) paintNebula(t);
    if (paintedStarColor !== currentStarColor) paintStarLayers();
    compose(t);
    requestAnimationFrame(draw);
  }

  function start() {
    if (running || REDUCED_MOTION) return;
    running = true;
    requestAnimationFrame(draw);
  }

  function stop() {
    running = false;
  }

  // Repaint one frame now — used after a theme change so a still starfield
  // (reduced motion) picks up the new star color.
  function refresh() {
    paintStarLayers();
    compose(performance.now());
  }

  // Mobile browsers fire resize repeatedly while the URL bar shows and hides;
  // rebuilding the whole field on every event is wasted work.
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, RESIZE_DEBOUNCE_MS);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  resize();
  start();

  return { refresh };
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
  if (!REDUCED_MOTION) {
    for (let i = 0; i < 9; i++) {
      setTimeout(spawnRing, i * 280);
    }
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

  if (REDUCED_MOTION) { celebrationActive = false; return; }

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
  if (!REDUCED_MOTION) {
    for (let i = 0; i < 22; i++) {
      setTimeout(spawnComet, i * 185);
    }
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

  if (REDUCED_MOTION) { celebrationActive = false; return; }

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
  // Reduced motion: no streaks — hold on the banner for a beat, then move on.
  if (REDUCED_MOTION) {
    setTimeout(() => { if (onComplete) onComplete(); }, 1200);
    return;
  }

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

// Setup deck state (IDT-279). The game chosen on step 3 decides which options
// step 4 shows; both games keep their own "normal" option preselected.
let selectedGame = null;        // 'galactic' | 'alien'
let gameMode = 'standard';      // Galactic Math: 'standard' | 'hyperspace' | 'kessel'
let invasionSize = 'invasion';  // Alien Invasion: 'sneak' | 'invasion' | 'chaos'
const INVASIONS = {
  sneak:    { icon: '🛸', name: 'SNEAK ATTACK', aliens: 5 },
  invasion: { icon: '👾', name: 'INVASION',     aliens: 10 },
  chaos:    { icon: '🌀', name: 'CHAOS',        aliens: 25 },
};
let setupStep = 0;

// Hyperspace mode state
let hyperspaceEnabled = false;
let hyperspaceDiff = 'wicked-easy';
const HYPERSPACE_LIMITS = { 'wicked-easy': 300, 'harder': 180, 'hyperdrive': 60 };
let hyperspaceTimer = null;
let hyperspaceStartedAt = 0;
let hyperspaceTimeRemaining = 0;
let hyperspaceLastBeepSecond = 0;
let hyperspaceHalfwayShown = false;
let hyperspaceHandled = false;

// Kessel Run mode state
let kesselRunEnabled = false;
let kesselRunTimer = null;
let kesselRunStartedAt = 0;
let kesselRunElapsed = 0;
let kesselRunPenalties = 0;

// Timers derive their value from the wall clock (Date.now()) rather than
// counting setInterval ticks, so they stay accurate when the browser
// throttles background tabs. The interval is only a repaint trigger.
const TIMER_REPAINT_MS = 250;

function secondsSince(startedAt) {
  return Math.floor((Date.now() - startedAt) / 1000);
}

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
  boing(btn);
  sounds.navigate();
  refreshSetup();
}

function setActivePreset(id) {
  ['presetBasic', 'presetAll', 'presetClear'].forEach(pid => {
    document.getElementById(pid).classList.toggle('active-preset', pid === id);
  });
}

function selectAll() {
  selectRange(0, 13, 'presetAll');
}

function selectNone() {
  selectedNums.clear();
  document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('selected'));
  setActivePreset(null);
  sounds.navigate();
  refreshSetup();
}

function selectRange(a, b, presetId) {
  selectedNums.clear();
  document.querySelectorAll('.num-btn').forEach(btn => {
    const n = parseInt(btn.dataset.num);
    if (n >= a && n <= b) { selectedNums.add(n); btn.classList.add('selected'); }
    else btn.classList.remove('selected');
    boing(btn);
  });
  setActivePreset(presetId || null);
  sounds.navigate();
  refreshSetup();
}

function toggleOp(op) {
  if (selectedOps.has(op)) selectedOps.delete(op);
  else selectedOps.add(op);
  updateOpButtons();
  boing(document.querySelector(`.op-card[data-mode="${op}"]`));
  sounds.navigate();
  refreshSetup();
}

function selectAllOps() {
  selectedOps = new Set(['multiply', 'divide', 'add', 'subtract']);
  updateOpButtons();
  document.querySelectorAll('.op-card').forEach(boing);
  sounds.navigate();
  refreshSetup();
}

function updateOpButtons() {
  document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    const mode = btn.dataset.mode;
    if (mode === 'all') {
      btn.classList.toggle('active-preset', selectedOps.size === 4);
    } else {
      btn.classList.toggle('selected-mode', selectedOps.has(mode));
    }
  });
}

// ===== SETUP DECK =====
// One flashcard per step. The deck body keeps a fixed minimum height and the
// Back / Next / Begin Mission buttons live in the same two slots on every
// step, so nothing moves while a kid works through the cards.
const SETUP_STEPS = ['nums', 'ops', 'game', 'options', 'launch'];
const OP_SYMBOLS = { multiply: '×', divide: '÷', add: '+', subtract: '−' };
const GAME_INFO = {
  galactic: { icon: '🚀', name: 'GALACTIC MATH' },
  alien:    { icon: '👾', name: 'ALIEN INVASION' },
};
const AUTO_ADVANCE_MS = 420; // long enough to see the tap bounce before the card slides

// Squash-and-stretch on tap. Removing and re-adding the class restarts the
// animation on an element that is already on screen.
function boing(el) {
  if (!el) return;
  el.classList.remove('boing');
  void el.offsetWidth;
  el.classList.add('boing');
}

function numsReady() { return selectedNums.size >= 3; }
function opsReady() { return selectedOps.size >= 1; }

function stepReady(step) {
  const id = SETUP_STEPS[step];
  if (id === 'nums') return numsReady();
  if (id === 'ops') return opsReady();
  if (id === 'game') return selectedGame !== null;
  return true;
}

// "2–12" or "2, 3, 5–7" — a compact label for the selected numbers.
function numsLabel() {
  const sorted = [...selectedNums].sort((a, b) => a - b);
  if (sorted.length === 0) return 'none yet';
  const parts = [];
  let start = sorted[0], prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) { prev = n; continue; }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = prev = n;
  }
  return parts.join(', ');
}

function opsLabel() {
  return Object.keys(OP_SYMBOLS).filter(op => selectedOps.has(op)).map(op => OP_SYMBOLS[op]).join(' ') || 'none yet';
}

function gameLabel() {
  const g = GAME_INFO[selectedGame];
  return g ? `${g.icon} ${g.name}` : '';
}

function optionsLabel() {
  if (selectedGame === 'alien') {
    const v = INVASIONS[invasionSize];
    return `${v.icon} ${v.name} · ${v.aliens} aliens`;
  }
  if (gameMode === 'hyperspace') {
    const btn = document.querySelector(`.diff-btn[data-diff="${hyperspaceDiff}"]`);
    return `⚡ HYPERSPACE · ${btn.querySelector('.diff-name').textContent} ${btn.querySelector('.diff-time').textContent}`;
  }
  return gameMode === 'kessel' ? '☄️ KESSEL RUN' : '🧘 STANDARD';
}

function goToStep(step, dir) {
  if (step < 0 || step >= SETUP_STEPS.length) return;
  // Flight-path nodes only jump backwards; forward travel goes through Next.
  if (step > setupStep && !dir) return;
  dir = dir || (step < setupStep ? 'back' : 'fwd');
  setupStep = step;

  document.querySelectorAll('.flashcard').forEach((card, i) => {
    card.classList.remove('active', 'in-fwd', 'in-back');
    if (i === step) {
      void card.offsetWidth; // restart the slide-in even if this card was just shown
      card.classList.add('active', dir === 'back' ? 'in-back' : 'in-fwd');
    }
  });
  document.getElementById('setupError').textContent = '';
  refreshSetup();
}

// Next is always clickable. When the step isn't ready it says what's missing
// instead of sitting greyed out with no explanation.
function nextStep() {
  if (!stepReady(setupStep)) {
    const id = SETUP_STEPS[setupStep];
    document.getElementById('setupError').textContent =
      id === 'nums' ? '⚠ Pick at least 3 numbers' :
      id === 'ops'  ? '⚠ Pick at least one kind of math' :
                      '⚠ Pick a game first';
    sounds.wrong();
    return;
  }
  sounds.navigate();
  goToStep(setupStep + 1, 'fwd');
}

function prevStep() {
  if (setupStep === 0) return;
  sounds.navigate();
  goToStep(setupStep - 1, 'back');
}

// Repaint everything on the deck that depends on state: flight path, hints,
// which options panel shows, the briefing rows, and the nav buttons.
function refreshSetup() {
  // A change that makes the step ready clears any "pick at least…" message.
  if (stepReady(setupStep)) document.getElementById('setupError').textContent = '';
  document.querySelectorAll('.fp-node').forEach((node, i) => {
    node.classList.toggle('done', i < setupStep);
    node.classList.toggle('now', i === setupStep);
    node.querySelector('.fp-dot').textContent = i < setupStep ? '✓' : node.dataset.icon;
  });

  const alien = selectedGame === 'alien';
  document.getElementById('optionsTitle').textContent = alien ? 'How bad is the alien invasion?' : 'Pick your game mode!';
  document.getElementById('galacticOptions').hidden = alien;
  document.getElementById('alienOptions').hidden = !alien;
  document.getElementById('optionsHint').textContent = alien ? 'More aliens means more missiles — and more math to earn them.' : '';

  document.getElementById('briefNums').textContent = numsLabel();
  document.getElementById('briefOps').textContent = opsLabel();
  document.getElementById('briefGame').textContent = gameLabel();
  document.getElementById('briefOptions').textContent = selectedGame ? optionsLabel() : '';

  const onLaunch = SETUP_STEPS[setupStep] === 'launch';
  document.getElementById('backBtn').disabled = setupStep === 0;
  document.getElementById('nextBtn').hidden = onLaunch;
  const startBtn = document.getElementById('startBtn');
  startBtn.hidden = !onLaunch;
  startBtn.classList.toggle('alien', alien);
  document.getElementById('startBtnLabel').textContent = `${alien ? '👾' : '🚀'} Begin Mission`;
}

function selectGame(game) {
  if (selectedGame !== game) {
    // Each game arrives at its options card with the normal choice already
    // made, so Next is live and the card is a chance to change, not a gate.
    selectedGame = game;
    if (game === 'alien') {
      setInvasion('invasion', { silent: true });
    } else {
      setGameMode('standard', { silent: true });
    }
  }
  document.querySelectorAll('.game-card[data-game]').forEach(card => {
    const on = card.dataset.game === game;
    card.classList.toggle('on', on);
    card.classList.toggle('dim', !on);
    if (on) boing(card);
  });
  sounds.modeActivate();
  refreshSetup();
  setTimeout(() => { if (setupStep === 2) goToStep(3, 'fwd'); }, AUTO_ADVANCE_MS);
}

function launchMission() {
  if (selectedGame === 'alien') launchAlienInvasion();
  else startQuiz();
}

// ===== HYPERSPACE MODE =====
// Standard / Hyperspace / Kessel Run are one choice. Hyperspace stays on the
// card so its difficulty can be picked; the other two move on by themselves.
function setGameMode(mode, opts) {
  const silent = opts && opts.silent;
  gameMode = mode;
  hyperspaceEnabled = mode === 'hyperspace';
  kesselRunEnabled = mode === 'kessel';

  document.querySelectorAll('.mode-tile[data-mode]').forEach(tile => {
    const on = tile.dataset.mode === mode;
    tile.classList.toggle('selected-mode', on);
    if (on && !silent) boing(tile);
  });
  document.getElementById('hyperspaceOptions').classList.toggle('open', hyperspaceEnabled);

  if (silent) return;
  if (mode === 'hyperspace') sounds.hyperspaceActivate();
  else if (mode === 'kessel') sounds.kesselRunActivate();
  else sounds.navigate();
  refreshSetup();
  if (mode !== 'hyperspace') {
    setTimeout(() => { if (setupStep === 3) goToStep(4, 'fwd'); }, AUTO_ADVANCE_MS);
  }
}

function setDifficulty(diff) {
  hyperspaceDiff = diff;
  document.querySelectorAll('#difficultyBtns .diff-btn').forEach(btn => {
    const on = btn.dataset.diff === diff;
    btn.classList.toggle('selected-mode', on);
    if (on) boing(btn);
  });
  sounds.navigate();
  refreshSetup();
  setTimeout(() => { if (setupStep === 3) goToStep(4, 'fwd'); }, AUTO_ADVANCE_MS);
}

function startHyperspaceTimer() {
  stopHyperspaceTimer();
  const total = HYPERSPACE_LIMITS[hyperspaceDiff];
  hyperspaceStartedAt = Date.now();
  hyperspaceTimeRemaining = total;
  hyperspaceLastBeepSecond = 0;
  hyperspaceHalfwayShown = false;

  function fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  document.getElementById('hyperspaceCountdown').textContent = fmt(hyperspaceTimeRemaining);
  document.getElementById('hyperspaceCountdown').classList.remove('warning');
  document.getElementById('hyperspaceBarFill').style.width = '100%';
  document.getElementById('hyperspaceBarFill').classList.remove('warning');
  document.getElementById('hyperspaceStatusMsg').textContent = '';

  hyperspaceTimer = setInterval(() => {
    const remaining = Math.max(0, total - secondsSince(hyperspaceStartedAt));
    if (remaining === hyperspaceTimeRemaining) return; // nothing changed since last repaint
    hyperspaceTimeRemaining = remaining;
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

    // Beep once per second in the final 10s. The guard means a jump of
    // several seconds (e.g. returning to a throttled tab) plays one beep,
    // not a burst of them.
    if (hyperspaceTimeRemaining > 0 && hyperspaceTimeRemaining <= 10
        && hyperspaceTimeRemaining !== hyperspaceLastBeepSecond) {
      hyperspaceLastBeepSecond = hyperspaceTimeRemaining;
      sounds.hyperspaceCountdownTick(hyperspaceTimeRemaining);
    }

    if (hyperspaceTimeRemaining <= 0) {
      stopHyperspaceTimer();
      hyperspaceFailure();
    }
  }, TIMER_REPAINT_MS);
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

// ===== ALIEN INVASION MODE =====
function setInvasion(size, opts) {
  const silent = opts && opts.silent;
  invasionSize = size;
  document.querySelectorAll('.invasion-btn[data-invasion]').forEach(btn => {
    const on = btn.dataset.invasion === size;
    btn.classList.toggle('selected-mode', on);
    if (on && !silent) boing(btn);
  });
  if (silent) return;
  sounds.navigate();
  refreshSetup();
  setTimeout(() => { if (setupStep === 3) goToStep(4, 'fwd'); }, AUTO_ADVANCE_MS);
}

// Double-clicks are guarded with a plain flag rather than the button's
// `.launching` CSS. The launch animation runs before navigating, and any way of
// coming back to this page that keeps the DOM — the browser's Back button
// restoring it from the back/forward cache, most obviously — brings that class
// back with it. When the class was what disabled the button, that left it
// permanently unclickable. A flag cannot outlive the page, so a restored page
// always has a working button.
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
  const aliens = INVASIONS[invasionSize].aliens;
  const btn = document.getElementById('startBtn');
  alienLaunchPending = true;
  btn.classList.add('launching');
  sounds.missionStart();
  setTimeout(() => btn.classList.add('liftoff'), 1100);
  setTimeout(() => {
    window.location.href = `pages/alien-invasion.html?nums=${encodeURIComponent(nums)}&ops=${encodeURIComponent(ops)}&aliens=${aliens}`;
  }, 1300);
}

// A page restored from the back/forward cache is shown exactly as it was left,
// mid-launch-animation. Clearing the launch state on every `pageshow` resets the
// glow and the pending flag so the button looks and behaves idle again.
function clearLaunchState() {
  alienLaunchPending = false;
  const startBtn = document.getElementById('startBtn');
  if (startBtn) startBtn.classList.remove('launching', 'liftoff');
}

window.addEventListener('pageshow', clearLaunchState);

// ===== KESSEL RUN MODE =====
function startKesselTimer() {
  stopKesselTimer();
  kesselRunStartedAt = Date.now();
  kesselRunElapsed = 0;
  kesselRunPenalties = 0;
  document.getElementById('kesselElapsed').textContent = '0:00';
  document.getElementById('kesselPenalties').textContent = '+0s';
  kesselRunTimer = setInterval(() => {
    const elapsed = secondsSince(kesselRunStartedAt);
    if (elapsed === kesselRunElapsed) return; // nothing changed since last repaint
    kesselRunElapsed = elapsed;
    const m = Math.floor(kesselRunElapsed / 60);
    const s = String(kesselRunElapsed % 60).padStart(2, '0');
    document.getElementById('kesselElapsed').textContent = `${m}:${s}`;
  }, TIMER_REPAINT_MS);
}

function stopKesselTimer() {
  if (kesselRunTimer) {
    clearInterval(kesselRunTimer);
    kesselRunTimer = null;
    // Snapshot the final time from the clock so the results screen
    // doesn't depend on whether the last repaint happened to fire.
    kesselRunElapsed = secondsSince(kesselRunStartedAt);
  }
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
  goToStep(0, 'back');
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
  starBackground.refresh();
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


// ===== FOOTER =====
// Points the version link at its release notes, reading the version from the
// visible text so it stays the single source of truth (see CONTRIBUTING.md).
const versionLink = document.querySelector('.version-link');
if (versionLink) {
  const version = versionLink.textContent.trim().replace(/^v/i, '');
  versionLink.href = `pages/release-notes.html?version=${encodeURIComponent(version)}`;
}

// First paint of the setup deck.
goToStep(0, 'fwd');

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
