import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import "./AdminTransportationDashboard.css";

const STATUS_OPTIONS = [
  "All",
  "New",
  "Quoted",
  "Accepted",
  "Declined",
  "In Progress",
  "Completed",
  "Cancelled",
];

export default function AdminTransportationDashboard() {
  const token = localStorage.getItem("adminToken");

  const [requests, setRequests] = React.useState([]);
  const [analytics, setAnalytics] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("All");
  const [serviceType, setServiceType] = React.useState("All");
  const [page, setPage] = React.useState(1);

  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

 const [selectedRequest, setSelectedRequest] = React.useState(null);
const [editableStatus, setEditableStatus] = React.useState("New");
const [updatingStatus, setUpdatingStatus] = React.useState(false);
const [statusMessage, setStatusMessage] = React.useState("");

const [driverForm, setDriverForm] = React.useState({
  driverName: "",
  driverPhone: "",
  vehicleDescription: "",
  licensePlate: "",
});

const [savingDriver, setSavingDriver] = React.useState(false);
const [driverMessage, setDriverMessage] = React.useState("");

const [loading, setLoading] = React.useState(false);
const [detailsLoading, setDetailsLoading] = React.useState(false);
const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = "Transportation Admin | HubEthio";

    if (!token) {
      window.location.href = "/admin/login";
    }
  }, [token]);

  async function loadAnalytics() {
    try {
      const data = await apiGet(
        "/api/admin/transportation-requests/analytics",
        token
      );

      setAnalytics(data);
    } catch (err) {
      console.error("Transportation analytics error:", err);
    }
  }

  async function loadRequests(nextPage = page) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "25",
        status,
        serviceType,
        sort: "newest",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const data = await apiGet(
        `/api/admin/transportation-requests?${params.toString()}`,
        token
      );

      setRequests(Array.isArray(data.requests) ? data.requests : []);

      setPagination(
        data.pagination || {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );

      setPage(nextPage);
    } catch (err) {
      setError(err.message || "Failed to load transportation requests");
    } finally {
      setLoading(false);
    }
  }

  async function openRequest(requestId) {
    try {
      setDetailsLoading(true);
      setError("");

      const data = await apiGet(
        `/api/admin/transportation-requests/${requestId}`,
        token
      );

      setSelectedRequest(data);
setEditableStatus(data.status || "New");
setDriverForm({
  driverName: data.driverName || "",
  driverPhone: data.driverPhone || "",
  vehicleDescription: data.vehicleDescription || "",
  licensePlate: data.licensePlate || "",
});

setDriverMessage("");
setStatusMessage("");
    } catch (err) {
      setError(err.message || "Failed to load request details");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function updateRequestStatus() {
  if (!selectedRequest?._id) return;

  try {
    setUpdatingStatus(true);
    setStatusMessage("");
    setError("");

    const data = await apiPatch(
      `/api/admin/transportation-requests/${selectedRequest._id}/status`,
      {
        status: editableStatus,
      },
      token
    );

    const updatedRequest = data.request;

    setSelectedRequest(updatedRequest);
    setEditableStatus(updatedRequest.status);

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request._id === updatedRequest._id
          ? {
              ...request,
              status: updatedRequest.status,
              updatedAt: updatedRequest.updatedAt,
            }
          : request
      )
    );

    setStatusMessage(
      data.message ||
        "Transportation request status updated successfully."
    );

    loadAnalytics();
  } catch (err) {
    setStatusMessage(
      err.message ||
        "Failed to update transportation request status."
    );
  } finally {
    setUpdatingStatus(false);
  }
}

