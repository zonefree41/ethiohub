import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./InsuranceWorkspace.css";

export default function InsuranceWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [consultationRequests, setConsultationRequests] =
  React.useState([]);

const [consultationError, setConsultationError] =
  React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [schedulingRequestId, setSchedulingRequestId] =
  React.useState(null);

const [
  scheduledConsultationDate,
  setScheduledConsultationDate,
] = React.useState("");

const [
  scheduledConsultationTime,
  setScheduledConsultationTime,
] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Insurance Agent Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/insurance";
      return;
    }

    async function loadInsuranceListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const insuranceListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "insurance-agent"
        );

        setListings(insuranceListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Insurance workspace.";

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
          localStorage.removeItem(
            "ownerToken"
          );

          localStorage.removeItem(
            "ownerUser"
          );

          window.location.href =
            "/owner/login?redirect=/owner/workspaces/insurance";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadInsuranceListings();
loadConsultationRequests();
  }, [token]);

  async function loadConsultationRequests() {
  try {
    setConsultationError("");

    const data = await apiGet(
      "/api/insurance-consultation-requests/owner",
      token
    );

    setConsultationRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    console.error(
      "Failed to load Insurance consultation requests:",
      err
    );

    setConsultationError(
      err.message ||
        "Failed to load Insurance consultation requests."
    );
  }
}

async function updateConsultationStatus(
  requestId,
  status,
  scheduledDate = null,
  scheduledTime = ""
){
  try {
    setConsultationError("");

    const data = await apiPatch(
      `/api/insurance-consultation-requests/${requestId}/status`,
      {
  status,
  scheduledConsultationDate:
    scheduledDate,
  scheduledConsultationTime:
    scheduledTime,
},
      token
    );

    setConsultationRequests((current) =>
      current.map((request) =>
        request._id === requestId
          ? data.request
          : request
      )
    );
  } catch (err) {
    console.error(
      "Insurance consultation update failed:",
      err
    );

    setConsultationError(
      err.message ||
        "Failed to update Insurance consultation status."
    );
  }
}

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

  const newLeadCount = consultationRequests.filter(
  (request) => request.status === "New"
).length;

const scheduledCount = consultationRequests.filter(
  (request) =>
    request.status === "Consultation Scheduled"
).length;

const clientCount = consultationRequests.filter(
  (request) => request.status === "Client"
).length;

