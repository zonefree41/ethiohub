import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./ImmigrationWorkspace.css";

export default function ImmigrationWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [
  schedulingRequestId,
  setSchedulingRequestId,
] = React.useState(null);

const [
  scheduledConsultationDate,
  setScheduledConsultationDate,
] = React.useState("");

const [
  scheduledConsultationTime,
  setScheduledConsultationTime,
] = React.useState("");

  const [consultationRequests, setConsultationRequests] =
  React.useState([]);

const [
  loadingConsultations,
  setLoadingConsultations,
] = React.useState(true);

const [
  consultationError,
  setConsultationError,
] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Immigration Lawyer Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/immigration";
      return;
    }

    async function loadConsultationRequests() {
  try {
    setLoadingConsultations(true);
    setConsultationError("");

    const data = await apiGet(
      "/api/immigration-consultation-requests/owner",
      token
    );

    setConsultationRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    console.error(
      "Failed to load Immigration consultation requests:",
      err
    );

    setConsultationError(
      err.message ||
        "Failed to load Immigration consultation requests."
    );

    setConsultationRequests([]);
  } finally {
    setLoadingConsultations(false);
  }
}

    async function loadImmigrationListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const immigrationListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "immigration-lawyer"
        );

        setListings(immigrationListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Immigration workspace.";

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
            "/owner/login?redirect=/owner/workspaces/immigration";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    Promise.all([
  loadImmigrationListings(),
  loadConsultationRequests(),
]);  
  }, [token]);

  async function updateConsultationStatus(
  requestId,
  status,
  scheduledConsultationDate = null,
  scheduledConsultationTime = ""
) {
  try {
    setConsultationError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/immigration-consultation-requests/${requestId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
  status,
  scheduledConsultationDate,
  scheduledConsultationTime,
}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update consultation status."
      );
    }

    setConsultationRequests((current) =>
      current.map((request) =>
        request._id === requestId
          ? data.request
          : request
      )
    );
  } catch (err) {
    console.error(
      "Immigration consultation update failed:",
      err
    );

    setConsultationError(
      err.message ||
        "Failed to update consultation status."
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

  const totalConsultations =
  consultationRequests.length;

const newConsultations =
  consultationRequests.filter(
    (item) => item.status === "New"
  ).length;

const contactedConsultations =
  consultationRequests.filter(
    (item) => item.status === "Contacted"
  ).length;

const scheduledConsultations =
  consultationRequests.filter(
    (item) =>
      item.status === "Consultation Scheduled"
  ).length;

  return (
    <WorkspaceLayout
      label="Immigration Legal Workspace"
      title="Immigration Lawyer"
      icon="⚖️"
      description="Manage legal service listings, consultation information, client contact options, and business activity."
    >
      {error && (
        <div className="immigration-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="immigration-workspace-state">
          Loading Immigration workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="immigration-workspace-state">
            <h2>
              No Immigration Lawyer listings found
            </h2>

            <p>
              This workspace is available only
              to owners with an Immigration
              Lawyer listing.
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
                    "Immigration Listings",
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
      label: "Consultation Requests",
      value: totalConsultations,
    },
    {
      label: "New",
      value: newConsultations,
    },
    {
      label: "Contacted",
      value: contactedConsultations,
    },
    {
      label: "Scheduled",
      value: scheduledConsultations,
    },
  ]}
/>

<section className="immigration-consultations-section">
  <div className="immigration-consultations-header">
    <div>
      <h2>Recent Consultation Requests</h2>
      <p>
        Review client consultation requests and
        manage their status.
      </p>
    </div>
  </div>

  {consultationError && (
    <div className="immigration-workspace-error">
      Error: {consultationError}
    </div>
  )}

  {loadingConsultations ? (
    <div className="immigration-workspace-state">
      Loading consultation requests...
    </div>
  ) : consultationRequests.length === 0 ? (
    <div className="immigration-workspace-state">
      <h3>No consultation requests yet</h3>
      <p>
        New client consultation requests will
        appear here.
      </p>
    </div>
  ) : (
    <div className="immigration-consultations-list">
      {consultationRequests
        .slice(0, 10)
        .map((request) => (
          <article
            key={request._id}
            className="immigration-consultation-card"
          >
            <div className="immigration-consultation-card-top">
              <div>
                <h3>
                  {request.customerName ||
                    "Unknown Client"}
                </h3>

                <p>
                  {request.listingId?.title ||
                    "Immigration Lawyer"}
                </p>
              </div>

              <span
                className={`immigration-consultation-status status-${String(
                  request.status || "New"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {request.status || "New"}
              </span>
            </div>

            <div className="immigration-consultation-details">
              <div>
                <strong>Case Type</strong>
                <span>
                  {request.caseType ||
                    "Not provided"}
                </span>
              </div>

              <div>
                <strong>Preferred Date</strong>
                <span>
                  {request.preferredConsultationDate
                    ? new Date(
                        request.preferredConsultationDate
                      ).toLocaleDateString(
                        undefined,
                        { timeZone: "UTC" }
                      )
                    : "Not provided"}
                </span>
              </div>

              <div>
                <strong>Preferred Time</strong>
                <span>
                  {request.preferredConsultationTime ||
                    "Not provided"}
                </span>
              </div>

              <div>
                <strong>Contact Method</strong>
                <span>
                  {request.preferredContactMethod ||
                    "Either"}
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

            {request.message && (
              <div className="immigration-consultation-notes">
                <strong>Client Message</strong>
                <p>{request.message}</p>
              </div>
            )}

            {request.ownerNotes && (
              <div className="immigration-consultation-notes">
                <strong>Owner Notes</strong>
                <p>{request.ownerNotes}</p>
              </div>
            )}

            <div className="immigration-consultation-actions">
  {request.status === "New" && (
    <>
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
    </>
  )}

  {request.status === "Contacted" && (
    <>
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
    </>
  )}

  {request.status ===
    "Consultation Scheduled" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateConsultationStatus(
            request._id,
            "Retained"
          )
        }
      >
        Mark Retained
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
    </>
  )}

  {request.status === "Retained" && (
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
      Close Case
    </button>
  )}

  {schedulingRequestId === request._id && (
  <div className="immigration-schedule-panel">
    <label>
      Confirmed Consultation Date
      <input
        type="date"
        min={new Date().toISOString().split("T")[0]}
        value={scheduledConsultationDate}
        onChange={(e) =>
          setScheduledConsultationDate(e.target.value)
        }
      />
    </label>

    <label>
      Confirmed Consultation Time
      <input
        type="time"
        value={scheduledConsultationTime}
        onChange={(e) =>
          setScheduledConsultationTime(e.target.value)
        }
      />
    </label>

    <div className="immigration-schedule-actions">
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

  {request.status === "Declined" && (
    <span className="immigration-consultation-final-state">
      Consultation declined
    </span>
  )}

  {request.status === "Closed" && (
    <span className="immigration-consultation-final-state">
      Consultation closed
    </span>
  )}
</div>
          </article>
        ))}
    </div>
  )}
</section>

            <section className="immigration-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="immigration-workspace-card"
                  >
                    <div className="immigration-workspace-card-header">
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

                      <span className="immigration-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="immigration-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Immigration Lawyer"}
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
                            "No legal service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="immigration-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Legal Listing
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