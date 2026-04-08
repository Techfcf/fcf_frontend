// src/config.js

const isLocalhost = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

export const API_BASE_URL = isLocalhost
  ? "https://mrv-backend-13977221722.asia-south1.run.app"
  : "https://mrv-backend-13977221722.asia-south1.run.app";
