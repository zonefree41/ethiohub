import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import "./AdminTransportationVerification.css";

export default function AdminTransportationDriverVerification() {
  const token = localStorage.getItem("adminToken");

  const [drivers, setDrivers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [selectedDriver, setSelectedDriver] = React.useState(null);
  const [rejectingDriver, setRejectingDriver] = React.useState(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [processingId, setProcessingId] = React.useState("");
  const [documentLoading, setDocumentLoading] = React.useState("");

  React.useEffect(() => {
    async function loadPendingDrivers() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/admin/transportation-drivers/verification-queue",
          token
        );

        setDrivers(
          Array.isArray(data?.drivers) ? data.drivers : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load pending driver verification requests."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPendingDrivers();
  }, [token]);

  async function openDocument(driverId, side) {
    const documentWindow = window.open("", "_blank");

    if (!documentWindow) {
      setError(
        "The verification document was blocked. Please allow pop-ups and try again."
      );
      return;
    }

    try {
      setDocumentLoading(`${driverId}-${side}`);
      setError("");

      const data = await apiGet(
        `/api/admin/transportation-drivers/${driverId}/verification-document/${side}`,
        token
      );

      if (!data?.url) {
        throw new Error(
          "Verification document URL was not returned."
        );
      }

      documentWindow.location.href = data.url;
    } catch (err) {
      documentWindow.close();

      setError(
        err.message ||
          "Failed to open driver verification document."
      );
    } finally {
      setDocumentLoading("");
    }
  }

  async function updateVerification(
    driver,
    verificationStatus,
    note = ""
  ) {
    try {
      setProcessingId(driver._id);
      setError("");
      setMessage("");

      const data = await apiPatch(
        `/api/admin/transportation-drivers/${driver._id}/verification`,
        {
          verificationStatus,
          note,
        },
        token
      );

      setDrivers((current) =>
        current.filter((item) => item._id !== driver._id)
      );

      setSelectedDriver(null);
      setRejectingDriver(null);
      setRejectionReason("");

      setMessage(
        data?.message ||
          `Driver verification ${verificationStatus}.`
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to update driver verification."
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

            <h1>Driver Verification</h1>

            <p>
              Review identity and driver-license verification
              submissions from registered Transportation drivers.
            </p>
          </div>
        </header>

        {loading && (
          <section className="admin-dashboard-state">
            <div className="admin-dashboard-spinner"></div>
            <h2>Loading driver verifications...</h2>
            <p>Please wait while pending submissions are loaded.</p>
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

        {!loading && !error && drivers.length === 0 && (
          <section className="admin-dashboard-state">
            <h2>No pending driver verifications</h2>
            <p>
              New driver verification submissions will appear here.
            </p>
          </section>
        )}

        {!loading && !error && drivers.length > 0 && (
          <div className="transport-review-list">
            {drivers.map((driver) => (
              <div
                key={driver._id}
                className="transport-review-card"
              >
                <div className="transport-review-header">
                  <div>
                    <h2>{driver.fullName || "Driver"}</h2>

                    <p>
                      <strong>Business:</strong>{" "}
                      {driver.businessListingId?.title || "-"}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {driver.email || "-"}
                    </p>
                  </div>

                  <span className="transport-status pending">
                    {driver.verificationStatus}
                  </span>
                </div>

                <div className="transport-review-grid">
                  <div>
                    <strong>License State</strong>
                    <p>{driver.driverLicenseState || "-"}</p>
                  </div>

                  <div>
                    <strong>License Expiration</strong>
                    <p>
                      {driver.driverLicenseExpirationDate
                        ? new Date(
                            driver.driverLicenseExpirationDate
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <strong>Submitted</strong>
                    <p>
                      {driver.verificationSubmittedAt
                        ? new Date(
                            driver.verificationSubmittedAt
                          ).toLocaleString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <strong>Driver Status</strong>
                    <p>{driver.status || "-"}</p>
                  </div>
                </div>

                <div className="transport-review-actions">
                  <button
                    type="button"
                    className="btn-view"
                    onClick={() => setSelectedDriver(driver)}
                  >
                    Review Driver
                  </button>

                  <button
                    type="button"
                    className="btn-approve"
                    disabled={processingId === driver._id}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Approve verification for ${driver.fullName || "this driver"}?`
                      );

                      if (confirmed) {
                        updateVerification(
                          driver,
                          "approved"
                        );
                      }
                    }}
                  >
                    {processingId === driver._id
                      ? "Processing..."
                      : "Approve"}
                  </button>

                  <button
                    type="button"
                    className="btn-reject"
                    disabled={processingId === driver._id}
                    onClick={() => {
                      setRejectingDriver(driver);
                      setRejectionReason("");
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDriver && (
          <div
            className="transport-modal-overlay"
            onClick={() => setSelectedDriver(null)}
          >
            <div
              className="transport-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="transport-modal-header">
                <div>
                  <p className="transport-modal-label">
                    Driver Verification Review
                  </p>
                  <h2>
                    {selectedDriver.fullName || "Driver"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="transport-modal-close"
                  onClick={() => setSelectedDriver(null)}
                  aria-label="Close driver verification details"
                >
                  ×
                </button>
              </div>

              <section className="transport-detail-section">
                <h3>Driver Information</h3>

                <div className="transport-detail-grid">
                  <div>
                    <strong>Name</strong>
                    <p>{selectedDriver.fullName || "-"}</p>
                  </div>

                  <div>
                    <strong>Email</strong>
                    <p>{selectedDriver.email || "-"}</p>
                  </div>

                  <div>
                    <strong>Phone</strong>
                    <p>{selectedDriver.phone || "-"}</p>
                  </div>

                  <div>
                    <strong>Business</strong>
                    <p>
                      {selectedDriver.businessListingId?.title ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <strong>License Number</strong>
                    <p>
                      {selectedDriver.driverLicenseNumber || "-"}
                    </p>
                  </div>

                  <div>
                    <strong>License State</strong>
                    <p>
                      {selectedDriver.driverLicenseState || "-"}
                    </p>
                  </div>

                  <div>
                    <strong>License Expiration</strong>
                    <p>
                      {selectedDriver.driverLicenseExpirationDate
                        ? new Date(
                            selectedDriver.driverLicenseExpirationDate
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <strong>Submitted</strong>
                    <p>
                      {selectedDriver.verificationSubmittedAt
                        ? new Date(
                            selectedDriver.verificationSubmittedAt
                          ).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="transport-detail-section">
                <h3>License Documents</h3>

                <div className="transport-document-list">
                  <div className="transport-document-row">
                    <span>Driver License — Front</span>

                    {selectedDriver.driverLicenseFrontPublicId ? (
                      <button
                        type="button"
                        className="btn-view"
                        disabled={
                          documentLoading ===
                          `${selectedDriver._id}-front`
                        }
                        onClick={() =>
                          openDocument(
                            selectedDriver._id,
                            "front"
                          )
                        }
                      >
                        {documentLoading ===
                        `${selectedDriver._id}-front`
                          ? "Opening..."
                          : "Open Document"}
                      </button>
                    ) : (
                      <span className="transport-document-missing">
                        Not provided
                      </span>
                    )}
                  </div>

                  <div className="transport-document-row">
                    <span>Driver License — Back</span>

                    {selectedDriver.driverLicenseBackPublicId ? (
                      <button
                        type="button"
                        className="btn-view"
                        disabled={
                          documentLoading ===
                          `${selectedDriver._id}-back`
                        }
                        onClick={() =>
                          openDocument(
                            selectedDriver._id,
                            "back"
                          )
                        }
                      >
                        {documentLoading ===
                        `${selectedDriver._id}-back`
                          ? "Opening..."
                          : "Open Document"}
                      </button>
                    ) : (
                      <span className="transport-document-missing">
                        Not provided
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <div className="transport-modal-actions">
                <button
                  type="button"
                  className="btn-approve"
                  disabled={
                    processingId === selectedDriver._id
                  }
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Approve verification for ${
                        selectedDriver.fullName ||
                        "this driver"
                      }?`
                    );

                    if (confirmed) {
                      updateVerification(
                        selectedDriver,
                        "approved"
                      );
                    }
                  }}
                >
                  {processingId === selectedDriver._id
                    ? "Processing..."
                    : "Approve"}
                </button>

                <button
                  type="button"
                  className="btn-reject"
                  disabled={
                    processingId === selectedDriver._id
                  }
                  onClick={() => {
                    setRejectingDriver(selectedDriver);
                    setRejectionReason("");
                  }}
                >
                  Reject
                </button>

                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setSelectedDriver(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectingDriver && (
          <div
            className="transport-modal-overlay"
            onClick={() => {
              setRejectingDriver(null);
              setRejectionReason("");
            }}
          >
            <div
              className="transport-rejection-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="transport-modal-header">
                <div>
                  <p className="transport-modal-label">
                    Reject Driver Verification
                  </p>

                  <h2>
                    {rejectingDriver.fullName || "Driver"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="transport-modal-close"
                  onClick={() => {
                    setRejectingDriver(null);
                    setRejectionReason("");
                  }}
                  aria-label="Close rejection dialog"
                >
                  ×
                </button>
              </div>

              <div className="transport-rejection-content">
                <label htmlFor="driver-rejection-reason">
                  Reason for rejection
                </label>

                <textarea
                  id="driver-rejection-reason"
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(event.target.value)
                  }
                  placeholder="Example: Driver license image is unreadable or the license has expired."
                  rows="5"
                  maxLength="2000"
                />

                <p className="transport-rejection-help">
                  This reason will be shown to the driver so they
                  can correct and resubmit their verification.
                </p>
              </div>

              <div className="transport-modal-actions">
                <button
                  type="button"
                  className="btn-reject"
                  disabled={
                    processingId === rejectingDriver._id ||
                    !rejectionReason.trim()
                  }
                  onClick={() =>
                    updateVerification(
                      rejectingDriver,
                      "rejected",
                      rejectionReason.trim()
                    )
                  }
                >
                  {processingId === rejectingDriver._id
                    ? "Rejecting..."
                    : "Reject Verification"}
                </button>

                <button
                  type="button"
                  className="btn-modal-cancel"
                  disabled={
                    processingId === rejectingDriver._id
                  }
                  onClick={() => {
                    setRejectingDriver(null);
                    setRejectionReason("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
