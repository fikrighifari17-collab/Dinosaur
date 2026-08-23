import { useCallback, useEffect, useRef, useState } from "react";
import "./DinoGame.css";

const CANVAS_W = 800;
const CANVAS_H = 400;
const DINO_SIZE = 42;
const BASE_SPEED = 4;
const REVEAL_RADIUS = 70;
const TOUCH_RADIUS = 22;
const DINO_START = { x: 80, y: 300 };
const SAFE_RADIUS = 120;
const MAX_LEVEL = 5;
const PORTAL = { x: 378, y: 178, w: 44, h: 44 };
const FIREFLY_OBSTACLE_GAP = 45;
const POWERUP_GAP = 40;
const INVULN_MS = 1500;
const SPEED_ACHIEVEMENT_MS = 30000;
const COMBO_WINDOW_MS = 2200;
const SLAM_COOLDOWN_MS = 12000;
const RAMPAGE_DURATION_MS = 8000;

// --- CONFIG TINGKAT KESULITAN / GAME MODES ---
const DIFFICULTY_CONFIGS = {
  easy: {
    id: "easy",
    name: "🌱 Easy",
    label: "Easy (Santai)",
    speedMult: 0.7,
    startLives: 2,
    roarCd: 5000,
    scoreMult: 1.0,
    badgeColor: "#66bb6a",
    desc: "Predator lambat, 2 nyawa awal, Roar 5s.",
  },
  normal: {
    id: "normal",
    name: "⚡ Normal",
    label: "Normal (Standar)",
    speedMult: 1.0,
    startLives: 1,
    roarCd: 8000,
    scoreMult: 1.5,
    badgeColor: "#42a5f5",
    desc: "Tantangan standar, 1 nyawa, Roar 8s.",
  },
  hard: {
    id: "hard",
    name: "🔥 Hard",
    label: "Hard (Nightmare)",
    speedMult: 1.35,
    startLives: 1,
    roarCd: 10000,
    scoreMult: 2.5,
    badgeColor: "#ef5350",
    desc: "Predator kilat & agresif, Bonus Skor 2.5x!",
  },
  zen: {
    id: "zen",
    name: "🛡️ Zen",
    label: "Zen Practice",
    speedMult: 0.6,
    startLives: 99,
    roarCd: 3000,
    scoreMult: 0.5,
    badgeColor: "#ab47bc",
    desc: "Mode bebas tanpa game over untuk latihan.",
  },
  timeAttack: {
    id: "timeAttack",
    name: "⏱️ Time Attack",
    label: "Survival Time Attack",
    speedMult: 1.1,
    startLives: 1,
    roarCd: 6000,
    scoreMult: 2.0,
    badgeColor: "#ff9800",
    desc: "Waktu 60 detik! Ambil kunang-kunang untuk +3 detik!",
  },
};

const LEVEL_CONFIG = [
  { real: 5, fake: 0, obstacles: 8, predators: 2, predatorSpeed: 2.0 },
  { real: 6, fake: 0, obstacles: 11, predators: 3, predatorSpeed: 2.3 },
  { real: 7, fake: 0, obstacles: 14, predators: 4, predatorSpeed: 2.6 },
  { real: 8, fake: 1, obstacles: 17, predators: 5, predatorSpeed: 2.9 },
  { real: 9, fake: 2, obstacles: 20, predators: 6, predatorSpeed: 3.2 },
];

const POWERUP_TYPES = [
  { id: "shield", label: "S", color: "#42a5f5", name: "Shield" },
  { id: "freeze", label: "F", color: "#80deea", name: "Freeze" },
  { id: "speed", label: "SP", color: "#ffb300", name: "Speed Boost" },
  { id: "dash", label: "D", color: "#ab47bc", name: "Dash" },
  { id: "radar", label: "R", color: "#66bb6a", name: "Radar" },
  { id: "revealBoost", label: "RB", color: "#ef5350", name: "Reveal Boost" },
  { id: "repel", label: "RP", color: "#ff7043", name: "Repel" },
  { id: "doubleScore", label: "2X", color: "#ffd54f", name: "Double Score" },
  { id: "extraLife", label: "+1", color: "#ec407a", name: "Extra Life" },
];

const SHOP_ITEMS = [
  { id: "speed", name: "⚡ Kecepatan Lari", maxLvl: 3, cost: 15, desc: "+10% kecepatan lari Dino" },
  { id: "shield", name: "🛡️ Durasi Shield", maxLvl: 3, cost: 20, desc: "+2 detik durasi perlindungan Shield" },
  { id: "magnet", name: "🧲 Magnet Kunang", maxLvl: 3, cost: 25, desc: "Menarik kunang-kunang di sekitarnya secara otomatis" },
  { id: "roar", name: "📢 Roar Mastery", maxLvl: 3, cost: 30, desc: "Mengurangi cooldown Auman Roar sebesar -1.5 detik" },
];

const THEME_NAMES = [
  "Senja Violet (Twilight Prairie)",
  "Malam Bintang & Awan Nebula",
  "Tarian Aurora Borealis",
  "Blood Eclipse & Bara Lava",
  "Cosmic Void & Hujan Meteor",
];

const DINO_SKINS = {
  classic: {
    name: "Classic Rex",
    body: "#4CAF50",
    dark: "#1B5E20",
    belly: "#A5D6A7",
    hat: "headband",
    unlockCondition: null,
    unlockLabel: "Skin Bawaan",
    desc: "Rex hijau klasik dengan bando merah sporty!",
  },
  golden: {
    name: "Golden Rex",
    body: "#FFD54F",
    dark: "#7A5200",
    belly: "#FFF59D",
    hat: "crown",
    trail: "gold",
    unlockCondition: "win_game",
    unlockLabel: "Menangkan seluruh 5 level",
    desc: "Rex berlapis emas murni dengan mahkota megah & jejak bintang berkilau.",
  },
  shadow: {
    name: "Cyber Rex",
    body: "#37474F",
    dark: "#000000",
    belly: "#90A4AE",
    hat: "visor",
    trail: "cyber",
    unlockCondition: "no_hit_run",
    unlockLabel: "Selesaikan game tanpa kena hit",
    desc: "Rex masa depan berzirah cybernetic dengan visor cyan menyala!",
  },
  fire: {
    name: "Fire Drake",
    body: "#FF3D00",
    dark: "#BF360C",
    belly: "#FF9E80",
    hat: "flameHorns",
    trail: "fire",
    unlockCondition: null,
    unlockLabel: "Skin Spesial",
    desc: "Naga Rex berdarah lahar dengan tanduk api & jejak bara menyala!",
  },
  ice: {
    name: "Frost Rex",
    body: "#00E5FF",
    dark: "#006064",
    belly: "#E0F7FA",
    hat: "iceHorns",
    trail: "ice",
    unlockCondition: null,
    unlockLabel: "Skin Spesial",
    desc: "Rex penguasa salju abadi dengan duri es kristal & jejak kepingan es.",
  },
  synthwave: {
    name: "Neon Synth",
    body: "#E91E63",
    dark: "#880E4F",
    belly: "#F8BBD0",
    hat: "sunglasses",
    trail: "neon",
    unlockCondition: null,
    unlockLabel: "Skin Spesial",
    desc: "Rex gaya 80-an berpendar pink neon dengan kacamata hitam retro!",
  },
};

const ACHIEVEMENTS = [
  {
    id: "no_hit_run",
    name: "Tak Tersentuh",
    desc: "Selesaikan game tanpa kena hit sekali pun",
  },
  {
    id: "speed_collector",
    name: "Kilat Malam",
    desc: "Kumpulkan semua kunang-kunang asli di satu level dalam <30 detik",
  },
  {
    id: "win_game",
    name: "Penakluk Malam",
    desc: "Selesaikan semua 5 level",
  },
  {
    id: "powerup_master",
    name: "Kolektor Kristal",
    desc: "Ambil 15 power-up dalam satu permainan",
  },
];

const HIGHSCORE_KEY = "dinoGame_highScores";
const ACHIEVEMENT_KEY = "dinoGame_achievements";
const SKIN_KEY = "dinoGame_skins";
const COINS_KEY = "dinoGame_coins";
const UPGRADES_KEY = "dinoGame_upgrades";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    if (typeof fallback === "object" && !Array.isArray(fallback)) {
      if (typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
      return { ...fallback, ...parsed };
    }
    if (Array.isArray(fallback)) {
      if (!Array.isArray(parsed)) return fallback;
      return parsed;
    }
    if (typeof fallback === "number") {
      return typeof parsed === "number" ? parsed : fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage tidak tersedia
  }
}

let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) audioCtx = new AudioCtxClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type, soundEnabled = true, pitchMult = 1.0) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === "step") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110 * pitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(35 * pitchMult, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === "collect") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33 * pitchMult, now);
      osc.frequency.setValueAtTime(880 * pitchMult, now + 0.06);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "powerup") {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * pitchMult, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.1);
      });
    } else if (type === "hit") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "roar") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.6);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === "slam") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === "rampage") {
      [300, 450, 600, 900].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.15);
      });
    } else if (type === "victory") {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    }
  } catch {
    // Audio fail silent fallback
  }
}

const lerpColor = (t) => {
  const c1 = [255, 245, 157];
  const c2 = [255, 23, 68];
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
};

