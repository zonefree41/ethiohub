import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";
import "./AdminHousingRequests.css";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "approved",
  "rejected",
  "closed",
];

const HOUSING_TYPE_OPTIONS = [
  "All",
  "Room",
  "Basement",
  "Apartment",
  "House",
  "Shared Housing",
];

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "$0";
  }

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatPreferredAreas(cities, state) {
  const cleanedState = String(state || "")
    .trim()
    .toUpperCase();

  const items = Array.isArray(cities)
    ? cities
        .map((city) => String(city).trim())
        .filter(Boolean)
        .filter(
          (city) =>
            city.toUpperCase() !== cleanedState
        )
    : [];

  if (items.length === 0) {
    return cleanedState || "Not provided";
  }

  return items
    .map((city) => {
      const normalizedCity = city.toUpperCase();

      const alreadyHasState =
        normalizedCity.endsWith(
          `, ${cleanedState}`
        ) ||
        normalizedCity.endsWith(
          ` ${cleanedState}`
        );

      if (cleanedState && !alreadyHasState) {
        return `${city}, ${cleanedState}`;
      }

      return city;
    })
    .join(" • ");
}

function formatPhone(value) {
  if (!value) return "";

  const digits = String(value).replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(
      3,
      6
    )}-${digits.slice(6)}`;
  }

  return value;
}

export default function AdminHousingRequests() {
  const token = localStorage.getItem("adminToken");

  const [requests, setRequests] = React.useState([]);
  const [selectedRequest, setSelectedRequest] =
    React.useState(null);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [housingType, setHousingType] =
    React.useState("All");

  const [page, setPage] = React.useState(1);

  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [editableStatus, setEditableStatus] =
    React.useState("pending");

  const [adminNote, setAdminNote] =
    React.useState("");

    const [assistanceStatus, setAssistanceStatus] =
  React.useState("New");

const [adminAssistanceNotes, setAdminAssistanceNotes] =
  React.useState("");

const [updatingAssistance, setUpdatingAssistance] =
  React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [detailsLoading, setDetailsLoading] =
    React.useState(false);

  const [updating, setUpdating] = React.useState(false);

  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [editForm, setEditForm] = React.useState({
  requesterName: "",
  email: "",
  phone: "",
  housingTypes: [],
  preferredCities: "",
  preferredState: "",
  moveInDate: "",
  budgetMin: "",
  budgetMax: "",
  leasePreference: "Flexible",
  aboutMe: "",
  smokingStatus: "Prefer not to say",
  hasPets: false,
  petFriendlyRequired: false,
openToNearbyAreas: false,
bedroomsNeeded: "",
urgentHousingNeeded: false,
securityDepositAssistanceNeeded: false,
movingAssistanceNeeded: false,
  needsParking: false,
  utilitiesPreferred: false,
  furnishedPreferred: false,
  contactPreference: "Either",
});

const [savingProfile, setSavingProfile] =
  React.useState(false);

const [profileMessage, setProfileMessage] =
  React.useState("");

  const [housingListings, setHousingListings] =
  React.useState([]);

const [selectedListingId, setSelectedListingId] =
  React.useState("");

const [loadingHousingListings, setLoadingHousingListings] =
  React.useState(false);

  React.useEffect(() => {
    document.title = "Housing Requests Admin | HubEthio";

    if (!token) {
      window.location.href = "/admin/login";
    }

    loadHousingListings();
  }, [token]);

  async function loadRequests(nextPage = 1) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "25",
        status,
        housingType,
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const data = await apiGet(
        `/api/admin/housing-requests?${params.toString()}`,
        token
      );

      setRequests(
        Array.isArray(data?.requests)
          ? data.requests
          : []
      );

      setPagination(
        data?.pagination || {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 1,
        }
      );

      setPage(nextPage);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load housing requests."
      );
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (token) {
      loadRequests(1);
    }
  }, [token, status, housingType]);

  async function handleSearch(event) {
    event.preventDefault();
    await loadRequests(1);
  }

  async function loadHousingListings() {
  try {
    setLoadingHousingListings(true);

    const categories =
      await apiGet("/api/categories");

    const housingCategory = (
      Array.isArray(categories) ? categories : []
    ).find((category) => {
      const slug = String(
        category?.slug || ""
      ).toLowerCase();

      const name = String(
        category?.name_en || ""
      ).toLowerCase();

      return (
        slug === "housing-rentals" ||
        name === "housing & rentals" ||
        name === "housing and rentals"
      );
    });

    if (!housingCategory?._id) {
      setHousingListings([]);
      return;
    }

    const listings = await apiGet(
      `/api/listings?category=${encodeURIComponent(
        housingCategory._id
      )}`
    );

    const availableListings = (
      Array.isArray(listings) ? listings : []
    ).filter((listing) => {
      const availability = String(
        listing?.availabilityStatus || ""
      ).toLowerCase();

      return availability !== "rented";
    });

    setHousingListings(availableListings);
  } catch (err) {
    console.error(
      "Load Housing listings failed:",
      err
    );

    setHousingListings([]);
  } finally {
    setLoadingHousingListings(false);
  }
}

  async function openRequest(requestId) {
    try {
      setDetailsLoading(true);
      setError("");
      setMessage("");

      const data = await apiGet(
        `/api/admin/housing-requests/${requestId}`,
        token
      );

      const request = data?.request;

      if (!request) {
        throw new Error(
          "Housing request details were not returned."
        );
      }

      setSelectedRequest(request);
      setEditableStatus(request.status || "pending");
      setAdminNote(request.adminNote || "");

      setAssistanceStatus(
  request.assistanceStatus || "New"
);

setAdminAssistanceNotes(
  request.adminAssistanceNotes || ""
);

setSelectedListingId(
  Array.isArray(request.matchedListingIds) &&
    request.matchedListingIds.length > 0
    ? String(
        request.matchedListingIds[0]?._id ||
          request.matchedListingIds[0]
      )
    : ""
);

      setEditForm({
  requesterName: request.requesterName || "",
  email: request.email || "",
  phone: request.phone || "",
  housingTypes: Array.isArray(request.housingTypes)
    ? request.housingTypes
    : [],
  preferredCities: Array.isArray(request.preferredCities)
    ? request.preferredCities.join(", ")
    : "",
  preferredState: request.preferredState || "",
  moveInDate: request.moveInDate
    ? new Date(request.moveInDate)
        .toISOString()
        .slice(0, 10)
    : "",
  budgetMin: request.budgetMin ?? "",
  budgetMax: request.budgetMax ?? "",
  leasePreference:
    request.leasePreference || "Flexible",
  aboutMe: request.aboutMe || "",
  smokingStatus:
    request.smokingStatus || "Prefer not to say",
  hasPets: Boolean(request.hasPets),
  petFriendlyRequired: Boolean(
  request.petFriendlyRequired
),

openToNearbyAreas: Boolean(
  request.openToNearbyAreas
),

bedroomsNeeded:
  request.bedroomsNeeded ?? "",

urgentHousingNeeded: Boolean(
  request.urgentHousingNeeded
),

securityDepositAssistanceNeeded: Boolean(
  request.securityDepositAssistanceNeeded
),

movingAssistanceNeeded: Boolean(
  request.movingAssistanceNeeded
),
  needsParking: Boolean(request.needsParking),
  utilitiesPreferred: Boolean(
    request.utilitiesPreferred
  ),
  furnishedPreferred: Boolean(
    request.furnishedPreferred
  ),
  contactPreference:
    request.contactPreference || "Either",
});

setProfileMessage("");
    } catch (err) {
      setError(
        err.message ||
          "Failed to load housing request details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeModal() {
    setAssistanceStatus("New");
setAdminAssistanceNotes("");
    setSelectedRequest(null);
    setMessage("");
    setAdminNote("");
    setSelectedListingId("");
  }

  async function updateAssistanceStatus(nextStatus) {
  if (!selectedRequest?._id) return;

  if (
  nextStatus === "Matched" &&
  !selectedListingId
) {
  setError(
    "Please select a Housing listing before marking this request as matched."
  );
  return;
}

  try {
    setUpdatingAssistance(true);
    setMessage("");
    setError("");

    const data = await apiPatch(
      `/api/admin/housing-requests/${selectedRequest._id}/assistance`,
      {
  assistanceStatus: nextStatus,

  adminAssistanceNotes:
    adminAssistanceNotes.trim(),

  matchedListingId:
    nextStatus === "Matched"
      ? selectedListingId
      : "",
},
      token
    );

    const updatedRequest = data?.request;

    if (!updatedRequest) {
      throw new Error(
        "Updated housing assistance request was not returned."
      );
    }

    setSelectedRequest(updatedRequest);

    setAssistanceStatus(
      updatedRequest.assistanceStatus || "New"
    );

    setAdminAssistanceNotes(
      updatedRequest.adminAssistanceNotes || ""
    );

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request._id === updatedRequest._id
          ? updatedRequest
          : request
      )
    );

    setMessage(
      data.message ||
        "Housing assistance updated successfully."
    );
  } catch (err) {
    setError(
      err.message ||
        "Failed to update housing assistance."
    );
  } finally {
    setUpdatingAssistance(false);
  }
}

  async function updateStatus(nextStatus = editableStatus) {
    if (!selectedRequest?._id) return;

    try {
      setUpdating(true);
      setMessage("");
      setError("");

      const data = await apiPatch(
        `/api/admin/housing-requests/${selectedRequest._id}/status`,
        {
          status: nextStatus,
          note: adminNote.trim(),
        },
        token
      );

      const updatedRequest = data?.request;

      if (!updatedRequest) {
        throw new Error(
          "Updated housing request was not returned."
        );
      }

      setSelectedRequest(updatedRequest);
      setEditableStatus(updatedRequest.status);
      setAdminNote(updatedRequest.adminNote || "");

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request._id === updatedRequest._id
            ? updatedRequest
            : request
        )
      );

      setMessage(
        data.message ||
          "Housing request updated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to update housing request."
      );
    } finally {
      setUpdating(false);
    }
  }


  function updateEditField(event) {
  const { name, value, type, checked } =
    event.target;

  setEditForm((current) => ({
    ...current,
    [name]: type === "checkbox" ? checked : value,
  }));
}

function toggleHousingType(type) {
  setEditForm((current) => {
    const alreadySelected =
      current.housingTypes.includes(type);

    return {
      ...current,
      housingTypes: alreadySelected
        ? current.housingTypes.filter(
            (item) => item !== type
          )
        : [...current.housingTypes, type],
    };
  });
}

async function saveProfileChanges() {
  if (!selectedRequest?._id) return;

  try {
    setSavingProfile(true);
    setProfileMessage("");
    setError("");

    const data = await apiPatch(
      `/api/admin/housing-requests/${selectedRequest._id}`,
      {
        requesterName: editForm.requesterName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        housingTypes: editForm.housingTypes,
        preferredCities: editForm.preferredCities
          .split(",")
          .map((city) => city.trim())
          .filter(Boolean),
        preferredState:
          editForm.preferredState.trim(),
        moveInDate: editForm.moveInDate,
        budgetMin: Number(editForm.budgetMin),
        budgetMax: Number(editForm.budgetMax),
        leasePreference:
          editForm.leasePreference,
        aboutMe: editForm.aboutMe.trim(),
        smokingStatus: editForm.smokingStatus,
        hasPets: editForm.hasPets,
        petFriendlyRequired:
  editForm.petFriendlyRequired,

openToNearbyAreas:
  editForm.openToNearbyAreas,

bedroomsNeeded:
  editForm.bedroomsNeeded === ""
    ? null
    : Number(editForm.bedroomsNeeded),

urgentHousingNeeded:
  editForm.urgentHousingNeeded,

securityDepositAssistanceNeeded:
  editForm.securityDepositAssistanceNeeded,

movingAssistanceNeeded:
  editForm.movingAssistanceNeeded,
        needsParking: editForm.needsParking,
        utilitiesPreferred:
          editForm.utilitiesPreferred,
        furnishedPreferred:
          editForm.furnishedPreferred,
        contactPreference:
          editForm.contactPreference,
      },
      token
    );

    const updatedRequest = data?.request;

    if (!updatedRequest) {
      throw new Error(
        "Updated housing profile was not returned."
      );
    }

    setSelectedRequest(updatedRequest);

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request._id === updatedRequest._id
          ? updatedRequest
          : request
      )
    );

    setProfileMessage(
      data.message ||
        "Housing profile updated successfully."
    );
  } catch (err) {
    setProfileMessage(
      err.message ||
        "Failed to update housing profile."
    );
  } finally {
    setSavingProfile(false);
  }
}
  return (
    <div className="housing-admin-page">
      <header className="housing-admin-header">
        <div>
          <button
            type="button"
            className="housing-back-button"
            onClick={() => {
              window.location.href = "/admin";
            }}
          >
            ← Main Admin Dashboard
          </button>

          <h1>🏠 Housing Requests</h1>

          <p>
            Review people looking for rooms, basements,
            apartments, houses, or shared housing.
          </p>
        </div>

        <div className="housing-total-card">
          <strong>{pagination.total}</strong>
          <span>Total Requests</span>
        </div>
      </header>

      <section className="housing-admin-filters">
        <form
          className="housing-search-form"
          onSubmit={handleSearch}
        >
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, phone, city, state..."
          />

          <button type="submit">
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all"
                ? "All Statuses"
                : option.charAt(0).toUpperCase() +
                  option.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={housingType}
          onChange={(event) =>
            setHousingType(event.target.value)
          }
        >
          {HOUSING_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All"
                ? "All Housing Types"
                : option}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="housing-refresh-button"
          onClick={() => loadRequests(page)}
        >
          Refresh
        </button>
      </section>

      {error && (
        <div className="housing-admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <section className="housing-empty-state">
          <h2>Loading housing requests...</h2>
        </section>
      ) : requests.length === 0 ? (
        <section className="housing-empty-state">
          <h2>No housing requests found</h2>
          <p>
            New requests will appear here after people
            submit the housing request form.
          </p>
        </section>
      ) : (
        <section className="housing-request-grid">
          {requests.map((request) => (
            <article
              className="housing-request-card"
              key={request._id}
            >
              <div className="housing-card-top">
                <div>
                  <h2>{request.requesterName}</h2>

                  <p className="housing-request-location">
                    📍{" "}
                    {formatPreferredAreas(
  request.preferredCities,
  request.preferredState
)}
                  </p>
                </div>

                <span
                  className={`housing-status-badge status-${request.status}`}
                >
                  {request.status}
                </span>
              </div>

              <div className="housing-type-list">
                {(request.housingTypes || []).map(
                  (type) => (
                    <span key={type}>{type}</span>
                  )
                )}
              </div>

              <div className="housing-card-details">
                <p>
                  <strong>Budget:</strong>{" "}
                  {formatMoney(request.budgetMin)}–
                  {formatMoney(request.budgetMax)}
                </p>

                <p>
                  <strong>Move-in:</strong>{" "}
                  {formatDate(request.moveInDate)}
                </p>

                <p>
                  <strong>Lease:</strong>{" "}
                  {request.leasePreference ||
                    "Not provided"}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {formatPhone(request.phone)}
                </p>
              </div>

              <p className="housing-about-preview">
                {request.aboutMe}
              </p>

              <button
                type="button"
                className="housing-view-button"
                onClick={() =>
                  openRequest(request._id)
                }
                disabled={detailsLoading}
              >
                View Details
              </button>
            </article>
          ))}
        </section>
      )}

      {pagination.totalPages > 1 && (
        <div className="housing-pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() =>
              loadRequests(Math.max(1, page - 1))
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
              page >= pagination.totalPages
            }
            onClick={() =>
              loadRequests(
                Math.min(
                  pagination.totalPages,
                  page + 1
                )
              )
            }
          >
            Next
          </button>
        </div>
      )}

      {selectedRequest && (
        <div
          className="housing-modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="housing-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="housing-modal-close"
              onClick={closeModal}
            >
              ×
            </button>

            <div className="housing-modal-heading">
              <div>
                <p className="housing-modal-label">
                  Housing Request
                </p>

                <h2>
                  {selectedRequest.requesterName}
                </h2>
              </div>

              <span
                className={`housing-status-badge status-${selectedRequest.status}`}
              >
                {selectedRequest.status}
              </span>
            </div>

            <section className="housing-modal-section">
              <h3>Contact Information</h3>

              <div className="housing-detail-grid">
                <p>
                  <strong>Phone</strong>
                  <span>
                    {formatPhone(
                      selectedRequest.phone
                    ) || "Not provided"}
                  </span>
                </p>

                <p>
                  <strong>Email</strong>
                  <span>
                    {selectedRequest.email ||
                      "Not provided"}
                  </span>
                </p>

                <p>
                  <strong>Contact preference</strong>
                  <span>
                    {selectedRequest.contactPreference ||
                      "Not provided"}
                  </span>
                </p>
              </div>

              <div className="housing-contact-actions">
                {selectedRequest.phone && (
                  <a
                    href={`tel:${selectedRequest.phone}`}
                  >
                    📞 Call Requester
                  </a>
                )}

                {selectedRequest.email && (
                  <a
                    href={`mailto:${selectedRequest.email}`}
                  >
                    ✉️ Email Requester
                  </a>
                )}
              </div>
            </section>

            <section className="housing-modal-section">
              <h3>Housing Needs</h3>

              <div className="housing-type-list">
                {(selectedRequest.housingTypes || []).map(
                  (type) => (
                    <span key={type}>{type}</span>
                  )
                )}
              </div>

              <div className="housing-detail-grid">
                <p>
                  <strong>Preferred areas</strong>
<span>
  {formatPreferredAreas(
    selectedRequest.preferredCities,
    selectedRequest.preferredState
  )}
</span>
                </p>

                <p>
                  <strong>Move-in date</strong>
                  <span>
                    {formatDate(
                      selectedRequest.moveInDate
                    )}
                  </span>
                </p>

                <p>
                  <strong>Monthly budget</strong>
                  <span>
                    {formatMoney(
                      selectedRequest.budgetMin
                    )}
                    –
                    {formatMoney(
                      selectedRequest.budgetMax
                    )}
                  </span>
                </p>

                <p>
                  <strong>Lease preference</strong>
                  <span>
                    {selectedRequest.leasePreference ||
                      "Not provided"}
                  </span>
                </p>

                <p>
                  <strong>Smoking</strong>
                  <span>
                    {selectedRequest.smokingStatus ||
                      "Not provided"}
                  </span>
                </p>
              </div>
            </section>

            <section className="housing-modal-section">
              <h3>Preferences</h3>

              <div className="housing-preference-grid">
                <span>
                  {selectedRequest.hasPets
                    ? "🐾 Has pets"
                    : "🚫 No pets"}
                </span>

                <span>
                  {selectedRequest.needsParking
                    ? "🚗 Needs parking"
                    : "Parking not required"}
                </span>

                <span>
                  {selectedRequest.utilitiesPreferred
                    ? "💡 Utilities preferred"
                    : "Utilities not required"}
                </span>

                <span>
                  {selectedRequest.furnishedPreferred
                    ? "🛏️ Furnished preferred"
                    : "Unfurnished is acceptable"}
                </span>
              </div>
            </section>

            <section className="housing-modal-section">
              <h3>About the Requester</h3>
              <p>{selectedRequest.aboutMe}</p>
            </section>

            <section className="housing-assistance-panel">
  <div className="housing-assistance-header">
    <div>
      <h3>🏠 Housing Assistance & Matching</h3>
      <p>
        Track HubEthio assistance separately from
        the public housing-request moderation status.
      </p>
    </div>

    <span
      className={`housing-assistance-status status-${String(
        selectedRequest.assistanceStatus || "New"
      )
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
    >
      {selectedRequest.assistanceStatus || "New"}
    </span>
  </div>

  <div className="housing-assistance-grid">
    <div>
      <strong>Bedrooms Needed</strong>
      <span>
        {selectedRequest.bedroomsNeeded != null
          ? selectedRequest.bedroomsNeeded
          : "Not provided"}
      </span>
    </div>

    <div>
      <strong>Pet-Friendly Required</strong>
      <span>
        {selectedRequest.petFriendlyRequired
          ? "Yes"
          : "No"}
      </span>
    </div>

    <div>
      <strong>Open to Nearby Areas</strong>
      <span>
        {selectedRequest.openToNearbyAreas
          ? "Yes"
          : "No"}
      </span>
    </div>

    <div>
      <strong>Urgent Housing</strong>
      <span>
        {selectedRequest.urgentHousingNeeded
          ? "Yes"
          : "No"}
      </span>
    </div>

    <div>
      <strong>Deposit Assistance</strong>
      <span>
        {selectedRequest
          .securityDepositAssistanceNeeded
          ? "Needed"
          : "Not requested"}
      </span>
    </div>

    <div>
      <strong>Moving Assistance</strong>
      <span>
        {selectedRequest.movingAssistanceNeeded
          ? "Needed"
          : "Not requested"}
      </span>
    </div>
  </div>

  <div className="housing-match-selector">
  <label>
    Potential Housing Match

    <select
      value={selectedListingId}
      onChange={(e) =>
        setSelectedListingId(e.target.value)
      }
      disabled={loadingHousingListings}
    >
      <option value="">
        {loadingHousingListings
          ? "Loading available housing..."
          : "Select a HubEthio housing listing"}
      </option>

      {housingListings.map((listing) => (
        <option
          key={listing._id}
          value={listing._id}
        >
          {listing.title}
          {" — "}
          {listing.monthlyRent
            ? `$${Number(
                listing.monthlyRent
              ).toLocaleString()}/mo`
            : "Rent not listed"}
          {" — "}
          {listing.bedrooms != null
            ? `${listing.bedrooms} BR`
            : "Bedrooms not listed"}
          {" — "}
          {[listing.city, listing.state]
            .filter(Boolean)
            .join(", ")}
        </option>
      ))}
    </select>
  </label>

  {selectedListingId && (
    <div className="housing-match-preview">
      {(() => {
        const matchedListing =
          housingListings.find(
            (listing) =>
              String(listing._id) ===
              String(selectedListingId)
          );

        if (!matchedListing) {
          return null;
        }

        return (
          <>
            <strong>
              {matchedListing.title}
            </strong>

            <span>
              {[
                matchedListing.city,
                matchedListing.state,
              ]
                .filter(Boolean)
                .join(", ") ||
                "Location not provided"}
            </span>

            <span>
              {matchedListing.monthlyRent
                ? `$${Number(
                    matchedListing.monthlyRent
                  ).toLocaleString()}/month`
                : "Rent not listed"}
              {" • "}
              {matchedListing.bedrooms != null
                ? `${matchedListing.bedrooms} bedroom`
                : "Bedrooms not listed"}
            </span>

            <span>
              {matchedListing.petsAllowed
                ? "Pet-friendly"
                : "Pet policy not confirmed"}
              {" • "}
              {matchedListing.availabilityStatus ||
                "Availability not provided"}
            </span>
          </>
        );
      })()}
    </div>
  )}
</div>

  <label className="housing-assistance-notes">
    Admin Assistance Notes

    <textarea
      rows="4"
      value={adminAssistanceNotes}
      onChange={(e) =>
        setAdminAssistanceNotes(e.target.value)
      }
      placeholder="Add property leads, assistance resources, contact attempts, or next steps."
    />
  </label>

  <div className="housing-assistance-actions">
    {(selectedRequest.assistanceStatus || "New") ===
      "New" && (
      <button
        type="button"
        disabled={updatingAssistance}
        onClick={() =>
          updateAssistanceStatus("Reviewing")
        }
      >
        Start Review
      </button>
    )}

    {selectedRequest.assistanceStatus ===
      "Reviewing" && (
      <button
        type="button"
        disabled={updatingAssistance}
        onClick={() =>
          updateAssistanceStatus("Matched")
        }
      >
        Mark Matched
      </button>
    )}

    {selectedRequest.assistanceStatus ===
      "Matched" && (
      <button
        type="button"
        disabled={updatingAssistance}
        onClick={() =>
          updateAssistanceStatus("Referred")
        }
      >
        Mark Referred
      </button>
    )}

    {selectedRequest.assistanceStatus ===
      "Referred" && (
      <button
        type="button"
        disabled={updatingAssistance}
        onClick={() =>
          updateAssistanceStatus("Closed")
        }
      >
        Close Assistance
      </button>
    )}

    {selectedRequest.assistanceStatus ===
      "Closed" && (
      <span className="housing-assistance-final">
        Assistance case closed
      </span>
    )}
  </div>

  <div className="housing-assistance-history">
  <h4>Housing Assistance History</h4>

  {Array.isArray(selectedRequest.assistanceTimeline) &&
  selectedRequest.assistanceTimeline.length > 0 ? (
    <div className="housing-assistance-history-list">
      {[...selectedRequest.assistanceTimeline]
        .reverse()
        .map((entry, index) => (
          <div
            key={`${entry.createdAt || index}-${index}`}
            className="housing-assistance-history-item"
          >
            <div className="housing-assistance-history-top">
              <strong>
                {entry.status || "Update"}
              </strong>

              <span>
                {entry.createdAt
                  ? new Date(
                      entry.createdAt
                    ).toLocaleString()
                  : "Date unavailable"}
              </span>
            </div>

            {entry.listingId?.title && (
              <p>
                <strong>Property:</strong>{" "}
                {entry.listingId.title}
                {entry.listingId.city ||
                entry.listingId.state
                  ? ` — ${[
                      entry.listingId.city,
                      entry.listingId.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}`
                  : ""}
              </p>
            )}

            {entry.note && (
              <p>
                <strong>Note:</strong>{" "}
                {entry.note}
              </p>
            )}
          </div>
        ))}
    </div>
  ) : (
    <p className="housing-assistance-history-empty">
      No assistance history recorded yet.
    </p>
  )}
</div>
</section>

            <section className="housing-modal-section">
  <h3>Edit Housing Profile</h3>

  <div className="housing-edit-grid">
    <label>
      Name
      <input
        name="requesterName"
        value={editForm.requesterName}
        onChange={updateEditField}
      />
    </label>

    <label>
      Phone
      <input
        name="phone"
        value={editForm.phone}
        onChange={updateEditField}
      />
    </label>

    <label>
      Email
      <input
        name="email"
        type="email"
        value={editForm.email}
        onChange={updateEditField}
      />
    </label>

    <label>
      Preferred state
      <input
        name="preferredState"
        maxLength="2"
        value={editForm.preferredState}
        onChange={updateEditField}
      />
    </label>

    <label className="housing-edit-wide">
      Preferred cities
      <input
        name="preferredCities"
        value={editForm.preferredCities}
        onChange={updateEditField}
        placeholder="Herndon, Silver Spring"
      />
    </label>

    <label>
      Move-in date
      <input
        name="moveInDate"
        type="date"
        value={editForm.moveInDate}
        onChange={updateEditField}
      />
    </label>

    <label>
      Minimum budget
      <input
        name="budgetMin"
        type="number"
        min="0"
        value={editForm.budgetMin}
        onChange={updateEditField}
      />
    </label>

    <label>
      Maximum budget
      <input
        name="budgetMax"
        type="number"
        min="0"
        value={editForm.budgetMax}
        onChange={updateEditField}
      />
    </label>

    <label>
      Lease preference
      <select
        name="leasePreference"
        value={editForm.leasePreference}
        onChange={updateEditField}
      >
        <option value="Month-to-Month">
          Month-to-Month
        </option>
        <option value="Short-Term">
          Short-Term
        </option>
        <option value="6 Months">
          6 Months
        </option>
        <option value="12 Months">
          12 Months
        </option>
        <option value="Flexible">
          Flexible
        </option>
      </select>
    </label>

    <label>
      Smoking status
      <select
        name="smokingStatus"
        value={editForm.smokingStatus}
        onChange={updateEditField}
      >
        <option value="Non-Smoker">
          Non-Smoker
        </option>
        <option value="Smoker">
          Smoker
        </option>
        <option value="Prefer not to say">
          Prefer not to say
        </option>
      </select>
    </label>

    <label>
      Contact preference
      <select
        name="contactPreference"
        value={editForm.contactPreference}
        onChange={updateEditField}
      >
        <option value="Phone">Phone</option>
        <option value="Email">Email</option>
        <option value="Either">Either</option>
      </select>
    </label>
  </div>

  <div className="housing-edit-types">
    <strong>Housing types</strong>

    {HOUSING_TYPE_OPTIONS.filter(
      (type) => type !== "All"
    ).map((type) => (
      <label key={type}>
        <input
          type="checkbox"
          checked={editForm.housingTypes.includes(
            type
          )}
          onChange={() =>
            toggleHousingType(type)
          }
        />
        {type}
      </label>
    ))}
  </div>

  <div className="housing-edit-checks">
    <label>
      <input
        type="checkbox"
        name="hasPets"
        checked={editForm.hasPets}
        onChange={updateEditField}
      />
      Has pets
    </label>

    <label>
      <input
        type="checkbox"
        name="needsParking"
        checked={editForm.needsParking}
        onChange={updateEditField}
      />
      Needs parking
    </label>

    <label>
      <input
        type="checkbox"
        name="utilitiesPreferred"
        checked={editForm.utilitiesPreferred}
        onChange={updateEditField}
      />
      Utilities preferred
    </label>

    <label>
      <input
        type="checkbox"
        name="furnishedPreferred"
        checked={editForm.furnishedPreferred}
        onChange={updateEditField}
      />
      Furnished preferred
    </label>
  </div>

  <label className="housing-admin-label">
    About requester
    <textarea
      name="aboutMe"
      rows="5"
      value={editForm.aboutMe}
      onChange={updateEditField}
    />
  </label>

  {profileMessage && (
    <div className="housing-admin-success">
      {profileMessage}
    </div>
  )}

  <button
    type="button"
    className="housing-save-profile-button"
    disabled={savingProfile}
    onClick={saveProfileChanges}
  >
    {savingProfile
      ? "Saving Profile..."
      : "Save Profile Changes"}
  </button>
</section>

            <section className="housing-modal-section">
              <h3>Admin Review</h3>

              <label className="housing-admin-label">
                Status
                <select
                  value={editableStatus}
                  onChange={(event) =>
                    setEditableStatus(
                      event.target.value
                    )
                  }
                >
                  <option value="pending">
                    Pending
                  </option>
                  <option value="approved">
                    Approved
                  </option>
                  <option value="rejected">
                    Rejected
                  </option>
                  <option value="closed">
                    Closed
                  </option>
                </select>
              </label>

              <label className="housing-admin-label">
                Admin note
                <textarea
                  value={adminNote}
                  onChange={(event) =>
                    setAdminNote(event.target.value)
                  }
                  placeholder="Optional review note"
                  rows="4"
                />
              </label>

              {message && (
                <div className="housing-admin-success">
                  {message}
                </div>
              )}

              <div className="housing-admin-actions">
                <button
                  type="button"
                  className="housing-approve-button"
                  disabled={updating}
                  onClick={() =>
                    updateStatus("approved")
                  }
                >
                  Approve
                </button>

                <button
                  type="button"
                  className="housing-reject-button"
                  disabled={updating}
                  onClick={() =>
                    updateStatus("rejected")
                  }
                >
                  Reject
                </button>

                <button
                  type="button"
                  className="housing-close-request-button"
                  disabled={updating}
                  onClick={() =>
                    updateStatus("closed")
                  }
                >
                  Close Request
                </button>

                <button
                  type="button"
                  className="housing-save-button"
                  disabled={updating}
                  onClick={() =>
                    updateStatus(editableStatus)
                  }
                >
                  {updating
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}