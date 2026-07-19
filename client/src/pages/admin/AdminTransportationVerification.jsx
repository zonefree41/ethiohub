import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import "./AdminTransportationVerification.css";

export default function AdminTransportationVerification() {
    const token = localStorage.getItem("adminToken");

const [requests, setRequests] = React.useState([]);
const [loading, setLoading] = React.useState(true);
const [error, setError] = React.useState("");
const [selectedRequest, setSelectedRequest] = React.useState(null);

const [processingId, setProcessingId] = React.useState("");
const [message, setMessage] = React.useState("");

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

async function handleApprove(listingId) {
  const confirmed = window.confirm(
    "Are you sure you want to approve this Transportation Verification?"
  );

  if (!confirmed) return;

  try {
    setProcessingId(listingId);
    setError("");
    setMessage("");

    const result = await apiPatch(
      `/api/admin/transportation-verification/${listingId}/approve`,
      {},
      token
    );

    setRequests((prev) =>
      prev.filter((listing) => listing._id !== listingId)
    );

    setSelectedRequest(null);

    setMessage(
      result.message ||
        "Transportation Verification approved successfully."
    );
  } catch (err) {
    setError(
      err.message ||
        "Failed to approve Transportation Verification."
    );
  } finally {
    setProcessingId("");
  }
}

async function handleReject(listingId) {
  const confirmed = window.confirm(
    "Are you sure you want to reject this Transportation Verification?"
  );

  if (!confirmed) return;

  try {
    setProcessingId(listingId);
    setError("");
    setMessage("");

    const result = await apiPatch(
      `/api/admin/transportation-verification/${listingId}/reject`,
      {},
      token
    );

    setRequests((prev) =>
      prev.filter((listing) => listing._id !== listingId)
    );

    setSelectedRequest(null);

    setMessage(
      result.message ||
        "Transportation Verification rejected."
    );
  } catch (err) {
    setError(
      err.message ||
        "Failed to reject Transportation Verification."
    );
  } finally {
    setProcessingId("");
  }
}

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

{!loading && message && (
  <section className="admin-dashboard-success">
    {message}
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
            <button
  type="button"
  className="btn-view"
  onClick={() => setSelectedRequest(listing)}
>
  View Details
</button>

            <button
  type="button"
  className="btn-approve"
  onClick={() => handleApprove(listing._id)}
  disabled={processingId === listing._id}
>
  {processingId === listing._id
    ? "Processing..."
    : "Approve"}
</button>

<button
  type="button"
  className="btn-reject"
  onClick={() => handleReject(listing._id)}
  disabled={processingId === listing._id}
>
  {processingId === listing._id
    ? "Processing..."
    : "Reject"}
</button>
          </div>
        </div>
      );
    })}
  </div>
)}

