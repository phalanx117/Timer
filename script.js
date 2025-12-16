let timers = [];
let currentTimerIndex = 0;
let remainingSeconds = 0;
let intervalId = null;
let isRunning = false;
let inputBuffer = ""; 

const addBtn = document.getElementById('add-btn');
const timerList = document.getElementById('timer-list');
const mainDisplay = document.getElementById('main-display');
const statusText = document.getElementById('status-text');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
// repeatStepBtn の取得は削除
const timeInputDisplay = document.getElementById('time-input-display');
const numButtons = document.querySelectorAll('.num-btn');
const delBtn = document.getElementById('del-btn');

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

numButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.id === 'del-btn') {
            inputBuffer = inputBuffer.slice(0, -1);
            updateInputDisplay();
            return;
        }

        const val = btn.getAttribute('data-val');
        if (inputBuffer.length + val.length > 3) return;
        if (inputBuffer === "" && (val === "0" || val === "00")) return;
        
        inputBuffer += val;
        updateInputDisplay();
    });
});

function updateInputDisplay() {
    const displayVal = inputBuffer === "" ? "0" : inputBuffer;
    timeInputDisplay.innerHTML = `${displayVal}<span class="unit">m</span>`;
}

// ----------------------------------------
// タイマーロジック
// ----------------------------------------

addBtn.addEventListener('click', () => {
    if (inputBuffer.length === 0) return;

    const m = parseInt(inputBuffer);
    const total = m * 60; 

    if (total <= 0) return;
    
    timers.push({ 
        totalSeconds: total, 
        originalTotal: total,
        label: null 
    });
    
    inputBuffer = "";
    updateInputDisplay();
    renderList();
});

// 現在実行中のタイマーを複製して割り込ませる関数
function duplicateCurrentTimer() {
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
}

function renderList() {
    timerList.innerHTML = '';
    let displayCount = 1;

    timers.forEach((timer, index) => {
        const div = document.createElement('div');
        div.className = 'timer-item';
        
        const isActive = (index === currentTimerIndex && isRunning);
        if (isActive) {
            div.classList.add('active');
        }

        let nameText = timer.label ? timer.label : `#${displayCount}`;
        if (!timer.label) displayCount++;

        // 左側の名前
        const nameSpan = document.createElement('span');
        nameSpan.innerText = nameText;
        div.appendChild(nameSpan);

        // 右側のグループ（時間 ＋ アクティブならボタン）
        const rightGroup = document.createElement('div');
        rightGroup.className = 'timer-right-group';

        if (isActive) {
            // リピートボタンの作成
            const repBtn = document.createElement('button');
            repBtn.innerText = '↺';
            repBtn.className = 'btn-repeat-inline';
            repBtn.onclick = (e) => {
                e.stopPropagation(); // 親要素へのイベント伝播を止める
                duplicateCurrentTimer();
            };
            rightGroup.appendChild(repBtn);
        }

        const timeSpan = document.createElement('span');
        timeSpan.innerText = formatTime(timer.originalTotal);
        rightGroup.appendChild(timeSpan);

        div.appendChild(rightGroup);
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
    // repeatStepBtnの制御は削除
    
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

// repeatStepBtn の addEventListener は削除

function finishAll() {
    isRunning = false;
    clearInterval(intervalId);
    statusText.innerText = "All Done!";
    startBtn.disabled = false;
    addBtn.disabled = false;
    // repeatStepBtnの制御は削除
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
    
    inputBuffer = "";
    updateInputDisplay();

    renderList();
    mainDisplay.innerText = "00:00";
    statusText.innerText = "Waiting...";
    startBtn.disabled = false;
    addBtn.disabled = false;
    // repeatStepBtnの制御は削除
    startBtn.innerText = "Start";
});
