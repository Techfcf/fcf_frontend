// src/App.jsx
import React from "react";
import { AuthProvider } from "./context/AuthContext"; // Confirm yeh path sahi hai
import AppRoutes from "./Routes/AppRoutes";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <AppRoutes />  {/* Direct render karo */}
      </div>
    </AuthProvider>
  );
}

export default App;