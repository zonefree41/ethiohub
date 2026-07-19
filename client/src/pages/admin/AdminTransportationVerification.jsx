import React from "react";
import { apiGet } from "../../api/http.js";
import "./AdminTransportationVerification.css";
import "./AdminTransportationVerification.css";

export default function AdminTransportationVerification() {
    const token = localStorage.getItem("adminToken");

const [requests, setRequests] = React.useState([]);
const [loading, setLoading] = React.useState(true);
const [error, setError] = React.useState("");

React.useEffect(() => {
  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(
        "/api/admin/transportation-verification",
        token
      );

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  loadRequests();
}, []);

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-container">

        <header className="admin-dashboard-hero">
          <div>
            <a
              href="/admin/dashboard"
              className="admin-dashboard-back"
            >
              ← Back to Dashboard
            </a>

            <p className="admin-dashboard-label">
              HubEthio Admin
            </p>

            <h1>Transportation Verification</h1>

            <p>
              Review transportation verification requests submitted
              by business owners.
            </p>
          </div>
        </header>

        {loading && (
  <section className="admin-dashboard-state">
    <div className="admin-dashboard-spinner"></div>
    <h2>Loading verification requests...</h2>
    <p>Please wait while the requests are loaded.</p>
  </section>
)}

{!loading && error && (
  <section className="admin-dashboard-error">
    Error: {error}
  </section>
)}

{!loading && !error && requests.length === 0 && (
  <section className="admin-dashboard-state">
    <h2>No verification requests yet</h2>
    <p>
      Pending transportation verification requests will appear here.
    </p>
  </section>
)}

{!loading && !error && requests.length > 0 && (
  <section className="admin-dashboard-state">
    <h2>{requests.length} verification request(s) found</h2>
    <p>
      The submitted transportation businesses are ready for admin review.
    </p>
  </section>
)}

      </div>
    </main>
  );
}