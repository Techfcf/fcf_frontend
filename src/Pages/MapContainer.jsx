import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "../../src/Style/FilterSection.css";
import { API_BASE_URL } from "../config";

// --- HIERARCHY DEFINITION ---
const HIERARCHY_LEVELS = ["state", "district", "block", "grampanchayat", "village", "parcel"];

const MapContainer = ({ filters, onParcelSelect, activeDroneTileUrl, setActiveDroneTileUrl }) => {
  const [map, setMap] = useState(null);
  const [geoJsonData, setGeoJsonData] = useState(null); // Store ALL fetched data

  const [markerClusterGroup, setMarkerClusterGroup] = useState(null);
  const [polygonLayer, setPolygonLayer] = useState(null);
  const [allLayers, setAllLayers] = useState([]);
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

    const apiUrl = `${API_BASE_URL}/api/farmers-with-land?${queryParams}`;

    fetch(apiUrl)
      .then(res => res.ok ? res.json() : null)
      .then(geojson => {
        if (!geojson || !geojson.features) return;
        setGeoJsonData(geojson);
      })
      .catch(console.error);

  }, [filters, map]);

  // --- RENDER CLUSTERS AND POLYGONS ---
  useEffect(() => {
    if (!map || !geoJsonData || !markerClusterGroup) return;

    // Clear previous
    clearAllLayers();

    const activeFeatures = geoJsonData.features;

    if (activeFeatures.length === 0) return;

    // 1. Build Individual Centroid Markers for the Cluster Group
    markerClusterGroup.clearLayers();

    activeFeatures.forEach(f => {
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

        // Let transparent markers trigger the click event just like polygons
        marker.on('click', (e) => {
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
            });
          }
        });

        markerClusterGroup.addLayer(marker);
      }
    });

    // 2. Build the GeoJSON Polygon Layer once (Red Transparent)
    const newPolyLayer = L.geoJSON({ type: "FeatureCollection", features: activeFeatures }, {
      style: { color: "#ff0000", weight: 2, opacity: 1, fillOpacity: 0, fillColor: "#ff0000" },
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        layer.on('click', () => {
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

    // Initial load/Filter change: auto-fit to data bounds if they exist and are valid
    try {
      if (activeFeatures.length > 0) {
        const tempGroup = L.featureGroup(markerClusterGroup.getLayers());
        const leafBounds = tempGroup.getBounds();
        if (leafBounds.isValid()) {
          map.flyToBounds(leafBounds, { padding: [60, 60], duration: 1.5, maxZoom: 14 });
        }
      }
    } catch (e) {
      console.error("Map fitBounds failed:", e);
    }

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
      const tileUrl = activeDroneTileUrl.startsWith("http") ? activeDroneTileUrl : `http://localhost:5002${activeDroneTileUrl}`;

      const droneLayer = L.tileLayer(tileUrl, {
        maxZoom: 22,
        minZoom: 12,
        tms: true, opacity: 1, isDroneLayer: true, zIndex: 1000
      }).addTo(map);

      setAllLayers(prev => [...prev, droneLayer]);
    }
  }, [activeDroneTileUrl, map]);

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
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
    </div>
  );
};

export default MapContainer;