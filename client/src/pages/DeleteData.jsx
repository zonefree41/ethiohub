import React from "react";
import "./DeleteData.css";

export default function DeleteData() {
  React.useEffect(() => {
    document.title = "Data Deletion Request | HubEthio";
  }, []);

  return (
    <main className="delete-data-page">
      <div className="delete-data-container">
        <a href="/" className="delete-data-back">
          ← Back Home
        </a>

        <section className="delete-data-hero">
          <p className="delete-data-label">Privacy Request</p>
          <h1>Data Deletion Request</h1>
          <p>
            HubEthio users and business owners may request deletion of personal
            data associated with their account, review, or business listing.
          </p>
        </section>

        <section className="delete-data-content">
          <h2>What data can be deleted?</h2>

          <ul>
            <li>Business owner account information.</li>
            <li>Business listing details.</li>
            <li>Uploaded logo or banner images.</li>
            <li>Contact information submitted to HubEthio.</li>
            <li>Reviews submitted by users, where applicable.</li>
          </ul>

          <h2>How to request deletion</h2>

          <p>
            To request deletion of your data, email us at{" "}
            <a href="mailto:support@hubethio.com">support@hubethio.com</a>.
          </p>

          <p>Please include:</p>

          <ul>
            <li>The email address used for your HubEthio account.</li>
            <li>The business listing name, if applicable.</li>
            <li>A short description of the data you want deleted.</li>
          </ul>

          <h2>Processing time</h2>

          <p>
            We will review and process valid deletion requests within a
            reasonable time, typically within 30 days.
          </p>

          <h2>Important note</h2>

          <p>
            Some information may be retained when required for legal, security,
            fraud prevention, payment, tax, dispute resolution, or compliance
            purposes.
          </p>

          <h2>Contact</h2>

          <p>
            For questions about data deletion, contact us at{" "}
            <a href="mailto:support@hubethio.com">support@hubethio.com</a>.
          </p>
        </section>

        <footer className="delete-data-footer">
          © 2026 HubEthio. All rights reserved.
        </footer>
      </div>
    </main>
  );
}