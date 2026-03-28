import React, { useEffect, useState } from "react";
import "../../Style/ProjectSummary.css";
import { API_BASE_URL } from "../../config";

const ProjectSummary = () => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedProjectCode = localStorage.getItem("selectedProjectCode");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/projects`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p) => p.project_id === selectedProjectCode);
        setProject(found || null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="psLoaderText">Loading Project...</div>;
  if (!project) return <div className="psLoaderText">Project Not Found</div>;

  return (
    <div className="psMainWrapper">
      <h1 className="psMainHeading">Project Summary</h1>

      <div className="psCardBox">
        <h2 className="psCardTitle">{project.project_name}</h2>
        <p className="psCardDesc">{project.description}</p>

        <div className="psDetailsWrapper">
          <p><strong>Project Code:</strong> {project.project_id}</p>
          <p><strong>Location:</strong> {project.location}</p>
          <p><strong>Total Farmers:</strong> {project.total_farmers}</p>
          <p><strong>Total Parcels:</strong> {project.total_parcels}</p>
          <p><strong>Total Area (Ha):</strong> {project.total_area_ha}</p>
          <p><strong>Start Date:</strong> {project.start_date}</p>
          <p><strong>End Date:</strong> {project.end_date || "Ongoing"}</p>
        </div>

        <button className="psReadMoreBtn">Read More</button>
      </div>
    </div>
  );
};

export default ProjectSummary;
