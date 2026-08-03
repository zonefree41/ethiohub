import React from "react";
import { apiGet } from "../api/http.js";
import "./HousingRequests.css";

const HOUSING_TYPES = [
  "All",
  "Room",
  "Basement",
  "Apartment",
  "House",
  "Shared Housing",
];

function formatDate(value) {
  if (!value) return "Flexible";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Flexible";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
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

function getPublicName(name) {
  if (!name) return "Housing Seeker";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} ${parts[1].charAt(0)}.`;
}

export default function HousingRequests() {
  const [requests, setRequests] = React.useState([]);

  const [housingType, setHousingType] =
    React.useState("All");

  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [minBudget, setMinBudget] = React.useState("");
  const [maxBudget, setMaxBudget] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title =
      "Looking for Housing | HubEthio";
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (housingType !== "All") {
        params.set("housingType", housingType);
      }

      if (city.trim()) {
        params.set("city", city.trim());
      }

      if (state.trim()) {
        params.set("state", state.trim());
      }

      if (minBudget !== "") {
        params.set("minBudget", minBudget);
      }

      if (maxBudget !== "") {
        params.set("maxBudget", maxBudget);
      }

      const query = params.toString();

      const data = await apiGet(
        `/api/housing-requests${query ? `?${query}` : ""}`
      );

      setRequests(Array.isArray(data) ? data : []);
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
    loadRequests();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    await loadRequests();
  }

  function clearFilters() {
    setHousingType("All");
    setCity("");
    setState("");
    setMinBudget("");
    setMaxBudget("");

    window.setTimeout(() => {
      loadRequests();
    }, 0);
  }

  return (
    <main className="housing-public-page">
      <section className="housing-public-hero">
        <div className="housing-public-hero-content">
          <p className="housing-public-kicker">
            🏠 HubEthio Housing Requests
          </p>

          <h1>
            People looking for rooms, basements, and
            shared housing
          </h1>

          <p>
            Have an available room, basement, apartment,
            or shared space? Connect directly with
            approved housing seekers.
          </p>

          <div className="housing-public-hero-actions">
            <a href="/submit-housing-request">
              Post a Housing Request
            </a>

            <a href="/category/housing-rentals">
              Browse Available Rentals
            </a>
          </div>
        </div>
      </section>

      <section className="housing-public-content">
        <form
          className="housing-public-filters"
          onSubmit={handleSubmit}
        >
          <select
            value={housingType}
            onChange={(event) =>
              setHousingType(event.target.value)
            }
          >
            {HOUSING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "All"
                  ? "All Housing Types"
                  : type}
              </option>
            ))}
          </select>

          <input
            value={city}
            onChange={(event) =>
              setCity(event.target.value)
            }
            placeholder="Preferred city"
          />

          <input
            value={state}
            onChange={(event) =>
              setState(event.target.value)
            }
            placeholder="State"
            maxLength="2"
          />

          <input
            type="number"
            min="0"
            value={minBudget}
            onChange={(event) =>
              setMinBudget(event.target.value)
            }
            placeholder="Minimum budget"
          />

          <input
            type="number"
            min="0"
            value={maxBudget}
            onChange={(event) =>
              setMaxBudget(event.target.value)
            }
            placeholder="Maximum budget"
          />

          <button type="submit">
            Search Requests
          </button>

          <button
            type="button"
            className="housing-clear-button"
            onClick={clearFilters}
          >
            Clear
          </button>
        </form>

        {error && (
          <div className="housing-public-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="housing-public-empty">
            <h2>Loading housing requests...</h2>
          </div>
        ) : requests.length === 0 ? (
          <div className="housing-public-empty">
            <h2>No approved housing requests found</h2>

            <p>
              Try changing the city, state, housing type,
              or budget range.
            </p>
          </div>
        ) : (
          <div className="housing-public-grid">
            {requests.map((request) => (
              <article
                className="housing-public-card"
                key={request._id}
              >
                <div className="housing-public-card-top">
                  <div>
                    <p className="housing-public-label">
                      Looking for housing
                    </p>

                    <h2>
                      {getPublicName(
                        request.requesterName
                      )}
                    </h2>
                  </div>

                  <span className="housing-public-approved">
                    Approved
                  </span>
                </div>

                <div className="housing-public-types">
                  {(request.housingTypes || []).map(
                    (type) => (
                      <span key={type}>{type}</span>
                    )
                  )}
                </div>

                <div className="housing-public-info-grid">
                  <p>
                    <strong>Preferred areas</strong>
                    <span>
  {formatPreferredAreas(
    request.preferredCities,
    request.preferredState
  )}
</span>
                  </p>

                  <p>
                    <strong>Monthly budget</strong>
                    <span>
                      {formatMoney(request.budgetMin)}–
                      {formatMoney(request.budgetMax)}
                    </span>
                  </p>

                  <p>
                    <strong>Move-in</strong>
                    <span>
                      {formatDate(request.moveInDate)}
                    </span>
                  </p>

                  <p>
                    <strong>Lease preference</strong>
                    <span>
                      {request.leasePreference ||
                        "Flexible"}
                    </span>
                  </p>
                </div>

                <p className="housing-public-about">
                  {request.aboutMe}
                </p>

                <div className="housing-public-preferences">
                  <span>
                    {request.smokingStatus ===
                    "Non-Smoker"
                      ? "🚭 Non-smoker"
                      : request.smokingStatus}
                  </span>

                  <span>
                    {request.hasPets
                      ? "🐾 Has pets"
                      : "🚫 No pets"}
                  </span>

                  {request.utilitiesPreferred && (
                    <span>
                      💡 Utilities preferred
                    </span>
                  )}

                  {request.furnishedPreferred && (
                    <span>
                      🛏️ Furnished preferred
                    </span>
                  )}

                  {request.needsParking && (
                    <span>🚗 Parking needed</span>
                  )}
                </div>

                <div className="housing-public-actions">
                  {request.phone && (
                    <a
                      href={`tel:${request.phone}`}
                      className="housing-call-button"
                    >
                      📞 Call{" "}
                      {formatPhone(request.phone)}
                    </a>
                  )}

                  {request.email && (
                    <a
                      href={`mailto:${request.email}`}
                      className="housing-email-button"
                    >
                      ✉️ Email
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}