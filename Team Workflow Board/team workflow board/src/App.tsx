import React from "react";
import { TaskProvider } from "./context/TaskContext";
import { Board } from "./components/Board";
import "./App.css";

function App() {
  return (
    <TaskProvider>
      <Board />
    </TaskProvider>
  );
}

export default App;
