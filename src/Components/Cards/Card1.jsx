import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../Style/HomeStyle.css";

const Card1 = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Animate counters
    const animateCounters = () => {
      const counters = document.querySelectorAll(".stat-number[data-target]");
      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute("data-target"));
        const duration = 2200;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          counter.textContent = Math.floor(current).toLocaleString();
        }, 16);
      });
    };
    setTimeout(animateCounters, 600);
  }, []);

  const scrollToProjects = () => {
    document.getElementById("natureBasedSection")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTechnology = () => {
    document.getElementById("technologySection")?.scrollIntoView({ behavior: "smooth" });
  };

  // ── TOP NAVBAR ──
  const [scrolled, setScrolled] = React.useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="hero">
      {/* Background Video */}
      <video className="background-video" autoPlay loop muted playsInline>
        <source src="/img/background.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="video-overlay" />

      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="landing-nav-logo" onClick={() => navigate("/")}>
          <img src="/img/logo.png" alt="FIT Climate" />
          <span>FIT Climate</span>
        </div>

        <div className="landing-nav-links">
          <button className="landing-nav-link" onClick={scrollToProjects}>
            Projects
          </button>
          <button className="landing-nav-link" onClick={scrollToTechnology}>
            Technology
          </button>
          <button
            className="landing-nav-link landing-nav-cta"
            onClick={() => navigate("/login")}
          >
            Login →
          </button>
        </div>
      </nav>

      {/* ── HERO CONTENT ── */}
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Digital MRV Platform for Carbon Projects
        </div>

        <h1 className="hero-title">
          <span className="fit-text">FIT</span>{" "}
          <span className="climate-text">Climate</span>
        </h1>

        <p className="hero-subtitle">
          Your end-to-end digital companion for Nature-based Solution projects —
          from field data to verified carbon credits.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-primary" onClick={scrollToProjects}>
            Explore Projects
          </button>
          <button className="btn-hero-secondary" onClick={() => navigate("/login")}>
            Access Dashboard
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number" data-target="11">0</span>
            <div className="stat-label">Active NbS Projects</div>
          </div>
          <div className="stat-card">
            <span className="stat-number" data-target="45000">0</span>
            <div className="stat-label">Farmers Partnered</div>
          </div>
          <div className="stat-card">
            <span className="stat-number" data-target="8900">0</span>
            <div className="stat-label">Hectares Managed</div>
          </div>
          <div className="stat-card">
            <span className="stat-number" data-target="3">0</span>
            <div className="stat-label">Countries</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <span>Scroll</span>
        <div className="scroll-line" />
      </div>
    </section>
  );
};

export default Card1;
