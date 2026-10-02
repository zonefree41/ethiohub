import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./RealEstateWorkspace.css";

export default function RealEstateWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [serviceRequests, setServiceRequests] = React.useState([]);
  const [loadingRequests, setLoadingRequests] = React.useState(true);
  const [requestError, setRequestError] = React.useState("");

  React.useEffect(() => {
    document.title = "Real Estate Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/real-estate";
      return;
    }

    async function loadRealEstateListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const realEstateListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "real-estate-agent"
        );

        setListings(realEstateListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Real Estate workspace.";

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
            "/owner/login?redirect=/owner/workspaces/real-estate";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    Promise.all([
      loadRealEstateListings(),
      loadServiceRequests(),
    ]);
  }, [token]);

  async function loadServiceRequests() {
    try {
      setLoadingRequests(true);
      setRequestError("");

      const data = await apiGet(
        "/api/real-estate-inquiries/owner",
        token
      );

      setServiceRequests(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load Real Estate inquiries:",
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
        }/api/real-estate-inquiries/${requestId}/status`,
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
        "Real Estate inquiry update failed:",
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
      label="Real Estate Business Workspace"
      title="Real Estate Agent"
      icon="🏡"
      description="Manage your real estate listing, customer inquiries, business information, and activity."
    >
      {error && (
        <div className="real-estate-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="real-estate-workspace-state">
          Loading Real Estate workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="real-estate-workspace-state">
            <h2>
              No Real Estate Agent listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Real Estate Agent
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
                    "Real Estate Listings",
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

            <section className="real-estate-requests-section">
              <div className="real-estate-requests-header">
                <div>
                  <h2>Recent Inquiries</h2>
                  <p>
                    Review customer real estate inquiries
                    and their current status.
                  </p>
                </div>
              </div>

              {requestError && (
                <div className="real-estate-workspace-error">
                  Error: {requestError}
                </div>
              )}

              {loadingRequests ? (
                <div className="real-estate-workspace-state">
                  Loading service requests...
                </div>
              ) : serviceRequests.length === 0 ? (
                <div className="real-estate-workspace-state">
                  <h3>No service requests yet</h3>
                  <p>
                    New customer Real Estate
                    requests will appear here.
                  </p>
                </div>
              ) : (
                <div className="real-estate-requests-list">
                  {serviceRequests
                    .slice(0, 5)
                    .map((request) => (
                      <article
                        key={request._id}
                        className="real-estate-request-card"
                      >
                        <div className="real-estate-request-card-top">
                          <div>
                            <h3>
                              {request.customerName ||
                                "Unknown Customer"}
                            </h3>

                            <p>
                              {request.inquiryType ||
                                "Inquiry type not provided"}
                            </p>
                          </div>

                          <span
                            className={`real-estate-request-status status-${String(
                              request.status || "New"
                            )
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {request.status || "New"}
                          </span>
                        </div>

                        <div className="real-estate-request-details">
                          <div>
                            <strong>Inquiry Type</strong>
                            <span>
                              {request.inquiryType ||
                                "Not provided"}
                            </span>
                          </div>

                          <div>
                            <strong>Preferred Location</strong>
                            <span>
                              {request.preferredLocation ||
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

                        <div className="real-estate-request-notes">
                          <strong>Property Details</strong>
                          <p>
                            {request.propertyDetails ||
                              "Not provided"}
                          </p>
                        </div>

                        {request.notes && (
                          <div className="real-estate-request-notes">
                            <strong>Customer Notes</strong>
                            <p>{request.notes}</p>
                          </div>
                        )}

                        {request.ownerNotes && (
                          <div className="real-estate-request-notes">
                            <strong>Owner Notes</strong>
                            <p>{request.ownerNotes}</p>
                          </div>
                        )}

                        <div className="real-estate-request-actions">
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
                            <span className="real-estate-request-final-state">
                              Request declined
                            </span>
                          )}

                          {request.status === "Completed" && (
                            <span className="real-estate-request-final-state">
                              Inquiry completed
                            </span>
                          )}

                          {request.status === "Cancelled" && (
                            <span className="real-estate-request-final-state">
                              Service request cancelled
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>

            <section className="real-estate-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="real-estate-workspace-card"
                  >
                    <div className="real-estate-workspace-card-header">
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

                      <span className="real-estate-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="real-estate-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Real Estate Agent"}
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
                            "No real estate description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="real-estate-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Real Estate Listing
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