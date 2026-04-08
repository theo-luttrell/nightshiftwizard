// --- SUPABASE CONFIG ---
const supabaseUrl = "https://dmpsaindnowmxybrwoem.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcHNhaW5kbm93bXh5YnJ3b2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTA5ODAsImV4cCI6MjA5MDg4Njk4MH0.dUULkS_k_T8rTHy7czQfrjWvoxhEllYWGtwtsGIk-5o";
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
let currentUser = null;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- UI ELEMENTS ---
const screens = {
  mainMenuScreen: document.getElementById("mainMenuScreen"),
  howToPlayScreen: document.getElementById("howToPlayScreen"),
  optionsScreen: document.getElementById("optionsScreen"),
  devToolsScreen: document.getElementById("devToolsScreen"),
  gameOverScreen: document.getElementById("gameOverScreen"),
  pauseScreen: document.getElementById("pauseScreen"),
  shopScreen: document.getElementById("shopScreen"),
  leaderboardScreen: document.getElementById("leaderboardScreen"),
  achievementsScreen: document.getElementById("achievementsScreen"),
  eulaScreen: document.getElementById("eulaScreen"),
  accountScreen: document.getElementById("accountScreen"),
  cloudConflictScreen: document.getElementById("cloudConflictScreen"),
  tutorialIntroScreen: document.getElementById("tutorialIntroScreen"),
  tutorialOutroScreen: document.getElementById("tutorialOutroScreen"),
};
const pauseBtn = document.getElementById("pauseBtn");
const gameOverTitle = document.getElementById("gameOverTitle");
const bossWarning = document.getElementById("bossWarning");
const finalScoreText = document.getElementById("finalScoreText");
const finalComboText = document.getElementById("finalComboText");
const finalShardsText = document.getElementById("finalShardsText");
const newRecordAlert = document.getElementById("newRecordAlert");

const eulaContent = document.getElementById("eulaContent");
const btnAgreeEula = document.getElementById("btnAgreeEula");
const btnCloseEula = document.getElementById("btnCloseEula");

// --- STATE VARIABLES ---
let gameState = "MENU";
let isBossRush = false;
let isMuted = false;
let showBgStars = true;
let secretClicks = 0;
let shopkeeperClicks = 0;

let isInvincible = false;
let allowInvincibleLB = false;

// --- TUTORIAL VARIABLES ---
let hasSeenTutorial = localStorage.getItem("nsw_hasSeenTutorial") === "true";
let isTutorial = false;
let tutorialStep = 0;
let tutorialTimer = 0;
let tutorialMessage = "";
let isReplayingTutorial = false;

// --- META-PROGRESSION & SAVES ---
let highScore = parseInt(localStorage.getItem("nsw_highScore")) || 0;
let maxComboAllTime = parseInt(localStorage.getItem("nsw_maxCombo")) || 1;
let arcaneShards = parseInt(localStorage.getItem("nsw_shards")) || 0;
let shownEula = localStorage.getItem("nsw_shownEula") === "true";

let upgrades = JSON.parse(localStorage.getItem("nsw_upgrades")) || {
  potion: 0,
  boots: 0,
  magnet: 0,
  blast: 0,
};
let skins = JSON.parse(localStorage.getItem("nsw_skins")) || {
  wizard: true,
  pyromancer: false,
  necromancer: false,
};
let activeSkin = localStorage.getItem("nsw_activeSkin") || "wizard";

let relics = JSON.parse(localStorage.getItem("nsw_relics")) || {
  none: true,
  glass_cannon: false,
  lead_boots: false,
};
let activeRelic = localStorage.getItem("nsw_activeRelic") || "none";

let companions = JSON.parse(localStorage.getItem("nsw_companions")) || {
  none: true,
  void_wisp: false,
  ember_bat: false,
  chrono_snail: false,
};
let activeCompanion = localStorage.getItem("nsw_activeCompanion") || "none";

let spells = JSON.parse(localStorage.getItem("nsw_spells")) || {
  none: true,
  blink: false,
  pulse: false,
};
let activeSpell = localStorage.getItem("nsw_activeSpell") || "none";
let spellCooldown = 0;
let spellMaxCooldown = 1;
let pulseEffectTimer = 0;

let hasSeenShopTutorial = localStorage.getItem("nsw_shopTutorial") === "true";
let shopDialogueIndex = 0;
let isShopDialogueActive = false;
const shopTutorialLines = [
  "Ah, a new face. Welcome to my shop.",
  "Got any Arcane Shards? I can trade them for a little extra power.",
  "Upgrades will make your potions and spells last longer.",
  "Want a new look? Check out the Wardrobe.",
  "Relics are powerful, but they bend the rules of the night.",
  "I can also teach you some Spells, if you've got the shards.",
  "Or maybe you'd like a Companion to keep you company out there?",
  "Take your time. The night is just getting started...",
];

// --- ACHIEVEMENTS CONFIG & STATE ---
const achievementDefinitions = [
  {
    id: "initiate",
    title: "The Initiate",
    description: "Complete The Initiation tutorial run.",
    tier: "Adept",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "account_sync",
    title: "Account Sync",
    description: "Link your local data to your account.",
    tier: "Adept",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "grimoire_reader",
    title: "Grimoire Reader",
    description: "View the 'How to Play' instructions.",
    tier: "Adept",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "night_shift_beginner",
    title: "Night Shift Beginner",
    description: "Reach a total cumulative score of 100,000.",
    tier: "Adept",
    targetValue: 100000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "astral_combo",
    title: "Astral Combo",
    description: "Reach a 10x combo multiplier.",
    tier: "Adept",
    targetValue: 10,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "wizard_scholar",
    title: "Wizard Scholar",
    description: "Reach a total cumulative score of 1,000,000.",
    tier: "Arcane",
    targetValue: 1000000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "overdrive",
    title: "Overdrive",
    description: "Reach a 25x combo multiplier.",
    tier: "Arcane",
    targetValue: 25,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "perfect_shift",
    title: "Perfect Shift",
    description:
      "Reach a score of 50,000 in a single run without losing your combo.",
    tier: "Cosmic",
    targetValue: 50000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "supernova",
    title: "Supernova",
    description: "Reach a 50x combo multiplier.",
    tier: "Void",
    targetValue: 50,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "shield_buffer",
    title: "Shield Buffer",
    description: "Survive 25 Skulls using a Shield Potion.",
    tier: "Adept",
    targetValue: 25,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "skull_dodger",
    title: "Skull Dodger",
    description: "Survive for 120 seconds in a single run without getting hit.",
    tier: "Arcane",
    targetValue: 120,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "phantom_phased",
    title: "Phantom Phased",
    description: "Dodge 20 large hazards in a single run.",
    tier: "Arcane",
    targetValue: 20,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "ghostly_perfection",
    title: "Ghostly Perfection",
    description: "Reach 100,000 score in a single run without using a Shield.",
    tier: "Cosmic",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Survive for 5 minutes (300s) in a single run.",
    tier: "Void",
    targetValue: 300,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "first_purchase",
    title: "First Purchase",
    description: "Buy an item from the Grand Artificer's shop.",
    tier: "Adept",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "sharding_success",
    title: "Sharding Success",
    description: "Collect a total of 500 Arcane Shards.",
    tier: "Arcane",
    targetValue: 500,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "swift_wizard",
    title: "Swift Wizard",
    description: "Use the Speed Boots power-up 10 times.",
    tier: "Arcane",
    targetValue: 10,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "arcane_tycoon",
    title: "Arcane Tycoon",
    description: "Collect a total of 5,000 Arcane Shards.",
    tier: "Cosmic",
    targetValue: 5000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "master_artificer",
    title: "Master Artificer",
    description: "Fully upgrade every passive boost in the shop.",
    tier: "Cosmic",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "void_vault",
    title: "The Void Vault",
    description: "Have 10,000 Arcane Shards currently stored.",
    tier: "Void",
    targetValue: 10000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "catacomb_dweller",
    title: "Catacomb Dweller",
    description: "Enter The Catacombs (Zone 4).",
    tier: "Arcane",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "astral_explorer",
    title: "Astral Explorer",
    description: "Enter The Asteroid Belt (Zone 3).",
    tier: "Arcane",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "frozen_pioneer",
    title: "Frozen Pioneer",
    description: "Enter The Frozen biome (Zone 2).",
    tier: "Adept",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "fog_walker",
    title: "Fog Walker",
    description: "Reach a score of 75,000 inside The Catacombs biome.",
    tier: "Cosmic",
    targetValue: 75000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "meteor_master",
    title: "Meteor Master",
    description: "Reach a score of 100,000 inside The Asteroid Belt biome.",
    tier: "Cosmic",
    targetValue: 100000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "slide_sorcerer",
    title: "Slide Sorcerer",
    description: "Reach a score of 125,000 inside The Frozen biome.",
    tier: "Cosmic",
    targetValue: 125000,
    currentProgress: 0,
    unlocked: false,
  },
  {
    id: "zone_dominator",
    title: "Zone Dominator",
    description: "Loop back to Zone 1 in a single run.",
    tier: "Void",
    targetValue: 1,
    currentProgress: 0,
    unlocked: false,
  },
];

let achievements = JSON.parse(localStorage.getItem("nsw_achievements"));
if (!achievements) {
  achievements = JSON.parse(JSON.stringify(achievementDefinitions));
} else {
  achievementDefinitions.forEach((def) => {
    let existing = achievements.find((a) => a.id === def.id);
    if (!existing) achievements.push(JSON.parse(JSON.stringify(def)));
    else {
      existing.title = def.title;
      existing.description = def.description;
      existing.targetValue = def.targetValue;
      existing.tier = def.tier;
    }
  });
}

let unlockedQueue = [];
let activeToast = null;
let toastTimer = 0;

function updateAchievement(id, amount, isAbsolute = false) {
  let ach = achievements.find((a) => a.id === id);
  if (!ach || ach.unlocked) return;

  if (isAbsolute) {
    ach.currentProgress = Math.max(ach.currentProgress, amount);
  } else {
    ach.currentProgress += amount;
  }

  if (ach.currentProgress >= ach.targetValue) {
    ach.currentProgress = ach.targetValue;
    ach.unlocked = true;
    unlockedQueue.push(ach);
    saveMeta();
    syncAchievementsToCloud();
  }
}

