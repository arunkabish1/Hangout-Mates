import React from "react";
import LandingPage from "./components/LandingPage";
import { Route, Routes } from "react-router-dom";
import RoomPage from "./components/RoomPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
    </Routes>
  );
};

export default App;
