import React, { useEffect, useState } from 'react';
import { motion as _motion, AnimatePresence } from 'framer-motion';
import '../../src/Style/MainStyle.css';
import { API_BASE_URL } from '../config';

const FarmerDetailPanel = ({ farmer, onClose, activeDroneTileUrl, onDroneTileToggle }) => {
  const [details, setDetails] = useState({
    documents: [],
    income: [],
    interviews: [],
    species: [],
    parcelTrees: [],
    project: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!farmer) return;

    // ✅ farmer object me jo bhi key ho — sab try karo
    const farmerId =
      farmer.farmerId ||
      farmer.farmer_id ||
      farmer.FarmerId ||
      farmer.FARMER_ID ||
      farmer.id ||
      null;

    // Debug — console me dekho kya aa raha hai
    console.log('🧑‍🌾 Full farmer object:', JSON.stringify(farmer, null, 2));
    console.log('🆔 Resolved farmerId:', farmerId);

    if (!farmerId) {
      console.error('❌ farmerId could not be resolved from farmer object!');
      setError('Farmer ID not found. Please check data mapping.');
      return;
    }

    setLoading(true);
    setError('');

    // ─────────────────────────────────────────────────────────
    // API 1: Farmer details (documents, income, interviews etc.)
    // ─────────────────────────────────────────────────────────
    const detailsUrl = `${API_BASE_URL}/api/farmers/${encodeURIComponent(farmerId)}/details`;
    console.log('🔎 Details URL:', detailsUrl);

    const fetchDetails = fetch(detailsUrl).then((res) => {
      if (!res.ok) throw new Error(`Farmer details HTTP ${res.status}`);
      return res.json();
    });

    // ─────────────────────────────────────────────────────────
    // API 2: Tree inventory via farmer_id
    //   Backend does: farmer_data → land_parcels → parcel_tree_data → tree_species_data
    //   No parcel_id needed on frontend
    // ─────────────────────────────────────────────────────────
    const treesUrl = `${API_BASE_URL}/api/parcel-trees/farmer/${encodeURIComponent(farmerId)}`;
    console.log('🌳 Trees URL:', treesUrl);

    const fetchTrees = fetch(treesUrl).then((res) => {
      if (!res.ok) throw new Error(`Trees HTTP ${res.status}`);
      return res.json();
    });

    Promise.all([fetchDetails, fetchTrees])
      .then(([detailsData, treesData]) => {
        console.log('✅ detailsData:', detailsData);
        console.log('✅ treesData:', treesData);

        setDetails({
          documents: Array.isArray(detailsData.documents) ? detailsData.documents : [],
          income: Array.isArray(detailsData.income) ? detailsData.income : [],
          interviews: Array.isArray(detailsData.interviews) ? detailsData.interviews : [],
          species: Array.isArray(detailsData.species) ? detailsData.species : [],
          parcelTrees: Array.isArray(treesData) ? treesData : [],
          project: detailsData.project || null,
        });
      })
      .catch((err) => {
        console.error('❌ Fetch error:', err);
        setError('Failed to load details. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [farmer]);

  if (!farmer) return null;

  const name = farmer.name || farmer.farmer_name || 'N/A';

  // ✅ Group by species_id, sum counts across all parcels of this farmer
  const groupedTrees = Object.values(
    details.parcelTrees.reduce((acc, pt) => {
      const key = String(pt.species_id ?? pt.species_name ?? 'unknown');
      if (!acc[key]) {
        acc[key] = {
          species_id: pt.species_id || 'N/A',
          species_name: pt.species_name || 'N/A',
          species_scientific_name: pt.species_scientific_name || 'N/A',
          plantation_year: pt.plantation_year || 'N/A',
          count: 0,
        };
      }
      acc[key].count += parseInt(pt.count) || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  const totalTreeCount = groupedTrees.reduce((sum, pt) => sum + pt.count, 0);

  return (
    <AnimatePresence>
      <_motion.div
        className="panel-container visible"
        initial={{ right: -400 }}
        animate={{ right: 0 }}
        exit={{ right: -400 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* ── Header ── */}
        <div className="panel-header">
          <h2 className="panel-title">Farmer Detail</h2>
          <_motion.button
            className="close-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
          >
            ×
          </_motion.button>
        </div>

        <div className="panel-content">

          {/* ── 🌾 Land & Plantation Details ── */}
          <div className="detail-section">
            <h3 className="section-title section-title--accent">Land & Plantation Details</h3>
            <div className="grid-details">
              <span className="detail-label">Farmer Name:</span>
              <span className="detail-value">{name}</span>

              {[
                ['Project', farmer.project_code],
                ['State', farmer.state],
                ['District', farmer.district],
                ['Block', farmer.blocks],
                ['Grampanchayat', farmer.grampanchayat],
                ['Village', farmer.village],
                ['Area (ha)', farmer.areaHa ? Number(farmer.areaHa).toFixed(2) : undefined],
                ['Area (acres)', farmer.areaAcres ? Number(farmer.areaAcres).toFixed(2) : undefined],
                ['Plantation Year', farmer.plantation_year],
              ].map(([label, value], i) => (
                <React.Fragment key={i}>
                  <div className="grid-label">{label}:</div>
                  <div className="grid-value">{value ?? 'N/A'}</div>
                </React.Fragment>
              ))}
            </div>

            {/* ✅ Drone Map Toggle */}
            {farmer.drone_tile_url ? (
              <div style={{ marginTop: 15 }}>
                <button
                  onClick={() => onDroneTileToggle(activeDroneTileUrl ? null : farmer.drone_tile_url)}
                  className="drone-button"
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: activeDroneTileUrl ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)',
                    fontSize: '14px',
                    letterSpacing: '0.5px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🛰️</span>
                  {activeDroneTileUrl ? 'Close Drone Image' : 'Open Drone Image on Map'}
                </button>
              </div>
            ) : (
              <div style={{
                marginTop: 15,
                padding: '16px',
                backgroundColor: '#fff9e6',
                border: '1px solid #ffe699',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⏳</span>
                  <span style={{ color: '#856404', fontWeight: 'bold', fontSize: '14px' }}>
                    Drone Imagery: Under Process
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#997404', textAlign: 'center', lineHeight: '1.4' }}>
                  Field survey completed. High-resolution orthomosaic is being processed and will be available shortly.
                </p>
              </div>
            )}
          </div>

          {/* ── 🌳 Tree Inventory ── */}
          <div className="detail-section">
            <h3 className="section-title section-title--accent">Tree Inventory</h3>

            {loading ? (
              <div style={{ color: '#6c757d', fontSize: 12, padding: '8px 0' }}>
                Loading tree data…
              </div>
            ) : error ? (
              <div style={{ color: '#b02a37', fontSize: 12, padding: '8px 0' }}>{error}</div>
            ) : groupedTrees.length === 0 ? (
              <div style={{
                padding: '14px',
                backgroundColor: '#f8f9fa',
                border: '1px dashed #ced4da',
                borderRadius: 8,
                fontSize: 12,
                color: '#6c757d',
                textAlign: 'center',
              }}>
                🌱 No tree inventory data available for this farmer
              </div>
            ) : (
              <>
                {/* Total trees badge */}
                <div style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  backgroundColor: '#f0fff4',
                  border: '1px solid #b7ebc0',
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: 13, color: '#1a5c2a' }}>
                    🌳 Total Trees
                  </span>
                  <span style={{ fontWeight: 'bold', fontSize: 16, color: '#28a745' }}>
                    {totalTreeCount.toLocaleString()}
                  </span>
                </div>

                {/* Species breakdown */}
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {groupedTrees.map((pt, idx) => (
                    <div key={idx} style={{
                      marginBottom: 8,
                      padding: '10px 12px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 6,
                    }}>
                      <div className="grid-details" style={{ fontSize: 12 }}>
                        {[
                          ['Species ID', pt.species_id],
                          ['Species Name', pt.species_name],
                          ['Scientific Name', pt.species_scientific_name],
                          ['Count', pt.count],
                          ['Plantation Year', pt.plantation_year],
                        ].map(([label, value], i) => (
                          <React.Fragment key={i}>
                            <div className="grid-label" style={{ fontSize: 11 }}>{label}:</div>
                            <div className="grid-value" style={{ fontSize: 11 }}>
                              {value !== undefined && value !== null && value !== '' ? value : 'N/A'}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── 📄 Documents ── */}
          <div className="detail-section">
            <h3 className="section-title">Documents</h3>
            {loading ? (
              <div style={{ color: '#6c757d', fontSize: 12 }}>Loading…</div>
            ) : error ? (
              <div style={{ color: '#b02a37', fontSize: 12 }}>{error}</div>
            ) : details.documents.length === 0 ? (
              <div style={{ color: '#6c757d', fontSize: 12 }}>No documents</div>
            ) : (
              details.documents.map((d) => (
                <div className="detail-item" key={d.document_id}>
                  <span className="detail-label">{d.document_type}</span>
                  <span className="detail-value" style={{ overflowWrap: 'anywhere' }}>
                    {d.file_path ? (
                      <a className="doc-link" href={d.file_path} target="_blank" rel="noopener noreferrer">
                        Open document
                      </a>
                    ) : 'N/A'}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      </_motion.div>
    </AnimatePresence>
  );
};

export default FarmerDetailPanel;