async function syncAchievementsToCloud() {
  if (!currentUser) return;
  const { error } = await supabaseClient
    .from("player_saves")
    .update({ achievements: achievements })
    .eq("user_id", currentUser.id);
}

function openAchievements() {
  switchScreen("achievementsScreen");
  populateAchievementsUI();
}

function populateAchievementsUI() {
  const list = document.getElementById("achievementsList");
  let html = "";
  achievements.forEach((ach) => {
    let opacity = ach.unlocked ? "1.0" : "0.5";
    let borderColor = ach.unlocked ? "#39ff14" : "#8a3a8a";
    let titleColor = ach.unlocked ? "#00ffff" : "#a9a9a9";

    let progressHtml = "";
    if (ach.targetValue > 1) {
      let pct = Math.min(1, ach.currentProgress / ach.targetValue) * 100;
      progressHtml = `
        <div style="width:100%; background:#111; height:6px; margin-top:8px; border:1px solid #333;">
          <div style="width:${pct}%; background:#00ffff; height:100%;"></div>
        </div>`;
    } else if (ach.unlocked) {
      progressHtml = `<div style="color:#39ff14; font-size:6px; margin-top:8px;">UNLOCKED</div>`;
    }

    html += `
      <div class="shop-item" style="opacity: ${opacity}; border-color: ${borderColor}; display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px;">
        <canvas id="ach_icon_${ach.id}" width="32" height="32" style="image-rendering: pixelated; flex-shrink: 0;"></canvas>
        <div style="flex-grow: 1;">
          <h3 style="margin: 0 0 5px 0; font-size: 10px; color: ${titleColor}; text-shadow: 1px 1px 0 #000;">${ach.title}</h3>
          <p style="margin: 0; font-size: 8px; color: #ccc; line-height: 1.4;">${ach.description}</p>
          ${progressHtml}
        </div>
      </div>`;
  });
  list.innerHTML = html;

  achievements.forEach((ach) => {
    const cvs = document.getElementById(`ach_icon_${ach.id}`);
    if (cvs) {
      let sprite =
        ach.tier === "Arcane"
          ? iconSilver
          : ach.tier === "Cosmic"
            ? iconGold
            : ach.tier === "Void"
              ? iconPlatinum
              : iconBronze;
      const ctx = cvs.getContext("2d");
      drawPixelSpriteToCtx(ctx, sprite, 0, 0, 32);
    }
  });
}

document.getElementById("menuHighScore").innerText = highScore;
document.getElementById("menuMaxCombo").innerText = maxComboAllTime;
document.getElementById("menuShards").innerText = arcaneShards;

function saveLocalOnly() {
  localStorage.setItem("nsw_highScore", highScore);
  localStorage.setItem("nsw_maxCombo", maxComboAllTime);
  localStorage.setItem("nsw_shards", arcaneShards);
  localStorage.setItem("nsw_upgrades", JSON.stringify(upgrades));
  localStorage.setItem("nsw_skins", JSON.stringify(skins));
  localStorage.setItem("nsw_activeSkin", activeSkin);
  localStorage.setItem("nsw_relics", JSON.stringify(relics));
  localStorage.setItem("nsw_activeRelic", activeRelic);
  localStorage.setItem("nsw_companions", JSON.stringify(companions));
  localStorage.setItem("nsw_activeCompanion", activeCompanion);
  localStorage.setItem("nsw_spells", JSON.stringify(spells));
  localStorage.setItem("nsw_activeSpell", activeSpell);
  localStorage.setItem("nsw_shopTutorial", hasSeenShopTutorial);
  localStorage.setItem("nsw_achievements", JSON.stringify(achievements));
  localStorage.setItem("nsw_lastSaved", new Date().toISOString());

  document.getElementById("menuShards").innerText = arcaneShards;
  document.getElementById("menuHighScore").innerText = highScore;
  document.getElementById("menuMaxCombo").innerText = maxComboAllTime;
}

function saveMeta() {
  saveLocalOnly();
  if (currentUser) {
    pushToCloud();
  }
}

function getUpgradeCost(baseCost, level) {
  return Math.floor(baseCost * Math.pow(1.2, level));
}

// --- ENGINE CONSTANTS & VARIABLES ---
const V_WIDTH = 320;
const V_HEIGHT = 480;
const NORMAL_SPEED = 300;
let score = 0;
let mouseX = V_WIDTH / 2;

let currentBiome = "default";
const biomeScores = {
  default: 0,
  frozen: 3000,
  catacombs: 7000,
  astral: 12000,
};
const biomeColors = {
  default: { r: 5, g: 5, b: 16 },
  frozen: { r: 10, g: 30, b: 50 },
  catacombs: { r: 25, g: 5, b: 15 },
  astral: { r: 20, g: 0, b: 40 },
};
let currentBgColor = { ...biomeColors.default };
let targetBgColor = { ...biomeColors.default };

const player = {
  x: V_WIDTH / 2 - 16,
  y: V_HEIGHT - 60,
  w: 32,
  h: 32,
  speed: NORMAL_SPEED,
  shieldHits: 0,
  vx: 0,
  acceleration: 1200,
  friction: 0.95,
};
let items = [];
let particles = [];
let bgStars = [];
let spawnTimer = 0;
let lastTime = performance.now();
let comboMult = 1;
let comboTimer = 0;
let baseSpeed = 150;

let rocketTimer = 0;
let magnetTimer = 0;
let laserTimer = 0;
let emberBatTimer = 0;
let allyProjectiles = [];
let keys = { left: false, right: false };

let maxComboRun = 1;
let runShards = 0;
let shakeTimer = 0;
let shakeMag = 0;
let bossRushDelay = 0;
let farStars = [];

let runTimeTimer = 0;
let noHitTimer = 0;
let lostComboThisRun = false;
let usedShieldThisRun = false;
let biomeScoresDict = { default: 0, frozen: 0, catacombs: 0, astral: 0 };
let lastFrameScore = 0;

let itemHistory = [];
let synergyTimer = 0;

let bossLevel = 0;
let nextBossScore = 1500;
let bossActive = false;
let boss = {
  x: V_WIDTH / 2 - 32,
  y: -80,
  w: 64,
  h: 64,
  hp: 5,
  maxHp: 5,
  speed: 100,
  dir: 1,
  attackTimer: 0,
  type: 0,
  wave: 0,
  teleportTimer: 0,
};

function triggerSynergy() {
  playSound("bossHit");
  triggerShake(1.0, 20);
  synergyTimer = 1.5;

  let scoreMult = activeRelic === "glass_cannon" ? 2 : 1;

  for (let i = items.length - 1; i >= 0; i--) {
    let isBad = [
      "skull",
      "phantom",
      "fireball",
      "specter",
      "bat",
      "smallBat",
      "meteor",
    ].includes(items[i].type);
    if (isBad) {
      spawnParticles(
        items[i].x + items[i].w / 2,
        items[i].y + items[i].h / 2,
        "#00ffff",
      );
      score += 100 * comboMult * scoreMult;
      items.splice(i, 1);
    }
  }
  score += 1000 * comboMult * scoreMult;
}

for (let i = 0; i < 40; i++) {
  farStars.push({
    x: Math.random() * 320,
    y: Math.random() * 480,
    size: 1,
    speed: Math.random() * 10 + 2,
  });
}
for (let i = 0; i < 30; i++) {
  bgStars.push({
    x: Math.random() * V_WIDTH,
    y: Math.random() * V_HEIGHT,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 30 + 10,
  });
}

function triggerShake(duration, magnitude) {
  shakeTimer = duration;
  shakeMag = magnitude;
}

// --- RENDER ENGINE & UTILS ---
function drawPixelSpriteToCtx(context, sprite, x, y, size) {
  const rows = sprite.length;
  if (rows === 0) return;
  const cols = sprite[0].length;
  const maxDim = Math.max(rows, cols);
  const pixelSize = size / maxDim;

  const offsetX = x + (size - cols * pixelSize) / 2;
  const offsetY = y + (size - rows * pixelSize) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colorKey = sprite[r][c];
      if (colorKey !== "tr" && colorKey !== "transparent") {
        context.fillStyle = colorKey.startsWith("#")
          ? colorKey
          : colors[colorKey] || "#ff00ff";
        context.fillRect(
          offsetX + c * pixelSize,
          offsetY + r * pixelSize,
          pixelSize + 0.5,
          pixelSize + 0.5,
        );
      }
    }
  }
}

function drawPixelSprite(sprite, x, y, size) {
  drawPixelSpriteToCtx(ctx, sprite, x, y, size);
}

function drawShopWizard() {
  const shopCanvas = document.getElementById("shopWizardCanvas");
  const shopCtx = shopCanvas.getContext("2d");

  shopCanvas.width = 128;
  shopCanvas.height = 128;

  shopCtx.clearRect(0, 0, shopCanvas.width, shopCanvas.height);

  drawPixelSpriteToCtx(shopCtx, rawShopkeeperHD, 0, 0, shopCanvas.width);
}

function drawMenuIcons() {
  const icons = [
    { id: "iconTrophy", sprite: rawTrophyIcon },
    { id: "iconCloud", sprite: rawCloudIcon },
    { id: "iconBook", sprite: rawBookIcon },
    { id: "iconGear", sprite: rawGearIcon },
  ];
  icons.forEach((icon) => {
    const canvas = document.getElementById(icon.id);
    if (canvas) {
      const iconCtx = canvas.getContext("2d");
      iconCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawPixelSpriteToCtx(iconCtx, icon.sprite, 0, 0, canvas.width);
    }
  });
}

function advanceShopDialogue() {
  if (!isShopDialogueActive) return;

  shopDialogueIndex++;
  if (shopDialogueIndex < shopTutorialLines.length) {
    document.getElementById("shopDialogue").innerHTML =
      shopTutorialLines[shopDialogueIndex] + "<span>CLICK TO CONTINUE</span>";
    playSound("bloop");
  } else {
    isShopDialogueActive = false;
    hasSeenShopTutorial = true;
    saveMeta();
    document.getElementById("shopDialogue").innerHTML =
      "Take a look around. Let me know if you need anything.";
    document.getElementById("shopDialogue").style.borderColor = "#00ffff";
    playSound("chime");
  }
}

