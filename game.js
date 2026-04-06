// --- SUPABASE CONFIG ---
const supabaseUrl = 'https://dmpsaindnowmxybrwoem.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcHNhaW5kbm93bXh5YnJ3b2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTA5ODAsImV4cCI6MjA5MDg4Njk4MH0.dUULkS_k_T8rTHy7czQfrjWvoxhEllYWGtwtsGIk-5o';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
let savedPlayerName = localStorage.getItem('nsw_playerName') || '';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- UI ELEMENTS ---
const screens = {
    'mainMenuScreen': document.getElementById('mainMenuScreen'),
    'howToPlayScreen': document.getElementById('howToPlayScreen'),
    'optionsScreen': document.getElementById('optionsScreen'),
    'devToolsScreen': document.getElementById('devToolsScreen'),
    'gameOverScreen': document.getElementById('gameOverScreen'),
    'pauseScreen': document.getElementById('pauseScreen'),
    'shopScreen': document.getElementById('shopScreen'),
    'leaderboardScreen': document.getElementById('leaderboardScreen'),
    'eulaScreen': document.getElementById('eulaScreen')
};
const pauseBtn = document.getElementById('pauseBtn');
const gameOverTitle = document.getElementById('gameOverTitle');
const bossWarning = document.getElementById('bossWarning');
const finalScoreText = document.getElementById('finalScoreText');
const finalComboText = document.getElementById('finalComboText');
const finalShardsText = document.getElementById('finalShardsText');
const newRecordAlert = document.getElementById('newRecordAlert');

const eulaContent = document.getElementById('eulaContent');
const btnAgreeEula = document.getElementById('btnAgreeEula');
const btnCloseEula = document.getElementById('btnCloseEula');

// --- STATE VARIABLES ---
let gameState = 'MENU'; 
let isBossRush = false; 
let isMuted = false;
let showBgStars = true;
let secretClicks = 0;
let shopkeeperClicks = 0;

let isInvincible = false;
let allowInvincibleLB = false;

// --- META-PROGRESSION & SAVES ---
let highScore = parseInt(localStorage.getItem('nsw_highScore')) || 0;
let maxComboAllTime = parseInt(localStorage.getItem('nsw_maxCombo')) || 1;
let arcaneShards = parseInt(localStorage.getItem('nsw_shards')) || 0;
let shownEula = localStorage.getItem('nsw_shownEula') === 'true';

let upgrades = JSON.parse(localStorage.getItem('nsw_upgrades')) || { potion: 0, boots: 0, magnet: 0, blast: 0 };
let skins = JSON.parse(localStorage.getItem('nsw_skins')) || { wizard: true, pyromancer: false, necromancer: false };
let activeSkin = localStorage.getItem('nsw_activeSkin') || 'wizard';

let relics = JSON.parse(localStorage.getItem('nsw_relics')) || { none: true, glass_cannon: false, lead_boots: false };
let activeRelic = localStorage.getItem('nsw_activeRelic') || 'none';

let hasSeenShopTutorial = localStorage.getItem('nsw_shopTutorial') === 'true';
let shopDialogueIndex = 0;
let isShopDialogueActive = false;
const shopTutorialLines = [
    "Welcome, initiate. I am the Grand Artificer.",
    "Here, you may exchange Arcane Shards (♦) for power.",
    "UPGRADES permanently enhance your potions and spells.",
    "WARDROBE alters your mystical appearance.",
    "RELICS drastically change the rules of a run.",
    "Choose wisely. The night is long..."
];

document.getElementById('menuHighScore').innerText = highScore;
document.getElementById('menuMaxCombo').innerText = maxComboAllTime;
document.getElementById('menuShards').innerText = arcaneShards;

