import React from "react";
import "../../Style/HomeStyle.css";

const values = [
  {
    icon: "⚖️",
    iconClass: "fair",
    title: "Fair",
    text: "We ensure fairness in every step of our climate projects, making sustainability equitable for all stakeholders.",
    number: "01",
  },
  {
    icon: "🤝",
    iconClass: "inclusive",
    title: "Inclusive",
    text: "Climate action must include everyone. We engage communities, women, and small farmers to empower and protect our planet.",
    number: "02",
  },
  {
    icon: "🔍",
    iconClass: "transparent",
    title: "Transparent",
    text: "Transparency is key. We share clear data and verifiable results, building trust through honesty in every project.",
    number: "03",
  },
];

const Card4 = () => {
  return (
    <section className="values-section">
      <div className="values-topbar">
        <div>
          <p className="section-label">Our Principles</p>
          <h2 className="section-heading">Built on three<br />core values</h2>
          <p className="section-description">
            Every decision we make is guided by these principles — ensuring
            genuine impact for farmers, communities, and the planet.
          </p>
        </div>
      </div>

      <div className="values-grid">
        {values.map((v, i) => (
          <div className="value-card" key={i}>
            <span className="value-number">{v.number}</span>
            <div className={`value-icon ${v.iconClass}`}>{v.icon}</div>
            <h3 className="value-title">{v.title}</h3>
            <p className="value-text">{v.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Card4;
