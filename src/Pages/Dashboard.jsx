import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FilterSection from "./FilterSection";
import MapContainer from "./MapContainer";
import FarmerDetailPanel from "./FarmerDetailPanel";
import ProjectSummary from "../Components/ProjectSummary/ProjectSummary";

/* ── Layout shell ─────────────────────────────────────────── */
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: #fff;
  overflow: hidden;
`;

const MainRow = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fdfcfb;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: row;
  overflow: hidden;
`;

const MapArea = styled.div`
  flex: ${({ $open }) => ($open ? "0 0 calc(100% - 400px)" : "1 1 100%")};
  transition: flex-basis 0.4s ease;
  min-width: 0;
`;

const PanelArea = styled.div`
  width: ${({ $open }) => ($open ? "400px" : "0")};
  transition: width 0.4s ease;
  overflow: visible;
`;

/* ── Dashboard ────────────────────────────────────────────── */
const Dashboard = () => {
  const location = useLocation();
  const isProjectSummary = location.pathname === "/ProjectSummary";
  const clickedProjectCode = location.state?.projectCode;

  if (clickedProjectCode) {
    localStorage.setItem("selectedProjectCode", clickedProjectCode);
  }

  const storedUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const userRole = storedUser?.role;
  const userProjectId = storedUser?.project_id;

  const selectedProjectCode =
    userRole === "client"
      ? "DEMO-001"
      : userRole === "project_manager" && userProjectId
      ? userProjectId
      : localStorage.getItem("selectedProjectCode") || "All";

  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem("projectMap") || "{}");
      if (m[selectedProjectCode]) setProjectName(m[selectedProjectCode]);
    } catch {}
  }, [selectedProjectCode]);

  const handleProjectNameChange = (name) => {
    setProjectName(name);
    try {
      const m = JSON.parse(localStorage.getItem("projectMap") || "{}");
      m[selectedProjectCode] = name;
      localStorage.setItem("projectMap", JSON.stringify(m));
    } catch {
      localStorage.setItem("projectMap", JSON.stringify({ [selectedProjectCode]: name }));
    }
  };

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [activeDroneTileUrl, setActiveDroneTileUrl] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const panelOpen = Boolean(selectedFarmer);

  useEffect(() => { setActiveDroneTileUrl(null); }, [currentFilters, selectedFarmer?.farmerId]);
  useEffect(() => { window.scrollTo(0, 0); }, []);

  /* ── Project Summary ────────────────────────────────── */
  if (isProjectSummary) {
    return (
      <AppContainer>
        <Navbar projectName={projectName} />
        <MainRow>
          <Sidebar />
          <ContentArea style={{ padding: "20px", overflow: "auto" }}>
            <ProjectSummary />
          </ContentArea>
        </MainRow>
      </AppContainer>
    );
  }

  /* ── Main Dashboard ─────────────────────────────────── */
  return (
    <AppContainer>
      <Navbar projectName={projectName} />
      <MainRow>
        <Sidebar />
        <ContentArea>
          <FilterSection
            selectedProjectCode={selectedProjectCode}
            onFilterChange={setCurrentFilters}
            onProjectNameChange={handleProjectNameChange}
            userRole={userRole}
          />
          <MainContent>
            <MapArea $open={panelOpen}>
              <MapContainer
                onParcelSelect={setSelectedFarmer}
                filters={currentFilters}
                activeDroneTileUrl={activeDroneTileUrl}
                setActiveDroneTileUrl={setActiveDroneTileUrl}
                userRole={userRole}
              />
            </MapArea>
            <PanelArea $open={panelOpen}>
              <FarmerDetailPanel
                farmer={selectedFarmer}
                onClose={() => setSelectedFarmer(null)}
                activeDroneTileUrl={activeDroneTileUrl}
                onDroneTileToggle={setActiveDroneTileUrl}
              />
            </PanelArea>
          </MainContent>
        </ContentArea>
      </MainRow>
    </AppContainer>
  );
};

export default Dashboard;
