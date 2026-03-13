import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../config";

const DroneExplorer = () => {
    const [coverage, setCoverage] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState("");
    const [map, setMap] = useState(null);
    const [activeLayer, setActiveLayer] = useState(null);
    const [activeRectangle, setActiveRectangle] = useState(null); // Added for red rectangle
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProject, setSelectedProject] = useState("");
    const mapContainer = useRef(null);

    // Fetch coverage data
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/drone-coverage`)
            .then((res) => res.json())
            .then((data) => setCoverage(data))
            .catch((err) => console.error("Error fetching drone coverage:", err));
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current || map) return;

        const leafletMap = L.map(mapContainer.current, {
            center: [20.9517, 85.0985], // Center of Odisha/India
            zoom: 13,
            zoomControl: false,
        });

        L.tileLayer("https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}", {
            maxZoom: 22,
            subdomains: ["mt0", "mt1", "mt2", "mt3"],
        }).addTo(leafletMap);

        L.control.zoom({ position: "bottomright" }).addTo(leafletMap);
        setMap(leafletMap);

        return () => {
            leafletMap.remove();
        };
    }, []); // Removed [map] dependency to prevent re-initialization error

    // Helper to parse XML bounding box and zoom levels
    const parseXmlBoundingBox = (xmlText, folder) => {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const bbox = xmlDoc.getElementsByTagName("BoundingBox")[0];

            if (!bbox) return null;

            const minLng = parseFloat(bbox.getAttribute("minx"));
            const minLat = parseFloat(bbox.getAttribute("miny"));
            const maxLng = parseFloat(bbox.getAttribute("maxx"));
            const maxLat = parseFloat(bbox.getAttribute("maxy"));

            const tileSets = xmlDoc.getElementsByTagName("TileSet");
            const zoomLevels = Array.from(tileSets).map(ts => parseInt(ts.getAttribute("order")));
            const minZoom = zoomLevels.length > 0 ? Math.max(12, Math.min(...zoomLevels)) : 12;
            const maxZoom = zoomLevels.length > 0 ? Math.max(...zoomLevels) : 22;

            return {
                folder,
                bounds: { minLat, minLng, maxLat, maxLng },
                minZoom,
                maxZoom
            };
        } catch (e) {
            console.error("XML Parse Error:", e);
            return null;
        }
    };

    const handleSelect = async (folder) => {
        setSelectedFolder(folder);
        if (!map || !folder) return;

        const selectedItem = coverage.find(c => c.folder === folder);
        if (!selectedItem) {
            console.error("Could not find coverage metadata for folder:", folder);
            return;
        }

        const projectCode = selectedItem.project_code;
        setSelectedProject(projectCode);
        console.log(`🛰️ Selected Project: ${projectCode}, Folder: ${folder}`);

        try {
            // Fetch XML for the specific folder (XML LOGIC)
            const xmlUrl = `${API_BASE_URL}/api/tiles/${projectCode}/${folder}/tilemapresource.xml`;
            const response = await fetch(xmlUrl);
            if (!response.ok) throw new Error(`Failed to fetch XML: ${response.status}`);

            const xmlText = await response.text();
            const item = parseXmlBoundingBox(xmlText, folder);

            if (!item) throw new Error("Could not parse XML bounding box");

            // Remove existing layer and rectangle
            if (activeLayer) {
                map.removeLayer(activeLayer);
            }
            if (activeRectangle) {
                map.removeLayer(activeRectangle);
            }

            // Add new Drone Tile Layer (SYNCED LOGIC: TMS=TRUE)
            const tileUrl = `${API_BASE_URL}/api/tiles/${projectCode}/${folder}/{z}/{x}/{y}.png`;
            const newLayer = L.tileLayer(tileUrl, {
                minZoom: item.minZoom || 12,
                maxZoom: item.maxZoom || 22,
                tms: true, // Switched to true per user snippet
                opacity: 1,
            }).addTo(map);

            setActiveLayer(newLayer);

            // Fly to bounds
            const bounds = L.latLngBounds(
                [item.bounds.minLat, item.bounds.minLng],
                [item.bounds.maxLat, item.bounds.maxLng]
            );
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });

            // Add Red Rectangle (SYNCED LOGIC: Red border, No fill)
            const rectangle = L.rectangle(bounds, {
                color: "#ff0000",
                weight: 1,
                fillOpacity: 0,
                fillColor: "#ff0000"
            }).addTo(map);
            setActiveRectangle(rectangle);

            // Update local state for stats display
            setCoverage(prev => {
                const index = prev.findIndex(c => c.folder === folder);
                if (index !== -1) {
                    const updated = [...prev];
                    updated[index] = { ...updated[index], ...item };
                    return updated;
                }
                return prev;
            });

        } catch (err) {
            console.error("Error loading drone patch:", err);
            alert("Error loading drone patch: " + err.message);
        }
    };

    const filteredCoverage = coverage.filter(item =>
        item.folder.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
            {/* HUD (Heads-Up Display) */}
            <div style={{
                position: "absolute",
                top: 20,
                left: 20,
                zIndex: 1000,
                width: 350,
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                padding: "20px",
                borderRadius: "15px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                border: "1px solid rgba(255,255,255,0.2)"
            }}>
                <h2 style={{ margin: "0 0 15px 0", color: "#2c3e50", fontSize: "1.2rem", fontWeight: 700 }}>🛸 Drone Explorer</h2>

                <div style={{ marginBottom: "15px" }}>
                    <input
                        type="text"
                        placeholder="Search drone patches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            fontSize: "0.9rem",
                            boxSizing: "border-box"
                        }}
                    />
                </div>

                <select
                    value={selectedFolder}
                    onChange={(e) => handleSelect(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        backgroundColor: "white",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        outline: "none"
                    }}
                >
                    <option value="">-- Select Drone Patch --</option>
                    {filteredCoverage.map((item, idx) => (
                        <option key={idx} value={item.folder}>
                            [{item.project_code || 'NbS-003'}] {item.folder.split('/').pop().replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>

                {selectedFolder && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: "20px", fontSize: "0.85rem", color: "#666", lineHeight: "1.6" }}
                    >
                        <div style={{ fontWeight: 600, color: "#27ae60", marginBottom: "5px" }}>✓ Dataset Loaded</div>
                        <div><strong>Project:</strong> {selectedProject}</div>
                        <div><strong>Folder:</strong> {selectedFolder.split('/').pop()}</div>
                        <div><strong>Zoom Range:</strong> {coverage.find(c => c.folder === selectedFolder)?.minZoom} - {coverage.find(c => c.folder === selectedFolder)?.maxZoom}</div>
                    </motion.div>
                )}

                <div style={{ marginTop: "20px", fontSize: "0.75rem", color: "#999", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                    Total Datasets Found: {coverage.length}
                </div>
            </div>

            {/* Map Container */}
            <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />

            {/* Back to Dashboard Button */}
            <a
                href="/dashboard"
                style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    zIndex: 1000,
                    background: "linear-gradient(135deg, #3498db, #2980b9)",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "30px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}
            >
                <span>←</span> Dashboard
            </a>
        </div>
    );
};

export default DroneExplorer;
