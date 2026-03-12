const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(express.static(path.join(__dirname, 'public')));

// ── Card Decks ──────────────────────────────────────────────────────────────
const BLACK_CARDS = [
  "La nueva pareja del Bailando: __________ y __________.",
  "Mi viejo siempre decía: 'En la mesa no se habla de política ni de __________'.",
  "Qué ganas de hacer un trío con __________ y __________.",
  "Solo dos cosas pueden lastimar a Superman: la kryptonita y __________.",
  "El piropo más raro que me dijeron: 'Quisiera ser __________ para __________ con vos'.",
  "¿Quién estuvo detrás del atentado a la AMIA? __________.",
  "En mi velorio quiero que pasen __________ de fondo.",
  "El médico me dijo que tengo __________ y que me quedan 3 meses de vida.",
  "El nuevo gobierno propone reemplazar los sueldos con __________.",
  "Mi terapeuta dice que mi problema es que no puedo dejar de pensar en __________.",
  "La NASA descubrió que en Marte hay vida, y exactamente se parece a __________.",
  "¿Cuál es el secreto de una relación larga? __________ y mucho __________.",
  "El nuevo hit del verano: 'Dame __________ como si fuera __________'.",
  "Me desperté en el hospital y lo primero que vi fue __________.",
  "El próximo reality show: 'Sobrevivientes de __________'.",
  "Si pudiera patentar algo, sería __________.",
  "La crisis económica se soluciona con __________ y __________.",
  "Mi abuela antes de morir me regaló __________ y me dijo '__________'.",
  "La UNESCO declaró patrimonio cultural inmaterial a __________.",
  "Cuando llegué tarde al trabajo inventé que __________.",
  "El último deseo de __________ fue morir rodeado de __________.",
  "El nuevo ingrediente secreto del McDonalds resulta ser __________.",
  "A los 80 años quiero que me encuentren __________ con __________.",
  "La nueva terapia de moda consiste en __________ durante 30 minutos al día.",
  "En Tinder me matcheé con alguien que tenía como foto de perfil __________.",
];

const WHITE_CARDS = [
  "Parir en el auto",
  "Preguntarle si está por acabar",
  "Auschwitz",
  "Lágrimas de semen",
  "Tu situación laboral",
  "Una verga más ancha que larga",
  "Orgasmos múltiples",
  "La tira de cola",
  "El negro pijudo del WhatsApp",
  "El carnaval carioca",
  "El trabajo esclavo",
  "Mi ex llorando en el baño",
  "Una fuga de gas en el colectivo",
  "El olor a pies de un amigo",
  "Comer asado sin servilleta",
  "Meter los pies en una pileta fría",
  "Una rata en el subte",
  "Pegarse un pedo en el ascensor",
  "Olvidarse el nombre en pleno sexo",
  "Tu vecina de 70 en bikini",
  "Milanesas de soja",
  "Un cura en cuero",
  "El médico de guardia a las 3am",
  "Nuestros representantes en el Congreso",
  "Un asado sin pan",
  "La resaca del domingo",
  "El boleto de colectivo cortado",
  "Un selfie en un velorio",
  "Choripán con mostaza en los pantalones",
  "El delivery que llegó frío",
  "La cuota del gimnasio que no uso",
  "Trepar un semáforo borracho",
  "Un beso con olor a malbec",
  "Hacerse la paja con wifi ajeno",
  "Hablar con la ex a las 4am",
  "Un perro con corona de flores",
  "Correr el colectivo con ojotas",
  "Llorar viendo Intensamente",
  "Hacerse el dormido en el subte",
  "Dar el número falso en el boliche",
  "La cara de tu jefe cuando llegás tarde",
  "Mandar un audio de 10 minutos",
  "Quedarse sin batería en el remis",
  "Cagar en un baño ajeno",
  "Una torta de cumpleaños con velas de cera en el bizcochuelo",
  "Morirse ahogado en una pileta inflable",
  "Salir en el Zoom en cuero",
  "Confundir el chat del trabajo con el de la novia",
  "Perder los documentos en carnaval",
  "Casarse con la prima segunda",
  "La deuda externa",
  "Los jubilados",
  "El dólar blue",
  "La inflación del 200%",
  "El FMI",
  "Milei en tanga",
  "Cristina bailando cumbia",
  "El Gordo Dan sin filtro",
  "Susana Giménez fumando un faso",
  "Tinelli llorando en vivo",
  "Moria Casán en misa",
  "Nazarena Vélez sin maquillaje",
  "Marcelo Gallardo desnudo en la ducha",
  "Tevez comiendo milanesas",
  "Lio Messi cagando",
  "El Diego resucitado",
  "Tu jefe haciendo OnlyFans",
  "El plomero que nunca viene",
  "La psicóloga que llora más que vos",
  "El médico que te atiende con el celu",
  "El contador que se robó todo",
  "La maestra de tercer grado que olía raro",
  "El vecino que escucha cumbia a las 3am",
  "La señora que ocupa dos asientos",
  "El tipo que no se bañó en el colectivo",
  "La piba que llora en el avión",
  "El pibe que le manda audio al grupo del trabajo",
  "Mi abuela mirando TikTok",
  "Un cura haciendo TikTok",
  "Un abogado honesto",
  "Un político que no roba",
  "Un influencer con talento real",
  "Un vegano callado",
  "Un hincha de fútbol pacífico",
  "Un periodista objetivo",
  "Un taxista que no opina",
  "Un médico que explica bien",
  "Un mecánico que no estafa",
  "Un kiosquero amable",
  "Llorarte encima en el boliche",
  "Dormirte en el casamiento ajeno",
  "Vomitar en un Uber",
  "Confundir a tu suegra con tu mamá",
  "Tirar un pedo justo antes del silencio",
  "Mandarse una paja con el mouse del trabajo",
  "Llorar en el baño de la oficina",
  "Insultar al árbitro frente a tu hijo",
  "Contarle tu trauma al delivery",
  "Hablar solo en el supermercado",
  "Mear en el jardín del vecino",
  "Googlear síntomas a las 2am",
  "Mirar el celu en el velorio",
  "Hacer zapping durante el sexo",
  "Llamar a tu pareja con el nombre del ex",
];

