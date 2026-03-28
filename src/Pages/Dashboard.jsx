import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FilterSection from "./FilterSection";
import MapContainer from "./MapContainer";
import FarmerDetailPanel from "./FarmerDetailPanel";
import ProjectSummary from "../Components/ProjectSummary/ProjectSummary";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background: #fff;
  overflow: hidden;
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  overflow: hidden;
`;

const MainLayout = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr;
  flex: 1;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: row;
  height: calc(100vh - 64px - 74px);
  overflow: hidden;
`;

const MapArea = styled.div`
  flex: ${({ $panelOpen }) => ($panelOpen ? "0 0 calc(100% - 400px)" : "1 1 100%")};
  transition: flex-basis 0.4s ease;
  min-width: 0;
`;

const PanelArea = styled.div`
  width: ${({ $panelOpen }) => ($panelOpen ? "400px" : "0")};
  transition: width 0.4s ease;
  overflow: visible;
`;

const Dashboard = () => {
  const location = useLocation();

  const isProjectSummary = location.pathname === "/ProjectSummary";
  const clickedProjectCode = location.state?.projectCode;

  // ⭐ Save project code from click if present
  if (clickedProjectCode) {
    localStorage.setItem("selectedProjectCode", clickedProjectCode);
  }

  // ⭐ Get user role and assigned project
  const storedUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
  const userRole = storedUser?.role;
  const userProjectId = storedUser?.project_id;

  const selectedProjectCode =
    userRole === "client"
      ? "DEMO-001"
      : userRole === "project_manager" && userProjectId
      ? userProjectId
      : localStorage.getItem("selectedProjectCode") || "All";

  // ⭐ Project name state
  const [projectName, setProjectName] = useState("");

  // ⭐ Load projectMap from localStorage and set projectName
  useEffect(() => {
    try {
      const storedMap = JSON.parse(localStorage.getItem("projectMap") || "{}");
      if (storedMap[selectedProjectCode]) {
        setProjectName(storedMap[selectedProjectCode]);
      }
    } catch (e) { console.error("Error parsing projectMap:", e); }
  }, [selectedProjectCode]);

  // ⭐ Handle project name coming from FilterSection
  const handleProjectNameChange = (name) => {
    setProjectName(name);

    try {
      const pMap = JSON.parse(localStorage.getItem("projectMap") || "{}");
      pMap[selectedProjectCode] = name;
      localStorage.setItem("projectMap", JSON.stringify(pMap));
    } catch (e) {
      localStorage.setItem("projectMap", JSON.stringify({ [selectedProjectCode]: name }));
    }
  };

  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [activeDroneTileUrl, setActiveDroneTileUrl] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const panelOpen = Boolean(selectedFarmer);

  // Clear drone tile when farmer or filters change
  useEffect(() => {
    setActiveDroneTileUrl(null);
  }, [currentFilters, selectedFarmer?.farmerId]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  // Project Summary Page
  if (isProjectSummary) {
    return (
      <AppContainer>
        <Navbar projectName={projectName} /> {/* ✅ Always show project name */}
        <MainLayout>
          <Sidebar />
          <div style={{ overflow: "auto", padding: "20px" }}>
            <ProjectSummary />
          </div>
        </MainLayout>
      </AppContainer>
    );
  }

  // Dashboard Page
  return (
    <AppContainer>
      <Navbar projectName={projectName} />

      <MainLayout>
        <Sidebar />

        <ContentArea>
          <FilterSection
            selectedProjectCode={selectedProjectCode}
            onFilterChange={setCurrentFilters}
            onProjectNameChange={handleProjectNameChange}
            userRole={userRole}
          />

          <MainContent>
            <MapArea $panelOpen={panelOpen}>
              <MapContainer
                onParcelSelect={setSelectedFarmer}
                filters={currentFilters}
                activeDroneTileUrl={activeDroneTileUrl}
                setActiveDroneTileUrl={setActiveDroneTileUrl}
                userRole={userRole}
              />
            </MapArea>

            <PanelArea $panelOpen={panelOpen}>
              <FarmerDetailPanel
                farmer={selectedFarmer}
                onClose={() => setSelectedFarmer(null)}
                activeDroneTileUrl={activeDroneTileUrl}
                onDroneTileToggle={setActiveDroneTileUrl}
              />
            </PanelArea>
          </MainContent>
        </ContentArea>
      </MainLayout>
    </AppContainer>
  );
};

export default Dashboard;