// --- AUDIO ---
let audioCtx = null;
function initAudio() {
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

window.addEventListener("mousedown", initAudio, { once: true });
window.addEventListener("touchstart", initAudio, { once: true });
window.addEventListener("keydown", initAudio, { once: true });

function playSound(type) {
  if (!audioCtx || isMuted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;

  if (type === "bloop") {
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === "chime") {
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === "crunch") {
    osc.type = "square";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === "bossHit") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  }
}

// --- UI CONTROLS, EULA & SHOP ---
function switchScreen(screenId) {
  Object.values(screens).forEach((s) => (s.style.display = "none"));
  if (screenId) screens[screenId].style.display = "flex";
}

eulaContent.addEventListener("scroll", () => {
  if (
    eulaContent.scrollHeight - Math.ceil(eulaContent.scrollTop) <=
    eulaContent.clientHeight + 5
  ) {
    btnAgreeEula.disabled = false;
    btnAgreeEula.innerText = "I AGREE TO THE EULA";
  }
});

function showEula(isFirstTime) {
  switchScreen("eulaScreen");
  if (isFirstTime) {
    btnAgreeEula.style.display = "block";
    btnCloseEula.style.display = "none";
    btnAgreeEula.disabled = true;
    btnAgreeEula.innerText = "SCROLL TO AGREE";

    setTimeout(() => {
      if (eulaContent.scrollHeight <= eulaContent.clientHeight + 5) {
        btnAgreeEula.disabled = false;
        btnAgreeEula.innerText = "I AGREE TO THE EULA";
      }
    }, 100);
  } else {
    btnAgreeEula.style.display = "none";
    btnCloseEula.style.display = "block";
  }
}

function agreeEula() {
  localStorage.setItem("nsw_shownEula", "true");
  shownEula = true;
  if (!currentUser) {
    openAccountScreen();
  } else {
    checkTutorialAndProceed();
  }
}

function startTutorialIntro(isReplay = false) {
  isReplayingTutorial = isReplay;
  switchScreen("tutorialIntroScreen");
  const tutCanvas = document.getElementById("tutorialWizardCanvas");
  if (tutCanvas)
    drawPixelSpriteToCtx(tutCanvas.getContext("2d"), rawShopkeeperHD, 0, 0, 64);
}

function startTutorialRun() {
  switchScreen(null);
  startGame(false);
  isTutorial = true;
  tutorialStep = 1;
  tutorialTimer = 2.0;
  tutorialMessage =
    "Let's start simple. Use A/D or the Arrow keys to move around.";
}

function endTutorial() {
  if (!hasSeenTutorial && !isReplayingTutorial) {
    hasSeenTutorial = true;
    arcaneShards += 10;
    updateAchievement("initiate", 1, true);
    saveMeta();
  }
  switchScreen("mainMenuScreen");
}

async function openLeaderboard(limit = 10) {
  switchScreen("leaderboardScreen");
  const listElement = document.getElementById("leaderboardList");
  const titleElement = document.getElementById("lbTitle");
  const loadMoreBtn = document.getElementById("btnLoadMoreLb");

  if (titleElement) titleElement.innerText = `GLOBAL TOP ${limit}`;
  if (loadMoreBtn) loadMoreBtn.style.display = limit === 10 ? "block" : "none";

  listElement.innerHTML =
    '<div style="text-align:center; color:#aaa;">Summoning records...</div>';

  const { data, error } = await supabaseClient
    .from("leaderboard")
    .select("name, score")
    .eq("is_boss_rush", false)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    listElement.innerHTML =
      '<div style="color:#ff4444; text-align:center;">Couldn\'t load the records right now.</div>';
    return;
  }

  if (data.length === 0) {
    listElement.innerHTML =
      '<div style="color:#aaa; text-align:center;">No one is on the leaderboard yet!</div>';
    return;
  }

  listElement.innerHTML = data
    .map(
      (entry, i) =>
        `<div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">
            <span style="color:#fff;">${i + 1}. ${entry.name || "UNKNOWN"}</span>
            <span style="color:#ffd700;">${entry.score}</span>
        </div>`,
    )
    .join("");
}

// --- AUTHENTICATION & CLOUD SYNC LOGIC ---
async function pushToCloud() {
  if (!currentUser) return;
  const payload = {
    user_id: currentUser.id,
    high_score: highScore,
    max_combo: maxComboAllTime,
    arcane_shards: arcaneShards,
    upgrades: upgrades,
    skins: skins,
    relics: relics,
    active_skin: activeSkin,
    active_relic: activeRelic,
    companions: companions,
    active_companion: activeCompanion,
    spells: spells,
    active_spell: activeSpell,
    has_seen_tutorial: hasSeenTutorial,
    achievements: achievements,
    last_synced: new Date().toISOString(),
  };
  const { error } = await supabaseClient
    .from("player_saves")
    .upsert(payload, { onConflict: "user_id" });
  if (!error) {
    const authSyncDisplay = document.getElementById("authSyncDisplay");
    if (authSyncDisplay)
      authSyncDisplay.innerText = new Date().toLocaleString();
  }
}

async function checkCloudSync() {
  const { data, error } = await supabaseClient
    .from("player_saves")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();
  if (data) {
    const authSyncDisplay = document.getElementById("authSyncDisplay");
    if (authSyncDisplay)
      authSyncDisplay.innerText = new Date(data.last_synced).toLocaleString();

    const cloudTime = new Date(data.last_synced).getTime();
    const localTimeStr = localStorage.getItem("nsw_lastSaved");
    const localTime = localTimeStr ? new Date(localTimeStr).getTime() : 0;

    if (cloudTime > localTime) {
      window.pendingCloudData = data;
      switchScreen("cloudConflictScreen");
      return true;
    } else if (localTime > cloudTime) {
      pushToCloud();
    }
  } else {
    pushToCloud();
  }
  return false;
}

function applyCloudData(data) {
  highScore = data.high_score || 0;
  maxComboAllTime = data.max_combo || 1;
  arcaneShards = data.arcane_shards || 0;
  upgrades = data.upgrades || { potion: 0, boots: 0, magnet: 0, blast: 0 };
  skins = data.skins || { wizard: true, pyromancer: false, necromancer: false };
  relics = data.relics || {
    none: true,
    glass_cannon: false,
    lead_boots: false,
  };
  activeSkin = data.active_skin || "wizard";
  activeRelic = data.active_relic || "none";
  if (data.companions) companions = data.companions;
  if (data.active_companion) activeCompanion = data.active_companion;
  if (data.spells) spells = data.spells;
  if (data.active_spell) activeSpell = data.active_spell;
  if (data.has_seen_tutorial !== undefined)
    hasSeenTutorial = data.has_seen_tutorial;
  if (data.achievements) achievements = data.achievements;
  updateAchievement("account_sync", 1, true);

  localStorage.setItem("nsw_lastSaved", data.last_synced);
  saveLocalOnly();
  updateShopUI();
}

function acceptCloudSave() {
  applyCloudData(window.pendingCloudData);
  window.pendingCloudData = null;
  checkTutorialAndProceed();
}

function rejectCloudSave() {
  window.pendingCloudData = null;
  pushToCloud();
  checkTutorialAndProceed();
}

function checkTutorialAndProceed() {
  if (!hasSeenTutorial) {
    startTutorialIntro(false);
  } else {
    switchScreen("mainMenuScreen");
  }
}

async function manualPullFromCloud() {
  if (!currentUser) return;
  const { data, error } = await supabaseClient
    .from("player_saves")
    .select("*")
    .eq("user_id", currentUser.id)
    .single();
  if (data) {
    applyCloudData(data);
    const authSyncDisplay = document.getElementById("authSyncDisplay");
    if (authSyncDisplay)
      authSyncDisplay.innerText = new Date(data.last_synced).toLocaleString();
    alert("Cloud save loaded!");
    updateAchievement("account_sync", 1, true);
  } else {
    alert("We couldn't find a cloud save for this account.");
  }
}

function openAccountScreen() {
  switchScreen("accountScreen");
  document.getElementById("authError").style.display = "none";
  if (currentUser) {
    document.getElementById("authLoggedOut").style.display = "none";
    document.getElementById("authLoggedIn").style.display = "block";
    document.getElementById("authEmailDisplay").innerText = currentUser.email;
  } else {
    document.getElementById("authLoggedOut").style.display = "block";
    document.getElementById("authLoggedIn").style.display = "none";
  }
}

async function authLogin() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  if (!email || !password) return;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    document.getElementById("authError").innerText = error.message;
    document.getElementById("authError").style.color = "#ff4444";
    document.getElementById("authError").style.display = "block";
  } else {
    currentUser = data.user;
    syncAchievementsToCloud();
    const hasConflict = await checkCloudSync();
    if (!hasConflict) {
      openAccountScreen();
    }
  }
}

async function authRegister() {
  const email = document.getElementById("authEmail").value.trim();
  const usernameStr = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  if (!email || !usernameStr || !password) {
    document.getElementById("authError").innerText =
      "Email, username, and password are required.";
    document.getElementById("authError").style.display = "block";
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { username: usernameStr } },
  });
  if (error) {
    document.getElementById("authError").innerText = error.message;
    document.getElementById("authError").style.color = "#ff4444";
    document.getElementById("authError").style.display = "block";
  } else {
    document.getElementById("authError").innerText =
      "Account created! Go ahead and log in.";
    document.getElementById("authError").style.color = "#39ff14";
    document.getElementById("authError").style.display = "block";
  }
}

async function authLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  openAccountScreen();
}

