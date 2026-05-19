import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-container">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <h2>HubEthio</h2>

            <p>
              Connecting Ethiopian businesses, professionals, and communities
              across the DMV area and beyond.
            </p>

            <div className="site-footer-social">
              <a
                href="https://www.facebook.com/officialhubethio/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                Facebook
              </a>

              <a
                href="https://www.tiktok.com/@hubethio"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
              >
                TikTok
              </a>

              <a
                href="https://www.instagram.com/hubethio"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                Instagram
              </a>

              <a
                href="https://www.youtube.com/@hubethio"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
              >
                YouTube
              </a>
            </div>
          </div>

          <div className="site-footer-columns">
            <div className="site-footer-column">
              <h3>Popular Cities</h3>

              <nav aria-label="Popular cities">
                <a href="/location/silver-spring-md">Silver Spring</a>
                <a href="/location/alexandria-va">Alexandria</a>
                <a href="/location/washington-dc">Washington DC</a>
                <a href="/location/falls-church-va">Falls Church</a>
                <a href="/location/arlington-va">Arlington</a>
              </nav>
            </div>

            <div className="site-footer-column">
              <h3>Business</h3>

              <nav aria-label="Business links">
                <a href="/pricing">Pricing</a>
                <a href="/submit">Submit Listing</a>
                <a href="/owner/login">Business Login</a>
                <a href="/contact">Contact</a>
              </nav>
            </div>

            <div className="site-footer-column">
              <h3>Legal</h3>

              <nav aria-label="Legal links">
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="/delete-data">Delete Data</a>
              </nav>
            </div>
          </div>
        </div>

        <div className="site-footer-bottom">
          <p>
            © 2026 HubEthio. All rights reserved. Built for the Ethiopian
            community.
          </p>
        </div>
      </div>
    </footer>
  );
}