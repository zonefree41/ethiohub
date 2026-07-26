import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import "./OwnerTransportationDashboard.css";

export default function OwnerTransportationDashboard() {
  const token = localStorage.getItem("ownerToken");

  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState("All");
  const [searchTerm, setSearchTerm] =
  React.useState("");
  const [sortOption, setSortOption] =
  React.useState("Newest");
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const openRequest = (request) => {
  setSelectedRequest(request);
};
  const [modalStatus, setModalStatus] = React.useState("New");

  const [quoteAmount, setQuoteAmount] = React.useState("");
const [estimatedArrival, setEstimatedArrival] = React.useState("");
const [ownerNotes, setOwnerNotes] = React.useState("");
const [driverName, setDriverName] = React.useState("");
const [driverPhone, setDriverPhone] = React.useState("");
const [vehicleDescription, setVehicleDescription] =
  React.useState("");
const [licensePlate, setLicensePlate] =
  React.useState("");

const quoteLocked =
  !!selectedRequest?.customerRespondedAt;

  const quoteEditingLocked =
  quoteLocked && modalStatus === "Quoted";

  React.useEffect(() => {
    document.title = "Transportation Requests | HubEthio";
  }, []);

  React.useEffect(() => {
    async function loadRequests() {
      if (!token) {
        window.location.href = "/owner/login";
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await apiGet(
          "/api/transportation-requests/owner",
          token
        );

        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.message || "Failed to load transportation requests."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [token]);

  function logout() {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerUser");
    window.location.href = "/";
  }

  function formatDate(value) {
    if (!value) return "N/A";

    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const newCount = requests.filter(
  (request) => request.status === "New"
).length;

const quotedCount = requests.filter(
  (request) => request.status === "Quoted"
).length;

const acceptedCount = requests.filter(
  (request) => request.status === "Accepted"
).length;

const inProgressCount = requests.filter(
  (request) => request.status === "In Progress"
).length;

const completedCount = requests.filter(
  (request) => request.status === "Completed"
).length;

const waitingForResponseCount = requests.filter(
  (request) =>
    request.status === "Quoted" &&
    !request.customerRespondedAt
).length;

const estimatedRevenue = requests.reduce(
  (total, request) => {
    const amount = Number(request.quoteAmount);

    if (
      request.status === "Completed" &&
      Number.isFinite(amount)
    ) {
      return total + amount;
    }

    return total;
  },
  0
);

const completedJobsCount = requests.filter(
  (request) => request.status === "Completed"
).length;

const averageQuote =
  requests
    .filter(
      (request) =>
        Number.isFinite(Number(request.quoteAmount))
    )
    .reduce(
      (sum, request) =>
        sum + Number(request.quoteAmount),
      0
    ) /
    Math.max(
      requests.filter((request) =>
        Number.isFinite(Number(request.quoteAmount))
      ).length,
      1
    );

const completionRate =
  requests.length === 0
    ? 0
    : Math.round(
        (completedJobsCount / requests.length) * 100
      );

const filteredRequests = requests.filter((request) => {
  const matchesStatus =
    selectedStatus === "All" ||
    request.status === selectedStatus;

  const search = searchTerm.toLowerCase().trim();

  const matchesSearch =
    !search ||
    request.customerName
      ?.toLowerCase()
      .includes(search) ||
    request.customerPhone
      ?.toLowerCase()
      .includes(search) ||
    request.customerEmail
      ?.toLowerCase()
      .includes(search) ||
    request.serviceType
      ?.toLowerCase()
      .includes(search) ||
    request.pickupAddress
      ?.toLowerCase()
      .includes(search) ||
    request.deliveryAddress
      ?.toLowerCase()
      .includes(search);

  return matchesStatus && matchesSearch;
});

const sortedRequests = [...filteredRequests].sort((a, b) => {
  switch (sortOption) {
    case "Oldest":
      return (
        new Date(a.createdAt) -
        new Date(b.createdAt)
      );

    case "RequestedSoonest":
      return (
        new Date(a.requestedDate) -
        new Date(b.requestedDate)
      );

    case "RequestedLatest":
      return (
        new Date(b.requestedDate) -
        new Date(a.requestedDate)
      );

    case "Newest":
    default:
      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
  }
});

  return (
    <main className="owner-transport-page">
      <div className="owner-transport-container">
        <header className="owner-transport-header">
          <div>
            <a
              href="/owner/dashboard"
              className="owner-transport-back"
            >
              ← Back to Owner Dashboard
            </a>

            <p className="owner-transport-label">
              Transportation Workspace
            </p>

            <h1>🚚 Transportation Requests</h1>

            <p>
              Review customer requests and manage transportation jobs.
            </p>
          </div>

          <button type="button" onClick={logout}>
            Logout
          </button>
        </header>

        {error && (
          <div className="owner-transport-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="owner-transport-state">
            <h2>Loading requests...</h2>
            <p>Please wait while we load your transportation requests.</p>
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="owner-transport-empty">
            <h2>No transportation requests yet</h2>
            <p>
              New customer quote requests will appear here.
            </p>
          </div>
        )}

        {!loading && (
  <section className="owner-transport-summary">

    <div
  className={`owner-summary-card ${
    selectedStatus === "All" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("All")}
>
  <span>📋</span>
  <strong>{requests.length}</strong>
  <p>All</p>
</div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "New" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("New")}
>
  <span>🟢</span>
  <strong>{newCount}</strong>
  <p>New</p>
</div>

<div
  className={`owner-summary-card ${
    selectedStatus === "Quoted" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("Quoted")}
>
  <span>💰</span>
  <strong>{quotedCount}</strong>
  <p>Quoted</p>
</div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "Accepted" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("Accepted")}
>
  <span>✅</span>
  <strong>{acceptedCount}</strong>
  <p>Accepted</p>
</div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "In Progress" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("In Progress")}
>
      <span>🚚</span>
      <strong>{inProgressCount}</strong>
      <p>In Progress</p>
    </div>

    <div
  className={`owner-summary-card ${
    selectedStatus === "Completed" ? "active" : ""
  }`}
  onClick={() => setSelectedStatus("Completed")}
>
      <span>🏁</span>
      <strong>{completedCount}</strong>
      <p>Completed</p>
    </div>
  </section>
)}

{/* NEW Analytics */}
{!loading && (
  <section className="owner-transport-analytics">
    <div className="owner-analytics-card">
  <span>💰</span>
  <div>
    <p>Waiting for Response</p>
    <strong>{waitingForResponseCount}</strong>
  </div>
</div>

<div className="owner-analytics-card">
  <span>🚚</span>
  <div>
    <p>Active Deliveries</p>
    <strong>{inProgressCount}</strong>
  </div>
</div>

<div className="owner-analytics-card revenue">
  <span>💵</span>
  <div>
    <p>Estimated Revenue</p>
    <strong>
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(estimatedRevenue)}
    </strong>
  </div>
</div>

<div className="owner-analytics-card">
  <span>📈</span>
  <div>
    <p>Average Quote</p>
    <strong>
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(averageQuote)}
    </strong>
  </div>
</div>

<div className="owner-analytics-card">
  <span>📦</span>
  <div>
    <p>Total Completed</p>
    <strong>{completedJobsCount}</strong>
  </div>
</div>

<div className="owner-analytics-card">
  <span>⭐</span>
  <div>
    <p>Completion Rate</p>
    <strong>{completionRate}%</strong>
  </div>
</div>
  </section>
)}

{/* Search + Sort */}
<div className="owner-transport-controls">
  <div className="owner-transport-search">
    <input
      type="text"
      placeholder="🔍 Search by customer, phone, service, pickup or delivery..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  <div className="owner-transport-sort">
    <select
      value={sortOption}
      onChange={(e) => setSortOption(e.target.value)}
    >
      <option value="Newest">Newest First</option>
      <option value="Oldest">Oldest First</option>
      <option value="RequestedSoonest">
        Requested Date: Soonest
      </option>
      <option value="RequestedLatest">
        Requested Date: Latest
      </option>
    </select>
  </div>
</div>

        {!loading && requests.length > 0 && (
  sortedRequests.length > 0 ? (
    <section className="owner-transport-grid">
      {sortedRequests.map((request) => (
        <article
  key={request._id}
  className="owner-transport-card"
>
  <div className="owner-transport-card-top">
    <div>
      <p className="owner-transport-service">
        🚚 {request.serviceType || "Transportation Service"}
      </p>

      <h2 className="owner-transport-customer">
        👤 {request.customerName || "Unknown Customer"}
      </h2>
    </div>

    <span
      className={`owner-transport-status status-${(
        request.status || "New"
      )
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      {request.status || "New"}
    </span>
  </div>

  <div className="owner-transport-route">
    <div className="owner-transport-route-item">
      <span className="owner-transport-route-icon">📍</span>

      <div>
        <strong>Pickup</strong>
        <p>{request.pickupAddress || "Not provided"}</p>
      </div>
    </div>

    <div className="owner-transport-route-line" />

    <div className="owner-transport-route-item">
      <span className="owner-transport-route-icon">🏁</span>

      <div>
        <strong>Delivery</strong>
        <p>{request.deliveryAddress || "Not provided"}</p>
      </div>
    </div>
  </div>

  <div className="owner-transport-details">
    <p>
      <span>🏢</span>
      <strong>Business:</strong>{" "}
      {request.listingId?.title || "N/A"}
    </p>

    <p>
      <span>📅</span>
      <strong>Date:</strong>{" "}
      {formatDate(request.requestedDate)}
    </p>

    <p>
      <span>🕒</span>
      <strong>Time:</strong>{" "}
      {request.requestedTime || "Not specified"}
    </p>

    <p>
      <span>📞</span>
      <strong>Phone:</strong>{" "}
      {request.customerPhone || "Not provided"}
    </p>
  </div>

  <button
    type="button"
    className="owner-transport-view-btn"
    onClick={() => openRequest(request)}
  >
    View Details
  </button>
</article>
      ))}
    </section>
  ) : (
    <section className="owner-transport-empty-search">
      <div className="owner-transport-empty-icon">🔍</div>

      <h2>No transportation requests found</h2>

      <p>No requests match your current search or filters.</p>

      <button
        type="button"
        onClick={() => {
          setSearchTerm("");
          setSelectedStatus("All");
        }}
      >
        Clear Search
      </button>
    </section>
  )
)}

{selectedRequest && (
        <div className="owner-transport-modal-overlay">
            <div className="owner-transport-modal">
              <div className="owner-transport-modal-header">
                <div>
                  <p className="owner-transport-modal-label">
                    Transportation Request
                  </p>

                  <h2>{selectedRequest.customerName}</h2>
                </div>

                <button
                  type="button"
                  className="owner-transport-modal-close"
                  onClick={() => setSelectedRequest(null)}
                  aria-label="Close request details">
                  ×
                </button>
              </div>

              <div className="owner-transport-modal-body">
                <div className="owner-transport-modal-section">
                  <h3>👤 Customer Information</h3>

    <p>
  👤 <strong>Name:</strong> {selectedRequest.customerName || "Not provided"}
</p>

<p>
  📞 <strong>Phone:</strong> {selectedRequest.customerPhone || "Not provided"}
</p>

<p>
  📧 <strong>Email:</strong> {selectedRequest.customerEmail || "Not provided"}
</p>
  </div>

  <div className="owner-transport-modal-section">
    <h3>🚚 Transportation Details</h3>

    <p>
  🚚 <strong>Service:</strong>{" "}
  {selectedRequest.serviceType || "Not specified"}
</p>

<p>
  📍 <strong>Pickup:</strong>{" "}
  {selectedRequest.pickupAddress || "Not provided"}
</p>

<p>
  🏁 <strong>Delivery:</strong>{" "}
  {selectedRequest.deliveryAddress || "Not provided"}
</p>

<p>
  📅 <strong>Requested Date:</strong>{" "}
  {formatDate(selectedRequest.requestedDate)}
</p>

<p>
  🕒 <strong>Requested Time:</strong>{" "}
  {selectedRequest.requestedTime || "Not specified"}
</p>
  </div>

  <div className="owner-transport-modal-section">
    <h3>📦 Additional Information</h3>
    <p>
      🏢 <strong>Business:</strong>{" "}
      {selectedRequest.listingId?.title || "N/A"}
    </p>

    {selectedRequest.status === "Quoted" &&
 !selectedRequest.customerRespondedAt && (
  <div className="owner-transport-banner waiting">
    🟡 Waiting for customer response...
  </div>
)}

{selectedRequest.status === "Accepted" && (
  <div className="owner-transport-banner accepted">
    ✅ Customer accepted the quote.
    You can now begin transportation.
  </div>
)}

{selectedRequest.status === "In Progress" && (
  <div className="owner-transport-banner progress">
    🚚 Transportation is currently in progress.
  </div>
)}

{selectedRequest.status === "Completed" && (
  <div className="owner-transport-banner completed">
    🏁 Transportation completed successfully.
  </div>
)}

{selectedRequest.status === "Declined" && (
  <div className="owner-transport-banner declined">
    ❌ Customer declined the quote.
  </div>
)}

    <div className="owner-transport-modal-field">
  <label>
    <strong>Status</strong>
  </label>

  <select
    value={modalStatus}
    onChange={(e) => setModalStatus(e.target.value)}
  >
    <option
  value="New"
  disabled={selectedRequest?.status !== "New"}
>
  New
</option>

<option
  value="Quoted"
  disabled={Boolean(selectedRequest?.customerRespondedAt)}
>
  Quoted
</option>

<option value="Accepted" disabled>
  Accepted (Customer Only)
</option>

<option
  value="Declined"
  disabled
>
  Declined (Customer Only)
</option>

<option
  value="In Progress"
  disabled={selectedRequest?.status !== "Accepted"}
>
  In Progress
</option>

<option
  value="Completed"
  disabled={selectedRequest?.status !== "In Progress"}
>
  Completed
</option>

<option
  value="Cancelled"
  disabled={selectedRequest?.status === "Completed"}
>
  Cancelled
</option>
  </select>
</div>

{modalStatus === "Quoted" && (
  <div className="owner-transport-quote-box">
    <h3>💰 Quote Details</h3>
    {quoteLocked && (
  <div className="owner-transport-quote-locked">
    🔒 This quote has already been accepted or declined by the customer and can no longer be modified.
  </div>
)}

    <div className="owner-transport-modal-field">
      <label>Quote Amount ($)</label>

      <input
        type="number"
        placeholder="Enter quote amount"
        value={quoteAmount}
        onChange={(e) => setQuoteAmount(e.target.value)}
        disabled={quoteLocked}
      />
    </div>

    <div className="owner-transport-modal-field">
      <label>Estimated Arrival</label>

      <input
  type="text"
  placeholder="Example: Tomorrow 9:00 AM"
  value={estimatedArrival}
  onChange={(e) => setEstimatedArrival(e.target.value)}
  disabled={quoteLocked}
/>
    </div>

    <div className="owner-transport-modal-field">
      <label>Owner Notes</label>

      <textarea
  rows="4"
  placeholder="Add notes for the customer..."
  value={ownerNotes}
  onChange={(e) => setOwnerNotes(e.target.value)}
  disabled={quoteLocked}
/>
    </div>
  </div>
)}

{(modalStatus === "In Progress" ||
  modalStatus === "Completed") && (
  <div className="owner-transport-quote-box">
    <h3>🚚 Driver Information</h3>

    <div className="owner-driver-grid">

    <div className="owner-transport-modal-field">
      <label>Driver Name</label>

      <input
        type="text"
        placeholder="Enter driver's name"
        value={driverName}
        onChange={(e) =>
          setDriverName(e.target.value)
        }
      />
    </div>

    <div className="owner-transport-modal-field">
      <label>Driver Phone</label>

      <input
        type="text"
        placeholder="Enter driver's phone"
        value={driverPhone}
        onChange={(e) =>
          setDriverPhone(e.target.value)
        }
      />
    </div>

    <div className="owner-transport-modal-field">
      <label>Vehicle Description</label>

      <input
        type="text"
        placeholder="Example: White Toyota Sienna"
        value={vehicleDescription}
        onChange={(e) =>
          setVehicleDescription(e.target.value)
        }
      />
    </div>

    <div className="owner-transport-modal-field">
      <label>License Plate</label>

      <input
        type="text"
        placeholder="ABC-1234"
        value={licensePlate}
        onChange={(e) =>
          setLicensePlate(e.target.value)
        }
      />
    </div>
    </div>
    </div>
)}

    <p>
      <strong>Notes:</strong>{" "}
      {selectedRequest.notes || "No additional notes"}
    </p>

    <div className="owner-transport-modal-section">
  <h3>🕒 Transportation Timeline</h3>

  <div className="owner-transport-timeline">

    <div className="timeline-item">
      <strong>📝 Request Created</strong>
      <p>
        {selectedRequest.createdAt
          ? new Date(selectedRequest.createdAt).toLocaleString()
          : "—"}
      </p>
    </div>

    {selectedRequest.quotedAt && (
      <div className="timeline-item">
        <strong>💰 Quote Sent</strong>
        <p>
          {new Date(selectedRequest.quotedAt).toLocaleString()}
        </p>
      </div>
    )}

    {selectedRequest.customerRespondedAt && (
      <div className="timeline-item">
        <strong>
          {["Declined", "Cancelled"].includes(
  selectedRequest.status
)
  ? "❌ Customer Declined"
  : "✅ Customer Accepted"}
        </strong>

        <p>
          {new Date(
            selectedRequest.customerRespondedAt
          ).toLocaleString()}
        </p>
      </div>
    )}

    {selectedRequest.inProgressAt && (
      <div className="timeline-item">
        <strong>🚚 In Progress</strong>

        <p>
          {new Date(
            selectedRequest.inProgressAt
          ).toLocaleString()}
        </p>
      </div>
    )}

    {selectedRequest.completedAt && (
      <div className="timeline-item">
        <strong>🏁 Completed</strong>

        <p>
          {new Date(
            selectedRequest.completedAt
          ).toLocaleString()}
        </p>
      </div>
    )}

    {selectedRequest.cancelledAt && (
      <div className="timeline-item">
        <strong>❌ Cancelled</strong>

        <p>
          {new Date(
            selectedRequest.cancelledAt
          ).toLocaleString()}
        </p>
      </div>
    )}

  </div>
</div>
  </div>
</div>

<div className="owner-transport-modal-actions">
  <button
  type="button"
  className="owner-transport-save-btn"
  disabled={quoteEditingLocked}
  onClick={async () => {
    try {
      console.log({
  status: modalStatus,
  quoteAmount,
  estimatedArrival,
  ownerNotes,
});

if (
  modalStatus === "Quoted" &&
  (
    quoteAmount === "" ||
    Number(quoteAmount) <= 0
  )
) {
  alert("Please enter a valid quote amount.");
  return;
}

if (
  modalStatus === "In Progress" &&
  (
    !driverName.trim() ||
    !driverPhone.trim() ||
    !vehicleDescription.trim() ||
    !licensePlate.trim()
  )
) {
  alert(
    "Please complete all driver information before starting the transportation."
  );
  return;
}

      const updated = await apiPatch(
  `/api/transportation-requests/${selectedRequest._id}/status`,
  {
    status: modalStatus,
    quoteAmount,
    estimatedArrival,
    ownerNotes,
    driverName,
    driverPhone,
    vehicleDescription,
    licensePlate,
  },
  token
);

      setRequests((current) =>
  current.map((request) =>
    request._id === updated._id
      ? updated
      : request
  )
);

setSelectedRequest(updated);

setQuoteAmount(
  updated.quoteAmount != null
    ? String(updated.quoteAmount)
    : ""
);

setEstimatedArrival(
  updated.estimatedArrival || ""
);

setOwnerNotes(
  updated.ownerNotes || ""
);

setDriverName(
  updated.driverName || ""
);

setDriverPhone(
  updated.driverPhone || ""
);

setVehicleDescription(
  updated.vehicleDescription || ""
);

setLicensePlate(
  updated.licensePlate || ""
);

      alert("Status updated successfully!");
      setSelectedRequest(null);
    } catch (err) {
      alert(
        err.message ||
          "Failed to update transportation status."
      );
    }
  }}
>
  💾 Save Status
</button>
</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