async function submitScore() {
  if (!currentUser) return;
  const nameInput = (
    currentUser.user_metadata?.username || currentUser.email.split("@")[0]
  )
    .toUpperCase()
    .substring(0, 15);

  const submitBtn = document.getElementById("submitScoreBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "SUBMITTING...";

  const { error } = await supabaseClient.from("leaderboard").insert([
    {
      name: nameInput,
      score: score,
      max_combo: maxComboRun,
      is_boss_rush: isBossRush,
    },
  ]);

  if (error) {
    submitBtn.innerText = "ERROR! RETRY?";
    submitBtn.disabled = false;
  } else {
    submitBtn.innerText = "SCORE SECURED!";
    submitBtn.style.backgroundColor = "#39ff14";
    submitBtn.style.borderColor = "#006400";
  }
}

function updateShopUI() {
  document.getElementById("shopShards").innerText = arcaneShards;

  ["potion", "boots", "magnet", "blast"].forEach((type) => {
    let lvl = upgrades[type];
    let cost = getUpgradeCost(
      type === "potion" ? 10 : type === "blast" ? 20 : 15,
      lvl,
    );
    document.getElementById(
      "lvl" + type.charAt(0).toUpperCase() + type.slice(1),
    ).innerText = lvl;
    let btn = document.getElementById(
      "btnBuy" + type.charAt(0).toUpperCase() + type.slice(1),
    );
    btn.innerHTML = `♦ ${cost}`;
    btn.disabled = arcaneShards < cost;
  });

  document.getElementById("btnEquipWizard").innerText =
    activeSkin === "wizard" ? "EQUIPPED" : "EQUIP";
  document.getElementById("btnEquipWizard").disabled = activeSkin === "wizard";

  ["pyro", "necro"].forEach((skin) => {
    let fullSkinName = skin === "pyro" ? "pyromancer" : "necromancer";
    let btn = document.getElementById(
      "btnBuy" + skin.charAt(0).toUpperCase() + skin.slice(1),
    );
    let status = document.getElementById(
      "status" + skin.charAt(0).toUpperCase() + skin.slice(1),
    );

    if (skins[fullSkinName]) {
      status.innerText = "Owned";
      status.style.color = "#39ff14";
      btn.innerText = activeSkin === fullSkinName ? "EQUIPPED" : "EQUIP";
      btn.disabled = activeSkin === fullSkinName;
      btn.onclick = () => buySkin(fullSkinName, 0);
    } else {
      status.innerText = "Locked";
      status.style.color = "#ff4444";
      btn.innerHTML = `♦ 100`;
      btn.disabled = arcaneShards < 100;
      btn.onclick = () => buySkin(fullSkinName, 100);
    }
  });

  ["none", "glass_cannon", "lead_boots"].forEach((relic) => {
    let btn = document.getElementById("btnBuyRelic_" + relic);
    let status = document.getElementById("statusRelic_" + relic);

    if (relics[relic]) {
      if (status) {
        status.innerText = "Owned";
        status.style.color = "#39ff14";
      }
      btn.innerText = activeRelic === relic ? "EQUIPPED" : "EQUIP";
      btn.disabled = activeRelic === relic;
      btn.onclick = () => buyRelic(relic, 0);
    } else {
      if (status) {
        status.innerText = "Locked";
        status.style.color = "#ff4444";
      }
      btn.innerHTML = `♦ 10`;
      btn.disabled = arcaneShards < 10;
      btn.onclick = () => buyRelic(relic, 10);
    }
  });

  ["none", "void_wisp", "ember_bat", "chrono_snail"].forEach((comp) => {
    let btn = document.getElementById("btnBuyComp_" + comp);
    let status = document.getElementById("statusComp_" + comp);

    if (companions[comp]) {
      if (status) {
        status.innerText = "Owned";
        status.style.color = "#39ff14";
      }
      btn.innerText = activeCompanion === comp ? "EQUIPPED" : "EQUIP";
      btn.disabled = activeCompanion === comp;
      btn.onclick = () => buyCompanion(comp, 0);
    } else {
      if (status) {
        status.innerText = "Locked";
        status.style.color = "#ff4444";
      }
      let cost = comp === "void_wisp" ? 250 : comp === "ember_bat" ? 500 : 750;
      btn.innerHTML = `♦ ${cost}`;
      btn.disabled = arcaneShards < cost;
      btn.onclick = () => buyCompanion(comp, cost);
    }
  });

  ["none", "blink", "pulse"].forEach((spell) => {
    let btn = document.getElementById("btnBuySpell_" + spell);
    let status = document.getElementById("statusSpell_" + spell);

    if (spells[spell]) {
      if (status) {
        status.innerText = "Owned";
        status.style.color = "#39ff14";
      }
      btn.innerText = activeSpell === spell ? "EQUIPPED" : "EQUIP";
      btn.disabled = activeSpell === spell;
      btn.onclick = () => buySpell(spell, 0);
    } else {
      if (status) {
        status.innerText = "Locked";
        status.style.color = "#ff4444";
      }
      btn.innerHTML = `♦ 300`;
      btn.disabled = arcaneShards < 300;
      btn.onclick = () => buySpell(spell, 300);
    }
  });
}

function openShop() {
  updateShopUI();
  switchScreen("shopScreen");
  drawShopWizard();

  const dialogueBox = document.getElementById("shopDialogue");

  if (!hasSeenShopTutorial) {
    isShopDialogueActive = true;
    shopDialogueIndex = 0;
    dialogueBox.innerHTML =
      shopTutorialLines[0] + "<span>CLICK TO CONTINUE</span>";
    dialogueBox.style.borderColor = "#ff00ff";
  } else {
    isShopDialogueActive = false;
    dialogueBox.innerHTML = "Back again? What can I get for you?";
    dialogueBox.style.borderColor = "#00ffff";
  }
}

function buyUpgrade(type, baseCost) {
  let cost = getUpgradeCost(baseCost, upgrades[type]);
  if (arcaneShards >= cost) {
    arcaneShards -= cost;
    upgrades[type]++;
    playSound("chime");
    updateAchievement("first_purchase", 1, true);
    if (
      upgrades.potion >= 5 &&
      upgrades.boots >= 5 &&
      upgrades.magnet >= 5 &&
      upgrades.blast >= 5
    ) {
      updateAchievement("master_artificer", 1, true);
    }
    saveMeta();
    updateShopUI();
  }
}

function buySkin(skinId, cost) {
  if (!skins[skinId] && arcaneShards >= cost) {
    arcaneShards -= cost;
    skins[skinId] = true;
    playSound("chime");
    updateAchievement("first_purchase", 1, true);
  }
  if (skins[skinId]) {
    activeSkin = skinId;
  }
  saveMeta();
  updateShopUI();
}

function buyRelic(relicId, cost) {
  if (!relics[relicId] && arcaneShards >= cost) {
    arcaneShards -= cost;
    relics[relicId] = true;
    playSound("chime");
    updateAchievement("first_purchase", 1, true);
  }
  if (relics[relicId]) {
    activeRelic = relicId;
  }
  saveMeta();
  updateShopUI();
}

function buyCompanion(compId, cost) {
  if (!companions[compId] && arcaneShards >= cost) {
    arcaneShards -= cost;
    companions[compId] = true;
    playSound("chime");
    updateAchievement("first_purchase", 1, true);
  }
  if (companions[compId]) {
    activeCompanion = compId;
  }
  saveMeta();
  updateShopUI();
}

function buySpell(spellId, cost) {
  if (!spells[spellId] && arcaneShards >= cost) {
    arcaneShards -= cost;
    spells[spellId] = true;
    playSound("chime");
    updateAchievement("first_purchase", 1, true);
  }
  if (spells[spellId]) {
    activeSpell = spellId;
  }
  saveMeta();
  updateShopUI();
}

function openDevTools(isSecret = false) {
  const title = document.getElementById("devToolsTitle");
  const secretLb = document.getElementById("secretLbLabel");
  const screen = document.getElementById("devToolsScreen");

  if (isSecret) {
    title.innerText = "SECRET DEV TOOLS";
    title.style.color = "#ff00ff";
    screen.style.borderColor = "#ff00ff";
    secretLb.style.display = "flex";
  } else {
    title.innerText = "DEV TOOLS";
    title.style.color = "#39ff14";
    screen.style.borderColor = "#39ff14";
    secretLb.style.display = "none";
  }
  switchScreen("devToolsScreen");
}

function registerSecretClick() {
  secretClicks++;
  if (secretClicks >= 5) {
    openDevTools(false);
    secretClicks = 0;
  }
}

function registerShopkeeperClick() {
  shopkeeperClicks++;
  if (shopkeeperClicks >= 5) {
    openDevTools(true);
    shopkeeperClicks = 0;
  }
}

function toggleMute() {
  isMuted = document.getElementById("muteToggle").checked;
}
function toggleBg() {
  showBgStars = document.getElementById("bgToggle").checked;
}
function toggleInvincibility() {
  isInvincible = document.getElementById("invincibilityToggle").checked;
}
function toggleAllowInvincibleLB() {
  allowInvincibleLB = document.getElementById(
    "allowInvincibleLBToggle",
  ).checked;
}

function togglePause() {
  if (gameState !== "PLAYING" && gameState !== "PAUSED") return;

  if (gameState === "PLAYING") {
    gameState = "PAUSED";
    pauseBtn.style.display = "none";
    switchScreen("pauseScreen");
  } else {
    gameState = "PLAYING";
    pauseBtn.style.display = "block";
    switchScreen(null);
    lastTime = performance.now();
  }
}

function resize() {
  const scale = Math.min(
    window.innerWidth / V_WIDTH,
    window.innerHeight / V_HEIGHT,
  );
  canvas.width = V_WIDTH * scale;
  canvas.height = V_HEIGHT * scale;
  ctx.scale(scale, scale);
}
window.addEventListener("resize", resize);
resize();

// --- INPUT ---
function updatePointerPosition(clientX) {
  if (gameState !== "PLAYING") return;
  const rect = canvas.getBoundingClientRect();
  mouseX = (clientX - rect.left) * (V_WIDTH / rect.width) - player.w / 2;
}

window.addEventListener("mousemove", (e) => updatePointerPosition(e.clientX));
canvas.addEventListener(
  "touchstart",
  (e) => {
    updatePointerPosition(e.touches[0].clientX);
    if (e.target === canvas) e.preventDefault();
  },
  { passive: false },
);
canvas.addEventListener(
  "touchmove",
  (e) => {
    updatePointerPosition(e.touches[0].clientX);
    if (e.target === canvas) e.preventDefault();
  },
  { passive: false },
);

function castSpell() {
  if (activeSpell === "none" || spellCooldown > 0 || gameState !== "PLAYING")
    return;

  if (activeSpell === "blink") {
    spellMaxCooldown = 3.0;
    spellCooldown = spellMaxCooldown;

    let dir = Math.sign(mouseX - (player.x + player.w / 2));
    if (dir === 0) dir = 1;

    for (let i = 0; i < 15; i++)
      spawnParticles(
        player.x + Math.random() * player.w,
        player.y + Math.random() * player.h,
        "#ff00ff",
      );

    player.x += dir * 100;
    if (player.x < 0) player.x = 0;
    if (player.x > V_WIDTH - player.w) player.x = V_WIDTH - player.w;
    mouseX = player.x + player.w / 2;

    for (let i = 0; i < 15; i++)
      spawnParticles(
        player.x + Math.random() * player.w,
        player.y + Math.random() * player.h,
        "#00ffff",
      );

    playSound("chime");
    triggerShake(0.1, 3);
  } else if (activeSpell === "pulse") {
    spellMaxCooldown = 5.0;
    spellCooldown = spellMaxCooldown;
    pulseEffectTimer = 0.5;

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let isBad = [
        "skull",
        "phantom",
        "fireball",
        "specter",
        "bat",
        "smallBat",
        "meteor",
      ].includes(item.type);
      if (isBad) {
        let dx = item.x + item.w / 2 - (player.x + player.w / 2);
        let dy = item.y + item.h / 2 - (player.y + player.h / 2);
        let dist = Math.sqrt(dx * dx + dy * Math.max(0, dy));

        if (dist < 120) {
          let pushX = dx / dist || Math.random() - 0.5;
          let pushY = dy / dist || -1;
          item.vx = pushX * 300;
          item.speed = pushY * 300;
        }
      }
    }

    playSound("bossHit");
    triggerShake(0.3, 8);
  }
}

