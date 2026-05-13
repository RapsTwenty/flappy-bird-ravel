const URL_API = "https://flappy-bird-ravel-production.up.railway.app";
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// SFX
const sfxScore  = new Audio("assets/ting.mp3");
sfxScore.volume = 0.6;

const sfxShield = new Audio("assets/shield.mp3");
sfxShield.volume = 0.7;

const sfxX2     = new Audio("assets/x2.mp3");
sfxX2.volume    = 0.7;

const sfxDeath  = new Audio("assets/death.mp3");
sfxDeath.volume = 0.8;

const sfxGacha  = new Audio("assets/gacha.mp3");
sfxGacha.volume = 0.8;

// ══════════════════════════════════════════
// ★ SHOP DATA — Skins & Trails
// ══════════════════════════════════════════

const SKINS = [
    {
        id: 'default', name: 'Classic', price: 0, emoji: '🐦',
        body: ['#ffe040', '#f5d000', '#c8a800'],
        glow: 'rgba(245,208,0,0.7)', wing: 'rgba(255,200,0,0.7)', beak: '#ff8c00'
    },
    {
        id: 'aqua', name: 'Aqua', price: 50, emoji: '💧',
        body: ['#40efff', '#00d0f0', '#0098b8'],
        glow: 'rgba(0,210,255,0.7)', wing: 'rgba(0,200,240,0.7)', beak: '#ff8c00'
    },
    {
        id: 'cherry', name: 'Cherry', price: 100, emoji: '🌸',
        body: ['#ff80b0', '#ff2d78', '#c0005a'],
        glow: 'rgba(255,45,120,0.7)', wing: 'rgba(255,100,150,0.7)', beak: '#ff8c00'
    },
    {
        id: 'forest', name: 'Forest', price: 150, emoji: '🌿',
        body: ['#80ff80', '#39ff14', '#20b000'],
        glow: 'rgba(57,255,20,0.7)', wing: 'rgba(100,255,50,0.7)', beak: '#ff8c00'
    },
    {
        id: 'galaxy', name: 'Galaxy', price: 200, emoji: '🔮',
        body: ['#c080ff', '#9000ff', '#5000b0'],
        glow: 'rgba(150,0,255,0.7)', wing: 'rgba(180,80,255,0.7)', beak: '#ff8c00'
    },
    {
        id: 'flame', name: 'Flame', price: 250, emoji: '🔥',
        body: ['#ff8040', '#ff3000', '#b00000'],
        glow: 'rgba(255,60,0,0.7)', wing: 'rgba(255,120,50,0.7)', beak: '#ffcc00'
    },
    {
        id: 'midnight', name: 'Midnight', price: 350, emoji: '🌙',
        body: ['#6080ff', '#2040e0', '#0010a0'],
        glow: 'rgba(80,120,255,0.7)', wing: 'rgba(80,100,220,0.7)', beak: '#ff8c00'
    },
    {
        id: 'rainbow', name: 'Rainbow', price: 500, emoji: '🌈',
        body: null, // animated via getSkinData()
        glow: 'rgba(255,100,100,0.7)', wing: 'rgba(255,200,0,0.7)', beak: '#ff8c00'
    },
];

const TRAILS = [
    { id: 'none',    name: 'None',    price: 0,   emoji: '❌', colors: [] },
    { id: 'star',    name: 'Star',    price: 75,  emoji: '⭐', colors: ['#ffe040', '#fffaaa', '#ffffff'] },
    { id: 'fire',    name: 'Fire',    price: 150, emoji: '🔥', colors: ['#ff2200', '#ff7700', '#ffcc00'] },
    { id: 'ice',     name: 'Ice',     price: 200, emoji: '❄️', colors: ['#00d0ff', '#aaf0ff', '#ffffff'] },
    { id: 'toxic',   name: 'Toxic',   price: 300, emoji: '☢️', colors: ['#39ff14', '#c0ff40', '#80ff80'] },
    { id: 'rainbow', name: 'Rainbow', price: 400, emoji: '🌈', colors: [] },
];
const GACHA_ITEMS = [
    { 
        id: 'gacha_box_1', 
        name: 'Mystery Box Trails', 
        price: 50, 
        image: 'assets/gacha.png'
    },
    { 
        id: 'gacha_box_2', 
        name: 'Mystery Box Skins', 
        price: 50, 
        image: 'assets/gachared3.png'
    },
    { 
        id: 'gacha_box_3', 
        name: 'Mystery Box Aksesoris', 
        price: 50, 
        image: 'assets/gachayellow.png'
    }
];

// ══════════════════════════════════════════
// ★ GACHA POOLS — Reward tables per box
// ══════════════════════════════════════════

const GACHA_POOLS = {
    // Mystery Box Trails — probabilitas reward
    'gacha_box_1': [
        { type: 'coins', amount: 20,       weight: 25, emoji: '🪙',  label: '+20 Koin',      rarity: 'common'   },
        { type: 'trail', id: 'star',       weight: 20, emoji: '⭐',  label: 'Trail Star',    rarity: 'common'   },
        { type: 'trail', id: 'fire',       weight: 15, emoji: '🔥',  label: 'Trail Fire',    rarity: 'uncommon' },
        { type: 'trail', id: 'ice',        weight: 15, emoji: '❄️', label: 'Trail Ice',     rarity: 'uncommon' },
        { type: 'trail', id: 'toxic',      weight: 15, emoji: '☢️', label: 'Trail Toxic',   rarity: 'uncommon' },
        { type: 'trail', id: 'rainbow',    weight: 10, emoji: '🌈',  label: 'Trail Rainbow', rarity: 'rare'     },
    ],
    // Mystery Box Skins — probabilitas reward
    'gacha_box_2': [
        { type: 'coins', amount: 20,        weight: 10, emoji: '🪙',  label: '+20 Koin',       rarity: 'common'   },
        { type: 'skin',  id: 'aqua',        weight: 20, emoji: '💧',  label: 'Skin Aqua',      rarity: 'common'   },
        { type: 'skin',  id: 'cherry',      weight: 20, emoji: '🌸',  label: 'Skin Cherry',    rarity: 'common'   },
        { type: 'skin',  id: 'forest',      weight: 15, emoji: '🌿',  label: 'Skin Forest',    rarity: 'uncommon' },
        { type: 'skin',  id: 'galaxy',      weight: 15, emoji: '🔮',  label: 'Skin Galaxy',    rarity: 'uncommon' },
        { type: 'skin',  id: 'flame',       weight: 10, emoji: '🔥',  label: 'Skin Flame',     rarity: 'uncommon' },
        { type: 'skin',  id: 'midnight',    weight: 5,  emoji: '🌙',  label: 'Skin Midnight',  rarity: 'rare'     },
        { type: 'skin',  id: 'rainbow',     weight: 5,  emoji: '🌈',  label: 'Skin Rainbow',   rarity: 'rare'     },
    ],
    // Mystery Box Aksesoris — koin 20%, sisanya merata
    'gacha_box_3': [
        { type: 'coins',   amount: 20,               weight: 20, emoji: '🪙',  label: '+20 Koin',         rarity: 'common'   },
        { type: 'hat',     id: 'hat_tophat',          weight: 9,  emoji: '🎩',  label: 'Topi Top Hat',     rarity: 'common'   },
        { type: 'hat',     id: 'hat_crown',           weight: 9,  emoji: '👑',  label: 'Topi Mahkota',     rarity: 'rare'     },
        { type: 'hat',     id: 'hat_grad',            weight: 9,  emoji: '🎓',  label: 'Topi Toga',        rarity: 'common'   },
        { type: 'hat',     id: 'hat_helmet',          weight: 9,  emoji: '🪖',  label: 'Topi Helm',        rarity: 'common'   },
        { type: 'hat',     id: 'hat_santa',           weight: 9,  emoji: '🎅',  label: 'Topi Santa',       rarity: 'uncommon' },
        { type: 'glasses', id: 'glasses_sunglasses',  weight: 9,  emoji: '🕶️', label: 'Kacamata Sunglasses', rarity: 'common' },
        { type: 'glasses', id: 'glasses_nerd',        weight: 9,  emoji: '👓',  label: 'Kacamata Nerd',    rarity: 'common'   },
        { type: 'glasses', id: 'glasses_goggles',     weight: 9,  emoji: '🥽',  label: 'Kacamata Goggles', rarity: 'uncommon' },
        { type: 'glasses', id: 'glasses_monocle',     weight: 9,  emoji: '🧐',  label: 'Kacamata Monokel', rarity: 'uncommon' },
    ],
};