const closedCount = consultationRequests.filter(
  (request) => request.status === "Closed"
).length;

  return (
    <WorkspaceLayout
      label="Insurance Business Workspace"
      title="Insurance Agent"
      icon="🛡️"
      description="Manage insurance service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="insurance-workspace-error">
          Error: {error}
        </div>
      )}

      {consultationError && (
  <div className="insurance-workspace-error">
    Error: {consultationError}
  </div>
)}

      {loading && (
        <div className="insurance-workspace-state">
          Loading Insurance workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="insurance-workspace-state">
            <h2>
              No Insurance Agent listings found
            </h2>

            <p>
              This workspace is available only
              to owners with an Insurance Agent
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
                    "Insurance Listings",
                  value:
                    listings.length,
                },
                {
                  label:
                    "Approved Listings",
                  value:
                    approvedCount,
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

            <WorkspaceStats
  items={[
    {
      label: "New Leads",
      value: newLeadCount,
    },
    {
      label: "Scheduled",
      value: scheduledCount,
    },
    {
      label: "Clients",
      value: clientCount,
    },
    {
      label: "Closed",
      value: closedCount,
    },
  ]}
/>

            <section className="insurance-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="insurance-workspace-card"
                  >
                    <div className="insurance-workspace-card-header">
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

                      <span className="insurance-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="insurance-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Insurance Agent"}
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
                            "No insurance service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="insurance-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Insurance Listing
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

            <section className="insurance-consultation-section">
  <div className="insurance-consultation-section-header">
    <div>
      <p className="insurance-consultation-eyebrow">
        Customer Leads
      </p>

      <h2>
        Insurance & Financial Consultation Requests
      </h2>

      <p>
        Review customer inquiries, preferred contact
        details, requested services, and consultation
        preferences.
      </p>
    </div>

    <span className="insurance-consultation-count">
      {consultationRequests.length}
    </span>
  </div>

  {consultationRequests.length === 0 ? (
    <div className="insurance-workspace-state">
      <h2>No consultation requests yet</h2>

      <p>
        New insurance and financial service inquiries
        will appear here when customers submit them.
      </p>
    </div>
  ) : (
    <div className="insurance-consultation-grid">
      {consultationRequests.map((request) => (
        <article
          key={request._id}
          className="insurance-consultation-card"
        >
          <div className="insurance-consultation-card-header">
            <div>
              <h3>{request.customerName}</h3>

              <p>
                {request.listingId?.title ||
                  "Insurance & Financial Services"}
              </p>
            </div>

            <span className="insurance-consultation-status">
              {request.status}
            </span>
          </div>

          <div className="insurance-consultation-details">
            <div>
              <strong>Service Needed</strong>
              <p>{request.serviceType}</p>
            </div>

            <div>
              <strong>Email</strong>
              <p>
                <a href={`mailto:${request.customerEmail}`}>
                  {request.customerEmail}
                </a>
              </p>
            </div>

            <div>
              <strong>Phone</strong>
              <p>
                <a href={`tel:${request.customerPhone}`}>
                  {request.customerPhone}
                </a>
              </p>
            </div>

            <div>
              <strong>Preferred Contact</strong>
              <p>
                {request.preferredContactMethod ||
                  "Either"}
              </p>
            </div>

            <div>
              <strong>Preferred Date</strong>
              <p>
                {request.preferredConsultationDate
                  ? new Date(
                      request.preferredConsultationDate
                    ).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Not specified"}
              </p>
            </div>

            <div>
              <strong>Preferred Time</strong>
              <p>
                {request.preferredConsultationTime ||
                  "Not specified"}
              </p>
            </div>

            {request.status === "New" && (
  <div className="insurance-consultation-actions">
    <button
      type="button"
      onClick={() =>
        updateConsultationStatus(
          request._id,
          "Contacted"
        )
      }
    >
      Mark Contacted
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateConsultationStatus(
          request._id,
          "Declined"
        )
      }
    >
      Decline
    </button>
  </div>
)}

{request.status === "Contacted" && (
  <div className="insurance-consultation-actions">
    <button
      type="button"
      onClick={() => {
  setSchedulingRequestId(request._id);
  setScheduledConsultationDate("");
  setScheduledConsultationTime("");
}}
    >
      Schedule Consultation
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateConsultationStatus(
          request._id,
          "Declined"
        )
      }
    >
      Decline
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateConsultationStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{schedulingRequestId === request._id && (
  <div className="insurance-schedule-panel">
    <div>
      <label>
        Confirmed Consultation Date
      </label>

      <input
        type="date"
        min={new Date()
          .toISOString()
          .split("T")[0]}
        value={scheduledConsultationDate}
        onChange={(e) =>
          setScheduledConsultationDate(
            e.target.value
          )
        }
      />
    </div>

    <div>
      <label>
        Confirmed Consultation Time
      </label>

      <input
        type="time"
        value={scheduledConsultationTime}
        onChange={(e) =>
          setScheduledConsultationTime(
            e.target.value
          )
        }
      />
    </div>

    <div className="insurance-schedule-actions">
      <button
        type="button"
        disabled={
          !scheduledConsultationDate ||
          !scheduledConsultationTime
        }
        onClick={async () => {
          await updateConsultationStatus(
            request._id,
            "Consultation Scheduled",
            scheduledConsultationDate,
            scheduledConsultationTime
          );

          setSchedulingRequestId(null);
          setScheduledConsultationDate("");
          setScheduledConsultationTime("");
        }}
      >
        Confirm Schedule
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() => {
          setSchedulingRequestId(null);
          setScheduledConsultationDate("");
          setScheduledConsultationTime("");
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}

{request.status === "Consultation Scheduled" && (
  <div className="insurance-consultation-actions">
    <button
      type="button"
      onClick={() =>
        updateConsultationStatus(
          request._id,
          "Client"
        )
      }
    >
      Mark as Client
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateConsultationStatus(
          request._id,
          "Declined"
        )
      }
    >
      Decline
    </button>

    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateConsultationStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

            <div className="insurance-consultation-message">
              <strong>Customer Message</strong>
              <p>
                {request.message ||
                  "No additional message provided."}
              </p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )}
</section>
          </>
        )}
    </WorkspaceLayout>
  );
}