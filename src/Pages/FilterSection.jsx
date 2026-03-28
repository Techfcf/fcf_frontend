import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../../src/Style/FilterSection.css";
import { API_BASE_URL } from "../config";
import clientData from "../data/clientDemoData.json";

const FilterSection = ({ onFilterChange, selectedProjectCode, onProjectNameChange, userRole }) => {

  const [farmers, setFarmers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [filters, setFilters] = useState({
    project_code: "All",
    state: "All",
    district: "All",
    blocks: "All",
    grampanchayat: "All",
    village: "All",
    drone_survey: "All",
  });

  const [totals, setTotals] = useState({
    total_farmers: 0,
    total_parcels: 0,
    total_area_ha: 0,
    total_area_acres: 0,
  });

  const [totalsLoading, setTotalsLoading] = useState(false);
  const [totalsError, setTotalsError] = useState("");


  // LOAD PROJECT LIST FOR NAME MATCH
  useEffect(() => {
    if (userRole === "client") {
      setProjects([clientData.project]);
      return;
    }
    fetch(`${API_BASE_URL}/api/projects`)
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("Projects API Error:", err));
  }, [userRole]);

  // WHEN PROJECT CODE COMES FROM OUTSIDE (DROPDOWN)
  useEffect(() => {
    if (selectedProjectCode) {
      const updated = {
        project_code: selectedProjectCode,
        state: "All",
        district: "All",
        blocks: "All",
        grampanchayat: "All",
        village: "All",
      };

      setFilters(updated);
      onFilterChange(updated);

      // Send project name to Navbar
      const found = projects.find(
        (p) => p.project_id === selectedProjectCode
      );

      onProjectNameChange(found ? found.project_name : "");
    }
  }, [selectedProjectCode, projects]);


  // LOAD FARMERS LIST
  useEffect(() => {
    if (userRole === "client") {
      setFarmers(clientData.farmers);
      return;
    }
    let url = `${API_BASE_URL}/api/farmers`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setFarmers(data))
      .catch((err) => console.error("Farmers API Error:", err));
  }, [filters.project_code, userRole]);


  // GET UNIQUE FILTER LISTS
  const getUnique = (key, dependsOn = []) => {
    let filtered = farmers;

    if (filters.project_code !== "All") {
      filtered = filtered.filter((f) => f.project_code === filters.project_code);
    }

    dependsOn.forEach(([k, v]) => {
      if (v !== "All") filtered = filtered.filter((f) => f[k] === v);
    });

    return ["All", ...new Set(filtered.map((f) => f[key]).filter(Boolean))];
  };


  // FETCH TOTALS FROM API
  useEffect(() => {
    if (filters.project_code === "All") {
      setTotals({
        total_farmers: 0,
        total_parcels: 0,
        total_area_ha: 0,
        total_area_acres: 0,
      });
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
      const tArea = filtered.reduce((sum, f) => sum + parseFloat(f.area_ha || 0), 0);
      const tAcres = filtered.reduce((sum, f) => sum + parseFloat(f.area_acres || 0), 0);
      setTotals({
        total_farmers: filtered.length,
        total_parcels: filtered.length,
        total_area_ha: tArea,
        total_area_acres: tAcres
      });
      return;
    }

    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "All") query.append(key, value);
    });

    const url = `${API_BASE_URL}/api/farmers/total-area?${query.toString()}`;

    setTotalsLoading(true);
    setTotalsError("");

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTotals({
          total_farmers: data.total_farmers ?? 0,
          total_parcels: data.total_parcels ?? 0,
          total_area_ha: data.total_area_ha ?? 0,
          total_area_acres: data.total_area_acres ?? 0,
        });
      })
      .catch(() => setTotalsError("Failed to load totals"))
      .finally(() => setTotalsLoading(false));
  }, [filters, userRole]);


  // HANDLE FILTER CHANGE
  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };

      // RESET CHILD FILTERS
      if (field === "project_code") {
        newFilters.state = "All";
        newFilters.district = "All";
        newFilters.blocks = "All";
        newFilters.grampanchayat = "All";
        newFilters.village = "All";

        // SEND PROJECT NAME → NAVBAR
        const found = projects.find((p) => p.project_id === value);
        onProjectNameChange(found ? found.project_name : "");
      }

      if (field === "state") {
        newFilters.district = "All";
        newFilters.blocks = "All";
        newFilters.grampanchayat = "All";
        newFilters.village = "All";
      } else if (field === "district") {
        newFilters.blocks = "All";
        newFilters.grampanchayat = "All";
        newFilters.village = "All";
      } else if (field === "blocks") {
        newFilters.grampanchayat = "All";
        newFilters.village = "All";
      } else if (field === "grampanchayat") {
        newFilters.village = "All";
      }

      onFilterChange(newFilters);
      return newFilters;
    });
  };



  // RESET FILTERS
  const resetFilters = () => {
    const reset = {
      project_code: "All",
      state: "All",
      district: "All",
      blocks: "All",
      grampanchayat: "All",
      village: "All",
      drone_survey: "All",
    };
    setFilters(reset);
    onFilterChange(reset);
    onProjectNameChange(""); // clear navbar text
  };


  // PROJECT SELECT LIST
  const allProjects = ["All", ...new Set(farmers.map((f) => f.project_code))];


  return (
    <div className="filter-container">

      <div className="filter-row">

        <div className="filter-item">
          <motion.select
            disabled={JSON.parse(localStorage.getItem("auth_user") || "{}")?.role === "project_manager"}
            className="filter-select"
            value={filters.project_code}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onChange={(e) => handleFilterChange("project_code", e.target.value)}
          >
            {/* Show "All" option if needed, or remove it if strictly filtering by project */}
            <option value="All">All Projects</option>
            {projects.map((proj) => (
              <option key={proj.project_id} value={proj.project_id}>
                {proj.project_name} ({proj.project_id})
              </option>
            ))}
          </motion.select>
        </div>

        {/* STATE */}
        <div className="filter-item">
          <motion.select
            disabled={filters.project_code === "All"}
            className="filter-select"
            value={filters.state}
            onChange={(e) => handleFilterChange("state", e.target.value)}
          >
            {filters.project_code === "All"
              ? <option value="All">Select Project First</option>
              : getUnique("state").map((val) => (
                <option key={val} value={val}>
                  {val === "All" ? "State" : val}
                </option>
              ))}
          </motion.select>
        </div>

        {/* DISTRICT */}
        <div className="filter-item">
          <motion.select
            disabled={filters.project_code === "All"}
            className="filter-select"
            value={filters.district}
            onChange={(e) => handleFilterChange("district", e.target.value)}
          >
            {filters.project_code === "All"
              ? <option value="All">Select Project First</option>
              : getUnique("district", [["state", filters.state]]).map((val) => (
                <option key={val} value={val}>
                  {val === "All" ? "District" : val}
                </option>
              ))}
          </motion.select>
        </div>

        {/* BLOCKS */}
        <div className="filter-item">
          <motion.select
            disabled={filters.project_code === "All"}
            className="filter-select"
            value={filters.blocks}
            onChange={(e) => handleFilterChange("blocks", e.target.value)}
          >
            {filters.project_code === "All"
              ? <option value="All">Select Project First</option>
              : getUnique("blocks", [
                ["state", filters.state],
                ["district", filters.district],
              ]).map((val) => (
                <option key={val} value={val}>
                  {val === "All" ? "Blocks" : val}
                </option>
              ))}
          </motion.select>
        </div>

        {/* GRAM PANCHAYAT */}
        <div className="filter-item">
          <motion.select
            disabled={filters.project_code === "All"}
            className="filter-select"
            value={filters.grampanchayat}
            onChange={(e) =>
              handleFilterChange("grampanchayat", e.target.value)
            }
          >
            {filters.project_code === "All"
              ? <option value="All">Select Project First</option>
              : getUnique("grampanchayat", [
                ["state", filters.state],
                ["district", filters.district],
                ["blocks", filters.blocks],
              ]).map((val) => (
                <option key={val} value={val}>
                  {val === "All" ? "Gram Panchayat" : val}
                </option>
              ))}
          </motion.select>
        </div>

        {/* VILLAGE */}
        <div className="filter-item">
          <motion.select
            disabled={filters.project_code === "All"}
            className="filter-select"
            value={filters.village}
            onChange={(e) => handleFilterChange("village", e.target.value)}
          >
            {filters.project_code === "All"
              ? <option value="All">Select Project First</option>
              : getUnique("village", [
                ["state", filters.state],
                ["district", filters.district],
                ["blocks", filters.blocks],
                ["grampanchayat", filters.grampanchayat],
              ]).map((val) => (
                <option key={val} value={val}>
                  {val === "All" ? "Village" : val}
                </option>
              ))}
          </motion.select>
        </div>

        {/* DRONE IMAGE FILTER */}
        <div className="filter-item">
          <motion.select
            disabled={filters.project_code === "All"}
            className="filter-select"
            value={filters.drone_survey}
            onChange={(e) => handleFilterChange("drone_survey", e.target.value)}
          >
            <option value="All">Drone Image (All)</option>
            <option value="Yes">With Drone Image</option>
            <option value="No">Without Drone Image</option>
          </motion.select>
        </div>


      </div>

      {/* TOTAL DATA */}
      {filters.project_code !== "All" && (
        <div className="totals-row">
          <div className="total-card">
            Total Farmers: {totalsLoading ? "…" : totals.total_farmers}
          </div>
          <div className="total-card">
            Total Parcels: {totalsLoading ? "…" : totals.total_parcels}
          </div>
          <div className="total-card">
            Total Area:{" "}
            {totalsLoading
              ? "…"
              : `${Number(totals.total_area_ha).toFixed(2)} ha (${Number(
                totals.total_area_acres
              ).toFixed(2)} acres)`}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSection;
