import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { TimeSlotSelector } from "./Test";
import { Agenda } from "./pages/Agenda";
import { Confirmacao } from "./pages/ScheduleConfirmation";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Agenda />} />
      <Route path="/confirmacao" element={<Confirmacao />} />
    </Routes>
  );
}

export default App;
