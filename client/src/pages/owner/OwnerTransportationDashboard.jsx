import React from "react";
import { apiGet } from "../../api/http.js";
import "./OwnerTransportationDashboard.css";

export default function OwnerTransportationDashboard() {
  const token = localStorage.getItem("ownerToken");

  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [selectedRequest, setSelectedRequest] = React.useState(null);

  React.useEffect(() => {
    document.title = "Transportation Requests | HubEthio";
  }, []);

  React.useEffect(() => {
    async function loadRequests() {
      if (!token) {
        window.location.href = "/owner/login";
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/transportation-requests/owner",
          token
        );

        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.message || "Failed to load transportation requests."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [token]);

  function logout() {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerUser");
    window.location.href = "/";
  }

  function formatDate(value) {
    if (!value) return "N/A";

    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const newCount = requests.filter(
  (request) => request.status === "New"
).length;

const quotedCount = requests.filter(
  (request) => request.status === "Quoted"
).length;

const acceptedCount = requests.filter(
  (request) => request.status === "Accepted"
).length;

const inProgressCount = requests.filter(
  (request) => request.status === "In Progress"
).length;

const completedCount = requests.filter(
  (request) => request.status === "Completed"
).length;

const filteredRequests =
  selectedStatus === "All"
    ? requests
    : requests.filter(
        (request) => request.status === selectedStatus
      );

  return (
    <main className="owner-transport-page">
      <div className="owner-transport-container">
        <header className="owner-transport-header">
          <div>
            <a
              href="/owner/dashboard"
              className="owner-transport-back"
            >
              ← Back to Owner Dashboard
            </a>

            <p className="owner-transport-label">
              Transportation Workspace
            </p>

            <h1>🚚 Transportation Requests</h1>

            <p>
              Review customer requests and manage transportation jobs.
            </p>
          </div>

          <button type="button" onClick={logout}>
            Logout
          </button>
        </header>

        {error && (
          <div className="owner-transport-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="owner-transport-state">
            <h2>Loading requests...</h2>
            <p>Please wait while we load your transportation requests.</p>
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="owner-transport-empty">
            <h2>No transportation requests yet</h2>
            <p>
              New customer quote requests will appear here.
            </p>
          </div>
        )}

        {!loading && (
  <section className="owner-transport-summary">

    <div
  className={`owner-summary-card ${
    selectedStatus === "All" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("All")}
>
  <span>📋</span>
  <strong>{requests.length}</strong>
  <p>All</p>
</div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "New" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("New")}
>
  <span>🟢</span>
  <strong>{newCount}</strong>
  <p>New</p>
</div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "Accepted" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("Accepted")}
>
  <span>✅</span>
  <strong>{acceptedCount}</strong>
  <p>Accepted</p>
</div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "In Progress" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("In Progress")}
>
      <span>🚚</span>
      <strong>{inProgressCount}</strong>
      <p>In Progress</p>
    </div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "Completed" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("Completed")}
>
      <span>🏁</span>
      <strong>{completedCount}</strong>
      <p>Completed</p>
    </div>
  </section>
)}

        {!loading && requests.length > 0 && (
          <section className="owner-transport-grid">
            {filteredRequests.map((request) => (
              <article
                key={request._id}
                className="owner-transport-card"
              >
                <div className="owner-transport-card-top">
                  <div>
                    <p className="owner-transport-service">
                      {request.serviceType || "Transportation Service"}
                    </p>

                    <h2>{request.customerName}</h2>
                  </div>

                  <span className="owner-transport-status">
                    {request.status || "New"}
                  </span>
                </div>

                <div className="owner-transport-route">
                  <p>
                    <strong>Pickup:</strong>{" "}
                    {request.pickupAddress}
                  </p>

                  <p>
                    <strong>Delivery:</strong>{" "}
                    {request.deliveryAddress}
                  </p>
                </div>

                <div className="owner-transport-details">
                  <p>
                    <strong>Business:</strong>{" "}
                    {request.listingId?.title || "N/A"}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {formatDate(request.requestedDate)}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {request.requestedTime || "Not specified"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {request.customerPhone}
                  </p>
                </div>

                <button
  type="button"
  onClick={() => setSelectedRequest(request)}
>
  View Details
</button>
              </article>
            ))}
          </section>

        )}

         {selectedRequest && (
          <div className="owner-transport-modal-overlay">
            <div className="owner-transport-modal">
              <div className="owner-transport-modal-header">
                <div>
                  <p className="owner-transport-modal-label">
                    Transportation Request
                  </p>

                  <h2>{selectedRequest.customerName}</h2>
                </div>

                <button
                  type="button"
                  className="owner-transport-modal-close"
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close request details"
                >
                  ×
                </button>
              </div>

              <div className="owner-transport-modal-body">
                <p>Request details will appear here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
  