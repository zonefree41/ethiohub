import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        <div className="site-footer-brand">
          <h2>HubEthio</h2>
          <p>Connecting Ethiopian businesses and communities.</p>
        </div>

        <nav className="site-footer-links" aria-label="Footer navigation">
          <a href="/location/silver-spring-md">Silver Spring</a>
<a href="/location/alexandria-va">Alexandria</a>
<a href="/location/washington-dc">Washington DC</a>
          <a href="/pricing">Pricing</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/contact">Contact</a>
          <a href="/delete-data">Delete Data</a>
          <a href="/owner/login">Business Login</a>
        </nav>

        <p className="site-footer-copy">
          © 2026 HubEthio. All rights reserved.
        </p>
      </div>
    </footer>
  );
}