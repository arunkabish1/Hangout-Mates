import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LandingPage = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [roomLink, setRoomLink] = useState("");

  const createRoom = async () => {
    try {
      const res = await fetch("https://hangout-mates-1.onrender.com/api/rooms", {
  method: "POST",
});

      const data = await res.json();
      setRoomLink(data.roomLink);
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
      alert("Server error! Please try again later.");
    }
  };

  const joinRoom = () => {
    if (!joinCode.trim()) {
      alert("Please enter a valid room code.");
      return;
    }
    navigate(`/room/${joinCode}`);
  };

  const copyLink = async () => {
    if (roomLink) {
      await navigator.clipboard.writeText(roomLink);
      alert("✅ Room link copied!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="w-full px-8 py-4 flex justify-between items-center bg-white shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-800">
          <span className="text-green-600">Hangout</span> Mates
        </h1>
        <button className="px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition">
          Sign In
        </button>
      </header>

      {/* Main Section */}
      <main className="flex flex-col-reverse md:flex-row items-center justify-center flex-grow px-8 md:px-16">
        {/* Left Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl text-center md:text-left mt-10 md:mt-0"
        >
          <h2 className="md:text-5xl text-2xl font-mono font-semibold text-gray-800 leading-tight mb-4">
            Premium video meetings.
            <br />
            Now available for everyone.
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Create a new meeting and invite friends to join instantly — no
            downloads, no hassle.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={createRoom}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg shadow-md transition text-lg"
            >
              New Meeting
            </button>

            <div className="flex items-center border rounded-lg overflow-hidden shadow-sm">
              <input
                type="text"
                placeholder="Enter code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="p-3 outline-none text-gray-700 w-40"
              />
              <button
                onClick={joinRoom}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 transition"
              >
                Join
              </button>
            </div>
          </div>

          {roomLink && (
            <div className="mt-6">
              <p className="text-sm text-gray-700 mb-2">
                Share this meeting link:
              </p>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={roomLink}
                  className="border rounded-md px-3 py-2 w-80 text-gray-700 text-sm"
                />
                <button
                  onClick={copyLink}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="flex justify-center md:justify-end w-full md:w-1/2"
        >
          <img
            src="https://jreyiv.github.io/frontend-mentor/noobie/meet-landing-page/assets/desktop/image-hero-left.png"
            alt="Video meeting illustration"
            className="md:w-[28rem] w-[18rem] md:max-w-full"
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-gray-500 text-sm text-center py-6 border-t bg-white">
        © {new Date().getFullYear()} Hangout Mates — Inspired by Google Meet
      </footer>
    </div>
  );
};

export default LandingPage;
