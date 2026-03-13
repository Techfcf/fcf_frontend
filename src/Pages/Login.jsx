import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Style/Login.css";
import { loginUser } from "../api/LoginApi";
import { useAuth } from "../context/AuthContext";

export default function Login({ projectData, onClose }) {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await loginUser(email, password);

      if (!res?.success) {
        setError(res?.message || "Invalid credentials");
        return;
      }

      refreshAuth();

      const redirectPath = localStorage.getItem("redirectAfterLogin") || "/dashboard";
      localStorage.removeItem("redirectAfterLogin");

      navigate(redirectPath, {
        state: projectData || null,
        replace: true,
      });

      if (onClose) onClose();
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page-wrapper ${onClose ? 'is-modal' : ''}`}>
      {/* Background video for standalone page */}
      {!onClose && (
        <>
          <video className="login-bg-video" autoPlay loop muted playsInline>
            <source src="/img/background.mp4" type="video/mp4" />
          </video>
          <div className="login-bg-overlay" />
        </>
      )}

      <div className="login-overlay">
        <div className="login-card animate-pop">
          <img src="/img/logo.png" alt="FIT Climate" className="login-logo" />

          <h2>Welcome Back</h2>
          
          {projectData?.projectName ? (
            <p className="login-project">
              Sign in to access <b>{projectData.projectName}</b>
            </p>
          ) : (
            <p className="login-project">Sign in to access your dashboard</p>
          )}

          <div className="login-input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div className="login-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit-btn" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {onClose ? (
            <button className="login-cancel-btn" onClick={onClose}>
              Cancel
            </button>
          ) : (
            <button className="login-cancel-btn" onClick={() => navigate('/')}>
              ← Back to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
