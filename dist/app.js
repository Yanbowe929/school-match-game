const TILE_TYPES = [
  { id: "drawer", name: "抽屉杂物", pos: "0% 0%" },
  { id: "calculator", name: "胶带计算器", pos: "33.333% 0%" },
  { id: "glasses", name: "裂眼镜", pos: "66.666% 0%" },
  { id: "eraser", name: "黑板擦", pos: "100% 0%" },
  { id: "apple", name: "虫洞苹果", pos: "0% 50%" },
  { id: "banana", name: "香蕉皮", pos: "33.333% 50%" },
  { id: "stapler", name: "坏订书机", pos: "66.666% 50%" },
  { id: "paper", name: "撕破纸页", pos: "100% 50%" },
  { id: "paint", name: "挤爆颜料", pos: "0% 100%" },
  { id: "cassette", name: "旧磁带", pos: "33.333% 100%" },
  { id: "key", name: "柜门钥匙", pos: "66.666% 100%" },
  { id: "slip", name: "揉皱罚单", pos: "100% 100%" },
];

const LEVELS = [
  { triples: 6, layers: 1, cols: 5, rows: 4, density: 0.35, name: "摸底" },
  {
    triples: 15,
    layers: 3,
    cols: 9,
    rows: 8,
    density: 0.5,
    spacingBoostX: 1.22,
    spacingBoostY: 1.28,
    minSpacingX: 1.25,
    minSpacingY: 1.32,
    layerSpread: 1.55,
    layerFan: 0.38,
    viewMinX: 0.25,
    viewMinY: -0.15,
    viewWidth: 7.35,
    viewHeight: 7.55,
    name: "整蛊",
  },
  {
    triples: 64,
    layers: 7,
    cols: 14,
    rows: 19,
    density: 0.82,
    quotaCurve: "pyramid",
    quotaTaper: 0.64,
    spacingBoostX: 1.12,
    spacingBoostY: 1.34,
    minSpacingX: 1.82,
    minSpacingY: 2,
    layerSpread: 2.65,
    layerFan: 1.05,
    viewMinX: -0.2,
    viewMinY: 1.1,
    viewWidth: 14.5,
    viewHeight: 16.7,
    boardMapXScale: 78,
    boardMapXOffset: 4,
    boardMapYScale: 82,
    boardMapYOffset: 4,
    timeLimit: 240,
    timeBonus: 15,
    hardLayouts: ["islands", "snake", "sandwich", "lockbox"],
    name: "地狱巡查",
  },
];

const TRAY_LIMIT = 7;
const STASH_LIMIT = 3;
const STORAGE_KEY = "school-match-progress-v1";
const SETTINGS_KEY = "school-match-settings-v1";
const BGM_SOURCE = "./assets/bgm-school-prank-v2.wav";
const DEFAULT_BGM_VOLUME = 0.28;
const SYNTH_BGM_MAX_VOLUME = 0.16;
const TILE_SPRITE_COLUMNS = 4;
const TILE_SPRITE_ROWS = 3;
const TILE_ICON_ZOOM = 1.3;
const MUSIC_BPM = 112;
const MUSIC_STEP_SECONDS = 60 / MUSIC_BPM / 2;
const MUSIC_LOOKAHEAD_SECONDS = 0.7;
const TIMER_TICK_MS = 200;
const TILE_FLIGHT_MS = 620;
const MATCH_ANIMATION_MS = 760;
const BOARD_MAP_X_SCALE = 76;
const BOARD_MAP_X_OFFSET = 9;
const BOARD_MAP_Y_SCALE = 74;
const BOARD_MAP_Y_OFFSET = 11;
const MUSIC_PATTERN = [
  { bass: 146.83, lead: 293.66, tap: 1 },
  { lead: 349.23 },
  { lead: 329.63, tap: 0.6 },
  { bell: 880 },
  { bass: 130.81, lead: 293.66, tap: 1 },
  { lead: 277.18 },
  { lead: 349.23, tap: 0.7 },
  { bell: 783.99 },
  { bass: 116.54, lead: 311.13, tap: 1 },
  { lead: 293.66 },
  { lead: 277.18, tap: 0.6 },
  { bell: 698.46 },
  { bass: 110, lead: 261.63, tap: 1 },
  { lead: 329.63 },
  { lead: 311.13, tap: 0.7 },
  { bell: 440 },
];

const els = {
  startScreen: document.querySelector("#startScreen"),
  gameScreen: document.querySelector("#gameScreen"),
  resultScreen: document.querySelector("#resultScreen"),
  startButton: document.querySelector("#startButton"),
  levelSelect: document.querySelector("#levelSelect"),
  dailyBadge: document.querySelector("#dailyBadge"),
  homeButton: document.querySelector("#homeButton"),
  soundButton: document.querySelector("#soundButton"),
  volumeSlider: document.querySelector("#volumeSlider"),
  restartButton: document.querySelector("#restartButton"),
  levelLabel: document.querySelector("#levelLabel"),
  board: document.querySelector("#board"),
  boardWrap: document.querySelector(".board-wrap"),
  stashShelf: document.querySelector("#stashShelf"),
  tray: document.querySelector("#tray"),
  progressBar: document.querySelector("#progressBar"),
  remainingLabel: document.querySelector("#remainingLabel"),
  scoreLabel: document.querySelector("#scoreLabel"),
  movePill: document.querySelector("#movePill"),
  moveLabel: document.querySelector("#moveLabel"),
  moveUnitLabel: document.querySelector("#moveUnitLabel"),
  shuffleButton: document.querySelector("#shuffleButton"),
  stashButton: document.querySelector("#stashButton"),
  magnetButton: document.querySelector("#magnetButton"),
  toast: document.querySelector("#toast"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultStars: document.querySelector("#resultStars"),
  resultStamp: document.querySelector("#resultStamp"),
  resultText: document.querySelector("#resultText"),
  resultScore: document.querySelector("#resultScore"),
  resultMoves: document.querySelector("#resultMoves"),
  resultRestartButton: document.querySelector("#resultRestartButton"),
  nextButton: document.querySelector("#nextButton"),
};

const dailyKey = getDailyKey();
let progress = loadProgress();
let settings = loadSettings();
let selectedLevelIndex = Math.min(progress.unlockedLevel, LEVELS.length - 1);
let toastTimer = 0;
let audioContext = null;
let bgmAudio = null;
let bgmFadeTimer = 0;
let audioUnlocked = false;
let lastTrayIds = [];
let levelTimer = 0;
let lastTimerTick = 0;
let musicState = {
  gain: null,
  timer: 0,
  nextStepTime: 0,
  step: 0,
  noiseBuffer: null,
};

let state = {
  levelIndex: 0,
  tiles: [],
  tray: [],
  stashed: [],
  total: 0,
  toolUses: {
    shuffle: 2,
    stash: 1,
    magnet: 2,
  },
  score: 0,
  moves: 0,
  timeLimit: 0,
  timeLeft: 0,
  timeBonus: 0,
  failReason: "",
  combo: 0,
  matchingIds: [],
  arrivingIds: [],
  pendingPickIds: [],
  flightCount: 0,
  animatingMatch: false,
  lastResultWon: false,
  finished: false,
};

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (saved.dailyKey !== dailyKey) return createDefaultProgress();
    return {
      dailyKey,
      unlockedLevel: Math.max(0, Math.min(LEVELS.length - 1, Number(saved.unlockedLevel ?? 0))),
      bestScores: normalizeScoreList(saved.bestScores),
      bestStars: normalizeStarList(saved.bestStars),
    };
  } catch {
    return createDefaultProgress();
  }
}

