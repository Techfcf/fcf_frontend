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

  const getStatusClass = (status) => {
    if (status.includes('Monitoring')) return 'monitoring';
    if (status.includes('Harvesting')) return 'harvesting';
    if (status.includes('Sowing')) return 'sowing';
    if (status.includes('Growing')) return 'growing';
    return 'verified';
  };

  useEffect(() => {
    if (!farmer || !farmer.farmerId) return;
    setLoading(true);
    setError('');

    const detailsUrl = `${API_BASE_URL}/api/farmers/${encodeURIComponent(farmer.farmerId)}/details`;
    // Use parcel_id for precise tree inventory mapping
    const parcelId = farmer.parcelId || '';
    const parcelTreesUrl = parcelId
      ? `${API_BASE_URL}/api/parcel-trees/parcel/${encodeURIComponent(parcelId)}`
      : `${API_BASE_URL}/api/parcel-trees/project/${encodeURIComponent(farmer.project_code || '')}`;

    console.log('🔎 Fetching details URL:', detailsUrl);
    console.log('🌳 Fetching parcel trees URL:', parcelTreesUrl);

    Promise.all([
      fetch(detailsUrl).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
      fetch(parcelTreesUrl).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
    ])
      .then(([detailsData, parcelTreesData]) => {
        setDetails({
          documents: Array.isArray(detailsData.documents) ? detailsData.documents : [],
          income: Array.isArray(detailsData.income) ? detailsData.income : [],
          interviews: Array.isArray(detailsData.interviews) ? detailsData.interviews : [],
          species: Array.isArray(detailsData.species) ? detailsData.species : [],
          parcelTrees: Array.isArray(parcelTreesData) ? parcelTreesData : [],
          project: detailsData.project || null,
        });
      })
      .catch(() => setError('Failed to load details'))
      .finally(() => setLoading(false));
  }, [farmer]);

  const getSpeciesInfo = (speciesId) => {
    const species = details.species.find((s) => s.species_id === speciesId);
    return species || null;
  };

  if (!farmer) return null;

  const name = farmer.name || 'N/A';
  const totalTreeCount = details.parcelTrees.reduce((sum, pt) => sum + (parseInt(pt.count) || 0), 0);

  return (
    <AnimatePresence>
      <_motion.div
        className="panel-container visible"
        initial={{ right: -400 }}
        animate={{ right: 0 }}
        exit={{ right: -400 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
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



          {/* 🌾 Land & Plantation Details */}
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

              ].map(([label, value], i) => (
                <React.Fragment key={i}>
                  <div className="grid-label">{label}:</div>
                  <div className="grid-value">{(value ?? 'N/A') || 'N/A'}</div>
                </React.Fragment>
              ))}
            </div>

            {/* ✅ NEW: Drone Map Section (Button or Status) */}
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
                    letterSpacing: '0.5px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>🛰️</span>
                  {activeDroneTileUrl ? 'Close Drone Image' : 'Open Drone Image on Map'}
                </button>
              </div>
            ) : (
              <div
                style={{
                  marginTop: 15,
                  padding: '16px',
                  backgroundColor: '#fff9e6',
                  border: '1px solid #ffe699',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⏳</span>
                  <span style={{ color: '#856404', fontWeight: 'bold', fontSize: '14px' }}>Drone Imagery: Under Process</span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '11px',
                  color: '#997404',
                  textAlign: 'center',
                  lineHeight: '1.4'
                }}>
                  Field survey completed. High-resolution orthomosaic is being processed and will be available shortly.
                </p>
              </div>
            )}

          </div>

          {/* 🌳 Tree Inventory */}
          <div className="detail-section">
            <h3 className="section-title section-title--accent">Tree Inventory</h3>
            {loading ? (
              <div style={{ color: '#6c757d', fontSize: 12 }}>Loading tree data…</div>
            ) : error ? (
              <div style={{ color: '#b02a37', fontSize: 12 }}>{error}</div>
            ) : details.parcelTrees.length === 0 ? (
              <div style={{ color: '#6c757d', fontSize: 12 }}>No tree inventory data available</div>
            ) : (
              <>
                <div
                  className="detail-item"
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 6,
                  }}
                >
                  <span className="detail-label" style={{ fontWeight: 'bold', fontSize: 14 }}>
                    Total Trees:
                  </span>
                  <span
                    className="detail-value"
                    style={{ fontWeight: 'bold', fontSize: 14, color: '#28a745' }}
                  >
                    {totalTreeCount.toLocaleString()}
                  </span>
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {details.parcelTrees.map((pt, idx) => {
                    const speciesInfo = getSpeciesInfo(pt.species_id);
                    return (
                      <div
                        key={pt.tree_inventory_id || idx}
                        style={{
                          marginBottom: 10,
                          padding: 8,
                          backgroundColor: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: 4,
                        }}
                      >
                        <div className="grid-details" style={{ fontSize: 12 }}>
                          {[
                            ['Parcel ID', pt.parcel_id],
                            ['Species ID', pt.species_id],
                            ['Species Name', speciesInfo?.species_name || 'N/A'],
                            ['Scientific Name', speciesInfo?.species_scientific_name || 'N/A'],
                            ['Tree Origin', pt.tree_origin],
                            ['Count', pt.count],
                            ['Source', pt.source],
                            [
                              'Last Updated',
                              pt.last_updated ? new Date(pt.last_updated).toLocaleDateString() : 'N/A',
                            ],
                          ].map(([label, value], i) => (
                            <React.Fragment key={i}>
                              <div className="grid-label" style={{ fontSize: 11 }}>
                                {label}:
                              </div>
                              <div className="grid-value" style={{ fontSize: 11 }}>
                                {value || 'N/A'}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 📄 Documents */}
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
                    ) : (
                      'N/A'
                    )}
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

