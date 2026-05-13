import React from "react";

export default function Contact() {
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
        Contact HubEthio
      </h1>

      <p>
        We’d love to hear from you.
      </p>

      <h2>Customer Support</h2>

      <p>
        Email: support@hubethio.com
      </p>

      <h2>Business Inquiries</h2>

      <p>
        For featured listings, partnerships, or advertising:
      </p>

      <p>
        business@hubethio.com
      </p>

      <h2>Community Support</h2>

      <p>
        HubEthio is dedicated to helping Ethiopian businesses
        and communities connect across the United States.
      </p>

      <h2>Response Time</h2>

      <p>
        We typically respond within 1–2 business days.
      </p>

      <hr style={{ margin: "40px 0" }} />

      <p style={{ color: "#666" }}>
        © 2026 HubEthio. All rights reserved.
      </p>
    </main>
  );
}