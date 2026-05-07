// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
// import "";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { TrackingProvider } from "./context/TrackingContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <TrackingProvider>
        <App />
      </TrackingProvider>
    </AuthProvider>
  </React.StrictMode>
);