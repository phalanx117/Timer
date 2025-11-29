let timers = [];
let currentTimerIndex = 0;
let remainingSeconds = 0;
let intervalId = null;
let isRunning = false;

const minInput = document.getElementById('input-min');
const secInput = document.getElementById('input-sec');
const addBtn = document.getElementById('add-btn');
const timerList = document.getElementById('timer-list');
const mainDisplay = document.getElementById('main-display');
const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

// 音声再生 (エラー対策付き)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep() {
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log("音の再生に失敗しましたが続行します", e);
    }
}

function formatTime(totalSec) {
    if (totalSec < 0) totalSec = 0;
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

addBtn.addEventListener('click', () => {
    const m = parseInt(minInput.value) || 0;
    const s = parseInt(secInput.value) || 0;
    const total = m * 60 + s;
    if (total <= 0) return;
    timers.push({ totalSeconds: total, originalTotal: total });
    renderList();
});

function renderList() {
    timerList.innerHTML = '';
    timers.forEach((timer, index) => {
        const div = document.createElement('div');
        div.className = 'timer-item';
        if (index === currentTimerIndex && isRunning) {
            div.classList.add('active');
        }
        div.innerHTML = `<span>#${index + 1}</span><span>${formatTime(timer.originalTotal)}</span>`;
        timerList.appendChild(div);
    });
}

function updateDisplay() {
    mainDisplay.innerText = formatTime(remainingSeconds);
}

// 共通のカウントダウン処理
function tick() {
    remainingSeconds--;
    updateDisplay();

    // 0秒になったら終了処理（ここが修正ポイント：<0でなく0で判定して即次へ行くか調整）
    if (remainingSeconds < 0) {
        clearInterval(intervalId);
        playBeep();
        
        // 次のタイマーへ
        currentTimerIndex++;
        startNextTimer();
    }
}

function startNextTimer() {
    if (currentTimerIndex < timers.length) {
        // 次がある場合
        remainingSeconds = timers[currentTimerIndex].totalSeconds;
        statusText.innerText = `タイマー ${currentTimerIndex + 1} 実行中`;
        renderList();
        updateDisplay();
        
        // 1秒後に減り始める
        intervalId = setInterval(tick, 1000);
    } else {
        // 全て完了
        finishAll();
    }
}

startBtn.addEventListener('click', () => {
    if (timers.length === 0 || isRunning) return;
    
    // 音声コンテキストの再開
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isRunning = true;
    startBtn.disabled = true;
    addBtn.disabled = true;

    // もし最初のスタートなら初期値をセット
    if (remainingSeconds === 0 && currentTimerIndex === 0) {
        remainingSeconds = timers[0].totalSeconds;
        statusText.innerText = `タイマー 1 実行中`;
    }
    
    renderList();
    updateDisplay();
    intervalId = setInterval(tick, 1000);
});

function finishAll() {
    isRunning = false;
    clearInterval(intervalId);
    statusText.innerText = "全て完了しました";
    startBtn.disabled = false;
    addBtn.disabled = false;
    startBtn.innerText = "再スタート";
    currentTimerIndex = 0; // 次回のためにリセット
    remainingSeconds = 0;
}

resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    isRunning = false;
    timers = [];
    currentTimerIndex = 0;
    remainingSeconds = 0;
    renderList();
    mainDisplay.innerText = "00:00";
    statusText.innerText = "待機中";
    startBtn.disabled = false;
    addBtn.disabled = false;
    startBtn.innerText = "スタート";
});
