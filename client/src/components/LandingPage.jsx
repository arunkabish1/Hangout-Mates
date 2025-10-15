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
      alert("Please enter a valid referral code.");
      return;
    }
    navigate(`/room/${joinCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-100 via-white to-blue-100 flex flex-col">
      {/* Navbar */}
      <header className="flex justify-between items-center px-10 py-4 bg-white shadow-md">
        <h1 className="text-2xl font-bold text-green-600 tracking-wide">
          MakeMyTrip - <span className="text-blue-600">Career Portal</span>
        </h1>
        <nav className="flex gap-6 text-gray-700 font-medium">
          <button className="hover:text-green-600 transition">Home</button>
          <button className="hover:text-green-600 transition">Jobs</button>
          <button className="hover:text-green-600 transition">HR Login</button>
          <button className="hover:text-green-600 transition">Contact</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-6">
        <h2 className="text-4xl font-bold text-gray-800 mb-3">
          
          Your Next Career Starts Here 🚀
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Find your dream job or refer talented friends to top companies. Use your referral code to get started.
        </p>

        {/* Card Section */}
        <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-lg border border-gray-100">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Enter Your Referral Code
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter referral code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-green-400 outline-none"
            />
            <button
              onClick={joinroom}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Optional Hidden Button (for testing backend) */}
        <button
          onClick={createRoom}
          className="hidden bg-blue-500 text-white mt-6 px-5 py-2 rounded-md"
        >
          Create Room (Hidden)
        </button>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-white shadow-inner text-center text-gray-500 text-sm">
        © 2025 JobMates.com | Designed for Job Seekers & HR Professionals
      </footer>
    </div>
  );
};

export default LandingPage;
