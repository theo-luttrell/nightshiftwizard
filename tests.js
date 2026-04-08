// --- IN-GAME UNIT TESTING FRAMEWORK ---

function runUnitTests() {
  const out = document.getElementById("testResults");
  out.innerHTML =
    '<h3 style="color:#fff; font-size:10px; margin-top:0; margin-bottom:10px;">TEST RESULTS:</h3>';
  out.style.display = "block";

  // Helper to log test results to the Dev Tools UI
  function logResult(funcName, args, success, errorMsg = "") {
    const el = document.createElement("div");
    el.style.fontSize = "8px";
    el.style.marginBottom = "6px";
    el.style.textAlign = "left";
    el.style.lineHeight = "1.4";

    if (success) {
      el.style.color = "#39ff14";
      el.innerText = `${funcName}(${args}): Success`;
    } else {
      el.style.color = "#ff4444";
      el.innerText = `${funcName}(${args}): ${errorMsg}`;
    }
    out.appendChild(el);
  }

  // Core test execution wrapper
  function runTest(funcName, args, expected, testFn) {
    try {
      const result = testFn();
      // Check if expected is a boolean condition or exact match
      if (
        result === expected ||
        (typeof expected === "boolean" && result === expected)
      ) {
        logResult(funcName, args, true);
      } else {
        logResult(funcName, args, false, `Expected ${expected}, got ${result}`);
      }
    } catch (e) {
      logResult(funcName, args, false, e.message);
    }
  }

  // Safely mock save & audio functions so tests don't overwrite cloud saves or spam noises
  const origSaveMeta = typeof saveMeta === "function" ? saveMeta : () => {};
  const origPlaySound = typeof playSound === "function" ? playSound : () => {};
  window.saveMeta = () => {};
  window.playSound = () => {};

  // ==========================================
  //             THE UNIT TESTS
  // ==========================================

  // --- 1. Math & Economy Functions ---
  runTest("getUpgradeCost", "10, 0", 10, () => getUpgradeCost(10, 0));
  runTest("getUpgradeCost", "10, 1", 12, () => getUpgradeCost(10, 1));
  runTest("getUpgradeCost", "20, 3", 34, () => getUpgradeCost(20, 3));

  // --- 2. State Toggles & UI Routing ---
  runTest("toggleMute", "", true, () => {
    const cb = document.getElementById("muteToggle");
    const orig = cb.checked;
    cb.checked = true;
    toggleMute();
    const res = isMuted === true;
    cb.checked = orig; // Restore previous game state
    toggleMute();
    return res;
  });

  runTest("toggleBg", "", true, () => {
    const cb = document.getElementById("bgToggle");
    const orig = cb.checked;
    cb.checked = false;
    toggleBg();
    const res = showBgStars === false;
    cb.checked = orig; // Restore previous game state
    toggleBg();
    return res;
  });

  runTest("toggleInvincibility", "", true, () => {
    const cb = document.getElementById("invincibilityToggle");
    const orig = cb.checked;
    cb.checked = true;
    toggleInvincibility();
    const res = isInvincible === true;
    cb.checked = orig; // Restore previous game state
    toggleInvincibility();
    return res;
  });

  runTest("toggleAllowInvincibleLB", "", true, () => {
    const cb = document.getElementById("allowInvincibleLBToggle");
    if (!cb) return true; // Skip if missing
    const orig = cb.checked;
    cb.checked = true;
    toggleAllowInvincibleLB();
    const res = allowInvincibleLB === true;
    cb.checked = orig;
    toggleAllowInvincibleLB();
    return res;
  });

  runTest("togglePause", "", true, () => {
    const origState = gameState;
    gameState = "PLAYING";
    togglePause();
    const res1 = gameState === "PAUSED";
    togglePause();
    const res2 = gameState === "PLAYING";
    gameState = origState;
    return res1 && res2;
  });

  runTest("switchScreen", "'mainMenuScreen'", true, () => {
    switchScreen("mainMenuScreen");
    return (
      screens["mainMenuScreen"].style.display === "flex" &&
      screens["shopScreen"].style.display === "none"
    );
  });

  runTest("showEula", "true", true, () => {
    showEula(true);
    return (
      btnAgreeEula.style.display === "block" &&
      btnCloseEula.style.display === "none"
    );
  });

  runTest("openAccountScreen", "[Mocked Logged In]", true, () => {
    const origUser = currentUser;
    currentUser = { email: "test@wizard.com" };
    openAccountScreen();
    const success =
      document.getElementById("authLoggedIn").style.display === "block";
    currentUser = origUser;
    return success;
  });

  runTest("openDevTools", "true (Secret)", true, () => {
    openDevTools(true);
    return (
      document.getElementById("devToolsTitle").innerText === "SECRET DEV TOOLS"
    );
  });

  runTest("updateShopUI", "", true, () => {
    const origShards = arcaneShards;
    arcaneShards = 9999;
    updateShopUI();
    const success = document.getElementById("shopShards").innerText == "9999";
    arcaneShards = origShards;
    return success;
  });

  // --- 3. Shop & Purchasing Logic ---
  runTest("buyUpgrade", "'potion', 10", true, () => {
    const origShards = arcaneShards;
    const origLvl = upgrades.potion;

    arcaneShards = 10; // Exact cost
    upgrades.potion = 0;
    buyUpgrade("potion", 10);
    const success = arcaneShards === 0 && upgrades.potion === 1;

    arcaneShards = origShards;
    upgrades.potion = origLvl; // Restore
    return success;
  });

  runTest("buyUpgrade", "'potion', 10 [Insufficient Shards]", true, () => {
    const origShards = arcaneShards;
    const origLvl = upgrades.potion;

    arcaneShards = 5; // Not enough
    upgrades.potion = 0;
    buyUpgrade("potion", 10);
    const success = arcaneShards === 5 && upgrades.potion === 0;

    arcaneShards = origShards;
    upgrades.potion = origLvl; // Restore
    return success;
  });

  runTest("buySkin", "'pyromancer', 100", true, () => {
    const origShards = arcaneShards;
    const origSkin = skins.pyromancer;
    const origActive = activeSkin;

    arcaneShards = 100;
    skins.pyromancer = false;
    buySkin("pyromancer", 100);
    const success =
      arcaneShards === 0 &&
      skins.pyromancer === true &&
      activeSkin === "pyromancer";

    arcaneShards = origShards;
    skins.pyromancer = origSkin;
    activeSkin = origActive;
    return success;
  });

  runTest("buyRelic", "'glass_cannon', 10", true, () => {
    const origShards = arcaneShards;
    const origRelic = relics.glass_cannon;
    const origActive = activeRelic;

    arcaneShards = 10;
    relics.glass_cannon = false;
    buyRelic("glass_cannon", 10);
    const success =
      arcaneShards === 0 &&
      relics.glass_cannon === true &&
      activeRelic === "glass_cannon";

    arcaneShards = origShards;
    relics.glass_cannon = origRelic;
    activeRelic = origActive;
    return success;
  });

  runTest("buySpell", "'blink', 300", true, () => {
    const origShards = arcaneShards;
    const origSpell = spells.blink;
    const origActive = activeSpell;

    arcaneShards = 300;
    spells.blink = false;
    buySpell("blink", 300);
    const success =
      arcaneShards === 0 && spells.blink === true && activeSpell === "blink";

    arcaneShards = origShards;
    spells.blink = origSpell;
    activeSpell = origActive;
    return success;
  });

  // --- 4. Game Mechanics & Actions ---
  runTest("triggerShake", "0.5, 10", true, () => {
    const origTimer = shakeTimer;
    const origMag = shakeMag;
    triggerShake(0.5, 10);
    const success = shakeTimer === 0.5 && shakeMag === 10;
    shakeTimer = origTimer;
    shakeMag = origMag;
    return success;
  });

  runTest("spawnItem", "", true, () => {
    const origLen = items.length;
    spawnItem();
    const success = items.length === origLen + 1;
    items.pop(); // restore
    return success;
  });

  runTest("spawnParticles", "100, 100, '#fff'", true, () => {
    const origLen = particles.length;
    spawnParticles(100, 100, "#fff");
    const success = particles.length === origLen + 10; // 10 particles spawned
    particles.splice(origLen, 10); // restore
    return success;
  });

  runTest("triggerSynergy", "", true, () => {
    const origScore = score;
    const origItems = [...items];
    const origTimer = synergyTimer;
    const origMult = comboMult;
    const origRelic = activeRelic;

    score = 0;
    comboMult = 1;
    activeRelic = "none";
    items = [{ type: "skull", x: 0, y: 0, w: 10, h: 10 }]; // 1 bad item
    triggerSynergy();

    // Synergy clears bad items (+100 score) and adds 1000 flat score
    const success =
      score === 1100 && items.length === 0 && synergyTimer === 1.5;

    score = origScore;
    items = origItems;
    synergyTimer = origTimer;
    comboMult = origMult;
    activeRelic = origRelic;
    return success;
  });

  runTest("castSpell", "'blink'", true, () => {
    const origSpell = activeSpell;
    const origCD = spellCooldown;
    const origState = gameState;
    const origX = player.x;

    activeSpell = "blink";
    spellCooldown = 0;
    gameState = "PLAYING";
    player.x = 160;
    mouseX = 200; // Aiming right

    castSpell();
    // Blink pushes player 100px right based on Math.sign
    const success = spellCooldown === 3.0 && player.x === 260;

    activeSpell = origSpell;
    spellCooldown = origCD;
    gameState = origState;
    player.x = origX;
    return success;
  });

  runTest("spawnBoss", "", true, () => {
    const origBossActive = bossActive;
    const origBossY = boss.y;

    bossActive = false;
    bossLevel = 0;
    spawnBoss();

    const success = bossActive === true && boss.maxHp === 5 && boss.y === -80;

    bossActive = origBossActive;
    boss.y = origBossY;
    return success;
  });

  runTest("updatePointerPosition", "100", true, () => {
    const origState = gameState;
    const origMouse = mouseX;
    gameState = "PLAYING";
    const origGetBoundingClientRect = canvas.getBoundingClientRect;
    canvas.getBoundingClientRect = () => ({ left: 0, width: 320 });
    updatePointerPosition(100);
    const success = mouseX === 84; // (100 - 0) * (320 / 320) - 16
    gameState = origState;
    mouseX = origMouse;
    canvas.getBoundingClientRect = origGetBoundingClientRect;
    return success;
  });

  runTest("startGame", "false", true, () => {
    const origScore = score;
    const origState = gameState;
    score = 5000;
    gameState = "MENU";
    startGame(false);
    const success =
      score === 0 && gameState === "PLAYING" && isBossRush === false;
    score = origScore;
    gameState = origState;
    return success;
  });

  runTest("processGameOver", "true (aborted)", true, () => {
    const origState = gameState;
    gameState = "PLAYING";
    processGameOver(true);
    const success =
      gameState === "MENU" && gameOverTitle.innerText === "GIVING UP?";
    return success;
  });

  runTest("registerSecretClick", "", true, () => {
    const origClicks = secretClicks;
    secretClicks = 4;
    registerSecretClick();
    const success = secretClicks === 0; // Triggers dev tools and resets
    secretClicks = origClicks;
    return success;
  });

  // --- 5. Save Data & Tutorial Flows ---
  runTest("saveLocalOnly", "", true, () => {
    const orig = highScore;
    highScore = 777;
    saveLocalOnly();
    const saved = localStorage.getItem("nsw_highScore");
    highScore = orig;
    return saved === "777";
  });

  runTest("applyCloudData", "mockData", true, () => {
    const origScore = highScore;
    const origLvl = upgrades.potion;
    applyCloudData({
      high_score: 999,
      upgrades: { potion: 5, boots: 0, magnet: 0, blast: 0 },
    });
    const success = highScore === 999 && upgrades.potion === 5;
    highScore = origScore;
    upgrades.potion = origLvl;
    return success;
  });

  runTest("checkTutorialAndProceed", "has seen = false", true, () => {
    const origSeen = hasSeenTutorial;
    hasSeenTutorial = false;
    checkTutorialAndProceed();
    const success = screens["tutorialIntroScreen"].style.display === "flex";
    hasSeenTutorial = origSeen;
    return success;
  });

  runTest("startTutorialRun", "", true, () => {
    const origTut = isTutorial;
    startTutorialRun();
    const success = isTutorial === true && tutorialStep === 1;
    isTutorial = origTut;
    return success;
  });

  runTest("endTutorial", "first time", true, () => {
    const origHasSeen = hasSeenTutorial;
    const origShards = arcaneShards;
    hasSeenTutorial = false;
    isReplayingTutorial = false;
    endTutorial();
    const success =
      hasSeenTutorial === true && arcaneShards === origShards + 10;
    hasSeenTutorial = origHasSeen;
    arcaneShards = origShards;
    return success;
  });

  // Restore real functions after tests complete
  window.saveMeta = origSaveMeta;
  window.playSound = origPlaySound;
}
