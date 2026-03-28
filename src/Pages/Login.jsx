import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Style/Login.css";
import { loginUser, registerUser } from "../api/LoginApi";
import { useAuth } from "../context/AuthContext";

export default function Login({ projectData, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const intendedRole = location.state?.intendedRole || projectData?.intendedRole;

  // Auto-fill based on intended role for demo purposes
  useEffect(() => {
    if (intendedRole === "admin") {
      setEmail("admin@fcfindia.in");
      setPassword("fcfindia@123");
    } else if (intendedRole === "project_manager") {
      setEmail("pm_nbs003@fcfindia.in"); // Demo default for PM
      setPassword("fcfindia@123");
    } else if (intendedRole === "client") {
      setEmail("client_nbs005@fcfindia.in"); // Demo default for Client
      setPassword("fcfindia@123");
    }
  }, [intendedRole]);

  const handleAction = async () => {
    if (!email || !password || (isSignup && !name)) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let res;
      if (isSignup) {
        res = await registerUser(name, email, password);
      } else {
        res = await loginUser(email, password);
      }

      if (!res?.success) {
        setError(res?.message || (isSignup ? "Registration failed" : "Invalid credentials"));
        return;
      }

      // ⭐ Read the logged-in user's actual role from localStorage (set by loginUser)
      const loggedInUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
      const actualRole = loggedInUser?.role;

      // ⭐ Role and Project enforcement (Skip for signups since they are natively clients)
      if (!isSignup) {
        if (intendedRole === "admin" && actualRole !== "admin") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setError("❌ Access Denied: Only Admin can access the full dashboard.");
          return;
        }
        if (intendedRole === "project_manager") {
          if (actualRole !== "project_manager") {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setError("❌ Access Denied: Only Project Managers can access project dashboards.");
            return;
          }

          // Match the user's assigned project with the clicked card
          const clickedProjectId = projectData?.projectCode || location.state?.projectCode;
          const userProjectId = loggedInUser?.project_id;

          if (clickedProjectId && userProjectId && clickedProjectId !== userProjectId) {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setError(`❌ Access Denied: You are not assigned to project.`);
            return;
          }
        }
        if (intendedRole === "client" && actualRole !== "client") {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setError("❌ Access Denied: This login gate is for Clients only.");
          return;
        }
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
      console.error("Auth Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    // Optional: auto-trigger login
    // setTimeout(handleAction, 100);
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

          <h2>{isSignup ? "Create an Account" : "Welcome Back"}</h2>

          {projectData?.projectName ? (
            <p className="login-project">
              {isSignup ? "Sign up to view" : "Sign in to access"} <b>{projectData.projectName}</b>
            </p>
          ) : (
            <p className="login-project">{isSignup ? "Sign up" : "Sign in"} to access your dashboard</p>
          )}

          {isSignup && (
            <div className="login-input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAction()}
              />
            </div>
          )}

          <div className="login-input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAction()}
            />
          </div>

          <div className="login-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAction()}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-submit-btn" onClick={handleAction} disabled={loading}>
            {loading ? (isSignup ? "Signing up..." : "Signing in...") : (isSignup ? "Sign Up" : "Sign In")}
          </button>

          {intendedRole === "client" && (
            <div className="signup-toggle" style={{ textAlign: "center", marginTop: "15px", fontSize: "14px" }}>
              <span style={{ color: "#4B5563" }}>
                {isSignup ? "Already have an account?" : "Don't have an account?"}
              </span>
              <button
                onClick={() => { setIsSignup(!isSignup); setError(""); }}
                style={{ background: "none", border: "none", color: "#2563EB", textDecoration: "underline", fontWeight: "700", cursor: "pointer", marginLeft: "5px", fontSize: "15px" }}
              >
                {isSignup ? "Sign In" : "Sign Up"}
              </button>
            </div>
          )}

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
