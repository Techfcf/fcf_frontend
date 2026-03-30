import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COLLAPSED = 64;
const EXPANDED  = 200;

const Sidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [expanded, setExpanded] = useState(true);
  const [bdOpen,   setBdOpen]   = useState(false);

  const isActive  = (paths) => paths.includes(location.pathname);
  
  // Visibility logic: Show BD for project NbS-001 OR for admins when a project is selected
  const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const userRole   = storedUser?.role;
  const selectedPC = localStorage.getItem('selectedProjectCode');
  const showBD     = selectedPC === 'NbS-001' || (userRole === 'admin' && selectedPC);

  const w         = expanded ? EXPANDED : COLLAPSED;

  return (
    <>
      <style>{`
        /* ---- Sidebar shell: in-flow flex item ---- */
        .sidebar-shell {
          flex-shrink: 0;
          height: 100%;
          background: #F5E6D3;
          border-right: 1px solid #e0cebc;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 20px;
          overflow: hidden;
          box-shadow: 2px 0 8px rgba(0,0,0,0.06);
          /* Smooth width animation handled by framer-motion */
        }

        /* ---- Nav buttons ---- */
        .sb-btn {
          position: relative;
          width: 40px; height: 40px;
          border: 1px dashed #cbb99c;
          border-radius: 8px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 700;
          transition: all 0.2s ease;
          background: #fff; color: #7a6a5a;
          margin-bottom: 8px;
          flex-shrink: 0;
        }
        .sb-btn.active {
          background: #d66306; color: #fff;
          border-color: #d66306;
          box-shadow: 0 3px 10px rgba(214,99,6,0.3);
        }
        .sb-btn:hover:not(.active) {
          background: #f0d9c0; color: #d66306; border-color: #d66306;
        }

        /* Tooltip — only when collapsed */
        .sb-collapsed .sb-btn:hover::after {
          content: attr(data-tip);
          position: fixed;
          left: 72px;
          background: #333; color: #fff;
          font-size: 12px; font-weight: 500;
          padding: 5px 10px; border-radius: 5px;
          white-space: nowrap; pointer-events: none;
          z-index: 9999; font-family: 'Inter', sans-serif;
        }

        /* Expanded row */
        .sb-row {
          display: flex; align-items: center;
          width: 100%; padding: 0 12px; margin-bottom: 8px;
        }
        .sb-label {
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #4a3b2c; white-space: nowrap;
          margin-left: 10px; overflow: hidden;
        }

        /* BD sub-menu */
        .sb-sub { 
          width: 100%; 
          padding: 4px 12px 10px 48px; 
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sb-sub-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 0;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #7a6a5a;
          transition: all 0.2s;
          font-weight: 500;
        }
        .sb-radio-circle {
          width: 14px;
          height: 14px;
          border: 2px solid #cbb99c;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .sb-radio-inner {
          width: 6px;
          height: 6px;
          background: #d66306;
          border-radius: 50%;
          transform: scale(0);
          transition: transform 0.2s;
        }
        .sb-sub-btn.active .sb-radio-circle {
          border-color: #d66306;
        }
        .sb-sub-btn.active .sb-radio-inner {
          transform: scale(1);
        }
        .sb-sub-btn.active {
          color: #d66306;
          font-weight: 700;
        }
        .sb-sub-btn:hover:not(.active) {
          color: #d66306;
        }
        .sb-sub-btn:hover:not(.active) .sb-radio-circle {
          border-color: #d66306;
        }

        /* Toggle button */
        .sb-toggle {
          margin-top: auto; margin-bottom: 20px;
          width: 40px; height: 40px;
          border: none; border-radius: 8px;
          background: #d66306; color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; font-size: 18px;
          box-shadow: 0 3px 8px rgba(214,99,6,0.25);
        }
        .sb-toggle:hover { background: #b85505; }
      `}</style>

      {/* ── The sidebar IS the flex child — no wrapper div ── */}
      <motion.div
        className={`sidebar-shell ${expanded ? '' : 'sb-collapsed'}`}
        animate={{ width: w }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{ width: w }}   /* also set inline so initial render is correct */
      >
        {/* ── PS ── */}
        {expanded ? (
          <div className="sb-row">
            <button className={`sb-btn ${isActive(['/ProjectSummary']) ? 'active' : ''}`}
              onClick={() => navigate('/ProjectSummary')}>PS</button>
            <span className="sb-label">Project Summary</span>
          </div>
        ) : (
          <button className={`sb-btn ${isActive(['/ProjectSummary']) ? 'active' : ''}`}
            onClick={() => navigate('/ProjectSummary')}
            data-tip="Project Summary">PS</button>
        )}

        {/* ── DB ── */}
        {expanded ? (
          <div className="sb-row">
            <button className={`sb-btn ${isActive(['/dashboard']) ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}>DB</button>
            <span className="sb-label">Dashboard</span>
          </div>
        ) : (
          <button className={`sb-btn ${isActive(['/dashboard']) ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
            data-tip="Dashboard">DB</button>
        )}

        {/* ── BD (only NbS-001) ── */}
        {showBD && (
          <>
            {expanded ? (
              <>
                <div className="sb-row">
                  <button
                    className={`sb-btn ${isActive(['/BiodiversityDashboard', '/ClimateDashboard']) ? 'active' : ''}`}
                    onClick={() => setBdOpen(o => !o)}>BD</button>
                  <span className="sb-label">Biodiversity</span>
                </div>
                <AnimatePresence>
                  {bdOpen && (
                    <motion.div className="sb-sub"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}>
                      <button className={`sb-sub-btn ${isActive(['/BiodiversityDashboard']) ? 'active' : ''}`}
                        onClick={() => navigate('/BiodiversityDashboard')}>
                        <div className="sb-radio-circle"><div className="sb-radio-inner" /></div>
                        Biodiversity
                      </button>
                      <button className={`sb-sub-btn ${isActive(['/ClimateDashboard']) ? 'active' : ''}`}
                        onClick={() => navigate('/ClimateDashboard')}>
                        <div className="sb-radio-circle"><div className="sb-radio-inner" /></div>
                        Climate
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button
                className={`sb-btn ${isActive(['/BiodiversityDashboard', '/ClimateDashboard']) ? 'active' : ''}`}
                onClick={() => { setExpanded(true); setBdOpen(true); }}
                data-tip="Biodiversity">BD</button>
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* ── Toggle ── */}
        <button className="sb-toggle"
          onClick={() => setExpanded(e => !e)}
          title={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? '←' : '☰'}
        </button>
      </motion.div>
    </>
  );
};

export default Sidebar;
