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
  <div className="transport-review-list">
    {requests.map((listing) => {
      const tv = listing.transportVerification || {};

      return (
        <div
          key={listing._id}
          className="transport-review-card"
        >
          <div className="transport-review-header">
            <div>
              <h2>{listing.title}</h2>

              <p>
                <strong>Owner:</strong>{" "}
                {listing.ownerId?.name || "Unknown"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {listing.ownerId?.email || "-"}
              </p>
            </div>

            <span className="transport-status pending">
              {tv.verificationStatus}
            </span>
          </div>

          <div className="transport-review-grid">

            <div>
              <strong>Submitted</strong>
              <p>
                {tv.verificationSubmittedAt
                  ? new Date(
                      tv.verificationSubmittedAt
                    ).toLocaleString()
                  : "-"}
              </p>
            </div>

            <div>
              <strong>USDOT</strong>
              <p>{tv.usdotNumber || "-"}</p>
            </div>

            <div>
              <strong>MC Number</strong>
              <p>{tv.mcNumber || "-"}</p>
            </div>

            <div>
              <strong>Vehicle</strong>
              <p>
                {tv.vehicleMake || "-"}{" "}
                {tv.vehicleModel || ""}
              </p>
            </div>

          </div>

          <div className="transport-review-actions">
            <button className="btn-view">
              View Details
            </button>

            <button className="btn-approve">
              Approve
            </button>

            <button className="btn-reject">
              Reject
            </button>
          </div>
        </div>
      );
    })}
  </div>
)}

      </div>
    </main>
  );
}