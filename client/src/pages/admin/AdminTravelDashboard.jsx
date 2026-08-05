import React from "react";
import {
  apiGet,
  apiPatch,
} from "../../api/http.js";
import "./AdminTravelDashboard.css";

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

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest First",
  },
  {
    value: "oldest",
    label: "Oldest First",
  },
  {
    value: "departureOldest",
    label: "Departure: Soonest",
  },
  {
    value: "departureNewest",
    label: "Departure: Latest",
  },
  {
    value: "amountHigh",
    label: "Quote: Highest",
  },
  {
    value: "amountLow",
    label: "Quote: Lowest",
  },
];

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function formatDateInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not quoted";
  }

  return amount.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  );
}

function getStatusClass(value) {
  switch (value) {
    case "New":
      return "transport-status-new";

    case "Quoted":
      return "transport-status-quoted";

    case "Accepted":
      return "transport-status-accepted";

    case "Booked":
      return "transport-status-booked";

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

function getTravelerCount(request) {
  return (
    Number(request?.adults || 0) +
    Number(request?.children || 0) +
    Number(request?.infants || 0)
  );
}

export default function AdminTravelDashboard() {
  const token =
    localStorage.getItem("adminToken");

  const [requests, setRequests] =
    React.useState([]);

  const [analytics, setAnalytics] =
    React.useState(null);

  const [agencies, setAgencies] =
    React.useState([]);

  const [search, setSearch] =
    React.useState("");

  const [status, setStatus] =
    React.useState("All");

  const [tripType, setTripType] =
    React.useState("All");

  const [businessId, setBusinessId] =
    React.useState("");

  const [sort, setSort] =
    React.useState("newest");

  const [startDate, setStartDate] =
    React.useState("");

  const [endDate, setEndDate] =
    React.useState("");

  const [page, setPage] =
    React.useState(1);

  const [pagination, setPagination] =
    React.useState({
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [
    selectedRequest,
    setSelectedRequest,
  ] = React.useState(null);

  const [
    editableStatus,
    setEditableStatus,
  ] = React.useState("New");

  const [statusNote, setStatusNote] =
    React.useState("");

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = React.useState(false);

  const [
    statusMessage,
    setStatusMessage,
  ] = React.useState("");

  const [quoteForm, setQuoteForm] =
    React.useState({
      quoteAmount: "",
      airline: "",
      flightItinerary: "",
      stops: "",
      baggageAllowance: "",
      quoteExpiresAt: "",
      ownerNotes: "",
      adminNote: "",
    });

  const [savingQuote, setSavingQuote] =
    React.useState(false);

  const [quoteMessage, setQuoteMessage] =
    React.useState("");

  const [loading, setLoading] =
    React.useState(false);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = React.useState(false);

  const [error, setError] =
    React.useState("");

  React.useEffect(() => {
    document.title =
      "Travel Admin | HubEthio";

    if (!token) {
      window.location.href =
        "/admin/login";
    }
  }, [token]);

  async function loadAnalytics() {
    try {
      const data = await apiGet(
        "/api/admin/travel-requests/analytics",
        token
      );

      setAnalytics(data);
    } catch (err) {
      console.error(
        "Travel analytics error:",
        err
      );
    }
  }

  async function loadAgencies() {
    try {
      const data = await apiGet(
        "/api/admin/travel-requests/businesses",
        token
      );

      setAgencies(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Travel agencies error:",
        err
      );

      setAgencies([]);
    }
  }

  async function loadRequests(
    nextPage = page
  ) {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams({
          page: String(nextPage),
          limit: "25",
          status,
          tripType,
          sort,
        });

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (businessId) {
        params.set(
          "businessId",
          businessId
        );
      }

      if (startDate) {
        params.set(
          "startDate",
          startDate
        );
      }

      if (endDate) {
        params.set(
          "endDate",
          endDate
        );
      }

      const data = await apiGet(
        `/api/admin/travel-requests?${params.toString()}`,
        token
      );

      setRequests(
        Array.isArray(data.requests)
          ? data.requests
          : []
      );

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
      setError(
        err.message ||
          "Failed to load travel requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshDashboard() {
    await Promise.all([
      loadAnalytics(),
      loadAgencies(),
      loadRequests(page),
    ]);
  }

  React.useEffect(() => {
    if (!token) return;

    loadAnalytics();
    loadAgencies();
  }, [token]);

  React.useEffect(() => {
    if (!token) return;

    loadRequests(1);
  }, [
    token,
    status,
    tripType,
    businessId,
    sort,
    startDate,
    endDate,
  ]);

  function populateQuoteForm(request) {
    setQuoteForm({
      quoteAmount:
        request.quoteAmount != null
          ? String(
              request.quoteAmount
            )
          : "",

      airline:
        request.airline || "",

      flightItinerary:
        request.flightItinerary || "",

      stops:
        request.stops || "",

      baggageAllowance:
        request.baggageAllowance || "",

      quoteExpiresAt:
        formatDateInput(
          request.quoteExpiresAt
        ),

      ownerNotes:
        request.ownerNotes || "",

      adminNote: "",
    });
  }

  async function openRequest(requestId) {
    try {
      setDetailsLoading(true);
      setError("");
      setStatusMessage("");
      setQuoteMessage("");
      setStatusNote("");

      const data = await apiGet(
        `/api/admin/travel-requests/${requestId}`,
        token
      );

      setSelectedRequest(data);

      setEditableStatus(
        data.status || "New"
      );

      populateQuoteForm(data);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load travel request details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeRequest() {
    if (
      updatingStatus ||
      savingQuote
    ) {
      return;
    }

    setSelectedRequest(null);
    setStatusMessage("");
    setQuoteMessage("");
    setStatusNote("");
  }

  async function updateRequestStatus() {
    if (!selectedRequest?._id) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusMessage("");
      setQuoteMessage("");

      const data = await apiPatch(
        `/api/admin/travel-requests/${selectedRequest._id}/status`,
        {
          status: editableStatus,
          note: statusNote.trim(),
        },
        token
      );

      const updatedRequest =
        data.request;

      setSelectedRequest(
        updatedRequest
      );

      setEditableStatus(
        updatedRequest.status
      );

      setStatusNote("");

      populateQuoteForm(
        updatedRequest
      );

      setRequests(
        (currentRequests) =>
          currentRequests.map(
            (request) =>
              request._id ===
              updatedRequest._id
                ? {
                    ...request,
                    ...updatedRequest,
                  }
                : request
          )
      );

      setStatusMessage(
        data.message ||
          "Travel request status updated successfully."
      );

      await loadAnalytics();
    } catch (err) {
      setStatusMessage(
        err.message ||
          "Failed to update travel request status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function saveQuote() {
    if (!selectedRequest?._id) {
      return;
    }

    const parsedAmount =
      quoteForm.quoteAmount === ""
        ? null
        : Number(
            quoteForm.quoteAmount
          );

    if (
      parsedAmount !== null &&
      (
        !Number.isFinite(
          parsedAmount
        ) ||
        parsedAmount < 0
      )
    ) {
      setQuoteMessage(
        "Please enter a valid quote amount."
      );
      return;
    }

    try {
      setSavingQuote(true);
      setQuoteMessage("");
      setStatusMessage("");

      const data = await apiPatch(
        `/api/admin/travel-requests/${selectedRequest._id}/quote`,
        {
          quoteAmount:
            parsedAmount,

          airline:
            quoteForm.airline.trim(),

          flightItinerary:
            quoteForm.flightItinerary.trim(),

          stops:
            quoteForm.stops.trim(),

          baggageAllowance:
            quoteForm.baggageAllowance.trim(),

          quoteExpiresAt:
            quoteForm.quoteExpiresAt ||
            null,

          ownerNotes:
            quoteForm.ownerNotes.trim(),

          adminNote:
            quoteForm.adminNote.trim(),
        },
        token
      );

      const updatedRequest =
        data.request;

      setSelectedRequest(
        updatedRequest
      );

      populateQuoteForm(
        updatedRequest
      );

      setRequests(
        (currentRequests) =>
          currentRequests.map(
            (request) =>
              request._id ===
              updatedRequest._id
                ? {
                    ...request,
                    ...updatedRequest,
                  }
                : request
          )
      );

      setQuoteMessage(
        data.message ||
          "Travel quote updated successfully."
      );

      await loadAnalytics();
    } catch (err) {
      setQuoteMessage(
        err.message ||
          "Failed to update travel quote."
      );
    } finally {
      setSavingQuote(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadRequests(1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("All");
    setTripType("All");
    setBusinessId("");
    setSort("newest");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function logout() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login";
}

function exportCsv() {
  if (!requests.length) {
    setError(
      "There are no currently loaded travel requests to export."
    );
    return;
  }

  setError("");

  const rows = requests.map((request) => ({
    Traveler: request.customerName || "",
    Email: request.customerEmail || "",
    Phone: request.customerPhone || "",
    Agency: request.listingId?.title || "",
    TripType: request.tripType || "",
    Departure: request.departureCity || "",
    Destination: request.destinationCity || "",
    DepartureDate: formatDate(request.departureDate),
    ReturnDate: request.returnDate
      ? formatDate(request.returnDate)
      : "",
    Travelers: getTravelerCount(request),
    Cabin: request.cabinClass || "",
    Budget: request.budget ?? "",
    Quote: request.quoteAmount ?? "",
    Airline: request.airline || "",
    Status: request.status || "",
    Created: formatDate(request.createdAt),
  }));

  const headers = Object.keys(rows[0]);

  const escapeCsvValue = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      headers
        .map((header) => escapeCsvValue(row[header]))
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csv],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `travel-requests-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 100);
}

  const tripTypes =
    React.useMemo(() => {
      const values =
        analytics?.tripTypeCounts ||
        [];

      return values
        .map(
          (item) =>
            item.tripType
        )
        .filter(Boolean);
    }, [analytics]);

  const statusHasChanged =
    selectedRequest &&
    editableStatus !==
      selectedRequest.status;

  const quoteHasChanged =
    selectedRequest &&
    (
      quoteForm.quoteAmount !==
        (
          selectedRequest.quoteAmount !=
          null
            ? String(
                selectedRequest.quoteAmount
              )
            : ""
        ) ||

      quoteForm.airline !==
        (
          selectedRequest.airline ||
          ""
        ) ||

      quoteForm.flightItinerary !==
        (
          selectedRequest.flightItinerary ||
          ""
        ) ||

      quoteForm.stops !==
        (
          selectedRequest.stops ||
          ""
        ) ||

      quoteForm.baggageAllowance !==
        (
          selectedRequest.baggageAllowance ||
          ""
        ) ||

      quoteForm.quoteExpiresAt !==
        formatDateInput(
          selectedRequest.quoteExpiresAt
        ) ||

      quoteForm.ownerNotes !==
        (
          selectedRequest.ownerNotes ||
          ""
        ) ||

      Boolean(
        quoteForm.adminNote.trim()
      )
    );

  return (
    <main className="transport-admin-page">
      <div className="transport-admin-container">
        <header className="transport-admin-header">
          <div>
            <a
              href="/admin"
              className="transport-admin-back"
            >
              ← Main Admin Dashboard
            </a>

            <p className="transport-admin-label">
              HubEthio Admin
            </p>

            <h1>
              ✈️ Travel Requests
            </h1>

            <p>
              Review traveler requests,
              agencies, quotes, bookings,
              statuses, and administrative
              activity.
            </p>
          </div>

          <div className="transport-admin-header-actions">
            <button
              type="button"
              onClick={
                refreshDashboard
              }
            >
              Refresh
            </button>

            <button
  type="button"
  onClick={exportCsv}
>
  📄 Export CSV
</button>

            <button
              type="button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="transport-admin-error">
            Error: {error}
          </div>
        )}

        <section className="transport-admin-summary">
          <article>
            <span>
              Total Requests
            </span>

            <strong>
              {analytics?.summary
                ?.total || 0}
            </strong>
          </article>

          <article>
            <span>Active</span>

            <strong>
              {analytics?.summary
                ?.active || 0}
            </strong>
          </article>

          <article>
            <span>Completed</span>

            <strong>
              {analytics?.summary
                ?.completed || 0}
            </strong>
          </article>

          <article>
            <span>Cancelled</span>

            <strong>
              {analytics?.summary
                ?.cancelled || 0}
            </strong>
          </article>

          <article>
            <span>
              Quoted Value
            </span>

            <strong>
              {formatMoney(
                analytics?.financials
                  ?.totalQuotedValue ||
                  0
              )}
            </strong>
          </article>

          <article>
            <span>
              Average Quote
            </span>

            <strong>
              {formatMoney(
                analytics?.financials
                  ?.averageQuoteAmount ||
                  0
              )}
            </strong>
          </article>

          <article>
            <span>
              Acceptance Rate
            </span>

            <strong>
              {analytics?.performance
                ?.acceptanceRate || 0}
              %
            </strong>
          </article>

          <article>
            <span>Booking Rate</span>

            <strong>
              {analytics?.performance
                ?.bookingRate || 0}
              %
            </strong>
          </article>
        </section>

        <section className="travel-admin-analytics-grid">
  <article className="travel-admin-analytics-card">
    <div className="travel-admin-analytics-card-header">
      <div>
        <span>🧳</span>
        <h2>Trip Types</h2>
      </div>

      <small>
        {analytics?.summary?.total || 0} total
      </small>
    </div>

    {!analytics?.tripTypeCounts?.length ? (
      <p className="travel-admin-analytics-empty">
        No trip-type information yet.
      </p>
    ) : (
      <div className="travel-admin-ranking-list">
        {analytics.tripTypeCounts.map(
          (item, index) => (
            <div
              key={item.tripType || index}
              className="travel-admin-ranking-item"
            >
              <div>
                <strong>
                  {item.tripType ||
                    "Not specified"}
                </strong>

                <span>
                  {item.count} request
                  {item.count === 1 ? "" : "s"}
                </span>
              </div>

              <b>{item.count}</b>
            </div>
          )
        )}
      </div>
    )}
  </article>

  <article className="travel-admin-analytics-card">
    <div className="travel-admin-analytics-card-header">
      <div>
        <span>🌍</span>
        <h2>Top Destinations</h2>
      </div>
    </div>

    {!analytics?.popularDestinations?.length ? (
      <p className="travel-admin-analytics-empty">
        No destination information yet.
      </p>
    ) : (
      <div className="travel-admin-ranking-list">
        {analytics.popularDestinations
          .slice(0, 5)
          .map((item, index) => (
            <div
              key={`${item.destination}-${index}`}
              className="travel-admin-ranking-item"
            >
              <div>
                <strong>
                  {index + 1}.{" "}
                  {item.destination ||
                    "Not specified"}
                </strong>

                <span>
                  {item.count} request
                  {item.count === 1 ? "" : "s"}
                </span>
              </div>

              <b>{item.count}</b>
            </div>
          ))}
      </div>
    )}
  </article>

  <article className="travel-admin-analytics-card">
    <div className="travel-admin-analytics-card-header">
      <div>
        <span>✈️</span>
        <h2>Top Airlines</h2>
      </div>
    </div>

    {!analytics?.popularAirlines?.length ? (
      <p className="travel-admin-analytics-empty">
        No airline information yet.
      </p>
    ) : (
      <div className="travel-admin-ranking-list">
        {analytics.popularAirlines
          .slice(0, 5)
          .map((item, index) => (
            <div
              key={`${item.airline}-${index}`}
              className="travel-admin-ranking-item"
            >
              <div>
                <strong>
                  {index + 1}.{" "}
                  {item.airline ||
                    "Not specified"}
                </strong>

                <span>
                  {item.count} quoted request
                  {item.count === 1 ? "" : "s"}
                </span>
              </div>

              <b>{item.count}</b>
            </div>
          ))}
      </div>
    )}
  </article>

  <article className="travel-admin-analytics-card">
    <div className="travel-admin-analytics-card-header">
      <div>
        <span>🏢</span>
        <h2>Top Travel Agencies</h2>
      </div>
    </div>

    {!analytics?.topBusinesses?.length ? (
      <p className="travel-admin-analytics-empty">
        No agency information yet.
      </p>
    ) : (
      <div className="travel-admin-ranking-list">
        {analytics.topBusinesses
          .slice(0, 5)
          .map((item, index) => (
            <div
              key={item._id || index}
              className="travel-admin-ranking-item"
            >
              <div>
                <strong>
                  {index + 1}.{" "}
                  {item.businessName ||
                    "Unknown agency"}
                </strong>

                <span>
                  {item.requestCount || 0} requests
                  {" • "}
                  {item.completedCount || 0} completed
                </span>
              </div>

              <b>
                {formatMoney(
                  item.quotedValue || 0
                )}
              </b>
            </div>
          ))}
      </div>
    )}
  </article>
</section>

        <section className="transport-admin-filters">
          <form
            onSubmit={handleSearch}
          >
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search traveler, email, phone, airline, departure, destination..."
            />

            <button type="submit">
              Search
            </button>
          </form>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >
            {STATUS_OPTIONS.map(
              (option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option === "All"
                    ? "All statuses"
                    : option}
                </option>
              )
            )}
          </select>

          <select
            value={tripType}
            onChange={(event) =>
              setTripType(
                event.target.value
              )
            }
          >
            <option value="All">
              All trip types
            </option>

            {tripTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              )
            )}
          </select>

          <select
            value={businessId}
            onChange={(event) =>
              setBusinessId(
                event.target.value
              )
            }
          >
            <option value="">
              All travel agencies
            </option>

            {agencies.map(
              (agency) => (
                <option
                  key={agency._id}
                  value={agency._id}
                >
                  {agency.title} (
                  {agency.requestCount})
                </option>
              )
            )}
          </select>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value
              )
            }
          >
            {SORT_OPTIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(
                event.target.value
              )
            }
            aria-label="Departure date from"
          />

          <input
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(
                event.target.value
              )
            }
            aria-label="Departure date to"
          />

          <button
            type="button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </section>

        {loading && (
          <section className="transport-admin-state">
            <div className="transport-admin-spinner" />

            <h2>
              Loading travel requests...
            </h2>
          </section>
        )}

        {!loading &&
          requests.length === 0 && (
            <section className="transport-admin-state">
              <h2>
                No travel requests found
              </h2>

              <p>
                Try changing the search
                or filter options.
              </p>
            </section>
          )}

        {!loading &&
          requests.length > 0 && (
            <section className="transport-admin-table-wrapper">
              <table className="transport-admin-table">
                <thead>
                  <tr>
                    <th>Traveler</th>
                    <th>Agency</th>
                    <th>Trip</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Travelers</th>
                    <th>Quote</th>
                    <th>Airline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map(
                    (request) => (
                      <tr
                        key={request._id}
                      >
                        <td>
                          <strong>
                            {request.customerName ||
                              "Unknown"}
                          </strong>

                          <span>
                            {request.customerEmail ||
                              "No email"}
                          </span>

                          <span>
                            {request.customerPhone ||
                              "No phone"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {request.listingId
                              ?.title ||
                              "Unknown agency"}
                          </strong>

                          <span>
                            {[
                              request.listingId
                                ?.city,
                              request.listingId
                                ?.state,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(
                                ", "
                              ) ||
                              "No location"}
                          </span>
                        </td>

                        <td>
                          {request.tripType ||
                            "N/A"}

                          <span>
                            {request.cabinClass ||
                              "No cabin"}
                          </span>
                        </td>

                        <td>
                          <span>
                            <strong>
                              From:
                            </strong>{" "}
                            {request.departureCity ||
                              "N/A"}
                          </span>

                          <span>
                            <strong>
                              To:
                            </strong>{" "}
                            {request.destinationCity ||
                              "N/A"}
                          </span>
                        </td>

                        <td>
                          <span>
                            {formatDate(
                              request.departureDate
                            )}
                          </span>

                          {request.returnDate && (
                            <span>
                              Return:{" "}
                              {formatDate(
                                request.returnDate
                              )}
                            </span>
                          )}
                        </td>

                        <td>
                          {getTravelerCount(
                            request
                          )}
                        </td>

                        <td>
                          {formatMoney(
                            request.quoteAmount
                          )}
                        </td>

                        <td>
                          {request.airline ||
                            "Not specified"}
                        </td>

                        <td>
                          <span
                            className={`transport-status-badge ${getStatusClass(
                              request.status ||
                                "New"
                            )}`}
                          >
                            {request.status ||
                              "New"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() =>
                              openRequest(
                                request._id
                              )
                            }
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </section>
          )}

        {!loading &&
          pagination.totalPages > 1 && (
            <section className="transport-admin-pagination">
              <button
                type="button"
                disabled={
                  !pagination.hasPreviousPage
                }
                onClick={() =>
                  loadRequests(
                    page - 1
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {pagination.page} of{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage
                }
                onClick={() =>
                  loadRequests(
                    page + 1
                  )
                }
              >
                Next
              </button>
            </section>
          )}

        {detailsLoading && (
          <div className="transport-admin-modal-backdrop">
            <section className="transport-admin-modal">
              <p>
                Loading travel request
                details...
              </p>
            </section>
          </div>
        )}

        {selectedRequest &&
          !detailsLoading && (
            <div
              className="transport-admin-modal-backdrop"
              onClick={closeRequest}
            >
              <section
                className="transport-admin-modal"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <div className="transport-admin-modal-header">
                  <div>
  <p className="transport-admin-label">
    Travel Request
  </p>

  <h2>{selectedRequest.customerName}</h2>

  <p className="transport-admin-trip-summary">
    ✈️ {selectedRequest.tripType || "Trip"}
    {" • "}
    🛫 {selectedRequest.departureCity || "N/A"}
    {" → "}
    {selectedRequest.destinationCity || "N/A"}
  </p>

  <p className="transport-admin-trip-summary">
    📅 {formatDate(selectedRequest.departureDate)}

    {selectedRequest.returnDate && (
      <>
        {" • "}
        🔁 {formatDate(selectedRequest.returnDate)}
      </>
    )}

    {" • "}
    💺 {selectedRequest.cabinClass || "Economy"}

    {" • "}
    👥 {getTravelerCount(selectedRequest)}
  </p>

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
                    onClick={
                      closeRequest
                    }
                    aria-label="Close request details"
                  >
                    ×
                  </button>
                </div>

                <div className="travel-admin-info-grid">
  <section className="travel-admin-info-card">
    <div className="travel-admin-info-card-header">
      <span>👤</span>

      <div>
        <small>Customer</small>
        <h3>Traveler Information</h3>
      </div>
    </div>

    <div className="travel-admin-info-list">
      <div>
        <span>Name</span>
        <strong>
          {selectedRequest.customerName || "N/A"}
        </strong>
      </div>

      <div>
        <span>Email</span>
        <strong>
          {selectedRequest.customerEmail || "N/A"}
        </strong>
      </div>

      <div>
        <span>Phone</span>
        <strong>
          {selectedRequest.customerPhone || "N/A"}
        </strong>
      </div>
    </div>
  </section>

  <section className="travel-admin-info-card">
    <div className="travel-admin-info-card-header">
      <span>🏢</span>

      <div>
        <small>Provider</small>
        <h3>Travel Agency</h3>
      </div>
    </div>

    <div className="travel-admin-info-list">
      <div>
        <span>Agency</span>
        <strong>
          {selectedRequest.listingId?.title || "N/A"}
        </strong>
      </div>

      <div>
        <span>Owner</span>
        <strong>
          {selectedRequest.ownerId?.name || "N/A"}
        </strong>
      </div>

      <div>
        <span>Owner Email</span>
        <strong>
          {selectedRequest.ownerId?.email || "N/A"}
        </strong>
      </div>

      <div>
        <span>Location</span>
        <strong>
          {[
            selectedRequest.listingId?.city,
            selectedRequest.listingId?.state,
          ]
            .filter(Boolean)
            .join(", ") || "Not provided"}
        </strong>
      </div>
    </div>
  </section>

  <section className="travel-admin-info-card travel-admin-trip-card">
    <div className="travel-admin-info-card-header">
      <span>✈️</span>

      <div>
        <small>Journey</small>
        <h3>Trip Summary</h3>
      </div>
    </div>

    <div className="travel-admin-route-display">
      <div>
        <small>Departure</small>
        <strong>
          {selectedRequest.departureCity || "N/A"}
        </strong>
      </div>

      <span className="travel-admin-route-arrow">
        →
      </span>

      <div>
        <small>Destination</small>
        <strong>
          {selectedRequest.destinationCity || "N/A"}
        </strong>
      </div>
    </div>

    <div className="travel-admin-info-list">
      <div>
        <span>Trip Type</span>
        <strong>
          {selectedRequest.tripType || "N/A"}
        </strong>
      </div>

      <div>
        <span>Departure Date</span>
        <strong>
          {formatDate(selectedRequest.departureDate)}
        </strong>
      </div>

      <div>
        <span>Return Date</span>
        <strong>
          {selectedRequest.returnDate
            ? formatDate(selectedRequest.returnDate)
            : "One-way / Not provided"}
        </strong>
      </div>

      <div>
        <span>Cabin Class</span>
        <strong>
          {selectedRequest.cabinClass || "N/A"}
        </strong>
      </div>
    </div>
  </section>

  <section className="travel-admin-info-card">
    <div className="travel-admin-info-card-header">
      <span>👥</span>

      <div>
        <small>Party</small>
        <h3>Travelers & Budget</h3>
      </div>
    </div>

    <div className="travel-admin-passenger-grid">
      <div>
        <strong>{selectedRequest.adults || 0}</strong>
        <span>Adults</span>
      </div>

      <div>
        <strong>{selectedRequest.children || 0}</strong>
        <span>Children</span>
      </div>

      <div>
        <strong>{selectedRequest.infants || 0}</strong>
        <span>Infants</span>
      </div>

      <div>
        <strong>
          {getTravelerCount(selectedRequest)}
        </strong>
        <span>Total</span>
      </div>
    </div>

    <div className="travel-admin-budget-box">
      <span>Customer Budget</span>

      <strong>
        {selectedRequest.budget != null
          ? formatMoney(selectedRequest.budget)
          : "Not provided"}
      </strong>
    </div>
  </section>

  <section className="travel-admin-info-card">
    <div className="travel-admin-info-card-header">
      <span>🎯</span>

      <div>
        <small>Requirements</small>
        <h3>Travel Preferences</h3>
      </div>
    </div>

    <div className="travel-admin-preference-list">
      <div
        className={
          selectedRequest.directFlightPreferred
            ? "enabled"
            : "disabled"
        }
      >
        <span>
          {selectedRequest.directFlightPreferred
            ? "✓"
            : "×"}
        </span>

        Direct Flight Preferred
      </div>

      <div
        className={
          selectedRequest.flexibleDates
            ? "enabled"
            : "disabled"
        }
      >
        <span>
          {selectedRequest.flexibleDates ? "✓" : "×"}
        </span>

        Flexible Dates
      </div>

      <div
        className={
          selectedRequest.hotelNeeded
            ? "enabled"
            : "disabled"
        }
      >
        <span>
          {selectedRequest.hotelNeeded ? "✓" : "×"}
        </span>

        Hotel Assistance
      </div>

      <div
        className={
          selectedRequest.visaAssistance
            ? "enabled"
            : "disabled"
        }
      >
        <span>
          {selectedRequest.visaAssistance ? "✓" : "×"}
        </span>

        Visa Assistance
      </div>

      <div
        className={
          selectedRequest.travelInsurance
            ? "enabled"
            : "disabled"
        }
      >
        <span>
          {selectedRequest.travelInsurance ? "✓" : "×"}
        </span>

        Travel Insurance
      </div>
    </div>
  </section>

  <section className="travel-admin-info-card">
    <div className="travel-admin-info-card-header">
      <span>📝</span>

      <div>
        <small>Request Details</small>
        <h3>Customer Notes</h3>
      </div>
    </div>

    <div className="travel-admin-customer-notes">
      {selectedRequest.notes ||
        "The traveler did not provide additional notes."}
    </div>
  </section>
</div>

                <section className="transport-admin-notes travel-admin-quote-editor">
  <h3>💰 Travel Quote</h3>

                  <div className="travel-admin-quote-grid">
                    <label>
                      Quote Amount
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          quoteForm.quoteAmount
                        }
                        onChange={(event) =>
                          setQuoteForm(
                            (current) => ({
                              ...current,
                              quoteAmount:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Airline
                      <input
                        type="text"
                        value={
                          quoteForm.airline
                        }
                        onChange={(event) =>
                          setQuoteForm(
                            (current) => ({
                              ...current,
                              airline:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Stops
                      <input
                        type="text"
                        value={
                          quoteForm.stops
                        }
                        onChange={(event) =>
                          setQuoteForm(
                            (current) => ({
                              ...current,
                              stops:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Baggage Allowance
                      <input
                        type="text"
                        value={
                          quoteForm.baggageAllowance
                        }
                        onChange={(event) =>
                          setQuoteForm(
                            (current) => ({
                              ...current,
                              baggageAllowance:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>

                    <label>
                      Quote Expiration
                      <input
                        type="date"
                        value={
                          quoteForm.quoteExpiresAt
                        }
                        onChange={(event) =>
                          setQuoteForm(
                            (current) => ({
                              ...current,
                              quoteExpiresAt:
                                event.target
                                  .value,
                            })
                          )
                        }
                      />
                    </label>
                  </div>

                  <label className="travel-admin-quote-full-field">
  <span>Flight Itinerary</span>

  <textarea
    rows="5"
    value={quoteForm.flightItinerary}
    onChange={(event) =>
      setQuoteForm((current) => ({
        ...current,
        flightItinerary: event.target.value,
      }))
    }
    placeholder="Example: IAD → ADD, ET501, departure 10:15 AM"
  />
</label>

                  <label className="travel-admin-quote-full-field">
  <span>Agency Notes</span>

  <textarea
    rows="4"
    value={quoteForm.ownerNotes}
    onChange={(event) =>
      setQuoteForm((current) => ({
        ...current,
        ownerNotes: event.target.value,
      }))
    }
    placeholder="Notes that may be shown with the quote"
  />
</label>

                  <label className="travel-admin-quote-full-field">
  <span>Admin Audit Note</span>

  <textarea
    rows="3"
    value={quoteForm.adminNote}
    onChange={(event) =>
      setQuoteForm((current) => ({
        ...current,
        adminNote: event.target.value,
      }))
    }
    placeholder="Reason for changing quote details..."
  />
</label>

                  <button
                    type="button"
                    className="transport-save-driver-btn"
                    onClick={saveQuote}
                    disabled={
                      savingQuote ||
                      !quoteHasChanged
                    }
                  >
                    {savingQuote
                      ? "Saving..."
                      : quoteHasChanged
                        ? "Save Quote"
                        : "No Changes"}
                  </button>

                  {quoteMessage && (
                    <p className="transport-driver-message">
                      {quoteMessage}
                    </p>
                  )}
                </section>

                <section className="transport-admin-status-editor">
                  <h3>
                    Update Request Status
                  </h3>

                  <div className="transport-admin-status-controls">
                    <select
                      value={
                        editableStatus
                      }
                      onChange={(event) => {
                        setEditableStatus(
                          event.target.value
                        );

                        setStatusMessage(
                          ""
                        );
                      }}
                      disabled={
                        updatingStatus
                      }
                    >
                      {STATUS_OPTIONS
                        .filter(
                          (option) =>
                            option !== "All"
                        )
                        .map(
                          (option) => (
                            <option
                              key={option}
                              value={option}
                            >
                              {option}
                            </option>
                          )
                        )}
                    </select>

                    <input
                      type="text"
                      value={statusNote}
                      onChange={(event) =>
                        setStatusNote(
                          event.target.value
                        )
                      }
                      placeholder="Admin note for this status change"
                    />

                    <button
                      type="button"
                      onClick={
                        updateRequestStatus
                      }
                      disabled={
                        updatingStatus ||
                        !statusHasChanged
                      }
                    >
                      {updatingStatus
                        ? "Updating..."
                        : "Update Status"}
                    </button>
                  </div>

                  {statusMessage && (
                    <p className="transport-admin-status-message">
                      {statusMessage}
                    </p>
                  )}
                </section>

                <section className="transport-admin-history">
                  <h3>
                    📜 Activity History
                  </h3>

                  {!selectedRequest
                    ?.adminAuditLog
                    ?.length ? (
                    <p>
                      No administrative
                      activity recorded yet.
                    </p>
                  ) : (
                    <div className="transport-admin-history-list">
                      {[
                        ...selectedRequest.adminAuditLog,
                      ]
                        .sort(
                          (a, b) =>
                            new Date(
                              b.createdAt
                            ) -
                            new Date(
                              a.createdAt
                            )
                        )
                        .map(
                          (
                            item,
                            index
                          ) => (
                            <div
                              key={
                                item._id ||
                                index
                              }
                              className="transport-admin-history-item"
                            >
                              <div className="transport-history-header">
                                <strong>
                                  {
                                    item.action
                                  }
                                </strong>

                                <span>
                                  {formatDateTime(
                                    item.createdAt
                                  )}
                                </span>
                              </div>

                              {item.previousStatus &&
                                item.newStatus && (
                                  <p>
                                    <strong>
                                      Status:
                                    </strong>{" "}
                                    {
                                      item.previousStatus
                                    }
                                    {" → "}
                                    {
                                      item.newStatus
                                    }
                                  </p>
                                )}

                              {item.note && (
                                <p>
                                  <strong>
                                    Details:
                                  </strong>{" "}
                                  {item.note}
                                </p>
                              )}

                              <p>
                                <strong>
                                  Admin:
                                </strong>{" "}
                                {item.adminEmail ||
                                  item.adminId
                                    ?.email ||
                                  "Unknown"}
                              </p>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </section>

                <section className="transport-admin-request-meta">
                  <span>
                    Created:{" "}
                    {formatDateTime(
                      selectedRequest.createdAt
                    )}
                  </span>

                  <span>
                    Updated:{" "}
                    {formatDateTime(
                      selectedRequest.updatedAt
                    )}
                  </span>

                  <span>
                    Quote Sent:{" "}
                    {formatDateTime(
                      selectedRequest.quotedAt
                    )}
                  </span>

                  <span>
                    Booked:{" "}
                    {formatDateTime(
                      selectedRequest.bookedAt
                    )}
                  </span>

                  <span>
                    Completed:{" "}
                    {formatDateTime(
                      selectedRequest.completedAt
                    )}
                  </span>
                </section>
              </section>
            </div>
          )}
      </div>
    </main>
  );
}