/** Weighted random roll — returns one reward object */
function rollGacha(poolId) {
    const pool = GACHA_POOLS[poolId];
    if (!pool || pool.length === 0) return null;

    const totalWeight = pool.reduce((sum, r) => sum + r.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const reward of pool) {
        rand -= reward.weight;
        if (rand <= 0) return { ...reward };
    }
    return { ...pool[pool.length - 1] };
}

// ══════════════════════════════════════════
// ★ ACCESSORIES — Hats & Glasses
// ══════════════════════════════════════════

const HATS = [
    { id: 'hat_none',    name: 'Tanpa Topi',  price: 0,   emoji: '🚫', drawEmoji: null,  drawSize: 0  },
    { id: 'hat_tophat',  name: 'Top Hat',     price: 100, emoji: '🎩', drawEmoji: '🎩',  drawSize: 20 },
    { id: 'hat_crown',   name: 'Mahkota',     price: 200, emoji: '👑', drawEmoji: '👑',  drawSize: 18 },
    { id: 'hat_grad',    name: 'Toga',        price: 150, emoji: '🎓', drawEmoji: '🎓',  drawSize: 20 },
    { id: 'hat_helmet',  name: 'Helm',        price: 175, emoji: '🪖', drawEmoji: '🪖',  drawSize: 20 },
    { id: 'hat_santa',   name: 'Santa',       price: 250, emoji: '🎅', drawEmoji: '🎅',  drawSize: 20 },
];

const GLASSES = [
    { id: 'glasses_none',     name: 'Tanpa Kacamata', price: 0,   emoji: '🚫',  drawEmoji: null,  drawSize: 0  },
    { id: 'glasses_sunglasses', name: 'Sunglasses',   price: 100, emoji: '🕶️', drawEmoji: '🕶️', drawSize: 14 },
    { id: 'glasses_nerd',     name: 'Kacamata Nerd',  price: 150, emoji: '👓',  drawEmoji: '👓',  drawSize: 13 },
    { id: 'glasses_goggles',  name: 'Goggles',        price: 200, emoji: '🥽',  drawEmoji: '🥽',  drawSize: 13 },
    { id: 'glasses_monocle',  name: 'Monokel',        price: 250, emoji: '🧐',  drawEmoji: '🧐',  drawSize: 14 },
];

// ══════════════════════════════════════════
// ★ SHOP STATE
// ══════════════════════════════════════════

let userCoins    = 0;
let ownedItems   = ['default', 'none', 'hat_none', 'glasses_none'];  // IDs yang sudah dimiliki
let currentSkin  = 'default';
let currentTrail = 'none';
let currentHat     = 'hat_none';
let currentGlasses = 'glasses_none';
let shopCurrentTab = 'skins';

// ══════════════════════════════════════════
// STATE GLOBAL (game)
// ══════════════════════════════════════════

let currentUser  = localStorage.getItem("username") || null;
let gameRunning  = false;
let score        = 0;
let highScore    = parseInt(localStorage.getItem("highScore")) || 0;
let bird         = { x: 60, y: 230, width: 28, height: 24, gravity: 0.5, lift: -9, velocity: 0 };
let pipes        = [];
let frame        = 0;
let stars        = [];
let clouds       = [];
let particles    = [];
let trailParticles = [];

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// \u2605 DELTA TIME \u2014 frame-rate independent physics
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
const TARGET_FPS = 60;    // target frame rate
let   dt         = 1;     // global delta time (1.0 = one 60fps frame)
let   lastTime   = 0;     // last rAF timestamp
let   pipeTimer  = 0;    // start at 90 so first pipe spawns immediately

// ══════════════════════════════════════════
// ★ COMBO SYSTEM STATE
// ══════════════════════════════════════════
let combo       = 0;
let comboTexts  = []; // floating milestone text objects

// ══════════════════════════════════════════
// ★ POWERUP SYSTEM STATE
// ══════════════════════════════════════════
let powerups               = [];
let pipeSpawnCount         = 0;

let shieldActive           = false;
let shieldInvincible       = false;
let shieldInvincibleTimer  = 0;
const SHIELD_INVINCIBLE_DURATION = 180; // 3 sec @ 60 fps

let multiplierActive       = false;
let multiplierTimer        = 0;
const MULTIPLIER_DURATION  = 600;       // 10 sec @ 60 fps

// Generate background stars
for (let i = 0; i < 40; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * Math.PI * 2
    });
}

// Generate background clouds
for (let i = 0; i < 4; i++) {
    clouds.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 100 + 20,
        w: Math.random() * 60 + 50,
        speed: Math.random() * 0.3 + 0.1
    });
}

// ══════════════════════════════════════════
// ★ COIN SYSTEM — server + localStorage fallback
// ══════════════════════════════════════════

async function loadCoinsFromServer() {
    try {
        const res = await fetch(`${URL_API}/api/user/${currentUser}/coins`);
        if (!res.ok) throw new Error('Server error');
        const data = await res.json();
        userCoins = data.coins || 0;
    } catch {
        // Fallback ke localStorage jika server tidak tersedia
        userCoins = parseInt(localStorage.getItem(`coins_${currentUser}`)) || 0;
    }
    updateCoinDisplay();
}

async function addCoinsToServer(amount) {
    if (!amount || amount <= 0) return;
    try {
        const res = await fetch(`${URL_API}/api/user/coins/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, amount })
        });
        if (!res.ok) throw new Error('Server error');
        const data = await res.json();
        userCoins = data.coins;
    } catch {
        // Fallback localStorage
        userCoins += amount;
        localStorage.setItem(`coins_${currentUser}`, userCoins);
    }
    updateCoinDisplay(true);
}

async function deductCoinsOnServer(amount) {
    try {
        const res = await fetch(`${URL_API}/api/user/coins/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, amount: -amount })
        });
        if (!res.ok) throw new Error('Server error');
        const data = await res.json();
        userCoins = data.coins;
    } catch {
        userCoins = Math.max(0, userCoins - amount);
        localStorage.setItem(`coins_${currentUser}`, userCoins);
    }
    updateCoinDisplay();
}

function updateCoinDisplay(animate = false) {
    const el = document.getElementById('coinDisplay');
    const shopEl = document.getElementById('shopCoinDisplay');
    if (el) {
        el.textContent = userCoins;
        if (animate) {
            el.classList.remove('pop');
            void el.offsetWidth; // reflow to restart animation
            el.classList.add('pop');
            setTimeout(() => el.classList.remove('pop'), 400);
        }
    }
    if (shopEl) shopEl.textContent = userCoins;
}

// ══════════════════════════════════════════
// ★ INVENTORY — localStorage per user
// ══════════════════════════════════════════

// Load inventory from localStorage (sync, used as fallback)
function _loadInventoryLocal() {
    try {
        const raw = localStorage.getItem(`owned_${currentUser}`);
        ownedItems = raw ? JSON.parse(raw) : ['default', 'none', 'hat_none', 'glasses_none'];
    } catch { ownedItems = ['default', 'none', 'hat_none', 'glasses_none']; }
    if (!ownedItems.includes('default'))      ownedItems.push('default');
    if (!ownedItems.includes('none'))         ownedItems.push('none');
    if (!ownedItems.includes('hat_none'))     ownedItems.push('hat_none');
    if (!ownedItems.includes('glasses_none')) ownedItems.push('glasses_none');
    currentSkin    = localStorage.getItem(`skin_${currentUser}`)    || 'default';
    currentTrail   = localStorage.getItem(`trail_${currentUser}`)   || 'none';
    currentHat     = localStorage.getItem(`hat_${currentUser}`)     || 'hat_none';
    currentGlasses = localStorage.getItem(`glasses_${currentUser}`) || 'glasses_none';
}

