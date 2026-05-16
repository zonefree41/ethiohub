import React from "react";
import "./Privacy.css";

export default function Privacy() {
  React.useEffect(() => {
    document.title = "Privacy Policy | HubEthio";
  }, []);

  return (
    <main className="privacy-page">
      <div className="privacy-container">
        <a href="/" className="privacy-back">
          ← Back Home
        </a>

        <section className="privacy-hero">
          <p className="privacy-label">Privacy</p>
          <h1>Privacy Policy</h1>
          <p>Effective Date: May 2026</p>
        </section>

        <section className="privacy-content">
          <p>
            HubEthio respects your privacy and is committed to protecting your
            personal information. This Privacy Policy explains what information
            we collect, how we use it, and how users and business owners can
            contact us with privacy questions.
          </p>

          <h2>Information We Collect</h2>
          <p>We may collect the following types of information:</p>

          <ul>
            <li>Name and contact information.</li>
            <li>Email address and phone number.</li>
            <li>Business listing information submitted by owners.</li>
            <li>Business images, logos, descriptions, addresses, and websites.</li>
            <li>Review activity, ratings, and comments submitted by users.</li>
            <li>Payment-related information processed through Stripe.</li>
            <li>Usage analytics, device information, and platform activity.</li>
          </ul>

          <h2>How We Use Information</h2>
          <ul>
            <li>Provide, operate, and improve HubEthio services.</li>
            <li>Display business listings publicly on the platform.</li>
            <li>Process featured listing payments and subscriptions.</li>
            <li>Communicate with business owners and users.</li>
            <li>Review listings, prevent fraud, and protect platform safety.</li>
            <li>Improve search, categories, recommendations, and user experience.</li>
          </ul>

          <h2>Business Listings</h2>
          <p>
            Information submitted for business listings may be publicly visible
            on HubEthio, including business name, category, phone number,
            address, website, images, descriptions, and other listing details.
          </p>

          <h2>Reviews and User Content</h2>
          <p>
            Reviews, ratings, names entered with reviews, and comments may be
            visible to other users. HubEthio may remove reviews that appear
            abusive, fraudulent, spam, misleading, or unrelated.
          </p>

          <h2>Payments</h2>
          <p>
            Payments are securely processed by Stripe. HubEthio does not store
            full credit card numbers. Stripe may collect and process payment
            information according to its own privacy and security policies.
          </p>

          <h2>Third-Party Services</h2>
          <p>HubEthio may use third-party services, including:</p>

          <ul>
            <li>Stripe for payment processing.</li>
            <li>Cloudinary for image upload and hosting.</li>
            <li>Google Maps for maps and location display.</li>
            <li>Hosting, database, analytics, and security providers.</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect
            user information and platform security. However, no internet-based
            service can guarantee complete security.
          </p>

          <h2>Data Retention</h2>
          <p>
            We may retain information as long as needed to operate HubEthio,
            maintain business records, comply with legal obligations, resolve
            disputes, prevent abuse, and improve the platform.
          </p>

          <h2>Account and Data Deletion</h2>
          <p>
            Users and business owners may request account or data deletion by
            contacting us. Some information may be retained when required for
            legal, security, fraud-prevention, or business record purposes.
          </p>

          <h2>Children’s Privacy</h2>
          <p>
            HubEthio is not intended for children under 13. We do not knowingly
            collect personal information from children under 13.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. Continued use of
            HubEthio after updates means you accept the revised policy.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy questions, contact us at{" "}
            <a href="mailto:support@hubethio.com">support@hubethio.com</a>.
          </p>
        </section>

        <footer className="privacy-footer">
          © 2026 HubEthio. All rights reserved.
        </footer>
      </div>
    </main>
  );
}