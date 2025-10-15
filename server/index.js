const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

// app.use(cors({
//   origin: ["https://your-frontend.onrender.com"],
// }));


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://hangout-mates-1.onrender.com",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

app.post("/api/rooms", (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 6);
  rooms[roomId] = { id: roomId, participants: [] };
  res.json({ roomId });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ When a user joins a room
  socket.on("join-room", ({ roomId, userName }) => {
    console.log(`${userName} joined room ${roomId}`);

    // Join socket.io room
    socket.join(roomId);

    // Notify others
    socket.to(roomId).emit("user-joined", { userId: socket.id, userName });

    // Store info
    if (!rooms[roomId]) rooms[roomId] = { id: roomId, participants: [] };
    rooms[roomId].participants.push({ id: socket.id, name: userName });

    // WebRTC signaling relay
    socket.on("signal", ({ roomId, signalData, targetId }) => {
  io.to(targetId).emit("signal", { signalData, targetId: socket.id });
});


    // Send updated participant list to all in room
    io.to(roomId).emit("room-data", {
      participants: rooms[roomId].participants,
    });
  });

  // ✅ Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      rooms[roomId].participants = rooms[roomId].participants.filter(
        (p) => p.id !== socket.id
      );


      io.to(roomId).emit("room-data", {
        participants: rooms[roomId].participants,
      });
    }
  });
});

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server 
    running on http://localhost:${PORT}`)
);