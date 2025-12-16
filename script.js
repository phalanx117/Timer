let timers = [];
let currentTimerIndex = 0;
let remainingSeconds = 0;
let intervalId = null;
let isRunning = false;
let inputBuffer = ""; // テンキー入力用のバッファ文字列

// DOM要素
const addBtn = document.getElementById('add-btn');
const timerList = document.getElementById('timer-list');
const mainDisplay = document.getElementById('main-display');
const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const repeatStepBtn = document.getElementById('repeat-step-btn');
const timeInputDisplay = document.getElementById('time-input-display');
const numButtons = document.querySelectorAll('.num-btn');
const delBtn = document.getElementById('del-btn');

// 音声設定
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
        console.log("音の再生エラー", e);
    }
}

function formatTime(totalSec) {
    if (totalSec < 0) totalSec = 0;
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ----------------------------------------
// テンキー入力ロジック
// ----------------------------------------

// 数字ボタンのイベントリスナー
numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 削除ボタンの場合は別処理
        if (btn.id === 'del-btn') {
            inputBuffer = inputBuffer.slice(0, -1);
            updateInputDisplay();
            return;
        }

        const val = btn.getAttribute('data-val');
        
        // 4桁（MMSS）まで制限
        if (inputBuffer.length + val.length > 4) return;

        // 0の連続入力防止（空のときに0は無視、など必要なら追加）
        if (inputBuffer === "" && val === "00") return; // 最初がいきなり00は防ぐ
        
        inputBuffer += val;
        updateInputDisplay();
    });
});

// 入力画面の表示更新 (00m 00s形式)
function updateInputDisplay() {
    // 右詰めでパディング
    // 例: "1" -> 00m 01s, "12" -> 00m 12s, "123" -> 01m 23s
    const padded = inputBuffer.padStart(4, '0');
    const m = padded.slice(0, 2);
    const s = padded.slice(2, 4);
    
    timeInputDisplay.innerHTML = `${m}<span class="unit">m</span> ${s}<span class="unit">s</span>`;
}

// ----------------------------------------
// タイマーロジック
// ----------------------------------------

// 追加ボタン
addBtn.addEventListener('click', () => {
    if (inputBuffer.length === 0) return;

    const padded = inputBuffer.padStart(4, '0');
    const m = parseInt(padded.slice(0, 2));
    const s = parseInt(padded.slice(2, 4));
    const total = m * 60 + s;

    if (total <= 0) return;
    
    timers.push({ 
        totalSeconds: total, 
        originalTotal: total,
        label: null 
    });
    
    // 入力をクリア
    inputBuffer = "";
    updateInputDisplay();
    
    renderList();
});

function renderList() {
    timerList.innerHTML = '';
    let displayCount = 1;

    timers.forEach((timer, index) => {
        const div = document.createElement('div');
        div.className = 'timer-item';
        
        if (index === currentTimerIndex && isRunning) {
            div.classList.add('active');
        }

        let nameText = timer.label ? timer.label : `#${displayCount}`;
        if (!timer.label) displayCount++;

        div.innerHTML = `<span>${nameText}</span><span>${formatTime(timer.originalTotal)}</span>`;
        timerList.appendChild(div);
    });
}

function updateDisplay() {
    mainDisplay.innerText = formatTime(remainingSeconds);
}

function tick() {
    remainingSeconds--;
    updateDisplay();

    if (remainingSeconds < 0) {
        clearInterval(intervalId);
        playBeep();
        currentTimerIndex++;
        startNextTimer();
    }
}

function startNextTimer() {
    if (currentTimerIndex < timers.length) {
        remainingSeconds = timers[currentTimerIndex].totalSeconds;
        
        const currentTimer = timers[currentTimerIndex];
        const statusLabel = currentTimer.label ? currentTimer.label : `#${currentTimerIndex + 1}`;        
        statusText.innerText = `Running: ${statusLabel}`;

        renderList();
        updateDisplay();
        intervalId = setInterval(tick, 1000);
    } else {
        finishAll();
    }
}

startBtn.addEventListener('click', () => {
    if (timers.length === 0 || isRunning) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    isRunning = true;
    startBtn.disabled = true;
    addBtn.disabled = true;
    repeatStepBtn.disabled = false;
    
    // キーパッドも無効化っぽく見せるならここで制御可能ですが、
    // 誤操作防止のため操作できなくするのもありです（今回はそのまま）

    if (remainingSeconds === 0 && currentTimerIndex === 0) {
        remainingSeconds = timers[0].totalSeconds;
    }
    
    const currentTimer = timers[currentTimerIndex];
    const statusLabel = currentTimer.label ? currentTimer.label : `#${currentTimerIndex + 1}`;
    statusText.innerText = `Running: ${statusLabel}`;
    
    renderList();
    updateDisplay();
    intervalId = setInterval(tick, 1000);
});

repeatStepBtn.addEventListener('click', () => {
    if (!isRunning || timers.length === 0) return;
    
    const currentTimer = timers[currentTimerIndex];
    
    let baseName = currentTimer.label;
    if (!baseName) {
        baseName = `#${currentTimerIndex + 1}`;
    }

    const newTimer = {
        totalSeconds: currentTimer.originalTotal,
        originalTotal: currentTimer.originalTotal,
        label: baseName + "(repeat)"
    };

    timers.splice(currentTimerIndex + 1, 0, newTimer);
    renderList();
});

function finishAll() {
    isRunning = false;
    clearInterval(intervalId);
    statusText.innerText = "All Done!";
    startBtn.disabled = false;
    addBtn.disabled = false;
    repeatStepBtn.disabled = true;
    startBtn.innerText = "Restart";
    currentTimerIndex = 0;
    remainingSeconds = 0;
}

resetBtn.addEventListener('click', () => {
    clearInterval(intervalId);
    isRunning = false;
    timers = [];
    currentTimerIndex = 0;
    remainingSeconds = 0;
    
    inputBuffer = ""; // 入力もリセット
    updateInputDisplay();

    renderList();
    mainDisplay.innerText = "00:00";
    statusText.innerText = "Waiting...";
    startBtn.disabled = false;
    addBtn.disabled = false;
    repeatStepBtn.disabled = true;
    startBtn.innerText = "Start";
});