canvas.addEventListener("mousedown", (e) => {
  if (gameState === "PLAYING") castSpell();
});

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;

  if (e.code === "Backquote") {
    openDevTools(e.altKey);
  }

  if (e.code === "Space") {
    if (gameState === "PLAYING") {
      e.preventDefault();
      castSpell();
    }
  }

  if (e.code === "Escape" || e.code === "KeyP") togglePause();
  initAudio();
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
});

// --- SPAWNING LOGIC ---
function spawnItem() {
  let type = "skull",
    sprite = skullSprites[Math.floor(Math.random() * skullSprites.length)],
    w = 24,
    h = 24,
    sBase = 110,
    col = "#8b0000";
  let categoryRoll = Math.random();

  if (categoryRoll > 0.95) {
    type = "shard";
    sprite = shardSprite;
    sBase = 120;
    col = "#8a2be2";
    w = 20;
    h = 20;
  } else if (categoryRoll > 0.85) {
    let pRoll = Math.random();
    if (pRoll > 0.75 && score >= 3000) {
      type = "rocket";
      sprite = rocketSprite;
      sBase = 140;
      col = "#39ff14";
    } else if (pRoll > 0.5 && score >= 2000) {
      type = "blast";
      sprite = blastSprite;
      sBase = 140;
      col = "#ff4444";
    } else if (pRoll > 0.25 && score >= 800) {
      type = "magnet";
      sprite = magnetSprite;
      sBase = 140;
      col = "#ff00ff";
    } else {
      type = "potion";
      sprite = potionSprite;
      sBase = 130;
      col = "#00ffff";
    }
  } else if (categoryRoll > 0.6) {
    if (Math.random() > 0.5 && score >= 200) {
      type = "comet";
      sprite = cometSprite;
      w = 28;
      h = 28;
      sBase = 220;
      col = "#ffd700";
    } else {
      type = "star";
      sprite = starSprite;
      sBase = 120;
      col = "#ffffff";
    }
  } else {
    let eRoll = Math.random();
    if (eRoll > 0.85 && score >= 2500) {
      type = "bat";
      sprite = batSprite;
      sBase = 120;
      col = "#a9a9a9";
    } else if (eRoll > 0.65 && score >= 1100) {
      type = "specter";
      sprite = specterSprite;
      sBase = 75;
      col = "#ffffff";
    } else if (eRoll > 0.35 && score >= 500) {
      type = "phantom";
      sprite =
        phantomVariants[Math.floor(Math.random() * phantomVariants.length)];
      sBase = 100;
      col = "#6a31a1";
    } else {
      type = "skull";
      sprite = skullSprites[Math.floor(Math.random() * skullSprites.length)];
      sBase = 110;
      col = "#8b0000";
    }
  }

  let spawnX = Math.random() * (V_WIDTH - w);
  let spawnVx = 0;

  if (currentBiome === "astral" && type === "skull" && Math.random() > 0.5) {
    type = "meteor";
    sprite = cometSprite;
    w = 28;
    h = 28;
    sBase = 250;
    col = "#ff4444";
    let spawnLeft = Math.random() > 0.5;
    spawnX = spawnLeft ? -30 : V_WIDTH + 30;
    spawnVx = spawnLeft ? 150 : -150;
  }

  items.push({
    x: spawnX,
    y: -30,
    w: w,
    h: h,
    type: type,
    sprite: sprite,
    speed: sBase * (baseSpeed / 100),
    color: col,
    wave: Math.random() * Math.PI * 2,
    vx: spawnVx,
    split: false,
  });
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 120 + 50;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5,
      color: color,
    });
  }
}

function processGameOver(aborted = false) {
  if (!aborted) {
    playSound("crunch");
    triggerShake(0.4, 15);
  }
  gameState = "MENU";
  pauseBtn.style.display = "none";

  gameOverTitle.innerText = aborted ? "GIVING UP?" : "YOU DIED!";
  gameOverTitle.style.color = aborted ? "#a9a9a9" : "#ff4444";

  let isNewRecord = false;

  if (!aborted) {
    if (!isBossRush && score > highScore) {
      highScore = score;
      isNewRecord = true;
    }
    if (!isBossRush && maxComboRun > maxComboAllTime) {
      maxComboAllTime = maxComboRun;
    }
    saveMeta();
  }

  updateAchievement("night_shift_beginner", score);
  updateAchievement("wizard_scholar", score);
  if (!lostComboThisRun && score >= 50000)
    updateAchievement("perfect_shift", 1, true);
  if (!usedShieldThisRun && score >= 100000)
    updateAchievement("ghostly_perfection", 1, true);

  finalScoreText.innerText = `Final Score: ${score}`;
  finalComboText.innerText = `Max Combo: x${maxComboRun}`;
  finalShardsText.innerText = `Shards Found: ${runShards}`;
  newRecordAlert.style.display = isNewRecord ? "block" : "none";

  const submitBtn = document.getElementById("submitScoreBtn");

  if (
    !aborted &&
    !isBossRush &&
    score > 0 &&
    (!isInvincible || allowInvincibleLB)
  ) {
    submitBtn.style.display = "block";
    submitBtn.disabled = false;
    submitBtn.innerText = "SUBMIT TO GLOBAL";
    submitBtn.style.backgroundColor = "#008b8b";
    submitBtn.style.borderColor = "#00ffff";
  } else {
    submitBtn.style.display = "none";
  }

  switchScreen("gameOverScreen");
}

function startGame(rushMode = false) {
  initAudio();
  isTutorial = false;
  isBossRush = rushMode;
  score = 0;
  maxComboRun = 1;
  items = [];
  particles = [];
  runShards = 0;

  itemHistory = [];
  synergyTimer = 0;

  player.x = V_WIDTH / 2 - 16;
  mouseX = V_WIDTH / 2;
  player.shieldHits = 0;
  player.vx = 0;
  currentBiome = "default";
  currentBgColor = { ...biomeColors.default };
  targetBgColor = { ...biomeColors.default };
  comboMult = 1;
  comboTimer = 0;
  baseSpeed = 150;
  player.speed =
    activeRelic === "lead_boots" ? NORMAL_SPEED * 0.7 : NORMAL_SPEED;

  rocketTimer = 0;
  magnetTimer = 0;
  laserTimer = 0;
  shakeTimer = 0;
  emberBatTimer = 0;
  allyProjectiles = [];
  spellCooldown = 0;
  pulseEffectTimer = 0;
  keys = { left: false, right: false };

  runTimeTimer = 0;
  noHitTimer = 0;
  lostComboThisRun = false;
  usedShieldThisRun = false;
  biomeScoresDict = { default: 0, frozen: 0, catacombs: 0, astral: 0 };
  lastFrameScore = 0;

  bossLevel = 0;
  bossActive = false;
  nextBossScore = 1500;

  switchScreen(null);
  bossWarning.style.display = "none";
  newRecordAlert.style.display = "none";
  pauseBtn.style.display = "block";

  if (isBossRush) bossRushDelay = 1.0;

  lastTime = performance.now();
  gameState = "PLAYING";
}

function spawnBoss() {
  bossActive = true;
  boss.type = bossLevel % bossSprites.length;
  boss.maxHp = (isBossRush ? 8 : 5) + bossLevel * 2;
  boss.hp = boss.maxHp;
  boss.y = -80;
  boss.wave = 0;
  boss.teleportTimer = 0;
  bossWarning.style.display = "block";
  setTimeout(() => (bossWarning.style.display = "none"), 2000);
  playSound("bossHit");
  triggerShake(0.5, 5);
}

