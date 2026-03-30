import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  ZoomControl
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "../../Style/ClimateAction.css";
import { getProjectSites } from "../../api/ClimateApi";

// ==================== Marker ====================
const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// ==================== Basemaps ====================
const basemaps = {
  Streets: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"]
  },
  Satellite: {
    url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"]
  }
};

// ==================== WKT PARSER ====================
const parsePoint = (wkt) => {
  if (!wkt) return null;
  try {
    const coords = wkt.match(/\(([^)]+)\)/)[1].split(" ");
    return [parseFloat(coords[1]), parseFloat(coords[0])];
  } catch {
    return null;
  }
};

const parsePolygon = (wkt) => {
  if (!wkt) return [];

  try {
    let clean = wkt;

    if (wkt.startsWith("MULTIPOLYGON")) {
      clean = wkt
        .replace("MULTIPOLYGON(((", "")
        .replace(")))", "");
    } else {
      clean = wkt
        .replace("POLYGON ((", "")
        .replace("POLYGON((", "")
        .replace("))", "");
    }

    return clean
      .split(",")
      .map((pair) => {
        const [lng, lat] = pair.trim().split(" ");
        return [parseFloat(lat), parseFloat(lng)];
      })
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));
  } catch (err) {
    console.error("Polygon parse error:", err, wkt);
    return [];
  }
};

// ==================== Fit Bounds ====================
const FitBounds = ({ sites }) => {
  const map = useMap();

  useEffect(() => {
    if (!sites.length) return;

    let bounds = [];

    sites.forEach((site) => {
      const center = parsePoint(site.centroid_wkt);
      const polygon = parsePolygon(
        site.boundary || site.boundary_wkt || site.polygon || site.geom
      );

      if (center) bounds.push(center);
      if (polygon.length) bounds = bounds.concat(polygon);
    });

    if (bounds.length) {
      map.fitBounds(bounds, {
        padding: [80, 80],
        animate: true,
        duration: 1.5
      });
    }
  }, [sites, map]);

  return null;
};

// ==================== Zoom Handler ====================
const ZoomHandler = ({ setZoom }) => {
  const map = useMap();

  useEffect(() => {
    setZoom(map.getZoom());

    const handleZoom = () => {
      setZoom(map.getZoom());
    };

    map.on("zoomend", handleZoom);

    return () => map.off("zoomend", handleZoom);
  }, [map, setZoom]);

  return null;
};

// ==================== MAIN ====================
const ClimateDashboard = () => {
  const [expanded, setExpanded] = useState(true);
  const [selectedBasemap, setSelectedBasemap] = useState("Satellite");
  const [sites, setSites] = useState([]);
  const [zoom, setZoom] = useState(13);
  const [loading, setLoading] = useState(true);

  const currentMap = basemaps[selectedBasemap];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProjectSites();
        setSites(data?.sites || data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="layout">
      <div className="main-content">
        <div className="map-container">
          {/* Basemap Selector */}
          <div className="basemap-box">
            <select
              value={selectedBasemap}
              onChange={(e) => setSelectedBasemap(e.target.value)}
            >
              {Object.keys(basemaps).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>

          <MapContainer
            center={[24.4, 87.33]}
            zoom={13}
            minZoom={5}
            maxZoom={20}
            zoomControl={false}
            className="map"
          >
            <ZoomControl position="bottomright" />

            <TileLayer
              url={currentMap.url}
              subdomains={currentMap.subdomains}
            />

            <ZoomHandler setZoom={setZoom} />
            <FitBounds sites={sites} />

            {!loading &&
              sites.map((site, i) => {
                const center = parsePoint(site.centroid_wkt);
                const polygon = parsePolygon(
                  site.boundary ||
                    site.boundary_wkt ||
                    site.polygon ||
                    site.geom
                );

                return (
                  <React.Fragment key={i}>
                    {/* Marker */}
                    {center && (
                      <Marker position={center} icon={blueIcon}>
                        <Popup>
                          <div className="popup-card">
                            <h3>{site.site_name}</h3>
                            <p><b>Area:</b> {site.area?.toFixed(3)} ha</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Polygon */}
                    {zoom >= 12 && polygon.length > 0 && (
                      <Polygon
                        positions={polygon}
                        pathOptions={{
                          color: "green",
                          fillOpacity: 0.3,
                          weight: 2
                        }}
                        eventHandlers={{
                          mouseover: (e) =>
                            e.target.setStyle({ fillOpacity: 0.6 }),
                          mouseout: (e) =>
                            e.target.setStyle({ fillOpacity: 0.3 })
                        }}
                      >
                        <Popup>
                          <div className="popup-card">
                            <div className="popup-row">
                              <span>🌱 Site</span>
                              <b>{site.site_name}</b>
                            </div>

                            <div className="popup-row">
                              <span>📐 Area</span>
                              <b>{site.area?.toFixed(3)} ha</b>
                            </div>

                            <div className="popup-row">
                              <span>🌱 Env</span>
                              <b className="status success">
                                {site.env_analysis_status}
                              </b>
                            </div>

                            <div className="popup-row">
                              <span>🌿 Bio</span>
                              <b className="status success">
                                {site.bio_analysis_status}
                              </b>
                            </div>

                            <div className="popup-row">
                              <span>🌍 Carbon</span>
                              <b
                                className={
                                  site.carbon_analysis_enabled
                                    ? "status success"
                                    : "status off"
                                }
                              >
                                {site.carbon_analysis_enabled
                                  ? "Enabled"
                                  : "Disabled"}
                              </b>
                            </div>

                            <div className="popup-footer">
                              📅{" "}
                              {new Date(site.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </Popup>
                      </Polygon>
                    )}
                  </React.Fragment>
                );
              })}
          </MapContainer>

          {loading && <div className="loader">Loading map data...</div>}
        </div>
      </div>
    </div>
  );
};

export default ClimateDashboard;