import React from "react";
import "./Contact.css";

export default function Contact() {
  React.useEffect(() => {
    document.title = "Contact | HubEthio";
  }, []);

  return (
    <main className="contact-page">
      <div className="contact-container">
        <a href="/" className="contact-back">
          ← Back Home
        </a>

        <section className="contact-hero">
          <p className="contact-label">HubEthio Support</p>
          <h1>Contact HubEthio</h1>
          <p>
            We’re here to help users, business owners, and community members
            connect with the right Ethiopian services across the United States.
          </p>
        </section>

        <section className="contact-grid">
          <div className="contact-card">
            <h2>Customer Support</h2>
            <p>
              Have a question about using HubEthio or finding a business?
              Contact our support team.
            </p>
            <a href="mailto:support@hubethio.com">support@hubethio.com</a>
          </div>

          <div className="contact-card">
            <h2>Business Inquiries</h2>
            <p>
              For featured listings, partnerships, advertising, or business
              account questions.
            </p>
            <a href="mailto:business@hubethio.com">business@hubethio.com</a>
          </div>

          <div className="contact-card">
            <h2>Report Listing Issue</h2>
            <p>
              Found incorrect phone numbers, addresses, categories, or business
              details? Let us know so we can review it.
            </p>
            <a href="mailto:support@hubethio.com">Report an issue</a>
          </div>

          <div className="contact-card">
            <h2>Response Time</h2>
            <p>
              We typically respond within 1–2 business days. Please include as
              much detail as possible so we can help faster.
            </p>
          </div>
        </section>

        <section className="contact-community">
          <h2>Built for the Ethiopian community</h2>
          <p>
            HubEthio is dedicated to helping Ethiopian businesses, professionals,
            and families connect with trusted services in their local area.
          </p>
        </section>

        <footer className="contact-footer">
          © 2026 HubEthio. All rights reserved.
        </footer>
      </div>
    </main>
  );
}