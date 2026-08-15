import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./NotaryWorkspace.css";

export default function NotaryWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [
  notaryRequests,
  setNotaryRequests,
] = React.useState([]);

const [
  loadingRequests,
  setLoadingRequests,
] = React.useState(true);

const [
  schedulingRequestId,
  setSchedulingRequestId,
] = React.useState(null);

const [
  scheduledAppointmentDate,
  setScheduledAppointmentDate,
] = React.useState("");

const [
  scheduledAppointmentTime,
  setScheduledAppointmentTime,
] = React.useState("");

const [
  requestError,
  setRequestError,
] = React.useState("");

const newRequestCount = notaryRequests.filter(
  (request) => request.status === "New"
).length;

const contactedRequestCount = notaryRequests.filter(
  (request) => request.status === "Contacted"
).length;

const scheduledRequestCount = notaryRequests.filter(
  (request) =>
    request.status === "Appointment Scheduled"
).length;

const inProgressRequestCount = notaryRequests.filter(
  (request) => request.status === "In Progress"
).length;

const completedRequestCount = notaryRequests.filter(
  (request) => request.status === "Completed"
).length;

  React.useEffect(() => {
    document.title = "Notary Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/notary";
      return;
    }

    async function loadNotaryRequests() {
  try {
    setLoadingRequests(true);
    setRequestError("");

    const data = await apiGet(
      "/api/notary-service-requests/owner",
      token
    );

    setNotaryRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    const message =
      err.message ||
      "Failed to load Notary service requests.";

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
        "/owner/login?redirect=/owner/workspaces/notary";

      return;
    }

    setRequestError(message);
  } finally {
    setLoadingRequests(false);
  }
}

    async function loadNotaryListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const notaryListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug === "notary"
        );

        setListings(notaryListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Notary workspace.";

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
            "/owner/login?redirect=/owner/workspaces/notary";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadNotaryListings();
loadNotaryRequests();
  }, [token]);

  async function updateNotaryRequestStatus(
  requestId,
  status,
  scheduledDate = "",
  scheduledTime = ""
) {
  try {
    setRequestError("");

    const data = await apiPatch(
      `/api/notary-service-requests/${requestId}/status`,
      {
        status,
        scheduledAppointmentDate: scheduledDate,
        scheduledAppointmentTime: scheduledTime,
      },
      token
    );

    setNotaryRequests((current) =>
      current.map((request) =>
        request._id === requestId
          ? data.request
          : request
      )
    );
  } catch (err) {
    console.error(
      "Notary service request update failed:",
      err
    );

    setRequestError(
      err.message ||
        "Failed to update Notary service request."
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

  return (
    <WorkspaceLayout
      label="Notary Business Workspace"
      title="Notary"
      icon="🖋️"
      description="Manage notary service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="notary-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="notary-workspace-state">
          Loading Notary workspace...
        </div>
      )}

      {!loading && listings.length === 0 && (
        <div className="notary-workspace-state">
          <h2>No Notary listings found</h2>

          <p>
            This workspace is available only to owners
            with a Notary listing.
          </p>
        </div>
      )}

      {!loading && listings.length > 0 && (
        <>
          <WorkspaceStats
            items={[
  {
    label: "New Requests",
    value: newRequestCount,
  },
  {
    label: "Contacted",
    value: contactedRequestCount,
  },
  {
    label: "Scheduled",
    value: scheduledRequestCount,
  },
  {
    label: "In Progress",
    value: inProgressRequestCount,
  },
  {
    label: "Completed",
    value: completedRequestCount,
  },
  {
    label: "Notary Listings",
    value: listings.length,
  },
]}
          />  

          {requestError && (
  <div className="notary-workspace-error">
    Error: {requestError}
  </div>
)}

          <section className="notary-workspace-grid">
            {listings.map((listing) => (
              <article
                key={listing._id}
                className="notary-workspace-card"
              >
                <div className="notary-workspace-card-header">
                  <div>
                    <h2>{listing.title}</h2>

                    <p>
                      {[listing.city, listing.state]
                        .filter(Boolean)
                        .join(", ") ||
                        "Location unavailable"}
                    </p>
                  </div>

                  <span className="notary-workspace-status">
                    {listing.status || "pending"}
                  </span>
                </div>

                <div className="notary-workspace-info">
                  <div>
                    <strong>Category</strong>

                    <p>
                      {listing.categoryId?.name_en ||
                        "Notary"}
                    </p>
                  </div>

                  <div>
                    <strong>Phone</strong>

                    <p>
                      {listing.phone ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Website</strong>

                    <p>
                      {listing.website ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <strong>Description</strong>

                    <p>
                      {listing.description_en ||
                        "No notary service description added yet."}
                    </p>
                  </div>
                </div>

                <div className="notary-workspace-actions">
                  <a
                    href={`/owner/listings/edit/${listing._id}`}
                  >
                    Edit Notary Listing
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

          <section className="notary-request-section">
  <div className="notary-request-section-header">
    <div>
      <h2>Notary Service Requests</h2>
      <p>
        Review and manage customer notary service requests.
      </p>
    </div>

    <span>
      {notaryRequests.length} request
      {notaryRequests.length !== 1 ? "s" : ""}
    </span>
  </div>

  {loadingRequests && (
    <div className="notary-workspace-state">
      Loading Notary service requests...
    </div>
  )}

  {!loadingRequests &&
    notaryRequests.length === 0 && (
      <div className="notary-workspace-state">
        No Notary service requests yet.
      </div>
    )}

  {!loadingRequests &&
    notaryRequests.length > 0 && (
      <div className="notary-request-grid">
        {notaryRequests.map((request) => (
          <article
            key={request._id}
            className="notary-request-card"
          >
            <div className="notary-request-card-header">
              <div>
                <h3>{request.customerName}</h3>

                <p>
                  {request.listingId?.title ||
                    "Notary Services"}
                </p>
              </div>

              <span className="notary-request-status">
                {request.status}
              </span>
            </div>

            <div className="notary-request-details">
              <div>
                <strong>Service Needed</strong>
                <p>{request.serviceType}</p>
              </div>

              <div>
                <strong>Document Type</strong>
                <p>
                  {request.documentType ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Service Location</strong>
                <p>
                  {request.serviceLocation ||
                    "Either"}
                </p>
              </div>

              <div>
                <strong>Email</strong>
                <p>
                  <a
                    href={`mailto:${request.customerEmail}`}
                  >
                    {request.customerEmail}
                  </a>
                </p>
              </div>

              <div>
                <strong>Phone</strong>
                <p>
                  <a
                    href={`tel:${request.customerPhone}`}
                  >
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
                <strong>Preferred Appointment Date</strong>
                <p>
                  {request.preferredAppointmentDate ||
                    "Not specified"}
                </p>
              </div>

              <div>
                <strong>Preferred Appointment Time</strong>
                <p>
                  {request.preferredAppointmentTime ||
                    "Not specified"}
                </p>
              </div>

              <div className="notary-request-message">
                <strong>Customer Message</strong>
                <p>
                  {request.message ||
                    "No additional message provided."}
                </p>
              </div>
            </div>

            {request.status === "New" && (
              <div className="notary-request-actions">
                <button
                  type="button"
                  onClick={() =>
                    updateNotaryRequestStatus(
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
                    updateNotaryRequestStatus(
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
                    updateNotaryRequestStatus(
                      request._id,
                      "Closed"
                    )
                  }
                >
                  Close
                </button>
              </div>
            )}

            {request.status === "Contacted" && (
  <div className="notary-request-actions">
    <button
      type="button"
      onClick={() => {
        setSchedulingRequestId(request._id);
        setScheduledAppointmentDate("");
        setScheduledAppointmentTime("");
      }}
    >
      Schedule Appointment
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateNotaryRequestStatus(
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
        updateNotaryRequestStatus(
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
  <div className="notary-schedule-panel">
    <div>
      <label>
        Confirmed Appointment Date
      </label>

      <input
        type="date"
        min={
          new Date()
            .toISOString()
            .split("T")[0]
        }
        value={scheduledAppointmentDate}
        onChange={(e) =>
          setScheduledAppointmentDate(
            e.target.value
          )
        }
      />
    </div>

    <div>
      <label>
        Confirmed Appointment Time
      </label>

      <input
        type="time"
        value={scheduledAppointmentTime}
        onChange={(e) =>
          setScheduledAppointmentTime(
            e.target.value
          )
        }
      />
    </div>

    <div className="notary-schedule-actions">
      <button
        type="button"
        disabled={
          !scheduledAppointmentDate ||
          !scheduledAppointmentTime
        }
        onClick={async () => {
          await updateNotaryRequestStatus(
            request._id,
            "Appointment Scheduled",
            scheduledAppointmentDate,
            scheduledAppointmentTime
          );

          setSchedulingRequestId(null);
          setScheduledAppointmentDate("");
          setScheduledAppointmentTime("");
        }}
      >
        Confirm Appointment
      </button>

      <button
        type="button"
        className="secondary"
        onClick={() => {
          setSchedulingRequestId(null);
          setScheduledAppointmentDate("");
          setScheduledAppointmentTime("");
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}

{request.status === "In Progress" && (
  <div className="notary-request-actions">
    <button
      type="button"
      onClick={() =>
        updateNotaryRequestStatus(
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
        updateNotaryRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Completed" && (
  <div className="notary-request-actions">
    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateNotaryRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "Appointment Scheduled" && (
  <div className="notary-request-actions">
    <button
      type="button"
      onClick={() =>
        updateNotaryRequestStatus(
          request._id,
          "In Progress"
        )
      }
    >
      Start Notary Service
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateNotaryRequestStatus(
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
        updateNotaryRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
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