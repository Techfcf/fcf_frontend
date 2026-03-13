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

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* 🌍 Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/drone-explorer" element={<DroneExplorer />} />

        {/* 🔐 Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/project/:projectId"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ProjectSummary"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Navbar"
          element={
            <ProtectedRoute>
              <Navbar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/MapContainer"
          element={
            <ProtectedRoute>
              <MapContainer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Sidebar"
          element={
            <ProtectedRoute>
              <Sidebar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/FarmerDetailPanel"
          element={
            <ProtectedRoute>
              <FarmerDetailPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/FilterSection"
          element={
            <ProtectedRoute>
              <FilterSection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/FloatingResults"
          element={
            <ProtectedRoute>
              <FloatingResults />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
