import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "../../src/Style/FilterSection.css";
import { API_BASE_URL } from "../config";
import clientData from "../data/clientDemoData.json";
import { getWaterBodiesByType } from "../api/WaterBodyApi";

// --- HIERARCHY DEFINITION ---
const HIERARCHY_LEVELS = ["state", "district", "block", "grampanchayat", "village", "parcel"];

const MapContainer = ({ filters, onParcelSelect, activeDroneTileUrl, setActiveDroneTileUrl, userRole }) => {
  const [map, setMap] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null); // Store ALL fetched data

  const [markerClusterGroup, setMarkerClusterGroup] = useState(null);
  const [polygonLayer, setPolygonLayer] = useState(null);
  const [allLayers, setAllLayers] = useState([]);

  // Water Bodies State
  const [selectedWaterBodyTypes, setSelectedWaterBodyTypes] = useState([]); // Array of strings
  const [isWbMenuOpen, setIsWbMenuOpen] = useState(true);
  const [waterBodiesData, setWaterBodiesData] = useState([]);
  const connectionLinesLayerRef = useRef(null);
  const waterBodyLayerRef = useRef(null);

  const mapInitialized = useRef(false);

  // --- HELPER FUNCS ---

  const getCentroid = (coords) => {
    let latSum = 0, lngSum = 0, count = 0;

    const extractCoords = (array) => {
      if (typeof array[0] === 'number') {
        lngSum += array[0];
        latSum += array[1];
        count++;
      } else {
        array.forEach(extractCoords);
      }
    };
    extractCoords(coords);
    return count > 0 ? [latSum / count, lngSum / count] : [0, 0];
  };

  // --- INIT MAP ---
  useEffect(() => {
    if (mapInitialized.current) return;

    const mapContainer = document.querySelector("#map");
    if (mapContainer) {
      if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
        mapContainer.innerHTML = "";
      }

      const newMap = L.map("map", {
        center: [23.0225, 72.5714], // Default Center (India)
        zoom: 5,
        zoomControl: false // Custom controls if needed
      });

      L.control.zoom({ position: 'bottomright' }).addTo(newMap);

      L.tileLayer(
        "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
        { attribution: "&copy; Google", maxZoom: 22 }
      ).addTo(newMap);

      // Initialize marker cluster group with our custom styles
      const mcg = L.markerClusterGroup({
        maxClusterRadius: 80, // Slightly larger for better initial grouping
        disableClusteringAtZoom: 16, // At zoom 16, markers uncluster completely
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true, // MarkerCluster handles the zoom smoothly by default
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          const markers = cluster.getAllChildMarkers();
          let label = null;
          let subLabel = null;

          // Dynamically pick label depending on zoom level hierarchy
          if (markers.length > 0 && markers[0].feature) {
            const getProp = (key1, key2) => markers[0].feature.properties[key1] || markers[0].feature.properties[key2] || "";

            const z = newMap.getZoom();
            if (z < 7) {
              label = getProp('state', 'state');
              subLabel = "State";
            } else if (z >= 7 && z < 9) {
              label = getProp('district', 'district');
              subLabel = "District";
            } else if (z >= 9 && z < 11) {
              label = getProp('block', 'blocks');
              subLabel = "Block";
            } else if (z >= 11 && z < 13) {
              label = getProp('grampanchayat', 'gram_pan_chayat'); // Minor adjustment for variability
              subLabel = "Gram Panchayat";
            } else if (z >= 13) {
              label = getProp('village', 'village');
              subLabel = "Village";
            }
          }

          return L.divIcon({
            html: `
              <div style="width: 160px; display: flex; flex-direction: column; align-items: center;">
                <div style="
                  background: rgba(26, 92, 45, 0.95); 
                  border: 2px solid #F59E0B;
                  color: white; 
                  border-radius: 50%; 
                  width: 50px; height: 50px; 
                  display: flex; flex-direction: column; align-items: center; justify-content: center;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                  transition: transform 0.2s;
                  flex-shrink: 0;
                ">
                  <span style="font-weight: 800; font-family: Inter; font-size: 15px;">${count}</span>
                  <span style="font-size: 8px; font-family: Inter; text-transform: uppercase;">Parcels</span>
                </div>
                ${label ? `
                <div style="
                  background: rgba(255,255,255,0.95);
                  padding: 4px 8px;
                  border-radius: 4px;
                  margin-top: 6px;
                  font-family: Inter;
                  font-weight: 700;
                  font-size: 11px;
                  color: #0D1F13;
                  text-align: center;
                  white-space: nowrap;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                  ${label} <span style="color: #6B7280; font-weight: 500; font-size: 9px; display: block;">${subLabel}</span>
                </div>` : ''}
              </div>
            `,
            className: '',
            iconSize: [160, 100],
            iconAnchor: [80, 25]
          });
        }
      });

      // Handle cluster click for smooth fly-to effect
      mcg.on('clusterclick', (a) => {
        const bounds = a.layer.getBounds();
        if (bounds.isValid()) {
          newMap.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
        }
      });

      setMarkerClusterGroup(mcg);
      setMap(newMap);
      mapInitialized.current = true;
    }
  }, []);


  // --- FETCH API DATA ON FILTERS CHANGE ---
  useEffect(() => {
    if (!map) return;

    const queryParams = new URLSearchParams();
    let hasActiveFilters = false;

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value && value !== "All" && value.trim() !== "") {
        queryParams.append(key, value);
        hasActiveFilters = true;
      }
    });

    if (!hasActiveFilters) {
      clearAllLayers();
      setGeoJsonData(null);
      return;
    }

    if (userRole === "client") {
      let filtered = clientData.farmers;
      const checks = ["state", "district", "blocks", "grampanchayat", "village"];
      checks.forEach(k => {
        if (filters[k] && filters[k] !== "All") {
          filtered = filtered.filter(f => f[k] === filters[k]);
        }
      });

      const mockGeoJson = {
        type: "FeatureCollection",
        features: filtered.map(f => ({
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [f.lng - 0.0005, f.lat - 0.0005],
              [f.lng + 0.0005, f.lat - 0.0005],
              [f.lng + 0.0005, f.lat + 0.0005],
              [f.lng - 0.0005, f.lat + 0.0005],
              [f.lng - 0.0005, f.lat - 0.0005]
            ]]
          },
          properties: { ...f, drone_survey: "No" }
        }))
      };
      setGeoJsonData(mockGeoJson);
      return;
    }

    const apiUrl = `${API_BASE_URL}/api/farmers-with-land?${queryParams}`;

    fetch(apiUrl)
      .then(res => res.ok ? res.json() : null)
      .then(geojson => {
        if (!geojson || !geojson.features) return;
        setGeoJsonData(geojson);
      })
      .catch(console.error);

  }, [filters, map, userRole]);

  // --- RENDER CLUSTERS AND POLYGONS ---
  useEffect(() => {
    if (!map || !geoJsonData || !markerClusterGroup) return;

    // Clear previous
    clearAllLayers();

    const activeFeatures = geoJsonData.features;

    if (activeFeatures.length === 0) return;

    // 1. Build Individual Centroid Markers for the Cluster Group
    markerClusterGroup.clearLayers();

    activeFeatures.forEach((f, i) => {
      const centroid = getCentroid(f.geometry.coordinates);
      if (centroid[0] !== 0) {
        const villageName = f.properties?.village || "";

        // Per-feature icon with village name label below the pin
        const individualIcon = L.divIcon({
          html: `
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div style="
                background: #1A5C2D;
                border: 2px solid #F59E0B;
                color: white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                width: 30px; height: 30px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              ">
                <div style="
                  transform: rotate(45deg);
                  width: 8px; height: 8px;
                  background: white;
                  border-radius: 50%;
                "></div>
              </div>
              ${villageName ? `
              <div style="
                background: rgba(255,255,255,0.95);
                padding: 3px 7px;
                border-radius: 4px;
                margin-top: 5px;
                font-family: Inter, sans-serif;
                font-weight: 700;
                font-size: 10px;
                color: #0D1F13;
                text-align: center;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                max-width: 120px;
                overflow: hidden;
                text-overflow: ellipsis;
              ">
                ${villageName}
                <span style="color: #6B7280; font-weight: 500; font-size: 8px; display: block;">Village</span>
              </div>` : ''}
            </div>
          `,
          className: '',
          iconSize: [160, 75],
          iconAnchor: [15, 30]
        });

        const marker = L.marker(centroid, { icon: individualIcon });
        marker.feature = f; // Pass feature along so cluster can read properties!
        const pId = f.properties?.parcel_id || `idx-${i}`;

        // Let transparent markers trigger the click event just like polygons
        marker.on('click', (e) => {
          // Hide all currently visible tooltips
          document.querySelectorAll('.wb-line-label.visible').forEach(el => el.classList.remove('visible'));
          // Show this specific parcel's tooltip
          document.querySelectorAll(`.tooltip-parcel-${pId}`).forEach(el => el.classList.add('visible'));

          const p = f.properties || {};
          let dynamicTileUrl = p.drone_tile_url;
          if (typeof onParcelSelect === 'function') {
            onParcelSelect({
              parcelId: p.parcel_id,
              farmerId: p.farmer_id, name: p.farmer_name,
              state: p.state, district: p.district,
              blocks: p.blocks || p.block, grampanchayat: p.grampanchayat,
              village: p.village, project_code: p.project_code,
              areaHa: p.area_ha, areaAcres: p.area_ha ? Number(p.area_ha) * 2.47105 : undefined,
              drone_survey: p.drone_survey, drone_image_url: p.drone_image_url,
              drone_tile_url: dynamicTileUrl,
              plantation_year: p.plantation_year,
            });
          }
        });

        markerClusterGroup.addLayer(marker);
      }
    });

    // 2. Build the GeoJSON Polygon Layer once (Red Transparent)
    let featureIndex = 0;
    const newPolyLayer = L.geoJSON({ type: "FeatureCollection", features: activeFeatures }, {
      style: { color: "#ff0000", weight: 2, opacity: 1, fillOpacity: 0, fillColor: "#ff0000" },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const i = featureIndex++;
        const pId = p.parcel_id || `idx-${i}`;

        layer.on('click', () => {
          // Hide all currently visible tooltips
          document.querySelectorAll('.wb-line-label.visible').forEach(el => el.classList.remove('visible'));

          // Show this specific parcel's tooltip
          document.querySelectorAll(`.tooltip-parcel-${pId}`).forEach(el => el.classList.add('visible'));

          let dynamicTileUrl = p.drone_tile_url;
          if (typeof onParcelSelect === 'function') {
            onParcelSelect({
              parcelId: p.parcel_id,
              farmerId: p.farmer_id, name: p.farmer_name,
              state: p.state, district: p.district,
              blocks: p.blocks || p.block, grampanchayat: p.grampanchayat,
              village: p.village, project_code: p.project_code,
              areaHa: p.area_ha, areaAcres: p.area_ha ? Number(p.area_ha) * 2.47105 : undefined,
              drone_survey: p.drone_survey, drone_image_url: p.drone_image_url,
              drone_tile_url: dynamicTileUrl,
              plantation_year: p.plantation_year,
            });
          }
        });
        try { layer.getElement()?.classList.add('clickable-parcel'); } catch (_) { }
      }
    });

    // 3. Setup dynamic listening so polygons only appear closely zoomed
    setPolygonLayer(newPolyLayer);
    setAllLayers([markerClusterGroup, newPolyLayer]);

    const polygonRevealZoom = 15;

    const toggleLayers = () => {
      const z = map.getZoom();
      if (z >= polygonRevealZoom) {
        if (map.hasLayer(markerClusterGroup)) map.removeLayer(markerClusterGroup);
        if (!map.hasLayer(newPolyLayer)) map.addLayer(newPolyLayer);
      } else {
        if (map.hasLayer(newPolyLayer)) map.removeLayer(newPolyLayer);
        if (!map.hasLayer(markerClusterGroup)) map.addLayer(markerClusterGroup);
      }
    };

    // Run once immediately
    toggleLayers();

    // Listen to zoom
    map.on('zoomend', toggleLayers);

    // Cleanup listener on unmount/re-render
    return () => {
      map.off('zoomend', toggleLayers);
    };

  }, [geoJsonData, markerClusterGroup, map, filters]);

  // --- DRONE TILE LAYER ---
  useEffect(() => {
    if (!map) return;

    // Remove old drone layers
    map.eachLayer(l => {
      if (l.options && l.options.isDroneLayer) map.removeLayer(l);
    });

    if (activeDroneTileUrl) {
      const tileUrl = activeDroneTileUrl.startsWith("http") ? activeDroneTileUrl : `${API_BASE_URL}${activeDroneTileUrl}`;

      const droneLayer = L.tileLayer(tileUrl, {
        maxZoom: 22,
        minZoom: 12,
        tms: true, opacity: 1, isDroneLayer: true, zIndex: 1000
      }).addTo(map);

      setAllLayers(prev => [...prev, droneLayer]);
    }
  }, [activeDroneTileUrl, map]);

  // --- WATER BODIES LAYER ---
  useEffect(() => {
    if (!map || !window.L) return;

    const wbColors = {
      'BWA': '#1e90ff',        // Dodger Blue
      'DAM': '#ff8c00',        // Dark Orange
      'LIFT': '#9932cc',       // Dark Orchid
      'hydroLakes': '#20b2aa', // Light Sea Green
      'prasari': '#ff1493',    // Deep Pink
      'dumka': '#1e90ff'       // Dodger Blue
    };

    const fetchAndRenderWaterBodies = async () => {
      // Clear existing layer
      if (waterBodyLayerRef.current) {
        map.removeLayer(waterBodyLayerRef.current);
        waterBodyLayerRef.current = null;
      }

      if (!selectedWaterBodyTypes || selectedWaterBodyTypes.length === 0) {
        setWaterBodiesData([]);
        return;
      }

      try {
        // Fetch all selected types with current filters
        let { state, district } = filters;

        const allData = await Promise.all(
          selectedWaterBodyTypes.map(async (type) => {
            const data = await getWaterBodiesByType(type, state, district, filters.project_code);
            return data.map(item => ({ ...item, display_type: type }));
          })
        );

        const flattenedData = allData.flat();
        setWaterBodiesData(flattenedData); // Ensure connections can be drawn

        if (flattenedData.length === 0) return;

        const layer = L.geoJSON(flattenedData.map(item => ({
          type: "Feature",
          properties: item,
          geometry: item.geometry
        })), {
          style: (feature) => {
            const type = feature.properties.display_type;
            const color = wbColors[type] || "#3498db";
            return {
              color: color,
              weight: 2,
              fillOpacity: 0,
              fillColor: color
            };
          },
          pointToLayer: (feature, latlng) => {
            const type = feature.properties.display_type;
            const color = wbColors[type] || "#3498db";
            return L.circleMarker(latlng, {
              radius: 6,
              fillColor: color,
              color: "#fff",
              weight: 1,
              opacity: 1,
              fillOpacity: 0.8
            });
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            layer.bindPopup(`
              <div style="font-family: Inter, sans-serif; font-size: 13px;">
                <b>Type:</b> ${props.display_type}<br/>
                <b>District:</b> ${props.district || "N/A"}, ${props.state || ""}<br/>
              </div>
            `);
          }
        }).addTo(map);

        waterBodyLayerRef.current = layer;
      } catch (error) {
        console.error("Error fetching water bodies:", error);
      }
    };

    fetchAndRenderWaterBodies();

    // EFFECT CLEANUP: Ensure layer is removed when dependencies change
    return () => {
      if (waterBodyLayerRef.current && map) {
        map.removeLayer(waterBodyLayerRef.current);
        waterBodyLayerRef.current = null;
      }
    };
  }, [selectedWaterBodyTypes, map, filters]);

  // --- CONNECTION LINES TO NEAREST WATER BODY ---
  useEffect(() => {
    if (!map) return;

    // Clear previous lines
    if (connectionLinesLayerRef.current) {
      map.removeLayer(connectionLinesLayerRef.current);
      connectionLinesLayerRef.current = null;
    }

    if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) return;
    if (!waterBodiesData || waterBodiesData.length === 0) return;

    const wbColors = {
      'BWA': '#1e90ff',
      'DAM': '#ff8c00',
      'LIFT': '#9932cc',
      'hydroLakes': '#20b2aa',
      'prasari': '#ff1493',
      'dumka': '#ffff00' // Yellow for Nearest Waterbodies
    };

    const linesLayer = L.layerGroup();
    // Cap to 500 parcels to ensure UI remains responsive if data is massive
    const maxParcels = Math.min(geoJsonData.features.length, 500);

    for (let i = 0; i < maxParcels; i++) {
      const parcel = geoJsonData.features[i];
      if (!parcel.geometry || !parcel.geometry.coordinates) continue;

      const parcelCentroid = getCentroid(parcel.geometry.coordinates);
      if (parcelCentroid[0] === 0 && parcelCentroid[1] === 0) continue;

      const parcelLatLng = L.latLng(parcelCentroid[0], parcelCentroid[1]);

      // Find the nearest waterbody for each selected type separately
      const nearestPerType = {}; // e.g., { BWA: { latlng, dist }, DAM: ... }

      waterBodiesData.forEach(wb => {
        if (!wb.geometry || !wb.geometry.coordinates) return;

        const type = wb.display_type;
        if (!type) return;

        let wbCentroid = getCentroid(wb.geometry.coordinates);
        if (wbCentroid[0] === 0 && wbCentroid[1] === 0) return;

        const wbLatLng = L.latLng(wbCentroid[0], wbCentroid[1]);
        const dist = parcelLatLng.distanceTo(wbLatLng);

        if (!nearestPerType[type] || dist < nearestPerType[type].dist) {
          nearestPerType[type] = {
            latlng: wbLatLng,
            dist: dist,
            type: type
          };
        }
      });

      const pId = parcel.properties?.parcel_id || `idx-${i}`;
      const parcelClass = `tooltip-parcel-${pId}`;

      // Draw a line to the nearest of EACH type found
      const typesFound = Object.keys(nearestPerType);

      typesFound.forEach(type => {
        const targetWb = nearestPerType[type];
        const line = L.polyline([parcelLatLng, targetWb.latlng], {
          color: '#ffff00',    // Solid Yellow color for the line
          weight: 2,           // Thickness
          opacity: 0.9
        }).addTo(linesLayer);

        // Allow clicking the line itself to show the parcel's tooltip as well
        line.on('click', () => {
          document.querySelectorAll('.wb-line-label.visible').forEach(el => el.classList.remove('visible'));
          if (pId) document.querySelectorAll(`.${parcelClass}`).forEach(el => el.classList.add('visible'));
        });
      });

      // Bind the distances directly near the parcel instead of the names
      if (typesFound.length > 0) {
        const formatDistance = (m) => m < 1000 ? Math.round(m) + " m" : (m / 1000).toFixed(1) + " km";

        const labelHtml = typesFound.map(type => {
          const distText = formatDistance(nearestPerType[type].dist);
          return `<span style="color:#ff0000; padding:0 1px;">${distText}</span>`;
        }).join('<span style="color:#9CA3AF; font-weight:normal; margin: 0 3px;">|</span>');

        L.tooltip({
          permanent: true,
          direction: 'bottom',
          className: `wb-line-label ${parcelClass}`,
          offset: [0, 15] // Shift it slightly below the parcel rendering
        })
          .setLatLng(parcelLatLng)
          .setContent(labelHtml)
          .addTo(linesLayer);
      }
    }

    linesLayer.addTo(map);
    connectionLinesLayerRef.current = linesLayer;

    return () => {
      if (connectionLinesLayerRef.current && map) {
        map.removeLayer(connectionLinesLayerRef.current);
        connectionLinesLayerRef.current = null;
      }
    }
  }, [map, geoJsonData, waterBodiesData]);

  const clearAllLayers = () => {
    if (!map) return;
    if (polygonLayer && map.hasLayer(polygonLayer)) {
      map.removeLayer(polygonLayer);
    }
    if (markerClusterGroup && map.hasLayer(markerClusterGroup)) {
      map.removeLayer(markerClusterGroup);
      markerClusterGroup.clearLayers();
    }
    setPolygonLayer(null);
    setAllLayers([]);

    // Fallback: clear anything that isn't base Google satellite or drone layer
    map.eachLayer(layer => {
      if (layer.options && layer.options.attribution && layer.options.attribution.includes("Google")) return;
      if (layer._url === undefined && !layer.options?.isDroneLayer) {
        try { map.removeLayer(layer); } catch (e) { }
      }
    });

    if (waterBodyLayerRef.current) {
      map.removeLayer(waterBodyLayerRef.current);
      waterBodyLayerRef.current = null;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <style>{`
        .wb-line-label {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 6px rgba(0,0,0,0.15);
          border-radius: 4px;
          color: #1A5C2D;
          font-weight: 700;
          font-size: 11px !important;
          padding: 4px 6px !important;
          margin-top: -10px;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
        }

        .wb-line-label.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      {/* Floating Filter UI */}
      <div className="wb-floating-filters main-map-filters">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isWbMenuOpen ? "10px" : "0" }}>
          <div className="wb-filter-header" style={{ marginBottom: 0, color: 'red' }}>Water Bodies</div>
          <button
            type="button"
            onClick={() => setIsWbMenuOpen(!isWbMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#1A5C2D', padding: '0 0 0 10px', display: 'flex' }}
            title={isWbMenuOpen ? "Collapse" : "Expand"}
          >
            {isWbMenuOpen ? "▼" : "▲"}
          </button>
        </div>

        {isWbMenuOpen && (
          <div className="wb-filter-options">
            {[
              //{ id: 'BWA', label: 'BWA', color: '#1e90ff' },
              //{ id: 'DAM', label: 'DAM', color: '#ff8c00' },
              //{ id: 'LIFT', label: 'LIFT', color: '#9932cc' },
              //{ id: 'hydroLakes', label: 'HydroLakes', color: '#20b2aa' },
              //{ id: 'prasari', label: 'Prasari', color: '#ff1493' },
              { id: 'dumka', label: 'Nearest Waterbodies', color: '#1e90ff' }
            ].map(opt => (
              <label key={opt.id} className="wb-check-label">
                <span className="wb-color-block" style={{ backgroundColor: opt.color }}></span>
                <input
                  type="checkbox"
                  checked={selectedWaterBodyTypes.includes(opt.id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedWaterBodyTypes(prev =>
                      checked
                        ? [...prev, opt.id]
                        : prev.filter(t => t !== opt.id)
                    );
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
            {selectedWaterBodyTypes.length > 0 && (
              <button className="wb-clear-btn" onClick={() => setSelectedWaterBodyTypes([])}>Clear All</button>
            )}
          </div>
        )}
      </div>

      <div id="map" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default MapContainer;
/*const parcelLatLng = L.latLng(parcelCentroid[0], parcelCentroid[1]);
const wbLatLng = L.latLng(wbCentroid[0], wbCentroid[1]);

const dist = parcelLatLng.distanceTo(wbLatLng);
*/