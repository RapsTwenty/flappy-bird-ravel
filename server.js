const path = require('path'); // Tambahkan baris ini!
const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Koneksi ke MySQL menggunakan Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql'
    }
);

// Model User — dengan kolom coins
const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    coins:    { type: DataTypes.INTEGER, defaultValue: 0 }
});

// Tambahkan ini agar folder 'public' bisa diakses browser
app.use(express.static(path.join(__dirname, 'public')));

// Tambahkan ini agar saat orang buka website kamu, langsung muncul game-nya
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        await User.create({ username, password, coins: 0 });
        res.status(201).json({ message: "User berhasil dibuat!" });
    } catch (error) {
        res.status(400).json({ message: "Username sudah digunakan" });
    }
});

// Endpoint Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username, password } });
    if (user) {
        res.json({ message: "Login Berhasil", userId: user.id, username: user.username, coins: user.coins || 0 });
    } else {
        res.status(401).json({ message: "Username atau Password salah" });
    }
});

// ── COIN ENDPOINTS ──────────────────────────────────────────

// GET: Ambil total koin user
app.get('/api/user/:username/coins', async (req, res) => {
    try {
        const user = await User.findOne({ where: { username: req.params.username } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ coins: user.coins || 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Tambah (atau kurangi) koin user
app.post('/api/user/coins/add', async (req, res) => {
    try {
        const { username, amount } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

        const newCoins = Math.max(0, (user.coins || 0) + amount); // tidak boleh negatif
        user.coins = newCoins;
        await user.save();
        res.json({ coins: user.coins });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── LEADERBOARD ─────────────────────────────────────────────

const Leaderboard = sequelize.define('Leaderboard', {
    username: { type: DataTypes.STRING, allowNull: false },
    score:    { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'leaderboards',
    timestamps: true
});

// GET: 10 skor tertinggi — dengan data inventory (skin, hat, glasses)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const allScores = await Leaderboard.findAll({ order: [['score', 'DESC']] });

        const best = {};
        allScores.forEach(s => {
            if (!best[s.username] || s.score > best[s.username]) {
                best[s.username] = s.score;
            }
        });

        const top10 = Object.entries(best)
            .map(([username, score]) => ({ username, score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const usernames = top10.map(u => u.username);
        const inventories = await Inventory.findAll({
            where: { username: { [Op.in]: usernames } }
        });

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
        res.status(500).json({ message: error.message });
    }
});

// GET: Statistik lengkap satu user (untuk profile card)
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
            bestScore,
            gamesPlayed,
            totalScore,
            coins:       user?.coins        ?? 0,
            skin:        inv?.currentSkin    || 'default',
            trail:       inv?.currentTrail   || 'none',
            hat:         inv?.currentHat     || 'hat_none',
            glasses:     inv?.currentGlasses || 'glasses_none',
            ownedItems:  JSON.parse(inv?.ownedItems || '["default","none","hat_none","glasses_none"]'),
        });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST: Simpan skor baru
app.post('/api/score', async (req, res) => {
    try {
        const { username, score } = req.body;
        const newScore = await Leaderboard.create({ username, score });
        res.status(201).json(newScore);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── INVENTORY ───────────────────────────────────────

const Inventory = sequelize.define('Inventory', {
    username:     { type: DataTypes.STRING, allowNull: false, unique: true },
    ownedItems:   { type: DataTypes.TEXT,   defaultValue: '["default","none","hat_none","glasses_none"]' },
    currentSkin:  { type: DataTypes.STRING, defaultValue: 'default'       },
    currentTrail: { type: DataTypes.STRING, defaultValue: 'none'          },
    currentHat:   { type: DataTypes.STRING, defaultValue: 'hat_none'      },
    currentGlasses:{ type: DataTypes.STRING,defaultValue: 'glasses_none'  },
    currentTheme: { type: DataTypes.STRING, defaultValue: 'default'       }
}, { tableName: 'inventories', timestamps: true });

// GET: Load inventory
app.get('/api/user/:username/inventory', async (req, res) => {
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
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST: Save inventory
app.post('/api/user/:username/inventory', async (req, res) => {
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
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── DAILY LOGIN ──────────────────────────────────────────────
//
// Model menyimpan: streak (jumlah hari berturut-turut) & lastClaim (YYYY-MM-DD)

const DailyLogin = sequelize.define('DailyLogin', {
    username:  { type: DataTypes.STRING, allowNull: false, unique: true },
    streak:    { type: DataTypes.INTEGER, defaultValue: 0 },
    lastClaim: { type: DataTypes.DATEONLY, allowNull: true }  // YYYY-MM-DD
}, { tableName: 'daily_logins', timestamps: true });

// Helper: string tanggal hari ini (server-side, format YYYY-MM-DD)
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

// Reward table (sama dengan client)
const DAILY_REWARDS_TABLE = [10, 20, 50, 30, 40, 60, 100];

// GET: Cek status daily login user
// Response: { streak, lastClaim, claimedToday, nextRewardCoins, nextDayIndex }
app.get('/api/user/:username/daily', async (req, res) => {
    try {
        const { username } = req.params;
        let dl = await DailyLogin.findOne({ where: { username } });
        if (!dl) dl = await DailyLogin.create({ username, streak: 0, lastClaim: null });

        const today         = todayStr();
        const claimedToday  = dl.lastClaim
            ? dl.lastClaim.toISOString?.().slice(0, 10) === today || dl.lastClaim === today
            : false;
        const streak        = dl.streak || 0;
        const nextDayIndex  = streak % 7;                        // 0-6
        const nextReward    = DAILY_REWARDS_TABLE[nextDayIndex];

        res.json({ streak, lastClaim: dl.lastClaim, claimedToday, nextRewardCoins: nextReward, nextDayIndex });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST: Klaim daily reward
// Body: { username }
// Response: { success, coins, streak, rewardCoins, message }
app.post('/api/user/:username/daily/claim', async (req, res) => {
    try {
        const { username } = req.params;

        // Cari / buat record daily login
        let [dl] = await DailyLogin.findOrCreate({
            where: { username },
            defaults: { streak: 0, lastClaim: null }
        });

        const today     = todayStr();
        const yesterday = yesterdayStr();

        // Normalize lastClaim ke string
        const lastClaimStr = dl.lastClaim
            ? (typeof dl.lastClaim === 'string' ? dl.lastClaim : dl.lastClaim.toISOString().slice(0, 10))
            : null;

        // Sudah klaim hari ini?
        if (lastClaimStr === today) {
            return res.status(400).json({ message: 'Sudah klaim hari ini', claimedToday: true });
        }

        // Hitung streak baru
        let newStreak;
        if (!lastClaimStr) {
            newStreak = 1;                          // pertama kali
        } else if (lastClaimStr === yesterday) {
            newStreak = (dl.streak || 0) + 1;      // berturut-turut
        } else {
            newStreak = 1;                          // streak terputus
        }

        const dayIndex   = (newStreak - 1) % 7;   // indeks hari yang diklaim (0-6)
        const rewardCoins = DAILY_REWARDS_TABLE[dayIndex];

        // Update DailyLogin
        dl.streak    = newStreak;
        dl.lastClaim = today;
        await dl.save();

        // Tambah koin ke User
        const user = await User.findOne({ where: { username } });
        if (user) {
            user.coins = (user.coins || 0) + rewardCoins;
            await user.save();
        }

        res.json({
            success:      true,
            coins:        user ? user.coins : rewardCoins,
            streak:       newStreak,
            rewardCoins,
            dayIndex,
            message:      `Berhasil klaim ${rewardCoins} koin! (Hari ${dayIndex + 1}, Streak ${newStreak})`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Sinkronisasi DB — alter:true agar tabel baru (daily_logins) ditambahkan otomatis
sequelize.sync({ alter: true })
    .then(() => console.log('Database & Table Berhasil Sinkron!'))
    .catch(err => console.log('Error Sinkronisasi: ' + err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});