// saveInventory: always writes to localStorage, then pushes to server silently
function saveInventory() {
    localStorage.setItem(`owned_${currentUser}`, JSON.stringify(ownedItems));
    localStorage.setItem(`skin_${currentUser}`,    currentSkin);
    localStorage.setItem(`trail_${currentUser}`,   currentTrail);
    localStorage.setItem(`hat_${currentUser}`,     currentHat);
    localStorage.setItem(`glasses_${currentUser}`, currentGlasses);
    // Fire-and-forget server sync
    fetch(`${URL_API}/api/user/${currentUser}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownedItems, currentSkin, currentTrail, currentHat, currentGlasses })
    }).catch(() => {});
}

// loadInventory: loads localStorage immediately (fast), then syncs from server
function loadInventory() {
    _loadInventoryLocal(); // immediate display
    fetch(`${URL_API}/api/user/${currentUser}/inventory`)
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => {
            ownedItems    = d.ownedItems    || ['default','none','hat_none','glasses_none'];
            currentSkin   = d.currentSkin   || 'default';
            currentTrail  = d.currentTrail  || 'none';
            currentHat    = d.currentHat    || 'hat_none';
            currentGlasses= d.currentGlasses|| 'glasses_none';
            if (!ownedItems.includes('default'))      ownedItems.push('default');
            if (!ownedItems.includes('none'))         ownedItems.push('none');
            if (!ownedItems.includes('hat_none'))     ownedItems.push('hat_none');
            if (!ownedItems.includes('glasses_none')) ownedItems.push('glasses_none');
            // Update localStorage cache
            localStorage.setItem(`owned_${currentUser}`,   JSON.stringify(ownedItems));
            localStorage.setItem(`skin_${currentUser}`,    currentSkin);
            localStorage.setItem(`trail_${currentUser}`,   currentTrail);
            localStorage.setItem(`hat_${currentUser}`,     currentHat);
            localStorage.setItem(`glasses_${currentUser}`, currentGlasses);
            if (!gameRunning) drawIdleScreen();
        })
        .catch(() => {}); // already loaded from localStorage above
}


// ══════════════════════════════════════════
// ★ SKIN HELPER
// ══════════════════════════════════════════

function getSkinData() {
    const skin = SKINS.find(s => s.id === currentSkin) || SKINS[0];
    if (skin.id === 'rainbow') {
        const t = Date.now() / 800;
        const h = (t * 60) % 360;
        return {
            ...skin,
            body: [
                `hsl(${h % 360}, 100%, 65%)`,
                `hsl(${(h + 40) % 360}, 100%, 50%)`,
                `hsl(${(h + 80) % 360}, 100%, 35%)`
            ],
            glow: `hsla(${h % 360}, 100%, 60%, 0.8)`,
            wing: `hsla(${(h + 120) % 360}, 100%, 60%, 0.7)`
        };
    }
    return skin;
}

// ══════════════════════════════════════════
// AUTH SYSTEM
// ══════════════════════════════════════════

function toggleAuth() {
    document.getElementById("loginForm").classList.toggle("hidden");
    document.getElementById("registerForm").classList.toggle("hidden");
}

// ======================================================
// AUTH TOAST NOTIFICATION
// ======================================================
function showAuthToast(message, type = "error") {
    // Remove existing toast if any
    const existing = document.getElementById("authToast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "authToast";
    toast.className = `auth-toast auth-toast--${type}`;
    toast.innerHTML = `
        <span class="auth-toast-icon">${type === "success" ? "\u2714" : "\u2716"}</span>
        <span class="auth-toast-msg">${message}</span>
    `;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add("auth-toast--show"));

    // Auto-dismiss after 2.8s
    setTimeout(() => {
        toast.classList.remove("auth-toast--show");
        setTimeout(() => toast.remove(), 400);
    }, 2800);
}

async function register() {
    const username = document.getElementById("regUser").value;
    const password = document.getElementById("regPass").value;
    const res = await fetch(`${URL_API}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        showAuthToast(data.message, "success");
        setTimeout(() => toggleAuth(), 1000);
    } else {
        showAuthToast(data.message, "error");
    }
}

