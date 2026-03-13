// src/api/ProjectApi.jsx
import { API_BASE_URL } from "../config";

const PROJECT_API_URL = `${API_BASE_URL}/api/projects`;

/* -----------------------------------------
   Fetch All Projects
------------------------------------------ */
export const fetchProjects = async () => {
  try {
    const response = await fetch(PROJECT_API_URL);

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Project API Error:", error);
    throw error;
  }
};