function saveMeta() {
    localStorage.setItem('nsw_highScore', highScore);
    localStorage.setItem('nsw_maxCombo', maxComboAllTime);
    localStorage.setItem('nsw_shards', arcaneShards);
    localStorage.setItem('nsw_upgrades', JSON.stringify(upgrades));
    localStorage.setItem('nsw_skins', JSON.stringify(skins));
    localStorage.setItem('nsw_activeSkin', activeSkin);
    localStorage.setItem('nsw_relics', JSON.stringify(relics));
    localStorage.setItem('nsw_activeRelic', activeRelic);
    localStorage.setItem('nsw_shopTutorial', hasSeenShopTutorial);
    
    document.getElementById('menuShards').innerText = arcaneShards;
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

const player = {
    x: V_WIDTH / 2 - 16, y: V_HEIGHT - 60,
    w: 32, h: 32, speed: NORMAL_SPEED, shieldHits: 0
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
let keys = { left: false, right: false };

let maxComboRun = 1;
let runShards = 0;
let shakeTimer = 0;
let shakeMag = 0;
let bossRushDelay = 0;
let farStars = [];

let itemHistory = [];
let synergyTimer = 0;

let bossLevel = 0;
let nextBossScore = 1500;
let bossActive = false;
let boss = { 
    x: V_WIDTH / 2 - 32, y: -80, w: 64, h: 64, 
    hp: 5, maxHp: 5, speed: 100, dir: 1, attackTimer: 0, type: 0, wave: 0, teleportTimer: 0 
};

function triggerSynergy() {
    playSound('bossHit');
    triggerShake(1.0, 20);
    synergyTimer = 1.5; 
    
    let scoreMult = activeRelic === 'glass_cannon' ? 2 : 1;
    
    for (let i = items.length - 1; i >= 0; i--) {
        let isBad = ['skull', 'phantom', 'fireball', 'specter', 'bat', 'smallBat'].includes(items[i].type);
        if (isBad) {
            spawnParticles(items[i].x + items[i].w/2, items[i].y + items[i].h/2, '#00ffff');
            score += 100 * comboMult * scoreMult;
            items.splice(i, 1);
        }
    }
    score += 1000 * comboMult * scoreMult;
}

for(let i=0; i<40; i++) {
    farStars.push({ x: Math.random() * 320, y: Math.random() * 480, size: 1, speed: Math.random() * 10 + 2 });
}
for(let i=0; i<30; i++) {
    bgStars.push({
        x: Math.random() * V_WIDTH, y: Math.random() * V_HEIGHT,
        size: Math.random() * 2 + 1, speed: Math.random() * 30 + 10
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
            if (colorKey !== 'tr' && colorKey !== 'transparent') {
                context.fillStyle = colorKey.startsWith('#') ? colorKey : (colors[colorKey] || '#ff00ff');
                context.fillRect(offsetX + (c * pixelSize), offsetY + (r * pixelSize), pixelSize + 0.5, pixelSize + 0.5);
            }
        }
    }
}

function drawPixelSprite(sprite, x, y, size) {
    drawPixelSpriteToCtx(ctx, sprite, x, y, size);
}

function drawShopWizard() {
    const shopCanvas = document.getElementById('shopWizardCanvas');
    const shopCtx = shopCanvas.getContext('2d');
    
    shopCanvas.width = 128;
    shopCanvas.height = 128;
    
    shopCtx.clearRect(0, 0, shopCanvas.width, shopCanvas.height);
    
    drawPixelSpriteToCtx(shopCtx, rawShopkeeperHD, 0, 0, shopCanvas.width);
}

function advanceShopDialogue() {
    if (!isShopDialogueActive) return;
    
    shopDialogueIndex++;
    if (shopDialogueIndex < shopTutorialLines.length) {
        document.getElementById('shopDialogue').innerHTML = shopTutorialLines[shopDialogueIndex] + "<span>CLICK TO CONTINUE</span>";
        playSound('bloop');
    } else {
        isShopDialogueActive = false;
        hasSeenShopTutorial = true;
        saveMeta();
        document.getElementById('shopDialogue').innerHTML = "Choose wisely. <span>(TUTORIAL COMPLETE)</span>";
        document.getElementById('shopDialogue').style.borderColor = "#00ffff";
        playSound('chime');
    }
}

// --- AUDIO ---
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

window.addEventListener('mousedown', initAudio, {once:true});
window.addEventListener('touchstart', initAudio, {once:true});
window.addEventListener('keydown', initAudio, {once:true});

function playSound(type) {
    if (!audioCtx || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    if (type === 'bloop') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'chime') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'crunch') {
        osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'bossHit') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    }
}

// --- UI CONTROLS, EULA & SHOP ---
function switchScreen(screenId) {
    Object.values(screens).forEach(s => s.style.display = 'none');
    if(screenId) screens[screenId].style.display = 'flex';
}

eulaContent.addEventListener('scroll', () => {
    if (eulaContent.scrollHeight - Math.ceil(eulaContent.scrollTop) <= eulaContent.clientHeight + 5) {
        btnAgreeEula.disabled = false;
        btnAgreeEula.innerText = "I AGREE TO THE EULA";
    }
});

function showEula(isFirstTime) {
    switchScreen('eulaScreen');
    if (isFirstTime) {
        btnAgreeEula.style.display = 'block';
        btnCloseEula.style.display = 'none';
        btnAgreeEula.disabled = true;
        btnAgreeEula.innerText = "SCROLL TO AGREE";
        
        setTimeout(() => {
            if (eulaContent.scrollHeight <= eulaContent.clientHeight + 5) {
                btnAgreeEula.disabled = false;
                btnAgreeEula.innerText = "I AGREE TO THE EULA";
            }
        }, 100);
    } else {
        btnAgreeEula.style.display = 'none';
        btnCloseEula.style.display = 'block';
    }
}

function agreeEula() {
    localStorage.setItem('nsw_shownEula', 'true');
    shownEula = true;
    switchScreen('mainMenuScreen');
}

