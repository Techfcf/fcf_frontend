import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import Dashboard from "../Pages/Dashboard";
import Navbar from "../Pages/Navbar";
import MapContainer from "../Pages/MapContainer";
import Sidebar from "../Pages/Sidebar";
import FarmerDetailPanel from "../Pages/FarmerDetailPanel";
import FilterSection from "../Pages/FilterSection";
import FloatingResults from "../Pages/FloatingResults";
import Help from "../Components/Cards/Help";
import Login from "../Pages/Login";
import DroneExplorer from "../Pages/DroneExplorer";

import ProtectedRoute from "../Auth/ProtectedRoute";
import BiodiversityDashboard from "../Components/Darukaa/BiodiversityDashboard";
import ClimateDashboard from "../Components/Darukaa/ClimateDashboard";

import styled from "styled-components";

// ── Shared full-screen shell for BD/CD pages ────────────────
const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;
const ShellRow = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;
const ShellContent = styled.div`
  flex: 1;
  overflow: auto;
`;

const ShellLayout = ({ children }) => (
  <Shell>
    <Navbar />
    <ShellRow>
      <Sidebar />
      <ShellContent>{children}</ShellContent>
    </ShellRow>
  </Shell>
);

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* 🌍 Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/drone-explorer" element={<DroneExplorer />} />

        {/* 🔐 Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/project/:projectId" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/ProjectSummary" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/Navbar" element={<ProtectedRoute><Navbar /></ProtectedRoute>} />
        <Route path="/MapContainer" element={<ProtectedRoute><MapContainer /></ProtectedRoute>} />
        <Route path="/Sidebar" element={<ProtectedRoute><Sidebar /></ProtectedRoute>} />
        <Route path="/FarmerDetailPanel" element={<ProtectedRoute><FarmerDetailPanel /></ProtectedRoute>} />
        <Route path="/FilterSection" element={<ProtectedRoute><FilterSection /></ProtectedRoute>} />
        <Route path="/FloatingResults" element={<ProtectedRoute><FloatingResults /></ProtectedRoute>} />
        <Route path="/Help" element={<ProtectedRoute><Help /></ProtectedRoute>} />

        {/* 🌿 Darukaa — wrapped in shared Navbar + Sidebar shell */}
        <Route
          path="/BiodiversityDashboard"
          element={
            <ProtectedRoute>
              <ShellLayout>
                <BiodiversityDashboard />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ClimateDashboard"
          element={
            <ProtectedRoute>
              <ShellLayout>
                <ClimateDashboard />
              </ShellLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
