import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");

  const createRoom = async () => {
    try {
      const res = await fetch("https://hangout-mates.onrender.com/api/rooms", {
        method: "POST",
      });
      const data = await res.json();
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      alert("Server error! Please try again later.");
    }
  };

  const joinroom = async () => {
    if (!joinCode.trim()) {
      alert("Please enter a valid room code.");
      return;
    }
    navigate(`/room/${joinCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50">
      {" "}
      <h1 className="text-3xl font-bold mb-6">🎥 Hangout Mates</h1>{" "}
      <div className="flex gap-3">
        <button
          onClick={createRoom}
          className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg shadow"
        >
          Create Room
        </button>{" "}
        <input
          type="text"
          placeholder="Enter room code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="border p-2 rounded-md"
        />{" "}
        <button
          onClick={joinroom}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg shadow"
        >
          {" "}
          Join Room{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
};


export default LandingPage;