const distToRect = (px, py, rect) => {
  const closestX = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - closestX;
  const dy = py - closestY;
  return Math.sqrt(dx * dx + dy * dy);
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function drawRoundRect(ctx, x, y, w, h, radii = 0) {
  try {
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, w, h, radii);
      return;
    }
  } catch (_) {}
  ctx.beginPath();
  let r = 0;
  if (Array.isArray(radii)) {
    r = radii[0] || 0;
  } else if (typeof radii === "number") {
    r = radii;
  }
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ANALOG JOYSTICK COMPONENT UNTUK PENGGUNA MOBILE (POJOK KIRI BAWAH)
function TouchAnalog({ onAnalogUpdate }) {
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const pointerIdRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeDirs, setActiveDirs] = useState({ up: false, down: false, left: false, right: false });
  const activeDirsRef = useRef({ up: false, down: false, left: false, right: false });

  const resetStick = useCallback(() => {
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    setIsDragging(false);

    if (knobRef.current) {
      knobRef.current.style.transform = "translate3d(0px, 0px, 0)";
    }

    const resetDirs = { up: false, down: false, left: false, right: false };
    onAnalogUpdate(resetDirs);
    activeDirsRef.current = resetDirs;
    setActiveDirs(resetDirs);
  }, [onAnalogUpdate]);

  const updateFromCoords = useCallback((clientX, clientY) => {
    if (!baseRef.current || !isDraggingRef.current) return;

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    const maxRadius = Math.max(20, rect.width / 2 - 8);

    let clampedX = dx;
    let clampedY = dy;
    if (dist > maxRadius && dist > 0) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
    }

    const deadzone = Math.max(8, rect.width * 0.12);
    let isUp = false;
    let isDown = false;
    let isLeft = false;
    let isRight = false;

    if (dist >= deadzone) {
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      isUp = angleDeg > -157.5 && angleDeg < -22.5;
      isDown = angleDeg > 22.5 && angleDeg < 157.5;
      isLeft = angleDeg < -112.5 || angleDeg > 112.5;
      isRight = angleDeg > -67.5 && angleDeg < 67.5;
    }

    const dirs = { up: isUp, down: isDown, left: isLeft, right: isRight };
    onAnalogUpdate(dirs);

    const prev = activeDirsRef.current;
    if (prev.up !== isUp || prev.down !== isDown || prev.left !== isLeft || prev.right !== isRight) {
      activeDirsRef.current = dirs;
      setActiveDirs(dirs);
    }
  }, [onAnalogUpdate]);

  const handlePointerDown = (e) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    pointerIdRef.current = e.pointerId;
    isDraggingRef.current = true;
    setIsDragging(true);

    try {
      if (e.currentTarget && e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch (err) {
      // ignore
    }

    updateFromCoords(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;
    updateFromCoords(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return;

    try {
      if (e.currentTarget && e.currentTarget.releasePointerCapture && pointerIdRef.current !== null) {
        e.currentTarget.releasePointerCapture(pointerIdRef.current);
      }
    } catch (err) {
      // ignore
    }
    resetStick();
  };

  useEffect(() => {
    const handleGlobalEnd = (e) => {
      if (e && e.pointerId !== undefined && pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) {
        return;
      }
      if (isDraggingRef.current) {
        resetStick();
      }
    };

    window.addEventListener("pointerup", handleGlobalEnd);
    window.addEventListener("pointercancel", handleGlobalEnd);
    window.addEventListener("blur", handleGlobalEnd);
    window.addEventListener("visibilitychange", handleGlobalEnd);

    return () => {
      window.removeEventListener("pointerup", handleGlobalEnd);
      window.removeEventListener("pointercancel", handleGlobalEnd);
      window.removeEventListener("blur", handleGlobalEnd);
      window.removeEventListener("visibilitychange", handleGlobalEnd);
    };
  }, [resetStick]);

  return (
    <div className="touch-analog-container">
      <div
        ref={baseRef}
        className="touch-analog-base"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
      >
        <div className={`analog-dir dir-up ${activeDirs.up ? "active" : ""}`}>▲</div>
        <div className={`analog-dir dir-down ${activeDirs.down ? "active" : ""}`}>▼</div>
        <div className={`analog-dir dir-left ${activeDirs.left ? "active" : ""}`}>◀</div>
        <div className={`analog-dir dir-right ${activeDirs.right ? "active" : ""}`}>▶</div>
        <div
          ref={knobRef}
          className={`touch-analog-knob ${isDragging ? "dragging" : "resetting"}`}
        />
      </div>
    </div>
  );
}

export default function DinoGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [started, setStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCoinFever, setIsCoinFever] = useState(false);
  const [message, setMessage] = useState("");
  const [levelMessage, setLevelMessage] = useState("");
  const [hitMessage, setHitMessage] = useState("");
  const [hudCollected, setHudCollected] = useState(0);
  const [hudTotal, setHudTotal] = useState(0);
  const [portalActive, setPortalActive] = useState(false);
  const [hudLives, setHudLives] = useState(1);
  const [activeBadges, setActiveBadges] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [roarCdPct, setRoarCdPct] = useState(0);
  const [slamCdPct, setSlamCdPct] = useState(0);
  const [rampageEnergy, setRampageEnergy] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [overlayTab, setOverlayTab] = useState("skin");
  const [difficulty, setDifficulty] = useState("normal");
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 900 || window.matchMedia("(pointer: coarse)").matches;
      const isPort = window.innerHeight > window.innerWidth;
      const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
      setIsPortraitMobile(isMobile && isPort);
      setIsTouchDevice(hasTouch);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const requestLandscape = async () => {
    const isMobile = window.innerWidth <= 900 || window.matchMedia("(pointer: coarse)").matches;
    if (!isMobile) return;
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
      }
      if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
        await window.screen.orientation.lock("landscape").catch(() => {});
      }
    } catch (_) {}
  };

  const [coins, setCoins] = useState(() => loadJSON(COINS_KEY, 0));
  const [upgrades, setUpgrades] = useState(() =>
    loadJSON(UPGRADES_KEY, { speed: 0, shield: 0, magnet: 0, roar: 0 })
  );

  const [highScores, setHighScores] = useState(() =>
    loadJSON(HIGHSCORE_KEY, { best: 0, bestLevel: 0 })
  );
  const [unlockedAchievements, setUnlockedAchievements] = useState(() =>
    loadJSON(ACHIEVEMENT_KEY, [])
  );
  const [unlockedSkins, setUnlockedSkins] = useState(() =>
    loadJSON(SKIN_KEY, Object.keys(DINO_SKINS))
  );
  const [selectedSkin, setSelectedSkin] = useState("classic");
  const [achievementToast, setAchievementToast] = useState("");

  const keyboardKeysRef = useRef({ up: false, down: false, left: false, right: false });
  const mobileButtonKeysRef = useRef({ up: false, down: false, left: false, right: false });
  const analogKeysRef = useRef({ up: false, down: false, left: false, right: false });
  const keysRef = useRef({ up: false, down: false, left: false, right: false });

  const updateCombinedKeys = useCallback(() => {
    const kb = keyboardKeysRef.current;
    const mb = mobileButtonKeysRef.current;
    const an = analogKeysRef.current;
    keysRef.current.up = kb.up || mb.up || an.up;
    keysRef.current.down = kb.down || mb.down || an.down;
    keysRef.current.left = kb.left || mb.left || an.left;
    keysRef.current.right = kb.right || mb.right || an.right;
  }, []);

  const handleAnalogUpdate = useCallback((dirs) => {
    analogKeysRef.current = dirs;
    updateCombinedKeys();
  }, [updateCombinedKeys]);
  const levelMsgTimeoutRef = useRef(null);
  const hitMsgTimeoutRef = useRef(null);
  const badgeIntervalRef = useRef(null);
  const achievementToastTimeoutRef = useRef(null);

  const stateRef = useRef({
    dino: { x: DINO_START.x, y: DINO_START.y, w: DINO_SIZE, h: DINO_SIZE, dir: "right" },
    obstacles: [],
    fireflies: [],
    predators: [],
    bossFireballs: [],
    powerups: [],
    particles: [],
    ambientParticles: [],
    floatingTexts: [],
    stars: [],
    clouds: [],
    shootingStars: [],
    moonPhase: 0,
    collected: 0,
    level: 1,
    portalActive: false,
    lives: 1,
    invulnerableUntil: 0,
    roarCooldownUntil: 0,
    slamCooldownUntil: 0,
    rampageUntil: 0,
    rampageEnergy: 0,
    roarEffect: null,
    slamEffect: null,
    lastHappyUntil: 0,
    comboCount: 0,
    lastCollectTime: 0,
    lastFireballTime: 0,
    timeLeft: 60,
    isCoinFever: false,
    feverEndTime: 0,
    effects: {
      shield: false,
      speedUntil: 0,
      freezeUntil: 0,
      radarUntil: 0,
      revealBoostUntil: 0,
      doubleScoreUntil: 0,
    },
    levelStartTime: 0,
    hitsTakenThisRun: 0,
    powerupsCollectedThisRun: 0,
    unlockedAchievementsThisRun: [],
  });

  const diffCfg = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.normal;

  const buyUpgrade = (item) => {
    const curLvl = upgrades[item.id] || 0;
    if (curLvl >= item.maxLvl) return;
    if (coins < item.cost) {
      showHit("Coin tidak cukup!");
      return;
    }
    const newCoins = coins - item.cost;
    const newUpgrades = { ...upgrades, [item.id]: curLvl + 1 };
    setCoins(newCoins);
    setUpgrades(newUpgrades);
    saveJSON(COINS_KEY, newCoins);
    saveJSON(UPGRADES_KEY, newUpgrades);
    playSound("powerup", soundEnabled);
    showHit(`${item.name} ditingkatkan ke Lv. ${curLvl + 1}!`);
  };

  const getSafePosition = (w, h, maxX, maxY, anchor) => {
    let x, y, dist, portalDist;
    let attempts = 0;
    do {
      x = Math.random() * (maxX - w);
      y = Math.random() * (maxY - h);
      const cx = x + w / 2;
      const cy = y + h / 2;
      const dx = cx - (anchor.x + DINO_SIZE / 2);
      const dy = cy - (anchor.y + DINO_SIZE / 2);
      dist = Math.sqrt(dx * dx + dy * dy);
      portalDist = distToRect(cx, cy, {
        x: PORTAL.x - 20,
        y: PORTAL.y - 20,
        w: PORTAL.w + 40,
        h: PORTAL.h + 40,
      });
      attempts++;
    } while ((dist < SAFE_RADIUS || portalDist < 30) && attempts < 50);
    return { x, y };
  };

  const getFireflyPosition = (anchor, obstacles) => {
    let x, y, ok;
    let attempts = 0;
    do {
      const pos = getSafePosition(20, 20, CANVAS_W - 10, CANVAS_H - 10, anchor);
      x = pos.x + 10;
      y = pos.y + 10;
      ok = obstacles.every((o) => distToRect(x, y, o) >= FIREFLY_OBSTACLE_GAP);
      attempts++;
    } while (!ok && attempts < 60);
    return { x, y };
  };

  const getPowerupPosition = (anchor, obstacles, fireflies) => {
    let x, y, ok;
    let attempts = 0;
    do {
      const pos = getSafePosition(20, 20, CANVAS_W - 10, CANVAS_H - 10, anchor);
      x = pos.x + 10;
      y = pos.y + 10;
      const okObstacle = obstacles.every((o) => distToRect(x, y, o) >= POWERUP_GAP);
      const okFirefly = fireflies.every(
        (f) => Math.hypot(f.x - x, f.y - y) >= POWERUP_GAP
      );
      ok = okObstacle && okFirefly;
      attempts++;
    } while (!ok && attempts < 60);
    return { x, y };
  };

  const spawnParticles = (x, y, color, count = 14) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 28 + Math.random() * 18,
        maxLife: 46,
        color,
        size: Math.random() * 3 + 2,
      });
    }
  };

  const spawnFloatingText = (x, y, text, color = "#ffd54f", fontSize = 13) => {
    const s = stateRef.current;
    s.floatingTexts.push({
      x,
      y,
      text,
      color,
      fontSize,
      life: 38,
      maxLife: 38,
      vy: -1.2,
    });
  };

  const spawnDashTrail = (fromX, fromY, toX, toY, color) => {
    const s = stateRef.current;
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = fromX + (toX - fromX) * t;
      const y = fromY + (toY - fromY) * t;
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 16 + Math.random() * 10,
        maxLife: 26,
        color,
        size: Math.random() * 4 + 3,
      });
    }
  };

  const showHit = (text) => {
    setHitMessage(text);
    clearTimeout(hitMsgTimeoutRef.current);
    hitMsgTimeoutRef.current = setTimeout(() => setHitMessage(""), 1200);
  };

  const showAchievementToast = (text) => {
    setAchievementToast(text);
    clearTimeout(achievementToastTimeoutRef.current);
    achievementToastTimeoutRef.current = setTimeout(
      () => setAchievementToast(""),
      2200
    );
  };

  const unlockAchievement = (id) => {
    const s = stateRef.current;
    if (s.unlockedAchievementsThisRun.includes(id)) return;
    s.unlockedAchievementsThisRun.push(id);

    setUnlockedAchievements((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveJSON(ACHIEVEMENT_KEY, next);
      return next;
    });

    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) showAchievementToast(`Achievement: ${def.name}!`);

    const skinEntry = Object.entries(DINO_SKINS).find(
      ([, skin]) => skin.unlockCondition === id
    );
    if (skinEntry) {
      const skinId = skinEntry[0];
      setUnlockedSkins((prev) => {
        if (prev.includes(skinId)) return prev;
        const next = [...prev, skinId];
        saveJSON(SKIN_KEY, next);
        return next;
      });
    }
  };

  const checkPowerupMasterAchievement = () => {
    const s = stateRef.current;
    if (s.powerupsCollectedThisRun >= 15) {
      unlockAchievement("powerup_master");
    }
  };

  const updateHighScore = (finalScore) => {
    setHighScores((prev) => {
      if (finalScore <= prev.best) return prev;
      const next = { best: finalScore, bestLevel: stateRef.current.level };
      saveJSON(HIGHSCORE_KEY, next);
      return next;
    });
  };

  // --- RAMPAGE SUPER DINO TRANSFORMATION ---
  const triggerRampage = () => {
    const s = stateRef.current;
    const now = Date.now();
    if (!started || gameOver || isPaused) return;
    if (s.rampageEnergy < 100) {
      showHit("Gauge Super belum penuh! (Kumpulkan Kunang-kunang)");
      return;
    }

    s.rampageEnergy = 0;
    setRampageEnergy(0);
    s.rampageUntil = now + RAMPAGE_DURATION_MS;
    s.invulnerableUntil = now + RAMPAGE_DURATION_MS;
    playSound("rampage", soundEnabled);
    showHit("🔥 SUPER GIGA DINO! Memangsa seluruh predator!");

    const cx = s.dino.x + s.dino.w / 2;
    const cy = s.dino.y + s.dino.h / 2;
    for (let i = 0; i < 40; i++) {
      spawnParticles(cx, cy, "#ffd54f", 20);
    }
  };

  const triggerRoar = () => {
    const s = stateRef.current;
    const now = Date.now();
    if (!started || gameOver || isPaused) return;
    if (now < s.roarCooldownUntil) return;

    const roarUpgradeBonus = (upgrades.roar || 0) * 1500;
    const actualCd = Math.max(3000, diffCfg.roarCd - roarUpgradeBonus);
    s.roarCooldownUntil = now + actualCd;
    playSound("roar", soundEnabled);
    showHit("📢 AUMAN T-REX! Predator terdorong!");

    const cx = s.dino.x + s.dino.w / 2;
    const cy = s.dino.y + s.dino.h / 2;
    s.roarEffect = { x: cx, y: cy, radius: 10, maxRadius: 210, startTime: now };

    s.effects.freezeUntil = Math.max(s.effects.freezeUntil, now + 1600);
    s.predators.forEach((p) => {
      const dx = p.x + p.w / 2 - cx;
      const dy = p.y + p.h / 2 - cy;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 240) {
        const pushForce = 150 * (1 - dist / 240);
        p.x += (dx / dist) * pushForce;
        p.y += (dy / dist) * pushForce;
        p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));
        p.y = Math.max(0, Math.min(CANVAS_H - p.h, p.y));
      }
    });

    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const speed = Math.random() * 3 + 3;
      s.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25,
        maxLife: 25,
        color: "#fff59d",
        size: Math.random() * 4 + 3,
      });
    }
  };

  const triggerSlam = () => {
    const s = stateRef.current;
    const now = Date.now();
    if (!started || gameOver || isPaused) return;
    if (now < s.slamCooldownUntil) return;

    s.slamCooldownUntil = now + SLAM_COOLDOWN_MS;
    playSound("slam", soundEnabled);
    showHit("💥 GROUND SLAM! Kaktus sekitar hancur!");

    const cx = s.dino.x + s.dino.w / 2;
    const cy = s.dino.y + s.dino.h / 2;
    s.slamEffect = { x: cx, y: cy, radius: 15, maxRadius: 180, startTime: now };

    s.obstacles = s.obstacles.filter((o) => {
      const ox = o.x + o.w / 2;
      const oy = o.y + o.h / 2;
      const dist = Math.hypot(ox - cx, oy - cy);
      if (dist < 170) {
        spawnParticles(ox, oy, "#3f8f4f", 16);
        return false;
      }
      return true;
    });

    s.effects.freezeUntil = Math.max(s.effects.freezeUntil, now + 2500);
    s.predators.forEach((p) => {
      const dx = p.x + p.w / 2 - cx;
      const dy = p.y + p.h / 2 - cy;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 200) {
        p.x += (dx / dist) * 100;
        p.y += (dy / dist) * 100;
        p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));
        p.y = Math.max(0, Math.min(CANVAS_H - p.h, p.y));
      }
    });

    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      s.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 28,
        maxLife: 28,
        color: "#ab47bc",
        size: Math.random() * 4 + 2,
      });
    }
  };

  const startCoinFever = () => {
    const s = stateRef.current;
    s.isCoinFever = true;
    setIsCoinFever(true);
    s.feverEndTime = Date.now() + 15000;
    s.obstacles = [];
    s.predators = [];
    s.bossFireballs = [];
    s.fireflies = [];
    showHit("🌟 COIN FEVER! Hujan kunang-kunang meluncur!");

    // Spawn initial rain
    for (let i = 0; i < 18; i++) {
      s.fireflies.push({
        x: Math.random() * CANVAS_W,
        y: -Math.random() * CANVAS_H,
        vy: 2.2 + Math.random() * 1.5,
        r: 6,
        collected: false,
        fake: false,
        dangerLevel: 0,
      });
    }
    setStarted(true);
    setGameOver(false);
    setIsPaused(false);
  };

  const buildObstacles = (lvl, cfg, anchor) => {
    const obstacles = [];
    for (let i = 0; i < cfg.obstacles; i++) {
      const pos = getSafePosition(32, 42, CANVAS_W, CANVAS_H, anchor);
      const sway = lvl >= 3 && i % 2 === 0;
      const type = i % 3;
      const hasFlower = i % 2 === 0;
      const flowerColor = hasFlower
        ? i % 4 === 0
          ? "#ff2a6d"
          : i % 4 === 2
          ? "#ffb703"
          : "#05dda1"
        : null;

      obstacles.push({
        x: pos.x,
        y: pos.y,
        baseX: pos.x,
        w: 32,
        h: 42,
        type,
        sway,
        hasFlower,
        flowerColor,
        swayAmp: sway ? 10 + Math.random() * 14 : 0,
        swaySpeed: sway ? 0.015 + Math.random() * 0.02 : 0,
        swayPhase: Math.random() * Math.PI * 2,
      });
    }
    return obstacles;
  };

  const buildPredators = (lvl, cfg, anchor) => {
    const predators = [];
    const baseSpeed = cfg.predatorSpeed * diffCfg.speedMult;
    for (let i = 0; i < cfg.predators; i++) {
      const pos = getSafePosition(32, 32, CANVAS_W, CANVAS_H, anchor);
      predators.push({
        x: pos.x,
        y: pos.y,
        w: 32,
        h: 32,
        vx: Math.random() < 0.5 ? baseSpeed : -baseSpeed,
        vy: Math.random() < 0.5 ? baseSpeed : -baseSpeed,
        isBoss: false,
      });
    }
    if (lvl === MAX_LEVEL) {
      const pos = getSafePosition(60, 60, CANVAS_W, CANVAS_H, anchor);
      predators.push({
        x: pos.x,
        y: pos.y,
        w: 60,
        h: 60,
        vx: 0,
        vy: 0,
        isBoss: true,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    return predators;
  };

  const buildAmbientParticles = (lvl) => {
    const amb = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      amb.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        vx: (Math.random() - 0.5) * (lvl === 5 ? 2.5 : 0.8),
        vy: lvl === 4 ? -Math.random() * 1.2 - 0.4 : (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2.5 + 1,
        color:
          lvl === 1
            ? "rgba(255, 245, 157, 0.4)"
            : lvl === 2
            ? "rgba(179, 136, 255, 0.5)"
            : lvl === 3
            ? "rgba(128, 222, 234, 0.6)"
            : lvl === 4
            ? "rgba(255, 112, 67, 0.65)"
            : "rgba(233, 30, 99, 0.7)",
      });
    }
    return amb;
  };

  const generateMap = (lvl, anchor, keepLives) => {
    const s = stateRef.current;
    s.portalActive = false;
    setPortalActive(false);
    s.dino = { x: DINO_START.x, y: DINO_START.y, w: DINO_SIZE, h: DINO_SIZE, dir: "right" };
    const cfg = LEVEL_CONFIG[lvl - 1];

    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        r: Math.random() * 1.5 + 0.5,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    const clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * CANVAS_W,
        y: 20 + Math.random() * 120,
        speed: 0.15 + Math.random() * 0.25,
        w: 90 + Math.random() * 60,
        h: 30 + Math.random() * 20,
      });
    }

    const obstacles = buildObstacles(lvl, cfg, anchor);

    const fireflies = [];
    for (let i = 0; i < cfg.real; i++) {
      const pos = getFireflyPosition(anchor, obstacles);
      fireflies.push({ x: pos.x, y: pos.y, r: 6, collected: false, fake: false, dangerLevel: 0 });
    }
    for (let i = 0; i < cfg.fake; i++) {
      const pos = getFireflyPosition(anchor, obstacles);
      fireflies.push({ x: pos.x, y: pos.y, r: 6, collected: false, fake: true, dangerLevel: 0 });
    }

    const predators = buildPredators(lvl, cfg, anchor);

    const powerups = [];
    if (lvl >= 2) {
      const chosen = shuffle(POWERUP_TYPES).slice(0, 2);
      chosen.forEach((type) => {
        const pos = getPowerupPosition(anchor, obstacles, fireflies);
        powerups.push({ x: pos.x, y: pos.y, typeId: type.id, collected: false });
      });
    }

    s.stars = stars;
    s.clouds = clouds;
    s.shootingStars = [];
    s.ambientParticles = buildAmbientParticles(lvl);
    s.floatingTexts = [];
    s.obstacles = obstacles;
    s.fireflies = fireflies;
    s.predators = predators;
    s.bossFireballs = [];
    s.powerups = powerups;
    s.particles = [];
    s.moonPhase = 0;
    s.collected = 0;
    s.comboCount = 0;
    s.lastCollectTime = 0;
    s.lastFireballTime = 0;
    s.timeLeft = 60;
    s.isCoinFever = false;
    setIsCoinFever(false);
    s.roarEffect = null;
    s.slamEffect = null;
    s.levelStartTime = Date.now();
    s.effects = {
      shield: false,
      speedUntil: 0,
      freezeUntil: 0,
      radarUntil: 0,
      revealBoostUntil: 0,
      doubleScoreUntil: 0,
    };
    if (!keepLives) {
      s.lives = diffCfg.startLives;
      s.rampageUntil = 0;
      s.rampageEnergy = 0;
      setRampageEnergy(0);
    }
    setHudLives(s.lives);
    setTimeRemaining(60);
    setPortalActive(false);
    setHudCollected(0);
    setHudTotal(cfg.real);
  };

  const startGame = () => {
    requestLandscape();
    keyboardKeysRef.current = { up: false, down: false, left: false, right: false };
    mobileButtonKeysRef.current = { up: false, down: false, left: false, right: false };
    analogKeysRef.current = { up: false, down: false, left: false, right: false };
    keysRef.current = { up: false, down: false, left: false, right: false };
    const s = stateRef.current;
    s.dino = { x: DINO_START.x, y: DINO_START.y, w: DINO_SIZE, h: DINO_SIZE, dir: "right" };
    s.level = 1;
    s.hitsTakenThisRun = 0;
    s.powerupsCollectedThisRun = 0;
    s.unlockedAchievementsThisRun = [];
    setLevel(1);
    generateMap(1, DINO_START, false);
    setScore(0);
    setGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    setMessage("");
    setLevelMessage("");
    setHitMessage("");
    setStarted(true);
  };

  const enterPortal = (s) => {
    playSound("victory", soundEnabled);
    if (Date.now() - s.levelStartTime < SPEED_ACHIEVEMENT_MS) {
      unlockAchievement("speed_collector");
    }

    if (s.level >= MAX_LEVEL) {
      setGameOver(true);
      setIsVictory(true);
      setMessage("Selamat! Kamu menyelesaikan semua 5 level!");
      unlockAchievement("win_game");
      if (s.hitsTakenThisRun === 0) unlockAchievement("no_hit_run");
      updateHighScore(score);
      return;
    }
    s.level += 1;
    setLevel(s.level);
    setLevelMessage(`Level ${s.level}: ${THEME_NAMES[s.level - 1]}!`);
    clearTimeout(levelMsgTimeoutRef.current);
    levelMsgTimeoutRef.current = setTimeout(() => setLevelMessage(""), 2000);
    s.portalActive = false;
    setPortalActive(false);
    s.dino = { x: DINO_START.x, y: DINO_START.y, w: DINO_SIZE, h: DINO_SIZE, dir: "right" };
    generateMap(s.level, DINO_START, true);
  };

  const applyPowerup = (s, typeId) => {
    const now = Date.now();
    const shieldUpgradeBonus = (upgrades.shield || 0) * 2000;
    s.powerupsCollectedThisRun += 1;
    playSound("powerup", soundEnabled);
    checkPowerupMasterAchievement();
    switch (typeId) {
      case "shield":
        s.effects.shield = true;
        showHit("Shield aktif!");
        break;
      case "freeze":
        s.effects.freezeUntil = now + 5000 + shieldUpgradeBonus;
        showHit("Predator dibekukan!");
        break;
      case "speed":
        s.effects.speedUntil = now + 5000 + shieldUpgradeBonus;
        showHit("Speed boost!");
        break;
      case "dash": {
        const dashDist = 95;
        const d = s.dino;
        const fromX = d.x + d.w / 2;
        const fromY = d.y + d.h / 2;
        if (d.dir === "left") d.x -= dashDist;
        else d.x += dashDist;
        d.x = Math.max(0, Math.min(CANVAS_W - d.w, d.x));
        spawnDashTrail(fromX, fromY, d.x + d.w / 2, d.y + d.h / 2, "#ab47bc");
        showHit("Dash!");
        break;
      }
      case "radar":
        s.effects.radarUntil = now + 6000 + shieldUpgradeBonus;
        showHit("Radar kunang-kunang aktif!");
        break;
      case "revealBoost":
        s.effects.revealBoostUntil = now + 6000 + shieldUpgradeBonus;
        showHit("Deteksi jebakan diperluas!");
        break;
      case "repel": {
        const d = s.dino;
        s.predators.forEach((p) => {
          const dx = p.x - d.x;
          const dy = p.y - d.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 200) {
            p.x += (dx / dist) * 120;
            p.y += (dy / dist) * 120;
            p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));
            p.y = Math.max(0, Math.min(CANVAS_H - p.h, p.y));
          }
        });
        showHit("Predator terdorong mundur!");
        break;
      }
      case "doubleScore":
        s.effects.doubleScoreUntil = now + 6000 + shieldUpgradeBonus;
        showHit("Skor 2x aktif!");
        break;
      case "extraLife":
        s.lives += 1;
        setHudLives(s.lives);
        showHit("+1 Nyawa!");
        break;
      default:
        break;
    }
  };

  const registerHit = (s, hitMessageText) => {
    const now = Date.now();
    s.hitsTakenThisRun += 1;
    playSound("hit", soundEnabled);

    if (difficulty === "zen") {
      s.invulnerableUntil = now + INVULN_MS;
      showHit("Latihan Zen: Hit diabaikan!");
      spawnParticles(s.dino.x + s.dino.w / 2, s.dino.y + s.dino.h / 2, "#ab47bc", 14);
      return;
    }

    if (s.effects.shield) {
      s.effects.shield = false;
      s.invulnerableUntil = now + INVULN_MS;
      showHit("Shield melindungi!");
      spawnParticles(s.dino.x + s.dino.w / 2, s.dino.y + s.dino.h / 2, "#42a5f5", 18);
      return;
    }
    if (s.lives > 1) {
      s.lives -= 1;
      setHudLives(s.lives);
      s.invulnerableUntil = now + INVULN_MS;
      showHit("Nyawa berkurang!");
      spawnParticles(s.dino.x + s.dino.w / 2, s.dino.y + s.dino.h / 2, "#ff5252", 18);
      return;
    }
    setGameOver(true);
    setMessage(hitMessageText);
    updateHighScore(score);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case "Escape":
        case "KeyP":
          e.preventDefault();
          if (started && !gameOver) {
            setIsPaused((p) => !p);
          }
          break;
        case "KeyE":
          e.preventDefault();
          triggerRampage();
          break;
        case "KeyQ":
          e.preventDefault();
          triggerSlam();
          break;
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          keyboardKeysRef.current.up = true;
          updateCombinedKeys();
          break;
        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          keyboardKeysRef.current.down = true;
          updateCombinedKeys();
          break;
        case "ArrowLeft":
        case "KeyA":
          e.preventDefault();
          keyboardKeysRef.current.left = true;
          updateCombinedKeys();
          break;
        case "ArrowRight":
        case "KeyD":
          e.preventDefault();
          keyboardKeysRef.current.right = true;
          updateCombinedKeys();
          break;
        case "KeyR":
        case "KeyF":
          e.preventDefault();
          triggerRoar();
          break;
        case "Space":
          e.preventDefault();
          if (document.activeElement && typeof document.activeElement.blur === "function") {
            document.activeElement.blur();
          }
          if (!started || gameOver) startGame();
          break;
        default:
          break;
      }
    };
    const handleKeyUp = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          keyboardKeysRef.current.up = false;
          updateCombinedKeys();
          break;
        case "ArrowDown":
        case "KeyS":
          keyboardKeysRef.current.down = false;
          updateCombinedKeys();
          break;
        case "ArrowLeft":
        case "KeyA":
          keyboardKeysRef.current.left = false;
          updateCombinedKeys();
          break;
        case "ArrowRight":
        case "KeyD":
          keyboardKeysRef.current.right = false;
          updateCombinedKeys();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [started, gameOver, soundEnabled, difficulty, isPaused, upgrades, updateCombinedKeys]);

  const setMobileKey = (key, value) => (e) => {
    if (e && e.cancelable) e.preventDefault();
    mobileButtonKeysRef.current[key] = value;
    updateCombinedKeys();
  };

  useEffect(() => {
    if (!started || gameOver) return;
    badgeIntervalRef.current = setInterval(() => {
      const s = stateRef.current;
      const now = Date.now();
      const badges = [];
      if (now < s.rampageUntil) badges.push("🔥 SUPER GIGA");
      if (s.effects.shield) badges.push("Shield");
      if (now < s.effects.speedUntil) badges.push("Speed");
      if (now < s.effects.freezeUntil) badges.push("Freeze");
      if (now < s.effects.radarUntil) badges.push("Radar");
      if (now < s.effects.revealBoostUntil) badges.push("Reveal+");
      if (now < s.effects.doubleScoreUntil) badges.push("2x Skor");
      setActiveBadges(badges);

      if (s.isCoinFever && now > s.feverEndTime) {
        s.isCoinFever = false;
        setIsCoinFever(false);
        setGameOver(true);
        setIsVictory(true);
        setMessage("🎉 COIN FEVER SELESAI! Hasil Panen Berlimpah!");
      }

      if (difficulty === "timeAttack" && !isPaused && !s.isCoinFever) {
        s.timeLeft -= 0.15;
        const curTime = Math.max(0, Math.ceil(s.timeLeft));
        setTimeRemaining(curTime);
        if (s.timeLeft <= 0) {
          setGameOver(true);
          setMessage("⏱️ WAKTU HABIS! Survival Time Attack Selesai!");
          updateHighScore(score);
        }
      }

      if (s.roarCooldownUntil > now) {
        const remaining = s.roarCooldownUntil - now;
        const roarUpgradeBonus = (upgrades.roar || 0) * 1500;
        const actualCd = Math.max(3000, diffCfg.roarCd - roarUpgradeBonus);
        setRoarCdPct(Math.min(1, remaining / actualCd));
      } else {
        setRoarCdPct(0);
      }

      if (s.slamCooldownUntil > now) {
        const remaining = s.slamCooldownUntil - now;
        setSlamCdPct(Math.min(1, remaining / SLAM_COOLDOWN_MS));
      } else {
        setSlamCdPct(0);
      }
    }, 150);
    return () => clearInterval(badgeIntervalRef.current);
  }, [started, gameOver, difficulty, isPaused, upgrades]);

  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let stepTimer = 0;

    const loop = () => {
      const s = stateRef.current;
      const k = keysRef.current;
      const d = s.dino;
      const now = Date.now();

      if (isPaused) {
        draw(ctx, s, now, false);
        animId = requestAnimationFrame(loop);
        return;
      }

      const isRampage = now < s.rampageUntil;
      const speedUpgradeBonus = 1 + (upgrades.speed || 0) * 0.1;
      const effSpeed = (isRampage ? BASE_SPEED * 1.8 : now < s.effects.speedUntil ? BASE_SPEED * 1.6 : BASE_SPEED) * speedUpgradeBonus;
      const isMoving = k.up || k.down || k.left || k.right;

      let dirX = 0;
      let dirY = 0;
      if (k.left) dirX -= 1;
      if (k.right) dirX += 1;
      if (k.up) dirY -= 1;
      if (k.down) dirY += 1;

      if (dirX !== 0 || dirY !== 0) {
        const len = Math.hypot(dirX, dirY);
        const normX = dirX / len;
        const normY = dirY / len;

        d.x += normX * effSpeed;
        d.y += normY * effSpeed;

        if (dirX < 0) d.dir = "left";
        else if (dirX > 0) d.dir = "right";
      }
      d.x = Math.max(0, Math.min(CANVAS_W - d.w, d.x));
      d.y = Math.max(0, Math.min(CANVAS_H - d.h, d.y));

      if (isMoving) {
        stepTimer++;
        if (stepTimer % 18 === 0) {
          playSound("step", soundEnabled);
        }
        if (Math.random() < 0.35) {
          const footX = d.x + d.w * 0.5;
          const footY = d.y + d.h * 0.95;
          const skinDef = DINO_SKINS[selectedSkin] || DINO_SKINS.classic;

          if (isRampage) {
            s.particles.push({
              x: footX + (Math.random() - 0.5) * 16,
              y: footY,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -Math.random() * 2.2,
              life: 24,
              maxLife: 24,
              color: "#FFD54F",
              size: Math.random() * 5 + 3,
            });
          } else if (skinDef.trail === "gold") {
            s.particles.push({
              x: footX + (Math.random() - 0.5) * 10,
              y: footY + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -Math.random() * 0.8,
              life: 20,
              maxLife: 20,
              color: "#FFD54F",
              size: Math.random() * 3 + 2,
            });
          } else if (skinDef.trail === "fire") {
            s.particles.push({
              x: footX + (Math.random() - 0.5) * 10,
              y: footY,
              vx: (Math.random() - 0.5) * 0.6,
              vy: -Math.random() * 1.5,
              life: 18,
              maxLife: 18,
              color: Math.random() < 0.5 ? "#FF3D00" : "#FFC107",
              size: Math.random() * 3 + 2,
            });
          } else if (skinDef.trail === "cyber") {
            s.particles.push({
              x: footX + (Math.random() - 0.5) * 10,
              y: footY,
              vx: (Math.random() - 0.5) * 0.4,
              vy: (Math.random() - 0.5) * 0.4,
              life: 15,
              maxLife: 15,
              color: "#00E5FF",
              size: Math.random() * 3 + 1,
            });
          } else if (skinDef.trail === "ice") {
            s.particles.push({
              x: footX + (Math.random() - 0.5) * 10,
              y: footY,
              vx: (Math.random() - 0.5) * 0.5,
              vy: Math.random() * 0.5 + 0.2,
              life: 20,
              maxLife: 20,
              color: "#E0F7FA",
              size: Math.random() * 2 + 2,
            });
          } else if (skinDef.trail === "neon") {
            s.particles.push({
              x: footX + (Math.random() - 0.5) * 10,
              y: footY,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
              life: 18,
              maxLife: 18,
              color: Math.random() < 0.5 ? "#FF4081" : "#7C4DFF",
              size: Math.random() * 3 + 2,
            });
          } else {
            s.particles.push({
              x: footX + (Math.random() - 0.5) * 8,
              y: footY,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -Math.random() * 0.6,
              life: 14,
              maxLife: 14,
              color: "rgba(200, 200, 200, 0.4)",
              size: Math.random() * 2 + 2,
            });
          }
        }
      }

      // COIN FEVER RAIN LOGIC
      if (s.isCoinFever) {
        if (Math.random() < 0.35) {
          s.fireflies.push({
            x: Math.random() * CANVAS_W,
            y: -20,
            vy: 2.2 + Math.random() * 2.0,
            r: 6,
            collected: false,
            fake: false,
            dangerLevel: 0,
          });
        }
        s.fireflies.forEach((f) => {
          if (!f.collected && f.vy) {
            f.y += f.vy;
          }
        });
      }

      s.clouds.forEach((cl) => {
        cl.x += cl.speed;
        if (cl.x > CANVAS_W + 100) cl.x = -120;
      });

      if (Math.random() < 0.02) {
        s.shootingStars.push({
          x: Math.random() * CANVAS_W * 0.8,
          y: Math.random() * 100,
          vx: Math.random() * 4 + 4,
          vy: Math.random() * 2 + 2,
          length: Math.random() * 40 + 20,
          life: 25,
          maxLife: 25,
        });
      }
      s.shootingStars.forEach((st) => {
        st.x += st.vx;
        st.y += st.vy;
        st.life -= 1;
      });
      s.shootingStars = s.shootingStars.filter((st) => st.life > 0);

      s.ambientParticles.forEach((ap) => {
        ap.x += ap.vx;
        ap.y += ap.vy;
        if (ap.x < 0) ap.x = CANVAS_W;
        if (ap.x > CANVAS_W) ap.x = 0;
        if (ap.y < 0) ap.y = CANVAS_H;
        if (ap.y > CANVAS_H) ap.y = 0;
      });

      s.floatingTexts.forEach((ft) => {
        ft.y += ft.vy;
        ft.life -= 1;
      });
      s.floatingTexts = s.floatingTexts.filter((ft) => ft.life > 0);

      s.obstacles.forEach((o) => {
        if (o.sway) {
          o.x = o.baseX + Math.sin(now * o.swaySpeed + o.swayPhase) * o.swayAmp;
        }
      });

      // LEVEL 5 BOSS FIREBALL PROYECTILE LOGIC
      if (s.level === MAX_LEVEL && !s.isCoinFever) {
        if (now - s.lastFireballTime > 3400) {
          s.lastFireballTime = now;
          const targetX = d.x + d.w / 2;
          const targetY = d.y + d.h / 2;
          s.bossFireballs.push({
            targetX,
            targetY,
            spawnTime: now,
            landTime: now + 1000,
            exploded: false,
          });
        }
      }

      s.bossFireballs.forEach((fb) => {
        if (!fb.exploded && now >= fb.landTime) {
          fb.exploded = true;
          spawnParticles(fb.targetX, fb.targetY, "#ff3d00", 22);
          const distToDino = Math.hypot(d.x + d.w / 2 - fb.targetX, d.y + d.h / 2 - fb.targetY);
          if (distToDino < 38 && !isRampage && now > s.invulnerableUntil) {
            registerHit(s, "Kena ledakan bola api Boss!");
          }
        }
      });
      s.bossFireballs = s.bossFireballs.filter((fb) => now < fb.landTime + 500);

      const frozen = now < s.effects.freezeUntil;
      if (!frozen) {
        const aggroBoost = (1 + (s.level - 1) * 0.15) * diffCfg.speedMult;
        s.predators.forEach((p) => {
          if (p.isBoss) {
            p.wobble += 0.05;
            const dx = d.x + d.w / 2 - (p.x + p.w / 2);
            const dy = d.y + d.h / 2 - (p.y + p.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const chaseSpeed = 1.6 * aggroBoost;
            const perpX = -dy / dist;
            const perpY = dx / dist;
            const wobbleForce = Math.sin(p.wobble) * 1.8;
            p.x += (dx / dist) * chaseSpeed + perpX * wobbleForce;
            p.y += (dy / dist) * chaseSpeed + perpY * wobbleForce;
            p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));
            p.y = Math.max(0, Math.min(CANVAS_H - p.h, p.y));
            return;
          }
          p.x += p.vx;
          p.y += p.vy;
          if (p.x <= 0 || p.x + p.w >= CANVAS_W) p.vx *= -1;
          if (p.y <= 0 || p.y + p.h >= CANVAS_H) p.vy *= -1;
          p.x = Math.max(0, Math.min(CANVAS_W - p.w, p.x));
          p.y = Math.max(0, Math.min(CANVAS_H - p.h, p.y));
        });
      }

      s.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
      });
      s.particles = s.particles.filter((p) => p.life > 0);

      const invulnerable = now < s.invulnerableUntil || isRampage;
      if (!invulnerable) {
        for (const o of s.obstacles) {
          if (d.x < o.x + o.w && d.x + d.w > o.x && d.y < o.y + o.h && d.y + d.h > o.y) {
            registerHit(s, `Kena kaktus! (Level ${s.level})`);
          }
        }
      }

      // PREDATOR COLLISION (EATEN IN RAMPAGE OR REGISTER HIT)
      s.predators = s.predators.filter((p) => {
        const overlap = d.x < p.x + p.w && d.x + d.w > p.x && d.y < p.y + p.h && d.y + d.h > p.y;
        if (overlap) {
          if (isRampage) {
            // MEMANGSA PREDATOR!
            spawnParticles(p.x + p.w / 2, p.y + p.h / 2, "#ffd54f", 24);
            spawnFloatingText(p.x + p.w / 2, p.y, "+50 MEMANGSA!", "#ffd54f", 14);
            playSound("collect", soundEnabled, 1.4);
            setScore((sc) => sc + 50);
            return false; // Predator dimakan!
          } else if (!invulnerable) {
            registerHit(
              s,
              p.isBoss ? `Ditangkap mini-boss! (Level ${s.level})` : `Ditangkap predator! (Level ${s.level})`
            );
          }
        }
        return true;
      });

      // MAGNET UPGRADE & PET ATTRACTION EFFECT ON FIREFLIES
      const magnetLevel = upgrades.magnet || 0;
      const magnetRadius = 70 + magnetLevel * 30;

      const boostedReveal = now < s.effects.revealBoostUntil ? REVEAL_RADIUS * 1.6 : REVEAL_RADIUS;
      for (const f of s.fireflies) {
        if (f.collected) continue;
        const dx = d.x + d.w / 2 - f.x;
        const dy = d.y + d.h / 2 - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!f.fake && magnetLevel > 0 && dist < magnetRadius && dist > 15) {
          f.x += (dx / dist) * (2.2 + magnetLevel * 0.8);
          f.y += (dy / dist) * (2.2 + magnetLevel * 0.8);
        }

        if (f.fake) {
          if (dist < boostedReveal) {
            const t = 1 - (dist - TOUCH_RADIUS) / (boostedReveal - TOUCH_RADIUS);
            f.dangerLevel = Math.max(0, Math.min(1, t));
          } else {
            f.dangerLevel = 0;
          }
          if (dist < TOUCH_RADIUS && !invulnerable) {
            registerHit(s, `Tertipu! Kunang-kunang itu jebakan! (Level ${s.level})`);
          }
        } else {
          if (dist < 26) {
            f.collected = true;
            s.collected++;
            s.lastHappyUntil = now + 800;

            // ENERGI RAMPAGE FILL UP
            s.rampageEnergy = Math.min(100, s.rampageEnergy + 10);
            setRampageEnergy(s.rampageEnergy);

            if (now - s.lastCollectTime < COMBO_WINDOW_MS) {
              s.comboCount += 1;
            } else {
              s.comboCount = 1;
            }
            s.lastCollectTime = now;

            const pitchMult = 1.0 + Math.min(0.6, (s.comboCount - 1) * 0.12);
            playSound("collect", soundEnabled, pitchMult);

            const baseGain = now < s.effects.doubleScoreUntil ? 20 : 10;
            const gained = Math.round(baseGain * diffCfg.scoreMult * (s.comboCount > 1 ? 1.5 : 1.0));
            spawnParticles(f.x, f.y, "#fff59d", 14);

            const comboLabel = s.comboCount > 1 ? `+${gained} ${s.comboCount}x COMBO!` : `+${gained}`;
            spawnFloatingText(f.x, f.y - 10, comboLabel, s.comboCount > 1 ? "#ffd54f" : "#fff59d", s.comboCount > 1 ? 14 : 12);

            setCoins((c) => {
              const nc = c + 1;
              saveJSON(COINS_KEY, nc);
              return nc;
            });

            if (difficulty === "timeAttack") {
              s.timeLeft = Math.min(99, s.timeLeft + 3);
              spawnFloatingText(f.x + 20, f.y - 20, "+3s Time!", "#ff9800", 13);
            }

            setScore((sc) => sc + gained);
            setHudCollected(s.collected);
          }
        }
      }

      for (const pw of s.powerups) {
        if (pw.collected) continue;
        const dx = d.x + d.w / 2 - pw.x;
        const dy = d.y + d.h / 2 - pw.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 24) {
          pw.collected = true;
          s.lastHappyUntil = now + 1000;
          const type = POWERUP_TYPES.find((t) => t.id === pw.typeId);
          spawnParticles(pw.x, pw.y, type.color, 16);
          spawnFloatingText(pw.x, pw.y - 12, `${type.name}!`, type.color, 13);
          applyPowerup(s, pw.typeId);
        }
      }

      s.moonPhase = Math.floor(s.collected / 3) % 4;
      const totalReal = s.fireflies.filter((f) => !f.fake).length;
      if (totalReal > 0 && s.collected === totalReal && !s.portalActive && !s.isCoinFever) {
        s.portalActive = true;
        setPortalActive(true);

        s.obstacles.forEach((o) => spawnParticles(o.x + o.w / 2, o.y + o.h / 2, "#3f8f4f", 10));
        s.predators.forEach((p) =>
          spawnParticles(p.x + p.w / 2, p.y + p.h / 2, p.isBoss ? "#6d1414" : "#8b1e1e", p.isBoss ? 26 : 14)
        );
        s.obstacles = [];
        s.predators = [];
      }

      if (s.portalActive) {
        const overlap =
          d.x < PORTAL.x + PORTAL.w &&
          d.x + d.w > PORTAL.x &&
          d.y < PORTAL.y + PORTAL.h &&
          d.y + d.h > PORTAL.y;
        if (overlap) {
          spawnParticles(PORTAL.x + PORTAL.w / 2, PORTAL.y + PORTAL.h / 2, "#b388ff", 24);
          enterPortal(s);
        }
      }

      try {
        draw(ctx, s, now, isMoving);
      } catch (err) {
        console.error("Canvas draw error:", err);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [started, gameOver, selectedSkin, soundEnabled, difficulty, isPaused, upgrades]);

  const drawDynamicBackground = (ctx, s, now) => {
    const lvl = s.level;

    if (lvl === 1) {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#2b1055");
      grad.addColorStop(0.5, "#5c2a63");
      grad.addColorStop(1, "#8e44ad");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = "rgba(40, 15, 70, 0.6)";
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H);
      ctx.quadraticCurveTo(200, CANVAS_H - 90, 400, CANVAS_H - 40);
      ctx.quadraticCurveTo(600, CANVAS_H - 100, CANVAS_W, CANVAS_H - 20);
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.fill();
    } else if (lvl === 2) {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#0d1b2a");
      grad.addColorStop(0.6, "#1b263b");
      grad.addColorStop(1, "#415a77");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      const neb = ctx.createRadialGradient(250, 120, 10, 250, 120, 180);
      neb.addColorStop(0, "rgba(123, 44, 191, 0.35)");
      neb.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = neb;
      ctx.beginPath();
      ctx.arc(250, 120, 180, 0, Math.PI * 2);
      ctx.fill();
    } else if (lvl === 3) {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#03071e");
      grad.addColorStop(0.7, "#0f2027");
      grad.addColorStop(1, "#203a43");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.save();
      const aurGrad = ctx.createLinearGradient(0, 40, 0, 220);
      aurGrad.addColorStop(0, "rgba(0, 230, 118, 0.45)");
      aurGrad.addColorStop(0.5, "rgba(0, 229, 255, 0.25)");
      aurGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aurGrad;

      ctx.beginPath();
      ctx.moveTo(0, 100);
      for (let x = 0; x <= CANVAS_W; x += 40) {
        const y = 80 + Math.sin(x * 0.01 + now * 0.0012) * 35 + Math.cos(x * 0.02) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(CANVAS_W, 260);
      ctx.lineTo(0, 260);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (lvl === 4) {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#200005");
      grad.addColorStop(0.5, "#4a0e17");
      grad.addColorStop(1, "#780000");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = "rgba(20, 2, 5, 0.85)";
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_H);
      ctx.lineTo(80, CANVAS_H - 110);
      ctx.lineTo(170, CANVAS_H - 50);
      ctx.lineTo(310, CANVAS_H - 140);
      ctx.lineTo(480, CANVAS_H - 60);
      ctx.lineTo(620, CANVAS_H - 120);
      ctx.lineTo(CANVAS_W, CANVAS_H - 30);
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.fill();
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#02010a");
      grad.addColorStop(0.6, "#08071a");
      grad.addColorStop(1, "#120c2b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.strokeStyle = "rgba(179, 136, 255, 0.15)";
      ctx.lineWidth = 1;
      for (let y = CANVAS_H - 100; y < CANVAS_H; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }
    }

    s.stars.forEach((st) => {
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(now * st.twinkleSpeed + st.twinklePhase));
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    s.clouds.forEach((cl) => {
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, cl.w / 2, cl.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    s.shootingStars.forEach((st) => {
      const grad = ctx.createLinearGradient(st.x, st.y, st.x - st.vx * 5, st.y - st.vy * 5);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(st.x - st.vx * 6, st.y - st.vy * 6);
      ctx.stroke();
    });

    s.ambientParticles.forEach((ap) => {
      ctx.fillStyle = ap.color;
      ctx.beginPath();
      ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawScreenEdgeGlow = (ctx, s, now) => {
    let glowColor = null;
    if (now < s.rampageUntil) glowColor = "rgba(255, 213, 79, 0.4)";
    else if (s.effects.shield) glowColor = "rgba(66, 165, 245, 0.25)";
    else if (now < s.effects.speedUntil) glowColor = "rgba(255, 179, 0, 0.25)";
    else if (now < s.effects.doubleScoreUntil) glowColor = "rgba(255, 213, 79, 0.28)";

    if (glowColor) {
      ctx.save();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }
  };

  const drawShadow = (ctx, x, y, w, radiusX = 18, radiusY = 5) => {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawPet = (ctx, dino, now) => {
    ctx.save();
    const petX = dino.x + (dino.dir === "left" ? dino.w + 14 : -14);
    const petY = dino.y - 18 + Math.sin(now / 150) * 6;
    const wingFlap = Math.sin(now / 70) * 8;

    const aura = ctx.createRadialGradient(petX, petY, 0, petX, petY, 16);
    aura.addColorStop(0, "rgba(0, 229, 255, 0.6)");
    aura.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(petX, petY, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#80d8ff";
    ctx.beginPath();
    ctx.ellipse(petX, petY, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#40c4ff";
    ctx.beginPath();
    ctx.moveTo(petX, petY);
    ctx.lineTo(petX - 10, petY - 8 + wingFlap);
    ctx.lineTo(petX + 2, petY);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(petX, petY);
    ctx.lineTo(petX + 10, petY - 8 + wingFlap);
    ctx.lineTo(petX - 2, petY);
    ctx.fill();

    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(petX + (dino.dir === "left" ? -3 : 3), petY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(petX + (dino.dir === "left" ? -3 : 3), petY - 2, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const draw = (ctx, s, now, isMoving) => {
    drawDynamicBackground(ctx, s, now);
    drawMoon(ctx, CANVAS_W - 70, 55, 26, s.moonPhase, s.level);

    s.obstacles.forEach((o) => {
      drawShadow(ctx, o.x, o.y + o.h - 1, o.w, 14, 4);
      drawCactus(ctx, o.x, o.y, o.w, o.h, o.sway, o.hasFlower, o.flowerColor, o.type, s.level);
    });

    if (s.portalActive) {
      drawPortal(ctx, PORTAL.x, PORTAL.y, PORTAL.w, PORTAL.h, now);
    }

    // DRAW BOSS LAVA FIREBALL WARNINGS & EXPLOSIONS
    s.bossFireballs.forEach((fb) => {
      ctx.save();
      const progress = Math.min(1, (now - fb.spawnTime) / (fb.landTime - fb.spawnTime));

      // Red circle target pulse
      ctx.strokeStyle = `rgba(255, 23, 68, ${0.4 + 0.5 * Math.sin(now / 50)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(fb.targetX, fb.targetY, 32 * progress, 0, Math.PI * 2);
      ctx.stroke();

      // Falling fireball meteor
      if (!fb.exploded) {
        const meteorY = fb.targetY - (1 - progress) * 220;
        ctx.fillStyle = "#ff3d00";
        ctx.beginPath();
        ctx.arc(fb.targetX, meteorY, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    if (s.roarEffect) {
      const rf = s.roarEffect;
      rf.radius += 8;
      const progress = rf.radius / rf.maxRadius;
      if (progress >= 1) {
        s.roarEffect = null;
      } else {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 245, 157, ${1 - progress})`;
        ctx.lineWidth = 5 * (1 - progress);
        ctx.beginPath();
        ctx.arc(rf.x, rf.y, rf.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (s.slamEffect) {
      const sf = s.slamEffect;
      sf.radius += 9;
      const progress = sf.radius / sf.maxRadius;
      if (progress >= 1) {
        s.slamEffect = null;
      } else {
        ctx.save();
        ctx.strokeStyle = `rgba(171, 71, 188, ${1 - progress})`;
        ctx.lineWidth = 6 * (1 - progress);
        ctx.beginPath();
        ctx.arc(sf.x, sf.y, sf.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    const radarOn = now < s.effects.radarUntil;
    s.fireflies.forEach((f) => {
      if (f.collected) return;
      drawFirefly(ctx, f, radarOn, now);
    });

    s.powerups.forEach((pw) => {
      if (pw.collected) return;
      const type = POWERUP_TYPES.find((t) => t.id === pw.typeId);
      drawPowerup(ctx, pw.x, pw.y, type, now);
    });

    s.predators.forEach((p) => {
      drawShadow(ctx, p.x, p.y + p.h - 1, p.w, p.w * 0.45, 5);
      p.isBoss
        ? drawBoss(ctx, p.x, p.y, p.w, p.h, now < s.effects.freezeUntil)
        : drawPredator(ctx, p.x, p.y, p.w, p.h, now < s.effects.freezeUntil);
    });

    s.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const isRampage = now < s.rampageUntil;
    const dinoScale = isRampage ? 1.8 : 1.0;
    const dw = s.dino.w * dinoScale;
    const dh = s.dino.h * dinoScale;
    const dx = s.dino.x - (dw - s.dino.w) / 2;
    const dy = s.dino.y - (dh - s.dino.h);

    drawShadow(ctx, s.dino.x, s.dino.y + s.dino.h - 1, dw, 20 * dinoScale, 6);

    const invulnerable = now < s.invulnerableUntil || isRampage;
    ctx.save();
    if (invulnerable && !isRampage) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(now / 80);
    if (s.effects.shield) {
      const cx = s.dino.x + s.dino.w / 2;
      const cy = s.dino.y + s.dino.h / 2;
      ctx.strokeStyle = "rgba(66,165,245,0.85)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 32 * dinoScale, 0, Math.PI * 2);
      ctx.stroke();
    }

    const skin = isRampage
      ? { body: "#FFD54F", dark: "#7A5200", belly: "#FFF59D", hat: "crown", trail: "gold" }
      : DINO_SKINS[selectedSkin] || DINO_SKINS.classic;

    let expression = "normal";
    if (invulnerable) expression = "shocked";
    else if (now < s.lastHappyUntil || s.portalActive) expression = "happy";

    drawTRex(ctx, dx, dy, dw, dh, skin, s.dino.dir, isMoving, now, expression, s.fireflies);
    drawPet(ctx, s.dino, now);
    ctx.restore();

    s.floatingTexts.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    drawScreenEdgeGlow(ctx, s, now);
  };

  const drawMoon = (ctx, x, y, r, phase, lvl) => {
    ctx.save();
    const moonGlow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
    const moonColor = lvl === 4 ? "rgba(255, 23, 68, 0.4)" : "rgba(255, 245, 157, 0.35)";
    moonGlow.addColorStop(0, moonColor);
    moonGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lvl === 4 ? "#ff5252" : "#f5f3ce";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0b0e23";
    ctx.beginPath();
    if (phase === 1) {
      ctx.arc(x - r * 0.6, y, r, 0, Math.PI * 2);
    } else if (phase === 2) {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else if (phase === 3) {
      ctx.arc(x + r * 0.6, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  };

  const drawTRex = (ctx, x, y, w, h, skin, dir, isMoving, now, expression, fireflies = []) => {
    ctx.save();

    if (dir === "left") {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }

    const walkCycle = isMoving ? Math.sin(now / 70) : 0;
    const breathY = isMoving ? Math.abs(Math.sin(now / 70)) * 2 : Math.sin(now / 350) * 1.5;
    const tailWag = Math.sin(now / 120) * (isMoving ? 8 : 4);

    const bodyColor = skin.body || "#4CAF50";
    const darkColor = skin.dark || "#1B5E20";
    const bellyColor = skin.belly || "#A5D6A7";

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    const tailStartX = x + w * 0.25;
    const tailStartY = y + h * 0.4 + breathY;
    ctx.moveTo(tailStartX, tailStartY);
    ctx.quadraticCurveTo(
      x - w * 0.15,
      tailStartY - 5 + tailWag,
      x - w * 0.3,
      tailStartY + 4 + tailWag * 1.2
    );
    ctx.quadraticCurveTo(
      x - w * 0.1,
      tailStartY + 14 + tailWag,
      tailStartX + 5,
      tailStartY + 18
    );
    ctx.closePath();
    ctx.fill();

    const spikeColor =
      skin.trail === "fire"
        ? "#FF9100"
        : skin.trail === "ice"
        ? "#80DEEA"
        : skin.trail === "cyber"
        ? "#00E5FF"
        : skin.trail === "gold"
        ? "#FFD54F"
        : darkColor;

    for (let i = 0; i < 4; i++) {
      const spX = x + w * (0.15 + i * 0.12);
      const spY = y + h * (0.28 - (i === 1 || i === 2 ? 0.05 : 0)) + breathY;
      ctx.fillStyle = spikeColor;
      ctx.beginPath();
      ctx.moveTo(spX - 3, spY);
      ctx.lineTo(spX, spY - (skin.hat === "flameHorns" || skin.hat === "iceHorns" ? 9 : 6));
      ctx.lineTo(spX + 4, spY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    drawRoundRect(ctx, x + w * 0.18, y + h * 0.25 + breathY, w * 0.52, h * 0.46, [12, 16, 12, 10]);
    ctx.fill();

    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.48, y + h * 0.5 + breathY, w * 0.18, h * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    const leftLegAngle = walkCycle * 0.4;
    const rightLegAngle = -walkCycle * 0.4;

    ctx.fillStyle = darkColor;
    ctx.save();
    ctx.translate(x + w * 0.32, y + h * 0.65 + breathY);
    ctx.rotate(leftLegAngle);
    ctx.fillRect(-4, 0, 8, h * 0.28);
    ctx.fillRect(-2, h * 0.26, 10, 5);
    ctx.restore();

    ctx.fillStyle = bodyColor;
    ctx.save();
    ctx.translate(x + w * 0.52, y + h * 0.65 + breathY);
    ctx.rotate(rightLegAngle);
    ctx.fillRect(-5, 0, 10, h * 0.3);
    ctx.fillRect(-3, h * 0.28, 12, 6);
    ctx.restore();

    ctx.fillStyle = "#FFF";
    ctx.fillRect(x + w * 0.58 + rightLegAngle * 5, y + h * 0.92 + breathY, 3, 3);

    const armWiggle = Math.sin(now / 100) * 3;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.62, y + h * 0.42 + breathY);
    ctx.lineTo(x + w * 0.74, y + h * 0.46 + breathY + armWiggle);
    ctx.lineTo(x + w * 0.72, y + h * 0.5 + breathY + armWiggle);
    ctx.lineTo(x + w * 0.6, y + h * 0.46 + breathY);
    ctx.closePath();
    ctx.fill();

    const jawOpen = isMoving ? Math.abs(Math.sin(now / 150)) * 4 : 0;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    drawRoundRect(ctx, x + w * 0.42, y + h * 0.05 + breathY, w * 0.48, h * 0.32, [10, 14, 6, 8]);
    ctx.fill();

    ctx.beginPath();
    drawRoundRect(ctx, x + w * 0.75, y + h * 0.12 + breathY, w * 0.22, h * 0.2, [4, 8, 8, 4]);
    ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.fillRect(x + w * 0.62, y + h * 0.26 + breathY, w * 0.34, 2 + jawOpen);

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.78, y + h * 0.26 + breathY);
    ctx.lineTo(x + w * 0.81, y + h * 0.3 + breathY);
    ctx.lineTo(x + w * 0.84, y + h * 0.26 + breathY);
    ctx.fill();

    const isBlinking = Math.sin(now / 700) > 0.96;
    const eyeX = x + w * 0.68;
    const eyeY = y + h * 0.15 + breathY;

    if (expression === "shocked") {
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (expression === "happy" || isMoving) {
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY + 1, 4, Math.PI, 0);
      ctx.stroke();
    } else if (isBlinking) {
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(eyeX - 4, eyeY);
      ctx.lineTo(eyeX + 4, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
      ctx.fill();

      let pupilOffX = 1;
      let pupilOffY = 0;
      const target = fireflies.find((f) => !f.collected);
      if (target) {
        const dx = target.x - eyeX;
        const dy = target.y - eyeY;
        const ang = Math.atan2(dy, dx);
        pupilOffX = Math.cos(ang) * 1.8;
        pupilOffY = Math.sin(ang) * 1.8;
      }

      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.arc(eyeX + pupilOffX, eyeY + pupilOffY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(eyeX + pupilOffX + 1, eyeY + pupilOffY - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255, 128, 171, 0.65)";
    ctx.beginPath();
    ctx.arc(x + w * 0.62, y + h * 0.22 + breathY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (skin.hat === "headband") {
      ctx.fillStyle = "#FF1744";
      ctx.fillRect(x + w * 0.4, y + h * 0.08 + breathY, w * 0.5, 4);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.4, y + h * 0.08 + breathY);
      ctx.lineTo(x + w * 0.32, y + h * 0.04 + breathY);
      ctx.lineTo(x + w * 0.34, y + h * 0.12 + breathY);
      ctx.fill();
    } else if (skin.hat === "crown") {
      ctx.fillStyle = "#FFD54F";
      ctx.beginPath();
      const crX = x + w * 0.52;
      const crY = y + h * 0.03 + breathY;
      ctx.moveTo(crX, crY);
      ctx.lineTo(crX + 4, crY - 10);
      ctx.lineTo(crX + 10, crY - 4);
      ctx.lineTo(crX + 16, crY - 12);
      ctx.lineTo(crX + 22, crY - 4);
      ctx.lineTo(crX + 28, crY - 10);
      ctx.lineTo(crX + 32, crY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#D50000";
      ctx.beginPath();
      ctx.arc(crX + 16, crY - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (skin.hat === "visor") {
      ctx.fillStyle = "#00E5FF";
      ctx.shadowColor = "#00E5FF";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      drawRoundRect(ctx, x + w * 0.58, y + h * 0.11 + breathY, w * 0.3, 8, 3);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (skin.hat === "flameHorns") {
      ctx.fillStyle = "#FFAB00";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.55, y + h * 0.05 + breathY);
      ctx.quadraticCurveTo(x + w * 0.5, y - 8 + breathY, x + w * 0.42, y - 12 + breathY);
      ctx.quadraticCurveTo(x + w * 0.52, y - 2 + breathY, x + w * 0.62, y + h * 0.05 + breathY);
      ctx.fill();
    } else if (skin.hat === "iceHorns") {
      ctx.fillStyle = "#E0F7FA";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.52, y + h * 0.05 + breathY);
      ctx.lineTo(x + w * 0.48, y - 10 + breathY);
      ctx.lineTo(x + w * 0.58, y + h * 0.02 + breathY);
      ctx.lineTo(x + w * 0.56, y - 14 + breathY);
      ctx.lineTo(x + w * 0.65, y + h * 0.05 + breathY);
      ctx.fill();
    } else if (skin.hat === "sunglasses") {
      ctx.fillStyle = "#111";
      ctx.fillRect(x + w * 0.6, y + h * 0.12 + breathY, w * 0.28, 7);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(x + w * 0.62, y + h * 0.13 + breathY, 6, 2);
    }

    ctx.restore();
  };

  const drawCactus = (ctx, x, y, w, h, sway, hasFlower, flowerColor, type = 0, lvl = 1) => {
    ctx.save();

    const mainGrad = ctx.createLinearGradient(x, y, x + w, y);
    mainGrad.addColorStop(0, sway ? "#2d6a4f" : "#1b4332");
    mainGrad.addColorStop(0.35, sway ? "#52b788" : "#40916c");
    mainGrad.addColorStop(0.8, sway ? "#74c69d" : "#52b788");
    mainGrad.addColorStop(1, sway ? "#1b4332" : "#081c15");

    ctx.fillStyle = mainGrad;

    const trunkX = x + w * 0.35;
    const trunkW = w * 0.3;
    ctx.beginPath();
    drawRoundRect(ctx, trunkX, y, trunkW, h, [8, 8, 3, 3]);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(trunkX + trunkW * 0.3, y + 4);
    ctx.lineTo(trunkX + trunkW * 0.3, y + h - 2);
    ctx.moveTo(trunkX + trunkW * 0.7, y + 4);
    ctx.lineTo(trunkX + trunkW * 0.7, y + h - 2);
    ctx.stroke();

    if (type === 0 || type === 1) {
      const leftArmY = y + h * 0.28;
      ctx.beginPath();
      ctx.moveTo(trunkX, leftArmY + 12);
      ctx.lineTo(x + 4, leftArmY + 12);
      ctx.quadraticCurveTo(x, leftArmY + 12, x, leftArmY + 6);
      ctx.lineTo(x, leftArmY - 4);
      ctx.quadraticCurveTo(x, leftArmY - 10, x + 5, leftArmY - 10);
      ctx.lineTo(x + 9, leftArmY - 10);
      ctx.quadraticCurveTo(x + 13, leftArmY - 10, x + 13, leftArmY - 4);
      ctx.lineTo(x + 13, leftArmY + 4);
      ctx.lineTo(trunkX, leftArmY + 4);
      ctx.closePath();
      ctx.fill();
    }

    if (type === 0 || type === 2) {
      const rightArmY = y + h * 0.42;
      ctx.beginPath();
      ctx.moveTo(trunkX + trunkW, rightArmY + 12);
      ctx.lineTo(x + w - 4, rightArmY + 12);
      ctx.quadraticCurveTo(x + w, rightArmY + 12, x + w, rightArmY + 6);
      ctx.lineTo(x + w, rightArmY - 4);
      ctx.quadraticCurveTo(x + w, rightArmY - 10, x + w - 5, rightArmY - 10);
      ctx.lineTo(x + w - 9, rightArmY - 10);
      ctx.quadraticCurveTo(x + w - 13, rightArmY - 10, x + w - 13, rightArmY - 4);
      ctx.lineTo(x + w - 13, rightArmY + 4);
      ctx.lineTo(trunkX + trunkW, rightArmY + 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let spY = y + 8; spY < y + h - 6; spY += 9) {
      ctx.moveTo(trunkX, spY);
      ctx.lineTo(trunkX - 3, spY - 2);
      ctx.moveTo(trunkX + trunkW, spY);
      ctx.lineTo(trunkX + trunkW + 3, spY - 2);
    }
    ctx.stroke();

    if (hasFlower && flowerColor) {
      const flX = trunkX + trunkW / 2;
      const flY = y - 4;

      ctx.fillStyle = flowerColor;
      for (let p = 0; p < 5; p++) {
        const ang = (p / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(flX + Math.cos(ang) * 4, flY + Math.sin(ang) * 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(flX, flY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawFirefly = (ctx, f, radarOn, now) => {
    const wingFlap = Math.sin(now / 40) * 4;
    const baseColor = f.fake ? lerpColor(f.dangerLevel) : "#fff59d";

    const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14);
    glow.addColorStop(0, baseColor);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.ellipse(f.x - 3, f.y - 3 + wingFlap, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.ellipse(f.x + 3, f.y - 3 - wingFlap, 4, 2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    if (radarOn && !f.fake) {
      ctx.strokeStyle = "#66bb6a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 16, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const drawPredator = (ctx, x, y, w, h, frozen) => {
    ctx.save();
    const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.7);
    glow.addColorStop(0, frozen ? "rgba(128, 222, 234, 0.4)" : "rgba(239, 83, 80, 0.4)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = frozen ? "#4a6b8a" : "#8b1e1e";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = frozen ? "#2f4a63" : "#5c1010";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w * (0.25 + i * 0.25), y);
      ctx.lineTo(x + w * (0.3 + i * 0.25), y - 8);
      ctx.lineTo(x + w * (0.35 + i * 0.25), y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = frozen ? "#b3e5fc" : "#ffeb3b";
    ctx.beginPath();
    ctx.arc(x + w * 0.35, y + h * 0.4, 3, 0, Math.PI * 2);
    ctx.arc(x + w * 0.65, y + h * 0.4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawBoss = (ctx, x, y, w, h, frozen) => {
    ctx.save();
    const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.95);
    glow.addColorStop(0, frozen ? "rgba(74,107,138,0.5)" : "rgba(139,30,30,0.6)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, w * 0.95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = frozen ? "#3a5570" : "#6d1414";
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = frozen ? "#24374a" : "#3d0a0a";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w * (0.12 + i * 0.19), y);
      ctx.lineTo(x + w * (0.19 + i * 0.19), y - 14);
      ctx.lineTo(x + w * (0.26 + i * 0.19), y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = frozen ? "#b3e5fc" : "#ff1744";
    ctx.beginPath();
    ctx.arc(x + w * 0.32, y + h * 0.42, 5, 0, Math.PI * 2);
    ctx.arc(x + w * 0.68, y + h * 0.42, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawPortal = (ctx, x, y, w, h, now) => {
    ctx.save();
    const cx = x + w / 2;
    const cy = y + h / 2;
    const t = now / 300;
    const pulse = 5 + Math.sin(t) * 4;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2 + pulse + 18);
    glow.addColorStop(0, "rgba(179,136,255,0.95)");
    glow.addColorStop(0.5, "rgba(124,77,255,0.5)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, w / 2 + pulse + 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(cx, cy);
    ctx.rotate(t * 0.5);
    ctx.strokeStyle = "#e1bee7";
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.arc(0, 0, w / 2.2, 0, Math.PI * 0.8);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawPowerup = (ctx, x, y, type, now) => {
    const floatY = Math.sin(now / 220) * 4;
    const pulse = 3 + Math.sin(now / 200) * 2;
    const rotation = (now / 500) % (Math.PI * 2);

    ctx.save();
    ctx.translate(x, y + floatY);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 18 + pulse);
    glow.addColorStop(0, type.color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(rotation);
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(9, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#0b0e23";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(type.label, x, y + floatY);
  };

  return (
    <div className="dino-game-wrapper">
      {isPortraitMobile && (
        <div className="portrait-landscape-prompt">
          <div className="portrait-prompt-content">
            <span className="rotate-icon">🔄</span>
            <div className="portrait-prompt-text">
              <strong>Mode Landscape & Fullscreen Disarankan!</strong>
              <span>Putar HP Anda ke mode mendatar (landscape) dan tekan tombol <strong>📱 Fullscreen</strong> di sebelah kanan untuk layar penuh.</span>
            </div>
            <button type="button" className="rotate-lock-btn" onClick={requestLandscape}>
              📱 Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* HEADER HUD BAR */}
      <div className="dino-header-bar">
        <button
          type="button"
          className="sound-toggle-btn"
          onClick={() => setSoundEnabled((v) => !v)}
          title="Toggle Suara Audio"
        >
          {soundEnabled ? "🔊 Sound" : "🔇 Mute"}
        </button>

        {started && !gameOver && (
          <button
            type="button"
            className="settings-toggle-btn"
            onClick={() => setIsPaused((v) => !v)}
            title="Pause & Pengaturan Game (ESC)"
          >
            ⚙️ Settings
          </button>
        )}

        <div className="hud-card mode-card" style={{ borderColor: diffCfg.badgeColor }}>
          <span className="hud-label">Mode</span>
          <span className="hud-val mode-val" style={{ color: diffCfg.badgeColor }}>
            {isCoinFever ? "🌟 Coin Fever" : diffCfg.name}
          </span>
        </div>

        {difficulty === "timeAttack" && !isCoinFever && (
          <div className="hud-card time-card">
            <span className="hud-label">Waktu</span>
            <span className="hud-val time-val">{timeRemaining}s</span>
          </div>
        )}

        <div className="hud-card">
          <span className="hud-label">Skor</span>
          <span className="hud-val score-val">{score}</span>
        </div>

        <div className="hud-card">
          <span className="hud-label">Level</span>
          <span className="hud-val level-val">
            {level}/{MAX_LEVEL}
          </span>
        </div>

        <div className="hud-card">
          <span className="hud-label">Nyawa</span>
          <span className="hud-val lives-val">
            {difficulty === "zen" || isCoinFever ? "♾" : "❤".repeat(hudLives)}
          </span>
        </div>

        <div className="hud-card">
          <span className="hud-label">Kunang</span>
          <span className="hud-val firefly-val">
            {hudCollected}/{hudTotal}
          </span>
        </div>

        <div className="hud-card coin-card">
          <span className="hud-label">Coins</span>
          <span className="hud-val coin-val">🟡 {coins}</span>
        </div>

        <div className="hud-card hiscore-card">
          <span className="hud-label">Rekor</span>
          <span className="hud-val hiscore-val">🏆 {highScores.best}</span>
        </div>
      </div>

      {/* CONTAINER CANVAS ARENA */}
      <div className="canvas-container">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />

        {/* TOMBOL SKILLS FLOATING (E SUPER, Q SLAM, & R ROAR) DI POJOK KANAN BAWAH */}
        {started && !gameOver && (
          <div className="skills-hud-btn-container">
            <button
              type="button"
              className={`skill-hud-btn rampage-btn ${rampageEnergy < 100 ? "disabled" : ""}`}
              onClick={triggerRampage}
              disabled={rampageEnergy < 100}
              title="Super Giga Dino (Tombol E): Memangsa Seluruh Predator!"
            >
              🔥 SUPER (E) {rampageEnergy}%
            </button>
            <button
              type="button"
              className={`skill-hud-btn slam-btn ${slamCdPct > 0 ? "disabled" : ""}`}
              onClick={triggerSlam}
              disabled={slamCdPct > 0}
              title="Ground Slam (Tombol Q): Hancurkan Kaktus!"
            >
              💥 SLAM (Q)
              {slamCdPct > 0 && (
                <span
                  className="roar-cd-overlay"
                  style={{ height: `${slamCdPct * 100}%` }}
                />
              )}
            </button>
            <button
              type="button"
              className={`skill-hud-btn roar-hud-btn ${roarCdPct > 0 ? "disabled" : ""}`}
              onClick={triggerRoar}
              disabled={roarCdPct > 0}
              title="Jurus Auman T-Rex (Tombol R)"
            >
              🦖 ROAR (R)
              {roarCdPct > 0 && (
                <span
                  className="roar-cd-overlay"
                  style={{ height: `${roarCdPct * 100}%` }}
                />
              )}
            </button>
          </div>
        )}

        {activeBadges.length > 0 && (
          <div className="badges-overlay">
            {activeBadges.map((b) => (
              <span key={b} className="badge">
                {b}
              </span>
            ))}
          </div>
        )}

        {levelMessage && <div className="level-toast">{levelMessage}</div>}
        {hitMessage && <div className="hit-toast">{hitMessage}</div>}
        {achievementToast && <div className="achievement-toast">🏆 {achievementToast}</div>}
        {started && !gameOver && portalActive && (
          <div className="portal-toast">Portal terbuka! Masuk ke portal ungu</div>
        )}

        {/* OVERLAY PAUSE / PENGATURAN SAAT GAME BERJALAN */}
        {started && !gameOver && isPaused && (
          <div
            className="dino-overlay pause-overlay"
            onClick={(e) => e.target === e.currentTarget && setIsPaused(false)}
          >
            <div className="overlay-content">
              <div className="overlay-header-compact">
                <h3 className="overlay-title-compact">⚙️ PENGATURAN & PAUSE</h3>
                <span className="hiscore-badge-compact">Tekan <strong>ESC</strong> untuk Lanjut</span>
              </div>

              {/* SKIN PICKER IN PAUSE MENU */}
              <div className="skin-picker-compact" onClick={(e) => e.stopPropagation()}>
                {Object.entries(DINO_SKINS).map(([id, skin]) => {
                  const unlocked = !skin.unlockCondition || unlockedSkins.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={!unlocked}
                      className={`skin-chip ${selectedSkin === id ? "active" : ""}`}
                      onClick={() => unlocked && setSelectedSkin(id)}
                      title={unlocked ? skin.desc : skin.unlockLabel}
                    >
                      <span className="skin-swatch-compact" style={{ background: skin.body, borderColor: skin.dark }} />
                      <span className="skin-name-compact">{unlocked ? skin.name : "🔒 " + skin.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pause-btn-rows" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="start-play-btn" onClick={() => setIsPaused(false)}>
                  ▶ LANJUTKAN GAME (ESC)
                </button>
                <button
                  type="button"
                  className="pause-action-btn restart-btn"
                  onClick={() => {
                    setIsPaused(false);
                    generateMap(level, { x: DINO_START.x, y: DINO_START.y }, true);
                  }}
                >
                  🔄 ULANG LEVEL
                </button>
                <button
                  type="button"
                  className="pause-action-btn quit-btn"
                  onClick={() => {
                    setIsPaused(false);
                    setStarted(false);
                    setGameOver(false);
                  }}
                >
                  🏠 MENU UTAMA
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OVERLAY MENU UTAMA */}
        {!started && !gameOver && (
          <div
            className="dino-overlay"
            onClick={(e) => e.target === e.currentTarget && startGame()}
          >
            <div className="overlay-content">
              <div className="overlay-header-compact">
                <h3 className="overlay-title-compact">🦖 T-Rex Night Mode</h3>
                <span className="hiscore-badge-compact">🟡 Coins: <strong>{coins}</strong> | Rekor: <strong>{highScores.best}</strong></span>
              </div>

              {/* SELECTOR MODE KESULITAN / DIFFICULTY */}
              <div className="difficulty-picker-compact" onClick={(e) => e.stopPropagation()}>
                <span className="diff-picker-label">MODE:</span>
                <div className="diff-btn-group">
                  {Object.values(DIFFICULTY_CONFIGS).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`diff-btn ${difficulty === d.id ? "active" : ""}`}
                      style={{
                        borderColor: difficulty === d.id ? d.badgeColor : "rgba(255,255,255,0.2)",
                        background: difficulty === d.id ? `${d.badgeColor}22` : "transparent",
                      }}
                      onClick={() => setDifficulty(d.id)}
                      title={d.desc}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB SWITCHER COMPACT */}
              <div className="overlay-tabs" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={`tab-btn ${overlayTab === "skin" ? "active" : ""}`}
                  onClick={() => setOverlayTab("skin")}
                >
                  🎨 Skin Dino
                </button>
                <button
                  type="button"
                  className={`tab-btn ${overlayTab === "shop" ? "active" : ""}`}
                  onClick={() => setOverlayTab("shop")}
                >
                  🛒 Toko Upgrade
                </button>
                <button
                  type="button"
                  className={`tab-btn ${overlayTab === "info" ? "active" : ""}`}
                  onClick={() => setOverlayTab("info")}
                >
                  📜 Cara Main
                </button>
                <button
                  type="button"
                  className={`tab-btn ${overlayTab === "achieve" ? "active" : ""}`}
                  onClick={() => setOverlayTab("achieve")}
                >
                  🏆 Achievement
                </button>
              </div>

              {/* TAB CONTENT: SKIN PICKER */}
              {overlayTab === "skin" && (
                <div className="skin-picker-compact" onClick={(e) => e.stopPropagation()}>
                  {Object.entries(DINO_SKINS).map(([id, skin]) => {
                    const unlocked =
                      !skin.unlockCondition || unlockedSkins.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={!unlocked}
                        className={`skin-chip ${selectedSkin === id ? "active" : ""}`}
                        onClick={() => unlocked && setSelectedSkin(id)}
                        title={unlocked ? skin.desc : skin.unlockLabel}
                      >
                        <span
                          className="skin-swatch-compact"
                          style={{ background: skin.body, borderColor: skin.dark }}
                        />
                        <span className="skin-name-compact">
                          {unlocked ? skin.name : "🔒 " + skin.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TAB CONTENT: TOKO UPGRADE */}
              {overlayTab === "shop" && (
                <div className="shop-grid-compact" onClick={(e) => e.stopPropagation()}>
                  {SHOP_ITEMS.map((item) => {
                    const lvl = upgrades[item.id] || 0;
                    const isMax = lvl >= item.maxLvl;
                    return (
                      <div key={item.id} className="shop-item-card">
                        <div className="shop-item-info">
                          <span className="shop-item-title">{item.name}</span>
                          <span className="shop-item-desc">{item.desc}</span>
                        </div>
                        <button
                          type="button"
                          disabled={isMax || coins < item.cost}
                          className="shop-buy-btn"
                          onClick={() => buyUpgrade(item)}
                        >
                          {isMax ? "MAX" : `🟡 ${item.cost} (Lv.${lvl})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB CONTENT: CARA MAIN */}
              {overlayTab === "info" && (
                <div className="tab-panel-compact" onClick={(e) => e.stopPropagation()}>
                  <p className="compact-info-text">
                    • <strong>Super Giga (E):</strong> 100% energi = berubah jadi Super Dino & memangsa predator!<br />
                    • <strong>Jurus Q (Slam):</strong> Menghancurkan kaktus di sekitar dino!<br />
                    • <strong>Jurus R (Roar):</strong> Gelombang pendorong predator!<br />
                    • <strong>Lava Fireball Boss:</strong> Level 5 Boss menembakkan bola api yang harus dihindari!
                  </p>
                </div>
              )}

              {/* TAB CONTENT: ACHIEVEMENT */}
              {overlayTab === "achieve" && (
                <div className="achievement-list-compact" onClick={(e) => e.stopPropagation()}>
                  {ACHIEVEMENTS.map((a) => (
                    <div
                      key={a.id}
                      className={`achievement-row-compact ${
                        unlockedAchievements.includes(a.id) ? "done" : ""
                      }`}
                    >
                      <span>{unlockedAchievements.includes(a.id) ? "🏆" : "🔒"} <strong>{a.name}</strong></span>
                      <span className="achieve-desc-compact">{a.desc}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="overlay-start-box" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button type="button" className="start-play-btn" onClick={startGame}>
                  ▶ MAIN MODE {diffCfg.name.toUpperCase()} (SPASI)
                </button>
                <button type="button" className="fever-btn" onClick={startCoinFever}>
                  🌟 BONUS COIN FEVER (15s)
                </button>
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className={`dino-overlay ${isVictory ? "victory" : ""}`} onClick={startGame}>
            <div className="overlay-content compact-gameover">
              <h2 className="overlay-title-compact">
                {isVictory ? "🎉 KEMENANGAN TOTAL! 🎉" : "💥 GAME OVER 💥"}
              </h2>
              <p className="gameover-desc">{message}</p>
              <p className="gameover-score">
                Skor akhir: <strong>{score}</strong> — Rekor: <strong>{highScores.best}</strong>
              </p>
              <button type="button" className="start-play-btn" onClick={startGame}>
                🔄 MAIN LAGI (SPASI)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTROLLER ANALOG & BUTTONS UNTUK PENGGUNA MOBILE */}
      {started && !gameOver && isTouchDevice && (
        <>
          <TouchAnalog onAnalogUpdate={handleAnalogUpdate} />

          <div className="mobile-action-container">
            {/* ROW SKILLS */}
            <div className="mobile-skills-row">
              <button
                type="button"
                className={`mobile-skill-btn rampage ${rampageEnergy < 100 ? "disabled" : ""}`}
                onClick={triggerRampage}
                disabled={rampageEnergy < 100}
              >
                🔥 SUPER {rampageEnergy}%
              </button>
              <button
                type="button"
                className={`mobile-skill-btn slam ${slamCdPct > 0 ? "disabled" : ""}`}
                onClick={triggerSlam}
                disabled={slamCdPct > 0}
              >
                💥 SLAM
                {slamCdPct > 0 && (
                  <span className="mobile-cd-bar" style={{ height: `${slamCdPct * 100}%` }} />
                )}
              </button>
              <button
                type="button"
                className={`mobile-skill-btn roar ${roarCdPct > 0 ? "disabled" : ""}`}
                onClick={triggerRoar}
                disabled={roarCdPct > 0}
              >
                📢 REX
                {roarCdPct > 0 && (
                  <span className="mobile-cd-bar" style={{ height: `${roarCdPct * 100}%` }} />
                )}
              </button>
            </div>

            {/* ROW TOMBOL UTAMA */}
            <div className="mobile-main-actions-row">
              <button
                type="button"
                className="mobile-action-btn mobile-btn-duck"
                onPointerDown={setMobileKey("down", true)}
                onPointerUp={setMobileKey("down", false)}
                onPointerLeave={setMobileKey("down", false)}
                onPointerCancel={setMobileKey("down", false)}
              >
                ▼
                <span className="mobile-btn-label">TUNDUK</span>
              </button>
              <button
                type="button"
                className="mobile-action-btn mobile-btn-jump"
                onPointerDown={setMobileKey("up", true)}
                onPointerUp={setMobileKey("up", false)}
                onPointerLeave={setMobileKey("up", false)}
                onPointerCancel={setMobileKey("up", false)}
              >
                ▲
                <span className="mobile-btn-label">LONCAT</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}