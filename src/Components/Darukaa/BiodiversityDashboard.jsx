import React, { useEffect, useRef, useState, useMemo } from "react";
import "../../Style/BiodiversityDashboard.css";

import {
  getAllSites,
  getBiodiversityAudioClips,
  parseWKTPoint,
  parseWKTPolygon,
  createSitePopupContent,
  getBiodiversitySummary,
} from "../../api/DarukaaBiodivesitySitesApi";
import { getWaterBodiesByType } from "../../api/WaterBodyApi";

import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const BiodiversityDashboard = () => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);

  const [loadingMessage, setLoadingMessage] = useState("Fetching Sites...");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [minGuide, setMinGuide] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [allSites, setAllSites] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const [selectedSiteIndex, setSelectedSiteIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState("All");

  // Species Activity Trend States
  const [selectedSpeciesSiteIndex, setSelectedSpeciesSiteIndex] = useState(0);
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState("All");

  // Water Bodies States
  const [selectedWaterBodyType, setSelectedWaterBodyType] = useState(null); // 'BWA', 'DAM', 'LIFT', 'hydroLakes'
  const waterBodyLayerRef = useRef(null);

  const sidebarWidth = sidebarExpanded ? "200px" : "64px";

  // ====================== MAP RELATED ======================
  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve();
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => (window.L ? resolve() : reject(new Error("Leaflet failed")));
    script.onerror = () => reject(new Error("Leaflet script failed"));
    document.body.appendChild(script);
  });

  const initMap = () => {
    if (!window.L || !mapRef.current || leafletMap.current) return;
    const map = window.L.map(mapRef.current, { center: [24.6, 87.2], zoom: 8 });
    leafletMap.current = map;
    window.L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", { maxZoom: 22 }).addTo(map);
  };

  const loadSitesAndLayers = async () => {
    if (!leafletMap.current) return;
    const map = leafletMap.current;

    setLoadingMessage("✨ Just a moment, crafting your project view...");
    const slowTimer = setTimeout(() => setLoadingMessage("⚠ Server is slow... Please wait"), 5000);

    try {
      const sites = await getAllSites();
      clearTimeout(slowTimer);
      setLoadingMessage("🗺 Preparing site layers...");

      const markerLayer = window.L.featureGroup().addTo(map);
      const polygonLayer = window.L.featureGroup();

      const chunkSize = 20;
      let index = 0;

      const processChunk = () => {
        const slice = sites.slice(index, index + chunkSize);
        slice.forEach((site) => {
          const siteId = site.site_id || site.id;

          const point = parseWKTPoint(site.centroid_wkt);
          if (point) {
            window.L.marker(point)
              .bindPopup(`<b>${site.site_name || siteId}</b>`)
              .addTo(markerLayer);
          }

          const coords = parseWKTPolygon(site.boundary);
          if (coords) {
            const polygon = window.L.polygon(coords, { color: "#3fbd04", weight: 2, fillOpacity: 0.4 });
            polygon.on("click", async (e) => {
              polygon.bindPopup("<b>Loading Biodiversity Data...</b>").openPopup(e.latlng);
              try {
                const audioClips = await getBiodiversityAudioClips(siteId);
                polygon.bindPopup(createSitePopupContent(site, audioClips)).openPopup(e.latlng);
              } catch (err) {
                polygon.bindPopup("<b>Error loading audio data</b>").openPopup(e.latlng);
              }
            });
            polygonLayer.addLayer(polygon);
          }
        });

        index += chunkSize;
        if (index < sites.length) {
          setTimeout(processChunk, 50);
        } else {
          polygonLayer.addTo(map);
          setLoadingMessage("");
        }
      };

      processChunk();
    } catch (err) {
      console.error(err);
      setLoadingMessage("❌ Failed to load sites");
    }
  };

  useEffect(() => {
    loadLeaflet().then(() => { initMap(); loadSitesAndLayers(); }).catch(console.error);
    return () => { leafletMap.current?.remove(); leafletMap.current = null; };
  }, []);

  useEffect(() => {
    setTimeout(() => leafletMap.current?.invalidateSize(), 300);
  }, [sidebarExpanded]);

  // ====================== DATA FETCH ======================
  useEffect(() => {
    const controller = new AbortController();
    const fetchAll = async () => {
      try {
        const [sitesFromApi, summaryRes] = await Promise.all([
          getAllSites(controller.signal),
          getBiodiversitySummary(controller.signal),
        ]);
        setAllSites(sitesFromApi);
        setSummaryData(summaryRes);
      } catch (err) {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      }
    };
    fetchAll();
    return () => controller.abort();
  }, []);

  // ====================== WATER BODIES LAYER ======================
  useEffect(() => {
    if (!leafletMap.current || !window.L) return;
    const map = leafletMap.current;

    const fetchAndRenderWaterBodies = async () => {
      // Clear existing layer
      if (waterBodyLayerRef.current) {
        map.removeLayer(waterBodyLayerRef.current);
        waterBodyLayerRef.current = null;
      }

      if (!selectedWaterBodyType) return;

      try {
        const data = await getWaterBodiesByType(selectedWaterBodyType);
        if (!data || data.length === 0) return;

        const layer = window.L.geoJSON(data.map(item => ({
          type: "Feature",
          properties: item,
          geometry: item.geometry
        })), {
          style: (feature) => ({
            color: "#3498db",
            weight: 2,
            fillOpacity: 0.5,
            fillColor: "#3498db"
          }),
          pointToLayer: (feature, latlng) => {
             return window.L.circleMarker(latlng, {
                radius: 6,
                fillColor: "#3498db",
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
             });
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            layer.bindPopup(`
              <div style="font-family: inherit;">
                <b style="color:#d66306">${props.type || "Water Body"}</b><br/>
                <b>Name:</b> ${props.name || "N/A"}<br/>
                <b>River:</b> ${props.river || "N/A"}<br/>
                <b>District:</b> ${props.district || "N/A"}, ${props.state || ""}<br/>
                ${props.additional_attributes ? `<small>${JSON.stringify(props.additional_attributes)}</small>` : ""}
              </div>
            `);
          }
        }).addTo(map);

        waterBodyLayerRef.current = layer;
        
        // Fit map to layer if features exist
        if (data.length > 0) {
           map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        }
      } catch (err) {
        console.error("Error rendering water bodies:", err);
      }
    };

    fetchAndRenderWaterBodies();
  }, [selectedWaterBodyType]);

  // ====================== COMBINED SITES ======================
  const combinedSites = useMemo(() => {
    if (!summaryData?.insitu_data?.length) return allSites;
    return summaryData.insitu_data.map((summarySite) => {
      const matchingSite = allSites.find(s => s.site_id === summarySite.site_id || s.id === summarySite.site_id);
      return {
        ...summarySite,
        site_name: matchingSite?.site_name || summarySite.site_name || null
      };
    });
  }, [allSites, summaryData]);

  const getSiteName = (site) => {
    if (!site) return "Unknown Site";
    return site.site_name?.trim() 
      ? site.site_name 
      : (site.site_id || `Site ${selectedSiteIndex + 1}`);
  };

  // ====================== ACOUSTIC INDEX ANALYSIS ======================
  const selectedSite = combinedSites[selectedSiteIndex] || {};
  const acousticIndices = selectedSite?.acoustic_data?.indices || [];

  const chartData = useMemo(() => {
    if (!acousticIndices.length) return [];
    const rawACI = acousticIndices.map(item => item.aci ?? 0);
    const rawBI = acousticIndices.map(item => item.bi ?? 0);
    const rawADI = acousticIndices.map(item => item.adi ?? 0);
    const rawAEI = acousticIndices.map(item => item.aei ?? 0);
    const rawNDSI = acousticIndices.map(item => item.ndsi ?? 0);

    const normalize = (arr) => {
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      if (max === min) return arr.map(() => 0.5);
      return arr.map(v => (v - min) / (max - min));
    };

    const normACI = normalize(rawACI);
    const normBI = normalize(rawBI);
    const normADI = normalize(rawADI);
    const normAEI = normalize(rawAEI);
    const normNDSI = normalize(rawNDSI);

    return acousticIndices.map((_, idx) => ({
      hour: String(idx).padStart(2, "0") + ":00",
      ACI: Number(normACI[idx].toFixed(3)),
      BI: Number(normBI[idx].toFixed(3)),
      ADI: Number(normADI[idx].toFixed(3)),
      AEI: Number(normAEI[idx].toFixed(3)),
      NDSI: Number(normNDSI[idx].toFixed(3)),
    }));
  }, [acousticIndices]);

  const indexColors = {
    ACI: "#0000FF",
    BI: "#FFA500",
    ADI: "#008000",
    AEI: "#FF0000",
    NDSI: "#800080",
  };

  const indicesOptions = ["All", "ACI", "BI", "ADI", "AEI", "NDSI"];

  // ====================== SPECIES ACTIVITY TREND (FIXED WITH REAL API STRUCTURE) ======================
  const selectedSpeciesSite = combinedSites[selectedSpeciesSiteIndex] || {};

  // Get species list from current site's activity_trend_data
  const siteSpeciesList = useMemo(() => {
    const speciesTrends = selectedSpeciesSite?.activity_trend_data?.species_trends || {};
    return Object.keys(speciesTrends);
  }, [selectedSpeciesSite]);

  // Convert activity_trend_data into Recharts format
  const speciesTrendData = useMemo(() => {
    const trendData = selectedSpeciesSite?.activity_trend_data || {};
    const timeSlots = trendData.time_slots || [];
    const speciesTrends = trendData.species_trends || {};

    if (!timeSlots.length) return [];

    return timeSlots.map((time, index) => {
      const row = { time };
      Object.keys(speciesTrends).forEach(species => {
        const counts = speciesTrends[species]?.counts || [];
        row[species] = counts[index] ?? 0;
      });
      return row;
    });
  }, [selectedSpeciesSite]);

  const getColor = (i) => ["#1abc9c","#3498db","#9b59b6","#e67e22","#e74c3c","#2ecc71","#f1c40f","#34495e","#fd79a8","#00cec9","#6c5ce7","#fab1a0","#e84393","#00b894","#0984e3"][i % 15];

  // Filtered data based on selected species
  const filteredSpeciesTrendData = useMemo(() => {
    if (selectedSpeciesFilter === "All") return speciesTrendData;
    return speciesTrendData.map(item => ({
      time: item.time,
      [selectedSpeciesFilter]: item[selectedSpeciesFilter] ?? 0
    }));
  }, [speciesTrendData, selectedSpeciesFilter]);

  const filteredSpeciesKeys = useMemo(() => {
    if (selectedSpeciesFilter === "All") return siteSpeciesList;
    return [selectedSpeciesFilter];
  }, [siteSpeciesList, selectedSpeciesFilter]);

  // ====================== SPECIES DISTRIBUTION ======================
  const insituDist = summaryData?.insitu_species_distribution || {};
  const categoryMapping = [
    { key: "critically_endangered", name: "Critically Endangered", color: "#c0392b" },
    { key: "endangered", name: "Endangered", color: "#e74c3c" },
    { key: "vulnerable", name: "Vulnerable", color: "#f39c12" },
    { key: "near_threatened", name: "Near Threatened", color: "#f1c40f" },
    { key: "least_concerned", name: "Least Concern", color: "#27ae60" },
    { key: "unknown", name: "Unknown", color: "#7f8c8d" },
  ];

  const speciesChart = categoryMapping
    .map((cat) => ({ 
      name: cat.name, 
      value: insituDist[cat.key]?.[0]?.total ?? 0, 
      key: cat.key, 
      color: cat.color 
    }))
    .filter(item => item.value > 0);

  const downloadPDF = () => {
    const link = document.createElement("a");
    link.href = "/reports/Biodiversity Baseline - FCF India-3.pdf";
    link.download = "Biodiversity Baseline - FCF India-3.pdf";
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
  };

  return (
    <div className="biodiversity">
      <div className="biodiversity-map-layout">
        <div className="biodiversity-map-wrapper">
          {/* Water Bodies Floating Filters */}
          <div className="wb-floating-filters">
            <div className="wb-filter-header">Water Bodies</div>
            <div className="wb-filter-options">
               {[
                 { id: 'BWA', label: 'BWA' },
                 { id: 'DAM', label: 'DAM' },
                 { id: 'LIFT', label: 'LIFT' },
                 { id: 'hydroLakes', label: 'HydroLakes' }
               ].map(opt => (
                 <label key={opt.id} className="wb-radio-label">
                   <input 
                     type="radio" 
                     name="wbType" 
                     checked={selectedWaterBodyType === opt.id}
                     onChange={() => setSelectedWaterBodyType(opt.id)}
                     onClick={() => {
                        if(selectedWaterBodyType === opt.id) setSelectedWaterBodyType(null);
                     }}
                   />
                   <span>{opt.label}</span>
                 </label>
               ))}
               {selectedWaterBodyType && (
                 <button className="wb-clear-btn" onClick={() => setSelectedWaterBodyType(null)}>Clear</button>
               )}
            </div>
          </div>
          <div className="bd-content">
            {/* ── MAP ── */}
            <div className="bd-map-card">
              <div ref={mapRef} className="biodiversity-leaflet-map" />
              {/* ── FLOAT HELP BUTTON ── */}
              {!showGuide && (
                <button className="bd-help-trigger" onClick={() => setShowGuide(true)} title="How to use this map">
                  ℹ️
                </button>
              )}

              {loadingMessage && (
                <div className="loader-overlay">
                  <div className="loader-box">
                    <div className="loader-text">{loadingMessage}<span className="dots"><span>.</span><span>.</span><span>.</span></span></div>
                  </div>
                </div>
              )}

              {showGuide && (
                <div className={`map-guide ${minGuide ? "min" : ""}`}>
                  <div className="guide-header" onClick={() => setMinGuide(!minGuide)} style={{cursor: 'pointer'}}>
                    <span>🧭 How to Use</span>
                    <div className="guide-actions">
                      <button onClick={(e) => { e.stopPropagation(); setMinGuide(!minGuide); }}>{minGuide ? '□' : '_'}</button>
                      <button onClick={(e) => { e.stopPropagation(); setShowGuide(false); }}>✖</button>
                    </div>
                  </div>
                  {!minGuide && (
                    <ul>
                      <li>🔎 Adjust map zoom levels to visualize land parcel boundaries clearly.</li>
                      <li>🗺️ Click on any polygon marker to inspect detailed site information.</li>
                      <li>🎧 Access acoustic records to listen to site-specific biodiversity audio.</li>
                      <li className="guide-download-item">
                        <button className="guide-download-btn" onClick={() => setShowReport(true)}>
                          📄 Assessment Report
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}

          {showReport && (
            <div className="pdf-modal-overlay">
              <div className="pdf-modal">
                <div className="pdf-header">
                  <h3>Biodiversity Baseline Assessment Report</h3>
                  <button onClick={() => setShowReport(false)}>✖</button>
                </div>
                <iframe src="/reports/Biodiversity Baseline - FCF India-3.pdf" title="PDF Preview" className="pdf-frame" />
                <div className="pdf-actions">
                  <button className="pdf-download-btn" onClick={downloadPDF}>
                    ⬇ Download Report
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>{/* /.bd-map-card */}

          {/* ── PROJECT SUMMARY + DATA ── */}
          <div className="project-summary">
            {/* Project Summary Card */}
            <div className="summary-card">
              <h2 className="project-title">Agroforestry Project Dumka</h2>
              {!summaryData ? (
                <div className="loading-box">Loading Project Summary...</div>
              ) : (
                <div className="summary-split">
                  <div className="summary-column">
                    <div className="summary-section">
                      <h3>📄 Project Details</h3>
                      <div className="summary-item">
                        <span>Total Area</span>
                        <b className="value-highlight">{summaryData.total_land?.toFixed(2) ?? "37.12"} ha</b>
                      </div>
                      <div className="summary-item">
                        <span>Total Sites</span>
                        <b>{summaryData.insitu_data?.length ?? allSites.length ?? 12}</b>
                      </div>
                      <h3>📊 Monitoring & Data Collection</h3>
                      <div className="summary-item">
                        <span>Audio Devices Installed</span>
                        <b>{summaryData.audio_devices_installed ?? 0}</b>
                      </div>
                      <div className="summary-item">
                        <span>Audio Files</span>
                        <b>{summaryData.total_audiofiles ?? 0}</b>
                      </div>
                      <div className="summary-item">
                        <span>Unique Species Count</span>
                        <b className="value-highlight">{summaryData.insitu_species_count ?? 0}</b>
                      </div>
                    </div>
                  </div>

                  <div className="summary-column">
                    <div className="summary-section">
                      <h3>🌿 Ecosystem Health</h3>
                      <div className="summary-item">
                        <span>Habitat Health Index</span>
                        <b className="red">{summaryData.habitat_health?.toFixed(2) ?? 0}</b>
                      </div>
                      <div className="summary-item">
                        <span>Mean NDVI</span>
                        <b className="orange">{summaryData.mean_ndvi?.toFixed(3) ?? 0}</b>
                      </div>
                      <h3>🌱 Species Assemblage</h3>
                      <div className="summary-item">
                        <span>Mean Species Abundance</span>
                        <b className="red">{summaryData.mean_species_abundance?.toFixed(3) ?? 0}</b>
                      </div>
                      <h3>⚠ Threats</h3>
                      <div className="summary-item">
                        <span>Human Disturbance Index (HDI)</span>
                        <b className="green">{summaryData.hdi?.toFixed(3) ?? 0}</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Species Distribution Pie */}
            <div className="species-distribution-container">
              <div className="species-box">
                <h3>Species Distribution by Threat Level (In-Situ)</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie data={speciesChart} dataKey="value" nameKey="name" innerRadius={80} outerRadius={120}>
                      {speciesChart.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ACOUSTIC SECTION */}
            <div className="summary-card acoustic-card">
              <div className="acoustic-header">
                <h3>Acoustic Index Analysis - {getSiteName(selectedSite)}</h3>
                {combinedSites.length > 1 && (
                  <div className="site-select-wrapper">
                    <h3 className="site-label">Sites</h3>
                    <select
                      className="site-select"
                      value={selectedSiteIndex}
                      onChange={(e) => {
                        setSelectedSiteIndex(Number(e.target.value));
                        setSelectedIndex("All");
                      }}
                    >
                      {combinedSites.map((site, idx) => (
                        <option key={site.site_id || idx} value={idx}>
                          {getSiteName(site)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="index-select-wrapper">
                <select className="index-select" value={selectedIndex} onChange={(e) => setSelectedIndex(e.target.value)}>
                  {indicesOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis dataKey="hour" interval={1} angle={0} textAnchor="middle" height={50} tick={{ fontSize: 11, fill: "#888" }}
                    label={{ value: "Time of Day", position: "insideBottom", offset: -10, fontSize: 12, fill: "#888" }} />
                  <YAxis domain={[0, 1.25]} ticks={[0, 0.25, 0.50, 0.75, 1.00, 1.25]} tickFormatter={(v) => v.toFixed(2)}
                    tick={{ fontSize: 11, fill: "#888" }}
                    label={{ value: "Normalized Value (0-1)", angle: -90, position: "insideLeft", offset: -5, style: { textAnchor: "middle", fontSize: 12, fill: "#888" } }} />
                  <Tooltip formatter={(value, name) => [Number(value).toFixed(3), name]} labelFormatter={(label) => `Time: ${label}`} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: "12px", fontSize: "13px" }} />

                  {(selectedIndex === "All" || selectedIndex === "ACI") && <Line type="linear" dataKey="ACI" stroke={indexColors.ACI} strokeWidth={1.8} dot={true} activeDot={{ r: 5 }} />}
                  {(selectedIndex === "All" || selectedIndex === "BI") && <Line type="linear" dataKey="BI" stroke={indexColors.BI} strokeWidth={1.8} dot={true} activeDot={{ r: 5 }} />}
                  {(selectedIndex === "All" || selectedIndex === "ADI") && <Line type="linear" dataKey="ADI" stroke={indexColors.ADI} strokeWidth={1.8} dot={true} activeDot={{ r: 5 }} />}
                  {(selectedIndex === "All" || selectedIndex === "AEI") && <Line type="linear" dataKey="AEI" stroke={indexColors.AEI} strokeWidth={1.8} dot={true} activeDot={{ r: 5 }} />}
                  {(selectedIndex === "All" || selectedIndex === "NDSI") && <Line type="linear" dataKey="NDSI" stroke={indexColors.NDSI} strokeWidth={1.8} dot={true} activeDot={{ r: 5 }} />}
                </LineChart>
              </ResponsiveContainer>
              <p className="acoustic-footer">
                Acoustic indices over time (hourly) - Normalized (0-1) | Site: <strong>{getSiteName(selectedSite)}</strong>
              </p>
            </div>
            {/* ==================== SPECIES ACTIVITY TREND ANALYSIS ==================== */}
                <div className="summary-card" style={{ marginTop: "30px" }}>
                  <div className="species-trend-header">
                    <h3 style={{ margin: 0 }}>Species Activity Trend Analysis</h3>
                    
                    <div className="species-controls">
                      {/* Site Dropdown */}
                      {combinedSites.length > 1 && (
                        <div className="control-group">
                          <span className="control-label">Site:</span>
                          <select
                            className="site-select"
                            value={selectedSpeciesSiteIndex}
                            onChange={(e) => {
                              setSelectedSpeciesSiteIndex(Number(e.target.value));
                              setSelectedSpeciesFilter("All");
                            }}
                          >
                            {combinedSites.map((site, idx) => (
                              <option key={site.site_id || idx} value={idx}>
                                {getSiteName(site)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Species Filter Dropdown */}
                      <div className="control-group">
                        <span className="control-label">Species:</span>
                        <select
                          className="site-select species-filter-select"
                          value={selectedSpeciesFilter}
                          onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
                        >
                          <option value="All">All Species</option>
                          {siteSpeciesList.map((species) => (
                            <option key={species} value={species}>
                              {species}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={filteredSpeciesTrendData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                      
                      <XAxis
                        dataKey="time"
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 11, fill: "#555" }}
                        label={{ 
                          value: "Time of Day", 
                          position: "insideBottom", 
                          offset: -15, 
                          fontSize: 13, 
                          fill: "#555" 
                        }}
                      />
                      
                      <YAxis
                        domain={[0, "auto"]}
                        tickCount={7}
                        tick={{ fontSize: 11, fill: "#555" }}
                        label={{ 
                          value: "Activity Level (Detections)", 
                          angle: -90, 
                          position: "insideLeft", 
                          offset: -10, 
                          style: { textAnchor: "middle", fontSize: 13, fill: "#555" } 
                        }}
                      />

                      <Tooltip
                        formatter={(value, name) => [value, name]}
                        labelFormatter={(label) => `Time: ${label}`}
                        contentStyle={{ 
                          background: "#fff", 
                          border: "1px solid #ddd", 
                          borderRadius: "6px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                        }}
                      />

                      {/* Lines */}
                      {filteredSpeciesKeys.map((species, i) => (
                        <Line
                          key={species}
                          type="linear"
                          dataKey={species}
                          stroke={getColor(i)}
                          strokeWidth={2.5}
                          dot={{ r: 2.5, strokeWidth: 1 }}
                          activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2.5 }}
                          name={species}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Custom Legend */}
                  <div className="species-legend-container">
                    <div className="species-legend-grid">
                      {filteredSpeciesKeys.map((species, i) => (
                        <div key={species} className="species-legend-item">
                          <div
                            className="species-color-dot"
                            style={{ backgroundColor: getColor(i) }}
                          />
                          <span className="species-name">{species}</span>
                        </div>
                      ))}
                    </div>

                    {filteredSpeciesKeys.length > 24 && (
                      <div className="legend-scroll-hint">
                        Scroll horizontally or vertically to see more species ↓
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default BiodiversityDashboard;