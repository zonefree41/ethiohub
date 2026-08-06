import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import WorkspaceLayout from "../../components/owner/workspaces/WorkspaceLayout.jsx";
import WorkspaceStats from "../../components/owner/workspaces/WorkspaceStats.jsx";
import "./OwnerTravelDashboard.css";

const STATUS_OPTIONS = [
  "All",
  "New",
  "Quoted",
  "Accepted",
  "Declined",
  "Booked",
  "Completed",
  "Cancelled",
];

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString();
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default function OwnerTravelDashboard() {
  const token = localStorage.getItem("ownerToken");

  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [selectedStatus, setSelectedStatus] =
    React.useState("All");

    const [successMessage, setSuccessMessage] =
  React.useState("");

const [actionError, setActionError] =
  React.useState("");

  const [searchTerm, setSearchTerm] =
    React.useState("");

  const [sortOption, setSortOption] =
    React.useState("Newest");

  const [selectedRequest, setSelectedRequest] =
    React.useState(null);

  const [modalStatus, setModalStatus] =
    React.useState("New");

  const [quoteAmount, setQuoteAmount] =
    React.useState("");

  const [airline, setAirline] =
    React.useState("");

  const [flightItinerary, setFlightItinerary] =
    React.useState("");

  const [stops, setStops] =
    React.useState("");

  const [baggageAllowance, setBaggageAllowance] =
    React.useState("");

  const [quoteExpiresAt, setQuoteExpiresAt] =
    React.useState("");

  const [ownerNotes, setOwnerNotes] =
    React.useState("");

  const [saving, setSaving] =
    React.useState(false);

  const quoteLocked =
    Boolean(selectedRequest?.customerRespondedAt);

  const quoteFieldsDisabled =
    quoteLocked || modalStatus !== "Quoted";

  React.useEffect(() => {
    document.title = "Travel Requests | HubEthio";
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
          "/api/travel-requests/owner",
          token
        );

        setRequests(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Failed to load travel requests."
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

  function openRequest(request) {
    setSuccessMessage("");
setActionError("");
    setSelectedRequest(request);
    setModalStatus(request.status || "New");

    setQuoteAmount(
      request.quoteAmount != null
        ? String(request.quoteAmount)
        : ""
    );

    setAirline(request.airline || "");
    setFlightItinerary(
      request.flightItinerary || ""
    );
    setStops(request.stops || "");
    setBaggageAllowance(
      request.baggageAllowance || ""
    );
    setQuoteExpiresAt(
      formatDateInput(request.quoteExpiresAt)
    );
    setOwnerNotes(request.ownerNotes || "");
  }

  function closeRequest() {
  if (saving) return;

  setSelectedRequest(null);
  setError("");
  setSuccessMessage("");
  setActionError("");
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

  const bookedCount = requests.filter(
    (request) => request.status === "Booked"
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  const waitingForResponseCount =
    requests.filter(
      (request) =>
        request.status === "Quoted" &&
        !request.customerRespondedAt
    ).length;

  const completedTripsCount =
    requests.filter(
      (request) =>
        request.status === "Completed"
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

  const quotedRequests = requests.filter(
    (request) =>
      Number.isFinite(
        Number(request.quoteAmount)
      )
  );

  const averageQuote =
    quotedRequests.length > 0
      ? quotedRequests.reduce(
          (total, request) =>
            total +
            Number(request.quoteAmount),
          0
        ) / quotedRequests.length
      : 0;

  const completionRate =
    requests.length > 0
      ? Math.round(
          (completedTripsCount /
            requests.length) *
            100
        )
      : 0;

  const filteredRequests = requests.filter(
    (request) => {
      const matchesStatus =
        selectedStatus === "All" ||
        request.status === selectedStatus;

      const search =
        searchTerm.toLowerCase().trim();

      const searchableValues = [
        request.customerName,
        request.customerPhone,
        request.customerEmail,
        request.tripType,
        request.departureCity,
        request.destinationCity,
        request.airline,
        request.listingId?.title,
      ];

      const matchesSearch =
        !search ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(search)
        );

      return matchesStatus && matchesSearch;
    }
  );

  const sortedRequests = [
    ...filteredRequests,
  ].sort((a, b) => {
    switch (sortOption) {
      case "Oldest":
        return (
          new Date(a.createdAt) -
          new Date(b.createdAt)
        );

      case "DepartureSoonest":
        return (
          new Date(a.departureDate) -
          new Date(b.departureDate)
        );

      case "DepartureLatest":
        return (
          new Date(b.departureDate) -
          new Date(a.departureDate)
        );

      case "Newest":
      default:
        return (
          new Date(b.createdAt) -
          new Date(a.createdAt)
        );
    }
  });

  async function saveRequestStatus() {
    if (!selectedRequest) return;
    setSuccessMessage("");
setActionError("");

    if (
      modalStatus === "Quoted" &&
      (
        quoteAmount === "" ||
        !Number.isFinite(
          Number(quoteAmount)
        ) ||
        Number(quoteAmount) <= 0
      )
    ) {
      alert(
        "Please enter a valid quote amount."
      );
      return;
    }

    if (
      modalStatus === "Quoted" &&
      !airline.trim()
    ) {
      alert(
        "Please enter the airline."
      );
      return;
    }

    if (
      modalStatus === "Quoted" &&
      !flightItinerary.trim()
    ) {
      alert(
        "Please enter the flight itinerary."
      );
      return;
    }

    try {
      setSaving(true);

      const updated = await apiPatch(
        `/api/travel-requests/${selectedRequest._id}/status`,
        {
          status: modalStatus,

          quoteAmount:
            quoteAmount === ""
              ? null
              : Number(quoteAmount),

          airline: airline.trim(),

          flightItinerary:
            flightItinerary.trim(),

          stops: stops.trim(),

          baggageAllowance:
            baggageAllowance.trim(),

          quoteExpiresAt:
            quoteExpiresAt || null,

          ownerNotes:
            ownerNotes.trim(),
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
      setModalStatus(
        updated.status || modalStatus
      );

      setQuoteAmount(
        updated.quoteAmount != null
          ? String(updated.quoteAmount)
          : ""
      );

      setAirline(updated.airline || "");

      setFlightItinerary(
        updated.flightItinerary || ""
      );

      setStops(updated.stops || "");

      setBaggageAllowance(
        updated.baggageAllowance || ""
      );

      setQuoteExpiresAt(
        formatDateInput(
          updated.quoteExpiresAt
        )
      );

      setOwnerNotes(
        updated.ownerNotes || ""
      );

      setSuccessMessage(
  "Travel request updated successfully!"
);

setSelectedRequest(updated);
    } catch (err) {
      setActionError(
  err.message ||
    "Failed to update travel request."
);
    } finally {
      setSaving(false);
    }
  }

  return (
  <WorkspaceLayout
    label="Travel Agency Workspace"
    title="Travel Requests"
    icon="✈️"
    description="Review traveler requests, prepare quotes, and manage bookings."
    actions={
      <button
        type="button"
        onClick={logout}
      >
        Logout
      </button>
    }
  >

        {error && (
          <div className="owner-transport-error">
            {error}
          </div>
        )}

        {loading && (
          <div className="owner-transport-state">
            <h2>Loading travel requests...</h2>

            <p>
              Please wait while we load your
              customer travel requests.
            </p>
          </div>
        )}

        {!loading &&
          requests.length === 0 && (
            <div className="owner-transport-empty">
              <h2>
                No travel requests yet
              </h2>

              <p>
                New customer travel requests
                will appear here.
              </p>
            </div>
          )}

        {!loading && (
          <section className="owner-transport-summary">
            {[
              {
                status: "All",
                icon: "📋",
                count: requests.length,
              },
              {
                status: "New",
                icon: "🟢",
                count: newCount,
              },
              {
                status: "Quoted",
                icon: "💰",
                count: quotedCount,
              },
              {
                status: "Accepted",
                icon: "✅",
                count: acceptedCount,
              },
              {
                status: "Booked",
                icon: "✈️",
                count: bookedCount,
              },
              {
                status: "Completed",
                icon: "🏁",
                count: completedCount,
              },
            ].map((item) => (
              <button
                type="button"
                key={item.status}
                className={`owner-summary-card ${
                  selectedStatus === item.status
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedStatus(item.status)
                }
              >
                <span>{item.icon}</span>
                <strong>{item.count}</strong>
                <p>{item.status}</p>
              </button>
            ))}
          </section>
        )}

        {!loading && (
          <section className="owner-transport-analytics">
            <div className="owner-analytics-card">
              <span>⏳</span>

              <div>
                <p>Waiting for Response</p>
                <strong>
                  {waitingForResponseCount}
                </strong>
              </div>
            </div>

            <div className="owner-analytics-card">
              <span>✈️</span>

              <div>
                <p>Active Bookings</p>
                <strong>{bookedCount}</strong>
              </div>
            </div>

            <div className="owner-analytics-card revenue">
              <span>💵</span>

              <div>
                <p>Estimated Revenue</p>
                <strong>
                  {formatMoney(
                    estimatedRevenue
                  )}
                </strong>
              </div>
            </div>

            <div className="owner-analytics-card">
              <span>📈</span>

              <div>
                <p>Average Quote</p>
                <strong>
                  {formatMoney(averageQuote)}
                </strong>
              </div>
            </div>

            <div className="owner-analytics-card">
              <span>✅</span>

              <div>
                <p>Total Completed</p>
                <strong>
                  {completedTripsCount}
                </strong>
              </div>
            </div>

            <div className="owner-analytics-card">
              <span>⭐</span>

              <div>
                <p>Completion Rate</p>
                <strong>
                  {completionRate}%
                </strong>
              </div>
            </div>
          </section>
        )}

        <div className="owner-transport-controls">
          <div className="owner-transport-search">
            <input
              type="text"
              placeholder="🔍 Search customer, airline, departure, destination..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />
          </div>

          <div className="owner-transport-sort">
            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(
                  event.target.value
                )
              }
            >
              <option value="Newest">
                Newest First
              </option>

              <option value="Oldest">
                Oldest First
              </option>

              <option value="DepartureSoonest">
                Departure: Soonest
              </option>

              <option value="DepartureLatest">
                Departure: Latest
              </option>
            </select>
          </div>
        </div>

        {!loading &&
          requests.length > 0 &&
          (
            sortedRequests.length > 0 ? (
              <section className="owner-transport-grid">
                {sortedRequests.map(
                  (request) => (
                    <article
                      key={request._id}
                      className="owner-transport-card"
                    >
                      <div className="owner-transport-card-top">
                        <div>
                          <p className="owner-transport-service">
                            ✈️{" "}
                            {request.tripType ||
                              "Travel Request"}
                          </p>

                          <h2 className="owner-transport-customer">
                            👤{" "}
                            {request.customerName ||
                              "Unknown Customer"}
                          </h2>

                          <p className="owner-travel-route-summary">
  {request.departureCity || "Departure not provided"}
  {" → "}
  {request.destinationCity || "Destination not provided"}
</p>
                        </div>

                        <span
                          className={`owner-transport-status status-${String(
                            request.status ||
                              "New"
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          {request.status ||
                            "New"}
                        </span>
                      </div>

                      <div className="owner-transport-route">
                        <div className="owner-transport-route-item">
                          <span className="owner-transport-route-icon">
                            🛫
                          </span>

                          <div>
                            <strong>
                              Departure
                            </strong>

                            <p>
                              {request.departureCity ||
                                "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="owner-transport-route-line" />

                        <div className="owner-transport-route-item">
                          <span className="owner-transport-route-icon">
                            🛬
                          </span>

                          <div>
                            <strong>
                              Destination
                            </strong>

                            <p>
                              {request.destinationCity ||
                                "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="owner-transport-details owner-travel-card-details">
  <p>
    <span>📅</span>
    <strong>Departure:</strong>{" "}
    {formatDate(request.departureDate)}
  </p>

  {request.returnDate && (
    <p>
      <span>🔁</span>
      <strong>Return:</strong>{" "}
      {formatDate(request.returnDate)}
    </p>
  )}

  <p>
    <span>🎫</span>
    <strong>Cabin:</strong>{" "}
    {request.cabinClass || "Not specified"}
  </p>

  <p>
    <span>👥</span>
    <strong>Travelers:</strong>{" "}
    {(request.adults || 0) +
      (request.children || 0) +
      (request.infants || 0)}
  </p>

  <p>
    <span>💵</span>
    <strong>Budget:</strong>{" "}
    {request.budget != null
      ? formatMoney(request.budget)
      : "Not provided"}
  </p>

  {request.quoteAmount != null && (
    <p>
      <span>💰</span>
      <strong>Quote:</strong>{" "}
      {formatMoney(request.quoteAmount)}
    </p>
  )}

  <p>
    <span>📞</span>
    <strong>Phone:</strong>{" "}
    {request.customerPhone || "Not provided"}
  </p>

  <p>
    <span>🏢</span>
    <strong>Agency:</strong>{" "}
    {request.listingId?.title || "N/A"}
  </p>
</div>

                      <button
                        type="button"
                        className="owner-transport-view-btn"
                        onClick={() =>
                          openRequest(request)
                        }
                      >
                        View Details
                      </button>
                    </article>
                  )
                )}
              </section>
            ) : (
              <section className="owner-transport-empty-search">
                <div className="owner-transport-empty-icon">
                  🔍
                </div>

                <h2>
                  No travel requests found
                </h2>

                <p>
                  No requests match your
                  current search or filters.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus(
                      "All"
                    );
                  }}
                >
                  Clear Search
                </button>
              </section>
            )
          )}

        {selectedRequest && (
          <div
            className="owner-transport-modal-overlay"
            role="presentation"
          >
            <div
              className="owner-transport-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Travel request details"
            >
              <div className="owner-transport-modal-header">
                <div>
                  <p className="owner-transport-modal-label">
                    Travel Request
                  </p>

                  <h2>
                    {selectedRequest.customerName}
                  </h2>
                </div>

                <button
                  type="button"
                  className="owner-transport-modal-close"
                  onClick={closeRequest}
                  aria-label="Close request details"
                >
                  ×
                </button>
              </div>

              <div className="owner-transport-modal-body">
                {successMessage && (
  <div className="owner-travel-action-message success">
    {successMessage}
  </div>
)}

{actionError && (
  <div className="owner-travel-action-message error">
    {actionError}
  </div>
)}
                <div className="owner-transport-modal-section">
                  <h3>
                    👤 Customer Information
                  </h3>

                  <p>
                    👤 <strong>Name:</strong>{" "}
                    {selectedRequest.customerName ||
                      "Not provided"}
                  </p>

                  <p>
                    📞 <strong>Phone:</strong>{" "}
                    {selectedRequest.customerPhone ||
                      "Not provided"}
                  </p>

                  <p>
                    📧 <strong>Email:</strong>{" "}
                    {selectedRequest.customerEmail ||
                      "Not provided"}
                  </p>
                </div>

                <div className="owner-transport-modal-section">
                  <h3>✈️ Travel Details</h3>

                  <p>
                    ✈️{" "}
                    <strong>Trip Type:</strong>{" "}
                    {selectedRequest.tripType ||
                      "Not specified"}
                  </p>

                  <p>
                    🛫{" "}
                    <strong>Departure:</strong>{" "}
                    {selectedRequest.departureCity ||
                      "Not provided"}
                  </p>

                  <p>
                    🛬{" "}
                    <strong>Destination:</strong>{" "}
                    {selectedRequest.destinationCity ||
                      "Not provided"}
                  </p>

                  <p>
                    📅{" "}
                    <strong>
                      Departure Date:
                    </strong>{" "}
                    {formatDate(
                      selectedRequest.departureDate
                    )}
                  </p>

                  {selectedRequest.returnDate && (
                    <p>
                      🔁{" "}
                      <strong>
                        Return Date:
                      </strong>{" "}
                      {formatDate(
                        selectedRequest.returnDate
                      )}
                    </p>
                  )}

                  <p>
                    🎫{" "}
                    <strong>Cabin Class:</strong>{" "}
                    {selectedRequest.cabinClass ||
                      "Not specified"}
                  </p>

                  <p>
                    👥{" "}
                    <strong>Travelers:</strong>{" "}
                    {selectedRequest.adults ||
                      0}{" "}
                    adult(s),{" "}
                    {selectedRequest.children ||
                      0}{" "}
                    child(ren),{" "}
                    {selectedRequest.infants ||
                      0}{" "}
                    infant(s)
                  </p>

                  <p>
                    💵 <strong>Budget:</strong>{" "}
                    {selectedRequest.budget != null
                      ? formatMoney(
                          selectedRequest.budget
                        )
                      : "Not provided"}
                  </p>
                </div>

                <div className="owner-transport-modal-section">
  <h3>🎯 Customer Preferences</h3>

  <p>
    {selectedRequest.directFlightPreferred
      ? "✅"
      : "❌"}{" "}
    Direct Flight Preferred
  </p>

  <p>
    {selectedRequest.flexibleDates
      ? "✅"
      : "❌"}{" "}
    Flexible Dates
  </p>

  <p>
    {selectedRequest.hotelNeeded
      ? "✅"
      : "❌"}{" "}
    Hotel Needed
  </p>

  <p>
    {selectedRequest.visaAssistance
      ? "✅"
      : "❌"}{" "}
    Visa Assistance
  </p>

  <p>
    {selectedRequest.travelInsurance
      ? "✅"
      : "❌"}{" "}
    Travel Insurance
  </p>
</div>

                <div className="owner-transport-modal-section">
                  <h3>
                    🧳 Extra Assistance
                  </h3>

                  <p>
                    📝{" "}
                    <strong>
                      Customer Notes:
                    </strong>{" "}
                    {selectedRequest.notes ||
                      "No additional notes"}
                  </p>

                  <p>
                    🏢{" "}
                    <strong>Agency:</strong>{" "}
                    {selectedRequest.listingId
                      ?.title || "N/A"}
                  </p>
                </div>

               <section className="owner-travel-customer-summary">
  <div className="owner-travel-customer-summary-header">
    <div>
      <span className="owner-travel-customer-avatar">
        {selectedRequest.customerName
          ?.trim()
          .charAt(0)
          .toUpperCase() || "T"}
      </span>

      <div>
        <small>Traveler</small>

        <h3>
          {selectedRequest.customerName ||
            "Unknown Traveler"}
        </h3>
      </div>
    </div>

    <span
      className={`owner-transport-status status-${String(
        selectedRequest.status || "New"
      )
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      {selectedRequest.status || "New"}
    </span>
  </div>

  <div className="owner-travel-modal-summary">
    <div>
      <span>✈️ Trip Type</span>

      <strong>
        {selectedRequest.tripType ||
          "Not specified"}
      </strong>
    </div>

    <div>
      <span>🛫 Route</span>

      <strong>
        {selectedRequest.departureCity || "—"}
        {" → "}
        {selectedRequest.destinationCity || "—"}
      </strong>
    </div>

    <div>
      <span>📅 Departure</span>

      <strong>
        {formatDate(
          selectedRequest.departureDate
        )}
      </strong>
    </div>

    <div>
      <span>💺 Cabin</span>

      <strong>
        {selectedRequest.cabinClass ||
          "Not specified"}
      </strong>
    </div>

    <div>
      <span>👥 Travelers</span>

      <strong>
        {(selectedRequest.adults || 0) +
          (selectedRequest.children || 0) +
          (selectedRequest.infants || 0)}
        {" total"}
      </strong>
    </div>

    <div>
      <span>💵 Customer Budget</span>

      <strong>
        {selectedRequest.budget != null
          ? formatMoney(
              selectedRequest.budget
            )
          : "Not provided"}
      </strong>
    </div>
  </div>
</section>

{selectedRequest.budget != null &&
  selectedRequest.quoteAmount != null && (
    <section
      className={`owner-travel-budget-comparison ${
        Number(selectedRequest.quoteAmount) <=
        Number(selectedRequest.budget)
          ? "within-budget"
          : Number(selectedRequest.quoteAmount) <=
              Number(selectedRequest.budget) * 1.1
            ? "slightly-above"
            : "above-budget"
      }`}
    >
      <div className="owner-travel-budget-comparison-header">
        <div>
          <p>💰 Budget vs Quote</p>
          <h3>Pricing Comparison</h3>
        </div>

        <span>
          {Number(selectedRequest.quoteAmount) <=
          Number(selectedRequest.budget)
            ? "Within Budget"
            : Number(selectedRequest.quoteAmount) <=
                Number(selectedRequest.budget) * 1.1
              ? "Slightly Above"
              : "Above Budget"}
        </span>
      </div>

      <div className="owner-travel-budget-comparison-grid">
        <div>
          <small>Customer Budget</small>
          <strong>
            {formatMoney(selectedRequest.budget)}
          </strong>
        </div>

        <div>
          <small>Agency Quote</small>
          <strong>
            {formatMoney(selectedRequest.quoteAmount)}
          </strong>
        </div>

        <div>
          <small>Difference</small>
          <strong>
            {Number(selectedRequest.quoteAmount) -
              Number(selectedRequest.budget) >=
            0
              ? "+"
              : ""}
            {formatMoney(
              Number(selectedRequest.quoteAmount) -
                Number(selectedRequest.budget)
            )}
          </strong>
        </div>
      </div>
    </section>
  )}

{selectedRequest.quoteAmount != null && (
  <section className="owner-travel-quote-summary">
    <div className="owner-travel-quote-summary-header">
      <div>
        <p>Travel Quote</p>
        <h3>
          {formatMoney(selectedRequest.quoteAmount)}
        </h3>
      </div>

      <span>
        {selectedRequest.status || "Quoted"}
      </span>
    </div>

    <div className="owner-travel-quote-summary-grid">
      <div>
        <small>Airline</small>
        <strong>
          {selectedRequest.airline || "Not specified"}
        </strong>
      </div>

      <div>
        <small>Stops</small>
        <strong>
          {selectedRequest.stops || "Not specified"}
        </strong>
      </div>

      <div>
        <small>Baggage</small>
        <strong>
          {selectedRequest.baggageAllowance ||
            "Not specified"}
        </strong>
      </div>

      <div>
        <small>Expires</small>
        <strong>
          {selectedRequest.quoteExpiresAt
            ? formatDate(selectedRequest.quoteExpiresAt)
            : "No expiration"}
        </strong>
      </div>
    </div>

    {selectedRequest.flightItinerary && (
      <div className="owner-travel-itinerary">
        <small>Flight Itinerary</small>
        <p>{selectedRequest.flightItinerary}</p>
      </div>
    )}

    {selectedRequest.ownerNotes && (
      <div className="owner-travel-itinerary">
        <small>Agency Notes</small>
        <p>{selectedRequest.ownerNotes}</p>
      </div>
    )}
  </section>
)}
                

                {selectedRequest.status ===
                  "Quoted" &&
                  !selectedRequest.customerRespondedAt && (
                    <div className="owner-transport-banner waiting">
                      🟡 Waiting for customer
                      response...
                    </div>
                  )}

                {selectedRequest.status ===
                  "Accepted" && (
                    <div className="owner-transport-banner accepted">
                      ✅ Customer accepted the
                      quote. You can now mark the
                      trip as booked.
                    </div>
                  )}

                {selectedRequest.status ===
                  "Booked" && (
                    <div className="owner-transport-banner progress">
                      ✈️ This trip has been
                      marked as booked.
                    </div>
                  )}

                {selectedRequest.status ===
                  "Completed" && (
                    <div className="owner-transport-banner completed">
                      ✅ Travel request completed
                      successfully.
                    </div>
                  )}

                {selectedRequest.status ===
                  "Declined" && (
                    <div className="owner-transport-banner declined">
                      ❌ Customer declined the
                      quote.
                    </div>
                  )}

                {selectedRequest.status ===
                  "Cancelled" && (
                    <div className="owner-transport-banner declined">
                      ❌ Travel request was
                      cancelled.
                    </div>
                  )}

                <div className="owner-transport-modal-section">
                  <div className="owner-transport-modal-field">
                    <label htmlFor="travel-status">
                      <strong>Status</strong>
                    </label>

                    <select
                      id="travel-status"
                      value={modalStatus}
                      onChange={(event) =>
                        setModalStatus(
                          event.target.value
                        )
                      }
                    >
                      {STATUS_OPTIONS
                        .filter(
                          (status) =>
                            status !== "All"
                        )
                        .map((status) => {
                          let disabled = false;

                          if (status === "New") {
                            disabled =
                              selectedRequest.status !==
                              "New";
                          }

                          if (
                            status === "Quoted"
                          ) {
                            disabled =
                              Boolean(
                                selectedRequest
                                  .customerRespondedAt
                              ) ||
                              ![
                                "New",
                                "Quoted",
                              ].includes(
                                selectedRequest.status
                              );
                          }

                          if (
                            status ===
                              "Accepted" ||
                            status === "Declined"
                          ) {
                            disabled = true;
                          }

                          if (
                            status === "Booked"
                          ) {
                            disabled =
                              ![
                                "Accepted",
                                "Booked",
                              ].includes(
                                selectedRequest.status
                              );
                          }

                          if (
                            status ===
                            "Completed"
                          ) {
                            disabled =
                              ![
                                "Booked",
                                "Completed",
                              ].includes(
                                selectedRequest.status
                              );
                          }

                          if (
                            status ===
                            "Cancelled"
                          ) {
                            disabled =
                              selectedRequest.status ===
                                "Completed" ||
                              selectedRequest.status ===
                                "Declined";
                          }

                          return (
                            <option
                              key={status}
                              value={status}
                              disabled={disabled}
                            >
                              {status ===
                              "Accepted"
                                ? "Accepted (Customer Only)"
                                : status ===
                                    "Declined"
                                  ? "Declined (Customer Only)"
                                  : status}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                {(modalStatus === "Quoted" ||
                  selectedRequest.quoteAmount !=
                    null) && (
                  <div className="owner-transport-quote-box">
                    <h3>
                      💰 Travel Quote Details
                    </h3>

                    {quoteLocked && (
                      <div className="owner-transport-quote-locked">
                        🔒 The customer has
                        already accepted or
                        declined this quote. Quote
                        details can no longer be
                        modified.
                      </div>
                    )}

                    <div className="owner-transport-modal-field">
                      <label>
                        Quote Amount ($)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter quote amount"
                        value={quoteAmount}
                        onChange={(event) =>
                          setQuoteAmount(
                            event.target.value
                          )
                        }
                        disabled={
                          quoteFieldsDisabled
                        }
                      />
                    </div>

                    <div className="owner-transport-modal-field">
                      <label>Airline</label>

                      <input
                        type="text"
                        placeholder="Example: Ethiopian Airlines"
                        value={airline}
                        onChange={(event) =>
                          setAirline(
                            event.target.value
                          )
                        }
                        disabled={
                          quoteFieldsDisabled
                        }
                      />
                    </div>

                    <div className="owner-transport-modal-field">
                      <label>Stops</label>

                      <input
                        type="text"
                        placeholder="Example: Non-stop or 1 stop"
                        value={stops}
                        onChange={(event) =>
                          setStops(
                            event.target.value
                          )
                        }
                        disabled={
                          quoteFieldsDisabled
                        }
                      />
                    </div>

                    <div className="owner-transport-modal-field">
                      <label>
                        Baggage Allowance
                      </label>

                      <input
                        type="text"
                        placeholder="Example: 2 checked bags and 1 carry-on"
                        value={
                          baggageAllowance
                        }
                        onChange={(event) =>
                          setBaggageAllowance(
                            event.target.value
                          )
                        }
                        disabled={
                          quoteFieldsDisabled
                        }
                      />
                    </div>

                    <div className="owner-transport-modal-field">
                      <label>
                        Quote Expiration Date
                      </label>

                      <input
                        type="date"
                        value={quoteExpiresAt}
                        onChange={(event) =>
                          setQuoteExpiresAt(
                            event.target.value
                          )
                        }
                        disabled={
                          quoteFieldsDisabled
                        }
                      />
                    </div>

                    <div className="owner-transport-modal-field">
                      <label>
                        Flight Itinerary
                      </label>

                      <textarea
                        rows="5"
                        placeholder="Flight numbers, departure and arrival times, and connection details."
                        value={flightItinerary}
                        onChange={(event) =>
                          setFlightItinerary(
                            event.target.value
                          )
                        }
                        disabled={
                          quoteFieldsDisabled
                        }
                      />
                    </div>

                    <div className="owner-transport-modal-field">
                      <label>
                        Agency Notes
                      </label>

                      <textarea
                        rows="4"
                        placeholder="Add notes for the traveler..."
                        value={ownerNotes}
                        onChange={(event) =>
                          setOwnerNotes(
                            event.target.value
                          )
                        }
                        disabled={
                          quoteFieldsDisabled
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="owner-transport-modal-section">
                  <h3>🕒 Travel Timeline</h3>

                  <div className="owner-travel-timeline">
  <div className="owner-travel-timeline-item complete">
    <div className="owner-travel-timeline-marker">
      📝
    </div>

    <div>
      <strong>Request Submitted</strong>
      <p>
        {formatDateTime(
          selectedRequest.createdAt
        )}
      </p>
    </div>
  </div>

  <div
    className={`owner-travel-timeline-item ${
      selectedRequest.quotedAt
        ? "complete"
        : "pending"
    }`}
  >
    <div className="owner-travel-timeline-marker">
      💰
    </div>

    <div>
      <strong>Quote Sent</strong>
      <p>
        {selectedRequest.quotedAt
          ? formatDateTime(
              selectedRequest.quotedAt
            )
          : "Waiting for quote"}
      </p>
    </div>
  </div>

  <div
    className={`owner-travel-timeline-item ${
      selectedRequest.customerRespondedAt
        ? selectedRequest.status ===
          "Declined"
          ? "declined"
          : "complete"
        : "pending"
    }`}
  >
    <div className="owner-travel-timeline-marker">
      {selectedRequest.status ===
      "Declined"
        ? "❌"
        : "✅"}
    </div>

    <div>
      <strong>
        {selectedRequest.status ===
        "Declined"
          ? "Quote Declined"
          : "Quote Accepted"}
      </strong>

      <p>
        {selectedRequest.customerRespondedAt
          ? formatDateTime(
              selectedRequest
                .customerRespondedAt
            )
          : "Waiting for customer response"}
      </p>
    </div>
  </div>

  <div
    className={`owner-travel-timeline-item ${
      selectedRequest.bookedAt
        ? "complete"
        : "pending"
    }`}
  >
    <div className="owner-travel-timeline-marker">
      🎫
    </div>

    <div>
      <strong>Booking Confirmed</strong>
      <p>
        {selectedRequest.bookedAt
          ? formatDateTime(
              selectedRequest.bookedAt
            )
          : "Not booked yet"}
      </p>
    </div>
  </div>

  <div
    className={`owner-travel-timeline-item ${
      selectedRequest.completedAt
        ? "complete"
        : "pending"
    }`}
  >
    <div className="owner-travel-timeline-marker">
      🏁
    </div>

    <div>
      <strong>Trip Completed</strong>
      <p>
        {selectedRequest.completedAt
          ? formatDateTime(
              selectedRequest.completedAt
            )
          : "Not completed yet"}
      </p>
    </div>
  </div>

  {selectedRequest.cancelledAt && (
    <div className="owner-travel-timeline-item declined">
      <div className="owner-travel-timeline-marker">
        ❌
      </div>

      <div>
        <strong>Travel Request Cancelled</strong>
        <p>
          {formatDateTime(
            selectedRequest.cancelledAt
          )}
        </p>
      </div>
    </div>
  )}
</div>
                </div>
              </div>

              <div className="owner-transport-modal-actions">
                <button
                  type="button"
                  className="owner-transport-save-btn"
                  disabled={
                    saving ||
                    (
                      modalStatus ===
                        "Quoted" &&
                      quoteLocked
                    ) ||
                    modalStatus ===
                      "Accepted" ||
                    modalStatus ===
                      "Declined"
                  }
                  onClick={saveRequestStatus}
                >
                  {saving
                    ? "Saving..."
                    : "💾 Save Status"}
                </button>
              </div>
            </div>
          </div>
        )}
       </WorkspaceLayout>
  );
}