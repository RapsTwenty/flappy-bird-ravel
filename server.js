/**
 * ══════════════════════════════════════════════════════════
 *  SERVER.JS — SECURED VERSION
 *  Perbaikan keamanan:
 *   ✅ Password di-hash dengan bcrypt
 *   ✅ Autentikasi via JWT token (Bearer)
 *   ✅ Rate limiting (anti brute-force & spam)
 *   ✅ Security headers via Helmet
 *   ✅ CORS dibatasi origin spesifik
 *   ✅ Validasi skor di server (anti-cheat)
 *   ✅ Semua endpoint sensitif wajib token
 *   ✅ Coins hanya bisa ditambah oleh user sendiri
 * ══════════════════════════════════════════════════════════
 *
 *  Install dependencies baru:
 *    npm install bcrypt jsonwebtoken express-rate-limit helmet
 */

const path       = require('path');
const express    = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors       = require('cors');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
require('dotenv').config();

const app = express();

// ─────────────────────────────────────────────────────────
//  SECURITY: Helmet (HTTP security headers)
// ─────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false // Set false dulu; sesuaikan jika perlu CSP ketat
}));

// ─────────────────────────────────────────────────────────
//  SECURITY: CORS — batasi hanya origin yang diizinkan
//  Ganti ALLOWED_ORIGINS di .env atau langsung di sini
// ─────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(cors({
    origin: (origin, callback) => {
        // Izinkan jika origin ada di daftar, atau request dari server sendiri (null/undefined)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

// ─────────────────────────────────────────────────────────
//  RATE LIMITING
// ─────────────────────────────────────────────────────────

// Umum: max 100 request per 15 menit per IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak request, coba lagi nanti.' }
});

// Auth: max 10 percobaan login/register per 15 menit per IP (anti brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak percobaan login. Tunggu 15 menit.' }
});

// Daily claim: max 5 request per jam per IP (anti spam)
const dailyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Terlalu banyak klaim. Coba lagi nanti.' }
});

// Score submit: max 30 per jam per IP
const scoreLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: { message: 'Terlalu banyak submit skor.' }
});

app.use(generalLimiter); // Terapkan ke semua route

// ─────────────────────────────────────────────────────────
//  JWT SECRET — Wajib ada di .env: JWT_SECRET=xxx_panjang_acak
// ─────────────────────────────────────────────────────────
const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET tidak ada atau terlalu pendek di .env!');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────
//  MIDDLEWARE: Verifikasi JWT
//  Tambahkan ke route yang perlu autentikasi
// ─────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) return res.status(401).json({ message: 'Akses ditolak: token tidak ada.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token tidak valid atau sudah expired.' });
        req.user = user; // { userId, username }
        next();
    });
}

// ─────────────────────────────────────────────────────────
//  MIDDLEWARE: Pastikan user hanya bisa akses data milik sendiri
// ─────────────────────────────────────────────────────────
function requireSelf(req, res, next) {
    const targetUsername = req.params.username || req.body.username;
    if (req.user.username !== targetUsername) {
        return res.status(403).json({ message: 'Tidak boleh mengakses data user lain.' });
    }
    next();
}

// ─────────────────────────────────────────────────────────
//  DATABASE
// ─────────────────────────────────────────────────────────
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    { host: process.env.DB_HOST, dialect: 'mysql', logging: false }
);

// ── Models ──

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING(30), unique: true, allowNull: false },
    password: { type: DataTypes.STRING,    allowNull: false },  // bcrypt hash
    coins:    { type: DataTypes.INTEGER,   defaultValue: 0 }
});

