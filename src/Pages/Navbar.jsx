import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ projectName }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [userName, setUserName] = useState("User");

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
      if (storedUser?.username) {
        setUserName(storedUser.username);
      }
    } catch (err) {
      console.error("Error reading user data:", err);
    }
  }, []);

  const handleLogout = () => {
    if (logout) logout();
    navigate('/');
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '64px',
      background: '#ffffff',
      borderBottom: '1px solid #e8ddd0',
      flexShrink: 0,
      zIndex: 100,
      position: 'relative',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    }}>
      {/* Left: FCF Logo */}
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        onClick={() => navigate('/')}
      >
        <img src="/img/logo.png" alt="FCF India" style={{ height: '36px', objectFit: 'contain' }} />
      </div>

      {/* Center: Project Name */}
      {projectName && (
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: '600',
          color: '#1a5c2d',
          textAlign: 'center',
          background: '#f0f7f0',
          padding: '6px 16px',
          borderRadius: '20px',
          border: '1px solid rgba(26,92,45,0.1)'
        }}>
          {projectName}
        </div>
      )}

      {/* Right: User Profile + Actions */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

        {/* User Greeting */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: '#fdfcfb'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a5c2d, #5a9e2f)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '700'
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#888', fontWeight: '500', lineHeight: '1' }}>Welcome</span>
            <span style={{ fontSize: '13px', color: '#333', fontWeight: '600' }}>{userName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.02, background: '#d64500' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            style={{
              background: '#e8560a',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s'
            }}
          >
            Logout
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, background: '#4a8226' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/Help')}
            style={{
              background: '#5a9e2f',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.2s'
            }}
          >
            Help
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
