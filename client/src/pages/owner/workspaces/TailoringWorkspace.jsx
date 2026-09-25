import React from "react";
import { apiGet } from "../../../api/http.js";
import WorkspaceLayout from "../../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../../components/owner/workspaces/WorkspaceStats.jsx";
import "./TailoringWorkspace.css";

export default function TailoringWorkspace() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [appointmentRequests, setAppointmentRequests] = React.useState([]);
  const [loadingAppointments, setLoadingAppointments] = React.useState(true);
  const [appointmentError, setAppointmentError] = React.useState("");

  React.useEffect(() => {
    document.title = "Tailoring Workspace | HubEthio";

    if (!token) {
      window.location.href =
        "/owner/login?redirect=/owner/workspaces/tailoring";
      return;
    }

    async function loadTailoringListings() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/owner/listings/my-listings",
          token
        );

        const tailoringListings = (
          Array.isArray(data) ? data : []
        ).filter(
          (listing) =>
            listing.categoryId?.slug ===
            "tailoring-alterations"
        );

        setListings(tailoringListings);
      } catch (err) {
        const message =
          err.message ||
          "Failed to load Tailoring workspace.";

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
            "/owner/login?redirect=/owner/workspaces/tailoring";

          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    Promise.all([
  loadTailoringListings(),
  loadAppointmentRequests(),
]);
  }, [token]);

  async function updateAppointmentStatus(
  requestId,
  status
) {
  try {
    setAppointmentError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/tailoring-appointment-requests/${requestId}/status`,
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
          "Failed to update appointment."
      );
    }

    setAppointmentRequests((current) =>
      current.map((request) =>
        request._id === requestId
          ? data.request
          : request
      )
    );
  } catch (err) {
    console.error(
      "Tailoring appointment update failed:",
      err
    );

    setAppointmentError(
      err.message ||
        "Failed to update appointment."
    );
  }
}

  async function loadAppointmentRequests() {
  try {
    setLoadingAppointments(true);
    setAppointmentError("");

    const data = await apiGet(
      "/api/tailoring-appointment-requests/owner",
      token
    );

    setAppointmentRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    console.error(
      "Failed to load Tailoring appointments:",
      err
    );

    setAppointmentError(
      err.message ||
        "Failed to load appointment requests."
    );

    setAppointmentRequests([]);
  } finally {
    setLoadingAppointments(false);
  }
}

  const totalAppointments =

  appointmentRequests.length;

const newAppointments =
  appointmentRequests.filter(
    (request) =>
      request.status === "New"
  ).length;

const confirmedAppointments =
  appointmentRequests.filter(
    (request) =>
      request.status === "Confirmed"
  ).length;

const completedAppointments =
  appointmentRequests.filter(
    (request) =>
      request.status === "Completed"
  ).length;

  return (
    <WorkspaceLayout
      label="Tailoring Business Workspace"
      title="Tailoring & Alterations"
      icon="🧵"
      description="Manage tailoring appointments, customer requests, and business activity."
    >
      {error && (
        <div className="tailoring-workspace-error">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="tailoring-workspace-state">
          Loading Tailoring workspace...
        </div>
      )}

      {!loading &&
        listings.length === 0 && (
          <div className="tailoring-workspace-state">
            <h2>
              No Tailoring listings found
            </h2>

            <p>
              This workspace is available
              only to owners with a Tailoring
              & Alterations listing.
            </p>
          </div>
        )}

      {!loading &&
        listings.length > 0 && (
          <>

            <WorkspaceStats
              items={[
                {
                  label: "Tailoring Businesses",
                  value: listings.length,
                },
                {
                  label: "Appointments",
                  value: totalAppointments,
                },
                {
                  label: "New Requests",
                  value: newAppointments,
                },
                {
                  label: "Confirmed",
                  value: confirmedAppointments,
                },
                {
                  label: "Completed",
                  value: completedAppointments,
                },
              ]}
            />

<section className="tailoring-appointments-section">
  <div className="tailoring-appointments-header">
    <div>
      <h2>Recent Appointment Requests</h2>
      <p>
        Review customer appointment requests and their current status.
      </p>
    </div>
  </div>

  {appointmentError && (
    <div className="tailoring-workspace-error">
      Error: {appointmentError}
    </div>
  )}

  {loadingAppointments ? (
    <div className="tailoring-workspace-state">
      Loading appointment requests...
    </div>
  ) : appointmentRequests.length === 0 ? (
    <div className="tailoring-workspace-state">
      <h3>No appointment requests yet</h3>
      <p>
        New customer Tailoring appointment requests will appear here.
      </p>
    </div>
  ) : (
    <div className="tailoring-appointments-list">
      {appointmentRequests
        .slice(0, 5)
        .map((request) => (
          <article
            key={request._id}
            className="tailoring-appointment-card"
          >
            <div className="tailoring-appointment-card-top">
              <div>
                <h3>
                  {request.customerName ||
                    "Unknown Customer"}
                </h3>

                <p>
                  {request.service ||
                    "Service not provided"}
                </p>
              </div>

              <span
                className={`tailoring-appointment-status status-${String(
                  request.status || "New"
                )
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {request.status || "New"}
              </span>
            </div>

            <div className="tailoring-appointment-details">
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

            {request.notes && (
              <div className="tailoring-appointment-notes">
                <strong>Customer Notes</strong>
                <p>{request.notes}</p>
              </div>
            )}

            {request.ownerNotes && (
              <div className="tailoring-appointment-notes">
                <strong>Owner Notes</strong>
                <p>{request.ownerNotes}</p>
              </div>
            )}

            <div className="tailoring-appointment-actions">
  {request.status === "New" && (
    <>
      <button
        type="button"
        onClick={() =>
          updateAppointmentStatus(
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
          updateAppointmentStatus(
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
          updateAppointmentStatus(
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
          updateAppointmentStatus(
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
    <span className="tailoring-appointment-final-state">
      Request declined
    </span>
  )}

  {request.status === "Completed" && (
    <span className="tailoring-appointment-final-state">
      Appointment completed
    </span>
  )}

  {request.status === "Cancelled" && (
    <span className="tailoring-appointment-final-state">
      Appointment cancelled
    </span>
  )}
</div>
          </article>
        ))}
    </div>
  )}
</section>

            <section className="tailoring-workspace-grid">
              {listings.map(
                (listing) => (
                  <article
                    key={listing._id}
                    className="tailoring-workspace-card"
                  >
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

                    <div>
                      <strong>
                        Primary Service
                      </strong>
                      <p>
                        {listing.subcategory ||
                          "Not provided"}
                      </p>
                    </div>

                    <div>
                      <strong>
                        Listing Status
                      </strong>
                      <p>
                        {listing.status ||
                          "Unknown"}
                      </p>
                    </div>

                    <div className="tailoring-workspace-actions">
                      <a
                        href={`/owner/listings/edit/${listing._id}`}
                      >
                        Edit Tailoring Settings
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