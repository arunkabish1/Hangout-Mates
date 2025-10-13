
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ✅ Correct single Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",          
      "https://hangout-mates.vercel.app", 
    ],
    methods: ["GET", "POST"],
  },
});

const rooms = {};

// ✅ API route: create a new room
app.post("/api/rooms", (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 6);
  rooms[roomId] = { id: roomId, participants: [] };
  res.json({ roomId });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ User joins room
  socket.on("join-room", ({ roomId, userName }) => {
    console.log(`${userName} joined room ${roomId}`);

    socket.join(roomId);

    // Notify others
    socket.to(roomId).emit("user-joined", { userId: socket.id, userName });

    // Add participant to memory
    if (!rooms[roomId]) rooms[roomId] = { id: roomId, participants: [] };
    rooms[roomId].participants.push({ id: socket.id, name: userName });

    // ✅ WebRTC signaling relay
    socket.on("signal", ({ roomId, signalData, targetId }) => {
      io.to(targetId).emit("signal", { signalData, userId: socket.id });
    });

    // ✅ Update room data for everyone
    io.to(roomId).emit("room-data", {
      participants: rooms[roomId].participants,
    });
  });

  // ✅ When a user disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (!room) continue;

      const user = room.participants.find((p) => p.id === socket.id);
      if (user) {
        // Remove them
        room.participants = room.participants.filter((p) => p.id !== socket.id);

        // Notify remaining participants
        socket.to(roomId).emit("user-disconnected", { userId: socket.id });

        // Update room data
        io.to(roomId).emit("room-data", {
          participants: room.participants,
        });
      }
    }
  });
});

// ✅ Dynamic port for Render
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
