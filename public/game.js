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

// ══════════════════════════════════════════
// ★ GACHA BOX DATA
// ══════════════════════════════════════════

const GACHA_BOXES = [
    {
        id: 'mystery_box_1',
        name: 'Mystery Box',
        price: 50,
        emoji: '🎁',
        description: 'Box misterius berisi hadiah acak!'
    }
];

// Reward pool untuk gacha (sementara kosong, bisa diisi nanti)
const GACHA_REWARDS = [
    // Contoh struktur reward (masih kosong):
    // { type: 'coin', amount: 10, rarity: 'common', emoji: '🪙' },
    // { type: 'skin', id: 'aqua', rarity: 'rare', emoji: '💧' },
];

// ══════════════════════════════════════════
// ★ SHOP STATE
// ══════════════════════════════════════════

let userCoins    = 0;
let ownedItems   = ['default', 'none'];  // IDs yang sudah dimiliki
let currentSkin  = 'default';
let currentTrail = 'none';
let shopCurrentTab = 'skins';

// ══════════════════════════════════════════
// STATE GLOBAL (game)
// ══════════════════════════════════════════

let currentUser  = localStorage.getItem("username") || null;
let gameRunning  = false;
let score        = 0;
let highScore    = parseInt(localStorage.getItem("highScore")) || 0;
let bird         = { x: 60, y: 200, width: 28, height: 24, gravity: 0.5, lift: -9, velocity: 0 };
let pipes        = [];
let frame        = 0;
let stars        = [];
let clouds       = [];
let particles    = [];
let trailParticles = [];

// ══════════════════════════════════════════
// ★ DELTA TIME — frame-rate independent physics
// ══════════════════════════════════════════
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

function loadInventory() {
    try {
        const raw = localStorage.getItem(`owned_${currentUser}`);
        ownedItems = raw ? JSON.parse(raw) : ['default', 'none'];
    } catch {
        ownedItems = ['default', 'none'];
    }
    // Pastikan item gratis selalu dimiliki
    if (!ownedItems.includes('default')) ownedItems.push('default');
    if (!ownedItems.includes('none')) ownedItems.push('none');

    // Load skin & trail yang sedang digunakan
    currentSkin = localStorage.getItem(`currentSkin_${currentUser}`) || 'default';
    currentTrail = localStorage.getItem(`currentTrail_${currentUser}`) || 'none';
}

function saveInventory() {
    localStorage.setItem(`owned_${currentUser}`, JSON.stringify(ownedItems));
    localStorage.setItem(`currentSkin_${currentUser}`, currentSkin);
    localStorage.setItem(`currentTrail_${currentUser}`, currentTrail);
}

// ══════════════════════════════════════════
// CONTROLS
// ══════════════════════════════════════════

// Keyboard
document.addEventListener("keydown", function (e) {
    if ((e.code === "Space" || e.code === "ArrowUp") && gameRunning) {
        e.preventDefault();
        bird.velocity = bird.lift;
    }
});

// Mouse / Touch
canvas.addEventListener("mousedown", function () {
    if (gameRunning) bird.velocity = bird.lift;
});
canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    if (gameRunning) bird.velocity = bird.lift;
});

// ══════════════════════════════════════════
// ★ DYNAMIC SKIN DATA — handle rainbow animation
// ══════════════════════════════════════════

function getSkinData() {
    const skin = SKINS.find(s => s.id === currentSkin);
    if (!skin) return SKINS[0]; // fallback

    if (skin.id === 'rainbow') {
        const t = Date.now() * 0.001; // time in seconds
        const hue1 = (t * 50) % 360;
        const hue2 = (hue1 + 60) % 360;
        const hue3 = (hue2 + 60) % 360;
        return {
            ...skin,
            body: [
                `hsl(${hue1}, 100%, 60%)`,
                `hsl(${hue2}, 100%, 50%)`,
                `hsl(${hue3}, 100%, 40%)`
            ]
        };
    }
    return skin;
}

// ══════════════════════════════════════════
// ★ TRAIL PARTICLES
// ══════════════════════════════════════════

function spawnTrailParticle() {
    const trailData = TRAILS.find(t => t.id === currentTrail);
    if (!trailData || trailData.id === 'none') return;

    let colors = trailData.colors;
    if (trailData.id === 'rainbow') {
        const t = Date.now() * 0.001;
        colors = [
            `hsl(${(t * 100) % 360}, 100%, 60%)`,
            `hsl(${(t * 100 + 120) % 360}, 100%, 50%)`,
            `hsl(${(t * 100 + 240) % 360}, 100%, 40%)`
        ];
    }
    const color = colors[Math.floor(Math.random() * colors.length)];

    trailParticles.push({
        x: bird.x + bird.width / 2,
        y: bird.y + bird.height / 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 2,
        alpha: 0.9,
        color
    });
}

