// ══════════════════════════════════════════════
//  HDP CARTAS - Client Script
// ══════════════════════════════════════════════

const socket = io();

// ── State ─────────────────────────────────────
let state = {
  roomCode: null,
  playerId: null,
  playerName: null,
  targetScore: 5,
  gameState: null,
};

let selectedCards = [];
let qrInstance = null;

// ── Screen Management ─────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); el.scrollTop = 0; }
}

// ── Options / Setup ───────────────────────────
function selectOption(btn, group) {
  document.querySelectorAll(`[onclick*="${group}"]`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (group === 'target-score') state.targetScore = parseInt(btn.dataset.value);
}

// ── Toast ─────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3000);
}

// ── Create / Join Room ────────────────────────
function createRoom() {
  const name = document.getElementById('host-name').value.trim();
  if (!name) return showToast('Ingresá tu nombre', 'error');
  state.playerName = name;
  socket.emit('create_room', { playerName: name, targetScore: state.targetScore });
}

function joinRoom() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) return showToast('Ingresá tu nombre', 'error');
  if (!code || code.length < 4) return showToast('Ingresá el código de sala', 'error');
  state.playerName = name;
  state.roomCode = code;
  socket.emit('join_room', { roomCode: code, playerName: name });
}

function startGame() {
  socket.emit('start_game', { roomCode: state.roomCode });
}

function nextRound() {
  socket.emit('next_round', { roomCode: state.roomCode });
}

function restartGame() {
  socket.emit('restart_game', { roomCode: state.roomCode });
}

function goToMenu() {
  window.location.reload();
}

function copyLink() {
  const link = document.getElementById('share-link').textContent;
  navigator.clipboard.writeText(link).then(() => {
    showToast('¡Link copiado!', 'success');
  }).catch(() => {
    showToast('Copiá el link manualmente', '');
  });
}

