/* ══════════════════════════════════════════════════════════════
   DAILY LOGIN REWARD SYSTEM
   Letakkan file ini di folder public/ dan load SETELAH game.js
══════════════════════════════════════════════════════════════ */

// ── Reward table ──────────────────────────────────────────────
const DAILY_REWARDS = [
    { day: 1, coins: 10,  emoji: '🪙',  special: false },
    { day: 2, coins: 20,  emoji: '🪙',  special: false },
    { day: 3, coins: 50,  emoji: '💰',  special: true  }, // Hari Bonus
    { day: 4, coins: 30,  emoji: '🪙',  special: false },
    { day: 5, coins: 40,  emoji: '🪙',  special: false },
    { day: 6, coins: 60,  emoji: '🪙',  special: false },
    { day: 7, coins: 100, emoji: '👑',  special: true  }, // Jackpot!
];

// ── Helpers ───────────────────────────────────────────────────
function _dlTodayStr() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function _dlYesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function _dlKey() {
    // Use currentUser from game.js (global), fallback to localStorage
    const u = (typeof currentUser !== 'undefined' ? currentUser : null)
               || localStorage.getItem('username');
    return u ? `daily_${u}` : null;
}

function _dlGetData() {
    const key = _dlKey();
    if (!key) return { streak: 0, lastClaim: null };
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : { streak: 0, lastClaim: null };
    } catch { return { streak: 0, lastClaim: null }; }
}

function _dlSaveData(data) {
    const key = _dlKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(data));
}

// ── Check & auto-show ─────────────────────────────────────────
function checkAndShowDailyLogin() {
    const data = _dlGetData();
    const today = _dlTodayStr();
    _dlUpdateBtn();
    if (data.lastClaim !== today) {
        // Belum klaim hari ini → tampilkan modal otomatis
        setTimeout(openDailyLoginModal, 700);
    }
}

// ── Open / Close modal ────────────────────────────────────────
function openDailyLoginModal() {
    const el = document.getElementById('dailyLoginModal');
    if (!el) return;
    _dlRenderCalendar();
    el.classList.remove('hidden');
}

function closeDailyLoginModal() {
    const el = document.getElementById('dailyLoginModal');
    if (el) el.classList.add('hidden');
}

// ── Render calendar ───────────────────────────────────────────
function _dlRenderCalendar() {
    const grid = document.getElementById('dlCalendarGrid');
    if (!grid) return;

    const data    = _dlGetData();
    const today   = _dlTodayStr();
    const claimed = data.lastClaim === today;     // klaim hari ini sudah dilakukan
    const streak  = data.streak || 0;             // total login berturut-turut
    const dayIdx  = streak % 7;                   // indeks hari berikutnya (0-6)

    // Indeks hari yang sudah diklaim hari ini (streak-1 % 7), atau -1 jika belum
    const claimedTodayIdx = claimed ? (streak - 1) % 7 : -1;

    let html = '';
    DAILY_REWARDS.forEach((r, i) => {
        const isPast        = claimed ? i < claimedTodayIdx : i < dayIdx;
        const isClaimedToday= i === claimedTodayIdx;
        const isCurrent     = !claimed && i === dayIdx;
        const isFuture      = !isCurrent && !isPast && !isClaimedToday;

        let cls = 'dl-day';
        if (r.special)       cls += ' dl-day--special';
        if (isPast)          cls += ' dl-day--past';
        if (isClaimedToday)  cls += ' dl-day--claimed';
        if (isCurrent)       cls += ' dl-day--current';
        if (isFuture)        cls += ' dl-day--future';

        const showEmoji = (isPast || isClaimedToday) ? '✅' : r.emoji;

        html += `
            <div class="${cls}">
                <div class="dl-day-num">DAY ${r.day}</div>
                <div class="dl-day-emoji">${showEmoji}</div>
                <div class="dl-day-coins">+${r.coins}🪙</div>
                ${r.special ? '<div class="dl-special-badge">BONUS!</div>' : ''}
            </div>
        `;
    });
    grid.innerHTML = html;

    // ── Claim button & status msg ──
    const btn    = document.getElementById('dlClaimBtn');
    const status = document.getElementById('dlStatusMsg');
    const streak_display = streak > 0
        ? `🔥 Streak: ${streak} hari berturut-turut`
        : 'Mulai login harianmu hari ini!';

    if (claimed) {
        btn.disabled = true;
        btn.innerHTML = '✅ SUDAH DIKLAIM HARI INI';
        if (status) status.textContent = 'Kembali besok untuk reward berikutnya! ⏰';
    } else {
        btn.disabled = false;
        const nextReward = DAILY_REWARDS[dayIdx];
        btn.innerHTML = `<span>🎁 KLAIM +${nextReward.coins} KOIN — HARI ${dayIdx + 1}</span><div class="btn-glow"></div>`;
        if (status) status.innerHTML = `<span class="dl-streak-chip">🔥 Streak: ${streak} hari</span>`;
    }
}

