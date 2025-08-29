(() => {
  // Elements
  const difficultyEl = document.getElementById('difficulty');
  const rangeText = document.getElementById('range-text');
  const maxAttemptsText = document.getElementById('max-attempts-text');
  const highScoreEl = document.getElementById('high-score');

  const messageEl = document.getElementById('message');
  const guessForm = document.getElementById('guess-form');
  const guessInput = document.getElementById('guess-input');
  const resetBtn = document.getElementById('reset-btn');

  const attemptsEl = document.getElementById('attempts');
  const previousEl = document.getElementById('previous');
  const hintEl = document.getElementById('hint');
  const progressBar = document.getElementById('progress-bar');
  const historyList = document.getElementById('history-list');

  const confettiCanvas = document.getElementById('confetti');
  const ctx = confettiCanvas.getContext('2d');

  // Game State
  let min = 1, max = 100, maxAttempts = 10;
  let secret = 0;
  let attempts = 0;
  let prevGuess = null;
  let isOver = false;

  // Resize canvas
  function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Confetti particles
  const colors = ['#00e5ff', '#7efff5', '#ff758c', '#ffd166', '#06d6a0'];
  let confetti = [];
  function spawnConfetti(count = 150){
    confetti = [];
    for(let i=0;i<count;i++){
      confetti.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * 200,
        r: 2 + Math.random() * 4,
        vx: -2 + Math.random() * 4,
        vy: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random()*colors.length)],
        tilt: Math.random() * 10,
        tiltAngle: 0,
        alpha: 1
      });
    }
  }
  function drawConfetti(){
    ctx.clearRect(0,0,confettiCanvas.width, confettiCanvas.height);
    confetti.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.tiltAngle += 0.05;
      p.tilt = Math.sin(p.tiltAngle) * 5;
      p.alpha -= 0.003;
      ctx.globalAlpha = Math.max(p.alpha, 0);
      ctx.beginPath();
      ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r*1.5, p.tiltAngle, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    confetti = confetti.filter(p => p.alpha > 0 && p.y < confettiCanvas.height + 20);
    if (confetti.length) requestAnimationFrame(drawConfetti);
  }

  // Utilities
  function randInt(a, b){ return Math.floor(Math.random() * (b - a + 1)) + a; }
  function setText(el, t){ el.textContent = t; }

  // Difficulty presets
  const presets = {
    easy:  { min:1, max:50,  maxAttempts: 10 },
    normal:{ min:1, max:100, maxAttempts: 10 },
    hard:  { min:1, max:500, maxAttempts: 12 },
  };

  function loadHighScore(key){
    const v = localStorage.getItem(key);
    return v ? parseInt(v,10) : null;
  }
  function saveHighScore(key, val){
    localStorage.setItem(key, String(val));
  }
  function getHSKey(){
    return `ngg-highscore-${difficultyEl.value}`;
  }

  function updateUI(){
    rangeText.textContent = `${min}–${max}`;
    maxAttemptsText.textContent = `${maxAttempts}`;
    const hs = loadHighScore(getHSKey());
    highScoreEl.textContent = (hs ?? '—');
  }

  function resetGame(){
    const p = presets[difficultyEl.value];
    min = p.min; max = p.max; maxAttempts = p.maxAttempts;
    secret = randInt(min, max);
    attempts = 0;
    prevGuess = null;
    isOver = false;
    setText(messageEl, `I'm thinking of a number between ${min} and ${max}. Can you guess it?`);
    setText(attemptsEl, attempts);
    setText(previousEl, '—');
    setText(hintEl, 'Start guessing!');
    progressBar.style.width = '0%';
    historyList.innerHTML = '';
    guessInput.value = '';
    guessInput.disabled = false;
    guessInput.focus();
    updateUI();
  }

  function gameOver(win){
    isOver = true;
    guessInput.disabled = true;
    if (win){
      setText(messageEl, `🎉 Correct! The number was ${secret}. You did it in ${attempts} ${attempts===1?'try':'tries'}!`);
      // High score update
      const hsKey = getHSKey();
      const currentHS = loadHighScore(hsKey);
      if (!currentHS || attempts < currentHS){
        saveHighScore(hsKey, attempts);
        setText(highScoreEl, attempts);
        setText(hintEl, 'New High Score! 🏆');
      }
      spawnConfetti();
      requestAnimationFrame(drawConfetti);
    } else {
      setText(messageEl, `💥 Out of attempts! The number was ${secret}. Try again!`);
    }
  }

  function submitGuess(e){
    e.preventDefault();
    if (isOver) return;
    const value = parseInt(guessInput.value,10);
    if (Number.isNaN(value)){
      setText(hintEl, 'Please enter a number.');
      return;
    }
    if (value < min || value > max){
      setText(hintEl, `Number must be between ${min} and ${max}.`);
      return;
    }
    attempts++;
    setText(attemptsEl, attempts);
    setText(previousEl, value);

    // Add to history
    const li = document.createElement('li');
    li.textContent = `#${attempts}: ${value}`;
    historyList.prepend(li);

    // Update progress bar
    progressBar.style.width = `${Math.min(100, attempts/maxAttempts*100)}%`;

    if (value === secret){
      gameOver(true);
      return;
    }

    // Hints
    const diff = Math.abs(secret - value);
    const direction = value > secret ? '⬇️ Too high' : '⬆️ Too low';
    let temp = '';
    if (prevGuess != null){
      const prevDiff = Math.abs(secret - prevGuess);
      temp = diff < prevDiff ? ' (warmer 🔥)' : (diff > prevDiff ? ' (colder ❄️)' : ' (same distance)');
    }
    setText(hintEl, `${direction}${temp}`);
    prevGuess = value;

    if (attempts >= maxAttempts){
      gameOver(false);
    } else {
      setText(messageEl, `Keep trying! Attempts left: ${maxAttempts - attempts}`);
    }
    guessInput.value = '';
    guessInput.focus();
  }

  // Event Listeners
  difficultyEl.addEventListener('change', resetGame);
  guessForm.addEventListener('submit', submitGuess);
  resetBtn.addEventListener('click', resetGame);

  // Init
  resetGame();
})();