import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./EventsEntertainmentWorkspace.css";

export default function EventsEntertainmentWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [eventRequests, setEventRequests] = React.useState([]);
const [requestsLoading, setRequestsLoading] = React.useState(true);
const [requestsError, setRequestsError] = React.useState("");

const [schedulingRequestId, setSchedulingRequestId] =
  React.useState(null);

const [scheduledConsultationDate, setScheduledConsultationDate] =
  React.useState("");

const [scheduledConsultationTime, setScheduledConsultationTime] =
  React.useState("");

  const [proposalRequestId, setProposalRequestId] =
  React.useState(null);

const [proposalAmount, setProposalAmount] =
  React.useState("");

  React.useEffect(() => {
    document.title =
      "Events & Entertainment Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/events-entertainment";
      return;
    }

    async function loadEventsListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const eventListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "events-entertainment"
        );

        setListings(eventListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Events & Entertainment workspace.";

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
            "/owner/login?redirect=/owner/workspaces/events-entertainment";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    async function loadEventRequests() {
  try {
    setRequestsLoading(true);
    setRequestsError("");

    const data = await apiGet(
      "/api/event-service-requests/owner",
      token
    );

    setEventRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    setRequestsError(
      err.message ||
        "Failed to load event service requests."
    );
  } finally {
    setRequestsLoading(false);
  }
}

    loadEventsListings();
    loadEventRequests();
  }, [token]);

  async function updateRequestStatus(
  requestId,
  status,
  scheduledDate = null,
  scheduledTime = "",
  proposalValue = null
) {
  try {
    setRequestsError("");

    const data = await apiPatch(
      `/api/event-service-requests/owner/${requestId}/status`,
      {
  status,
  consultationDate:
    scheduledDate && scheduledTime
      ? `${scheduledDate}T${scheduledTime}`
      : null,
  proposalAmount: proposalValue,
},
      token
    );

    const updatedRequest = data?.request;

    if (!updatedRequest) {
      throw new Error(
        "Updated event request was not returned."
      );
    }

    setEventRequests((current) =>
      current.map((request) =>
        request._id === updatedRequest._id
          ? updatedRequest
          : request
      )
    );
  } catch (err) {
    setRequestsError(
      err.message ||
        "Failed to update event request status."
    );
  }
}

  const approvedCount = listings.filter(
    (listing) => listing.status === "approved"
  ).length;

  const featuredCount = listings.filter(
    (listing) => listing.isFeatured
  ).length;

  const totalViews = listings.reduce(
    (total, listing) =>
      total + Number(listing.clicks?.views || 0),
    0
  );

  const newRequestCount = eventRequests.filter(
  (request) => request.status === "New"
).length;

const bookedRequestCount = eventRequests.filter(
  (request) => request.status === "Booked"
).length;

