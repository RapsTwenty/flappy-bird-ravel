/* ══════════════════════════════════════════════════════════════
   DAILY LOGIN REWARD SYSTEM — SECURE VERSION
   ✅ Semua data dari server (bukan localStorage)
   ✅ Request pakai JWT token (dari game.js → window.authToken)
   ✅ localStorage hanya dipakai untuk cache UI sementara
══════════════════════════════════════════════════════════════ */

const DAILY_REWARDS = [
    { day: 1, coins: 10,  emoji: '<img src="assets/coin.png" class="dl-coin-icon" alt="Koin">',  special: false },
    { day: 2, coins: 20,  emoji: '<img src="assets/coin.png" class="dl-coin-icon" alt="Koin">',  special: false },
    { day: 3, coins: 50,  emoji: '💰', special: true  },
    { day: 4, coins: 30,  emoji: '<img src="assets/coin.png" class="dl-coin-icon" alt="Koin">',  special: false },
    { day: 5, coins: 40,  emoji: '<img src="assets/coin.png" class="dl-coin-icon" alt="Koin">',  special: false },
    { day: 6, coins: 60,  emoji: '<img src="assets/coin.png" class="dl-coin-icon" alt="Koin">',  special: false },
    { day: 7, coins: 100, emoji: '👑', special: true  },
];

// ── Ambil token & username dari game.js ───────────────────────
function _dlGetToken()    { return window.authToken    || null; }
function _dlGetUsername() { return (typeof currentUser !== 'undefined' ? currentUser : null) || null; }

// ── Helper fetch dengan Authorization header ──────────────────
async function _dlFetch(url, options = {}) {
    const token = _dlGetToken();
    if (!token) throw new Error('Tidak ada token. Silakan login ulang.');
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {})
        }
    });
}

// ── Ambil status daily dari server ───────────────────────────
async function _dlFetchStatus() {
    const username = _dlGetUsername();
    if (!username) return null;
    try {
        const res = await _dlFetch(`/api/user/${encodeURIComponent(username)}/daily`);
        if (!res.ok) return null;
        return await res.json(); // { streak, lastClaim, claimedToday, nextRewardCoins, nextDayIndex }
    } catch { return null; }
}

// ── Check & auto-show ─────────────────────────────────────────
async function checkAndShowDailyLogin() {
    _dlUpdateBtn(null); // reset dulu
    const status = await _dlFetchStatus();
    if (!status) return;

    _dlUpdateBtnFromStatus(status);

    if (!status.claimedToday) {
        setTimeout(openDailyLoginModal, 700);
    }
}

// ── Open / Close modal ────────────────────────────────────────
async function openDailyLoginModal() {
    const el = document.getElementById('dailyLoginModal');
    if (!el) return;
    el.classList.remove('hidden');
    await _dlRenderCalendar();
}

function closeDailyLoginModal() {
    const el = document.getElementById('dailyLoginModal');
    if (el) el.classList.add('hidden');
}

