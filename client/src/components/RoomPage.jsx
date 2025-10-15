import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";

const RoomPage = () => {
  const { roomId } = useParams();
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [capturing, setCapturing] = useState(false);

  const myVideoRef = useRef(null);
  const peersRef = useRef({});
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("https://hangout-mates.onrender.com", {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () =>
      console.log("✅ Connected:", socketRef.current.id)
    );

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const joinRoom = () => {
    if (!userName.trim()) return alert("Please enter your name first!");

    const socket = socketRef.current;
    socket.emit("join-room", { roomId, userName });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        setJoined(true);

        // Handle when someone joins
        socket.on("user-joined", ({ userId }) => {
          const peer = new SimplePeer({
            initiator: true,
            trickle: false,
            stream,
          });

          peer.on("signal", (signalData) => {
            socket.emit("signal", { roomId, signalData, targetId: userId });
          });

          peer.on("stream", (remoteStream) => {
            setRemoteStreams((prev) => {
              if (!prev.find((s) => s.id === remoteStream.id)) {
                return [...prev, remoteStream];
              }
              return prev;
            });
          });

          peersRef.current[userId] = peer;
        });

        // Handle incoming signals
        socket.on("signal", ({ signalData, targetId }) => {
          let peer = peersRef.current[targetId];
          if (!peer) {
            peer = new SimplePeer({ initiator: false, trickle: false, stream });
            peersRef.current[targetId] = peer;

            peer.on("signal", (signalData) => {
              socket.emit("signal", { roomId, signalData, targetId });
            });

            peer.on("stream", (remoteStream) => {
              setRemoteStreams((prev) => {
                if (!prev.find((s) => s.id === remoteStream.id)) {
                  return [...prev, remoteStream];
                }
                return prev;
              });
            });
          }
          peer.signal(signalData);
        });
      })
      .catch((err) => console.error("Camera/Mic error:", err));
  };

  // =============================
  // BEFORE JOIN (Enter Name)
  // =============================
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-white to-blue-100 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-green-700">
            JobMates<span className="text-blue-600">.com</span>
          </h1>
          <p className="text-gray-600 mt-2 text-sm">
            Room ID: <span className="font-semibold">{roomId}</span>
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl p-8 w-96 border border-gray-100 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Identity Verification
          </h2>
          <p className="text-gray-500 mb-6 text-sm">
            Please enter your name to begin the face verification process.
          </p>

          <input
            type="text"
            placeholder="Enter your full name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-md mb-4 focus:ring-2 focus:ring-green-400 outline-none"
          />

          <button
            onClick={joinRoom}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-medium transition"
          >
            Begin Verification
          </button>
        </div>

        <p className="text-gray-400 text-sm mt-8">
          © 2025 JobMates.com | Verification System
        </p>
      </div>
    );
  }

  // =============================
  // AFTER JOIN (Capture + Peers)
  // =============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Facial Verification Process
      </h1>
      <p className="text-gray-600 mb-6 text-center">
        Hi <span className="font-semibold text-green-700">{userName}</span>, please keep your head still
        and face the camera directly while we verify your photo.
      </p>

      {/* --- My Video Capture Area --- */}
      <div className="relative mb-8">
        <video
          ref={myVideoRef}
          autoPlay
          playsInline
          muted
          className="w-80 h-60 rounded-2xl border-4 border-green-400 shadow-xl object-cover"
        ></video>

        {/* Grid Overlay */}
        <div className="absolute inset-0 border border-dashed border-green-600 rounded-2xl pointer-events-none"></div>

        {/* Fake Capture Overlay */}
        {capturing && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
            <p className="text-white font-semibold text-lg animate-pulse">
              Capturing Photo... Please Hold Still
            </p>
          </div>
        )}
      </div>

      {/* Fake Capture Button */}
      <button
        onClick={() => {
          setCapturing(true);
          setTimeout(() => {
            setCapturing(false);
            alert("✅ Photo captured successfully! (Just kidding 😆)");
          }, 3000);
        }}
        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-md transition"
      >
        Capture Photo
      </button>

      {/* --- Participants Section --- */}
      {remoteStreams.length > 0 && (
        <div className="mt-10 w-full flex flex-col items-center">
          <h2 className="text-gray-700 font-semibold text-lg mb-3">
            Other Participants
          </h2>
          <div className="flex gap-4 flex-wrap justify-center">
            {remoteStreams.map((stream, i) => (
              <video
                key={i}
                autoPlay
                playsInline
                ref={(ref) => ref && (ref.srcObject = stream)}
                className="w-64 h-44 rounded-xl border-2 border-blue-400 shadow-lg"
              ></video>
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-500 text-sm mt-10">
        Powered by JobMates | AI Verification Portal
      </p>
    </div>
  );
};

export default RoomPage;