// ── Room State ───────────────────────────────────────────────────────────────
const rooms = {};

function generateRoomCode() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function countBlanks(text) {
  return (text.match(/__________/g) || []).length;
}

function createRoom(hostId, hostName, targetScore) {
  const code = generateRoomCode();
  rooms[code] = {
    code,
    phase: 'lobby',
    hostId,
    players: [{ id: hostId, name: hostName, score: 0, hand: [], isJudge: false }],
    blackDeck: shuffle(BLACK_CARDS),
    whiteDeck: shuffle(WHITE_CARDS),
    currentBlackCard: null,
    submissions: [],
    shuffledSubmissions: [],
    roundWinner: null,
    targetScore: targetScore || 7,
    judgeIndex: 0,
    roundNumber: 0,
    disconnectedPlayers: {},
  };
  return code;
}

function getRoom(code) {
  return rooms[code] || null;
}

function dealCards(room) {
  room.players.forEach(p => {
    while (p.hand.length < 10) {
      if (room.whiteDeck.length === 0) {
        room.whiteDeck = shuffle(WHITE_CARDS);
      }
      p.hand.push(room.whiteDeck.pop());
    }
  });
}

function startRound(room) {
  room.phase = 'playing';
  room.submissions = [];
  room.shuffledSubmissions = [];
  room.roundWinner = null;
  room.roundNumber += 1;

  // Rotate judge
  const activePlayers = room.players;
  room.judgeIndex = (room.judgeIndex) % activePlayers.length;
  activePlayers.forEach((p, i) => { p.isJudge = (i === room.judgeIndex); });

  // Draw black card
  if (room.blackDeck.length === 0) {
    room.blackDeck = shuffle(BLACK_CARDS);
  }
  const cardText = room.blackDeck.pop();
  room.currentBlackCard = { text: cardText, blanks: countBlanks(cardText) };

  dealCards(room);
}

function getStateForPlayer(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  const others = room.players.map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    isJudge: p.isJudge,
    isHost: p.id === room.hostId,
    hasSubmitted: room.submissions.some(s => s.playerId === p.id),
  }));

  const base = {
    code: room.code,
    phase: room.phase,
    players: others,
    currentBlackCard: room.currentBlackCard,
    targetScore: room.targetScore,
    roundNumber: room.roundNumber,
    playerId,
    isHost: playerId === room.hostId,
    isJudge: player ? player.isJudge : false,
    hand: player ? player.hand : [],
    submissionsCount: room.submissions.length,
    totalPlayers: room.players.length,
  };

  // Reveal shuffled submissions only in judging/round_result
  if (room.phase === 'judging' || room.phase === 'round_result') {
    base.shuffledSubmissions = room.shuffledSubmissions;
  }

  if (room.phase === 'round_result') {
    base.roundWinner = room.roundWinner;
  }

  if (room.phase === 'game_over') {
    base.roundWinner = room.roundWinner;
    base.winner = room.players.reduce((a, b) => a.score > b.score ? a : b);
    base.finalRanking = [...room.players].sort((a, b) => b.score - a.score).map(p => ({
      name: p.name, score: p.score
    }));
  }

  return base;
}

function broadcastState(room) {
  room.players.forEach(p => {
    const socket = io.sockets.sockets.get(p.id);
    if (socket) {
      socket.emit('game_state', getStateForPlayer(room, p.id));
    }
  });
}