async function login() {
    const username = document.getElementById("loginUser").value;
    const password = document.getElementById("loginPass").value;
    const res = await fetch(`${URL_API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
        currentUser = data.username;
        localStorage.setItem("username", data.username);
        initGameSession();
    } else {
        showAuthToast(data.message, "error");
    }
}

function logout() {
    bgm.pause();
    bgm.currentTime = 0;
    localStorage.removeItem("username");
    location.reload();
}

// ══════════════════════════════════════════
// GAME SESSION
// ══════════════════════════════════════════

const bgm = document.getElementById("bgm");

// ══════════════════════════════════════════
// SOUND MUTE TOGGLE
// ══════════════════════════════════════════

let isMuted = localStorage.getItem('soundMuted') === 'true';

function applyMuteState() {
    const allSfx = [sfxScore, sfxShield, sfxX2, sfxDeath, sfxGacha];
    allSfx.forEach(s => { if (s) s.muted = isMuted; });
    if (bgm) bgm.muted = isMuted;
    const icon  = isMuted ? '🔇' : '🔊';
    const label = isMuted ? 'MUTED' : 'SOUND';
    ['muteBtn', 'muteBtnMobile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.innerHTML = `${icon} ${label}`; el.classList.toggle('muted', isMuted); }
    });
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('soundMuted', isMuted);
    applyMuteState();
}


function initGameSession() {
    document.getElementById("authPage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");

    bgm.volume = 0.4;
    if (!isMuted) bgm.play().catch(() => {});
    applyMuteState();

    const nameEl = document.getElementById("playerName");
    if (nameEl) nameEl.textContent = (currentUser || "GUEST").toUpperCase();

    // Load inventory & coins
    loadInventory();
    loadCoinsFromServer();
    loadLeaderboard();
    drawIdleScreen();
}

function startGame() {
    document.getElementById("startScreen").classList.add("hidden");
    resetGame();
}

// ══════════════════════════════════════════
// INPUT
// ══════════════════════════════════════════

window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!gameRunning) {
            const startScreen = document.getElementById("startScreen");
            const gameOver    = document.getElementById("gameOverModal");
            if (!startScreen.classList.contains("hidden")) {
                startGame();
            } else if (!gameOver.classList.contains("hidden")) {
                resetGame();
            }
        } else {
            birdFlap();
        }
    }
});

canvas.addEventListener("click", () => {
    if (gameRunning) birdFlap();
});

function birdFlap() {
    bird.velocity = bird.lift;
    spawnFlapParticles();
}

// ══════════════════════════════════════════
// PARTICLES — Flap
// ══════════════════════════════════════════

function spawnFlapParticles() {
    for (let i = 0; i < 4; i++) {
        particles.push({
            x: bird.x + bird.width / 2,
            y: bird.y + bird.height,
            vx: (Math.random() - 0.5) * 3,
            vy: Math.random() * 2 + 1,
            life: 1,
            decay: 0.08 + Math.random() * 0.06,
            size: Math.random() * 4 + 2,
            color: `hsl(${45 + Math.random() * 30}, 100%, 65%)`
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.life -= p.decay * dt;
        p.size *= Math.pow(0.95, dt);
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ══════════════════════════════════════════
// ★ TRAIL PARTICLES
// ══════════════════════════════════════════

function spawnTrailParticle() {
    const trail = TRAILS.find(t => t.id === currentTrail);
    if (!trail || trail.id === 'none') return;

    let color;
    if (trail.id === 'rainbow') {
        color = `hsl(${(frame * 10) % 360}, 100%, 65%)`;
    } else {
        color = trail.colors[Math.floor(Math.random() * trail.colors.length)];
    }

    const isStar = trail.id === 'star';

    trailParticles.push({
        x: bird.x + bird.width * 0.3,
        y: bird.y + bird.height / 2 + (Math.random() - 0.5) * 8,
        vx: -(1.5 + Math.random() * 1.5),
        vy: (Math.random() - 0.5) * 1.2,
        life: 1,
        decay: 0.025 + Math.random() * 0.025,
        size: Math.random() * 5 + 3,
        color,
        isStar
    });
}

function updateTrailParticles() {
    trailParticles = trailParticles.filter(p => p.life > 0);
    trailParticles.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.life -= p.decay * dt;
        p.size *= Math.pow(0.97, dt);
    });
}

function drawStarShape(cx, cy, spikes, outerR, innerR) {
    let rot = -(Math.PI / 2);
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    for (let i = 0; i < spikes; i++) {
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    }
    ctx.closePath();
}

function drawTrailParticles() {
    trailParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life * 0.85;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        if (p.isStar) {
            drawStarShape(p.x, p.y, 4, p.size, p.size * 0.4);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// ══════════════════════════════════════════
// ★ COMBO SYSTEM — Milestone texts & Fever
// ══════════════════════════════════════════

const COMBO_MILESTONES = {
    5:  { text: 'GREAT!',    color: '#00f0ff', size: 22 },
    10: { text: 'GREAT!!',   color: '#40ffff', size: 24 },
    20: { text: 'AWESOME!',  color: '#6090ff', size: 26 },
    30: { text: 'AWESOME!!', color: '#60a0ff', size: 28 },
    40: { text: '🔥 FEVER!!',  color: '#ff7030', size: 28 },
    50: { text: '🔥 MAX FEVER!!', color: '#ff2000', size: 30 },
};

function triggerComboMilestone(c) {
    const m = COMBO_MILESTONES[c];
    if (!m) return;
    comboTexts.push({
        text: m.text, color: m.color, size: m.size,
        x: canvas.width / 2,
        y: canvas.height / 2 - 50,
        vy: -1.4,
        life: 1,
        decay: 0.016
    });
}

function updateComboTexts() {
    comboTexts = comboTexts.filter(t => t.life > 0);
    comboTexts.forEach(t => { t.y += t.vy * dt; t.life -= t.decay * dt; });
}

function drawComboTexts() {
    comboTexts.forEach(t => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.life * 2); // fade in fast, fade out slow
        ctx.font = `900 ${t.size}px 'Orbitron', sans-serif`;
        ctx.fillStyle = t.color;
        ctx.shadowBlur = 28;
        ctx.shadowColor = t.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Scale-in pop effect based on life near 1
        const scale = t.life > 0.88 ? 0.5 + (1 - t.life) * (1 / 0.12) * 0.5 : 1;
        ctx.translate(t.x, t.y);
        ctx.scale(scale, scale);
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
    });
}

function drawFeverEffect() {
    if (combo < 20) return;

    const isFever2 = combo >= 50; // red tier
    const tPulse   = Date.now() / 300;
    const pulse    = 0.5 + 0.5 * Math.sin(tPulse * (isFever2 ? 4 : 2.5));

    // ── Border glow ──────────────────────────────
    let r, g, b;
    if (isFever2) { r = 255; g = Math.floor(20 + 40 * pulse); b = 0; }
    else          { r = 20;  g = Math.floor(80 + 80 * pulse); b = 255; }

    const alpha  = 0.4 + 0.4 * pulse;
    const borderW = 10 + 6 * pulse;
    const blur    = 24 + 20 * pulse;

    ctx.save();
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.lineWidth    = borderW;
    ctx.shadowBlur   = blur;
    ctx.shadowColor  = `rgba(${r},${g},${b},1)`;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // ── Subtle full-canvas tint at top & bottom edges ──
    ctx.save();
    const edgeAlpha = 0.06 + 0.06 * pulse;
    ['top', 'bottom'].forEach(side => {
        const grad = ctx.createLinearGradient(
            0, side === 'top' ? 0 : canvas.height,
            0, side === 'top' ? canvas.height * 0.35 : canvas.height * 0.65
        );
        grad.addColorStop(0,   `rgba(${r},${g},${b},${edgeAlpha})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    ctx.restore();
}

// ══════════════════════════════════════════
// ★ POWERUP SYSTEM — Config & Functions
// ══════════════════════════════════════════

const POWERUP_CONFIG = {
    shield: {
        symbol:    '🛡️',
        color:     '#00f0ff',
        glowColor: 'rgba(0,240,255,0.9)',
        bgColor:   'rgba(0,220,255,0.18)',
        labelText: '🛡️ SHIELD!',
        labelColor:'#00f0ff'
    },
    multiplier: {
        symbol:    '×2',
        color:     '#f5d000',
        glowColor: 'rgba(245,208,0,0.9)',
        bgColor:   'rgba(245,208,0,0.15)',
        labelText: '×2 SCORE!',
        labelColor:'#f5d000'
    }
};

// Apply powerup effect when collected
function applyPowerup(type) {
    const cfg = POWERUP_CONFIG[type];
    if (type === 'shield') {
        shieldActive = true;
        sfxShield.currentTime = 0;
        sfxShield.play();
    } else if (type === 'multiplier') {
        multiplierActive = true;
        multiplierTimer  = MULTIPLIER_DURATION;
        sfxX2.currentTime = 0;
        sfxX2.play();
    }
    // Push floating pickup text (reuses comboTexts system)
    comboTexts.push({
        text:  cfg.labelText,
        color: cfg.labelColor,
        size:  20,
        x:     canvas.width / 2,
        y:     canvas.height / 2 + 30,
        vy:    -1.2,
        life:  1,
        decay: 0.014
    });
}

// Draw powerup items floating in the gap
function drawPowerups() {
    powerups.forEach(p => {
        if (p.collected) return;
        const cfg = POWERUP_CONFIG[p.type];
        const bob = Math.sin(Date.now() / 500 + p.bobOffset) * 5;
        const px  = p.x, py = p.y + bob, r = p.size;
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 280 + p.bobOffset);

        ctx.save();

        // Outer pulsing ring
        ctx.shadowBlur   = 18 * pulse;
        ctx.shadowColor  = cfg.glowColor;
        ctx.strokeStyle  = cfg.color;
        ctx.lineWidth    = 2.5;
        ctx.globalAlpha  = 0.85 + 0.15 * pulse;
        ctx.beginPath();
        ctx.arc(px, py, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Second inner ring (shimmer)
        ctx.strokeStyle  = cfg.color;
        ctx.lineWidth    = 1;
        ctx.globalAlpha  = 0.3 * pulse;
        ctx.shadowBlur   = 0;
        ctx.beginPath();
        ctx.arc(px, py, r + 9, 0, Math.PI * 2);
        ctx.stroke();

        // Filled background circle
        ctx.fillStyle   = cfg.bgColor;
        ctx.globalAlpha = 1;
        ctx.shadowBlur  = 12;
        ctx.shadowColor = cfg.glowColor;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        // Symbol / text
        ctx.shadowBlur = 14;
        ctx.globalAlpha = 1;
        if (p.type === 'multiplier') {
            ctx.font         = `900 ${Math.round(r * 0.95)}px 'Orbitron', sans-serif`;
            ctx.fillStyle    = cfg.color;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('×2', px, py + 1);
        } else {
            ctx.font         = `${Math.round(r * 1.15)}px sans-serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cfg.symbol, px, py + 1);
        }

        ctx.restore();
    });
}

// Draw cyan shield bubble around bird (active or invincible blinking)
function drawShieldEffect() {
    if (!shieldActive && !shieldInvincible) return;

    const bx    = bird.x + bird.width  / 2;
    const by    = bird.y + bird.height / 2;
    const r     = bird.width * 0.85 + 7;
    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 180);

    // Blinking during invincibility
    if (shieldInvincible && Math.floor(Date.now() / 90) % 2 === 0) return;

    ctx.save();
    ctx.shadowBlur  = 22;
    ctx.shadowColor = 'rgba(0,240,255,0.9)';
    ctx.strokeStyle = shieldInvincible
        ? `rgba(0,240,255,0.55)`
        : `rgba(0,240,255,${pulse})`;
    ctx.lineWidth   = shieldInvincible ? 2 : 3;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.stroke();

    if (shieldActive) {
        ctx.fillStyle = `rgba(0,240,255,${pulse * 0.12})`;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Draw active powerup indicators (top-left corner of canvas)
function drawPowerupHUD() {
    if (!shieldActive && !shieldInvincible && !multiplierActive) return;

    let hx = 8, hy = 8;

    // ── Shield indicator ──
    if (shieldActive || shieldInvincible) {
        const blink = shieldInvincible && Math.floor(Date.now() / 220) % 2 === 0;
        ctx.save();
        ctx.globalAlpha = blink ? 0.25 : 1;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = '#00f0ff';

        ctx.fillStyle   = 'rgba(0,240,255,0.15)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.roundRect(hx, hy, 52, 22, 11);
        ctx.fill();
        ctx.stroke();

        ctx.font          = '13px sans-serif';
        ctx.textBaseline  = 'middle';
        ctx.fillText('🛡️', hx + 4, hy + 11);

        ctx.fillStyle     = '#00f0ff';
        ctx.font          = `bold 8px 'Orbitron', sans-serif`;
        ctx.fillText(shieldInvincible ? 'INV' : 'ON', hx + 26, hy + 11);

        ctx.restore();
        hx += 60;
    }

    // ── Multiplier indicator ──
    if (multiplierActive) {
        const secsLeft = Math.ceil(multiplierTimer / 60);
        ctx.save();
        ctx.shadowBlur  = 10;
        ctx.shadowColor = 'rgba(245,208,0,0.8)';

        ctx.fillStyle   = 'rgba(245,208,0,0.15)';
        ctx.strokeStyle = '#f5d000';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.roundRect(hx, hy, 58, 22, 11);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle     = '#f5d000';
        ctx.font          = `bold 9px 'Orbitron', sans-serif`;
        ctx.textBaseline  = 'middle';
        ctx.textAlign     = 'left';
        ctx.fillText(`×2  ${secsLeft}s`, hx + 7, hy + 11);

        ctx.restore();
    }
}

// ══════════════════════════════════════════
// PIPE CREATION
// ══════════════════════════════════════════

function createPipe() {
    let gap = 140; // ATUR BATAS PIPA
    let minPipeHeight = 60;
    let pipeTopHeight = Math.random() * (canvas.height - gap - minPipeHeight * 2) + minPipeHeight;
    pipes.push({ x: canvas.width, y: 0, width: 52, height: pipeTopHeight, type: 'top', scored: false });
    pipes.push({ x: canvas.width, y: pipeTopHeight + gap, width: 52, height: canvas.height - pipeTopHeight - gap, type: 'bottom' });

    // ── Powerup spawn: every 3rd pipe, 55% chance ──
    pipeSpawnCount++;
    if (pipeSpawnCount % 3 === 0 && Math.random() < 0.55) {
        // Don't stack shield if already active
        const available = [];
        if (!shieldActive && !shieldInvincible) available.push('shield');
        if (!multiplierActive)                  available.push('multiplier');
        if (available.length === 0) return;

        const type = available[Math.floor(Math.random() * available.length)];
        powerups.push({
            type,
            x:          canvas.width + 26,        // horizontal centre of the pipe column
            y:          pipeTopHeight + gap / 2,   // vertical centre of the gap
            size:       16,
            collected:  false,
            bobOffset:  Math.random() * Math.PI * 2
        });
    }
}

// ══════════════════════════════════════════
// UPDATE LOGIC
// ══════════════════════════════════════════

function update() {
    if (!gameRunning) return;
    bird.velocity += bird.gravity * dt;
    bird.y        += bird.velocity * dt;

    clouds.forEach(c => {
        c.x -= c.speed * dt;
        if (c.x + c.w < 0) c.x = canvas.width + 20;
    });
    stars.forEach(s => { s.twinkle += 0.05 * dt; });

    // Pipe spawning: time-based so speed is identical at any refresh rate
    pipeTimer -= dt;
    if (pipeTimer <= 0) { createPipe(); pipeTimer = 90; }

    pipes.forEach((pipe, index) => {
        pipe.x -= 2.5 * dt;

        const margin = 3;
        if (bird.x + bird.width - margin > pipe.x &&
            bird.x + margin < pipe.x + pipe.width &&
            bird.y + bird.height - margin > pipe.y &&
            bird.y + margin < pipe.y + pipe.height) {
            if (shieldActive && !shieldInvincible) {
                shieldActive          = false;
                shieldInvincible      = true;
                shieldInvincibleTimer = SHIELD_INVINCIBLE_DURATION;
            } else if (!shieldInvincible) {
                gameOver();
            }
        }

        if (pipe.type === 'top' && !pipe.scored && pipe.x + pipe.width < bird.x) {
            pipe.scored = true;
            combo++;
            triggerComboMilestone(combo);
            // Fever multiplier: blue (combo≥20)=×2, red (combo≥50)=×3
            const feverMult = combo >= 50 ? 3 : (combo >= 20 ? 2 : 1);
            const powerMult = multiplierActive ? 2 : 1;
            score += 100 * feverMult * powerMult;
            sfxScore.currentTime = 0;
            sfxScore.play();
            updateLiveScore();
        }

        if (pipe.x + pipe.width < 0) pipes.splice(index, 1);
    });

    updateParticles();
    updateTrailParticles();
    updateComboTexts();
    spawnTrailParticle();

    // ── Shield invincibility countdown ──
    if (shieldInvincible) {
        shieldInvincibleTimer -= dt;
        if (shieldInvincibleTimer <= 0) {
            shieldInvincible      = false;
            shieldInvincibleTimer = 0;
        }
    }

    // ── Score multiplier countdown ──
    if (multiplierActive) {
        multiplierTimer -= dt;
        if (multiplierTimer <= 0) {
            multiplierActive = false;
            multiplierTimer  = 0;
        }
    }

    // ── Move powerups & collect ──
    powerups.forEach(p => { p.x -= 2.5 * dt; });
    powerups = powerups.filter(p => p.x + p.size > -10 && !p.collected);

    powerups.forEach(p => {
        const hitR = p.size + 8; // generous pickup radius
        const dx   = (bird.x + bird.width / 2)  - p.x;
        const dy   = (bird.y + bird.height / 2) - p.y;
        if (Math.sqrt(dx * dx + dy * dy) < hitR) {
            p.collected = true;
            applyPowerup(p.type);
        }
    });

    // ── Floor / ceiling ──
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        if (shieldActive && !shieldInvincible) {
            shieldActive          = false;
            shieldInvincible      = true;
            shieldInvincibleTimer = SHIELD_INVINCIBLE_DURATION;
            bird.velocity         = bird.lift * 0.5;
            if (bird.y < 0)                              bird.y = 4;
            else if (bird.y + bird.height > canvas.height) bird.y = canvas.height - bird.height - 4;
        } else if (!shieldInvincible) {
            gameOver();
        }
    }

    frame += dt;
}

function updateLiveScore() {
    const el = document.getElementById("liveScore");
    if (el) {
        el.textContent = score;
        el.style.transform = "scale(1.3)";
        el.style.transition = "transform 0.1s";
        setTimeout(() => { el.style.transform = "scale(1)"; }, 150);
    }
}

// ══════════════════════════════════════════
// DRAW
// ══════════════════════════════════════════

function drawIdleScreen() {
    drawBackground();
    drawBird();
}

function draw() {
    drawBackground();
    drawTrailParticles();
    drawPowerups();
    drawPipes();
    // Bird blinks during shield invincibility
    if (shieldInvincible && Math.floor(Date.now() / 90) % 2 === 0) ctx.globalAlpha = 0.2;
    drawBird();
    ctx.globalAlpha = 1;
    drawShieldEffect();
    drawParticles();
    drawFeverEffect();
    drawComboTexts();
    drawPowerupHUD();
}

function drawBackground() {
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#07091a");
    skyGrad.addColorStop(0.6, "#0d1640");
    skyGrad.addColorStop(0.85, "#1a3a2a");
    skyGrad.addColorStop(1, "#0d2010");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
        const a = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    });

    // Moon
    ctx.fillStyle = "rgba(240,240,200,0.9)";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(240,240,150,0.5)";
    ctx.beginPath();
    ctx.arc(canvas.width - 50, 45, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0d1640";
    ctx.beginPath();
    ctx.arc(canvas.width - 43, 40, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Clouds
    clouds.forEach(c => {
        ctx.fillStyle = "rgba(30,55,100,0.5)";
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w / 2, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x - c.w * 0.2, c.y + 5, c.w * 0.35, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x + c.w * 0.2, c.y + 4, c.w * 0.3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // Ground glow
    let groundGrad = ctx.createLinearGradient(0, canvas.height - 40, 0, canvas.height);
    groundGrad.addColorStop(0, "rgba(57,255,20,0)");
    groundGrad.addColorStop(1, "rgba(57,255,20,0.12)");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

    ctx.strokeStyle = "rgba(57,255,20,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 1);
    ctx.lineTo(canvas.width, canvas.height - 1);
    ctx.stroke();
}

function drawBird() {
    const skin = getSkinData();
    const bx = bird.x, by = bird.y, bw = bird.width, bh = bird.height;
    const angle = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.8);

    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.rotate(angle);

    ctx.shadowBlur = 18;
    ctx.shadowColor = skin.glow;

    // Body
    let bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, bw);
    bodyGrad.addColorStop(0, skin.body[0]);
    bodyGrad.addColorStop(0.6, skin.body[1]);
    bodyGrad.addColorStop(1, skin.body[2]);
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = skin.body[0] + '99';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 7);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Wing
    ctx.fillStyle = skin.wing;
    ctx.beginPath();
    ctx.ellipse(-3, 4, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = "#001a40";
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(7, -5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#001a40";
    ctx.beginPath();
    ctx.arc(7.5, -4.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = skin.beak;
    ctx.beginPath();
    ctx.moveTo(bw / 2 - 2, -1);
    ctx.lineTo(bw / 2 + 6, 1);
    ctx.lineTo(bw / 2 - 2, 3);
    ctx.closePath();
    ctx.fill();

    // ── AKSESORI: Kacamata (di depan mata) ──
    const glassesItem = GLASSES.find(g => g.id === currentGlasses);
    if (glassesItem && glassesItem.drawEmoji) {
        ctx.save();
        ctx.shadowBlur   = 0;
        ctx.globalAlpha  = 1;
        ctx.font         = `${glassesItem.drawSize}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(glassesItem.drawEmoji, 6, -3);
        ctx.restore();
    }

    // ── AKSESORI: Topi (di atas kepala) ──
    const hatItem = HATS.find(h => h.id === currentHat);
    if (hatItem && hatItem.drawEmoji) {
        ctx.save();
        ctx.shadowBlur   = 0;
        ctx.globalAlpha  = 1;
        ctx.font         = `${hatItem.drawSize}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(hatItem.drawEmoji, 2, -bh / 2 + 3);
        ctx.restore();
    }

    ctx.restore();
}

function drawPipes() {
    pipes.forEach(pipe => {
        const pw = pipe.pw || pipe.width;

        let pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pw, 0);
        pipeGrad.addColorStop(0, "#0d3320");
        pipeGrad.addColorStop(0.2, "#27ae60");
        pipeGrad.addColorStop(0.5, "#2ecc71");
        pipeGrad.addColorStop(0.8, "#27ae60");
        pipeGrad.addColorStop(1, "#0d3320");
        ctx.fillStyle = pipeGrad;
        ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(57,255,20,0.4)";
        ctx.strokeStyle = "rgba(57,255,20,0.5)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
        ctx.shadowBlur = 0;

        const capH = 20, capW = pipe.width + 8, capX = pipe.x - 4;
        let capY = pipe.type === 'top' ? pipe.height - capH : pipe.y;

        let capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
        capGrad.addColorStop(0, "#0a2e14");
        capGrad.addColorStop(0.3, "#2ecc71");
        capGrad.addColorStop(0.7, "#2ecc71");
        capGrad.addColorStop(1, "#0a2e14");
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.roundRect(capX, capY, capW, capH, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(57,255,20,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(capX, capY, capW, capH, 4);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.07)";
        ctx.fillRect(pipe.x + 8, pipe.y, 6, pipe.height);
    });
}

// ══════════════════════════════════════════
// GAME LOOP
// ══════════════════════════════════════════

function loop(timestamp) {
    // Compute global dt (normalised: 1.0 = one 60fps frame)
    if (!lastTime) lastTime = timestamp;
    dt = (timestamp - lastTime) / (1000 / TARGET_FPS);
    if (dt > 3) dt = 3; // cap to avoid giant jumps after tab-switch
    lastTime = timestamp;

    update();
    draw();
    if (gameRunning) requestAnimationFrame(loop);
}

// ══════════════════════════════════════════
// GAME OVER
// ══════════════════════════════════════════

function gameOver() {
    gameRunning = false;
    sfxDeath.currentTime = 0;
    sfxDeath.play();
    combo = 0;
    comboTexts = [];
    // Reset powerup state
    shieldActive          = false;
    shieldInvincible      = false;
    shieldInvincibleTimer = 0;
    multiplierActive      = false;
    multiplierTimer       = 0;
    document.getElementById("gameOverModal").classList.remove("hidden");
    document.getElementById("finalScore").innerText = score;

    // Show coins earned (100 score = 1 coin)
    const earnedEl = document.getElementById("coinsEarned");
    const earnedAmt = document.getElementById("coinsEarnedAmt");
    const coinsFromScore = Math.floor(score / 100);
    if (score > 0) {
        earnedAmt.textContent = coinsFromScore;
        earnedEl.classList.remove("hidden");
    } else {
        earnedEl.classList.add("hidden");
    }

    // Check new record
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
        const recordEl = document.getElementById("newRecord");
        if (recordEl) recordEl.classList.remove("hidden");
    } else {
        const recordEl = document.getElementById("newRecord");
        if (recordEl) recordEl.classList.add("hidden");
    }

    if (score > 0) {
        submitScoreAuto();
        addCoinsToServer(coinsFromScore); // ★ 100 score = 1 coin
    }
}

async function submitScoreAuto() {
    try {
        await fetch(`${URL_API}/api/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentUser, score: score })
        });
        loadLeaderboard();
    } catch (error) {
        console.error("Gagal menyimpan skor:", error);
    }
}

