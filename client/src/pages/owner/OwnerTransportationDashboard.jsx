import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import "./OwnerTransportationDashboard.css";

export default function OwnerTransportationDashboard() {
  const token = localStorage.getItem("ownerToken");

  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [modalStatus, setModalStatus] = React.useState("New");

  const [quoteAmount, setQuoteAmount] = React.useState("");
const [estimatedArrival, setEstimatedArrival] = React.useState("");
const [ownerNotes, setOwnerNotes] = React.useState("");

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

                  <span
  className={`owner-transport-status status-${(
    request.status || "New"
  )
    .toLowerCase()
    .replace(/\s+/g, "-")}`}
>
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
  onClick={() => {
    setSelectedRequest(request);
    setModalStatus(request.status || "New");
  }}
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
  <div className="owner-transport-modal-section">
    <h3>Customer Information</h3>

    <p>
      <strong>Name:</strong>{" "}
      {selectedRequest.customerName || "Not provided"}
    </p>

    <p>
      <strong>Phone:</strong>{" "}
      {selectedRequest.customerPhone || "Not provided"}
    </p>

    <p>
      <strong>Email:</strong>{" "}
      {selectedRequest.customerEmail || "Not provided"}
    </p>
  </div>

  <div className="owner-transport-modal-section">
    <h3>Transportation Details</h3>

    <p>
      <strong>Service:</strong>{" "}
      {selectedRequest.serviceType || "Not specified"}
    </p>

    <p>
      <strong>Pickup:</strong>{" "}
      {selectedRequest.pickupAddress || "Not provided"}
    </p>

    <p>
      <strong>Delivery:</strong>{" "}
      {selectedRequest.deliveryAddress || "Not provided"}
    </p>

    <p>
      <strong>Requested Date:</strong>{" "}
      {formatDate(selectedRequest.requestedDate)}
    </p>

    <p>
      <strong>Requested Time:</strong>{" "}
      {selectedRequest.requestedTime || "Not specified"}
    </p>
  </div>

  <div className="owner-transport-modal-section">
    <h3>Additional Information</h3>
    <p>
      <strong>Business:</strong>{" "}
      {selectedRequest.listingId?.title || "N/A"}
    </p>

    <div className="owner-transport-modal-field">
  <label>
    <strong>Status</strong>
  </label>

  <select
    value={modalStatus}
    onChange={(e) => setModalStatus(e.target.value)}
  >
    <option value="New">New</option>
    <option value="Quoted">Quoted</option>
    <option value="Accepted">Accepted</option>
    <option value="In Progress">In Progress</option>
    <option value="Completed">Completed</option>
    <option value="Cancelled">Cancelled</option>
  </select>
</div>

{modalStatus === "Quoted" && (
  <div className="owner-transport-quote-box">
    <h3>💰 Quote Details</h3>

    <div className="owner-transport-modal-field">
      <label>Quote Amount ($)</label>

      <input
        type="number"
        placeholder="Enter quote amount"
        value={quoteAmount}
        onChange={(e) => setQuoteAmount(e.target.value)}
      />
    </div>

    <div className="owner-transport-modal-field">
      <label>Estimated Arrival</label>

      <input
        type="text"
        placeholder="Example: Tomorrow 9:00 AM"
        value={estimatedArrival}
        onChange={(e) => setEstimatedArrival(e.target.value)}
      />
    </div>

    <div className="owner-transport-modal-field">
      <label>Owner Notes</label>

      <textarea
        rows="4"
        placeholder="Add notes for the customer..."
        value={ownerNotes}
        onChange={(e) => setOwnerNotes(e.target.value)}
      />
    </div>
  </div>
)}

    <p>
      <strong>Notes:</strong>{" "}
      {selectedRequest.notes || "No additional notes"}
    </p>
  </div>
</div>

<div className="owner-transport-modal-actions">
  <button
  type="button"
  className="owner-transport-save-btn"
  onClick={async () => {
    try {
      const updated = await apiPatch(
        `/api/transportation-requests/${selectedRequest._id}/status`,
        {
          status: modalStatus,
        },
        token
      );

      setRequests((current) =>
        current.map((request) =>
          request._id === updated.request._id
            ? updated.request
            : request
        )
      );

      setSelectedRequest(updated.request);

      alert("Status updated successfully!");
    } catch (err) {
      alert(
        err.message ||
          "Failed to update transportation status."
      );
    }
  }}
>
  💾 Save Status
</button>
</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
  