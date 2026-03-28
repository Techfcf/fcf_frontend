import { API_BASE_URL } from "../config";
import { setAuthData } from "../Auth/authService";

const API_URL = `${API_BASE_URL}/api/auth/login`;

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

export const registerUser = async (username, email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
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
