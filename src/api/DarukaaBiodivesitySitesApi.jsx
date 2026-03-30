// DarukaaBiodivesitySitesApi.jsx

const API_BASE = "https://api.darukaa.com/api/v1";
const PROJECT_ID = "f8154a4d-fa23-4554-bf1b-75430d42c69e";
const API_KEY = "drk_prod_145fd73c3a34459eb50e8d25a264aa3f";

let cachedSites = null;
const audioCache = {};

// ===============================
// Fetch With Timeout + External Abort Support
// ===============================
const fetchWithTimeout = async (
  url,
  options = {},
  timeout = 10000,
  externalSignal
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If React aborts → abort fetch too
  if (externalSignal) {
    externalSignal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

// ===============================
// Get All Sites (Cached + Abort Safe)
// ===============================
export const getAllSites = async (signal) => {
  if (cachedSites) return cachedSites;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE}/projects/${PROJECT_ID}/sites`,
      {
        headers: {
          "x-api-key": API_KEY,
          Accept: "application/json",
        },
      },
      15000,
      signal
    );

    if (!response.ok) {
      throw new Error(`Sites fetch failed: ${response.status}`);
    }

    const json = await response.json();

    const sites = Array.isArray(json)
      ? json
      : Array.isArray(json.data)
      ? json.data
      : [json];

    cachedSites = sites;
    return sites;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("getAllSites error:", err);
    }
    throw err;
  }
};

// ===============================
// Get Biodiversity Summary (Abort Safe)
// ===============================
export const getBiodiversitySummary = async (signal) => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE}/projects/${PROJECT_ID}/biodiversity/summary`,
      {
        headers: {
          "x-api-key": API_KEY,
          Accept: "application/json",
        },
      },
      10000,
      signal
    );

    if (!response.ok) {
      throw new Error(`Summary fetch failed: ${response.status}`);
    }

    const json = await response.json();
    return json?.data || json;

  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Biodiversity summary error:", err);
    }
    throw err;
  }
};

// ===============================
// Get Biodiversity Audio Clips (Cached)
// ===============================
export const getBiodiversityAudioClips = async (siteId, signal) => {
  if (!siteId) return [];
  if (audioCache[siteId]) return audioCache[siteId];

  try {
    const response = await fetchWithTimeout(
      `${API_BASE}/sites/${siteId}/biodiversity/audio-clips`,
      {
        headers: {
          "x-api-key": API_KEY,
          Accept: "application/json",
        },
      },
      8000,
      signal
    );

    if (!response.ok) return [];

    const data = await response.json();

    let normalized = [];

    if (Array.isArray(data)) normalized = data;
    else if (Array.isArray(data.data)) normalized = data.data;
    else if (typeof data === "object" && data !== null)
      normalized = Object.values(data).flat();

    audioCache[siteId] = normalized;
    return normalized;

  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Audio clips fetch error:", err);
    }
    return [];
  }
};

// ===============================
// WKT Point Parser
// ===============================
export const parseWKTPoint = (wkt) => {
  if (!wkt) return null;
  try {
    const match = wkt.match(/POINT\s*\(([^)]+)\)/);
    if (!match) return null;
    const [lng, lat] = match[1].split(" ").map(Number);
    return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
  } catch {
    return null;
  }
};

// ===============================
// WKT Polygon Parser
// ===============================
export const parseWKTPolygon = (wkt) => {
  if (!wkt) return null;
  try {
    const match = wkt.match(/POLYGON\s*\(\((.+)\)\)/);
    if (!match) return null;

    const coords = match[1]
      .split(",")
      .map((pair) => {
        const [lng, lat] = pair.trim().split(" ").map(Number);
        return [lat, lng];
      })
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

    return coords.length >= 3 ? coords : null;
  } catch {
    return null;
  }
};

// ===============================
// Popup Builder
// ===============================
export const createSitePopupContent = (site, audioClips = []) => {
  const hasAudio = Array.isArray(audioClips) && audioClips.length > 0;

  let audioHTML = "<i style='color:red'>No audio clips available</i>";

  if (hasAudio) {
    audioHTML = audioClips
      .map(
        (clip) => `
        <div style="
          border:1px solid #ddd;
          padding:6px;
          margin-bottom:6px;
          border-radius:6px;
          background:#fafafa;
        ">
          <b>${clip.common_name || "Unknown Bird"}</b><br/>
          <i>${clip.scientific_name || ""}</i><br/>
          📅 ${clip.date || "N/A"} ⏰ ${clip.time || ""}<br/>
          🎯 Confidence: ${clip.confidence ?? "N/A"}<br/>
          <audio controls style="width:100%; margin-top:4px">
            <source src="${clip.url}" type="audio/wav"/>
          </audio>
        </div>
      `
      )
      .join("");
  }

  return `
   <div style="min-width:260px; font-size:13px; max-height:320px; overflow:auto">
      <b>Site Name:</b> ${site.site_name || "Unnamed Site"}<br/>
      <b>Area:</b> ${site.area ?? "N/A"}<br/>
      <b>Carbon Status:</b> ${site.carbon_analysis_status ?? "N/A"}<br/>
      <b>Env Status:</b> ${site.env_analysis_status ?? "N/A"}<br/>
      <b>Bio Status:</b> ${site.bio_analysis_status ?? "N/A"}<br/>
      <b>Carbon Enabled:</b> ${site.carbon_analysis_enabled ? "Yes" : "No"}<br/>
      <b>Bio Enabled:</b> ${site.bio_analysis_enabled ? "Yes" : "No"}<br/>
      <b>Env Enabled:</b> ${site.env_analysis_enabled ? "Yes" : "No"}<br/><br/>
      <b>🎧 Biodiversity Audio Clips:</b><br/>
      ${audioHTML}
    </div>
  `;
};