async function openLeaderboard() {
    switchScreen('leaderboardScreen');
    const listElement = document.getElementById('leaderboardList');
    listElement.innerHTML = '<div style="text-align:center; color:#aaa;">Summoning records...</div>';
    
    const { data, error } = await supabaseClient
        .from('leaderboard')
        .select('name, score')
        .eq('is_boss_rush', false)
        .order('score', { ascending: false })
        .limit(10);
    
    if (error) {
        listElement.innerHTML = '<div style="color:#ff4444; text-align:center;">Failed to read arcane scrolls.</div>';
        return;
    }
    
    if (data.length === 0) {
        listElement.innerHTML = '<div style="color:#aaa; text-align:center;">The scrolls are empty.</div>';
        return;
    }
    
    listElement.innerHTML = data.map((entry, i) => 
        `<div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">
            <span style="color:#fff;">${i+1}. ${entry.name || 'UNKNOWN'}</span>
            <span style="color:#ffd700;">${entry.score}</span>
        </div>`
    ).join('');
}

async function submitScore() {
    const nameInput = document.getElementById('playerNameInput').value.trim().toUpperCase();
    if (!nameInput) return;
    
    localStorage.setItem('nsw_playerName', nameInput);
    savedPlayerName = nameInput;
    
    const submitBtn = document.getElementById('submitScoreBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'SUBMITTING...';

    const { error } = await supabaseClient.from('leaderboard').insert([
        { name: nameInput, score: score, max_combo: maxComboRun, is_boss_rush: isBossRush }
    ]);

    if (error) {
        submitBtn.innerText = 'ERROR! RETRY?';
        submitBtn.disabled = false;
    } else {
        submitBtn.innerText = 'SCORE SECURED!';
        submitBtn.style.backgroundColor = '#39ff14';
        submitBtn.style.borderColor = '#006400';
    }
}

function updateShopUI() {
    document.getElementById('shopShards').innerText = arcaneShards;
    
    ['potion', 'boots', 'magnet', 'blast'].forEach(type => {
        let lvl = upgrades[type];
        let cost = getUpgradeCost(type === 'potion' ? 10 : type === 'blast' ? 20 : 15, lvl);
        document.getElementById('lvl' + type.charAt(0).toUpperCase() + type.slice(1)).innerText = lvl;
        let btn = document.getElementById('btnBuy' + type.charAt(0).toUpperCase() + type.slice(1));
        btn.innerHTML = `♦ ${cost}`;
        btn.disabled = arcaneShards < cost;
    });

    document.getElementById('btnEquipWizard').innerText = activeSkin === 'wizard' ? 'EQUIPPED' : 'EQUIP';
    document.getElementById('btnEquipWizard').disabled = activeSkin === 'wizard';

    ['pyro', 'necro'].forEach(skin => {
        let fullSkinName = skin === 'pyro' ? 'pyromancer' : 'necromancer';
        let btn = document.getElementById('btnBuy' + skin.charAt(0).toUpperCase() + skin.slice(1));
        let status = document.getElementById('status' + skin.charAt(0).toUpperCase() + skin.slice(1));
        
        if (skins[fullSkinName]) {
            status.innerText = "Owned";
            status.style.color = "#39ff14";
            btn.innerText = activeSkin === fullSkinName ? 'EQUIPPED' : 'EQUIP';
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

    ['none', 'glass_cannon', 'lead_boots'].forEach(relic => {
        let btn = document.getElementById('btnBuyRelic_' + relic);
        let status = document.getElementById('statusRelic_' + relic);
        
        if (relics[relic]) {
            if (status) { status.innerText = "Owned"; status.style.color = "#39ff14"; }
            btn.innerText = activeRelic === relic ? 'EQUIPPED' : 'EQUIP';
            btn.disabled = activeRelic === relic;
            btn.onclick = () => buyRelic(relic, 0);
        } else {
            if (status) { status.innerText = "Locked"; status.style.color = "#ff4444"; }
            btn.innerHTML = `♦ 10`;
            btn.disabled = arcaneShards < 10;
            btn.onclick = () => buyRelic(relic, 10);
        }
    });
}

function openShop() {
    updateShopUI();
    switchScreen('shopScreen');
    drawShopWizard();
    
    const dialogueBox = document.getElementById('shopDialogue');
    
    if (!hasSeenShopTutorial) {
        isShopDialogueActive = true;
        shopDialogueIndex = 0;
        dialogueBox.innerHTML = shopTutorialLines[0] + "<span>CLICK TO CONTINUE</span>";
        dialogueBox.style.borderColor = "#ff00ff";
    } else {
        isShopDialogueActive = false;
        dialogueBox.innerHTML = "What do you need, wizard? <span>(SHOP OPEN)</span>";
        dialogueBox.style.borderColor = "#00ffff";
    }
}

function buyUpgrade(type, baseCost) {
    let cost = getUpgradeCost(baseCost, upgrades[type]);
    if (arcaneShards >= cost) {
        arcaneShards -= cost;
        upgrades[type]++;
        playSound('chime');
        saveMeta();
        updateShopUI();
    }
}

function buySkin(skinId, cost) {
    if (!skins[skinId] && arcaneShards >= cost) {
        arcaneShards -= cost;
        skins[skinId] = true;
        playSound('chime');
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
        playSound('chime');
    }
    if (relics[relicId]) {
        activeRelic = relicId;
    }
    saveMeta();
    updateShopUI();
}

function openDevTools(isSecret = false) {
    const title = document.getElementById('devToolsTitle');
    const secretLb = document.getElementById('secretLbLabel');
    const screen = document.getElementById('devToolsScreen');

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
    switchScreen('devToolsScreen');
}

function registerSecretClick() {
    secretClicks++;
    if(secretClicks >= 5) {
        openDevTools(false);
        secretClicks = 0;
    }
}

function registerShopkeeperClick() {
    shopkeeperClicks++;
    if(shopkeeperClicks >= 5) {
        openDevTools(true);
        shopkeeperClicks = 0;
    }
}

function toggleMute() { isMuted = document.getElementById('muteToggle').checked; }
function toggleBg() { showBgStars = document.getElementById('bgToggle').checked; }
function toggleInvincibility() { isInvincible = document.getElementById('invincibilityToggle').checked; }
function toggleAllowInvincibleLB() { allowInvincibleLB = document.getElementById('allowInvincibleLBToggle').checked; }

function togglePause() {
    if (gameState !== 'PLAYING' && gameState !== 'PAUSED') return;
    
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseBtn.style.display = 'none';
        switchScreen('pauseScreen');
    } else {
        gameState = 'PLAYING';
        pauseBtn.style.display = 'block';
        switchScreen(null);
        lastTime = performance.now(); 
    }
}

function resize() {
    const scale = Math.min(window.innerWidth / V_WIDTH, window.innerHeight / V_HEIGHT);
    canvas.width = V_WIDTH * scale; canvas.height = V_HEIGHT * scale; ctx.scale(scale, scale);
}
window.addEventListener('resize', resize);
resize();

// --- INPUT ---
function updatePointerPosition(clientX) {
    if(gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    mouseX = (clientX - rect.left) * (V_WIDTH / rect.width) - (player.w / 2);
}

window.addEventListener('mousemove', e => updatePointerPosition(e.clientX));
canvas.addEventListener('touchstart', e => { updatePointerPosition(e.touches[0].clientX); if(e.target === canvas) e.preventDefault(); }, {passive: false});
canvas.addEventListener('touchmove', e => { updatePointerPosition(e.touches[0].clientX); if(e.target === canvas) e.preventDefault(); }, {passive: false});

window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    
    if (e.code === 'Backquote') {
        openDevTools(e.altKey); 
    }
    
    if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
    initAudio();
});

window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
});

