import React, { useEffect, useState } from "react";
import "../../Style/HomeStyle.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Login from "../../Pages/Login";
import { fetchProjects } from "../../api/ProjectApi";

/* =========================================================
   COUNTER COMPONENT
========================================================= */
const Counter = ({ end, duration = 3000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const frameTime = 16;
    const totalFrames = duration / frameTime;
    const step = end / totalFrames;
    let currentFrame = 0;

    const timer = setInterval(() => {
      currentFrame++;
      start += step;

      if (currentFrame >= totalFrames) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.ceil(start));
      }
    }, frameTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

/* =========================================================
   MAIN COMPONENT
========================================================= */
const Card2 = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  /* -------- ICON MAP -------- */
  const iconMap = {
    "Plan Vivo": "/img/planVivo.jpg",
    Verra: "/img/Veraa.jpg",
    "Gold Standard": "/img/gold.png",
  };

  const extractNumber = (id) => {
    if (!id) return 0;
    return parseInt(id.replace("NbS-", ""), 10);
  };

  /* =========================================================
     LOAD PROJECTS FROM API FILE
  ========================================================= */
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects();

        const formatted = data.map((p) => ({
          id: p.project_id,
          name: p.project_name,
          location: p.location,
          farmers: p.farmers
            ? parseInt(p.farmers.replace(/,/g, ""))
            : 0,
          hectares: p.area_ha
            ? parseFloat(p.area_ha.replace(/,/g, ""))
            : 0,
          trees: p.trees ? parseInt(p.trees.replace(/,/g, "")) : 0,
          credits: p.expected_carbon_credits
            ? parseInt(p.expected_carbon_credits.replace(/,/g, ""))
            : 0,
          startYear: p.project_start_year,
          verraIcon: iconMap[p.standard] || "/img/default.png",
          projectType: p.project_type,
          status: p.project_status,
          sortNumber: extractNumber(p.project_id),
        }));

        formatted.sort((a, b) => a.sortNumber - b.sortNumber);
        setProjects(formatted);
      } catch (error) {
        console.error("Error loading projects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  /* =========================================================
     LOADING STATE
  ========================================================= */
  if (loading || authLoading) {
    return (
      <h2 style={{ textAlign: "center", marginTop: "50px" }}>
        Loading Projects...
      </h2>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <section id="natureBasedSection" className="projects-section">
      <div className="projects-container">
        <div className="projects-header">
          <p className="section-label">Our Global Projects</p>
          <h2 className="section-heading">NbS projects across continents</h2>
          <p className="section-description">
            Click on a project to access its full dashboard, farmer data,
            drone imagery, and carbon metrics.
          </p>
        </div>

        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => {
                if (authLoading) return;
                const payload = {
                  sidebarSelected: "projects",
                  projectName: project.name,
                  projectCode: project.id,
                  intendedRole: "project_manager",
                };
                if (isAuthenticated) {
                  navigate("/dashboard", { state: payload });
                } else {
                  setSelectedProject(payload);
                  setShowLogin(true);
                }
              }}
            >
              {/* TOP: Icon + Header */}
              <div className="project-card-top">
                <div className="project-icon">
                  <img src={project.verraIcon} alt="Standard" />
                </div>
                <div className="project-header-info">
                  <div className="project-name">{project.name}</div>
                  <div className="project-location">📍 {project.location}</div>
                </div>
                <div className="project-started">
                  {project.startYear}
                </div>
              </div>

              {/* BODY: Stats grid */}
              <div className="project-card-body">
                <div className="project-stats-grid">
                  <div className="project-stat">
                    <span className="project-stat-number"><Counter end={project.farmers} /></span>
                    <div className="project-stat-label">Farmers</div>
                  </div>
                  <div className="project-stat">
                    <span className="project-stat-number"><Counter end={project.hectares} /></span>
                    <div className="project-stat-label">Hectares</div>
                  </div>
                  <div className="project-stat">
                    <span className="project-stat-number"><Counter end={project.trees} /></span>
                    <div className="project-stat-label">Trees</div>
                  </div>
                  <div className="project-stat">
                    <span className="project-stat-number"><Counter end={project.credits} /></span>
                    <div className="project-stat-label">Credits</div>
                  </div>
                </div>
              </div>

              {/* FOOTER: Tags + Arrow */}
              <div className="project-card-footer">
                <div className="project-tags">
                  <span className="tag type">{project.projectType}</span>
                  <span className="tag status">{project.status}</span>
                </div>
                <div className="project-arrow">→</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOGIN MODAL */}
      {showLogin && (
        <Login
          projectData={selectedProject}
          onClose={() => setShowLogin(false)}
        />
      )}
    </section>
  );
};

export default Card2;