function resetGame() {
    bird.y = 230; bird.velocity = 0;
    pipes = []; particles = []; trailParticles = []; powerups = [];
    score = 0; frame = 0; combo = 0; comboTexts = [];
    pipeSpawnCount        = 0;
    shieldActive          = false;
    shieldInvincible      = false;
    shieldInvincibleTimer = 0;
    multiplierActive      = false;
    multiplierTimer       = 0;
    gameRunning = true;
    lastTime  = 0;   // reset so dt is 0 on first new frame
    pipeTimer = 90;  // spawn first pipe immediately
    document.getElementById("gameOverModal").classList.add("hidden");
    updateLiveScore();
    requestAnimationFrame(loop);
}

// ══════════════════════════════════════════
// LEADERBOARD
// ══════════════════════════════════════════

const MEDALS = ["🥇", "🥈", "🥉"];

// ── Mini bird avatar renderer ──────────────
// Draws a 48×48 bird (skin + hat + glasses) onto an offscreen canvas
// and returns a PNG data-URL so it can be used in <img> tags.
function drawMiniAvatarToDataURL(skinId, hatId, glassesId) {
    const SIZE = 48;
    const oc   = document.createElement('canvas');
    oc.width   = SIZE;
    oc.height  = SIZE;
    const c    = oc.getContext('2d');

    // ── Skin colours ──
    let skinData = SKINS.find(s => s.id === skinId) || SKINS[0];
    let bodyColors = skinData.body;
    if (skinId === 'rainbow') {
        const t = Date.now() / 800;
        const h = (t * 60) % 360;
        bodyColors = [
            `hsl(${h % 360}, 100%, 65%)`,
            `hsl(${(h + 40) % 360}, 100%, 50%)`,
            `hsl(${(h + 80) % 360}, 100%, 35%)`
        ];
        skinData = { ...skinData, body: bodyColors, glow: `hsla(${h%360},100%,60%,0.8)`, wing: `hsla(${(h+120)%360},100%,60%,0.7)` };
    }

    const cx = SIZE / 2 - 2;  // slight left-centre
    const cy = SIZE / 2 + 4;  // push down to leave hat room
    const BW = 22, BH = 18;   // bird width/height (matches game scale ~22×18)

    // ── Glow ──
    c.shadowBlur  = 14;
    c.shadowColor = skinData.glow || 'rgba(245,208,0,0.7)';

    // ── Body (rounded rect like the real bird) ──
    const grad = c.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, BW);
    grad.addColorStop(0,   bodyColors[0]);
    grad.addColorStop(0.6, bodyColors[1]);
    grad.addColorStop(1,   bodyColors[2]);
    c.fillStyle   = grad;
    c.strokeStyle = bodyColors[0] + '99';
    c.lineWidth   = 1.5;
    c.beginPath();
    c.roundRect(cx - BW / 2, cy - BH / 2, BW, BH, 6);
    c.fill();
    c.stroke();

    c.shadowBlur = 0;

    // ── Wing ──
    c.fillStyle = skinData.wing;
    c.beginPath();
    c.ellipse(cx - 4, cy + 3, 7, 4, -0.3, 0, Math.PI * 2);
    c.fill();

    // ── Eye socket ──
    c.fillStyle = '#001a40';
    c.beginPath();
    c.arc(cx + 5, cy - 3, 4.5, 0, Math.PI * 2);
    c.fill();
    // White highlight
    c.fillStyle = 'white';
    c.beginPath();
    c.arc(cx + 6, cy - 4, 2, 0, Math.PI * 2);
    c.fill();
    // Pupil
    c.fillStyle = '#001a40';
    c.beginPath();
    c.arc(cx + 6.5, cy - 3.5, 1, 0, Math.PI * 2);
    c.fill();

    // ── Beak ──
    c.fillStyle = skinData.beak || '#ff8c00';
    c.beginPath();
    c.moveTo(cx + BW / 2 - 2, cy - 1);
    c.lineTo(cx + BW / 2 + 6, cy + 1);
    c.lineTo(cx + BW / 2 - 2, cy + 3);
    c.closePath();
    c.fill();

    // ── Glasses (on face) ──
    const glassesItem = GLASSES.find(g => g.id === glassesId);
    if (glassesItem && glassesItem.drawEmoji) {
        c.font         = `${Math.round(glassesItem.drawSize * 0.85)}px sans-serif`;
        c.textAlign    = 'center';
        c.textBaseline = 'middle';
        c.fillText(glassesItem.drawEmoji, cx + 5, cy - 3);
    }

    // ── Hat (above head) ──
    const hatItem = HATS.find(h => h.id === hatId);
    if (hatItem && hatItem.drawEmoji) {
        c.font         = `${Math.round(hatItem.drawSize * 0.9)}px sans-serif`;
        c.textAlign    = 'center';
        c.textBaseline = 'bottom';
        c.fillText(hatItem.drawEmoji, cx, cy - BH / 2 + 2);
    }

    return oc.toDataURL();
}