// --- SPAWNING LOGIC ---
function spawnItem() {
    let type = 'skull', sprite = skullSprites[Math.floor(Math.random()*skullSprites.length)], w = 24, h = 24, sBase = 110, col = '#8b0000';
    let categoryRoll = Math.random();
    
    if (categoryRoll > 0.95) {
        type = 'shard'; sprite = shardSprite; sBase = 120; col = '#8a2be2'; w = 20; h = 20;
    }
    else if (categoryRoll > 0.85) {
        let pRoll = Math.random();
        if (pRoll > 0.75 && score >= 3000) { type = 'rocket'; sprite = rocketSprite; sBase = 140; col = '#39ff14'; }
        else if (pRoll > 0.50 && score >= 2000) { type = 'blast'; sprite = blastSprite; sBase = 140; col = '#ff4444'; }
        else if (pRoll > 0.25 && score >= 800) { type = 'magnet'; sprite = magnetSprite; sBase = 140; col = '#ff00ff'; }
        else { type = 'potion'; sprite = potionSprite; sBase = 130; col = '#00ffff'; }
    } 
    else if (categoryRoll > 0.60) {
        if (Math.random() > 0.5 && score >= 200) { type = 'comet'; sprite = cometSprite; w = 28; h = 28; sBase = 220; col = '#ffd700'; }
        else { type = 'star'; sprite = starSprite; sBase = 120; col = '#ffffff'; }
    } 
    else {
        let eRoll = Math.random();
        if (eRoll > 0.85 && score >= 2500) { type = 'bat'; sprite = batSprite; sBase = 120; col = '#a9a9a9'; }
        else if (eRoll > 0.65 && score >= 1100) { type = 'specter'; sprite = specterSprite; sBase = 75; col = '#ffffff'; }
        else if (eRoll > 0.35 && score >= 500) { 
            type = 'phantom'; 
            sprite = phantomVariants[Math.floor(Math.random() * phantomVariants.length)]; 
            sBase = 100; 
            col = '#6a31a1'; 
        }
        else { type = 'skull'; sprite = skullSprites[Math.floor(Math.random()*skullSprites.length)]; sBase = 110; col = '#8b0000'; }
    }
    
    items.push({
        x: Math.random() * (V_WIDTH - w), y: -30, w: w, h: h, 
        type: type, sprite: sprite, speed: sBase * (baseSpeed / 100), color: col,
        wave: Math.random() * Math.PI * 2, vx: 0, split: false
    });
}

