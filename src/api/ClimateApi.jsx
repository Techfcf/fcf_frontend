// ClimateApi.jsx

const API_BASE = "https://api.darukaa.com/api/v1"; // ✅ production base URL
const PROJECT_ID = "f8154a4d-fa23-4554-bf1b-75430d42c69e";
const API_KEY = "drk_prod_145fd73c3a34459eb50e8d25a264aa3f"; 

// ===============================
// Common Fetch Helper
// ===============================
const fetchFromApi = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

// ===============================
// Get Environmental Summary
// ===============================
export const getEnvironmentalSites = async () => {
  return fetchFromApi(`/projects/${PROJECT_ID}/environmental/summary`);
};

// ===============================
// ✅ Get Project Sites (NEW API)
// ===============================
export const getProjectSites = async () => {
  return fetchFromApi(`/projects/${PROJECT_ID}/sites`);
};  