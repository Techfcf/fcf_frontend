import React, { useState } from 'react';
import { motion } from 'framer-motion';
import "../../Style/HomeStyle.css";

const Help = () => {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    { id: 1, question: "How do I navigate the dashboard?", answer: "Use the sidebar..." },
    { id: 2, question: "How do I filter data?", answer: "Use the filter controls..." },
    { id: 3, question: "What information is shown in farmer details?", answer: "Farmer details include..." },
    { id: 4, question: "How do I view project information?", answer: "Navigate to the Projects page..." },
    { id: 5, question: "What do the different status badges mean?", answer: "Status badges indicate..." },
    { id: 6, question: "How do I export data?", answer: "Currently, data export is under development..." }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="support-wrapper">
      <h1 className="support-heading">Help & Support</h1>
      <div className="support-layout">
        <div className="faq-block">
          <h2 className="faq-title">📋 Frequently Asked Questions</h2>
          {faqs.map((faq) => (
            <motion.div className="faq-box" key={faq.id}>
              <div className="faq-toggle" onClick={() => toggleFAQ(faq.id)}>
                {faq.question}
                <span>{expandedFAQ === faq.id ? '−' : '+'}</span>
              </div>
              {expandedFAQ === faq.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="faq-response">{faq.answer}</div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="support-contact">
          <h2 className="contact-title">📞 Contact Support</h2>
          <div className="contact-list">
            <div className="contact-entry">
              <div className="entry-icon">📧</div>
              <div className="entry-details">
                <div className="entry-label">Email Support</div>
                <div className="entry-value">spatel@fcfindia.in</div>
              </div>
            </div>
            <div className="contact-entry">
              <div className="entry-icon">📱</div>
              <div className="entry-details">
                <div className="entry-label">Phone Support</div>
                <div className="entry-value">+91 9097187284</div>
              </div>
            </div>
            <div className="contact-entry">
              <div className="entry-icon">💬</div>
              <div className="entry-details">
                <div className="entry-label">Live Chat</div>
                <div className="entry-value">Available 24/7</div>
              </div>
            </div>
            <div className="contact-entry">
              <div className="entry-icon">📖</div>
              <div className="entry-details">
                <div className="entry-label">Documentation</div>
                <div className="entry-value">docs.fcfindia.com</div>
              </div>
            </div>
          </div>

          <div className="tip-box">
            <h3 className="tip-title">🚀 Quick Tips</h3>
            <ul className="tip-list">
              <li>Use keyboard shortcuts: Esc to close panels</li>
              <li>Click outside panels to close them</li>
              <li>Hover over land parcels for preview</li>
              <li>Use filters to narrow down data</li>
              <li>Check project status regularly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
