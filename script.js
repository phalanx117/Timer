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
const repeatStepBtn = document.getElementById('repeat-step-btn'); // ID変更

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

// 追加ボタン（通常）
addBtn.addEventListener('click', () => {
    const m = parseInt(minInput.value) || 0;
    const s = parseInt(secInput.value) || 0;
    const total = m * 60 + s;
    if (total <= 0) return;
    
    // 通常追加時は label は null
    timers.push({ 
        totalSeconds: total, 
        originalTotal: total,
        label: null 
    });
    renderList();
});

function renderList() {
    timerList.innerHTML = '';
    
    // 表示用の通し番号カウンタ
    let displayCount = 1;

    timers.forEach((timer, index) => {
        const div = document.createElement('div');
        div.className = 'timer-item';
        
        if (index === currentTimerIndex && isRunning) {
            div.classList.add('active');
        }

        // ラベルの決定ロジック
        let nameText = "";
        if (timer.label) {
            // 「追加」などの特別なラベルがある場合
            nameText = timer.label;
        } else {
            // 通常の連番
            nameText = `#${displayCount}`;
            displayCount++;
        }

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
        
        // ステータス表示の更新
        const currentTimer = timers[currentTimerIndex];
        const statusLabel = currentTimer.label ? currentTimer.label : `タイマー ${currentTimerIndex + 1}`;
        statusText.innerText = `${statusLabel} 実行中`;
        
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
    repeatStepBtn.disabled = false; // 有効化

    if (remainingSeconds === 0 && currentTimerIndex === 0) {
        remainingSeconds = timers[0].totalSeconds;
        statusText.innerText = `タイマー 1 実行中`;
    }
    
    renderList();
    updateDisplay();
    intervalId = setInterval(tick, 1000);
});

// 【変更】「もう1回追加」ボタンの処理
repeatStepBtn.addEventListener('click', () => {
    if (!isRunning || timers.length === 0) return;
    
    const currentTimer = timers[currentTimerIndex];
    
    // 表示名の決定：既にラベルがあればそれを使う、なければ今の番号
    let baseName = currentTimer.label;
    if (!baseName) {
        // 現在のリスト上の見た目の番号を探す（ちょっと簡易的な計算）
        // 厳密な計算より「今のやつの追加」とわかればいいので
        baseName = `#${currentTimerIndex + 1}`;
    }

    // 新しいタイマーオブジェクトを作成（コピー）
    const newTimer = {
        totalSeconds: currentTimer.originalTotal,
        originalTotal: currentTimer.originalTotal,
        label: baseName + "(再)" // ここで「(再)」をつける
    };

    // 配列の「現在の次の位置」に挿入する (splice)
    timers.splice(currentTimerIndex + 1, 0, newTimer);
    
    // リストを再描画してユーザーに見せる
    renderList();
    
    // ボタンを押した感触（コンソールログなど。スマホだと見えないですが）
    console.log("追加しました");
});

function finishAll() {
    isRunning = false;
    clearInterval(intervalId);
    statusText.innerText = "全て完了しました";
    startBtn.disabled = false;
    addBtn.disabled = false;
    repeatStepBtn.disabled = true;
    startBtn.innerText = "再スタート";
    currentTimerIndex = 0;
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
    repeatStepBtn.disabled = true;
    startBtn.innerText = "スタート";
});
