import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./TaxWorkspace.css";

export default function TaxWorkspace() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [taxRequests, setTaxRequests] =
  React.useState([]);

const [taxRequestError, setTaxRequestError] =
  React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [schedulingRequestId, setSchedulingRequestId] =
  React.useState(null);

const [
  scheduledAppointmentDate,
  setScheduledAppointmentDate,
] = React.useState("");

const [
  scheduledAppointmentTime,
  setScheduledAppointmentTime,
] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Tax Preparer Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/tax";
      return;
    }

    async function loadTaxListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const taxListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "tax-preparer"
        );

        setListings(taxListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Tax workspace.";

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
            "/owner/login?redirect=/owner/workspaces/tax";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadTaxListings();
loadTaxRequests();
  }, [token]);

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

  const newRequestCount = taxRequests.filter(
  (request) => request.status === "New"
).length;

const scheduledCount = taxRequests.filter(
  (request) =>
    request.status === "Appointment Scheduled"
).length;

const inPreparationCount = taxRequests.filter(
  (request) =>
    request.status === "In Preparation"
).length;

const completedCount = taxRequests.filter(
  (request) => request.status === "Completed"
).length;

  async function loadTaxRequests() {
  try {
    setTaxRequestError("");

    const data = await apiGet(
      "/api/tax-service-requests/owner",
      token
    );

    setTaxRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    console.error(
      "Failed to load Tax service requests:",
      err
    );

    setTaxRequestError(
      err.message ||
        "Failed to load Tax service requests."
    );
  }
}

async function updateTaxRequestStatus(
  requestId,
  status,
  scheduledDate = null,
  scheduledTime = ""
) {
  try {
    setTaxRequestError("");

    const data = await apiPatch(
      `/api/tax-service-requests/${requestId}/status`,
      {
  status,
  scheduledAppointmentDate: scheduledDate,
  scheduledAppointmentTime: scheduledTime,
},
      token
    );

    setTaxRequests((current) =>
      current.map((request) =>
        request._id === requestId
          ? data.request
          : request
      )
    );
  } catch (err) {
    console.error(
      "Tax service request update failed:",
      err
    );

    setTaxRequestError(
      err.message ||
        "Failed to update Tax service request."
    );
  }
}

  return (
    <WorkspaceLayout
      label="Tax Business Workspace"
      title="Tax Preparer"
      icon="🧾"
      description="Manage tax preparation service listings, customer contact options, business information, and activity."
    >
      {error && (
        <div className="tax-workspace-error">
          Error: {error}
        </div>
      )}

      {taxRequestError && (
  <div className="tax-workspace-error">
    Error: {taxRequestError}
  </div>
)}

      {loading && (
        <div className="tax-workspace-state">
          Loading Tax workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="tax-workspace-state">
            <h2>
              No Tax Preparer listings found
            </h2>

            <p>
              This workspace is available only
              to owners with a Tax Preparer
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
                    "Tax Listings",
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
      label: "New Requests",
      value: newRequestCount,
    },
    {
      label: "Scheduled",
      value: scheduledCount,
    },
    {
      label: "In Preparation",
      value: inPreparationCount,
    },
    {
      label: "Completed",
      value: completedCount,
    },
  ]}
/>

            <section className="tax-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="tax-workspace-card"
                  >
                    <div className="tax-workspace-card-header">
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

                      <span className="tax-workspace-status">
                        {listing.status ||
                          "pending"}
                      </span>
                    </div>

                    <div className="tax-workspace-info">
                      <div>
                        <strong>
                          Category
                        </strong>

                        <p>
                          {listing.categoryId
                            ?.name_en ||
                            "Tax Preparer"}
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
                            "No tax service description added yet."}
                        </p>
                      </div>
                    </div>

                    <div className="tax-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Tax Listing
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

            <section className="tax-request-section">
  <div className="tax-request-section-header">
    <div>
      <p className="tax-request-eyebrow">
        Customer Requests
      </p>

      <h2>Tax Service Requests</h2>

      <p>
        Review customer tax service inquiries,
        contact information, requested services,
        and appointment preferences.
      </p>
    </div>

    <span className="tax-request-count">
      {taxRequests.length}
    </span>
  </div>

  {taxRequests.length === 0 ? (
    <div className="tax-workspace-state">
      <h2>No tax service requests yet</h2>

      <p>
        New customer tax requests will appear here
        after they submit a request through HubEthio.
      </p>
    </div>
  ) : (
    <div className="tax-request-grid">
      {taxRequests.map((request) => (
        <article
          key={request._id}
          className="tax-request-card"
        >
          <div className="tax-request-card-header">
            <div>
              <h3>{request.customerName}</h3>

              <p>
                {request.listingId?.title ||
                  "Tax Preparation Services"}
              </p>
            </div>

            <span className="tax-request-status">
              {request.status}
            </span>
          </div>

          <div className="tax-request-details">
            <div>
              <strong>Service Needed</strong>
              <p>{request.serviceType}</p>
            </div>

            {request.status === "New" && (
  <div className="tax-request-actions">
    <button
      type="button"
      onClick={() =>
        updateTaxRequestStatus(
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
        updateTaxRequestStatus(
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
  <div className="tax-request-actions">
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
        updateTaxRequestStatus(
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
        updateTaxRequestStatus(
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
  <div className="tax-request-actions">
    <button
      type="button"
      onClick={() =>
        updateTaxRequestStatus(
          request._id,
          "In Preparation"
        )
      }
    >
      Start Preparation
    </button>

    <button
      type="button"
      className="danger"
      onClick={() =>
        updateTaxRequestStatus(
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
        updateTaxRequestStatus(
          request._id,
          "Closed"
        )
      }
    >
      Close
    </button>
  </div>
)}

{request.status === "In Preparation" && (
  <div className="tax-request-actions">
    <button
      type="button"
      onClick={() =>
        updateTaxRequestStatus(
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
        updateTaxRequestStatus(
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
  <div className="tax-request-actions">
    <button
      type="button"
      className="secondary"
      onClick={() =>
        updateTaxRequestStatus(
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
  <div className="tax-schedule-panel">
    <div>
      <label>
        Confirmed Appointment Date
      </label>

      <input
        type="date"
        min={new Date()
          .toISOString()
          .split("T")[0]}
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

    <div className="tax-schedule-actions">
      <button
        type="button"
        disabled={
          !scheduledAppointmentDate ||
          !scheduledAppointmentTime
        }
        onClick={async () => {
          await updateTaxRequestStatus(
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
              <strong>Preferred Appointment Date</strong>
              <p>
                {request.preferredAppointmentDate
                  ? new Date(
                      request.preferredAppointmentDate
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
              <strong>Preferred Appointment Time</strong>
              <p>
                {request.preferredAppointmentTime ||
                  "Not specified"}
              </p>
            </div>

            {request.scheduledAppointmentDate && (
  <div>
    <strong>Confirmed Appointment Date</strong>
    <p>
      {new Date(
        request.scheduledAppointmentDate
      ).toLocaleDateString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
    </p>
  </div>
)}

{request.scheduledAppointmentTime && (
  <div>
    <strong>Confirmed Appointment Time</strong>
    <p>
      {request.scheduledAppointmentTime}
    </p>
  </div>
)}

            <div className="tax-request-message">
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