function updateTrailParticles() {
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= 0.02 * dt;
        p.radius -= 0.05 * dt;
        if (p.alpha <= 0 || p.radius <= 0) trailParticles.splice(i, 1);
    }
}

function drawTrailParticles() {
    trailParticles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// ══════════════════════════════════════════
// DRAW BIRD — dengan skin dinamis
// ══════════════════════════════════════════

function drawBird() {
    const skinData = getSkinData();
    const bodyColors = skinData.body;

    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

    const angle = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5);
    ctx.rotate(angle);

    // Glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = skinData.glow;

    // Body (gradient)
    const grad = ctx.createLinearGradient(0, -bird.height / 2, 0, bird.height / 2);
    grad.addColorStop(0, bodyColors[0]);
    grad.addColorStop(0.5, bodyColors[1]);
    grad.addColorStop(1, bodyColors[2]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    const wingFlap = Math.sin(Date.now() * 0.02) * 4;
    ctx.fillStyle = skinData.wing;
    ctx.beginPath();
    ctx.ellipse(0, wingFlap, bird.width / 2.5, bird.height / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white + black)
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(bird.width / 4, -bird.height / 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 1, -bird.height / 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = skinData.beak;
    ctx.beginPath();
    ctx.moveTo(bird.width / 2, 0);
    ctx.lineTo(bird.width / 2 + 6, -2);
    ctx.lineTo(bird.width / 2 + 6, 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// ══════════════════════════════════════════
// DRAW PIPES (3D tube + shadows)
// ══════════════════════════════════════════

function drawPipe(x, y, w, h, isTop) {
    // Main body gradient
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#1a8a44");
    grad.addColorStop(0.5, "#2eb85c");
    grad.addColorStop(1, "#1a8a44");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Inner highlight (left side)
    ctx.fillStyle = "rgba(100, 255, 150, 0.3)";
    ctx.fillRect(x, y, w * 0.2, h);

    // Shadow (right side)
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(x + w * 0.8, y, w * 0.2, h);

    // Cap (rim)
    const capY = isTop ? y + h - 8 : y;
    const capH = 8;
    const capW = w + 6;
    const capX = x - 3;
    ctx.fillStyle = "#16733a";
    ctx.fillRect(capX, capY, capW, capH);

    // Cap top face (3D effect)
    const topGrad = ctx.createLinearGradient(capX, capY, capX + capW, capY);
    topGrad.addColorStop(0, "#1a8a44");
    topGrad.addColorStop(0.5, "#2eb85c");
    topGrad.addColorStop(1, "#1a8a44");
    ctx.fillStyle = topGrad;
    ctx.fillRect(capX, isTop ? capY + capH : capY - 2, capW, 2);
}

// ══════════════════════════════════════════
// ★ POWERUP SYSTEM — Shield & 2x Score
// ══════════════════════════════════════════

function spawnPowerup() {
    const rand = Math.random();
    let type;
    if (rand < 0.5) {
        type = 'shield';
    } else {
        type = '2x';
    }
    powerups.push({
        x: canvas.width,
        y: Math.random() * (canvas.height * 0.6) + 60,
        width: 32,
        height: 32,
        speed: 2.5,
        type: type,
        collected: false,
        glow: 0
    });
}

function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.x -= p.speed * dt;
        p.glow = (Math.sin(Date.now() * 0.008) + 1) * 0.5;

        if (!p.collected) {
            const birdCenterX = bird.x + bird.width / 2;
            const birdCenterY = bird.y + bird.height / 2;
            const pCenterX = p.x + p.width / 2;
            const pCenterY = p.y + p.height / 2;
            const dx = birdCenterX - pCenterX;
            const dy = birdCenterY - pCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < (bird.width / 2 + p.width / 2)) {
                p.collected = true;
                collectPowerup(p.type);
                powerups.splice(i, 1);
            }
        }

        if (p.x + p.width < 0) {
            powerups.splice(i, 1);
        }
    }
}

function collectPowerup(type) {
    if (type === 'shield') {
        shieldActive = true;
        shieldInvincible = true;
        shieldInvincibleTimer = SHIELD_INVINCIBLE_DURATION;
        sfxShield.currentTime = 0;
        sfxShield.play();
    } else if (type === '2x') {
        multiplierActive = true;
        multiplierTimer = MULTIPLIER_DURATION;
        sfxX2.currentTime = 0;
        sfxX2.play();
    }
}

function updatePowerupTimers() {
    if (shieldInvincible) {
        shieldInvincibleTimer -= dt;
        if (shieldInvincibleTimer <= 0) {
            shieldInvincible = false;
        }
    }
    if (multiplierActive) {
        multiplierTimer -= dt;
        if (multiplierTimer <= 0) {
            multiplierActive = false;
        }
    }
}

function drawPowerups() {
    powerups.forEach(p => {
        ctx.save();
        const centerX = p.x + p.width / 2;
        const centerY = p.y + p.height / 2;

        if (p.type === 'shield') {
            ctx.shadowBlur = 20 * p.glow;
            ctx.shadowColor = '#40e0ff';
            ctx.fillStyle = '#40e0ff';
            ctx.strokeStyle = '#00a0d0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - p.height / 2);
            ctx.lineTo(centerX + p.width / 2, centerY);
            ctx.lineTo(centerX, centerY + p.height / 2);
            ctx.lineTo(centerX - p.width / 2, centerY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (p.type === '2x') {
            ctx.shadowBlur = 20 * p.glow;
            ctx.shadowColor = '#ffcc00';
            ctx.fillStyle = '#ffcc00';
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, p.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('2X', centerX, centerY);
        }
        ctx.restore();
    });
}

function drawPowerupIndicators() {
    const indicatorY = 10;
    let offsetX = canvas.width - 120;

    if (shieldActive) {
        ctx.save();
        ctx.fillStyle = '#40e0ff';
        ctx.strokeStyle = '#00a0d0';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#40e0ff';
        ctx.beginPath();
        ctx.arc(offsetX, indicatorY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡', offsetX, indicatorY);
        ctx.restore();
        offsetX += 35;
    }

    if (multiplierActive) {
        ctx.save();
        const timeLeft = Math.ceil(multiplierTimer / TARGET_FPS);
        ctx.fillStyle = '#ffcc00';
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffcc00';
        ctx.beginPath();
        ctx.arc(offsetX, indicatorY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2X', offsetX, indicatorY - 1);
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.fillText(timeLeft, offsetX, indicatorY + 8);
        ctx.restore();
    }
}

// ══════════════════════════════════════════
// ★ COMBO SYSTEM
// ══════════════════════════════════════════

function addCombo() {
    combo++;
    if (combo === 5 || combo === 10 || combo === 20 || combo === 50) {
        comboTexts.push({
            text: `COMBO ${combo}x! 🔥`,
            x: canvas.width / 2,
            y: canvas.height / 3,
            alpha: 1,
            scale: 1.5,
            vy: -1.5
        });
    }
}

function updateComboTexts() {
    for (let i = comboTexts.length - 1; i >= 0; i--) {
        const ct = comboTexts[i];
        ct.y += ct.vy * dt;
        ct.alpha -= 0.015 * dt;
        ct.scale -= 0.01 * dt;
        if (ct.alpha <= 0) comboTexts.splice(i, 1);
    }
}

function drawComboTexts() {
    comboTexts.forEach(ct => {
        ctx.save();
        ctx.globalAlpha = ct.alpha;
        ctx.font = `bold ${20 * ct.scale}px 'Press Start 2P', monospace`;
        ctx.fillStyle = '#ff3366';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.strokeText(ct.text, ct.x, ct.y);
        ctx.fillText(ct.text, ct.x, ct.y);
        ctx.restore();
    });
}

// ══════════════════════════════════════════
// UPDATE & DRAW
// ══════════════════════════════════════════

function update() {
    if (!gameRunning) return;

    bird.velocity += bird.gravity * dt;
    bird.y += bird.velocity * dt;

    pipeTimer += dt;
    if (pipeTimer >= 90) {
        const gap = 120;
        const minY = 40;
        const maxY = canvas.height - gap - 100;
        const topH = Math.random() * (maxY - minY) + minY;
        pipes.push({ x: canvas.width, y: 0, width: 50, height: topH, passed: false });
        pipeTimer = 0;

        pipeSpawnCount++;
        if (pipeSpawnCount % 5 === 0) {
            spawnPowerup();
        }
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 2.5 * dt;

        if (!pipes[i].passed && pipes[i].x + pipes[i].width < bird.x) {
            pipes[i].passed = true;
            const points = multiplierActive ? 2 : 1;
            score += points;
            addCombo();
            updateLiveScore();
            sfxScore.currentTime = 0;
            sfxScore.play();
            spawnParticles(pipes[i].x + pipes[i].width, pipes[i].height + 60);
        }

        if (pipes[i].x + pipes[i].width < 0) {
            pipes.splice(i, 1);
        }
    }

    const birdCenterX = bird.x + bird.width / 2;
    const birdCenterY = bird.y + bird.height / 2;
    const birdRadius = bird.width / 2;

    for (let pipe of pipes) {
        const gap = 120;
        const bottomY = pipe.height + gap;
        const topRect = { x: pipe.x, y: 0, w: pipe.width, h: pipe.height };
        const bottomRect = { x: pipe.x, y: bottomY, w: pipe.width, h: canvas.height - bottomY };

        if (circleRectCollision(birdCenterX, birdCenterY, birdRadius, topRect) ||
            circleRectCollision(birdCenterX, birdCenterY, birdRadius, bottomRect)) {
            if (shieldActive && shieldInvincible) {
                continue;
            } else {
                gameOver();
                return;
            }
        }
    }

    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        if (!(shieldActive && shieldInvincible)) {
            gameOver();
            return;
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].y += particles[i].vy * dt;
        particles[i].alpha -= 0.02 * dt;
        if (particles[i].alpha <= 0) particles[i].splice(i, 1);
    }

    for (let c of clouds) {
        c.x -= c.speed * dt;
        if (c.x + c.w < 0) c.x = canvas.width + c.w;
    }

    updatePowerups();
    updatePowerupTimers();
    updateComboTexts();

    if (currentTrail !== 'none' && frame % 3 === 0) {
        spawnTrailParticle();
    }
    updateTrailParticles();
}

function circleRectCollision(cx, cy, r, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (r * r);
}

function spawnParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vy: (Math.random() - 0.5) * 3,
            alpha: 1,
            color: `hsl(${Math.random() * 60 + 30}, 100%, 60%)`
        });
    }
}

