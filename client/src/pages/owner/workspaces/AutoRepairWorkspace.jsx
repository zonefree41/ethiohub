import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./AutoRepairWorkspace.css";

export default function AutoRepairWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [serviceRequests, setServiceRequests] = React.useState([]);
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [requestError, setRequestError] = React.useState("");

  React.useEffect(() => {
    document.title = "Auto Repair Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/auto-repair";
      return;
    }

    async function loadAutoRepairListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const autoRepairListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "auto-repair"
        );

        setListings(autoRepairListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Auto Repair workspace.";

        const normalizedMessage =
          message.toLowerCase();

        const unauthorized =
          normalizedMessage.includes(
            "invalid or expired token"
          ) ||
          normalizedMessage.includes(
            "unauthorized"
          ) ||
          message.includes("401");

        if (unauthorized) {
          localStorage.removeItem("ownerToken");
          localStorage.removeItem("ownerUser");

          window.location.href =
            "/owner/login?redirect=/owner/workspaces/auto-repair";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    Promise.all([
      loadAutoRepairListings(),
      loadServiceRequests(),
    ]);
  }, [token]);

  async function loadServiceRequests() {
    try {
      setLoadingRequests(true);
      setRequestError("");

      const data = await apiGet(
        "/api/auto-repair-requests/owner",
        token
      );

      setServiceRequests(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load Auto Repair requests:",
        err
      );

      setRequestError(
        err.message ||
          "Failed to load service requests."
      );

      setServiceRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function updateServiceRequestStatus(
    requestId,
    status
  ) {
    try {
      setRequestError("");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL ||
          "http://localhost:5001"
        }/api/auto-repair-requests/${requestId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update service request."
        );
      }

      setServiceRequests((current) =>
        current.map((request) =>
          request._id === requestId
            ? data.request
            : request
        )
      );
    } catch (err) {
      console.error(
        "Auto Repair request update failed:",
        err
      );

      setRequestError(
        err.message ||
          "Failed to update service request."
      );
    }
  }

  const totalRequests = serviceRequests.length;

  const newRequests = serviceRequests.filter(
    (request) => request.status === "New"
  ).length;

  const confirmedRequests = serviceRequests.filter(
    (request) => request.status === "Confirmed"
  ).length;

  const completedRequests = serviceRequests.filter(
    (request) => request.status === "Completed"
  ).length;

  const approvedCount = listings.filter(
    (listing) =>
      listing.status === "approved"
  ).length;

  const featuredCount = listings.filter(
    (listing) =>
      listing.isFeatured
  ).length;

  const totalViews = listings.reduce(
    (total, listing) =>
      total +
      Number(
        listing.clicks?.views || 0
      ),
    0
  );

  return (
    <WorkspaceLayout
      label="Auto Repair Business Workspace"
      title="Auto Repair"
      icon="🔧"
      description="Manage auto repair service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="auto-repair-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="auto-repair-workspace-state">
          Loading Auto Repair workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="auto-repair-workspace-state">
            <h2>
              No Auto Repair listings found
            </h2>

            <p>
              This workspace is available only
              to owners with an Auto Repair
              listing.
            </p>
          </div>
        )}

      {!loading &&
        listings.length > 0 && (
          <>
            <WorkspaceStats
              items={[
                {
                  label:
                    "Auto Repair Listings",
                  value:
                    listings.length,
                },
                {
                  label:
                    "Approved Listings",
                  value:
                    approvedCount,
                },
                {
                  label: "Service Requests",
                  value: totalRequests,
                },
                {
                  label: "New Requests",
                  value: newRequests,
                },
                {
                  label: "Confirmed",
                  value: confirmedRequests,
                },
                {
                  label: "Completed",
                  value: completedRequests,
                },
                ...(!isIOSBuild
                  ? [
                      {
                        label:
                          "Featured Listings",
                        value:
                          featuredCount,
                      },
                    ]
                  : []),
                {
                  label:
                    "Total Views",
                  value:
                    totalViews,
                },
              ]}
            />

            <section className="auto-repair-requests-section">
              <div className="auto-repair-requests-header">
                <div>
                  <h2>Recent Service Requests</h2>
                  <p>
                    Review customer auto repair requests
                    and their current status.
                  </p>
                </div>
              </div>

              {requestError && (
                <div className="auto-repair-workspace-error">
                  Error: {requestError}
                </div>
              )}

              {loadingRequests ? (
                <div className="auto-repair-workspace-state">
                  Loading service requests...
                </div>
              ) : serviceRequests.length === 0 ? (
                <div className="auto-repair-workspace-state">
                  <h3>No service requests yet</h3>
                  <p>
                    New customer Auto Repair service
                    requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="auto-repair-requests-list">
                  {serviceRequests
                    .slice(0, 5)
                    .map((request) => (
                      <article
                        key={request._id}
                        className="auto-repair-request-card"
                      >
                        <div className="auto-repair-request-card-top">
                          <div>
                            <h3>
                              {request.customerName ||
                                "Unknown Customer"}
                            </h3>

                            <p>
                              {request.serviceNeeded ||
                                "Service not provided"}
                            </p>
                          </div>

                          <span
                            className={`auto-repair-request-status status-${String(
                              request.status || "New"
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {request.status || "New"}
                          </span>
                        </div>

                        <div className="auto-repair-request-details">
                          <div>
                            <strong>Vehicle</strong>
                            <span>
                              {[
                                request.vehicleYear,
                                request.vehicleMake,
                                request.vehicleModel,
                              ]
                                .filter(Boolean)
                                .join(" ") ||
                                "Not provided"}
                            </span>
                          </div>

                          <div>
                            <strong>Date</strong>
                            <span>
                              {request.preferredDate
                                ? new Date(
                                    request.preferredDate
                                  ).toLocaleDateString(
                                    undefined,
                                    { timeZone: "UTC" }
                                  )
                                : "Not provided"}
                            </span>
                          </div>

                          <div>
                            <strong>Time</strong>
                            <span>
                              {request.preferredTime ||
                                "Not provided"}
                            </span>
                          </div>

                          <div>
                            <strong>Phone</strong>
                            <span>
                              {request.customerPhone ||
                                "Not provided"}
                            </span>
                          </div>

                          <div>
                            <strong>Email</strong>
                            <span>
                              {request.customerEmail ||
                                "Not provided"}
                            </span>
                          </div>
                        </div>

                        <div className="auto-repair-request-notes">
                          <strong>Problem Description</strong>
                          <p>
                            {request.problemDescription ||
                              "Not provided"}
                          </p>
                        </div>

                        {request.notes && (
                          <div className="auto-repair-request-notes">
                            <strong>Customer Notes</strong>
                            <p>{request.notes}</p>
                          </div>
                        )}

                        {request.ownerNotes && (
                          <div className="auto-repair-request-notes">
                            <strong>Owner Notes</strong>
                            <p>{request.ownerNotes}</p>
                          </div>
                        )}

                        <div className="auto-repair-request-actions">
                          {request.status === "New" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateServiceRequestStatus(
                                    request._id,
                                    "Confirmed"
                                  )
                                }
                              >
                                Confirm
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  updateServiceRequestStatus(
                                    request._id,
                                    "Declined"
                                  )
                                }
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {request.status === "Confirmed" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  updateServiceRequestStatus(
                                    request._id,
                                    "Completed"
                                  )
                                }
                              >
                                Mark Completed
                              </button>

                              <button
                                type="button"
                                className="secondary"
                                onClick={() =>
                                  updateServiceRequestStatus(
                                    request._id,
                                    "Cancelled"
                                  )
                                }
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {request.status === "Declined" && (
                            <span className="auto-repair-request-final-state">
                              Request declined
                            </span>
                          )}

                          {request.status === "Completed" && (
                            <span className="auto-repair-request-final-state">
                              Service completed
                            </span>
                          )}

                          {request.status === "Cancelled" && (
                            <span className="auto-repair-request-final-state">
                              Service request cancelled
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>

            <section className="auto-repair-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="auto-repair-workspace-card"
                  >
                    <div className="auto-repair-workspace-card-header">
                      <div>
                        <h2>
                          {listing.title}
                        </h2>

                        <p>
                          {[
                            listing.city,
                            listing.state,
                          ]
                            .filter(Boolean)
                            .join(", ") ||
                            "Location unavailable"}
                        </p>
                      </div>

                      <span className="auto-repair-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="auto-repair-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Auto Repair"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Phone
                        </strong>

                        <p>
                          {listing.phone ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Website
                        </strong>

                        <p>
                          {listing.website ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <strong>
                          Description
                        </strong>

                        <p>
                          {listing.description_en ||
                            "No auto repair service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="auto-repair-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Auto Repair Listing
                      </a>

                      {listing.status ===
                        "approved" && (
                        <a
                          href={`/listing/${listing._id}`}
                        >
                          View Public Listing
                        </a>
                      )}
                    </div>
                  </article>
                )
              )}
            </section>
          </>
        )}
    </WorkspaceLayout>
  );
}