{selectedRequest && (
  <div
    className="transport-modal-overlay"
    onClick={() => setSelectedRequest(null)}
  >
    <div
      className="transport-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="transport-modal-header">
        <div>
          <p className="transport-modal-label">
            Transportation Verification Review
          </p>

          <h2>{selectedRequest.title}</h2>
        </div>

        <button
          type="button"
          className="transport-modal-close"
          onClick={() => setSelectedRequest(null)}
          aria-label="Close verification details"
        >
          ×
        </button>
      </div>

      {(() => {
        const tv =
          selectedRequest.transportVerification || {};

        return (
          <>
            <section className="transport-detail-section">
              <h3>Owner Information</h3>

              <div className="transport-detail-grid">
                <div>
                  <strong>Owner</strong>
                  <p>
                    {selectedRequest.ownerId?.name ||
                      selectedRequest.submittedBy?.name ||
                      "-"}
                  </p>
                </div>

                <div>
                  <strong>Email</strong>
                  <p>
                    {selectedRequest.ownerId?.email ||
                      selectedRequest.submittedBy?.contact ||
                      "-"}
                  </p>
                </div>

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
                  <strong>Status</strong>
                  <p>{tv.verificationStatus || "-"}</p>
                </div>
              </div>
            </section>

            <section className="transport-detail-section">
              <h3>Driver Information</h3>

              <div className="transport-detail-grid">
                <div>
                  <strong>Driver Name</strong>
                  <p>{tv.driverFullName || "-"}</p>
                </div>

                <div>
                  <strong>License Number</strong>
                  <p>{tv.driverLicenseNumber || "-"}</p>
                </div>

                <div>
                  <strong>License State</strong>
                  <p>{tv.driverLicenseState || "-"}</p>
                </div>

                <div>
                  <strong>Driver Verified</strong>
                  <p>{tv.driverVerified ? "Yes" : "No"}</p>
                </div>
              </div>
            </section>

            <section className="transport-detail-section">
              <h3>Vehicle Information</h3>

              <div className="transport-detail-grid">
                <div>
                  <strong>Vehicle</strong>
                  <p>
                    {[tv.vehicleMake, tv.vehicleModel]
                      .filter(Boolean)
                      .join(" ") || "-"}
                  </p>
                </div>

                <div>
                  <strong>License Plate</strong>
                  <p>{tv.vehicleLicensePlate || "-"}</p>
                </div>

                <div>
                  <strong>VIN</strong>
                  <p>{tv.vehicleVin || "-"}</p>
                </div>

                <div>
                  <strong>Vehicle Verified</strong>
                  <p>{tv.vehicleVerified ? "Yes" : "No"}</p>
                </div>
              </div>
            </section>

            <section className="transport-detail-section">
              <h3>Operating Authority</h3>

              <div className="transport-detail-grid">
                <div>
                  <strong>USDOT Number</strong>
                  <p>{tv.usdotNumber || "-"}</p>
                </div>

                <div>
                  <strong>MC Number</strong>
                  <p>{tv.mcNumber || "-"}</p>
                </div>

                <div>
                  <strong>Operating Authority</strong>
                  <p>{tv.operatingAuthority || "-"}</p>
                </div>

                <div>
                  <strong>Operating Status</strong>
                  <p>{tv.operatingStatus || "-"}</p>
                </div>
              </div>
            </section>

            <section className="transport-detail-section">
              <h3>Insurance Information</h3>

              <div className="transport-detail-grid">
                <div>
                  <strong>Has Insurance</strong>
                  <p>{tv.hasCargoInsurance ? "Yes" : "No"}</p>
                </div>

                <div>
                  <strong>Insurance Company</strong>
                  <p>{tv.insuranceCompany || "-"}</p>
                </div>

                <div>
                  <strong>Policy Number</strong>
                  <p>{tv.insurancePolicyNumber || "-"}</p>
                </div>

                <div>
                  <strong>Coverage Type</strong>
                  <p>{tv.insuranceCoverageType || "-"}</p>
                </div>
              </div>
            </section>

            <section className="transport-detail-section">
              <h3>Documents</h3>

              <div className="transport-document-list">
                {[
                  {
                    label: "Driver License — Front",
                    url: tv.driverLicenseFrontUrl,
                  },
                  {
                    label: "Driver License — Back",
                    url: tv.driverLicenseBackUrl,
                  },
                  {
                    label: "Vehicle Registration",
                    url: tv.vehicleRegistrationUrl,
                  },
                  {
                    label: "Insurance Document",
                    url: tv.insuranceDocumentUrl,
                  },
                  {
                    label: "Cargo Insurance Document",
                    url: tv.cargoInsuranceDocumentUrl,
                  },
                ].map((document) => (
                  <div
                    key={document.label}
                    className="transport-document-row"
                  >
                    <span>{document.label}</span>

                    {document.url ? (
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Document
                      </a>
                    ) : (
                      <span className="transport-document-missing">
                        Not provided
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="transport-modal-actions">
              <button
  type="button"
  className="btn-approve"
  onClick={() => handleApprove(selectedRequest._id)}
  disabled={processingId === selectedRequest._id}
>
  {processingId === selectedRequest._id
    ? "Processing..."
    : "Approve"}
</button>

<button
  type="button"
  className="btn-reject"
  onClick={() => handleReject(selectedRequest._id)}
  disabled={processingId === selectedRequest._id}
>
  {processingId === selectedRequest._id
    ? "Processing..."
    : "Reject"}
</button>

              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>
          </>
        );
      })()}
    </div>
  </div>
)}

      </div>
    </main>
  );
}