// ── QR Code ────────────────────────────────────
function generateQR(url) {
  const canvas = document.getElementById('qr-canvas');
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  try {
    if (window.QRCode) {
      new QRCode(canvas, {
        text: url,
        width: 120,
        height: 120,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    }
  } catch (e) {
    console.warn('QR error:', e);
  }
}

// ── URL Handling ───────────────────────────────
function checkURLForRoom() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('sala') || params.get('room');
  if (code) {
    document.getElementById('join-code').value = code.toUpperCase();
    showScreen('screen-join');
  }
}

// ── Render Lobby ───────────────────────────────
function renderLobby(gs) {
  document.getElementById('lobby-code').textContent = gs.code;

  const baseUrl = window.location.origin + window.location.pathname;
  const link = `${baseUrl}?sala=${gs.code}`;
  document.getElementById('share-link').textContent = link;
  generateQR(link);

  const list = document.getElementById('lobby-players');
  list.innerHTML = '';
  gs.players.forEach(p => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="player-avatar">${p.name[0].toUpperCase()}</div>
      <span>${p.name}</span>
      ${p.isHost ? '<span class="host-badge">HOST</span>' : ''}
    `;
    list.appendChild(li);
  });

  const btnStart = document.getElementById('btn-start');
  const minMsg = document.getElementById('lobby-min-msg');
  const waitMsg = document.getElementById('lobby-waiting');

  if (gs.isHost) {
    if (gs.players.length >= 2) {
      btnStart.classList.remove('hidden');
      minMsg.classList.add('hidden');
    } else {
      btnStart.classList.add('hidden');
      minMsg.classList.remove('hidden');
    }
    waitMsg.classList.add('hidden');
  } else {
    btnStart.classList.add('hidden');
    minMsg.classList.add('hidden');
    waitMsg.classList.remove('hidden');
  }
}

// ── Render Game ────────────────────────────────
function renderGame(gs) {
  // Round number
  document.getElementById('round-num').textContent = gs.roundNumber;

  // Mini scoreboard
  const mini = document.getElementById('scoreboard-mini');
  mini.innerHTML = '';
  gs.players.forEach(p => {
    const chip = document.createElement('div');
    chip.className = `score-chip${p.isJudge ? ' is-judge' : ''}${p.id === gs.playerId ? ' is-me' : ''}`;
    chip.innerHTML = `
      <span>${p.isJudge ? '👑' : ''}${p.name.split(' ')[0]}</span>
      <span class="chip-score">${p.score}</span>
    `;
    mini.appendChild(chip);
  });

  // Status badge
  const statusBadge = document.getElementById('status-badge');
  const nonJudge = gs.players.filter(p => !p.isJudge).length;
  statusBadge.textContent = `${gs.submissionsCount}/${nonJudge} enviaron`;

  // Black card
  const blackText = document.getElementById('black-card-text');
  if (gs.currentBlackCard) {
    let html = gs.currentBlackCard.text;
    html = html.replace(/__________/g, '<span class="blank">__________</span>');
    blackText.innerHTML = html;
    document.getElementById('blanks-required').textContent =
      `Requiere ${gs.currentBlackCard.blanks} carta${gs.currentBlackCard.blanks > 1 ? 's' : ''}`;
  }

  // Player status chips
  const statusDiv = document.getElementById('players-status');
  statusDiv.innerHTML = '';
  gs.players.forEach(p => {
    const chip = document.createElement('div');
    if (p.isJudge) {
      chip.className = 'player-status-chip judge';
      chip.innerHTML = `👑 ${p.name}`;
    } else {
      chip.className = `player-status-chip${p.hasSubmitted ? ' submitted' : ''}`;
      chip.innerHTML = `${p.hasSubmitted ? '✅' : '⏳'} ${p.name}`;
    }
    statusDiv.appendChild(chip);
  });

  const judgingArea = document.getElementById('judging-area');
  const handArea = document.getElementById('player-hand-area');
  const judgeWaiting = document.getElementById('judge-waiting-area');

  if (gs.phase === 'judging') {
    // Show submissions to judge
    judgingArea.classList.remove('hidden');
    handArea.classList.add('hidden');
    judgeWaiting.classList.add('hidden');

    const submList = document.getElementById('submissions-list');
    submList.innerHTML = '';

    if (gs.isJudge) {
      gs.shuffledSubmissions.forEach((sub, i) => {
        const card = document.createElement('div');
        card.className = 'submission-card';
        const cardsText = sub.cards.join(' + ');
        card.innerHTML = `<div class="submission-num">${i + 1}</div><div>${cardsText}</div>`;
        card.onclick = () => judgePick(sub.id);
        submList.appendChild(card);
      });
    } else {
      const msg = document.createElement('div');
      msg.className = 'submission-not-judge';
      msg.innerHTML = `👑 El juez está eligiendo la respuesta ganadora...`;
      submList.appendChild(msg);
    }

  } else if (gs.isJudge) {
    // Judge waiting for submissions
    judgingArea.classList.add('hidden');
    handArea.classList.add('hidden');
    judgeWaiting.classList.remove('hidden');
    const prog = document.getElementById('judge-progress');
    prog.textContent = `${gs.submissionsCount} de ${nonJudge} jugadores enviaron`;

  } else {
    // Player's hand
    judgingArea.classList.add('hidden');
    handArea.classList.remove('hidden');
    judgeWaiting.classList.add('hidden');
    renderHand(gs);
  }
}

function renderHand(gs) {
  const handDiv = document.getElementById('hand-cards');
  const btnSubmit = document.getElementById('btn-submit');
  const handTitle = document.getElementById('hand-title');
  const selectedInfo = document.getElementById('selected-info');
  const blanks = gs.currentBlackCard ? gs.currentBlackCard.blanks : 1;

  // Check if already submitted
  const mySubmission = gs.players.find(p => p.id === gs.playerId && p.hasSubmitted);
  if (mySubmission) {
    handTitle.textContent = '✅ Respuesta enviada';
    selectedInfo.textContent = 'Esperá a los demás...';
    handDiv.innerHTML = '';
    btnSubmit.classList.add('hidden');
    return;
  }

  handTitle.textContent = `Tu mano (${blanks === 1 ? 'elegí 1 carta' : `elegí ${blanks} cartas en orden`})`;

  handDiv.innerHTML = '';
  gs.hand.forEach(card => {
    const el = document.createElement('div');
    el.className = 'hand-card';
    el.textContent = card;

    const selIdx = selectedCards.indexOf(card);
    if (selIdx !== -1) {
      el.classList.add('selected');
      const badge = document.createElement('div');
      badge.className = 'card-order';
      badge.textContent = selIdx + 1;
      el.appendChild(badge);
    }

    el.onclick = () => toggleCard(card, gs);
    handDiv.appendChild(el);
  });

  // Update info
  if (selectedCards.length === 0) {
    selectedInfo.textContent = '';
  } else {
    selectedInfo.textContent = `${selectedCards.length}/${blanks} seleccionadas`;
  }

  // Submit button
  if (selectedCards.length === blanks) {
    btnSubmit.classList.remove('hidden');
  } else {
    btnSubmit.classList.add('hidden');
  }
}

function toggleCard(card, gs) {
  const blanks = gs.currentBlackCard ? gs.currentBlackCard.blanks : 1;
  const idx = selectedCards.indexOf(card);

  if (idx !== -1) {
    selectedCards.splice(idx, 1);
  } else {
    if (selectedCards.length >= blanks) {
      // Replace last if at capacity
      if (blanks === 1) {
        selectedCards = [card];
      } else {
        showToast(`Solo podés elegir ${blanks} cartas`, 'error');
        return;
      }
    } else {
      selectedCards.push(card);
    }
  }

  renderHand(gs);
}

function submitCards() {
  if (!state.gameState) return;
  const blanks = state.gameState.currentBlackCard.blanks;
  if (selectedCards.length !== blanks) {
    return showToast(`Seleccioná exactamente ${blanks} carta(s)`, 'error');
  }
  socket.emit('submit_cards', { roomCode: state.roomCode, cards: [...selectedCards] });
  selectedCards = [];
}

function judgePick(submissionId) {
  if (!state.gameState || !state.gameState.isJudge) return;
  socket.emit('judge_pick', { roomCode: state.roomCode, submissionId });
}

// ── Render Round Result ────────────────────────
function renderResult(gs) {
  // Black card with filled answers
  const bc = document.getElementById('result-black-card');
  if (gs.currentBlackCard && gs.roundWinner) {
    let text = gs.currentBlackCard.text;
    gs.roundWinner.cards.forEach(card => {
      text = text.replace('__________', `<strong style="color:var(--accent)">${card}</strong>`);
    });
    bc.innerHTML = text;
  }

  // Winner name
  document.getElementById('result-winner-name').textContent =
    gs.roundWinner ? `🏆 ${gs.roundWinner.playerName} gana el punto!` : '';

  // Winning cards
  const winCards = document.getElementById('result-winning-cards');
  winCards.innerHTML = '';
  if (gs.roundWinner) {
    gs.roundWinner.cards.forEach(card => {
      const el = document.createElement('div');
      el.className = 'result-white-card';
      el.textContent = card;
      winCards.appendChild(el);
    });
  }

  // All answers
  const allAns = document.getElementById('result-all-answers');
  allAns.innerHTML = '';
  if (gs.shuffledSubmissions) {
    gs.shuffledSubmissions.forEach((sub, i) => {
      const el = document.createElement('div');
      const isWinner = gs.roundWinner && sub.cards.join('|') === gs.roundWinner.cards.join('|');
      el.className = `result-answer-item${isWinner ? ' winner-answer' : ''}`;
      el.innerHTML = `
        ${isWinner ? '🏆 ' : (i + 1) + '. '}${sub.cards.join(' + ')}
        ${isWinner ? `<div class="answer-player">— ${gs.roundWinner.playerName}</div>` : ''}
      `;
      allAns.appendChild(el);
    });
  }

  // Scoreboard
  renderScoreboard(gs, 'result-scoreboard-list');

  // Next round button
  const btnNext = document.getElementById('btn-next-round');
  const waitMsg = document.getElementById('waiting-next-msg');
  if (gs.isHost) {
    btnNext.classList.remove('hidden');
    waitMsg.classList.add('hidden');
  } else {
    btnNext.classList.add('hidden');
    waitMsg.classList.remove('hidden');
  }
}

function renderScoreboard(gs, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const sorted = [...gs.players].sort((a, b) => b.score - a.score);
  sorted.forEach(p => {
    const row = document.createElement('div');
    row.className = 'score-row';
    const dots = Array.from({ length: gs.targetScore }, (_, i) => {
      return `<div class="score-dot${i < p.score ? ' filled' : ''}"></div>`;
    }).join('');
    row.innerHTML = `
      <div class="player-label">
        ${p.isJudge ? '👑 ' : ''}
        <span>${p.name}${p.id === gs.playerId ? ' (vos)' : ''}</span>
      </div>
      <div class="score-dots">${dots}</div>
      <span style="font-weight:700; color:var(--accent)">${p.score}</span>
    `;
    container.appendChild(row);
  });
}

// ── Render Game Over ───────────────────────────
function renderGameOver(gs) {
  document.getElementById('gameover-winner').textContent = gs.winner ? gs.winner.name : '';

  const rankList = document.getElementById('gameover-ranking-list');
  rankList.innerHTML = '';
  const medals = ['🥇', '🥈', '🥉'];
  (gs.finalRanking || []).forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'ranking-row';
    row.innerHTML = `
      <span class="ranking-pos">${medals[i] || (i + 1)}</span>
      <span class="ranking-name">${p.name}</span>
      <span class="ranking-score">${p.score} pts</span>
    `;
    rankList.appendChild(row);
  });

  const btnRestart = document.getElementById('btn-restart');
  if (gs.isHost) {
    btnRestart.classList.remove('hidden');
  } else {
    btnRestart.classList.add('hidden');
  }

  spawnConfetti();
}

// ── Confetti ───────────────────────────────────
function spawnConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  const colors = ['#e8c84b', '#e05a2b', '#4bc8e8', '#8be84b', '#e84bc8', '#fff'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.width = (8 + Math.random() * 8) + 'px';
    piece.style.height = (8 + Math.random() * 8) + 'px';
    piece.style.animationDuration = (2 + Math.random() * 3) + 's';
    piece.style.animationDelay = Math.random() * 2 + 's';
    container.appendChild(piece);
  }
}

// ── Master State Handler ───────────────────────
function handleGameState(gs) {
  state.gameState = gs;
  state.roomCode = gs.code;

  switch (gs.phase) {
    case 'lobby':
      selectedCards = [];
      showScreen('screen-lobby');
      renderLobby(gs);
      break;

    case 'playing':
      showScreen('screen-playing');
      renderGame(gs);
      break;

    case 'judging':
      showScreen('screen-playing');
      renderGame(gs);
      break;

    case 'round_result':
      showScreen('screen-result');
      renderResult(gs);
      break;

    case 'game_over':
      showScreen('screen-gameover');
      renderGameOver(gs);
      break;
  }
}

// ── Socket Events ─────────────────────────────
socket.on('connect', () => {
  state.playerId = socket.id;
  // Try to rejoin if we have a room code
  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = params.get('sala') || params.get('room');
  if (codeFromUrl && state.playerName && state.roomCode) {
    socket.emit('join_room', { roomCode: state.roomCode, playerName: state.playerName });
  }
});

socket.on('room_created', ({ code }) => {
  state.roomCode = code;
});

socket.on('room_joined', ({ code }) => {
  state.roomCode = code;
});

socket.on('game_state', (gs) => {
  handleGameState(gs);
});

socket.on('error', ({ message }) => {
  showToast(message, 'error');
});

socket.on('disconnect', () => {
  showToast('Conexión perdida. Reconectando...', 'error');
});

socket.on('reconnect', () => {
  showToast('Reconectado', 'success');
  if (state.roomCode && state.playerName) {
    socket.emit('join_room', { roomCode: state.roomCode, playerName: state.playerName });
  }
});

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkURLForRoom();

  // Enter key support
  document.getElementById('host-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') createRoom();
  });
  document.getElementById('join-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') joinRoom();
  });
  document.getElementById('join-code').addEventListener('keydown', e => {
    if (e.key === 'Enter') joinRoom();
  });
  document.getElementById('join-code').addEventListener('input', e => {
    e.target.value = e.target.value.toUpperCase();
  });
});
