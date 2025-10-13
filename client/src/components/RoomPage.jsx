import React, { useEffect, useState } from "react";
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
  const myVideoRef = React.useRef(null);
  const peersRef = React.useRef({});

  useEffect(() => {
    // Create a new socket instance when component mounts
    const socket = io("https://hangout-mates.onrender.com", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket.id);
    });

    // Receive updated participant list
    socket.on("room-data", (data) => {
      console.log("📡 Room data received:", data);
      setParticipants(data.participants);
    });

    // Someone else joined
    socket.on("user-joined", (data) => {
      console.log("👥 Someone joined:", data);
    });
    
   
    
    return () => {
      socket.disconnect();
      console.log("❌ Disconnected socket");
    };
  }, []); // run once when component mounts

  const joinRoom = () => {
    if (!userName.trim()) return alert("Enter your name first!");

    // Create socket inside joinRoom to ensure it's connected when we emit
    const socket = io("https://hangout-mates.onrender.com", {
      transports: ["websocket"],
    });

    socket.emit("join-room", { roomId, userName });

    // ✅ Get user’s camera/mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        

        // When someone joins, start a peer connection
        socket.on("user-joined", ({ userId }) => {
          const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
          });

          // Send your signal data to the new user
          peer.on("signal", (signalData) => {
            socket.emit("signal", { roomId, signalData, targetId: userId });
          });

          // Add remote stream when received
          peer.on("stream", (remoteStream) => {
            setRemoteStreams((prev) => [...prev, remoteStream]);
          });

          peersRef.current[userId] = peer;
        });

        // When someone sends signal data to you
        socket.on("signal", ({ signalData, targetId }) => {
          let peer = peersRef.current[targetId];
          if (!peer) {
            peer = new SimplePeer({ initiator: false, trickle: false, stream });
            peersRef.current[targetId] = peer;

            peer.on("signal", (signalData) => {
              socket.emit("signal", { roomId, signalData, targetId });
            });

            peer.on("stream", (remoteStream) => {
              setRemoteStreams((prev) => [...prev, remoteStream]);
            });
          }
          peer.signal(signalData);
        });
      })
      .catch((err) => console.error("Camera/Mic error:", err));

    socket.on("room-data", (data) => {
      setParticipants(data.participants);
    });

    setJoined(true);
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
        {remoteStreams.map((stream, index) => (
          <video
            key={index}
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
