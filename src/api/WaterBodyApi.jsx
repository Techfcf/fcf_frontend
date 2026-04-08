import { API_BASE_URL } from "../config";

/**
 * Fetches water body data by type (BWA, DAM, LIFT, hydroLakes)
 * Returns GeoJSON features with attributes
 */
export const getWaterBodiesByType = async (type, state, district, project_code) => {
  if (!type) return [];
  
  try {
    const query = new URLSearchParams({ type });
    if (state && state !== "All") query.append("state", state);
    if (district && district !== "All") query.append("district", district);
    if (project_code && project_code !== "All") query.append("project_code", project_code);

    const response = await fetch(`${API_BASE_URL}/api/water-bodies?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch water bodies: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getWaterBodiesByType:", error);
    return [];
  }
};
