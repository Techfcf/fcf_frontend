// src/config.js

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const API_BASE_URL = isLocalhost 
  ? "http://localhost:5002" 
  : "https://mrv-backend-13977221722.asia-south1.run.app";
