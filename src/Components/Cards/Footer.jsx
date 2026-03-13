import React from "react";
import "../../Style/HomeStyle.css";
import { FaFacebookF, FaLinkedinIn, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-main">
        {/* Brand column */}
        <div className="footer-brand">
          <img src="/img/logo.png" alt="FIT Climate" />
          <div className="footer-brand-name">FIT Climate</div>
          <p className="footer-brand-desc">
            A digital MRV platform empowering Nature-based Solution projects
            across the globe — connecting farmers, data, and climate action.
          </p>
          <div className="footer-social">
            <a href="https://www.facebook.com/p/FCF-India-100093362305578/" target="_blank" rel="noopener noreferrer">
              <FaFacebookF />
            </a>
            <a href="https://www.linkedin.com/company/fcf-india/posts/?feedView=all" target="_blank" rel="noopener noreferrer">
              <FaLinkedinIn />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
          </div>
        </div>

        {/* Projects column */}
        <div className="footer-column">
          <h3>Projects</h3>
          <ul>
            <li><a href="#natureBasedSection">Nature-based Solutions</a></li>
            <li><a href="#natureBasedSection">Carbon Credits</a></li>
            <li><a href="#natureBasedSection">Agroforestry</a></li>
          </ul>
        </div>

        {/* Platform column */}
        <div className="footer-column">
          <h3>Platform</h3>
          <ul>
            <li>Dashboard</li>
            <li>Drone Explorer</li>
            <li>Project Summary</li>
            <li>Analytics</li>
          </ul>
        </div>

        {/* Company column */}
        <div className="footer-column">
          <h3>Company</h3>
          <ul>
            <li>About Us</li>
            <li>News &amp; Insights</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} FIT Climate. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
