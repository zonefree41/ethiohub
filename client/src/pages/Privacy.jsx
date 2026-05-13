import React from "react";

export default function Privacy() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 20,
        lineHeight: 1.7,
      }}
    >
      <a href="/">← Back Home</a>

      <h1 style={{ marginTop: 20 }}>
        Privacy Policy
      </h1>

      <p>
        Effective Date: May 2026
      </p>

      <p>
        HubEthio respects your privacy and is committed to
        protecting your personal information.
      </p>

      <h2>Information We Collect</h2>

      <p>
        We may collect:
      </p>

      <ul>
        <li>Name and contact information</li>
        <li>Business listing information</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>Payment information through Stripe</li>
        <li>Usage analytics and review activity</li>
      </ul>

      <h2>How We Use Information</h2>

      <ul>
        <li>Provide and improve HubEthio services</li>
        <li>Display business listings publicly</li>
        <li>Process featured listing payments</li>
        <li>Communicate with business owners</li>
        <li>Prevent fraud and abuse</li>
      </ul>

      <h2>Payments</h2>

      <p>
        Payments are securely processed by Stripe. HubEthio
        does not store full credit card information.
      </p>

      <h2>Business Listings</h2>

      <p>
        Information submitted in business listings may be
        publicly visible on the HubEthio platform.
      </p>

      <h2>Third-Party Services</h2>

      <p>
        HubEthio may use third-party services including:
      </p>

      <ul>
        <li>Stripe</li>
        <li>Cloudinary</li>
        <li>Google Maps</li>
        <li>Analytics providers</li>
      </ul>

      <h2>Data Security</h2>

      <p>
        We take reasonable measures to protect user
        information and platform security.
      </p>

      <h2>Contact</h2>

      <p>
        For privacy questions, contact:
      </p>

      <p>
        support@hubethio.com
      </p>

      <hr style={{ margin: "40px 0" }} />

      <p style={{ color: "#666" }}>
        © 2026 HubEthio. All rights reserved.
      </p>
    </main>
  );
}