async function saveDriverAssignment() {
  if (!selectedRequest?._id) return;

  setSavingDriver(true);
  setDriverMessage("");

  try {
    const token = localStorage.getItem("adminToken");

    const data = await apiPatch(
      `/api/admin/transportation-requests/${selectedRequest._id}/driver`,
      {
        driverName: driverForm.driverName.trim(),
        driverPhone: driverForm.driverPhone.trim(),
        vehicleDescription:
          driverForm.vehicleDescription.trim(),
        licensePlate: driverForm.licensePlate.trim(),
      },
      token
    );

    setSelectedRequest(data.request);

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request._id === data.request._id
          ? data.request
          : request
      )
    );

    setDriverForm({
      driverName: data.request.driverName || "",
      driverPhone: data.request.driverPhone || "",
      vehicleDescription:
        data.request.vehicleDescription || "",
      licensePlate: data.request.licensePlate || "",
    });

    setDriverMessage(
      data.message ||
        "Driver information updated successfully."
    );
  } catch (error) {
    console.error("Unable to save driver:", error);

    setDriverMessage(
      error.message ||
        "Unable to update driver information."
    );
  } finally {
    setSavingDriver(false);
  }
}

  React.useEffect(() => {
    if (!token) return;

    loadAnalytics();
    loadRequests(1);
  }, [status, serviceType]);

  function handleSearch(event) {
    event.preventDefault();
    loadRequests(1);
  }

  function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  }

  function formatDate(value) {
    if (!value) return "N/A";

    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function driverInformationChanged() {
  if (!selectedRequest) return false;

  return (
    driverForm.driverName.trim() !==
      (selectedRequest.driverName || "").trim() ||
    driverForm.driverPhone.trim() !==
      (selectedRequest.driverPhone || "").trim() ||
    driverForm.vehicleDescription.trim() !==
      (selectedRequest.vehicleDescription || "").trim() ||
    driverForm.licensePlate.trim() !==
      (selectedRequest.licensePlate || "").trim()
  );
}

function getStatusClass(status) {
  switch (status) {
    case "New":
      return "transport-status-new";

    case "Quoted":
      return "transport-status-quoted";

    case "Accepted":
      return "transport-status-accepted";

    case "In Progress":
      return "transport-status-progress";

    case "Completed":
      return "transport-status-completed";

    case "Declined":
      return "transport-status-declined";

    case "Cancelled":
      return "transport-status-cancelled";

    default:
      return "";
  }
}

  function formatDateTime(value) {
    if (!value) return "N/A";

    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatMoney(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "Not quoted";
    }

    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  const serviceTypes = React.useMemo(() => {
    const types = analytics?.serviceTypeCounts || [];

    return types.map((item) => item.serviceType).filter(Boolean);
  }, [analytics]);

  return (
    <main className="transport-admin-page">
      <div className="transport-admin-container">
        <header className="transport-admin-header">
          <div>
            <a href="/admin" className="transport-admin-back">
              ← Main Admin Dashboard
            </a>

            <p className="transport-admin-label">HubEthio Admin</p>

            <h1>Transportation Requests</h1>

            <p>
              Review transportation activity, customer requests, quotes,
              owners, drivers, and request statuses.
            </p>
          </div>

          <div className="transport-admin-header-actions">
            <button
              type="button"
              onClick={() => {
                loadRequests(page);
                loadAnalytics();
              }}
            >
              Refresh
            </button>

            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="transport-admin-error">Error: {error}</div>
        )}

        <section className="transport-admin-summary">
          <article>
            <span>Total Requests</span>
            <strong>{analytics?.summary?.total || 0}</strong>
          </article>

          <article>
            <span>Active</span>
            <strong>{analytics?.summary?.active || 0}</strong>
          </article>

          <article>
            <span>Completed</span>
            <strong>{analytics?.summary?.completed || 0}</strong>
          </article>

          <article>
            <span>Cancelled</span>
            <strong>{analytics?.summary?.cancelled || 0}</strong>
          </article>

          <article>
            <span>Quoted Value</span>
            <strong>
              {formatMoney(analytics?.financials?.totalQuotedValue || 0)}
            </strong>
          </article>

          <article>
            <span>Average Quote</span>
            <strong>
              {formatMoney(analytics?.financials?.averageQuoteAmount || 0)}
            </strong>
          </article>
        </section>

        <section className="transport-admin-filters">
          <form onSubmit={handleSearch}>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, email, phone, business, pickup, or delivery..."
            />

            <button type="submit">Search</button>
          </form>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All statuses" : option}
              </option>
            ))}
          </select>

          <select
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
          >
            <option value="All">All services</option>

            {serviceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </section>

        {loading && (
          <section className="transport-admin-state">
            <div className="transport-admin-spinner" />
            <h2>Loading transportation requests...</h2>
          </section>
        )}

        {!loading && requests.length === 0 && (
          <section className="transport-admin-state">
            <h2>No transportation requests found</h2>
            <p>Try changing the search or filter options.</p>
          </section>
        )}

        {!loading && requests.length > 0 && (
          <section className="transport-admin-table-wrapper">
            <table className="transport-admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Business</th>
                  <th>Service</th>
                  <th>Route</th>
                  <th>Requested</th>
                  <th>Quote</th>
<th>Driver</th>
<th>Status</th>
<th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <strong>{request.customerName || "Unknown"}</strong>
                      <span>{request.customerEmail || "No email"}</span>
                      <span>{request.customerPhone || "No phone"}</span>
                    </td>

                    <td>
                      <strong>
                        {request.listingId?.title || "Unknown business"}
                      </strong>

                      <span>
                        {[request.listingId?.city, request.listingId?.state]
                          .filter(Boolean)
                          .join(", ") || "No location"}
                      </span>
                    </td>

                    <td>{request.serviceType || "N/A"}</td>

                    <td>
                      <span>
                        <strong>From:</strong>{" "}
                        {request.pickupAddress || "N/A"}
                      </span>

                      <span>
                        <strong>To:</strong>{" "}
                        {request.deliveryAddress || "N/A"}
                      </span>
                    </td>

                    <td>
                      <span>{formatDate(request.requestedDate)}</span>
                      <span>{request.requestedTime || "No time"}</span>
                    </td>

                    <td>{formatMoney(request.quoteAmount)}</td>

<td>
  {request.driverName ? (
    <>
      <strong>{request.driverName}</strong>
      <br />
      <small>{request.driverPhone}</small>
    </>
  ) : (
    <span className="transport-no-driver">
      Not Assigned
    </span>
  )}
</td>

<td>
  <span
    className={`transport-status-badge ${getStatusClass(
      request.status || "New"
    )}`}
  >
    {request.status || "New"}
  </span>
</td>

                    <td>
                      <button
                        type="button"
                        onClick={() => openRequest(request._id)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {!loading && pagination.totalPages > 1 && (
          <section className="transport-admin-pagination">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => loadRequests(page - 1)}
            >
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => loadRequests(page + 1)}
            >
              Next
            </button>
          </section>
        )}

        {detailsLoading && (
          <div className="transport-admin-modal-backdrop">
            <section className="transport-admin-modal">
              <p>Loading request details...</p>
            </section>
          </div>
        )}

        {selectedRequest && !detailsLoading && (
          <div
            className="transport-admin-modal-backdrop"
            onClick={() => setSelectedRequest(null)}
          >
            <section
              className="transport-admin-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="transport-admin-modal-header">
                <div>
                  <p className="transport-admin-label">
                    Transportation Request
                  </p>

                  <h2>{selectedRequest.customerName}</h2>

                  <span
  className={`transport-status-badge ${getStatusClass(
    selectedRequest.status || "New"
  )}`}
>
  {selectedRequest.status || "New"}
</span>
                </div>

                <button
                  type="button"
                  className="transport-admin-modal-close"
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close request details"
                >
                  ×
                </button>
              </div>

              <div className="transport-admin-details-grid">
                <section>
                  <h3>Customer</h3>

                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedRequest.customerName || "N/A"}
                  </p>

                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedRequest.customerEmail || "N/A"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {selectedRequest.customerPhone || "N/A"}
                  </p>
                </section>

                <section>
                  <h3>Business</h3>

                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedRequest.listingId?.title || "N/A"}
                  </p>

                  <p>
                    <strong>Owner:</strong>{" "}
                    {selectedRequest.ownerId?.name || "N/A"}
                  </p>

                  <p>
                    <strong>Owner email:</strong>{" "}
                    {selectedRequest.ownerId?.email || "N/A"}
                  </p>
                </section>

                <section>
                  <h3>Trip</h3>

                  <p>
                    <strong>Pickup:</strong>{" "}
                    {selectedRequest.pickupAddress || "N/A"}
                  </p>

                  <p>
                    <strong>Delivery:</strong>{" "}
                    {selectedRequest.deliveryAddress || "N/A"}
                  </p>

                  <p>
                    <strong>Date:</strong>{" "}
                    {formatDate(selectedRequest.requestedDate)}
                  </p>

                  <p>
                    <strong>Time:</strong>{" "}
                    {selectedRequest.requestedTime || "N/A"}
                  </p>
                </section>

                <section>
                  <h3>Quote</h3>

                  <p>
                    <strong>Amount:</strong>{" "}
                    {formatMoney(selectedRequest.quoteAmount)}
                  </p>

                  <p>
                    <strong>Estimated arrival:</strong>{" "}
                    {selectedRequest.estimatedArrival || "N/A"}
                  </p>

                  <p>
                    <strong>Quoted:</strong>{" "}
                    {formatDateTime(selectedRequest.quotedAt)}
                  </p>
                </section>

                <section>
                  <h3>Cargo</h3>

                  <p>
                    <strong>Service:</strong>{" "}
                    {selectedRequest.serviceType || "N/A"}
                  </p>

                  <p>
                    <strong>Details:</strong>{" "}
                    {selectedRequest.cargoDetails || "N/A"}
                  </p>
                </section>

                <section>
  <h3>🚚 Driver Assignment</h3>

  <label>Driver Name</label>

  <input
    type="text"
    value={driverForm.driverName}
    onChange={(e) =>
      setDriverForm({
        ...driverForm,
        driverName: e.target.value,
      })
    }
    placeholder="Driver Name"
  />

  <label>Phone</label>

  <input
    type="text"
    value={driverForm.driverPhone}
    onChange={(e) =>
      setDriverForm({
        ...driverForm,
        driverPhone: e.target.value,
      })
    }
    placeholder="Driver Phone"
  />

  <label>Vehicle</label>

  <input
    type="text"
    value={driverForm.vehicleDescription}
    onChange={(e) =>
      setDriverForm({
        ...driverForm,
        vehicleDescription: e.target.value,
      })
    }
    placeholder="Vehicle Description"
  />

  <label>License Plate</label>

  <input
    type="text"
    value={driverForm.licensePlate}
    onChange={(e) =>
      setDriverForm({
        ...driverForm,
        licensePlate: e.target.value,
      })
    }
    placeholder="License Plate"
  />

 <button
  type="button"
  className="transport-save-driver-btn"
  onClick={saveDriverAssignment}
  disabled={
    savingDriver ||
    !driverInformationChanged()
  }
>
  {savingDriver
    ? "Saving..."
    : driverInformationChanged()
    ? "Save Driver"
    : "No Changes"}
</button>

  {driverMessage && (
    <p className="transport-driver-message">
      {driverMessage}
    </p>
  )}
</section>
              </div>

              <section className="transport-admin-status-editor">
  <h3>Update Request Status</h3>

  <div className="transport-admin-status-controls">
    <select
      value={editableStatus}
      onChange={(event) => {
        setEditableStatus(event.target.value);
        setStatusMessage("");
      }}
      disabled={updatingStatus}
    >
      {STATUS_OPTIONS.filter((option) => option !== "All").map(
        (option) => (
          <option key={option} value={option}>
            {option}
          </option>
        )
      )}
    </select>

    <button
  type="button"
  onClick={updateRequestStatus}
  disabled={
    updatingStatus ||
    editableStatus === selectedRequest.status
  }
>
  {updatingStatus ? "Updating..." : "Update Status"}
</button>
  </div>

  {statusMessage && (
    <p className="transport-admin-status-message">
      {statusMessage}
    </p>
  )}
</section>

<section className="transport-admin-history">
  <h3>📜 Activity History</h3>

  {!selectedRequest?.adminAuditLog?.length ? (
    <p>No activity recorded yet.</p>
  ) : (
    <div className="transport-admin-history-list">
      {[...selectedRequest.adminAuditLog]
        .sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
        .map((item, index) => (
          <div
            key={item._id || index}
            className="transport-admin-history-item"
          >
            <div className="transport-history-header">
              <strong>{item.action}</strong>

              <span>
                {formatDateTime(item.createdAt)}
              </span>
            </div>

            {item.previousStatus &&
              item.newStatus && (
                <p>
                  <strong>Status:</strong>{" "}
                  {item.previousStatus}
                  {" → "}
                  {item.newStatus}
                </p>
              )}

            {item.note && (
              <p>
                <strong>Details:</strong>{" "}
                {item.note}
              </p>
            )}

            <p>
              <strong>Admin:</strong>{" "}
              {item.adminEmail ||
                item.adminId?.email ||
                "Unknown"}
            </p>
          </div>
        ))}
    </div>
  )}
</section>

              <section className="transport-admin-notes">
                <h3>Owner Notes</h3>
                <p>{selectedRequest.ownerNotes || "No owner notes."}</p>
              </section>

              <section className="transport-admin-history">
  <h3>Status History</h3>

  {!selectedRequest.adminAuditLog ||
  selectedRequest.adminAuditLog.length === 0 ? (
    <p>No status changes have been recorded.</p>
  ) : (
    <div className="transport-admin-history-list">
      {[...selectedRequest.adminAuditLog]
        .reverse()
        .map((entry) => (
          <div
            key={entry._id || entry.createdAt}
            className="transport-admin-history-item"
          >
            <strong>
              {entry.previousStatus} → {entry.newStatus}
            </strong>

            <div>
              {formatDateTime(entry.createdAt)}
            </div>

            <div>
              Admin:{" "}
              {entry.adminEmail ||
                entry.adminId?.email ||
                "Unknown"}
            </div>

            {entry.note && (
              <div>
                Note: {entry.note}
              </div>
            )}
          </div>
        ))}
    </div>
  )}
</section>

              <section className="transport-admin-request-meta">
                <span>
                  Created: {formatDateTime(selectedRequest.createdAt)}
                </span>

                <span>
                  Updated: {formatDateTime(selectedRequest.updatedAt)}
                </span>
              </section>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}