let timers = []; // タイマー設定のリスト {minutes, seconds, totalSeconds}
let currentTimerIndex = 0;
let remainingSeconds = 0;
let intervalId = null;
let isRunning = false;

// DOM要素
const minInput = document.getElementById('input-min');
const secInput = document.getElementById('input-sec');
const addBtn = document.getElementById('add-btn');
const timerList = document.getElementById('timer-list');
const mainDisplay = document.getElementById('main-display');
const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

// 音声再生用 (Web Audio API) - ビープ音
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep() {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5); // 0.5秒鳴らす
}

// 時間フォーマット (00:00)
function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// リストへの追加処理
addBtn.addEventListener('click', () => {
    const m = parseInt(minInput.value) || 0;
    const s = parseInt(secInput.value) || 0;
    const total = m * 60 + s;

    if (total <= 0) return;

    timers.push({ totalSeconds: total, originalTotal: total });
    renderList();
});

// リスト描画
function renderList() {
    timerList.innerHTML = '';
    timers.forEach((timer, index) => {
        const div = document.createElement('div');
        div.className = 'timer-item';
        if (index === currentTimerIndex && isRunning) {
            div.classList.add('active');
        }
        div.innerHTML = `
            <span>#${index + 1}</span>
            <span>${formatTime(timer.originalTotal)}</span>
        `;
        timerList.appendChild(div);
    });
}

// タイマースタート
startBtn.addEventListener('click', () => {
    if (timers.length === 0) return;
    if (isRunning) return; // 既に実行中なら何もしない

    // AudioContextの再開(ユーザー操作が必要なため)
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isRunning = true;
    startBtn.disabled = true;
    addBtn.disabled = true;

    // 初回スタートまたは一時停止からの再開
    if (remainingSeconds === 0 && currentTimerIndex < timers.length) {
        remainingSeconds = timers[currentTimerIndex].totalSeconds;
    }
    
    statusText.innerText = `タイマー ${currentTimerIndex + 1} 実行中`;
    renderList(); // アクティブ表示更新
    updateDisplay();

    intervalId = setInterval(() => {
        remainingSeconds--;
        updateDisplay();

        if (remainingSeconds < 0) {
            // タイマー終了時の処理
            playBeep();
            nextTimer();
        }
    }, 1000);
});

// 次のタイマーへ
function nextTimer() {
    clearInterval(intervalId);
    currentTimerIndex++;

    if (currentTimerIndex < timers.length) {
        // 次のタイマーがある場合
        remainingSeconds = timers[currentTimerIndex].totalSeconds;
        statusText.innerText = `タイマー ${currentTimerIndex + 1} 実行中`;
        renderList();
        
        // 即座に次を開始
        intervalId = setInterval(() => {
            remainingSeconds--;
            updateDisplay();
            if (remainingSeconds < 0) {
                playBeep();
                nextTimer();
            }
        }, 1000);
    } else {
        // 全て終了
        finishAll();
    }
}

function updateDisplay() {
    if (remainingSeconds < 0) remainingSeconds = 0;
    mainDisplay.innerText = formatTime(remainingSeconds);
}

function finishAll() {
    isRunning = false;
    clearInterval(intervalId);
    statusText.innerText = "全て完了しました";
    startBtn.disabled = false;
    addBtn.disabled = false;
    startBtn.innerText = "再スタート";
    
    // リセットのためにインデックスを戻す場合はここで制御
    // currentTimerIndex = 0; 
}

// リセットボタン
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