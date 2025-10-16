import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import SimplePeer from "simple-peer";
import ChatBox from "./ChatBox";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, X } from "lucide-react";

const RoomPage = () => {
  const { roomId } = useParams();
  const [participants, setParticipants] = useState([]);
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const [myStream, setMyStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const myVideoRef = useRef(null);
  const peersRef = useRef({});
  const socketRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // ✅ Connect socket once
  useEffect(() => {
    const socket = io("https://hangout-mates.onrender.com", {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Connected:", socket.id));

    socket.on("room-data", (data) => {
      setParticipants(data.participants || []);
    });

    return () => socket.disconnect();
  }, []);

  // ✅ Start camera for preview
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMyStream(stream);
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera/Mic error:", err);
        alert("Please allow camera/mic access!");
      }
    };
    startCamera();
  }, []);

  // ✅ Re-attach stream after re-render
  useEffect(() => {
    if (myVideoRef.current && myStream) {
      myVideoRef.current.srcObject = myStream;
    }
  }, [myStream, joined]);

  const joinRoom = async () => {
    if (!userName.trim()) return alert("Enter your name first!");
    const socket = socketRef.current;
    socket.emit("join-room", { roomId, userName });

    const stream = myStream;
    if (!stream) return alert("Camera not ready!");

    // WebRTC Peering
    socket.on("user-joined", ({ userId, name }) => {
      const peer = new SimplePeer({ initiator: true, trickle: false, stream });
      peer.on("signal", (signalData) =>
        socket.emit("signal", { roomId, signalData, targetId: userId })
      );
      peer.on("stream", (remoteStream) =>
        setRemoteStreams((prev) => [...prev, { stream: remoteStream, name }])
      );
      peersRef.current[userId] = peer;
    });

    socket.on("signal", ({ signalData, targetId, name }) => {
      let peer = peersRef.current[targetId];
      if (!peer) {
        peer = new SimplePeer({ initiator: false, trickle: false, stream });
        peersRef.current[targetId] = peer;

        peer.on("signal", (signalData) =>
          socket.emit("signal", { roomId, signalData, targetId })
        );
        peer.on("stream", (remoteStream) =>
          setRemoteStreams((prev) => [...prev, { stream: remoteStream, name }])
        );
      }
      peer.signal(signalData);
    });

    setJoined(true);
  };

  const toggleMic = () => {
    if (myStream) {
      myStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
      setMicOn(!micOn);
    }
  };

  const toggleCam = () => {
    if (myStream) {
      myStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
      setCamOn(!camOn);
    }
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert("Copied to clipboard!"))
      .catch(() => alert("Failed to copy link."));
  };

  const leaveRoom = () => {
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    if (myStream) myStream.getTracks().forEach((t) => t.stop());
    window.location.href = "/";
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white shadow-md rounded-xl p-6 sm:p-8 w-80 sm:w-96 text-center">
          <h1 className="text-2xl font-bold mb-3 text-gray-800">Join Meeting</h1>
          <p className="text-gray-600 mb-3">Room ID: {roomId}</p>

          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-44 bg-black rounded-lg mb-3 object-cover"
          ></video>

          <div className="flex justify-center gap-4 mb-3">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full ${micOn ? "bg-gray-200" : "bg-red-400 text-white"}`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={toggleCam}
              className={`p-3 rounded-full ${camOn ? "bg-gray-200" : "bg-red-400 text-white"}`}
            >
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          </div>

          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="border p-2 rounded-md w-full mb-3 outline-none"
          />
          <button
            onClick={joinRoom}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-md"
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white relative">

      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center px-4 sm:px-6 py-2 bg-gray-800 shadow relative">
        <h1 className="font-semibold text-sm sm:text-lg mb-2 sm:mb-0">
          🎥 Hangout Room — <span className="text-green-400">{roomId}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm"
          >
            Share Link
          </button>
          {/* <button
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs sm:text-sm"
          >
            💬 Chat
          </button> */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs sm:text-sm"
          >
            <Users size={16} />
            <span>{participants.length}</span>
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <ChatBox
        socket={socketRef.current}
        userName={userName}
        showChat={showChat}
        setShowChat={setShowChat}
      />

      {/* Participants Sidebar */}
      {showParticipants && (
        <div className="fixed top-0 right-0 h-full w-64 sm:w-72 bg-gray-800 shadow-lg border-l border-gray-700 p-4 z-20 animate-slideIn overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Participants</h2>
            <button onClick={() => setShowParticipants(false)} className="text-gray-300">✖</button>
          </div>
          <ul className="space-y-2">
            {participants.length === 0 ? (
              <p className="text-gray-400 text-sm">No one else joined yet</p>
            ) : (
              participants.map((p, i) => (
                <li key={i} className="p-2 bg-gray-700 rounded-md text-sm text-gray-100">
                  {p.name === userName ? `${p.name} (You)` : p.name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Video Grid */}
      <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4">
        {/* My Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden shadow-md aspect-video">
          <video
            ref={myVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          ></video>
          <div className="absolute bottom-2 left-2 text-xs sm:text-sm text-gray-200 bg-gray-700 px-1 sm:px-2 py-0.5 rounded-md">
            You ({userName})
          </div>
        </div>

        {/* Remote Participants */}
        {remoteStreams.map(({ stream, name }, index) => (
          <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden shadow-md aspect-video">
            <video
              autoPlay
              playsInline
              ref={(ref) => { if (ref) ref.srcObject = stream; }}
              className="w-full h-full object-cover"
            ></video>
            <div className="absolute bottom-2 left-2 text-xs sm:text-sm text-gray-200 bg-gray-700 px-1 sm:px-2 py-0.5 rounded-md">
              {name || participants[index]?.name}
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-800 py-3 px-2 sm:px-4 flex justify-center gap-3 sm:gap-6 border-t border-gray-700 flex-wrap">
        <button
          onClick={toggleMic}
          className={`p-2 sm:p-3 rounded-full ${micOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600"}`}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          onClick={toggleCam}
          className={`p-2 sm:p-3 rounded-full ${camOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600"}`}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          onClick={leaveRoom}
          className="p-2 sm:p-3 rounded-full bg-red-700 hover:bg-red-800"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
};

export default RoomPage;