function spawnParticles(x, y, color) {
    for(let i=0; i<10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 120 + 50;
        particles.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.5, color: color });
    }
}

function processGameOver(aborted = false) {
    if (!aborted) {
        playSound('crunch'); 
        triggerShake(0.4, 15);
    }
    gameState = 'MENU'; 
    pauseBtn.style.display = 'none';

    gameOverTitle.innerText = aborted ? "ABORTED" : "CURSED!";
    gameOverTitle.style.color = aborted ? "#a9a9a9" : "#ff4444";
    
    let isNewRecord = false;
    
    if (!aborted) {
        if (!isBossRush && score > highScore) { highScore = score; isNewRecord = true; }
        if (!isBossRush && maxComboRun > maxComboAllTime) { maxComboAllTime = maxComboRun; }
        saveMeta(); 
    }
    
    finalScoreText.innerText = `Final Score: ${score}`;
    finalComboText.innerText = `Max Combo: x${maxComboRun}`;
    finalShardsText.innerText = `Shards Found: ${runShards}`;
    newRecordAlert.style.display = isNewRecord ? 'block' : 'none';

    const nameInput = document.getElementById('playerNameInput');
    const submitBtn = document.getElementById('submitScoreBtn');
    
    if (!aborted && !isBossRush && score > 0 && (!isInvincible || allowInvincibleLB)) {
        nameInput.style.display = 'block';
        nameInput.value = savedPlayerName; 
        submitBtn.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'SUBMIT TO GLOBAL';
        submitBtn.style.backgroundColor = '#008b8b';
        submitBtn.style.borderColor = '#00ffff';
    } else {
        nameInput.style.display = 'none';
        submitBtn.style.display = 'none';
    }

    switchScreen('gameOverScreen');
}

function startGame(rushMode = false) {
    initAudio(); 
    isBossRush = rushMode;
    score = 0; maxComboRun = 1; items = []; particles = [];
    runShards = 0;
    
    itemHistory = [];
    synergyTimer = 0;
    
    player.x = V_WIDTH / 2 - 16; mouseX = V_WIDTH / 2;
    player.shieldHits = 0; comboMult = 1; comboTimer = 0; 
    baseSpeed = 150; 
    player.speed = activeRelic === 'lead_boots' ? NORMAL_SPEED * 0.7 : NORMAL_SPEED;
    
    rocketTimer = 0; magnetTimer = 0; laserTimer = 0; shakeTimer = 0; 
    keys = { left: false, right: false }; 
    
    bossLevel = 0; bossActive = false; nextBossScore = 1500; 
    
    switchScreen(null); 
    bossWarning.style.display = 'none'; 
    newRecordAlert.style.display = 'none';
    pauseBtn.style.display = 'block'; 
    
    if (isBossRush) bossRushDelay = 1.0;

    lastTime = performance.now(); 
    gameState = 'PLAYING';
}

function spawnBoss() {
    bossActive = true; 
    boss.type = bossLevel % bossSprites.length; 
    boss.maxHp = (isBossRush ? 8 : 5) + (bossLevel * 2); 
    boss.hp = boss.maxHp;
    boss.y = -80; boss.wave = 0; boss.teleportTimer = 0;
    bossWarning.style.display = 'block'; 
    setTimeout(() => bossWarning.style.display = 'none', 2000);
    playSound('bossHit'); 
    triggerShake(0.5, 5);
}

