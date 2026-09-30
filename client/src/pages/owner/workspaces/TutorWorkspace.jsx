import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./TutorWorkspace.css";

export default function TutorWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [serviceRequests, setServiceRequests] = React.useState([]);
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [requestError, setRequestError] = React.useState("");

  React.useEffect(() => {
    document.title = "Tutor Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/tutor";
      return;
    }

    async function loadTutorListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const tutorListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "tutor"
        );

        setListings(tutorListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Tutor workspace.";

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
            "/owner/login?redirect=/owner/workspaces/tutor";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    Promise.all([
      loadTutorListings(),
      loadServiceRequests(),
    ]);
  }, [token]);

  async function loadServiceRequests() {
    try {
      setLoadingRequests(true);
      setRequestError("");

      const data = await apiGet(
        "/api/tutor-service-requests/owner",
        token
      );

      setServiceRequests(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load Tutor requests:",
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
        }/api/tutor-service-requests/${requestId}/status`,
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
        "Tutor request update failed:",
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
      label="Tutoring Business Workspace"
      title="Tutor"
      icon="🗣️"
      description="Manage translation and interpretation service listings, customer requests, business information, and activity."
    >
      {error && (
        <div className="tutor-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="tutor-workspace-state">
          Loading Tutor workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="tutor-workspace-state">
            <h2>
              No Tutor listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Tutor
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
                    "Tutor Listings",
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

            <section className="tutor-requests-section">
              <div className="tutor-requests-header">
                <div>
                  <h2>Recent Service Requests</h2>
                  <p>
                    Review customer translation and interpretation requests
                    and their current status.
                  </p>
                </div>
              </div>

              {requestError && (
                <div className="tutor-workspace-error">
                  Error: {requestError}
                </div>
              )}

              {loadingRequests ? (
                <div className="tutor-workspace-state">
                  Loading service requests...
                </div>
              ) : serviceRequests.length === 0 ? (
                <div className="tutor-workspace-state">
                  <h3>No service requests yet</h3>
                  <p>
                    New customer Tutor service
                    requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="tutor-requests-list">
                  {serviceRequests
                    .slice(0, 5)
                    .map((request) => (
                      <article
                        key={request._id}
                        className="tutor-request-card"
                      >
                        <div className="tutor-request-card-top">
                          <div>
                            <h3>
                              {request.customerName ||
                                "Unknown Customer"}
                            </h3>

                            <p>
                              {request.subject ||
                                "Subject not provided"}
                            </p>
                          </div>

                          <span
                            className={`tutor-request-status status-${String(
                              request.status || "New"
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {request.status || "New"}
                          </span>
                        </div>

                        <div className="tutor-request-details">
                          <div>
                            <strong>Student</strong>
                            <span>
                              {request.studentName ||
                                "Not provided"}
                            </span>
                          </div>

                          <div>
                            <strong>Learning Level</strong>
                            <span>
                              {request.learningLevel ||
                                "Not provided"}
                            </span>
                          </div>

                          <div>
                            <strong>Session Type</strong>
                            <span>
                              {request.sessionType ||
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

                        <div className="tutor-request-notes">
                          <strong>Request Description</strong>
                          <p>
                            {request.requestDescription ||
                              "Not provided"}
                          </p>
                        </div>

                        {request.notes && (
                          <div className="tutor-request-notes">
                            <strong>Customer Notes</strong>
                            <p>{request.notes}</p>
                          </div>
                        )}

                        {request.ownerNotes && (
                          <div className="tutor-request-notes">
                            <strong>Owner Notes</strong>
                            <p>{request.ownerNotes}</p>
                          </div>
                        )}

                        <div className="tutor-request-actions">
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
                            <span className="tutor-request-final-state">
                              Request declined
                            </span>
                          )}

                          {request.status === "Completed" && (
                            <span className="tutor-request-final-state">
                              Service completed
                            </span>
                          )}

                          {request.status === "Cancelled" && (
                            <span className="tutor-request-final-state">
                              Service request cancelled
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>

            <section className="tutor-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="tutor-workspace-card"
                  >
                    <div className="tutor-workspace-card-header">
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

                      <span className="tutor-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="tutor-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Tutor"}
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
                            "No translation or interpretation service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="tutor-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Tutor Listing
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