function draw() {
    ctx.fillStyle = "#0a0e27";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let s of stars) {
        s.twinkle += 0.05;
        const twinkleAlpha = s.alpha + Math.sin(s.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, twinkleAlpha)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let c of clouds) {
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.w * 0.3, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.3, c.y - 5, c.w * 0.25, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.6, c.y, c.w * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTrailParticles();

    pipes.forEach(pipe => {
        const gap = 120;
        drawPipe(pipe.x, 0, pipe.width, pipe.height, true);
        drawPipe(pipe.x, pipe.height + gap, pipe.width, canvas.height - (pipe.height + gap), false);
    });

    drawPowerups();
    drawBird();

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    drawComboTexts();
    drawPowerupIndicators();
}

function drawIdleScreen() {
    ctx.fillStyle = "#0a0e27";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let s of stars) {
        s.twinkle += 0.05;
        const twinkleAlpha = s.alpha + Math.sin(s.twinkle) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, twinkleAlpha)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
    }
    for (let c of clouds) {
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.w * 0.3, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.3, c.y - 5, c.w * 0.25, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.6, c.y, c.w * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }
    bird.y = 200 + Math.sin(Date.now() * 0.002) * 10;
    drawBird();
}

// ══════════════════════════════════════════
// GAME LOOP (deltaTime-aware)
// ══════════════════════════════════════════