// --- MAIN GAME LOOP ---
function update(timestamp) {
    let dt = (timestamp - lastTime) / 1000 || 0.016; 
    if (dt > 0.1) dt = 0.1; 
    lastTime = timestamp;

    if (gameState === 'PAUSED') {
        requestAnimationFrame(update);
        return;
    }
    
    if (showBgStars) {
        let spaceSpeedMult = rocketTimer > 0 ? 5 : 1;
        farStars.forEach(s => { s.y += s.speed * dt * spaceSpeedMult; if (s.y > V_HEIGHT) { s.y = 0; s.x = Math.random() * V_WIDTH; } });
        bgStars.forEach(s => { s.y += s.speed * dt * spaceSpeedMult; if (s.y > V_HEIGHT) { s.y = 0; s.x = Math.random() * V_WIDTH; } });
    }
    
    for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt; if (p.life <= 0) particles.splice(i, 1); }
    if (shakeTimer > 0) shakeTimer -= dt;
    if (synergyTimer > 0) synergyTimer -= dt;

    if (gameState !== 'PLAYING') {
        render();
        requestAnimationFrame(update);
        return; 
    }

    let worldDt = dt;
    if (rocketTimer > 0) {
        rocketTimer -= dt; worldDt = dt * 5; 
        if (Math.random() > 0.3) spawnParticles(player.x + player.w/2, player.y + player.h, '#39ff14');
    }
    if (magnetTimer > 0) magnetTimer -= dt;
    if (laserTimer > 0) laserTimer -= dt;
    if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) comboMult = 1; }
    
    if (keys.left) { player.x -= player.speed * dt; mouseX = player.x; } 
    else if (keys.right) { player.x += player.speed * dt; mouseX = player.x; } 
    else { player.x += (mouseX - player.x) * (player.speed/50) * dt; }
    
    if (player.x < 0) { player.x = 0; mouseX = 0; }
    if (player.x > V_WIDTH - player.w) { player.x = V_WIDTH - player.w; mouseX = V_WIDTH - player.w; }
    
    if (comboMult > maxComboRun) maxComboRun = comboMult;

    if (isBossRush) {
        if (!bossActive) { bossRushDelay -= dt; if (bossRushDelay <= 0) spawnBoss(); }
    } else {
        if (score >= nextBossScore && !bossActive) spawnBoss();
    }

    if (bossActive) {
        let isEnraged = boss.hp <= 2; 
        let bBehavior = boss.type % 4; 
        
        if (boss.y < 20) {
            boss.y += 50 * worldDt; 
        } else {
            if (bBehavior === 0) { boss.x += boss.speed * (isEnraged?1.5:1) * boss.dir * worldDt; if (boss.x < 0 || boss.x > V_WIDTH - boss.w) boss.dir *= -1; } 
            else if (bBehavior === 1) { boss.wave += worldDt * (isEnraged?2.5:1.5); boss.x = (V_WIDTH/2 - boss.w/2) + Math.sin(boss.wave * 1.5) * 100; } 
            else if (bBehavior === 2) { 
                boss.x += boss.speed * (isEnraged?2.5:1.5) * boss.dir * worldDt; 
                if (boss.x < 0 || boss.x > V_WIDTH - boss.w) boss.dir *= -1; 
                boss.wave += worldDt * (isEnraged?8:4); 
                boss.y = 20 + Math.abs(Math.sin(boss.wave)) * 60; 
            } 
            else if (bBehavior === 3) { boss.teleportTimer += worldDt; if (boss.teleportTimer > (isEnraged?1.5:2.5)) { boss.x = Math.random() * (V_WIDTH - boss.w); boss.teleportTimer = 0; spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#808080'); } }
            boss.attackTimer += worldDt;
            let atkRate = Math.max(0.4, 0.8 - (bossLevel * 0.05));
            if (isEnraged) atkRate *= 0.75;
            if (boss.attackTimer > atkRate) {
                boss.attackTimer = 0;
                if (Math.random() > 0.70) items.push({ x: Math.random() * (V_WIDTH - 24), y: -30, w: 24, h: 24, type: 'skull', sprite: skullSprites[Math.floor(Math.random()*skullSprites.length)], speed: 110 * (baseSpeed / 100), vx: 0, color: '#8b0000', wave: 0 });
                let isWeakness = Math.random() > 0.85; 
                if (isWeakness) { items.push({ x: boss.x + boss.w/2 - 12, y: boss.y + boss.h, w: 24, h: 24, type: 'holyStar', sprite: holyStarSprite, speed: 130, vx: 0, color: '#00ffff' }); } 
                else {
                    if (bBehavior === 0) { 
                        if(isEnraged) { items.push({ x: boss.x + boss.w/2 - 20, y: boss.y + boss.h, w: 24, h: 24, type: 'fireball', sprite: fireballSprite, speed: 220, vx: -30, color: '#ff4444' }); items.push({ x: boss.x + boss.w/2 + 4, y: boss.y + boss.h, w: 24, h: 24, type: 'fireball', sprite: fireballSprite, speed: 220, vx: 30, color: '#ff4444' }); }
                        else { items.push({ x: boss.x + boss.w/2 - 12, y: boss.y + boss.h, w: 24, h: 24, type: 'fireball', sprite: fireballSprite, speed: 220, vx: 0, color: '#ff4444' }); }
                    } 
                    else if (bBehavior === 1) { let spread = isEnraged?110:80; for(let j=-1; j<=1; j++) items.push({ x: boss.x + boss.w/2 - 12, y: boss.y + boss.h, w: 24, h: 24, type: 'fireball', sprite: fireballSprite, speed: isEnraged?250:200, vx: j * spread, color: '#8a2be2' }); } 
                    else if (bBehavior === 2) { 
                        let randomPhantom = phantomVariants[Math.floor(Math.random() * phantomVariants.length)];
                        items.push({ x: boss.x + boss.w/2 - 12, y: boss.y + boss.h, w: 24, h: 24, type: 'phantom', sprite: randomPhantom, speed: isEnraged?200:160, wave: Math.random() * Math.PI, vx: 0, color: '#006400' }); 
                    } 
                    else if (bBehavior === 3) { 
                        let gap = Math.floor(Math.random() * 5); let stagger = Math.floor(Math.random() * 3); let wSpd = isEnraged?260:160;
                        for(let k=0; k<5; k++) { if (k !== gap) { let yOff = (stagger===0)?k*28:(stagger===1)?(4-k)*28:Math.abs(2-k)*25; items.push({ x: (V_WIDTH/5) * k + 10, y: boss.y + boss.h - yOff, w: 24, h: 24, type: 'skull', sprite: skullSprites[Math.floor(Math.random()*skullSprites.length)], speed: wSpd, vx: 0, color: '#a9a9a9' }); } } 
                    }
                }
            }
        }
    } else {
        spawnTimer += worldDt;
        if (spawnTimer > Math.max(0.3, 0.8 - (score / 5000))) { spawnItem(); spawnTimer = 0; }
    }
    
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed * worldDt;
        item.x += (item.vx || 0) * worldDt;
        
        if (item.type === 'phantom') { item.wave += worldDt * 5; item.x += Math.sin(item.wave) * 150 * worldDt; }
        if (item.type === 'specter' && item.y < V_HEIGHT * 0.6) { item.x += Math.sign(player.x - item.x) * 40 * worldDt; }
        if (item.type === 'bat' && item.y > V_HEIGHT * 0.35 && !item.split) {
            items.push({ x: item.x, y: item.y, w: 16, h: 16, type: 'smallBat', sprite: batSprite, speed: item.speed * 1.3, vx: -100, color: item.color });
            items.push({ x: item.x + 8, y: item.y, w: 16, h: 16, type: 'smallBat', sprite: batSprite, speed: item.speed * 1.3, vx: 100, color: item.color });
            spawnParticles(item.x + 12, item.y + 12, '#ff4444'); items.splice(i, 1); continue;
        }
        if (magnetTimer > 0 && ['star','comet','holyStar','shard'].includes(item.type)) item.x += Math.sign(player.x - item.x) * 150 * dt; 
        
        let isBad = ['skull', 'phantom', 'fireball', 'specter', 'bat', 'smallBat'].includes(item.type);
        let scoreMult = activeRelic === 'glass_cannon' ? 2 : 1;

        if (laserTimer > 0 && item.x < player.x + 20 && item.x + item.w > player.x + 12 && item.y < player.y) {
            if (isBad) { spawnParticles(item.x + item.w/2, item.y + item.h/2, '#ff4444'); items.splice(i, 1); score += 20 * comboMult * scoreMult; continue; }
        }
        
        let hitPad = isBad ? 6 : -6;
        let hit = { x: item.x + hitPad, y: item.y + hitPad, w: item.w - (hitPad*2), h: item.h - (hitPad*2) };
        
        if (player.x < hit.x + hit.w && player.x + player.w > hit.x && player.y < hit.y + hit.h && player.y + player.h > hit.y) {
            if (isBad) {
                if (activeRelic === 'lead_boots' && item.type === 'skull') {
                    playSound('crunch'); spawnParticles(item.x + item.w/2, item.y + item.h/2, '#a9a9a9');
                    score += 20 * comboMult * scoreMult; triggerShake(0.1, 2); items.splice(i, 1);
                }
                else if (rocketTimer > 0 || isInvincible) {
                    playSound('crunch'); spawnParticles(item.x + item.w/2, item.y + item.h/2, isInvincible ? '#a9a9a9' : '#39ff14');
                    score += 50 * comboMult * scoreMult; triggerShake(0.1, 3); items.splice(i, 1);
                } else if (player.shieldHits > 0) {
                    player.shieldHits--; playSound('crunch');
                    spawnParticles(item.x + item.w/2, item.y + item.h/2, '#00ffff');
                    triggerShake(0.3, 8); items.splice(i, 1);
                } else {
                    processGameOver();
                    requestAnimationFrame(update); 
                    return;
                }
            } else {
                if (['potion', 'star', 'magnet'].includes(item.type)) {
                    itemHistory.push(item.type);
                    if (itemHistory.length > 3) itemHistory.shift();
                    if (itemHistory.join(',') === 'potion,star,magnet') {
                        triggerSynergy();
                        itemHistory = [];
                    }
                }

                if (item.type === 'star') score += 10 * comboMult * scoreMult;
                if (item.type === 'comet') score += 50 * comboMult * scoreMult;
                if (item.type === 'shard') {
                    runShards++; arcaneShards++; 
                    playSound('chime'); score += 100 * comboMult * scoreMult;
                    document.getElementById('menuShards').innerText = arcaneShards;
                }
                if (item.type === 'holyStar') {
                    playSound('bossHit'); boss.hp--; spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#00ffff'); triggerShake(0.1, 4);
                    if (boss.hp <= 0) { 
                        bossActive = false; score += 500 * comboMult * scoreMult; bossLevel++; baseSpeed += 15; 
                        playSound('chime'); spawnParticles(boss.x + boss.w/2, boss.y + boss.h/2, '#ffd700'); 
                        triggerShake(0.5, 12); 
                        if (isBossRush) bossRushDelay = 2.5; else nextBossScore = score + 1500; 
                    }
                } 
                else if (item.type === 'potion') { 
                    if (activeRelic !== 'glass_cannon') player.shieldHits = 1 + upgrades.potion; 
                    else score += 50 * comboMult * scoreMult;
                    playSound('chime'); 
                } 
                else if (item.type === 'rocket') { rocketTimer = 5.0 + (upgrades.boots * 1.5); playSound('chime'); }
                else if (item.type === 'magnet') { magnetTimer = 5.0 + (upgrades.magnet * 1.5); playSound('chime'); }
                else if (item.type === 'blast')  { laserTimer = 2.0 + (upgrades.blast * 0.8); playSound('bossHit'); triggerShake(0.2, 5); }
                else { playSound('bloop'); comboMult++; comboTimer = 3.0; baseSpeed += 1; }
                
                spawnParticles(item.x + item.w/2, item.y + item.h/2, item.color);
                items.splice(i, 1);
            }
            continue;
        }

        if (item.y > V_HEIGHT || item.x < -100 || item.x > V_WIDTH + 100) {
            if (item.y > V_HEIGHT && (item.type === 'star' || item.type === 'comet')) {
                comboMult = 1;
                comboTimer = 0;
            }
            items.splice(i, 1);
        }
    }
    
    render(); 
    requestAnimationFrame(update);
}

