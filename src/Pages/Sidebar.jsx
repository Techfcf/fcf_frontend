import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../../src/Style/MainStyle.css';

// ── SVG icon components ─────────────────────────────
const IconGrid = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconMap = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13V7m0 13l6-3m-6-10l6-3m0 0l5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17m0-13v13" />
  </svg>
);

const IconDrone = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l4 4m10-4l-4 4M3 21l4-4m10 4l-4-4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7a2.828 2.828 0 000 10M17 7a2.828 2.828 0 010 10" />
  </svg>
);

// ── Sidebar ─────────────────────────────────────────
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (button) => {
    if (button === 'ps') return location.pathname === '/ProjectSummary';
    if (button === 'db') return location.pathname === '/dashboard';
    if (button === 'de') return location.pathname === '/drone-explorer';
    return false;
  };

  return (
    <div className="sidebar-container">

      {/* Project Summary */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        className={`sidebar-button ${isActive('ps') ? 'active' : ''}`}
        onClick={() => navigate('/ProjectSummary')}
        data-tooltip="Project Summary"
      >
        <IconGrid />
      </motion.button>

      <div className="sidebar-divider" />

      {/* Dashboard / Map */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        className={`sidebar-button ${isActive('db') ? 'active' : ''}`}
        onClick={() => navigate('/dashboard')}
        data-tooltip="Farm Map"
      >
        <IconMap />
      </motion.button>

      {/* Drone Explorer */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        className={`sidebar-button ${isActive('de') ? 'active' : ''}`}
        onClick={() => navigate('/drone-explorer')}
        data-tooltip="Drone Explorer"
      >
        <IconDrone />
      </motion.button>

    </div>
  );
};

export default Sidebar;