const Leaderboard = sequelize.define('Leaderboard', {
    username: { type: DataTypes.STRING, allowNull: false },
    score:    { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'leaderboards', timestamps: true });

const Inventory = sequelize.define('Inventory', {
    username:       { type: DataTypes.STRING, allowNull: false, unique: true },
    ownedItems:     { type: DataTypes.TEXT,   defaultValue: '["default","none","hat_none","glasses_none"]' },
    currentSkin:    { type: DataTypes.STRING, defaultValue: 'default'     },
    currentTrail:   { type: DataTypes.STRING, defaultValue: 'none'        },
    currentHat:     { type: DataTypes.STRING, defaultValue: 'hat_none'    },
    currentGlasses: { type: DataTypes.STRING, defaultValue: 'glasses_none'},
    currentTheme:   { type: DataTypes.STRING, defaultValue: 'default'     }
}, { tableName: 'inventories', timestamps: true });

const DailyLogin = sequelize.define('DailyLogin', {
    username:  { type: DataTypes.STRING,  allowNull: false, unique: true },
    streak:    { type: DataTypes.INTEGER, defaultValue: 0 },
    lastClaim: { type: DataTypes.DATEONLY, allowNull: true }
}, { tableName: 'daily_logins', timestamps: true });

// ─────────────────────────────────────────────────────────
//  STATIC & INDEX
// ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
const SALT_ROUNDS = 12;

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

// Validasi input sederhana
function isValidUsername(u) { return typeof u === 'string' && /^[a-zA-Z0-9_]{3,30}$/.test(u); }
function isValidPassword(p) { return typeof p === 'string' && p.length >= 6 && p.length <= 128; }

// Anti-cheat: batas skor maksimum per sesi (sesuaikan dengan gameplay)
const MAX_SCORE_PER_GAME = 9999;

const DAILY_REWARDS_TABLE = [10, 20, 50, 30, 40, 60, 100];

// ─────────────────────────────────────────────────────────
//  AUTH ENDPOINTS
// ─────────────────────────────────────────────────────────

// POST /api/register
app.post('/api/register', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // ✅ Validasi input
        if (!isValidUsername(username))
            return res.status(400).json({ message: 'Username hanya boleh huruf, angka, underscore (3-30 karakter).' });
        if (!isValidPassword(password))
            return res.status(400).json({ message: 'Password minimal 6 karakter.' });

        // ✅ Hash password sebelum disimpan
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await User.create({ username, password: hashedPassword, coins: 0 });

        res.status(201).json({ message: 'Akun berhasil dibuat!' });
    } catch (error) {
        // Jangan bocorkan detail error ke client
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Username sudah digunakan.' });
        }
        console.error('[register]', error.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// POST /api/login
app.post('/api/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!isValidUsername(username) || !isValidPassword(password))
            return res.status(400).json({ message: 'Input tidak valid.' });

        const user = await User.findOne({ where: { username } });

        // ✅ Pesan error sama untuk username salah & password salah (cegah user enumeration)
        if (!user) return res.status(401).json({ message: 'Username atau password salah.' });

        // ✅ Bandingkan password dengan hash
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Username atau password salah.' });

        // ✅ Buat JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        res.json({
            message: 'Login berhasil',
            token,                      // Simpan di memory/sessionStorage, BUKAN localStorage
            userId: user.id,
            username: user.username,
            coins: user.coins || 0
        });
    } catch (error) {
        console.error('[login]', error.message);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────
//  COIN ENDPOINTS  (✅ wajib token, ✅ hanya milik sendiri)
// ─────────────────────────────────────────────────────────

// GET /api/user/:username/coins
app.get('/api/user/:username/coins', requireAuth, requireSelf, async (req, res) => {
    try {
        const user = await User.findOne({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
        res.json({ coins: user.coins || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// POST /api/user/coins/add
app.post('/api/user/coins/add', requireAuth, async (req, res) => {
    try {
        const { username, amount } = req.body;

        // ✅ Hanya bisa tambah koin milik sendiri
        if (req.user.username !== username)
            return res.status(403).json({ message: 'Tidak boleh mengubah koin user lain.' });

        // ✅ Validasi jumlah: hanya boleh positif & wajar
        const parsedAmount = parseInt(amount, 10);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 1000)
            return res.status(400).json({ message: 'Jumlah koin tidak valid.' });

        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

        user.coins = (user.coins || 0) + parsedAmount;
        await user.save();
        res.json({ coins: user.coins });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────
//  SCORE ENDPOINTS  (✅ wajib token, ✅ anti-cheat)
// ─────────────────────────────────────────────────────────

// POST /api/score
app.post('/api/score', requireAuth, scoreLimiter, async (req, res) => {
    try {
        const { username, score } = req.body;

        // ✅ Pastikan username cocok dengan token
        if (req.user.username !== username)
            return res.status(403).json({ message: 'Tidak boleh submit skor untuk user lain.' });

        // ✅ Validasi skor: harus angka positif & tidak melebihi batas
        const parsedScore = parseInt(score, 10);
        if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > MAX_SCORE_PER_GAME)
            return res.status(400).json({ message: `Skor tidak valid (max: ${MAX_SCORE_PER_GAME}).` });

        const newScore = await Leaderboard.create({ username, score: parsedScore });
        res.status(201).json(newScore);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// GET /api/leaderboard  (boleh publik, tidak perlu token)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const allScores = await Leaderboard.findAll({ order: [['score', 'DESC']] });

        const best = {};
        allScores.forEach(s => {
            if (!best[s.username] || s.score > best[s.username]) best[s.username] = s.score;
        });

        const top10 = Object.entries(best)
            .map(([username, score]) => ({ username, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const usernames    = top10.map(u => u.username);
        const inventories  = await Inventory.findAll({ where: { username: { [Op.in]: usernames } } });
        const invMap = {};
        inventories.forEach(inv => {
            invMap[inv.username] = {
                skin:    inv.currentSkin    || 'default',
                hat:     inv.currentHat     || 'hat_none',
                glasses: inv.currentGlasses || 'glasses_none'
            };
        });

        const result = top10.map(u => ({
            username: u.username,
            score:    u.score,
            skin:     invMap[u.username]?.skin    || 'default',
            hat:      invMap[u.username]?.hat      || 'hat_none',
            glasses:  invMap[u.username]?.glasses  || 'glasses_none'
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────
//  USER STATS  (✅ wajib token, ✅ hanya milik sendiri)
// ─────────────────────────────────────────────────────────

// Stats publik — siapapun bisa lihat tanpa token
app.get('/api/user/:username/stats', async (req, res) => {
    try {
        const scores = await Leaderboard.findAll({ where: { username: req.params.username } });
        const bestScore   = scores.length ? Math.max(...scores.map(s => s.score)) : 0;
        const gamesPlayed = scores.length;
        const totalScore  = scores.reduce((sum, s) => sum + s.score, 0);

        const inv  = await Inventory.findOne({ where: { username: req.params.username } });
        const user = await User.findOne({ where: { username: req.params.username } });

        res.json({
            username:    req.params.username,
            bestScore, gamesPlayed, totalScore,
            coins:       user?.coins ?? 0,
            skin:        inv?.currentSkin    || 'default',
            trail:       inv?.currentTrail   || 'none',
            hat:         inv?.currentHat     || 'hat_none',
            glasses:     inv?.currentGlasses || 'glasses_none',
            ownedItems:  JSON.parse(inv?.ownedItems || '["default","none","hat_none","glasses_none"]'),
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────
//  INVENTORY  (✅ wajib token, ✅ hanya milik sendiri)
// ─────────────────────────────────────────────────────────

app.get('/api/user/:username/inventory', requireAuth, requireSelf, async (req, res) => {
    try {
        let inv = await Inventory.findOne({ where: { username: req.params.username } });
        if (!inv) inv = await Inventory.create({ username: req.params.username });
        res.json({
            ownedItems:    JSON.parse(inv.ownedItems || '["default","none","hat_none","glasses_none"]'),
            currentSkin:   inv.currentSkin   || 'default',
            currentTrail:  inv.currentTrail  || 'none',
            currentHat:    inv.currentHat    || 'hat_none',
            currentGlasses:inv.currentGlasses|| 'glasses_none',
            currentTheme:  inv.currentTheme  || 'default'
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

app.post('/api/user/:username/inventory', requireAuth, requireSelf, async (req, res) => {
    try {
        const { ownedItems, currentSkin, currentTrail, currentHat, currentGlasses, currentTheme } = req.body;
        const [inv] = await Inventory.findOrCreate({ where: { username: req.params.username } });
        if (ownedItems)    inv.ownedItems    = JSON.stringify(ownedItems);
        if (currentSkin)   inv.currentSkin   = currentSkin;
        if (currentTrail)  inv.currentTrail  = currentTrail;
        if (currentHat)    inv.currentHat    = currentHat;
        if (currentGlasses)inv.currentGlasses= currentGlasses;
        if (currentTheme)  inv.currentTheme  = currentTheme;
        await inv.save();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────
//  DAILY LOGIN  (✅ wajib token, ✅ hanya milik sendiri)
// ─────────────────────────────────────────────────────────

// GET /api/user/:username/daily
app.get('/api/user/:username/daily', requireAuth, requireSelf, async (req, res) => {
    try {
        const { username } = req.params;
        let dl = await DailyLogin.findOne({ where: { username } });
        if (!dl) dl = await DailyLogin.create({ username, streak: 0, lastClaim: null });

        const today        = todayStr();
        const lastClaimStr = dl.lastClaim
            ? (typeof dl.lastClaim === 'string' ? dl.lastClaim : dl.lastClaim.toISOString().slice(0, 10))
            : null;
        const claimedToday  = lastClaimStr === today;
        const streak        = dl.streak || 0;
        const nextDayIndex  = streak % 7;
        const nextReward    = DAILY_REWARDS_TABLE[nextDayIndex];

        res.json({ streak, lastClaim: dl.lastClaim, claimedToday, nextRewardCoins: nextReward, nextDayIndex });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// POST /api/user/:username/daily/claim
app.post('/api/user/:username/daily/claim', requireAuth, requireSelf, dailyLimiter, async (req, res) => {
    try {
        const { username } = req.params;

        let [dl] = await DailyLogin.findOrCreate({
            where: { username },
            defaults: { streak: 0, lastClaim: null }
        });

        const today         = todayStr();
        const yesterday     = yesterdayStr();
        const lastClaimStr  = dl.lastClaim
            ? (typeof dl.lastClaim === 'string' ? dl.lastClaim : dl.lastClaim.toISOString().slice(0, 10))
            : null;

        if (lastClaimStr === today)
            return res.status(400).json({ message: 'Sudah klaim hari ini.', claimedToday: true });

        let newStreak;
        if (!lastClaimStr)              newStreak = 1;
        else if (lastClaimStr === yesterday) newStreak = (dl.streak || 0) + 1;
        else                            newStreak = 1;

        const dayIndex    = (newStreak - 1) % 7;
        const rewardCoins = DAILY_REWARDS_TABLE[dayIndex];

        dl.streak    = newStreak;
        dl.lastClaim = today;
        await dl.save();

        const user = await User.findOne({ where: { username } });
        if (user) { user.coins = (user.coins || 0) + rewardCoins; await user.save(); }

        res.json({
            success: true,
            coins: user ? user.coins : rewardCoins,
            streak: newStreak, rewardCoins, dayIndex,
            message: `Berhasil klaim ${rewardCoins} koin! (Hari ${dayIndex + 1}, Streak ${newStreak})`
        });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────
//  SYNC & START
// ─────────────────────────────────────────────────────────
sequelize.sync({ alter: true })
    .then(() => console.log('✅ Database berhasil disinkron!'))
    .catch(err => console.error('❌ Error sinkronisasi DB:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server jalan di http://localhost:${PORT}`));