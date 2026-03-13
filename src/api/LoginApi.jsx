// src/api/LoginApi.jsx
import { setAuthData } from "../Auth/authService";

const API_URL =
  "https://module1-survey-backend-13977221722.asia-south1.run.app/api/auth/login";

export const loginUser = async (email, password) => {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (!data.token) {
      throw new Error("Token missing from response");
    }

    setAuthData(data.token, data.user);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Something went wrong",
    };
  }
};
