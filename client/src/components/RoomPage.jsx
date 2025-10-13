import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";

const RoomPage = () => {
  const { roomId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);

  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const myVideoRef = useRef(null);
  const peersRef = useRef({});
  const socketRef = useRef(null);

  useEffect(() => {
    // ✅ Connect socket only once
    socketRef.current = io("https://hangout-mates.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to server:", socketRef.current.id);
    });

    socketRef.current.on("room-data", (data) => {
      console.log("📡 Room data received:", data);
      setParticipants(data.participants);
    });

    socketRef.current.on("user-disconnected", ({ userId }) => {
      console.log("❌ User disconnected:", userId);
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
      setRemoteStreams((prev) => prev.filter((v) => v.id !== userId));
    });

    return () => {
      socketRef.current.disconnect();
      console.log("🔌 Socket disconnected");
    };
  }, []);

  const joinRoom = async () => {
    if (!userName.trim()) return alert("Enter your name first!");

    const socket = socketRef.current;
    socket.emit("join-room", { roomId, userName });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;

      // When someone joins, start peer connection
      socket.on("user-joined", ({ userId }) => {
        console.log("👥 New user joined:", userId);
        const peer = createPeer(userId, stream);
        peersRef.current[userId] = peer;
      });

      // Handle incoming signal
      socket.on("signal", ({ signalData, targetId }) => {
        let peer = peersRef.current[targetId];
        if (!peer) {
          peer = addPeer(signalData, targetId, stream);
          peersRef.current[targetId] = peer;
        } else {
          peer.signal(signalData);
        }
      });
    } catch (err) {
      console.error("🎥 Camera/Mic error:", err);
    }

    setJoined(true);
  };

  // ✅ STUN + TURN config
  const iceConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "demo", // replace with your Metered username
        credential: "demo", // replace with your Metered credential
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "demo",
        credential: "demo",
      },
    ],
  };

  // ✅ Create Peer (initiator)
  const createPeer = (targetId, stream) => {
    const socket = socketRef.current;
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: iceConfig,
    });

    peer.on("signal", (signalData) => {
      socket.emit("signal", { roomId, signalData, targetId });
    });

    peer.on("stream", (remoteStream) => {
      console.log("📺 Received remote stream from:", targetId);
      setRemoteStreams((prev) => [
        ...prev,
        { id: targetId, stream: remoteStream },
      ]);
    });

    return peer;
  };

  // ✅ Add Peer (receiver)
  const addPeer = (incomingSignal, userId, stream) => {
    const socket = socketRef.current;
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
      config: iceConfig,
    });

    peer.on("signal", (signalData) => {
      socket.emit("signal", { roomId, signalData, targetId: userId });
    });

    peer.on("stream", (remoteStream) => {
      console.log("📺 Received remote stream from:", userId);
      setRemoteStreams((prev) => [
        ...prev,
        { id: userId, stream: remoteStream },
      ]);
    });

    peer.signal(incomingSignal);
    return peer;
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <h1 className="text-2xl font-bold mb-4">Room ID: {roomId}</h1>
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="border p-2 rounded-md mb-3"
        />
        <button
          onClick={joinRoom}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Join Room
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-green-50 p-4">
      <h1 className="text-2xl font-bold mb-4">🎥 Hangout Room: {roomId}</h1>
      <p className="mb-2 text-gray-600">You are logged in as {userName}</p>
      <h2 className="text-xl mb-2">Participants:</h2>

      {/* 🎥 Video Section */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {/* My Video */}
        <video
          ref={myVideoRef}
          autoPlay
          muted
          playsInline
          className="w-60 h-40 rounded-lg border-2 border-blue-500 shadow"
        ></video>

        {/* Remote Videos */}
        {remoteStreams.map(({ id, stream }) => (
          <video
            key={id}
            autoPlay
            playsInline
            ref={(ref) => {
              if (ref) ref.srcObject = stream;
            }}
            className="w-60 h-40 rounded-lg border-2 border-green-500 shadow"
          ></video>
        ))}
      </div>

      <ul>
        {participants.length === 0 ? (
          <p className="text-gray-500 italic">No one else here yet...</p>
        ) : (
          participants.map((p) => (
            <li key={p.id} className="text-gray-800">
              👤 {p.name}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default RoomPage;