const completedRequestCount = eventRequests.filter(
  (request) => request.status === "Event Completed"
).length;

  return (
    <WorkspaceLayout
      label="Events Business Workspace"
      title="Events & Entertainment"
      icon="🎉"
      description="Manage event and entertainment service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="events-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="events-workspace-state">
          Loading Events & Entertainment workspace...
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="events-workspace-state">
          <h2>No Events & Entertainment listings found</h2>

          <p>
            This workspace is available only to owners
            with an Events & Entertainment listing.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <WorkspaceStats
  items={[
    {
      label: "Event Listings",
      value: listings.length,
    },
    {
      label: "New Requests",
      value: newRequestCount,
    },
    {
      label: "Booked Events",
      value: bookedRequestCount,
    },
    {
      label: "Completed Events",
      value: completedRequestCount,
    },
  ]}
/>

          <section className="events-workspace-grid">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="events-workspace-card"
              >
                <div className="events-workspace-card-header">
                  <div>
                    <h2>{listing.title}</h2>

                    <p>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location unavailable"}
                    </p>
                  </div>

                  <span className="events-workspace-status">
                    {listing.status || "pending"}
                  </span>
                </div>

                <div className="events-workspace-info">
                  <div>
                    <strong>Category</strong>
                    <p>
                      {listing.categoryId?.name_en ||
                        "Events & Entertainment"}
                    </p>
                  </div>

                  <div>
                    <strong>Phone</strong>
                    <p>
                      {listing.phone || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Website</strong>
                    <p>
                      {listing.website || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Description</strong>
                    <p>
                      {listing.description_en ||
                        "No event or entertainment description added yet."}
                    </p>
                  </div>
                </div>

                <div className="events-workspace-actions">
                  <a
                    href={`/owner/listings/edit/${listing._id}`}
                  >
                    Edit Events Listing
                  </a>

                  {listing.status === "approved" && (
                    <a href={`/listing/${listing._id}`}>
                      View Public Listing
                    </a>
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="events-requests-section">
  <div className="events-requests-header">
    <div>
      <p className="events-requests-label">
        Customer Requests
      </p>

      <h2>Event Service Requests</h2>

      <p>
        Review incoming event inquiries and customer
        planning details.
      </p>
    </div>

    <span className="events-requests-count">
      {eventRequests.length} Total
    </span>
  </div>

  {requestsError && (
    <div className="events-workspace-error">
      Error: {requestsError}
    </div>
  )}

  {requestsLoading && (
    <div className="events-workspace-state">
      Loading event requests...
    </div>
  )}

  {!requestsLoading &&
    !requestsError &&
    eventRequests.length === 0 && (
      <div className="events-workspace-state">
        <h3>No event requests yet</h3>
        <p>
          New customer event inquiries will appear here.
        </p>
      </div>
    )}

  {!requestsLoading &&
    eventRequests.length > 0 && (
      <div className="events-requests-grid">
        {eventRequests.map((request) => (
          <article
            key={request._id}
            className="events-request-card"
          >
            <div className="events-request-card-header">
              <div>
                <p className="events-request-business">
                  {request.listingId?.title ||
                    "Events Business"}
                </p>

                <h3>{request.eventType}</h3>

                <p>
                  {request.customerName}
                </p>
              </div>

              <span className="events-request-status">
                {request.status}
              </span>
            </div>

            <div className="events-request-details">
              <div>
                <strong>Event Date</strong>
                <p>
                  {request.eventDate
                    ? new Date(
                        request.eventDate
                      ).toLocaleDateString()
                    : "Not provided"}
                </p>
              </div>

              <div>
                <strong>Start Time</strong>
                <p>
                  {request.startTime ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <strong>Guests</strong>
                <p>
                  {request.guestCount ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <strong>Budget</strong>
                <p>
                  {request.budget ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <strong>Venue</strong>
                <p>
                  {request.venue ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <strong>Location</strong>
                <p>
                  {[request.city, request.state]
                    .filter(Boolean)
                    .join(", ") ||
                    "Not provided"}
                </p>
              </div>
            </div>

            {request.consultationDate && (
  <div className="events-consultation-info">
    <strong>📅 Scheduled Consultation</strong>

    <p>
      {new Date(
        request.consultationDate
      ).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </p>
  </div>
)}

            {request.servicesNeeded?.length > 0 && (
              <div className="events-request-services">
                <strong>Services Needed</strong>

                <div>
                  {request.servicesNeeded.map(
                    (service) => (
                      <span key={service}>
                        {service}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {request.additionalDetails && (
              <div className="events-request-message">
                <strong>Customer Details</strong>
                <p>
                  {request.additionalDetails}
                </p>
              </div>
            )}

            <div className="events-request-contact">
              <a
                href={`tel:${request.customerPhone}`}
              >
                📞 Call Customer
              </a>

              <a
                href={`mailto:${request.customerEmail}`}
              >
                ✉️ Email Customer
              </a>
            </div>

            {request.status === "New" && (
  <div className="events-request-actions">
    <button
      type="button"
      onClick={() =>
        updateRequestStatus(
          request._id,
          "Contacted"
        )
      }
    >
      Mark Contacted
    </button>
  </div>
)}

{request.status === "Contacted" && (
  <div className="events-request-actions">
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
        updateRequestStatus(
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
        updateRequestStatus(
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
  <div className="events-schedule-panel">
    <div>
      <label>
        Consultation Date
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
        Consultation Time
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

    <div className="events-schedule-actions">
      <button
        type="button"
        disabled={
          !scheduledConsultationDate ||
          !scheduledConsultationTime
        }
        onClick={async () => {
          await updateRequestStatus(
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
  <div className="events-request-actions">
    <button
      type="button"
      onClick={() => {
        setProposalRequestId(request._id);
        setProposalAmount("");
      }}
    >
      Create Proposal
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateRequestStatus(
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
        updateRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{proposalRequestId === request._id && (
  <div className="events-proposal-panel">
    <div>
      <label>Proposal Amount</label>

      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="Example: 9500"
        value={proposalAmount}
        onChange={(e) =>
          setProposalAmount(e.target.value)
        }
      />
    </div>

    <div className="events-proposal-actions">
      <button
        type="button"
        disabled={
          !proposalAmount ||
          Number(proposalAmount) < 0
        }
        onClick={async () => {
          await updateRequestStatus(
            request._id,
            "Proposal Sent",
            null,
            "",
            Number(proposalAmount)
          );

          setProposalRequestId(null);
          setProposalAmount("");
        }}
      >
        Send Proposal
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() => {
          setProposalRequestId(null);
          setProposalAmount("");
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}

{request.status === "Proposal Sent" && (
  <>
    <div className="events-proposal-summary">
      <strong>💰 Proposal</strong>
      <p>
        {Number(request.proposalAmount || 0).toLocaleString(
          undefined,
          {
            style: "currency",
            currency: "USD",
          }
        )}
      </p>
    </div>

    <div className="events-request-actions">
      <button
        type="button"
        onClick={() =>
          updateRequestStatus(
            request._id,
            "Booked"
          )
        }
      >
        Mark Booked
      </button>

      <button
        type="button"
        className="danger"
        onClick={() =>
          updateRequestStatus(
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
          updateRequestStatus(
            request._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </div>
  </>
)}

{request.status === "Booked" && (
  <>
    <div className="events-proposal-summary">
      <strong>💰 Booked Amount</strong>
      <p>
        {Number(request.proposalAmount || 0).toLocaleString(
          undefined,
          {
            style: "currency",
            currency: "USD",
          }
        )}
      </p>
    </div>

    <div className="events-request-actions">
      <button
        type="button"
        onClick={() =>
          updateRequestStatus(
            request._id,
            "Event Completed"
          )
        }
      >
        Mark Event Completed
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() =>
          updateRequestStatus(
            request._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </div>
  </>
)}

{request.status === "Event Completed" && (
  <>
    <div className="events-completed-summary">
      <strong>✅ Event Completed</strong>

      <p>
        Final Booked Amount:{" "}
        {Number(
          request.proposalAmount || 0
        ).toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
        })}
      </p>
    </div>

    <div className="events-request-actions">
      <button
        type="button"
        className="secondary"
        onClick={() =>
          updateRequestStatus(
            request._id,
            "Closed"
          )
        }
      >
        Close
      </button>
    </div>
  </>
)}
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