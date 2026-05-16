import React from "react";
import "./Terms.css";

export default function Terms() {
  React.useEffect(() => {
    document.title = "Terms of Service | HubEthio";
  }, []);

  return (
    <main className="terms-page">
      <div className="terms-container">
        <a href="/" className="terms-back">
          ← Back Home
        </a>

        <section className="terms-hero">
          <p className="terms-label">Legal</p>
          <h1>Terms of Service</h1>
          <p>Effective Date: May 2026</p>
        </section>

        <section className="terms-content">
          <p>
            By using HubEthio, you agree to these Terms of Service. Please read
            them carefully before using the website or app.
          </p>

          <h2>Platform Purpose</h2>
          <p>
            HubEthio provides a platform for discovering Ethiopian businesses,
            professionals, and community services across the United States.
          </p>

          <h2>User Responsibilities</h2>
          <ul>
            <li>Provide accurate and truthful information.</li>
            <li>Do not post misleading, harmful, or illegal content.</li>
            <li>Respect other users, businesses, and community members.</li>
            <li>Maintain the security of your account login information.</li>
          </ul>

          <h2>Business Listings</h2>
          <p>
            HubEthio may review, approve, reject, edit, suspend, or remove
            listings at its discretion to protect users and maintain platform
            quality.
          </p>

          <h2>Featured Listings</h2>
          <p>
            Featured listing payments are processed through Stripe. Promotional
            placement does not guarantee business results, customer traffic,
            revenue, or search ranking.
          </p>

          <h2>Reviews</h2>
          <p>
            Reviews must reflect honest user experiences. HubEthio reserves the
            right to remove abusive, fraudulent, spam, misleading, or unrelated
            reviews.
          </p>

          <h2>No Professional Advice</h2>
          <p>
            HubEthio does not provide legal, financial, medical, tax, immigration,
            or other professional advice. Users are responsible for evaluating
            and choosing businesses or service providers independently.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            HubEthio may include links, maps, payment tools, or services provided
            by third parties such as Stripe, Google Maps, or business websites.
            HubEthio is not responsible for third-party content or services.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            HubEthio is provided “as is” without warranties of any kind. To the
            fullest extent allowed by law, HubEthio is not liable for losses,
            damages, disputes, or issues arising from use of the platform or from
            interactions with listed businesses.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            These terms may be updated periodically. Continued use of HubEthio
            after changes means you accept the updated terms.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these Terms, contact us at{" "}
            <a href="mailto:support@hubethio.com">support@hubethio.com</a>.
          </p>
        </section>

        <footer className="terms-footer">
          © 2026 HubEthio. All rights reserved.
        </footer>
      </div>
    </main>
  );
}