async function loadLeaderboard() {
    try {
        const res  = await fetch(`${URL_API}/api/leaderboard`);
        const data = await res.json();

        // Server now returns pre-aggregated top-10 with skin/hat/glasses
        const list = document.getElementById("scoreList");
        list.innerHTML = data.map((s, i) => {
            const avatarSrc = drawMiniAvatarToDataURL(
                s.skin    || 'default',
                s.hat     || 'hat_none',
                s.glasses || 'glasses_none'
            );
            return `
            <li style="animation-delay:${i * 0.06}s">
                <span class="lb-player-info">
                    <span class="lb-rank-badge">${MEDALS[i] || `#${i+1}`}</span>
                    <img class="lb-avatar" src="${avatarSrc}" alt="${s.username}" title="${s.username}">
                    <span class="lb-player-name">${s.username}</span>
                </span>
                <b>${s.score}</b>
            </li>`;
        }).join("") || `<li class="lb-loading">Belum ada data</li>`;

    } catch {
        document.getElementById("scoreList").innerHTML = `<li class="lb-loading">Gagal memuat</li>`;
    }
}

// ══════════════════════════════════════════
// ★ SHOP FUNCTIONS
// ══════════════════════════════════════════

function openShop() {
    renderShopItems(shopCurrentTab);
    document.getElementById('shopModal').classList.remove('hidden');
}

function closeShop() {
    document.getElementById('shopModal').classList.add('hidden');
}

function switchTab(tab) {
    shopCurrentTab = tab;
    renderShopItems(tab);
}

function renderShopItems(tab) {
    let items;
    if (tab === 'skins') items = SKINS;
    else if (tab === 'trails') items = TRAILS;
    else if (tab === 'accessories') items = null; // handled separately below
    else items = GACHA_ITEMS;

    const container = document.getElementById('shopItems');

    // ── ACCESSORIES tab: tampilkan Hats + Glasses dalam dua seksi ──
    if (tab === 'accessories') {
        const renderAccSection = (list, accType, currentEquipped) => list.map((item, idx) => {
            const owned    = ownedItems.includes(item.id);
            const equipped = currentEquipped === item.id;
            const canAfford = userCoins >= item.price;

            let btnClass, btnText;
            if (equipped) {
                btnClass = 'shop-btn equipped';
                btnText  = '✓ DIPAKAI';
            } else if (owned) {
                btnClass = 'shop-btn equip';
                btnText  = 'PAKAI';
            } else {
                btnClass = 'shop-btn buy' + (!canAfford ? ' disabled' : '');
                btnText  = item.price === 0 ? 'FREE' : `🪙 ${item.price}`;
            }

            const cardClass = [
                'shop-item',
                equipped ? 'shop-item-equipped' : '',
                !owned && !canAfford && item.price > 0 ? 'cant-afford' : ''
            ].join(' ').trim();

            return `
                <div class="${cardClass}" style="animation-delay:${idx * 0.04}s">
                    <div class="shop-item-emoji">${item.emoji}</div>
                    <div class="shop-item-name">${item.name}</div>
                    <button class="${btnClass}" onclick="handleShopClick('${item.id}','${accType}')">${btnText}</button>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="acc-section-label">🎩 Topi</div>
            ${renderAccSection(HATS, 'hat', currentHat)}
            <div class="acc-section-label">👓 Kacamata</div>
            ${renderAccSection(GLASSES, 'glasses', currentGlasses)}
        `;

        // Tab active state
        document.getElementById('tabSkins').classList.toggle('active', false);
        document.getElementById('tabTrails').classList.toggle('active', false);
        const tabGacha = document.getElementById('tabGacha');
        if (tabGacha) tabGacha.classList.toggle('active', false);
        const tabAcc = document.getElementById('tabAcc');
        if (tabAcc) tabAcc.classList.toggle('active', true);
        updateCoinDisplay();
        return;
    }

    container.innerHTML = items.map((item, idx) => {
        const canAfford = userCoins >= item.price;

        // LOGIKA KHUSUS TAB GACHA
        if (tab === 'gacha') {
            const btnClass = 'shop-btn buy' + (!canAfford ? ' disabled' : '');
            const btnText  = `🪙 ${item.price}`;
            const cardClass = 'shop-item' + (!canAfford ? ' cant-afford' : '');
        
            // Logika untuk memilih antara Gambar atau Emoji
            const displayMedia = item.image 
                ? `<img src="${item.image}" class="shop-item-img" alt="${item.name}">`
                : `<div class="shop-item-emoji">${item.emoji}</div>`;
        
            return `
                <div class="${cardClass}" style="animation-delay:${idx * 0.04}s">
                    <div class="shop-item-media-container">${displayMedia}</div>
                    <div class="shop-item-name">${item.name}</div>
                    <button class="${btnClass}" onclick="handleGachaClick('${item.id}')">${btnText}</button>
                </div>
            `;
        }
        // LOGIKA UNTUK SKINS & TRAILS
        else {
            const owned    = ownedItems.includes(item.id);
            const equipped = tab === 'skins' ? currentSkin === item.id : currentTrail === item.id;

            let btnClass, btnText;
            if (equipped) {
                btnClass = 'shop-btn equipped';
                btnText  = '✓ EQUIPPED';
            } else if (owned) {
                btnClass = 'shop-btn equip';
                btnText  = 'EQUIP';
            } else {
                btnClass = 'shop-btn buy' + (!canAfford ? ' disabled' : '');
                btnText  = item.price === 0 ? 'FREE' : `🪙 ${item.price}`;
            }

            const cardClass = [
                'shop-item',
                equipped ? 'shop-item-equipped' : '',
                !owned && !canAfford && item.price > 0 ? 'cant-afford' : ''
            ].join(' ').trim();

            return `
                <div class="${cardClass}" style="animation-delay:${idx * 0.04}s">
                    <div class="shop-item-emoji">${item.emoji}</div>
                    <div class="shop-item-name">${item.name}</div>
                    <button class="${btnClass}" onclick="handleShopClick('${item.id}','${tab === 'skins' ? 'skin' : 'trail'}')">${btnText}</button>
                </div>
            `;
        }
    }).join('');

    // Update status tab aktif
    document.getElementById('tabSkins').classList.toggle('active', tab === 'skins');
    document.getElementById('tabTrails').classList.toggle('active', tab === 'trails');
    const tabGacha = document.getElementById('tabGacha');
    if (tabGacha) tabGacha.classList.toggle('active', tab === 'gacha');
    const tabAcc = document.getElementById('tabAcc');
    if (tabAcc) tabAcc.classList.toggle('active', false);

    updateCoinDisplay();
}

async function handleShopClick(itemId, type) {
    const allItems = [...SKINS, ...TRAILS, ...HATS, ...GLASSES];
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    if (ownedItems.includes(itemId)) {
        // Sudah dimiliki — langsung equip
        equipItem(itemId, type);
        return;
    }

    if (userCoins < item.price) {
        showShopMessage('Koin tidak cukup! 😢', 'error');
        return;
    }
    
    // Beli item
    await deductCoinsOnServer(item.price);
    ownedItems.push(itemId);
    saveInventory();
    equipItem(itemId, type);
    showShopMessage(`${item.emoji} ${item.name} berhasil dibeli!`, 'success');
}

async function handleGachaClick(itemId) {
    const item = GACHA_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    if (userCoins < item.price) {
        showShopMessage('Koin tidak cukup! 😢', 'error');
        return;
    }

    const pool = GACHA_POOLS[itemId];
    if (!pool || pool.length === 0) {
        showShopMessage(`🎁 ${item.name} — reward belum tersedia!`, 'error');
        return;
    }

    // Kurangi koin dulu
    await deductCoinsOnServer(item.price);

    // Play gacha SFX
    sfxGacha.currentTime = 0;
    sfxGacha.play();

    // Roll reward
    const reward = rollGacha(itemId);
    if (!reward) return;

    // Terapkan reward
    let alreadyOwned = false;
    if (reward.type === 'coins') {
        await addCoinsToServer(reward.amount);
    } else if (reward.type === 'trail') {
        if (ownedItems.includes(reward.id)) {
            alreadyOwned = true;
            await addCoinsToServer(15);
        } else {
            ownedItems.push(reward.id);
            saveInventory();
        }
    } else if (reward.type === 'skin') {
        if (ownedItems.includes(reward.id)) {
            alreadyOwned = true;
            await addCoinsToServer(15);
        } else {
            ownedItems.push(reward.id);
            saveInventory();
        }
    } else if (reward.type === 'hat' || reward.type === 'glasses') {
        if (ownedItems.includes(reward.id)) {
            alreadyOwned = true;
            await addCoinsToServer(15);
        } else {
            ownedItems.push(reward.id);
            saveInventory();
        }
    }

    // Tampilkan hasil gacha
    showGachaResult(reward, alreadyOwned);
    renderShopItems(shopCurrentTab);
}

// ── Gacha result modal ────────────────────
function showGachaResult(reward, alreadyOwned = false) {
    const overlay = document.getElementById('gachaResultOverlay');
    if (!overlay) return;

    const emojiEl  = document.getElementById('gachaResultEmoji');
    const labelEl  = document.getElementById('gachaResultLabel');
    const subEl    = document.getElementById('gachaResultSub');

    // Set rarity class for glow colour
    overlay.dataset.rarity = reward.rarity || 'common';

    // ── Phase 1: Show spinning mystery box overlay ──
    overlay.classList.remove('hidden');
    overlay.classList.add('gacha-phase-suspense');

    const box = overlay.querySelector('.gacha-result-box');
    box.classList.remove('gacha-pop', 'gacha-shake-rare');

    // Temporarily show mystery box
    emojiEl.textContent  = '🎁';
    labelEl.textContent  = '???';
    subEl.style.display  = 'none';

    // Kick off the spinning suspense animation
    emojiEl.classList.remove('gacha-spin-reveal');
    void emojiEl.offsetWidth;
    emojiEl.classList.add('gacha-spin-reveal');

    // Flash the rarity beam right away
    const beam = document.createElement('div');
    beam.className = `gacha-beam gacha-beam--${reward.rarity || 'common'}`;
    overlay.appendChild(beam);
    setTimeout(() => beam.remove(), 1200);

    // ── Phase 2: Reveal reward after suspense ──
    setTimeout(() => {
        overlay.classList.remove('gacha-phase-suspense');

        emojiEl.classList.remove('gacha-spin-reveal');
        void emojiEl.offsetWidth;

        emojiEl.textContent = reward.emoji;
        labelEl.textContent = reward.label;

        if (alreadyOwned) {
            subEl.textContent = 'Sudah punya! Dapat kompensasi +15 🪙';
            subEl.style.display = 'block';
        } else if (reward.type === 'coins') {
            subEl.textContent = 'Koin masuk ke dompetmu!';
            subEl.style.display = 'block';
        } else if (reward.type === 'skin') {
            subEl.textContent = 'Skin baru terbuka!';
            subEl.style.display = 'block';
        } else if (reward.type === 'hat') {
            subEl.textContent = 'Topi baru terbuka!';
            subEl.style.display = 'block';
        } else if (reward.type === 'glasses') {
            subEl.textContent = 'Kacamata baru terbuka!';
            subEl.style.display = 'block';
        } else {
            subEl.textContent = 'Item baru terbuka!';
            subEl.style.display = 'block';
        }

        // Pop-in the card
        void box.offsetWidth;
        box.classList.add('gacha-pop');

        // Extra shake for rare
        if (reward.rarity === 'rare') {
            setTimeout(() => box.classList.add('gacha-shake-rare'), 200);
            // Screen flash
            const flash = document.createElement('div');
            flash.className = 'gacha-flash';
            overlay.appendChild(flash);
            setTimeout(() => flash.remove(), 700);
        }

        // Burst particles
        _spawnGachaParticles(overlay, reward.rarity || 'common');

    }, 900); // suspense window
}

function closeGachaResult() {
    const overlay = document.getElementById('gachaResultOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// Helper: CSS particle burst inside the gacha overlay
function _spawnGachaParticles(overlay, rarity) {
    const COLORS = {
        common:   ['#d0d0e8', '#a0a0c0', '#ffffff'],
        uncommon: ['#00f0ff', '#40ffff', '#00b0c0'],
        rare:     ['#ffd700', '#ff6b6b', '#c77dff', '#6bcb77', '#4d96ff']
    };
    const cols = COLORS[rarity] || COLORS.common;
    const count = rarity === 'rare' ? 28 : (rarity === 'uncommon' ? 18 : 10);

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'gacha-particle';
        const angle  = (Math.random() * 360);
        const dist   = 60 + Math.random() * 100;
        const size   = 4 + Math.random() * 7;
        const col    = cols[Math.floor(Math.random() * cols.length)];
        const dur    = 0.6 + Math.random() * 0.7;
        const delay  = Math.random() * 0.25;
        p.style.cssText = `
            --angle: ${angle}deg;
            --dist: ${dist}px;
            width: ${size}px;
            height: ${size}px;
            background: ${col};
            box-shadow: 0 0 ${size * 2}px ${col};
            animation-duration: ${dur}s;
            animation-delay: ${delay}s;
        `;
        overlay.querySelector('.gacha-result-box').appendChild(p);
        setTimeout(() => p.remove(), (dur + delay + 0.1) * 1000);
    }
}

function equipItem(itemId, type) {
    if (type === 'skin') {
        currentSkin = itemId;
    } else if (type === 'trail') {
        currentTrail = itemId;
    } else if (type === 'hat') {
        currentHat = itemId;
    } else if (type === 'glasses') {
        currentGlasses = itemId;
    }
    saveInventory();
    renderShopItems(shopCurrentTab);
    // Refresh idle bird preview jika game tidak sedang berjalan
    if (!gameRunning) drawIdleScreen();
}

let shopMsgTimer = null;
function showShopMessage(msg, type) {
    const el = document.getElementById('shopMsg');
    if (!el) return;
    el.textContent = msg;
    el.className = `shop-msg ${type}`;
    el.classList.remove('hidden');
    clearTimeout(shopMsgTimer);
    shopMsgTimer = setTimeout(() => el.classList.add('hidden'), 2500);
}

// ══════════════════════════════════════════
// SESSION CHECK — auto login jika ada di localStorage
// ══════════════════════════════════════════

if (currentUser) initGameSession();