const path = require('path'); // Tambahkan baris ini!
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
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
    coins:    { type: DataTypes.INTEGER, defaultValue: 0 }  // ← BARU: sistem koin
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

// GET: 10 skor tertinggi
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topScores = await Leaderboard.findAll({
            order: [['score', 'DESC']],
            limit: 10
        });
        res.json(topScores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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

// Sinkronisasi DB — alter:true agar kolom 'coins' ditambahkan ke tabel User yang sudah ada
sequelize.sync({ alter: true })
    .then(() => console.log('Database & Table Berhasil Sinkron!'))
    .catch(err => console.log('Error Sinkronisasi: ' + err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});
