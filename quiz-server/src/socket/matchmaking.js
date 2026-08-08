// In-memory matchmaking queues and rooms
const queues = new Map(); // subject → [{ socketId, userId, userName, userPicture, joinedAt }]
const rooms = new Map(); // roomCode → { subject, host, matchId, status }

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function joinQueue(socket, subject) {
  if (!queues.has(subject)) {
    queues.set(subject, []);
  }

  // Remove from any existing queue first
  leaveAllQueues(socket.id);

  const player = {
    socketId: socket.id,
    userId: socket.user.id,
    userName: socket.user.name,
    userPicture: socket.user.picture || null,
    joinedAt: Date.now(),
  };

  queues.get(subject).push(player);
  socket.join(`queue:${subject}`);

  return queues.get(subject).length;
}

export function leaveAllQueues(socketId) {
  for (const [subject, queue] of queues) {
    const idx = queue.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      queue.splice(idx, 1);
      if (queue.length === 0) {
        queues.delete(subject);
      }
    }
  }
}

export function findMatch(subject) {
  const queue = queues.get(subject);
  if (!queue || queue.length < 2) return null;

  // Take first two players (FIFO)
  const player1 = queue.shift();
  const player2 = queue.shift();

  if (queue.length === 0) {
    queues.delete(subject);
  }

  return [player1, player2];
}

export function createRoom(socket, subject) {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const room = {
    subject,
    host: {
      socketId: socket.id,
      userId: socket.user.id,
      userName: socket.user.name,
      userPicture: socket.user.picture || null,
    },
    guest: null,
    matchId: null,
    status: 'waiting',
  };

  rooms.set(code, room);
  socket.join(`room:${code}`);

  return code;
}

export function joinRoom(socket, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.guest) return { error: 'Room is full' };

  room.guest = {
    socketId: socket.id,
    userId: socket.user.id,
    userName: socket.user.name,
    userPicture: socket.user.picture || null,
  };

  socket.join(`room:${roomCode}`);

  return { room };
}

export function getRoom(roomCode) {
  return rooms.get(roomCode);
}

export function setRoomMatchId(roomCode, matchId) {
  const room = rooms.get(roomCode);
  if (room) room.matchId = matchId;
}

export function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

export function getQueueSize(subject) {
  return queues.get(subject)?.length || 0;
}