// ── Socket Events ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('create_room', ({ playerName, targetScore }) => {
    if (!playerName || !playerName.trim()) {
      return socket.emit('error', { message: 'Nombre inválido' });
    }
    const code = createRoom(socket.id, playerName.trim(), targetScore);
    socket.join(code);
    socket.emit('room_created', { code });
    broadcastState(rooms[code]);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const room = getRoom(roomCode);
    if (!room) {
      return socket.emit('error', { message: 'Sala no encontrada' });
    }
    if (room.phase !== 'lobby') {
      // Allow reconnect
      const disconnected = room.disconnectedPlayers[playerName];
      if (disconnected) {
        const player = room.players.find(p => p.name === playerName);
        if (player) {
          const oldId = player.id;
          player.id = socket.id;
          if (room.hostId === oldId) room.hostId = socket.id;
          delete room.disconnectedPlayers[playerName];
          socket.join(roomCode);
          socket.emit('room_joined', { code: roomCode });
          broadcastState(room);
          return;
        }
      }
      return socket.emit('error', { message: 'La partida ya comenzó' });
    }
    if (room.players.length >= 8) {
      return socket.emit('error', { message: 'La sala está llena (máximo 8)' });
    }
    if (room.players.find(p => p.name === playerName.trim())) {
      return socket.emit('error', { message: 'Ese nombre ya está en uso' });
    }
    room.players.push({ id: socket.id, name: playerName.trim(), score: 0, hand: [], isJudge: false });
    socket.join(roomCode);
    socket.emit('room_joined', { code: roomCode });
    broadcastState(room);
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < 2) {
      return socket.emit('error', { message: 'Se necesitan al menos 2 jugadores' });
    }
    startRound(room);
    broadcastState(room);
  });

  socket.on('submit_cards', ({ roomCode, cards }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'playing') return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.isJudge) return;
    if (room.submissions.find(s => s.playerId === socket.id)) return;

    const blanks = room.currentBlackCard.blanks;
    if (!Array.isArray(cards) || cards.length !== blanks) {
      return socket.emit('error', { message: `Debes enviar exactamente ${blanks} carta(s)` });
    }

    // Validate cards are in hand
    for (const card of cards) {
      if (!player.hand.includes(card)) {
        return socket.emit('error', { message: 'Carta inválida' });
      }
    }

    // Remove cards from hand
    cards.forEach(card => {
      const idx = player.hand.indexOf(card);
      if (idx !== -1) player.hand.splice(idx, 1);
    });

    room.submissions.push({ playerId: socket.id, playerName: player.name, cards });

    // Check if all non-judge players submitted
    const nonJudge = room.players.filter(p => !p.isJudge);
    if (room.submissions.length >= nonJudge.length) {
      // Shuffle submissions anonymously
      room.shuffledSubmissions = shuffle(
        room.submissions.map((s, i) => ({ id: i, cards: s.cards }))
      );
      room.phase = 'judging';
    }

    broadcastState(room);
  });

  socket.on('judge_pick', ({ roomCode, submissionId }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'judging') return;

    const judge = room.players.find(p => p.id === socket.id);
    if (!judge || !judge.isJudge) return;

    const submission = room.shuffledSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    // Find real submission
    const realSub = room.submissions[submission.id];
    const winner = room.players.find(p => p.id === realSub.playerId);
    if (!winner) return;

    winner.score += 1;
    room.roundWinner = { playerName: winner.name, cards: realSub.cards };
    room.phase = 'round_result';

    // Check winner
    if (winner.score >= room.targetScore) {
      room.phase = 'game_over';
    }

    broadcastState(room);

    // Advance judge index for next round
    room.judgeIndex = (room.judgeIndex + 1) % room.players.length;
  });

  socket.on('next_round', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'round_result') return;
    if (room.hostId !== socket.id) return;
    startRound(room);
    broadcastState(room);
  });

  socket.on('restart_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.phase = 'lobby';
    room.players.forEach(p => { p.score = 0; p.hand = []; p.isJudge = false; });
    room.blackDeck = shuffle(BLACK_CARDS);
    room.whiteDeck = shuffle(WHITE_CARDS);
    room.currentBlackCard = null;
    room.submissions = [];
    room.shuffledSubmissions = [];
    room.roundWinner = null;
    room.roundNumber = 0;
    room.judgeIndex = 0;
    broadcastState(room);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    for (const code in rooms) {
      const room = rooms[code];
      const player = room.players.find(p => p.id === socket.id);
      if (!player) continue;

      if (room.phase === 'lobby') {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.hostId === socket.id && room.players.length > 0) {
          room.hostId = room.players[0].id;
        }
        if (room.players.length === 0) {
          delete rooms[code];
        } else {
          broadcastState(room);
        }
      } else {
        // Mark as disconnected but keep in game
        room.disconnectedPlayers[player.name] = socket.id;
        // If game still going, try to handle
        broadcastState(room);
      }
      break;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🃏 HDP Cartas corriendo en http://localhost:${PORT}`);
});
