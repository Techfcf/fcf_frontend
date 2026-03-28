import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../../src/Style/MainStyle.css';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ projectName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (logout) logout();
    navigate('/');
  };

  // Read user info from localStorage (set by authService)
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || '{}');
    } catch { return {}; }
  })();

  const userEmail = storedUser?.email || storedUser?.username || '';
  const userRole = storedUser?.role || 'Guest';
  const displayName = userEmail ? userEmail.split('@')[0] : 'User';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="header-container">
      {/* Left: Logo + Brand */}
      <div className="logo-icon" onClick={() => navigate('/')}>
        <img src="/img/logo.png" alt="FIT Climate" />
        <span className="logo-icon-name">FIT Climate</span>
      </div>

      {/* Center: Project Name */}
      {projectName && (
        <div className="navbar-project-name">
          {projectName}
        </div>
      )}

      {/* Right: User + Actions */}
      <div className="nav-buttons">
        {/* User Badge */}
        <div className="nav-user-badge">
          <div className="nav-user-avatar">{initials}</div>
          <div className="nav-user-info">
            <span className="nav-user-welcome">Welcome back,</span>
            <span className="nav-user-name">
              {displayName} 👋 <span className="nav-user-role">({userRole})</span>
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`nav-button ${isActive('/Help') ? 'active' : ''}`}
          onClick={() => navigate('/Help')}
        >
          Help
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="nav-button-logout"
          onClick={handleLogout}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Logout
        </motion.button>
      </div>
    </header>
  );
};

export default Navbar;