function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    lastTime = timestamp;

    dt = Math.min(elapsed / (1000 / TARGET_FPS), 2);

    frame++;

    update();
    draw();
    if (gameRunning) requestAnimationFrame(loop);
}

// ══════════════════════════════════════════
// GAME OVER
// ══════════════════════════════════════════

function gameOver() {
    gameRunning = false;
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

    // Show coins earned
    const earnedEl = document.getElementById("coinsEarned");
    const earnedAmt = document.getElementById("coinsEarnedAmt");
    if (score > 0) {
        earnedAmt.textContent = score;
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
        addCoinsToServer(score); // ★ Tambah koin sebesar skor
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
    bird.y = 200; bird.velocity = 0;
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

async function loadLeaderboard() {
    try {
        const res = await fetch(`${URL_API}/api/leaderboard`);
        const data = await res.json();

        const best = {};
        data.forEach(s => {
            if (!best[s.username] || s.score > best[s.username]) {
                best[s.username] = s.score;
            }
        });
        const unique = Object.entries(best)
            .map(([username, score]) => ({ username, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const list = document.getElementById("scoreList");
        list.innerHTML = unique.map((s, i) =>
            `<li style="animation-delay:${i * 0.06}s">
                <span>${MEDALS[i] || `#${i+1}`} &nbsp;${s.username}</span>
                <b>${s.score}</b>
            </li>`
        ).join("") || `<li class="lb-loading">Belum ada data</li>`;
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
    const container = document.getElementById('shopItems');

    // ★ TAB GACHA
    if (tab === 'gacha') {
        container.innerHTML = GACHA_BOXES.map((box, idx) => {
            const canAfford = userCoins >= box.price;
            const btnClass = 'shop-btn buy' + (!canAfford ? ' disabled' : '');
            const btnText = `🪙 ${box.price}`;

            return `
                <div class="shop-item gacha-box-item" style="animation-delay:${idx * 0.04}s">
                    <div class="gacha-box-emoji">${box.emoji}</div>
                    <div class="shop-item-name">${box.name}</div>
                    <p class="gacha-box-desc">${box.description}</p>
                    <button class="${btnClass}" onclick="handleGachaClick('${box.id}')">${btnText}</button>
                </div>
            `;
        }).join('');

        // Update active tabs
        document.getElementById('tabSkins').classList.remove('active');
        document.getElementById('tabTrails').classList.remove('active');
        document.getElementById('tabGacha').classList.add('active');
        updateCoinDisplay();
        return;
    }

    // ★ TAB SKINS / TRAILS (existing logic)
    const items = tab === 'skins' ? SKINS : TRAILS;

    container.innerHTML = items.map((item, idx) => {
        const owned    = ownedItems.includes(item.id);
        const equipped = tab === 'skins' ? currentSkin === item.id : currentTrail === item.id;
        const canAfford = userCoins >= item.price;

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
    }).join('');

    document.getElementById('tabSkins').classList.toggle('active', tab === 'skins');
    document.getElementById('tabTrails').classList.toggle('active', tab === 'trails');
    document.getElementById('tabGacha').classList.remove('active');
    updateCoinDisplay();
}

async function handleShopClick(itemId, type) {
    const allItems = [...SKINS, ...TRAILS];
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

// ★ GACHA BOX HANDLER
async function handleGachaClick(boxId) {
    const box = GACHA_BOXES.find(b => b.id === boxId);
    if (!box) return;

    if (userCoins < box.price) {
        showShopMessage('Koin tidak cukup! 😢', 'error');
        return;
    }

    // Deduct koin
    await deductCoinsOnServer(box.price);

    // ★ GACHA LOGIC (sementara belum ada reward)
    // Nanti bisa ditambahkan random reward dari GACHA_REWARDS
    
    showShopMessage(`🎁 ${box.name} berhasil dibuka! (Reward coming soon)`, 'success');
    
    // TODO: Implementasi gacha reward system di sini
    // Contoh:
    // const reward = getRandomReward();
    // giveRewardToPlayer(reward);
    // showGachaRewardAnimation(reward);
}

function equipItem(itemId, type) {
    if (type === 'skin') {
        currentSkin = itemId;
    } else {
        currentTrail = itemId;
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

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════

function toggleAuth() {
    document.getElementById("loginForm").classList.toggle("hidden");
    document.getElementById("registerForm").classList.toggle("hidden");
}

async function register() {
    const username = document.getElementById("regUser").value.trim();
    const password = document.getElementById("regPass").value.trim();
    if (!username || !password) return alert("Isi semua field!");

    try {
        const res = await fetch(`${URL_API}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert("✅ " + data.message);
            toggleAuth();
        } else {
            alert("❌ " + data.message);
        }
    } catch (error) {
        alert("❌ Error koneksi server");
    }
}

async function login() {
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();
    if (!username || !password) return alert("Isi semua field!");

    try {
        const res = await fetch(`${URL_API}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = data.username;
            localStorage.setItem("username", currentUser);
            initGameSession();
        } else {
            alert("❌ " + data.message);
        }
    } catch (error) {
        alert("❌ Error koneksi server");
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem("username");
    document.getElementById("gamePage").classList.add("hidden");
    document.getElementById("authPage").classList.remove("hidden");
    gameRunning = false;
}

function initGameSession() {
    document.getElementById("authPage").classList.add("hidden");
    document.getElementById("gamePage").classList.remove("hidden");
    document.getElementById("playerName").innerText = currentUser.toUpperCase();
    loadCoinsFromServer();
    loadInventory();
    loadLeaderboard();
    updateLiveScore();

    setInterval(drawIdleScreen, 50);
}

function updateLiveScore() {
    document.getElementById("liveScore").innerText = score;
}

function startGame() {
    document.getElementById("startScreen").classList.add("hidden");
    gameRunning = true;
    lastTime = 0;
    pipeTimer = 90;
    requestAnimationFrame(loop);
}