// --- MAIN GAME LOOP ---
function update(timestamp) {
  let dt = (timestamp - lastTime) / 1000 || 0.016;
  if (dt > 0.1) dt = 0.1;
  lastTime = timestamp;

  if (gameState === "PAUSED") {
    requestAnimationFrame(update);
    return;
  }

  if (showBgStars) {
    let spaceSpeedMult = rocketTimer > 0 ? 5 : 1;
    farStars.forEach((s) => {
      s.y += s.speed * dt * spaceSpeedMult;
      if (s.y > V_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * V_WIDTH;
      }
    });
    bgStars.forEach((s) => {
      s.y += s.speed * dt * spaceSpeedMult;
      if (s.y > V_HEIGHT) {
        s.y = 0;
        s.x = Math.random() * V_WIDTH;
      }
    });
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.9;
    p.vy *= 0.9;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (shakeTimer > 0) shakeTimer -= dt;
  if (synergyTimer > 0) synergyTimer -= dt;
  if (spellCooldown > 0) spellCooldown -= dt;
  if (pulseEffectTimer > 0) pulseEffectTimer -= dt;

  currentBgColor.r += (targetBgColor.r - currentBgColor.r) * dt * 0.5;
  currentBgColor.g += (targetBgColor.g - currentBgColor.g) * dt * 0.5;
  currentBgColor.b += (targetBgColor.b - currentBgColor.b) * dt * 0.5;

  if (unlockedQueue.length > 0 && !activeToast) {
    activeToast = unlockedQueue.shift();
    toastTimer = 180;
  }
  if (toastTimer > 0) {
    toastTimer -= dt * 60;
    if (toastTimer <= 0) activeToast = null;
  }

  if (gameState !== "PLAYING") {
    render();
    requestAnimationFrame(update);
    return;
  }

  let scoreDelta = score - lastFrameScore;
  if (scoreDelta > 0) {
    biomeScoresDict[currentBiome] += scoreDelta;
    if (biomeScoresDict["frozen"] >= 75000)
      updateAchievement("slide_sorcerer", 1, true);
    if (biomeScoresDict["catacombs"] >= 100000)
      updateAchievement("fog_walker", 1, true);
    if (biomeScoresDict["astral"] >= 125000)
      updateAchievement("meteor_master", 1, true);
  }
  lastFrameScore = score;

  runTimeTimer += dt;
  noHitTimer += dt;
  if (noHitTimer >= 120) updateAchievement("skull_dodger", 1, true);
  if (runTimeTimer >= 300) updateAchievement("night_owl", 1, true);

  let worldDt = dt;
  if (rocketTimer > 0) {
    rocketTimer -= dt;
    worldDt = dt * 5;
    if (Math.random() > 0.3)
      spawnParticles(player.x + player.w / 2, player.y + player.h, "#39ff14");
  }

  if (activeCompanion === "ember_bat" && gameState === "PLAYING") {
    emberBatTimer += worldDt;
    if (emberBatTimer > 2.5) {
      emberBatTimer = 0;
      allyProjectiles.push({
        x: player.x - 16,
        y: player.y,
        w: 12,
        h: 12,
        speed: 250,
        sprite: allyFireballSprite,
      });
      playSound("bloop");
    }
  }

  for (let i = allyProjectiles.length - 1; i >= 0; i--) {
    let p = allyProjectiles[i];
    p.y -= p.speed * worldDt;
    let hitHazard = false;
    for (let j = items.length - 1; j >= 0; j--) {
      let item = items[j];
      let isBad = [
        "skull",
        "phantom",
        "fireball",
        "specter",
        "bat",
        "smallBat",
        "meteor",
      ].includes(item.type);
      if (
        isBad &&
        p.x < item.x + item.w &&
        p.x + p.w > item.x &&
        p.y < item.y + item.h &&
        p.y + p.h > item.y
      ) {
        spawnParticles(item.x + item.w / 2, item.y + item.h / 2, "#ff4444");
        score += 20 * comboMult * (activeRelic === "glass_cannon" ? 2 : 1);
        items.splice(j, 1);
        hitHazard = true;
        break;
      }
    }
    if (hitHazard || p.y < -50) allyProjectiles.splice(i, 1);
  }

  if (magnetTimer > 0) magnetTimer -= dt;
  if (laserTimer > 0) laserTimer -= dt;
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) comboMult = 1;
  }

  if (currentBiome === "frozen") {
    if (keys.left) player.vx -= player.acceleration * dt;
    else if (keys.right) player.vx += player.acceleration * dt;
    else player.vx *= player.friction;

    if (player.vx > player.speed) player.vx = player.speed;
    if (player.vx < -player.speed) player.vx = -player.speed;

    player.x += player.vx * dt;
    mouseX = player.x;
  } else {
    player.vx = 0;
    if (keys.left) {
      player.x -= player.speed * dt;
      mouseX = player.x;
    } else if (keys.right) {
      player.x += player.speed * dt;
      mouseX = player.x;
    } else {
      player.x += (mouseX - player.x) * (player.speed / 50) * dt;
    }
  }

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
    mouseX = 0;
  }
  if (player.x > V_WIDTH - player.w) {
    player.x = V_WIDTH - player.w;
    player.vx = 0;
    mouseX = V_WIDTH - player.w;
  }

  if (comboMult > maxComboRun) maxComboRun = comboMult;

  if (!isBossRush && !isTutorial) {
    let newBiome = "default";
    if (score >= biomeScores.astral) newBiome = "astral";
    else if (score >= biomeScores.catacombs) newBiome = "catacombs";
    else if (score >= biomeScores.frozen) newBiome = "frozen";

    if (newBiome !== currentBiome) {
      currentBiome = newBiome;
      targetBgColor = biomeColors[newBiome];
      playSound("bossHit");
      triggerShake(0.3, 5);

      if (newBiome === "catacombs")
        updateAchievement("catacomb_dweller", 1, true);
      if (newBiome === "astral") updateAchievement("astral_explorer", 1, true);
      if (newBiome === "frozen") updateAchievement("frozen_pioneer", 1, true);
      if (newBiome === "default" && score > 1000)
        updateAchievement("zone_dominator", 1, true);
    }
  }

  if (isBossRush) {
    if (!bossActive) {
      bossRushDelay -= dt;
      if (bossRushDelay <= 0) spawnBoss();
    }
  } else {
    if (score >= nextBossScore && !bossActive) spawnBoss();
  }

  if (bossActive) {
    let isEnraged = boss.hp <= 2;
    let bBehavior = boss.type % 4;

    if (boss.y < 20) {
      boss.y += 50 * worldDt;
    } else {
      if (bBehavior === 0) {
        boss.x += boss.speed * (isEnraged ? 1.5 : 1) * boss.dir * worldDt;
        if (boss.x < 0 || boss.x > V_WIDTH - boss.w) boss.dir *= -1;
      } else if (bBehavior === 1) {
        boss.wave += worldDt * (isEnraged ? 2.5 : 1.5);
        boss.x = V_WIDTH / 2 - boss.w / 2 + Math.sin(boss.wave * 1.5) * 100;
      } else if (bBehavior === 2) {
        boss.x += boss.speed * (isEnraged ? 2.5 : 1.5) * boss.dir * worldDt;
        if (boss.x < 0 || boss.x > V_WIDTH - boss.w) boss.dir *= -1;
        boss.wave += worldDt * (isEnraged ? 8 : 4);
        boss.y = 20 + Math.abs(Math.sin(boss.wave)) * 60;
      } else if (bBehavior === 3) {
        boss.teleportTimer += worldDt;
        if (boss.teleportTimer > (isEnraged ? 1.5 : 2.5)) {
          boss.x = Math.random() * (V_WIDTH - boss.w);
          boss.teleportTimer = 0;
          spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, "#808080");
        }
      }
      boss.attackTimer += worldDt;
      let atkRate = Math.max(0.4, 0.8 - bossLevel * 0.05);
      if (isEnraged) atkRate *= 0.75;
      if (boss.attackTimer > atkRate) {
        boss.attackTimer = 0;
        let isWeakness = Math.random() > 0.85;
        if (isWeakness) {
          items.push({
            x: boss.x + boss.w / 2 - 12,
            y: boss.y + boss.h,
            w: 24,
            h: 24,
            type: "holyStar",
            sprite: holyStarSprite,
            speed: 130,
            vx: 0,
            color: "#00ffff",
          });
        } else {
          if (bBehavior === 0) {
            if (isEnraged) {
              items.push({
                x: boss.x + boss.w / 2 - 20,
                y: boss.y + boss.h,
                w: 24,
                h: 24,
                type: "fireball",
                sprite: fireballSprite,
                speed: 220,
                vx: -30,
                color: "#ff4444",
              });
              items.push({
                x: boss.x + boss.w / 2 + 4,
                y: boss.y + boss.h,
                w: 24,
                h: 24,
                type: "fireball",
                sprite: fireballSprite,
                speed: 220,
                vx: 30,
                color: "#ff4444",
              });
            } else {
              items.push({
                x: boss.x + boss.w / 2 - 12,
                y: boss.y + boss.h,
                w: 24,
                h: 24,
                type: "fireball",
                sprite: fireballSprite,
                speed: 220,
                vx: 0,
                color: "#ff4444",
              });
            }
          } else if (bBehavior === 1) {
            let spread = isEnraged ? 110 : 80;
            for (let j = -1; j <= 1; j++)
              items.push({
                x: boss.x + boss.w / 2 - 12,
                y: boss.y + boss.h,
                w: 24,
                h: 24,
                type: "fireball",
                sprite: fireballSprite,
                speed: isEnraged ? 250 : 200,
                vx: j * spread,
                color: "#8a2be2",
              });
          } else if (bBehavior === 2) {
            let randomPhantom =
              phantomVariants[
                Math.floor(Math.random() * phantomVariants.length)
              ];
            items.push({
              x: boss.x + boss.w / 2 - 12,
              y: boss.y + boss.h,
              w: 24,
              h: 24,
              type: "phantom",
              sprite: randomPhantom,
              speed: isEnraged ? 200 : 160,
              wave: Math.random() * Math.PI,
              vx: 0,
              color: "#006400",
            });
          } else if (bBehavior === 3) {
            let gap = Math.floor(Math.random() * 5);
            let stagger = Math.floor(Math.random() * 3);
            let wSpd = isEnraged ? 260 : 160;
            for (let k = 0; k < 5; k++) {
              if (k !== gap) {
                let yOff =
                  stagger === 0
                    ? k * 28
                    : stagger === 1
                      ? (4 - k) * 28
                      : Math.abs(2 - k) * 25;
                items.push({
                  x: (V_WIDTH / 5) * k + 10,
                  y: boss.y + boss.h - yOff,
                  w: 24,
                  h: 24,
                  type: "skull",
                  sprite:
                    skullSprites[
                      Math.floor(Math.random() * skullSprites.length)
                    ],
                  speed: wSpd,
                  vx: 0,
                  color: "#a9a9a9",
                });
              }
            }
          }
        }
      }
    }
  } else {
    if (isTutorial) {
      if (tutorialTimer > 0) {
        tutorialTimer -= worldDt;
        if (tutorialTimer <= 0) {
          if (tutorialStep === 1 || tutorialStep === 2) {
            items.push({
              x: V_WIDTH / 2 - 12,
              y: -30,
              w: 24,
              h: 24,
              type: "star",
              sprite: starSprite,
              speed: 100,
              vx: 0,
              color: "#ffffff",
            });
            tutorialStep = 1;
          } else if (tutorialStep === 3) {
            tutorialMessage = "Watch out! Dodge the red skulls.";
            tutorialTimer = 2;
            tutorialStep = 4;
          } else if (tutorialStep === 4 || tutorialStep === 5) {
            items.push({
              x: V_WIDTH / 2 - 12,
              y: -30,
              w: 24,
              h: 24,
              type: "skull",
              sprite: skullSprites[0],
              speed: 100,
              vx: 0,
              color: "#8b0000",
            });
            tutorialStep = 4;
          } else if (tutorialStep === 6) {
            tutorialMessage =
              "Grab those purple Arcane Shards. They're your pay around here.";
            tutorialTimer = 2;
            tutorialStep = 7;
          } else if (tutorialStep === 7 || tutorialStep === 8) {
            items.push({
              x: V_WIDTH / 2 - 10,
              y: -30,
              w: 20,
              h: 20,
              type: "shard",
              sprite: shardSprite,
              speed: 100,
              vx: 0,
              color: "#8a2be2",
            });
            tutorialStep = 7;
          } else if (tutorialStep === 9) {
            tutorialMessage = "Catch that potion, it'll save your life!";
            tutorialTimer = 2;
            tutorialStep = 10;
          } else if (tutorialStep === 10 || tutorialStep === 11) {
            items.push({
              x: V_WIDTH / 2 - 12,
              y: -30,
              w: 24,
              h: 24,
              type: "potion",
              sprite: potionSprite,
              speed: 100,
              vx: 0,
              color: "#00ffff",
            });
            tutorialStep = 10;
          } else if (tutorialStep === 12) {
            for (let k = 0; k < V_WIDTH / 26; k++) {
              items.push({
                x: k * 26,
                y: -30,
                w: 24,
                h: 24,
                type: "skull",
                sprite: skullSprites[0],
                speed: 120,
                vx: 0,
                color: "#8b0000",
              });
            }
          } else if (tutorialStep === 13) {
            gameState = "MENU";
            switchScreen("tutorialOutroScreen");
            const tutOutCanvas = document.getElementById(
              "tutorialWizardOutroCanvas",
            );
            if (tutOutCanvas)
              drawPixelSpriteToCtx(
                tutOutCanvas.getContext("2d"),
                rawShopkeeperHD,
                0,
                0,
                64,
              );
          }
        }
      }
    } else {
      spawnTimer += worldDt;
      if (spawnTimer > Math.max(0.3, 0.8 - score / 5000)) {
        spawnItem();
        spawnTimer = 0;
      }
    }
  }

  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    let isBad = [
      "skull",
      "phantom",
      "fireball",
      "specter",
      "bat",
      "smallBat",
      "meteor",
    ].includes(item.type);
    let speedMult = activeCompanion === "chrono_snail" && isBad ? 0.75 : 1;

    item.y += item.speed * worldDt * speedMult;
    item.x += (item.vx || 0) * worldDt * speedMult;

    if (item.type === "phantom") {
      item.wave += worldDt * 5;
      item.x += Math.sin(item.wave) * 150 * worldDt;
    }
    if (item.type === "specter" && item.y < V_HEIGHT * 0.6) {
      item.x += Math.sign(player.x - item.x) * 40 * worldDt;
    }
    if (activeCompanion === "void_wisp" && item.type === "shard") {
      item.x += Math.sign(player.x - item.x) * 120 * dt;
      item.y += Math.sign(player.y - item.y) * 120 * dt;
    }
    if (item.type === "bat" && item.y > V_HEIGHT * 0.35 && !item.split) {
      items.push({
        x: item.x,
        y: item.y,
        w: 16,
        h: 16,
        type: "smallBat",
        sprite: batSprite,
        speed: item.speed * 1.3,
        vx: -100,
        color: item.color,
      });
      items.push({
        x: item.x + 8,
        y: item.y,
        w: 16,
        h: 16,
        type: "smallBat",
        sprite: batSprite,
        speed: item.speed * 1.3,
        vx: 100,
        color: item.color,
      });
      spawnParticles(item.x + 12, item.y + 12, "#ff4444");
      items.splice(i, 1);
      continue;
    }
    if (
      magnetTimer > 0 &&
      ["star", "comet", "holyStar", "shard"].includes(item.type)
    )
      item.x += Math.sign(player.x - item.x) * 150 * dt;

    let scoreMult = activeRelic === "glass_cannon" ? 2 : 1;

    if (
      laserTimer > 0 &&
      item.x < player.x + 20 &&
      item.x + item.w > player.x + 12 &&
      item.y < player.y
    ) {
      if (isBad) {
        spawnParticles(item.x + item.w / 2, item.y + item.h / 2, "#ff4444");
        items.splice(i, 1);
        score += 20 * comboMult * scoreMult;
        continue;
      }
    }

    let hitPad = isBad ? 6 : -6;
    let hit = {
      x: item.x + hitPad,
      y: item.y + hitPad,
      w: item.w - hitPad * 2,
      h: item.h - hitPad * 2,
    };

    if (
      player.x < hit.x + hit.w &&
      player.x + player.w > hit.x &&
      player.y < hit.y + hit.h &&
      player.y + player.h > hit.y
    ) {
      if (isBad) {
        if (isTutorial) {
          if (tutorialStep === 4) {
            tutorialMessage =
              "Ouch. Try again, and actually dodge it this time!";
            spawnParticles(item.x + item.w / 2, item.y + item.h / 2, "#8b0000");
            playSound("crunch");
            items.splice(i, 1);
            tutorialTimer = 2;
            tutorialStep = 5;
          } else if (tutorialStep === 12) {
            if (player.shieldHits > 0) {
              player.shieldHits--;
              playSound("crunch");
              spawnParticles(
                item.x + item.w / 2,
                item.y + item.h / 2,
                "#00ffff",
              );
              triggerShake(0.3, 8);
              items = [];
              tutorialMessage =
                "Potions shield you. Boots make you fast. Jewels pull in loot. Lasers... well, lasers destroy everything.";
              tutorialTimer = 5;
              tutorialStep = 13;
              break;
            }
          }
          continue;
        } else if (activeRelic === "lead_boots" && item.type === "skull") {
          playSound("crunch");
          spawnParticles(item.x + item.w / 2, item.y + item.h / 2, "#a9a9a9");
          score += 20 * comboMult * scoreMult;
          triggerShake(0.1, 2);
          items.splice(i, 1);
        } else if (rocketTimer > 0 || isInvincible) {
          playSound("crunch");
          spawnParticles(
            item.x + item.w / 2,
            item.y + item.h / 2,
            isInvincible ? "#a9a9a9" : "#39ff14",
          );
          score += 50 * comboMult * scoreMult;
          triggerShake(0.1, 3);
          items.splice(i, 1);
        } else if (player.shieldHits > 0) {
          player.shieldHits--;
          noHitTimer = 0;
          playSound("crunch");
          spawnParticles(item.x + item.w / 2, item.y + item.h / 2, "#00ffff");
          triggerShake(0.3, 8);
          updateAchievement("shield_buffer", 1);
          items.splice(i, 1);
        } else {
          processGameOver();
          requestAnimationFrame(update);
          return;
        }
      } else {
        if (isTutorial) {
          if (item.type === "star" && tutorialStep === 1) {
            tutorialMessage =
              "Nice catch. Stars boost your score, and comets build your combo.";
            tutorialTimer = 4;
            tutorialStep = 3;
          } else if (item.type === "shard" && tutorialStep === 7) {
            tutorialMessage =
              "Keep those Shards safe! Even if you mess up, you keep them to spend in my shop.";
            tutorialTimer = 4;
            tutorialStep = 9;
          } else if (item.type === "potion" && tutorialStep === 10) {
            player.shieldHits = 1;
            tutorialMessage = "Good. Now brace yourself!";
            tutorialTimer = 2;
            tutorialStep = 12;
          }
          spawnParticles(item.x + item.w / 2, item.y + item.h / 2, item.color);
          items.splice(i, 1);
          continue;
        }
        if (["potion", "star", "magnet"].includes(item.type)) {
          itemHistory.push(item.type);
          if (itemHistory.length > 3) itemHistory.shift();
          if (itemHistory.join(",") === "potion,star,magnet") {
            triggerSynergy();
            itemHistory = [];
          }
        }

        if (item.type === "star") score += 10 * comboMult * scoreMult;
        if (item.type === "comet") score += 50 * comboMult * scoreMult;
        if (item.type === "shard") {
          runShards++;
          arcaneShards++;
          playSound("chime");
          score += 100 * comboMult * scoreMult;
          document.getElementById("menuShards").innerText = arcaneShards;
          updateAchievement("sharding_success", 1);
          updateAchievement("arcane_tycoon", 1);
          if (arcaneShards >= 10000) updateAchievement("void_vault", 1, true);
        }
        if (item.type === "holyStar") {
          playSound("bossHit");
          boss.hp--;
          spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, "#00ffff");
          triggerShake(0.1, 4);
          if (boss.hp <= 0) {
            bossActive = false;
            score += 500 * comboMult * scoreMult;
            bossLevel++;
            baseSpeed += 15;
            playSound("chime");
            spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, "#ffd700");
            triggerShake(0.5, 12);
            if (isBossRush) bossRushDelay = 2.5;
            else nextBossScore = score + 1500;
          }
        } else if (item.type === "potion") {
          if (activeRelic !== "glass_cannon") {
            player.shieldHits = 1 + upgrades.potion;
            usedShieldThisRun = true;
          } else {
            score += 50 * comboMult * scoreMult;
          }
          playSound("chime");
        } else if (item.type === "rocket") {
          rocketTimer = 5.0 + upgrades.boots * 1.5;
          playSound("chime");
          updateAchievement("swift_wizard", 1);
        } else if (item.type === "magnet") {
          magnetTimer = 5.0 + upgrades.magnet * 1.5;
          playSound("chime");
        } else if (item.type === "blast") {
          laserTimer = 2.0 + upgrades.blast * 0.8;
          playSound("bossHit");
          triggerShake(0.2, 5);
        } else {
          playSound("bloop");
          comboMult++;
          comboTimer = 3.0;
          baseSpeed += 1;
          updateAchievement("astral_combo", comboMult, true);
          updateAchievement("overdrive", comboMult, true);
          updateAchievement("supernova", comboMult, true);
        }

        spawnParticles(item.x + item.w / 2, item.y + item.h / 2, item.color);
        items.splice(i, 1);
        continue;
      }
    }

    if (
      item.y > V_HEIGHT ||
      item.y < -200 ||
      item.x < -100 ||
      item.x > V_WIDTH + 100
    ) {
      if (
        item.y > V_HEIGHT &&
        (item.type === "star" || item.type === "comet")
      ) {
        comboMult = 1;
        comboTimer = 0;
        lostComboThisRun = true;
      }
      if (isTutorial && item.y > V_HEIGHT) {
        if (item.type === "star" && tutorialStep === 1) {
          tutorialMessage = "You missed it! Try again.";
          tutorialTimer = 2;
          tutorialStep = 2;
        } else if (item.type === "skull" && tutorialStep === 4) {
          tutorialMessage =
            "One hit from a skull and you're done. Phantoms and bats will keep you on your toes.";
          tutorialTimer = 4;
          tutorialStep = 6;
        } else if (item.type === "shard" && tutorialStep === 7) {
          tutorialMessage = "Don't let your hard-earned pay drop! Try again.";
          tutorialTimer = 2;
          tutorialStep = 8;
        } else if (item.type === "potion" && tutorialStep === 10) {
          tutorialMessage = "You really need this potion. Try again.";
          tutorialTimer = 2;
          tutorialStep = 11;
        }
      }
      if (item.type === "phantom") updateAchievement("phantom_phased", 1);
      items.splice(i, 1);
    }
  }

  render();
  requestAnimationFrame(update);
}