// ── Render calendar (dari data server) ───────────────────────
async function _dlRenderCalendar() {
    const grid = document.getElementById('dlCalendarGrid');
    if (!grid) return;

    // Tampilkan loading sementara fetch
    grid.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:20px;font-size:10px">Memuat...</div>';

    const status = await _dlFetchStatus();
    if (!status) {
        grid.innerHTML = '<div style="text-align:center;color:red;padding:10px;font-size:9px">Gagal memuat data. Coba refresh.</div>';
        return;
    }

    const { streak = 0, claimedToday } = status;
    const dayIdx           = streak % 7;
    const claimedTodayIdx  = claimedToday ? (streak - 1) % 7 : -1;

    let html = '';
    DAILY_REWARDS.forEach((r, i) => {
        const isPast         = claimedToday ? i < claimedTodayIdx : i < dayIdx;
        const isClaimedToday = i === claimedTodayIdx;
        const isCurrent      = !claimedToday && i === dayIdx;
        const isFuture       = !isCurrent && !isPast && !isClaimedToday;

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
                <div class="dl-day-coins">+${r.coins}<img src="assets/coin.png" class="dl-coin-sm" alt="Koin"></div>
                ${r.special ? '<div class="dl-special-badge">BONUS!</div>' : ''}
            </div>
        `;
    });
    grid.innerHTML = html;

    const btn    = document.getElementById('dlClaimBtn');
    const msgEl  = document.getElementById('dlStatusMsg');

    if (claimedToday) {
        btn.disabled = true;
        btn.innerHTML = '✅ SUDAH DIKLAIM HARI INI';
        if (msgEl) msgEl.textContent = 'Kembali besok untuk reward berikutnya! ⏰';
    } else {
        btn.disabled = false;
        const nextReward = DAILY_REWARDS[dayIdx];
        btn.innerHTML = `<span>🎁 KLAIM +${nextReward.coins} KOIN — HARI ${dayIdx + 1}</span><div class="btn-glow"></div>`;
        if (msgEl) msgEl.innerHTML = `<span class="dl-streak-chip">🔥 Streak: ${streak} hari</span>`;
    }
}

// ── Claim reward (via server) ─────────────────────────────────
async function claimDailyReward() {
    const username = _dlGetUsername();
    if (!username) return;

    const btn = document.getElementById('dlClaimBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Memproses...'; }

    try {
        const res = await _dlFetch(`/api/user/${encodeURIComponent(username)}/daily/claim`, {
            method: 'POST'
        });
        const data = await res.json();

        if (!res.ok) {
            // Sudah diklaim / error
            const msgEl = document.getElementById('dlStatusMsg');
            if (msgEl) msgEl.textContent = data.message || 'Gagal klaim.';
            await _dlRenderCalendar();
            return;
        }

        // ✅ Update coin display di game dari data server (bukan tebak-tebakan)
        if (typeof updateCoinDisplay === 'function') updateCoinDisplay(data.coins);
        if (typeof playerCoins !== 'undefined')       playerCoins = data.coins;

        // SFX
        if (typeof sfxScore !== 'undefined' && sfxScore) {
            try { sfxScore.currentTime = 0; sfxScore.play(); } catch (_) {}
        }

        // Animasi koin
        _dlCoinFly(data.rewardCoins);

        // Re-render
        await _dlRenderCalendar();
        _dlUpdateBtnFromStatus({ claimedToday: true });

    } catch (err) {
        console.error('[claimDailyReward]', err);
        if (btn) { btn.disabled = false; btn.innerHTML = '⚠️ Gagal, coba lagi'; }
    }
}

// ── Coin fly animation (tidak berubah dari versi lama) ────────
function _dlCoinFly(amount) {
    const srcEl  = document.getElementById('dlClaimBtn');
    const destEl = document.getElementById('coinDisplay');
    if (!srcEl || !destEl) return;

    const from = srcEl.getBoundingClientRect();
    const to   = destEl.getBoundingClientRect();
    const tx = (to.left + to.width  / 2) - (from.left + from.width  / 2);
    const ty = (to.top  + to.height / 2) - (from.top  + from.height / 2);

    const count = Math.min(amount, 14);
    for (let i = 0; i < count; i++) {
        (function(delay) {
            setTimeout(() => {
                const coin = document.createElement('div');
                coin.className = 'dl-fly-coin';
                coin.innerHTML = '<img src="assets/coin.png" class="dl-fly-coin-img" alt="Koin">';
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

    const totalDuration = count * 75 + 950;
    setTimeout(() => {
        const hudEl = document.getElementById('coinDisplay');
        if (hudEl) {
            hudEl.classList.remove('pop'); void hudEl.offsetWidth;
            hudEl.classList.add('pop');
            setTimeout(() => hudEl.classList.remove('pop'), 400);
        }
    }, totalDuration);
}

// ── Update tombol buka (pulse jika belum klaim) ───────────────
function _dlUpdateBtnFromStatus(status) {
    const btn = document.getElementById('dailyLoginOpenBtn');
    if (!btn) return;
    const claimed = status?.claimedToday || false;
    btn.classList.toggle('dl-unclaimed', !claimed);
    btn.title = claimed ? '📅 Daily Reward (Sudah Diklaim)' : '🎁 Ambil Daily Reward!';
}

// Versi fallback saat status belum diketahui
function _dlUpdateBtn(status) {
    if (status !== null) { _dlUpdateBtnFromStatus(status); return; }
    const btn = document.getElementById('dailyLoginOpenBtn');
    if (btn) btn.classList.remove('dl-unclaimed');
}

// ── Sembunyikan tombol saat game berjalan ─────────────────────
(function _dlWatchGameState() {
    function _tick() {
        const btn = document.getElementById('dailyLoginOpenBtn');
        if (!btn) return;
        const running = typeof gameRunning !== 'undefined' && gameRunning;
        btn.style.display = running ? 'none' : '';
    }
    setInterval(_tick, 300);
})();

// ── Auto-trigger saat gamePage visible ───────────────────────
(function _dlObserveGamePage() {
    const gamePage = document.getElementById('gamePage');
    if (!gamePage) return;

    let triggered = false;
    const obs = new MutationObserver(() => {
        if (!gamePage.classList.contains('hidden') && !triggered) {
            triggered = true; obs.disconnect();
            checkAndShowDailyLogin();
        }
    });
    obs.observe(gamePage, { attributes: true, attributeFilter: ['class'] });

    if (!gamePage.classList.contains('hidden')) {
        triggered = true; obs.disconnect();
        checkAndShowDailyLogin();
    }
})();