// ── Claim reward ──────────────────────────────────────────────
async function claimDailyReward() {
    const data  = _dlGetData();
    const today = _dlTodayStr();
    if (data.lastClaim === today) return; // sudah diklaim

    const dayIdx    = (data.streak || 0) % 7;
    const reward    = DAILY_REWARDS[dayIdx];
    const yesterday = _dlYesterdayStr();

    // Hitung streak baru
    let newStreak;
    if (!data.lastClaim) {
        newStreak = 1;                              // Login pertama kali
    } else if (data.lastClaim === yesterday) {
        newStreak = (data.streak || 0) + 1;        // Hari berturut-turut
    } else {
        newStreak = 1;                              // Streak terputus → reset
    }

    _dlSaveData({ streak: newStreak, lastClaim: today });

    // Tambah koin ke server (fungsi dari game.js)
    if (typeof addCoinsToServer === 'function') {
        await addCoinsToServer(reward.coins);
    }

    // SFX
    if (typeof sfxScore !== 'undefined' && sfxScore) {
        try { sfxScore.currentTime = 0; sfxScore.play(); } catch (_) {}
    }

    // Animasi koin beterbangan
    _dlCoinFly(reward.coins);

    // Re-render kalender & button
    _dlRenderCalendar();
    _dlUpdateBtn();
}

// ── Coin fly animation ────────────────────────────────────────
function _dlCoinFly(amount) {
    // Sumber: area tombol klaim
    const srcEl  = document.getElementById('dlClaimBtn');
    // Tujuan: coin HUD di pojok kanan atas
    const destEl = document.getElementById('coinDisplay');
    if (!srcEl || !destEl) return;

    const from = srcEl.getBoundingClientRect();
    const to   = destEl.getBoundingClientRect();

    // Hitung vektor dari sumber ke tujuan
    const tx = (to.left + to.width  / 2) - (from.left + from.width  / 2);
    const ty = (to.top  + to.height / 2) - (from.top  + from.height / 2);

    // Tampilkan max 14 koin visual, dengan sedikit variasi posisi
    const count = Math.min(amount, 14);
    for (let i = 0; i < count; i++) {
        (function(delay) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'dl-fly-coin';
                coin.textContent = '🪙';

                // Sedikit acak posisi awal agar lebih natural
                const jx = (Math.random() - 0.5) * 30;
                const jy = (Math.random() - 0.5) * 16;

                coin.style.cssText = `
                    left: ${from.left + from.width  / 2 + jx}px;
                    top:  ${from.top  + from.height / 2 + jy}px;
                    --tx: ${tx - jx}px;
                    --ty: ${ty - jy}px;
                `;
                document.body.appendChild(coin);
                setTimeout(() => coin.remove(), 1100);
            }, delay);
        })(i * 75 + Math.random() * 30);
    }

    // Flash pop pada coin HUD saat koin tiba
    const totalDuration = count * 75 + 950;
    setTimeout(() => {
        const hudEl = document.getElementById('coinDisplay');
        if (hudEl) {
            hudEl.classList.remove('pop');
            void hudEl.offsetWidth;
            hudEl.classList.add('pop');
            setTimeout(() => hudEl.classList.remove('pop'), 400);
        }
    }, totalDuration);
}

// ── Update open button (pulse jika belum klaim) ───────────────
function _dlUpdateBtn() {
    const btn = document.getElementById('dailyLoginOpenBtn');
    if (!btn) return;
    const data    = _dlGetData();
    const claimed = data.lastClaim === _dlTodayStr();
    btn.classList.toggle('dl-unclaimed', !claimed);
    btn.title = claimed ? '📅 Daily Reward (Sudah Diklaim)' : '🎁 Ambil Daily Reward!';
}

// ── Visibility: sembunyikan tombol saat game sedang berjalan ──
(function _dlWatchGameState() {
    function _tick() {
        const btn = document.getElementById('dailyLoginOpenBtn');
        if (!btn) return;
        const running = typeof gameRunning !== 'undefined' && gameRunning;
        btn.style.display = running ? 'none' : '';
    }
    setInterval(_tick, 300);
})();

// ── Auto-trigger: amati gamePage menjadi visible ──────────────
(function _dlObserveGamePage() {
    const gamePage = document.getElementById('gamePage');
    if (!gamePage) return;

    let triggered = false;
    const obs = new MutationObserver(() => {
        if (!gamePage.classList.contains('hidden') && !triggered) {
            triggered = true;
            obs.disconnect();
            checkAndShowDailyLogin();
        }
    });
    obs.observe(gamePage, { attributes: true, attributeFilter: ['class'] });

    // Jika gamePage sudah visible saat script dimuat (auto-login via localStorage)
    if (!gamePage.classList.contains('hidden')) {
        triggered = true;
        obs.disconnect();
        checkAndShowDailyLogin();
    }
})();