function render() {
  ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);
  ctx.save();

  ctx.fillStyle = `rgb(${Math.round(currentBgColor.r)}, ${Math.round(currentBgColor.g)}, ${Math.round(currentBgColor.b)})`;
  ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

  if (shakeTimer > 0) {
    const dx = (Math.random() - 0.5) * shakeMag;
    const dy = (Math.random() - 0.5) * shakeMag;
    ctx.translate(dx, dy);
  }

  if (showBgStars) {
    ctx.fillStyle = "#444466";
    farStars.forEach((s) => {
      ctx.globalAlpha = 0.5;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.fillStyle = "#ffffff";
    bgStars.forEach((s) => {
      ctx.globalAlpha = 0.3;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1.0;
  }

  if (laserTimer > 0 && gameState === "PLAYING") {
    ctx.fillStyle = "rgba(255, 68, 68, 0.8)";
    ctx.fillRect(player.x + 8, 0, 16, player.y + 16);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(player.x + 12, 0, 8, player.y + 16);
  }

  if (player.shieldHits > 0 && gameState === "PLAYING") {
    ctx.beginPath();
    ctx.arc(
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 1.4,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = player.shieldHits > 1 ? "#ff00ff" : "#00ffff";
    ctx.lineWidth = 2 + (player.shieldHits - 1);
    ctx.stroke();
  }

  let currentSprite = wizardSprite;
  if (activeSkin === "pyromancer") currentSprite = pyroSprite;
  else if (activeSkin === "necromancer") currentSprite = necroSprite;

  if (gameState === "PLAYING")
    drawPixelSpriteToCtx(ctx, currentSprite, player.x, player.y, player.w);
  items.forEach((item) =>
    drawPixelSpriteToCtx(ctx, item.sprite, item.x, item.y, item.w),
  );

  allyProjectiles.forEach((p) =>
    drawPixelSpriteToCtx(ctx, p.sprite, p.x, p.y, p.w),
  );
  if (activeCompanion !== "none" && gameState === "PLAYING") {
    let compSprite = wispSprite;
    if (activeCompanion === "ember_bat") compSprite = friendlyBatSprite;
    else if (activeCompanion === "chrono_snail") compSprite = snailSprite;
    drawPixelSpriteToCtx(
      ctx,
      compSprite,
      player.x - 22,
      player.y + 10 + Math.sin(performance.now() / 200) * 4,
      16,
    );
  }

  if (bossActive && boss.y > -boss.h) {
    drawPixelSpriteToCtx(ctx, bossSprites[boss.type], boss.x, boss.y, boss.w);
    ctx.fillStyle = "#333";
    ctx.fillRect(boss.x, boss.y - 10, boss.w, 6);
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(boss.x, boss.y - 10, boss.w * (boss.hp / boss.maxHp), 6);
  }

  if (pulseEffectTimer > 0) {
    ctx.beginPath();
    let radius = 120 * (1 - pulseEffectTimer / 0.5);
    ctx.arc(
      player.x + player.w / 2,
      player.y + player.h / 2,
      radius,
      0,
      Math.PI * 2,
    );
    ctx.strokeStyle = `rgba(0, 255, 255, ${pulseEffectTimer / 0.5})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  if (activeSpell !== "none" && gameState === "PLAYING") {
    ctx.fillStyle = "#333";
    ctx.fillRect(player.x, player.y + player.h + 4, player.w, 4);
    if (spellCooldown <= 0) {
      ctx.fillStyle = "#00ffff";
      ctx.fillRect(player.x, player.y + player.h + 4, player.w, 4);
    } else {
      ctx.fillStyle = "#ff00ff";
      ctx.fillRect(
        player.x,
        player.y + player.h + 4,
        player.w * (1 - spellCooldown / spellMaxCooldown),
        4,
      );
    }
  }

  particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / 0.5);
    ctx.fillRect(p.x, p.y, 4, 4);
  });
  ctx.globalAlpha = 1.0;

  if (currentBiome === "catacombs") {
    let breath = Math.sin(performance.now() / 1000) * 20;
    let fog = ctx.createLinearGradient(breath, 0, -breath, V_HEIGHT / 2);
    fog.addColorStop(0, "rgba(25, 5, 15, 0.95)");
    fog.addColorStop(1, "rgba(25, 5, 15, 0.0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT / 2 + 20);
  }

  if (synergyTimer > 0) {
    ctx.fillStyle = `rgba(0, 255, 255, ${Math.min(0.8, synergyTimer)})`;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    ctx.fillStyle = "#fff";
    ctx.font = "16px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("SYNERGY", V_WIDTH / 2, V_HEIGHT / 2 - 10);
    ctx.fillText("BURST!", V_WIDTH / 2, V_HEIGHT / 2 + 15);
  }

  if (isTutorial && tutorialMessage) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, V_HEIGHT / 2 - 35, V_WIDTH, 70);
    ctx.fillStyle = "#fff";
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    let words = tutorialMessage.split(" ");
    let lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      if (currentLine.length + words[i].length + 1 < 30) {
        currentLine += " " + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    for (let j = 0; j < lines.length; j++) {
      ctx.fillText(
        lines[j],
        V_WIDTH / 2,
        V_HEIGHT / 2 - lines.length * 6 + 12 + j * 16,
      );
    }
    ctx.shadowColor = "transparent";
  }

  ctx.restore();

  if (activeToast) {
    ctx.fillStyle = "rgba(10, 5, 20, 0.9)";
    ctx.fillRect(V_WIDTH / 2 - 120, 10, 240, 45);
    ctx.strokeStyle = "#39ff14";
    ctx.lineWidth = 2;
    ctx.strokeRect(V_WIDTH / 2 - 120, 10, 240, 45);

    let sprite =
      activeToast.tier === "Arcane"
        ? iconSilver
        : activeToast.tier === "Cosmic"
          ? iconGold
          : activeToast.tier === "Void"
            ? iconPlatinum
            : iconBronze;
    drawPixelSpriteToCtx(ctx, sprite, V_WIDTH / 2 - 110, 16, 32);

    ctx.fillStyle = "#39ff14";
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textAlign = "center";

    // Shift text slightly to account for the icon on the left
    ctx.fillText(`[${activeToast.tier}] UNLOCKED!`, V_WIDTH / 2 + 10, 25);

    ctx.fillStyle = "#ffd700";
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.fillText(activeToast.title, V_WIDTH / 2 + 10, 40);
  }

  if (gameState === "PLAYING" || gameState === "PAUSED") {
    ctx.fillStyle = "#fff";
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    let titleText = isBossRush ? "BOSS RUSH" : `SCORE: ${score}`;
    ctx.fillText(titleText, 10, 25);
    if (isBossRush) ctx.fillText(`SCORE: ${score}`, 10, 45);

    if (comboMult > 1) {
      ctx.fillStyle = comboMult > 4 ? "#ff4444" : "#ffd700";
      ctx.fillText(`COMBO x${comboMult}`, 10, isBossRush ? 65 : 45);
    }

    ctx.fillStyle = "#cc66ff";
    ctx.fillText(`♦ ${runShards}`, V_WIDTH - 50, 25);

    ctx.shadowColor = "transparent";
  }
}

(async function initGame() {
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data?.session?.user || null;

  if (!shownEula) {
    document.getElementById("mainMenuScreen").style.display = "none";
    showEula(true);
  } else {
    let hasConflict = false;
    if (currentUser) {
      hasConflict = await checkCloudSync();
    }
    if (!hasConflict) {
      checkTutorialAndProceed();
    }
  }
  drawMenuIcons();
  requestAnimationFrame(update);
})();
