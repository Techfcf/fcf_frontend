import React from "react";
import "../../Style/HomeStyle.css";

const features = [
  {
    icon: "🛰️",
    title: "Remote Sensing & GIS",
    desc: "Satellite imagery and geospatial analysis for precise land monitoring at scale.",
  },
  {
    icon: "🚁",
    title: "Drone Technology",
    desc: "Near real-time drone surveys capturing high-resolution field data.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Analysis",
    desc: "Machine learning algorithms for automated tree counting and biomass estimation.",
  },
  {
    icon: "📊",
    title: "Real-time Dashboard",
    desc: "Live data flow from the field to the database — verified and audit-ready.",
  },
];

const Card3 = () => {
  return (
    <section id="technologySection" className="dmrv-section">
      <div className="dmrv-inner">
        {/* Left: Text */}
        <div className="dmrv-text">
          <p className="section-label">Our Technology</p>
          <h2 className="section-heading">A state-of-the-art DMRV platform</h2>
          <p className="section-description">
            Enabling seamless carbon project monitoring utilizing near real-time
            data flow from field to database, powered by drone technology, GIS,
            Remote Sensing, and AI.
          </p>

          <div className="dmrv-features">
            {features.map((f, i) => (
              <div className="dmrv-feature" key={i}>
                <div className="dmrv-feature-icon">{f.icon}</div>
                <div>
                  <div className="dmrv-feature-title">{f.title}</div>
                  <div className="dmrv-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image */}
        <div className="dmrv-image">
          <img src="/img/demo1.png" alt="DMRV Platform Illustration" />

        </div>
      </div>
    </section>
  );
};

export default Card3;