function render() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT); 
    ctx.save();
    
    if (shakeTimer > 0) { 
        const dx = (Math.random() - 0.5) * shakeMag; 
        const dy = (Math.random() - 0.5) * shakeMag; 
        ctx.translate(dx, dy); 
    }

    if(showBgStars) {
        ctx.fillStyle = '#444466'; farStars.forEach(s => { ctx.globalAlpha = 0.5; ctx.fillRect(s.x, s.y, s.size, s.size); });
        ctx.fillStyle = '#ffffff'; bgStars.forEach(s => { ctx.globalAlpha = 0.3; ctx.fillRect(s.x, s.y, s.size, s.size); }); 
        ctx.globalAlpha = 1.0;
    }

    if (laserTimer > 0 && gameState === 'PLAYING') { ctx.fillStyle = 'rgba(255, 68, 68, 0.8)'; ctx.fillRect(player.x + 8, 0, 16, player.y + 16); ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; ctx.fillRect(player.x + 12, 0, 8, player.y + 16); }
    
    if (player.shieldHits > 0 && gameState === 'PLAYING') { 
        ctx.beginPath(); ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/1.4, 0, Math.PI * 2); 
        ctx.strokeStyle = player.shieldHits > 1 ? '#ff00ff' : '#00ffff'; 
        ctx.lineWidth = 2 + (player.shieldHits - 1); ctx.stroke(); 
    }

    let currentSprite = wizardSprite;
    if (activeSkin === 'pyromancer') currentSprite = pyroSprite;
    else if (activeSkin === 'necromancer') currentSprite = necroSprite;

    if (gameState === 'PLAYING') drawPixelSpriteToCtx(ctx, currentSprite, player.x, player.y, player.w);
    items.forEach(item => drawPixelSpriteToCtx(ctx, item.sprite, item.x, item.y, item.w));
    
    if (bossActive && boss.y > -boss.h) {
        drawPixelSpriteToCtx(ctx, bossSprites[boss.type], boss.x, boss.y, boss.w);
        ctx.fillStyle = '#333'; ctx.fillRect(boss.x, boss.y - 10, boss.w, 6); 
        ctx.fillStyle = '#ff4444'; ctx.fillRect(boss.x, boss.y - 10, boss.w * (boss.hp / boss.maxHp), 6);
    }

    particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / 0.5); ctx.fillRect(p.x, p.y, 4, 4); });
    ctx.globalAlpha = 1.0; 
    
    if (synergyTimer > 0) {
        ctx.fillStyle = `rgba(0, 255, 255, ${Math.min(0.8, synergyTimer)})`;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        ctx.fillStyle = '#fff'; ctx.font = "16px 'Press Start 2P', monospace"; ctx.textAlign = "center";
        ctx.fillText("SYNERGY", V_WIDTH/2, V_HEIGHT/2 - 10);
        ctx.fillText("BURST!", V_WIDTH/2, V_HEIGHT/2 + 15);
    }

    ctx.restore();

    if(gameState === 'PLAYING' || gameState === 'PAUSED') {
        ctx.fillStyle = "#fff"; ctx.font = "10px 'Press Start 2P', monospace"; ctx.textAlign = "left"; 
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)"; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2; 
        
        let titleText = isBossRush ? 'BOSS RUSH' : `SCORE: ${score}`;
        ctx.fillText(titleText, 10, 25);
        if (isBossRush) ctx.fillText(`SCORE: ${score}`, 10, 45);
        
        if (comboMult > 1) { 
            ctx.fillStyle = comboMult > 4 ? '#ff4444' : '#ffd700'; 
            ctx.fillText(`COMBO x${comboMult}`, 10, isBossRush ? 65 : 45); 
        }
        
        ctx.fillStyle = '#cc66ff';
        ctx.fillText(`♦ ${runShards}`, V_WIDTH - 50, 25);

        ctx.shadowColor = "transparent";
    }
}

if (!shownEula) {
    document.getElementById('mainMenuScreen').style.display = 'none';
    showEula(true);
} else {
    switchScreen('mainMenuScreen');
}

requestAnimationFrame(update);