function saveProgress(nextProgress) {
  const current = progress ?? createDefaultProgress();
  progress = {
    dailyKey,
    unlockedLevel: Math.max(0, Math.min(LEVELS.length - 1, Number(nextProgress.unlockedLevel ?? current.unlockedLevel))),
    bestScores: normalizeScoreList(nextProgress.bestScores ?? current.bestScores),
    bestStars: normalizeStarList(nextProgress.bestStars ?? current.bestStars),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function createDefaultProgress() {
  return {
    dailyKey,
    unlockedLevel: 0,
    bestScores: Array(LEVELS.length).fill(0),
    bestStars: Array(LEVELS.length).fill(0),
  };
}

function normalizeScoreList(list) {
  return LEVELS.map((_, index) => Math.max(0, Number(Array.isArray(list) ? list[index] ?? 0 : 0)));
}

function normalizeStarList(list) {
  return LEVELS.map((_, index) => Math.max(0, Math.min(3, Number(Array.isArray(list) ? list[index] ?? 0 : 0))));
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
    return {
      sound: saved.sound !== false,
      bgmVolume: clamp(Number(saved.bgmVolume ?? DEFAULT_BGM_VOLUME), 0, 1),
    };
  } catch {
    return { sound: true, bgmVolume: DEFAULT_BGM_VOLUME };
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getDailyKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDailyRng(levelIndex) {
  return mulberry32(hashString(`${dailyKey}:level:${levelIndex + 1}`));
}

function getDailyLayout(level, levelIndex) {
  if (!level.hardLayouts?.length) return null;
  const dayNumber = Math.floor(new Date(`${dailyKey}T00:00:00`).getTime() / 86400000);
  return level.hardLayouts[(dayNumber + levelIndex) % level.hardLayouts.length];
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function unlockNextLevel() {
  const nextUnlocked = Math.min(LEVELS.length - 1, state.levelIndex + 1);
  if (nextUnlocked > progress.unlockedLevel) {
    saveProgress({ unlockedLevel: nextUnlocked });
  }
}

function showScreen(name) {
  if (name !== "game") stopLevelTimer();
  [els.startScreen, els.gameScreen, els.resultScreen].forEach((screen) => {
    screen.classList.remove("is-active");
  });

  if (name === "start") {
    renderLevelSelect();
    els.startScreen.classList.add("is-active");
  }
  if (name === "game") els.gameScreen.classList.add("is-active");
  if (name === "result") els.resultScreen.classList.add("is-active");
  syncBgm(name);
}

function renderLevelSelect() {
  progress = loadProgress();
  selectedLevelIndex = Math.min(selectedLevelIndex, progress.unlockedLevel);
  els.levelSelect.innerHTML = "";
  els.dailyBadge.textContent = `${dailyKey} 每日 3 关`;

  LEVELS.forEach((level, index) => {
    const button = document.createElement("button");
    const locked = index > progress.unlockedLevel;
    const bestStars = progress.bestStars[index] ?? 0;
    button.className = "level-option";
    button.classList.toggle("is-selected", index === selectedLevelIndex);
    button.type = "button";
    button.disabled = locked;
    button.innerHTML = `<span>第 ${index + 1} 关</span><em>${level.name}</em><span class="level-stars">${locked ? "未解锁" : renderStars(bestStars)}</span>`;
    button.setAttribute("aria-pressed", String(index === selectedLevelIndex));
    button.addEventListener("click", () => {
      selectedLevelIndex = index;
      renderLevelSelect();
    });
    els.levelSelect.appendChild(button);
  });

  els.startButton.textContent = `挑战第 ${selectedLevelIndex + 1} 关`;
}

function startGame(levelIndex = 0) {
  stopLevelTimer();
  const level = LEVELS[levelIndex] ?? LEVELS[LEVELS.length - 1];
  state = {
    levelIndex,
    tiles: createLevel(levelIndex),
    tray: [],
    stashed: [],
    total: 0,
    toolUses: {
      shuffle: 2,
      stash: 1,
      magnet: 2,
    },
    score: 0,
    moves: 0,
    timeLimit: level.timeLimit ?? 0,
    timeLeft: level.timeLimit ?? 0,
    timeBonus: level.timeBonus ?? 0,
    failReason: "",
    combo: 0,
    matchingIds: [],
    arrivingIds: [],
    pendingPickIds: [],
    flightCount: 0,
    animatingMatch: false,
    lastResultWon: false,
    finished: false,
  };
  state.total = state.tiles.length;
  lastTrayIds = [];
  selectedLevelIndex = levelIndex;
  els.levelLabel.textContent = String(levelIndex + 1);
  els.gameScreen.dataset.level = String(levelIndex + 1);
  els.gameScreen.classList.remove("is-failed");
  hideToast();
  showScreen("game");
  render();
  startLevelTimer();
}

function createLevel(levelIndex) {
  const level = LEVELS[levelIndex] ?? LEVELS[LEVELS.length - 1];
  const rng = createDailyRng(levelIndex);
  const typePool = TILE_TYPES.slice(0, Math.min(TILE_TYPES.length, Math.max(6, level.triples)));
  const bag = [];

  for (let i = 0; i < level.triples; i += 1) {
    const type = typePool[i % typePool.length].id;
    bag.push(type, type, type);
  }

  shuffleArray(bag, rng);

  const layout = getDailyLayout(level, levelIndex);
  const selected = layout
    ? createHardLayoutSpots(level, bag.length, rng, layout)
    : createClusteredSpots(level, bag.length, rng);

  return selected.map((spot, index) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`,
    type: bag[index],
    ...spot,
    removed: false,
  }));
}

function createClusteredSpots(level, count, rng) {
  const spots = [];
  const centerX = (level.cols - 1) / 2;
  const centerY = (level.rows - 1) / 2;
  const quotas = createLayerQuotas(count, level.layers, level);

  quotas.forEach((quota, z) => {
    const cols = Math.max(3, Math.ceil(Math.sqrt(quota * 1.35)));
    const rows = Math.max(3, Math.ceil(quota / cols));
    const layerT = level.layers <= 1 ? 0 : z / (level.layers - 1);
    const boundsScaleX = (level.cols + level.layers * 0.45) / 8.4;
    const boundsScaleY = (level.rows + level.layers * 0.45) / 8.4;
    const spacingX = Math.max(level.minSpacingX ?? 0.78, (0.98 - layerT * 0.14) * boundsScaleX * (level.spacingBoostX ?? 1));
    const spacingY = Math.max(level.minSpacingY ?? 0.78, (0.94 - layerT * 0.12) * boundsScaleY * (level.spacingBoostY ?? 1));
    const layerSpread = level.layerSpread ?? 1;
    const layerFan = level.layerFan ?? 0;
    const layerShiftX = ((z - (level.layers - 1) / 2) * 0.12 + ((z % 3) - 1) * 0.18) * layerSpread
      + Math.sin((z + 1) * 1.7) * layerFan;
    const layerShiftY = ((z - (level.layers - 1) / 2) * 0.1 + (((z + 1) % 3) - 1) * 0.16) * layerSpread
      + Math.cos((z + 1) * 1.35) * layerFan * 0.72;
    const candidates = [];

    for (let y = 0; y < rows + 2; y += 1) {
      for (let x = 0; x < cols + 2; x += 1) {
        const dx = (x - (cols + 1) / 2) * spacingX;
        const dy = (y - (rows + 1) / 2) * spacingY;
        const edgeNoise = rng() * 0.22;
        candidates.push({
          x: clamp(centerX + dx + layerShiftX, 0.2, level.cols + level.layers * 0.28),
          y: clamp(centerY + dy + layerShiftY, 0.2, level.rows + level.layers * 0.28),
          z,
          jitterX: (rng() - 0.5) * 0.11,
          jitterY: (rng() - 0.5) * 0.11,
          order: Math.hypot(dx, dy) + edgeNoise,
        });
      }
    }

    candidates
      .sort((a, b) => a.order - b.order)
      .slice(0, quota)
      .forEach(({ order, ...spot }) => spots.push(spot));
  });

  return spots.sort((a, b) => a.z - b.z || getTileStackRank(a) - getTileStackRank(b));
}

function createHardLayoutSpots(level, count, rng, layout) {
  const quotas = createLayerQuotas(count, level.layers, level);
  const spots = [];

  quotas.forEach((quota, z) => {
    const candidates = [];
    const needed = quota * 18 + 160;

    for (let i = 0; i < needed; i += 1) {
      candidates.push(createHardLayoutCandidate(level, layout, z, i, rng));
    }

    const spacing = getHardLayoutMinSpacing(layout, z, level);
    const selected = selectReadableCandidates(candidates, quota, spacing);
    relaxReadableLayer(selected, spacing * 0.96, level);
    selected
      .forEach(({ order, ...spot }) => spots.push(spot));
  });

  return spots.sort((a, b) => a.z - b.z || getTileStackRank(a) - getTileStackRank(b));
}

function selectReadableCandidates(candidates, quota, minSpacing) {
  const ordered = [...candidates].sort((a, b) => a.order - b.order);
  const spacingSteps = [minSpacing, minSpacing * 0.9, minSpacing * 0.78, minSpacing * 0.64, 0];
  const selected = [];
  const selectedSet = new Set();

  for (const spacing of spacingSteps) {
    const minDistanceSq = spacing * spacing;

    for (const candidate of ordered) {
      if (selected.length >= quota) break;
      if (selectedSet.has(candidate)) continue;
      if (spacing > 0 && selected.some((spot) => {
        const dx = spot.x + spot.jitterX - candidate.x - candidate.jitterX;
        const dy = spot.y + spot.jitterY - candidate.y - candidate.jitterY;
        return dx * dx + dy * dy < minDistanceSq;
      })) {
        continue;
      }
      selected.push(candidate);
      selectedSet.add(candidate);
    }

    if (selected.length >= quota) return selected;
  }

  return selected.slice(0, quota);
}

function getHardLayoutMinSpacing(layout, z, level) {
  const layerT = level.layers <= 1 ? 0 : z / (level.layers - 1);
  const base = {
    islands: 2.22,
    snake: 2.28,
    sandwich: 2.24,
    lockbox: 2.42,
  }[layout] ?? 2.08;
  return base - layerT * 0.14;
}

function relaxReadableLayer(spots, minSpacing, level) {
  const minDistanceSq = minSpacing * minSpacing;
  const maxX = level.cols + level.layers * 0.28;
  const maxY = level.rows + level.layers * 0.28;

  for (let pass = 0; pass < 5; pass += 1) {
    for (let i = 0; i < spots.length; i += 1) {
      for (let j = i + 1; j < spots.length; j += 1) {
        const a = spots[i];
        const b = spots[j];
        let dx = (a.x + a.jitterX) - (b.x + b.jitterX);
        let dy = (a.y + a.jitterY) - (b.y + b.jitterY);
        let distanceSq = dx * dx + dy * dy;

        if (distanceSq >= minDistanceSq) continue;
        if (distanceSq < 0.0001) {
          dx = ((i % 3) - 1) * 0.18 || 0.18;
          dy = ((j % 3) - 1) * 0.18 || -0.18;
          distanceSq = dx * dx + dy * dy;
        }

        const distance = Math.sqrt(distanceSq);
        const push = (minSpacing - distance) * 0.24;
        const nx = dx / distance;
        const ny = dy / distance;
        a.x = clamp(a.x + nx * push, 0.2, maxX);
        a.y = clamp(a.y + ny * push, 0.2, maxY);
        b.x = clamp(b.x - nx * push, 0.2, maxX);
        b.y = clamp(b.y - ny * push, 0.2, maxY);
      }
    }
  }
}

function createHardLayoutCandidate(level, layout, z, index, rng) {
  const layerT = level.layers <= 1 ? 0 : z / (level.layers - 1);
  const layerShiftX = ((z % 3) - 1) * 0.44 + Math.sin((z + 1) * 1.31) * 0.36 + (layerT - 0.5) * 0.28;
  const layerShiftY = (((z + 1) % 3) - 1) * 0.38 + Math.cos((z + 1) * 1.17) * 0.3 + (0.5 - layerT) * 0.22;
  const jitterX = (rng() - 0.5) * 0.12;
  const jitterY = (rng() - 0.5) * 0.12;

  if (layout === "islands") return createIslandCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY);
  if (layout === "snake") return createSnakeCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY);
  if (layout === "sandwich") return createSandwichCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY);
  return createLockboxCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY);
}

function createIslandCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY) {
  const centers = [
    { x: 3.35, y: 4.85, sx: -1, sy: -1 },
    { x: 10.35, y: 4.95, sx: 1, sy: -1 },
    { x: 3.65, y: 12.75, sx: -1, sy: 1 },
    { x: 10.45, y: 12.85, sx: 1, sy: 1 },
  ];
  const islandIndex = (index + z) % centers.length;
  const center = centers[islandIndex];
  const local = Math.floor(index / centers.length);
  const cols = 6;
  const lx = local % cols;
  const ly = Math.floor(local / cols);
  const midLayer = (level.layers - 1) / 2;
  const layerDriftX = (z - midLayer) * 0.24 * center.sx + ((z % 3) - 1) * 0.42;
  const layerDriftY = (z - midLayer) * 0.2 * center.sy + (((z + 1) % 3) - 1) * 0.36;
  const dx = (lx - (cols - 1) / 2) * (1.9 - layerT * 0.08) + layerDriftX;
  const dy = (ly - 3.6) * (1.7 - layerT * 0.06) + layerDriftY;
  const stagger = ((lx + ly + z + islandIndex) % 2) * 0.16;
  return {
    x: clamp(center.x + dx + layerShiftX * 0.48, 0.2, level.cols + level.layers * 0.28),
    y: clamp(center.y + dy + layerShiftY * 0.52, 0.2, level.rows + level.layers * 0.28),
    z,
    jitterX,
    jitterY,
    order: Math.hypot(dx * 0.94, dy * 1.04) + stagger + rng() * 0.34 + ((index + z) % 4) * 0.04,
  };
}

function createSnakeCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY) {
  const laneCount = 7;
  const lane = (index % laneCount) - Math.floor(laneCount / 2);
  const segment = Math.floor(index / laneCount);
  const t = ((segment * 0.089 + z * 0.063 + rng() * 0.018) % 1 + 1) % 1;
  const corridorPhase = t * Math.PI * 2.5 + z * 0.36;
  const layerDrift = (z - (level.layers - 1) / 2) * 0.18;
  const y = 1.85 + t * 15.35 + lane * 0.1 * Math.cos(corridorPhase);
  const x = 7
    + Math.sin(corridorPhase) * 3.95
    + lane * (0.84 + layerT * 0.08)
    + Math.cos(t * Math.PI * 5.1 + z) * 0.28
    + layerDrift;
  return {
    x: clamp(x + layerShiftX * 1.08, 0.2, level.cols + level.layers * 0.28),
    y: clamp(y + layerShiftY * 0.95, 0.2, level.rows + level.layers * 0.28),
    z,
    jitterX,
    jitterY,
    order: rng() * 0.72 + Math.abs(lane) * 0.025 + (segment % 5) * 0.035 + (z % 2) * 0.03,
  };
}

function createSandwichCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY) {
  const zones = [
    { y: 3.95, height: 3.7, weight: 0 },
    { y: 9.2, height: 2.7, weight: z > 2 ? -0.04 : 0.08 },
    { y: 14.25, height: 3.65, weight: 0.02 },
  ];
  const zoneIndex = (index + (z > 3 ? 1 : 0)) % zones.length;
  const zone = zones[zoneIndex];
  const local = Math.floor(index / zones.length);
  const cols = 11;
  const lx = local % cols;
  const ly = Math.floor(local / cols);
  const bridge = z >= 4 ? Math.sin((lx + z) * 0.9) * 1.05 : Math.sin((ly + z) * 0.7) * 0.28;
  const layerWindow = ((z + zoneIndex) % 3 - 1) * 0.34;
  const dx = (lx - 5) * (1.18 - layerT * 0.05) + layerWindow;
  const dy = (ly - 2.9) * (zone.height / 4.55) + ((z % 2) ? 0.24 : -0.24);
  const windowGap = ((lx + zoneIndex + z) % 5 === 0 ? 0.22 : 0);
  return {
    x: clamp(7 + dx + bridge + layerShiftX * 0.9, 0.2, level.cols + level.layers * 0.28),
    y: clamp(zone.y + dy + layerShiftY * 1.05, 0.2, level.rows + level.layers * 0.28),
    z,
    jitterX,
    jitterY,
    order: rng() * 0.68 + Math.abs(dx) * 0.025 + Math.abs(dy) * 0.05 + zone.weight + windowGap,
  };
}

function createLockboxCandidate(level, z, index, rng, layerT, layerShiftX, layerShiftY, jitterX, jitterY) {
  const centerX = 7.05;
  const centerY = 9.45;
  const side = (index + (z % 2)) % 4;
  const local = Math.floor(index / 4);
  const offset = ((local % 10) - 4.5) * (1.3 - layerT * 0.06);
  const depth = Math.floor(local / 9);
  const inset = depth * 0.78 + (z > 3 ? 0.42 : 0);
  const layerPeelX = (z - (level.layers - 1) / 2) * 0.16;
  const layerPeelY = (z - (level.layers - 1) / 2) * -0.14;
  let x = centerX;
  let y = centerY;

  if (side === 0) {
    x = centerX + offset;
    y = centerY - 5.75 + inset;
  } else if (side === 1) {
    x = centerX + 5.25 - inset;
    y = centerY + offset * 1.02;
  } else if (side === 2) {
    x = centerX - offset;
    y = centerY + 5.75 - inset;
  } else {
    x = centerX - 5.25 + inset;
    y = centerY - offset * 1.02;
  }

  if (z <= 2 && index % 6 === 0) {
    x = centerX + ((local % 5) - 2) * 1.05;
    y = centerY + ((Math.floor(local / 5) % 4) - 1.5) * 1.05;
  }

  return {
    x: clamp(x + layerShiftX * 1.08 + layerPeelX, 0.2, level.cols + level.layers * 0.28),
    y: clamp(y + layerShiftY * 1.08 + layerPeelY, 0.2, level.rows + level.layers * 0.28),
    z,
    jitterX,
    jitterY,
    order: rng() * 0.72 + depth * 0.045 + (z <= 2 && index % 6 === 0 ? -0.08 : 0) + (local % 3) * 0.035,
  };
}

function createLayerQuotas(count, layers, level = {}) {
  const weights = Array.from({ length: layers }, (_, z) => {
    if (level.quotaCurve === "pyramid") {
      const reverseT = layers <= 1 ? 0 : 1 - z / (layers - 1);
      return 0.8 + reverseT * (level.quotaTaper ?? 0.85);
    }
    return 1 + (layers - z - 1) * 0.04;
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const quotas = weights.map((weight) => Math.floor((count * weight) / totalWeight));
  let remaining = count - quotas.reduce((sum, quota) => sum + quota, 0);
  let index = Math.max(0, Math.floor(layers * 0.45));

  while (remaining > 0) {
    quotas[index % layers] += 1;
    index += 1;
    remaining -= 1;
  }

  return quotas;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function render() {
  renderBoard();
  renderStash();
  renderTray();
  updateStatus();
  updateTools();
}

function renderBoard() {
  const existingTiles = new Map(
    [...els.board.querySelectorAll(".tile[data-tile-id]")].map((node) => [node.dataset.tileId, node]),
  );
  const freeIds = getFreeTileIds();
  const bounds = getBoardBounds();
  const activeTiles = state.tiles
    .filter((tile) => !tile.removed)
    .sort((a, b) => a.z - b.z);
  const activeIds = new Set(activeTiles.map((tile) => tile.id));
  const queuedIds = new Set(state.pendingPickIds);

  existingTiles.forEach((node, id) => {
    if (!activeIds.has(id)) node.remove();
  });

  activeTiles.forEach((tile) => {
    const node = existingTiles.get(tile.id) ?? createTileNode(tile);
    const { x, y } = getTileBoardPosition(tile, bounds);
    const isFree = freeIds.has(tile.id);
    const disabled = !isFree || state.finished || state.animatingMatch;

    syncTileArtwork(node, tile);
    node.style.left = `${x}%`;
    node.style.top = `${y}%`;
    node.style.zIndex = String(getTileStackRank(tile));
    node.classList.toggle("is-free", isFree);
    node.classList.toggle("is-blocked", !isFree);
    node.classList.toggle("is-queued", queuedIds.has(tile.id));
    node.disabled = disabled;
    node.setAttribute("aria-disabled", String(disabled));
    node.dataset.tileId = tile.id;
    node.dataset.free = String(isFree);
    node.dataset.layer = String(tile.z);
    node.onclick = () => pickTile(tile.id, node);
    if (node.parentElement !== els.board) els.board.appendChild(node);
  });
}

function renderStash() {
  els.stashShelf.innerHTML = "";
  els.stashShelf.classList.toggle("has-items", state.stashed.length > 0);

  for (let i = 0; i < STASH_LIMIT; i += 1) {
    const slot = document.createElement("div");
    slot.className = "stash-slot";
    const item = state.stashed[i];
    if (item) {
      const tile = createTileNode(item, false, true);
      tile.addEventListener("click", () => returnStashedTile(i));
      slot.appendChild(tile);
    }
    els.stashShelf.appendChild(slot);
  }
}

function renderTray() {
  const existingTiles = new Map(
    [...els.tray.querySelectorAll(".slot .tile[data-tray-id]")].map((node) => [node.dataset.trayId, node]),
  );

  while (els.tray.children.length < TRAY_LIMIT) {
    const slot = document.createElement("div");
    slot.className = "slot";
    els.tray.appendChild(slot);
  }

  while (els.tray.children.length > TRAY_LIMIT) {
    els.tray.lastElementChild.remove();
  }

  for (let i = 0; i < TRAY_LIMIT; i += 1) {
    const slot = els.tray.children[i];
    const item = state.tray[i];
    slot.className = "slot";

    if (item) {
      const sameLeft = state.tray[i - 1]?.type === item.type;
      const sameRight = state.tray[i + 1]?.type === item.type;
      slot.classList.toggle("is-grouped-left", sameLeft);
      slot.classList.toggle("is-grouped-right", sameRight);
      const tileNode = existingTiles.get(item.id) ?? createTileNode(item, true);
      tileNode.dataset.trayId = item.id;
      tileNode.classList.remove("is-new");
      tileNode.classList.toggle("is-arriving", item.arriving || state.arrivingIds.includes(item.id));
      tileNode.querySelectorAll(".smoke-particle").forEach((particle) => particle.remove());
      const matchIndex = state.matchingIds.indexOf(item.id);
      tileNode.classList.toggle("is-matching", matchIndex >= 0);
      tileNode.classList.toggle("match-anchor", matchIndex === 0);
      tileNode.classList.toggle("match-push-mid", matchIndex === 1);
      tileNode.classList.toggle("match-push-last", matchIndex === 2);
      if (slot.firstElementChild !== tileNode) slot.replaceChildren(tileNode);
    } else if (slot.firstElementChild) {
      slot.replaceChildren();
    }
  }
  lastTrayIds = state.tray.map((item) => item.id);
}

function appendSmokeBurst(node) {
  for (let i = 0; i < 18; i += 1) {
    const particle = document.createElement("i");
    const angle = (Math.PI * 2 * i) / 18;
    const distance = 24 + (i % 5) * 9;
    particle.className = "smoke-particle smoke-burst";
    particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * distance - 10}px`);
    particle.style.setProperty("--scale", `${2 + (i % 4) * 0.28}`);
    particle.style.setProperty("--delay", `${i * 14}ms`);
    node.appendChild(particle);
  }
}

function createTileNode(tile, inTray = false, interactive = false) {
  const node = document.createElement(inTray && !interactive ? "div" : "button");
  node.className = "tile";
  if (!inTray || interactive) {
    node.type = "button";
  }

  const icon = document.createElement("span");
  icon.className = "tile-icon";
  node.appendChild(icon);
  syncTileArtwork(node, tile);
  return node;
}

function syncTileArtwork(node, tile) {
  const typeIndex = Math.max(0, TILE_TYPES.findIndex((item) => item.id === tile.type));
  const type = TILE_TYPES[typeIndex] ?? TILE_TYPES[0];
  node.dataset.type = tile.type;
  if (node.tagName === "BUTTON") node.setAttribute("aria-label", type.name);
  const icon = node.querySelector(".tile-icon");
  if (icon) {
    const col = typeIndex % TILE_SPRITE_COLUMNS;
    const row = Math.floor(typeIndex / TILE_SPRITE_COLUMNS);
    icon.style.backgroundSize = `${TILE_SPRITE_COLUMNS * TILE_ICON_ZOOM * 100}% ${TILE_SPRITE_ROWS * TILE_ICON_ZOOM * 100}%`;
    icon.style.backgroundPosition = `${getZoomedSpritePosition(col, TILE_SPRITE_COLUMNS, TILE_ICON_ZOOM)}% ${getZoomedSpritePosition(row, TILE_SPRITE_ROWS, TILE_ICON_ZOOM)}%`;
  }
}

function getZoomedSpritePosition(index, total, zoom) {
  return ((0.5 - (index + 0.5) * zoom) / (1 - total * zoom)) * 100;
}

function pickTile(tileId, sourceNode = null) {
  if (state.finished || !getFreeTileIds().has(tileId)) return;

  if (state.animatingMatch) {
    queuePick(tileId);
    return;
  }

  clearHints();
  const tile = state.tiles.find((item) => item.id === tileId);
  if (!tile || tile.removed) return;
  if (state.tray.length >= TRAY_LIMIT) {
    evaluateGame();
    return;
  }

  const sourceElement = sourceNode ?? findBoardTileNode(tileId);
  const sourceRect = sourceElement?.getBoundingClientRect();
  tile.removed = true;
  state.pendingPickIds = state.pendingPickIds.filter((id) => id !== tileId);
  const trayIndex = insertIntoTray({ id: tile.id, type: tile.type, arriving: true });
  state.arrivingIds = [...new Set([...state.arrivingIds, tile.id])];
  state.flightCount += 1;
  playFeedback("pick");
  render();

  const targetRect = getTraySlotTargetRect(trayIndex);
  animateTileFlight({ id: tile.id, type: tile.type }, sourceRect, targetRect).then(() => {
    state.moves += 1;
    addScore(10);
    completeTileFlight(tile.id, tile.type);
  });
}

function completeTileFlight(tileId, type) {
  state.flightCount = Math.max(0, state.flightCount - 1);
  state.arrivingIds = state.arrivingIds.filter((id) => id !== tileId);

  const trayItem = state.tray.find((item) => item.id === tileId);
  if (trayItem) trayItem.arriving = false;

  if (state.finished) return;
  render();
  if (resolveTrayMatch(type)) return;
  if (state.flightCount > 0) return;
  evaluateGame();
  processQueuedPick();
}

function queuePick(tileId) {
  if (state.pendingPickIds.includes(tileId)) return;
  state.pendingPickIds.push(tileId);
  const node = findBoardTileNode(tileId);
  if (node) node.classList.add("is-queued");
}

function processQueuedPick() {
  if (state.finished || state.animatingMatch) return;

  while (state.pendingPickIds.length > 0) {
    const tileId = state.pendingPickIds.shift();
    const tile = state.tiles.find((item) => item.id === tileId);
    if (!tile || tile.removed || !getFreeTileIds().has(tileId)) continue;
    if (state.tray.length >= TRAY_LIMIT) {
      evaluateGame();
      return;
    }

    pickTile(tileId, findBoardTileNode(tileId));
    return;
  }

  render();
}

function findBoardTileNode(tileId) {
  return [...els.board.querySelectorAll(".tile[data-tile-id]")]
    .find((node) => node.dataset.tileId === tileId) ?? null;
}

function getTrayInsertionIndex(type) {
  const lastSameIndex = state.tray.reduce((lastIndex, tile, index) => (tile.type === type ? index : lastIndex), -1);
  return lastSameIndex >= 0 ? lastSameIndex + 1 : state.tray.length;
}

function insertIntoTray(item) {
  const nextIndex = getTrayInsertionIndex(item.type);
  if (nextIndex < state.tray.length) {
    state.tray.splice(nextIndex, 0, item);
    return nextIndex;
  }
  state.tray.push(item);
  return state.tray.length - 1;
}

function getTraySlotTargetRect(index) {
  const slot = els.tray.children[index];
  if (!slot) return null;
  const slotRect = slot.getBoundingClientRect();
  const slotTile = slot.querySelector(".tile");
  if (slotTile) return slotTile.getBoundingClientRect();
  const inset = Math.max(0, slotRect.width * 0.02);
  return {
    left: slotRect.left + inset,
    top: slotRect.top + inset,
    width: slotRect.width - inset * 2,
    height: slotRect.height - inset * 2,
  };
}

function animateTileFlight(tile, sourceRect, targetRect) {
  if (!sourceRect || !targetRect) return Promise.resolve();

  const clone = createTileNode(tile, true);
  clone.classList.add("tile-flight");
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  document.body.appendChild(clone);

  const targetX = targetRect.left + (targetRect.width - sourceRect.width) / 2 - sourceRect.left;
  const targetY = targetRect.top + (targetRect.height - sourceRect.height) / 2 - sourceRect.top;
  const targetScale = Math.min(1.05, Math.max(0.72, targetRect.width / sourceRect.width));
  if (typeof clone.animate !== "function") {
    clone.style.transition = `transform ${TILE_FLIGHT_MS}ms cubic-bezier(0.16, 0.72, 0.15, 1)`;
    requestAnimationFrame(() => {
      clone.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(${targetScale})`;
    });
    return new Promise((resolve) => {
      window.setTimeout(() => {
        resolve();
        window.setTimeout(() => clone.remove(), 40);
      }, TILE_FLIGHT_MS + 40);
    });
  }

  const animation = clone.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      { transform: `translate3d(${targetX * 0.38}px, ${targetY * 0.2 - 30}px, 0) scale(1.1) rotate(-4deg)`, opacity: 1, offset: 0.36 },
      { transform: `translate3d(${targetX * 0.82}px, ${targetY * 0.76 - 8}px, 0) scale(${targetScale * 1.04}) rotate(2deg)`, opacity: 1, offset: 0.76 },
      { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(${targetScale}) rotate(0deg)`, opacity: 1, offset: 0.94 },
      { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(${targetScale}) rotate(0deg)`, opacity: 1, offset: 1 },
    ],
    {
      duration: TILE_FLIGHT_MS,
      easing: "cubic-bezier(0.16, 0.72, 0.15, 1)",
      fill: "forwards",
    },
  );

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
      window.setTimeout(() => clone.remove(), 40);
    };
    animation.addEventListener("finish", finish, { once: true });
    animation.addEventListener("cancel", finish, { once: true });
    window.setTimeout(finish, TILE_FLIGHT_MS + 120);
  });
}

function findTrayMatch(type) {
  const matches = state.tray.filter((tile) => tile.type === type && !tile.arriving);
  if (matches.length < 3) return [];
  return matches.slice(0, 3).map((tile) => tile.id);
}

function resolveTrayMatch(preferredType = null) {
  if (state.finished || state.animatingMatch) return false;

  const types = [...new Set(state.tray.map((tile) => tile.type))];
  if (preferredType) {
    types.sort((a, b) => (a === preferredType ? -1 : 0) - (b === preferredType ? -1 : 0));
  }

  for (const type of types) {
    const matched = findTrayMatch(type);
    if (matched.length > 0) {
      startMatchAnimation(matched);
      return true;
    }
  }

  return false;
}

function startMatchAnimation(matched) {
  state.arrivingIds = [];
  state.matchingIds = matched;
  state.animatingMatch = true;
  handleMatchFeedback(matched);
  render();
  window.setTimeout(() => spawnTraySmokeBurst(matched[0]), 220);

  window.setTimeout(() => {
    const removeIds = new Set(matched);
    state.tray = state.tray.filter((tile) => !removeIds.has(tile.id));
    state.matchingIds = [];
    state.animatingMatch = false;
    render();
    if (resolveTrayMatch()) return;
    evaluateGame();
    processQueuedPick();
  }, MATCH_ANIMATION_MS);
}

function spawnTraySmokeBurst(anchorId) {
  const anchor = [...els.tray.querySelectorAll(".tile[data-tray-id]")]
    .find((node) => node.dataset.trayId === anchorId);
  const wrap = els.tray.parentElement;
  if (!anchor || !wrap) return;

  const anchorRect = anchor.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  const burst = document.createElement("div");
  burst.className = "tray-smoke-burst";
  burst.style.left = `${anchorRect.left + anchorRect.width / 2 - wrapRect.left}px`;
  burst.style.top = `${anchorRect.top + anchorRect.height / 2 - wrapRect.top}px`;
  appendSmokeBurst(burst);
  wrap.appendChild(burst);
  window.setTimeout(() => burst.remove(), 820);
}

function handleMatchFeedback(matched) {
  if (matched.length === 0) {
    state.combo = 0;
    return;
  }

  state.combo += 1;
  const points = 120 + Math.max(0, state.combo - 1) * 60;
  const timeBonus = addLevelTime(state.timeBonus);
  addScore(points);
  const timerText = timeBonus > 0 ? ` +${Math.round(timeBonus)}秒` : "";
  const label = state.combo > 1 ? `连消 x${state.combo}${timerText}` : `三连收走${timerText}`;
  showToast(label);
  spawnMatchFx(`+${points}`);
  playFeedback("match");
}

function startLevelTimer() {
  stopLevelTimer();
  if (!state.timeLimit || state.finished) return;
  lastTimerTick = performance.now();
  levelTimer = window.setInterval(tickLevelTimer, TIMER_TICK_MS);
  updateStatus();
}

function stopLevelTimer() {
  if (levelTimer) {
    window.clearInterval(levelTimer);
    levelTimer = 0;
  }
}

function tickLevelTimer() {
  if (!state.timeLimit || state.finished) {
    stopLevelTimer();
    return;
  }

  const now = performance.now();
  const elapsed = Math.max(0, (now - lastTimerTick) / 1000);
  lastTimerTick = now;
  state.timeLeft = Math.max(0, state.timeLeft - elapsed);
  updateStatus();

  if (state.timeLeft <= 0) {
    state.failReason = "timeout";
    finish(false);
  }
}

function addLevelTime(seconds) {
  if (!seconds || !state.timeLimit || state.finished) return 0;
  state.timeLeft += seconds;
  updateStatus();
  return seconds;
}

function evaluateGame() {
  if (state.finished || state.animatingMatch || state.flightCount > 0) return;
  const remaining = state.tiles.some((tile) => !tile.removed);
  if (!remaining && state.tray.length === 0 && state.stashed.length === 0) {
    finish(true);
    return;
  }

  if (state.tray.length >= TRAY_LIMIT) {
    finish(false);
  }
}

function finish(won) {
  stopLevelTimer();
  state.finished = true;
  state.lastResultWon = won;
  stopBgm(0.25);
  const stars = calculateStars(won);
  els.resultStars.textContent = renderStars(stars);
  els.resultScore.textContent = String(state.score);
  els.resultMoves.textContent = String(state.moves);

  if (won) {
    unlockNextLevel();
    saveBestResult(stars);
    const isLast = state.levelIndex >= LEVELS.length - 1;
    els.resultStamp.textContent = isLast ? "DAILY CLEAR" : "CLEAR";
    els.resultKicker.textContent = "抽屉归位";
    els.resultTitle.textContent = isLast ? "乱桌清空" : "抓完一波";
    els.resultText.textContent = isLast ? "三关都收拾完了，连歪掉的铅笔都服气。" : "下一张课桌已经开始不安分了。";
    els.nextButton.textContent = isLast ? "回到第一关" : "下一关";
    playFeedback("win");
  } else {
    els.gameScreen.classList.add("is-failed");
    els.resultStamp.textContent = "BUSTED";
    els.resultKicker.textContent = "抽屉爆仓";
    els.resultTitle.textContent = state.failReason === "timeout" ? "巡查到了" : "乱成一团";
    els.resultText.textContent = state.failReason === "timeout"
      ? "倒计时结束，课桌还没收拾干净。"
      : "小物件挤不下了，先深呼吸再抓一轮。";
    els.nextButton.textContent = "再挑战";
    playFeedback("lose");
  }

  setTimeout(() => showScreen("result"), 280);
}

function calculateStars(won) {
  if (!won) return 0;
  const remainingTools = (state.toolUses.shuffle ?? 0) + (state.toolUses.stash ?? 0) + (state.toolUses.magnet ?? 0);
  const spentTools = 5 - remainingTools;
  const extraMoves = Math.max(0, state.moves - state.total);
  let stars = 3;
  if (extraMoves > 2 || spentTools > 1) stars -= 1;
  if (extraMoves > 6 || spentTools > 3) stars -= 1;
  return Math.max(1, stars);
}

function renderStars(count) {
  if (count <= 0) return "☆ ☆ ☆";
  return `${"★".repeat(count)}${"☆".repeat(3 - count)}`;
}

function saveBestResult(stars) {
  const bestScores = [...progress.bestScores];
  const bestStars = [...progress.bestStars];
  bestScores[state.levelIndex] = Math.max(bestScores[state.levelIndex] ?? 0, state.score);
  bestStars[state.levelIndex] = Math.max(bestStars[state.levelIndex] ?? 0, stars);
  saveProgress({ bestScores, bestStars });
}

function shuffleBoard() {
  if (state.toolUses.shuffle <= 0 || state.finished || state.animatingMatch || state.flightCount > 0) return;
  const active = state.tiles.filter((tile) => !tile.removed);
  const types = active.map((tile) => tile.type);
  shuffleArray(types);
  active.forEach((tile, index) => {
    tile.type = types[index];
  });
  state.toolUses.shuffle -= 1;
  addScore(-25);
  clearHints();
  showToast("课桌洗了一下牌");
  playFeedback("tool");
  render();
}

function stashTiles() {
  if (state.toolUses.stash <= 0 || state.finished || state.animatingMatch || state.flightCount > 0) return;
  const removed = state.tray.splice(0, Math.min(3, state.tray.length));
  if (removed.length === 0) return;
  state.stashed.push(...removed);
  state.toolUses.stash -= 1;
  addScore(-15);
  clearHints();
  showToast("先塞进临时抽屉");
  playFeedback("tool");
  render();
}

function magnetTiles() {
  if (state.toolUses.magnet <= 0 || state.finished || state.animatingMatch || state.flightCount > 0) return;
  const target = findMagnetTarget();
  if (!target) {
    showToast("暂时没有能磁吸成组的牌");
    playFeedback("tool");
    return;
  }

  clearHints();
  target.tiles.forEach((tile) => {
    tile.removed = true;
    insertIntoTray({ id: tile.id, type: tile.type });
  });
  state.moves += target.tiles.length;
  state.toolUses.magnet -= 1;
  addScore(-20);
  showToast(`磁吸 ${target.tiles.length} 张`);
  playFeedback("tool");

  const matched = findTrayMatch(target.type);
  if (matched.length > 0) {
    startMatchAnimation(matched);
    return;
  }

  render();
  evaluateGame();
}

function findMagnetTarget() {
  const space = TRAY_LIMIT - state.tray.length;
  if (space <= 0) return null;

  const freeIds = getFreeTileIds();
  const freeByType = new Map();
  state.tiles
    .filter((tile) => !tile.removed && freeIds.has(tile.id))
    .forEach((tile) => {
      const list = freeByType.get(tile.type) ?? [];
      list.push(tile);
      freeByType.set(tile.type, list);
    });

  freeByType.forEach((tiles) => {
    tiles.sort((a, b) => getTileStackRank(b) - getTileStackRank(a));
  });

  const trayCounts = new Map();
  state.tray.forEach((tile) => {
    trayCounts.set(tile.type, (trayCounts.get(tile.type) ?? 0) + 1);
  });

  const candidates = TILE_TYPES.map((type) => {
    const trayCount = trayCounts.get(type.id) ?? 0;
    const need = trayCount > 0 ? 3 - trayCount : 3;
    const tiles = freeByType.get(type.id) ?? [];
    if (need <= 0 || need > space || tiles.length < need) return null;
    return {
      type: type.id,
      tiles: tiles.slice(0, need),
      score: trayCount * 100 + tiles.length * 4 - need,
    };
  }).filter(Boolean);

  candidates.sort((a, b) => b.score - a.score || a.tiles.length - b.tiles.length);
  return candidates[0] ?? null;
}

function returnStashedTile(index) {
  if (state.finished || state.animatingMatch || state.flightCount > 0) return;
  if (state.tray.length >= TRAY_LIMIT) {
    showToast("抽屉已经塞满啦");
    return;
  }

  const item = state.stashed[index];
  if (!item) return;

  state.stashed.splice(index, 1);
  insertIntoTray({ ...item });
  state.moves += 1;
  addScore(5);
  const matched = findTrayMatch(item.type);
  if (matched.length > 0) {
    clearHints();
    startMatchAnimation(matched);
    return;
  }
  clearHints();
  render();
  evaluateGame();
}

function clearHints() {
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(hideToast, 1200);
}

function hideToast() {
  window.clearTimeout(toastTimer);
  els.toast.classList.remove("is-visible");
}

function spawnMatchFx(label) {
  const fx = document.createElement("div");
  fx.className = "match-fx";
  fx.innerHTML = `<strong>${label}</strong><span></span><span></span><span></span><span></span>`;
  els.tray.parentElement.appendChild(fx);
  window.setTimeout(() => fx.remove(), 760);
}

function addScore(delta) {
  state.score = Math.max(0, state.score + delta);
}

function toggleSound() {
  settings.sound = !settings.sound;
  saveSettings();
  updateSoundButton();
  if (settings.sound) {
    playFeedback("tool");
    syncBgm();
  } else {
    stopBgm(0.18);
  }
}

function updateSoundButton() {
  els.soundButton.textContent = settings.sound ? "♪" : "×";
  els.soundButton.setAttribute("aria-label", settings.sound ? "关闭音效" : "打开音效");
  updateVolumeControl();
}

function updateVolumeControl() {
  if (!els.volumeSlider) return;
  els.volumeSlider.value = String(Math.round(getBgmVolume() * 100));
  els.volumeSlider.disabled = !settings.sound;
}

function getBgmVolume() {
  return clamp(Number(settings.bgmVolume ?? DEFAULT_BGM_VOLUME), 0, 1);
}

function setBgmVolume(value) {
  settings.bgmVolume = clamp(Number(value), 0, 1);
  saveSettings();
  updateVolumeControl();
  applyBgmVolume();
}

function applyBgmVolume() {
  const target = settings.sound ? getBgmVolume() : 0;
  if (bgmAudio) fadeBgmAudio(target, 120);
  if (audioContext && musicState.gain) {
    const now = audioContext.currentTime;
    musicState.gain.gain.cancelScheduledValues(now);
    musicState.gain.gain.setValueAtTime(Math.max(0.0001, musicState.gain.gain.value), now);
    musicState.gain.gain.linearRampToValueAtTime(Math.max(0.0001, target * SYNTH_BGM_MAX_VOLUME), now + 0.12);
  }
}

function ensureAudioContext() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === "suspended") {
    const resume = audioContext.resume();
    if (resume && typeof resume.catch === "function") resume.catch(() => {});
  }
  return audioContext;
}

function syncBgm(screenName = null) {
  const gameVisible = screenName ? screenName === "game" : els.gameScreen.classList.contains("is-active");
  if (gameVisible && settings.sound && !state.finished && !document.hidden) {
    startBgm();
    return;
  }
  stopBgm();
}

function startBgm() {
  if (!settings.sound || state.finished || document.hidden) return;
  const audio = ensureBgmAudio();
  if (audio) {
    audio.muted = false;
    fadeBgmAudio(getBgmVolume(), 650);
    if (!audio.paused && !audio.ended) {
      stopSynthBgm(0.18);
      return;
    }
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.then(() => stopSynthBgm(0.18)).catch(() => startSynthBgm());
    } else if (!audio.paused) {
      stopSynthBgm(0.18);
    }
    const startTime = audio.currentTime;
    window.setTimeout(() => {
      const stalled = audio.paused || audio.currentTime <= startTime + 0.02;
      if (stalled && settings.sound && !state.finished && els.gameScreen.classList.contains("is-active")) {
        startSynthBgm();
      }
    }, 420);
    return;
  }
  startSynthBgm();
}

function stopBgm(fadeSeconds = 0.35) {
  stopSynthBgm(fadeSeconds);
  fadeBgmAudio(0, fadeSeconds * 1000, true);
}

function ensureBgmAudio() {
  if (!window.Audio) return null;
  if (bgmAudio) return bgmAudio;

  bgmAudio = new Audio(BGM_SOURCE);
  bgmAudio.loop = true;
  bgmAudio.preload = "auto";
  bgmAudio.volume = 0.001;
  return bgmAudio;
}

function fadeBgmAudio(targetVolume, duration = 450, pauseWhenSilent = false) {
  if (!bgmAudio) return;
  window.clearInterval(bgmFadeTimer);

  const startVolume = bgmAudio.volume;
  const startTime = performance.now();
  const endVolume = clamp(targetVolume, 0, 1);

  bgmFadeTimer = window.setInterval(() => {
    const progress = Math.min(1, (performance.now() - startTime) / duration);
    bgmAudio.volume = startVolume + (endVolume - startVolume) * progress;
    if (progress >= 1) {
      window.clearInterval(bgmFadeTimer);
      if (pauseWhenSilent && endVolume <= 0.001) bgmAudio.pause();
    }
  }, 40);
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (!settings.sound) return;
  ensureBgmAudio();
  ensureAudioContext();
  syncBgm();
}

function startSynthBgm() {
  if (!settings.sound || state.finished || document.hidden) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;
  ensureMusicGain(ctx);

  const now = ctx.currentTime;
  const targetVolume = getBgmVolume() * SYNTH_BGM_MAX_VOLUME;
  musicState.gain.gain.cancelScheduledValues(now);
  musicState.gain.gain.setValueAtTime(Math.max(0.0001, musicState.gain.gain.value), now);
  musicState.gain.gain.linearRampToValueAtTime(Math.max(0.0001, targetVolume), now + 0.7);

  if (musicState.timer) return;
  musicState.nextStepTime = now + 0.04;
  scheduleBgm();
  musicState.timer = window.setInterval(scheduleBgm, 110);
}

function stopSynthBgm(fadeSeconds = 0.35) {
  if (musicState.timer) {
    window.clearInterval(musicState.timer);
    musicState.timer = 0;
  }
  if (!audioContext || !musicState.gain) return;

  const now = audioContext.currentTime;
  musicState.gain.gain.cancelScheduledValues(now);
  musicState.gain.gain.setValueAtTime(Math.max(0.0001, musicState.gain.gain.value), now);
  musicState.gain.gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);
}

function ensureMusicGain(ctx) {
  if (musicState.gain && musicState.gain.context === ctx) return;
  musicState.gain = ctx.createGain();
  musicState.gain.gain.value = 0.0001;
  musicState.gain.connect(ctx.destination);
}

function scheduleBgm() {
  if (!audioContext || !musicState.gain || !settings.sound || state.finished || document.hidden) return;
  if (musicState.nextStepTime < audioContext.currentTime - MUSIC_STEP_SECONDS) {
    musicState.nextStepTime = audioContext.currentTime + 0.03;
  }

  while (musicState.nextStepTime < audioContext.currentTime + MUSIC_LOOKAHEAD_SECONDS) {
    playMusicStep(musicState.step, musicState.nextStepTime);
    musicState.nextStepTime += MUSIC_STEP_SECONDS;
    musicState.step = (musicState.step + 1) % MUSIC_PATTERN.length;
  }
}

function playMusicStep(step, time) {
  const cue = MUSIC_PATTERN[step % MUSIC_PATTERN.length];
  if (cue.bass) playMusicOsc(cue.bass, time, 0.24, "square", 0.055, 420);
  if (cue.lead) {
    const detune = step % 4 === 1 ? 8 : step % 4 === 2 ? -10 : 0;
    playMusicOsc(cue.lead, time + 0.015, 0.13, "sawtooth", 0.026, 1400, detune);
  }
  if (cue.bell) {
    playMusicOsc(cue.bell, time + 0.02, 0.18, "sine", 0.021, 2800);
    playMusicOsc(cue.bell * 1.5, time + 0.025, 0.12, "triangle", 0.01, 3600);
  }
  if (cue.tap) playDeskTap(time, cue.tap);
}

function playMusicOsc(frequency, time, duration, type, volume, filterFrequency, detune = 0) {
  const osc = audioContext.createOscillator();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, time);
  osc.detune.setValueAtTime(detune, time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFrequency, time);
  filter.Q.setValueAtTime(type === "square" ? 1.3 : 4.5, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(musicState.gain);
  osc.start(time);
  osc.stop(time + duration + 0.04);
}

function playDeskTap(time, accent = 1) {
  const source = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();

  source.buffer = getNoiseBuffer();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(360 + accent * 180, time);
  filter.Q.setValueAtTime(7, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.018 * accent, time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(musicState.gain);
  source.start(time);
  source.stop(time + 0.07);
}

function getNoiseBuffer() {
  if (musicState.noiseBuffer) return musicState.noiseBuffer;

  const length = Math.floor(audioContext.sampleRate * 0.08);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const envelope = 1 - i / length;
    data[i] = (Math.random() * 2 - 1) * envelope;
  }
  musicState.noiseBuffer = buffer;
  return buffer;
}

function playFeedback(kind) {
  if ("vibrate" in navigator) {
    const pulses = {
      pick: 8,
      match: [18, 24, 18],
      tool: 12,
      win: [28, 34, 40],
      lose: [45, 30, 45],
    };
    navigator.vibrate(pulses[kind] ?? 8);
  }

  if (!settings.sound) return;

  const ctx = ensureAudioContext();
  if (!ctx) return;

  const patterns = {
    pick: [520],
    match: [660, 880],
    tool: [420],
    win: [620, 780, 980],
    lose: [260, 220],
  };
  const notes = patterns[kind] ?? patterns.pick;
  notes.forEach((frequency, index) => playTone(frequency, index * 0.07, kind === "lose" ? 0.12 : 0.08));
}

function playTone(frequency, offset, duration) {
  const now = audioContext.currentTime + offset;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.075, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function getFreeTileIds() {
  const active = state.tiles.filter((tile) => !tile.removed);
  if (active.length <= 1) return new Set(active.map((tile) => tile.id));

  const bounds = getBoardBounds();
  const boardBox = els.board.getBoundingClientRect();
  const tileSize = getTileSizePx();
  const rects = new Map(
    active.map((tile) => [tile.id, getTileRect(tile, bounds, boardBox, tileSize)]),
  );
  const free = new Set();

  active.forEach((tile) => {
    const blocked = active.some((other) => {
      if (other.id === tile.id || getTileStackRank(other) <= getTileStackRank(tile)) return false;
      return hasMeaningfulOverlap(rects.get(tile.id), rects.get(other.id), tileSize, other.z === tile.z);
    });
    if (!blocked) free.add(tile.id);
  });

  return free;
}

function getTileStackRank(tile) {
  return tile.z * 10000 + Math.round((tile.y + tile.jitterY) * 100) * 100 + Math.round((tile.x + tile.jitterX) * 100);
}

function getTileRect(tile, bounds, boardBox, tileSize) {
  const { x, y } = getTileBoardPosition(tile, bounds);
  const left = (boardBox.width * x) / 100;
  const top = (boardBox.height * y) / 100;
  return {
    left,
    top,
    right: left + tileSize,
    bottom: top + tileSize,
  };
}

function hasMeaningfulOverlap(base, cover, tileSize, sameLayer = false) {
  if (!base || !cover) return false;
  const coverMargin = sameLayer ? tileSize * 0.02 : tileSize * 0.08;
  const overlapX = Math.min(base.right, cover.right + coverMargin) - Math.max(base.left, cover.left - coverMargin);
  const overlapY = Math.min(base.bottom, cover.bottom + coverMargin) - Math.max(base.top, cover.top - coverMargin);
  if (overlapX <= 0 || overlapY <= 0) return false;

  const overlapArea = overlapX * overlapY;
  const tileArea = tileSize * tileSize;
  const minAxisRatio = Math.min(overlapX, overlapY) / tileSize;
  const areaRatio = overlapArea / tileArea;

  if (sameLayer) {
    return minAxisRatio > 0.16 && areaRatio > 0.045;
  }

  return minAxisRatio > 0.04 && areaRatio > 0.006;
}

function getTileSizePx() {
  const tile = els.board.querySelector(".tile");
  if (tile) return Number.parseFloat(getComputedStyle(tile).width) || tile.getBoundingClientRect().width;

  const probe = document.createElement("div");
  probe.className = "tile tile-probe";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  els.board.appendChild(probe);
  const width = Number.parseFloat(getComputedStyle(probe).width) || probe.getBoundingClientRect().width || 52;
  probe.remove();
  return width;
}

function getTileBoardPosition(tile, bounds) {
  const map = getBoardMap();
  return {
    x: ((tile.x + tile.jitterX - bounds.minX) / bounds.width) * map.xScale + map.xOffset,
    y: ((tile.y + tile.jitterY - bounds.minY) / bounds.height) * map.yScale + map.yOffset,
  };
}

function getBoardMap() {
  const level = LEVELS[state.levelIndex] ?? LEVELS[0];
  return {
    xScale: level.boardMapXScale ?? BOARD_MAP_X_SCALE,
    xOffset: level.boardMapXOffset ?? BOARD_MAP_X_OFFSET,
    yScale: level.boardMapYScale ?? BOARD_MAP_Y_SCALE,
    yOffset: level.boardMapYOffset ?? BOARD_MAP_Y_OFFSET,
  };
}

function getBoardBounds() {
  const level = LEVELS[state.levelIndex] ?? LEVELS[0];
  return {
    minX: level.viewMinX ?? -0.4,
    minY: level.viewMinY ?? -0.4,
    width: level.viewWidth ?? level.cols + level.layers * 0.45,
    height: level.viewHeight ?? level.rows + level.layers * 0.45,
  };
}

function updateStatus() {
  const left = state.tiles.filter((tile) => !tile.removed).length;
  const cleared = state.total - left;
  const ratio = state.total > 0 ? cleared / state.total : 0;
  els.progressBar.style.width = `${ratio * 100}%`;
  els.remainingLabel.textContent = `${cleared}/${state.total}`;
  els.scoreLabel.textContent = String(state.score);
  const hasTimer = Boolean(state.timeLimit);
  els.moveLabel.textContent = hasTimer ? formatTimer(state.timeLeft) : String(state.moves);
  if (els.moveUnitLabel) els.moveUnitLabel.textContent = hasTimer ? "" : "步";
  if (els.movePill) {
    els.movePill.classList.toggle("is-timer", hasTimer);
    els.movePill.classList.toggle("is-low-time", hasTimer && state.timeLeft <= 60);
  }
  els.boardWrap?.classList.toggle("is-danger-time", hasTimer && state.timeLeft <= 60 && !state.finished);
}

function formatTimer(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function updateTools() {
  const busy = state.animatingMatch || state.flightCount > 0;
  els.shuffleButton.disabled = state.toolUses.shuffle <= 0 || state.finished || busy;
  els.stashButton.disabled = state.tray.length === 0 || state.stashed.length >= STASH_LIMIT || state.toolUses.stash <= 0 || state.finished || busy;
  els.magnetButton.disabled = state.finished || busy || state.toolUses.magnet <= 0 || !findMagnetTarget();

  els.shuffleButton.querySelector("strong").textContent = `洗牌 ${state.toolUses.shuffle}`;
  els.stashButton.querySelector("strong").textContent = `移出 ${state.toolUses.stash}`;
  els.magnetButton.querySelector("strong").textContent = `磁吸 ${state.toolUses.magnet}`;
}

function nextLevelFromResult() {
  if (!state.lastResultWon) {
    startGame(state.levelIndex);
    return;
  }
  const nextIndex = state.levelIndex >= LEVELS.length - 1 ? 0 : state.levelIndex + 1;
  startGame(nextIndex);
}

function shuffleArray(items, rng = Math.random) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

els.startButton.addEventListener("click", () => startGame(selectedLevelIndex));
els.homeButton.addEventListener("click", () => showScreen("start"));
els.restartButton.addEventListener("click", () => startGame(state.levelIndex));
els.resultRestartButton.addEventListener("click", () => startGame(state.levelIndex));
els.nextButton.addEventListener("click", nextLevelFromResult);
els.shuffleButton.addEventListener("click", shuffleBoard);
els.stashButton.addEventListener("click", stashTiles);
els.magnetButton.addEventListener("click", magnetTiles);
els.soundButton.addEventListener("click", toggleSound);
els.volumeSlider?.addEventListener("input", (event) => setBgmVolume(Number(event.target.value) / 100));

document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
document.addEventListener("pointerdown", unlockAudio, { passive: true });
document.addEventListener("touchstart", unlockAudio, { passive: true });
document.addEventListener("visibilitychange", () => syncBgm());

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js?v=40").catch(() => {});
  });
}

updateSoundButton();

const params = new URLSearchParams(window.location.search);
if (params.get("play") === "1") {
  const level = Math.max(0, Math.min(LEVELS.length - 1, Number(params.get("level") ?? 1) - 1));
  startGame(level);
} else {
  showScreen("start");
}
