import React from "react";
import { apiGet, apiPost } from "../api/http.js";
import "./Category.css";
import { Helmet } from "react-helmet-async";

function getGoogleMapsUrl(listing) {
  const address = [
    listing.address,
    listing.city,
    listing.state,
    listing.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const query = address || listing.title || "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name) || "";
}

function getSubcategoryValue(label) {
  const map = {
    "Apartments for Rent": "Apartments",
    "Rooms for Rent": "Rooms",
    "Basement Rentals": "Basement Rentals",
    "Houses for Rent": "Houses",
    "Roommates Wanted": "Roommates",
  };

  return map[label] || label;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";

  const number = Number(value);

  if (Number.isNaN(number)) return "";

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function isHousingListing(listing) {
  return [
    "Apartments",
    "Houses",
    "Basement Rentals",
    "Rooms",
    "Roommates",
  ].includes(listing.subcategory);
}

function isTransportationListing(listing) {
  return listing.categoryId?.name_en === "Transportation";
}

export default function Category() {
  const slug = window.location.pathname.split("/").pop();
  const search = getParam("search");
  const city = getParam("city");
  const state = getParam("state");
  const subcategory = getParam("subcategory");

  const minRent = getParam("minRent");
const maxRent = getParam("maxRent");
const bedrooms = getParam("bedrooms");
const bathrooms = getParam("bathrooms");
const availableOnly = getParam("availableOnly");
const petsAllowed = getParam("petsAllowed");
const parking = getParam("parking");
const utilitiesIncluded = getParam("utilitiesIncluded");
const furnished = getParam("furnished");
const sortBy = getParam("sortBy");

  const [categories, setCategories] = React.useState([]);
  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const cats = await apiGet("/api/categories");
        if (!alive) return;

        setCategories(cats || []);

        let categoryId = "";

        if (slug !== "all") {
          const found = (cats || []).find((c) => c.slug === slug);
          categoryId = found?._id || "";
        }

        const qs = new URLSearchParams();

        if (search) qs.set("search", search);
        if (city) qs.set("city", city);
        if (state) qs.set("state", state);
if (subcategory) qs.set("subcategory", subcategory);
if (categoryId) qs.set("category", categoryId);

if (minRent) qs.set("minRent", minRent);
if (maxRent) qs.set("maxRent", maxRent);
if (bedrooms) qs.set("bedrooms", bedrooms);
if (bathrooms) qs.set("bathrooms", bathrooms);
if (availableOnly) qs.set("availableOnly", availableOnly);
if (petsAllowed) qs.set("petsAllowed", petsAllowed);
if (parking) qs.set("parking", parking);
if (utilitiesIncluded) qs.set("utilitiesIncluded", utilitiesIncluded);
if (furnished) qs.set("furnished", furnished);
if (sortBy) qs.set("sortBy", sortBy);

        const data = await apiGet(`/api/listings?${qs.toString()}`);
        if (!alive) return;

        setListings(Array.isArray(data) ? data : []);
      } catch (err) {
        if (alive) {
          setError(err.message || "Failed to load listings");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [
  slug,
  search,
  city,
  state,
  subcategory,
  minRent,
  maxRent,
  bedrooms,
  bathrooms,
  availableOnly,
  petsAllowed,
  parking,
  utilitiesIncluded,
  furnished,
  sortBy,
]);

  const selectedCategory =
  slug === "all" ? null : categories.find((c) => c.slug === slug);

const title =
  slug === "all"
    ? "Search Results"
    : selectedCategory?.name_en || "Category";

const availableSubcategories = Array.isArray(selectedCategory?.subcategories)
  ? selectedCategory.subcategories
  : [];

  const isHousingCategory =
  selectedCategory?.name_en === "Housing & Rentals" ||
  [
    "Apartments",
    "Houses",
    "Basement Rentals",
    "Rooms",
    "Roommates",
  ].includes(subcategory);

  function applyHousingFilters(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const qs = new URLSearchParams();

    if (search) qs.set("search", search);
    if (city) qs.set("city", city);
    if (state) qs.set("state", state);
    if (subcategory) qs.set("subcategory", subcategory);

    for (const [key, value] of formData.entries()) {
      if (value === "on") {
        qs.set(key, "true");
      } else if (value) {
        qs.set(key, value);
      }
    }

    window.location.href = `/category/${slug}?${qs.toString()}`;
  }

      const canonicalUrl = `https://www.hubethio.com/category/${slug}`;

const seoTitle =
  slug === "all"
    ? "Ethiopian Businesses & Services Near You | HubEthio"
    : `${title} | Ethiopian Services Near You | HubEthio`;

const seoDescription =
  slug === "all"
    ? "Find trusted Ethiopian businesses, auto repair, restaurants, salons, tax services, and community services near you on HubEthio."
    : `Find trusted Ethiopian ${title.toLowerCase()} near you. Browse businesses, contact owners, get directions, and discover Ethiopian community services on HubEthio.`;

  return (
  <>
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="HubEthio" />
    </Helmet>

    <main className="category-page">
      <div className="category-container">
        <a href="/" className="category-back">
          ← Back Home
        </a>

        <div className="category-header">
          <h1>{title}</h1>

          {(search || city || state) && (
            <p className="category-filters">
              {search && <span>Search: “{search}”</span>}
              {city && <span>City: {city}</span>}
              {state && <span>State: {state}</span>}
            </p>
          )}

          {availableSubcategories.length > 0 && (
  <div className="category-subcategory-filters">
    <a
      href={`/category/${slug}`}
      className={!subcategory ? "active" : ""}
    >
      All
    </a>

    {availableSubcategories.map((sub) => {
  const value = getSubcategoryValue(sub);

  return (
    <a
      key={sub}
      href={`/category/${slug}?subcategory=${encodeURIComponent(value)}`}
      className={subcategory === value ? "active" : ""}
    >
      {sub}
    </a>
  );
})}
  </div>
)}

{isHousingCategory && (
  <form className="housing-filter-bar" onSubmit={applyHousingFilters}>
    <div className="housing-filter-main-row">
      <input
        type="number"
        name="minRent"
        placeholder="Min Rent"
        defaultValue={minRent}
      />

      <input
        type="number"
        name="maxRent"
        placeholder="Max Rent"
        defaultValue={maxRent}
      />

      <select name="bedrooms" defaultValue={bedrooms}>
        <option value="">Bedrooms</option>
        <option value="1">1+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
        <option value="4">4+</option>
      </select>

      <select name="bathrooms" defaultValue={bathrooms}>
        <option value="">Bathrooms</option>
        <option value="1">1+</option>
        <option value="1.5">1.5+</option>
        <option value="2">2+</option>
        <option value="3">3+</option>
      </select>

      <select name="sortBy" defaultValue={sortBy}>
  <option value="">Sort By</option>
  <option value="featured">⭐ Featured</option>
  <option value="newest">🆕 Newest</option>
  <option value="priceLow">💲 Price: Low → High</option>
  <option value="priceHigh">💰 Price: High → Low</option>
</select>

      <button type="submit">🔍 Search</button>
    </div>

    <div className="housing-checkboxes">
      <label>
        <input
          type="checkbox"
          name="availableOnly"
          defaultChecked={availableOnly === "true"}
        />
        Available Only
      </label>

      <label>
        <input
          type="checkbox"
          name="parking"
          defaultChecked={parking === "true"}
        />
        Parking
      </label>

      <label>
        <input
          type="checkbox"
          name="petsAllowed"
          defaultChecked={petsAllowed === "true"}
        />
        Pets Allowed
      </label>

      <label>
        <input
          type="checkbox"
          name="utilitiesIncluded"
          defaultChecked={utilitiesIncluded === "true"}
        />
        Utilities Included
      </label>

      <label>
        <input
          type="checkbox"
          name="furnished"
          defaultChecked={furnished === "true"}
        />
        Furnished
      </label>
    </div>
  </form>
)}

  </div>

        {loading && (
          <div className="category-state-card">
            <div className="category-spinner"></div>
            <h2>Loading businesses...</h2>
            <p>Please wait while we find matching listings.</p>
          </div>
        )}

        {!loading && error && (
          <div className="category-state-card">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="category-state-card">
            <h2>No businesses found</h2>
            <p>Try searching for a different service, city, or state.</p>
            <a href="/" className="category-primary-link">
              Back to Home
            </a>
          </div>
        )}

        {!loading && !error && listings.length > 0 && (
          <div className="category-grid">
  {listings.map((listing) => {
    const phone = listing.phone || "";
    const whatsapp = String(
      listing.whatsapp || listing.phone || ""
    ).replace(/\D/g, "");

    return (
                <article key={listing._id} className="category-card">
  <div className="category-card-top">
    <div className="category-card-identity">
      {isHousingListing(listing) && listing.propertyImages?.length ? (
  <img
    src={listing.propertyImages[0]}
    alt={listing.title}
    className="category-property-thumb"
  />
) : listing.logoUrl ? (
  <img
    src={listing.logoUrl}
    alt={`${listing.title} logo`}
    className="category-card-logo"
  />
) : (
  <div className="category-card-logo-placeholder">
    {listing.title?.charAt(0)?.toUpperCase() || "B"}
  </div>
)}

      <div>
        <h2>{listing.title}</h2>

        <p className="category-location">
          {[listing.city, listing.state].filter(Boolean).join(", ") ||
            "Location not available"}
        </p>

        {isHousingListing(listing) && listing.subcategory && (
  <p className="category-subcategory">
    🏠 {listing.subcategory}
  </p>
)}

        {listing.totalReviews > 0 && (
  <p className="category-rating">
    ⭐ {listing.averageRating || 0} ({listing.totalReviews} review
    {listing.totalReviews !== 1 ? "s" : ""})
  </p>
)}
      </div>
    </div>

    {isHousingListing(listing) && (
  <div className="category-housing-details">
    {listing.monthlyRent && (
      <p className="category-housing-rent">
        💲 {formatMoney(listing.monthlyRent)}/month
      </p>
    )}

    {isTransportationListing(listing) && (
  <div className="category-transport-details">
    {listing.transportVehicleTypes?.length > 0 && (
      <p>🚚 {listing.transportVehicleTypes.join(" • ")}</p>
    )}

    {listing.transportServiceArea && (
      <p>📍 Service Area: {listing.transportServiceArea}</p>
    )}

    {listing.transportLocalLongDistance && (
      <p>🛣️ {listing.transportLocalLongDistance}</p>
    )}

    {listing.transportMaxLoad && (
      <p>📦 Capacity: {listing.transportMaxLoad}</p>
    )}

    <div className="category-transport-badges">
      {listing.transportAvailable24_7 && <span>🕒 24/7</span>}
      {listing.transportAirportService && <span>✈️ Airport</span>}
      {listing.transportSameDayService && <span>⚡ Same-Day</span>}
    </div>
  </div>
)}

    {(listing.bedrooms || listing.bathrooms) && (
  <p className="category-housing-bedbath">
    {listing.bedrooms ? `🛏️ ${listing.bedrooms} Bed` : ""}
    {listing.bedrooms && listing.bathrooms ? " • " : ""}
    {listing.bathrooms ? `🛁 ${listing.bathrooms} Bath` : ""}
  </p>
)}

    {listing.squareFeet && (
      <p>📐 {Number(listing.squareFeet).toLocaleString()} sq ft</p>
    )}

    <p>
      {listing.availabilityStatus === "rented"
        ? "🔴 Rented"
        : "🟢 Available"}
    </p>
  </div>
)}

    <div className="category-badges">
{isHousingListing(listing) &&
  (listing.availabilityStatus === "rented" ? (
    <span className="category-rented-badge">🔴 Rented</span>
  ) : (
    <span className="category-available-badge">🟢 Available</span>
  ))}

      {listing.isFeatured && <span>⭐ Featured</span>}
      {listing.isVerified && <span>✅ Verified</span>}
    </div>
  </div>

                  <p className="category-description">
  {listing.description_en
    ? listing.description_en.slice(0, 160) +
      (listing.description_en.length > 160 ? "..." : "")
    : "No description available."}
</p>

                  <div className="category-actions">
  {phone && (
    <a
      href={`tel:${phone}`}
      className="category-action-btn"
      onClick={() =>
        apiPost(`/api/track/${listing._id}`, { type: "call" })
      }
    >
      Call
    </a>
  )}

  <a
  href={getGoogleMapsUrl(listing)}
  target="_blank"
  rel="noreferrer"
  className="category-action-btn"
  onClick={() =>
    apiPost(`/api/track/${listing._id}`, {
      type: "directions",
    })
  }
>
  Directions
</a>

  {whatsapp && (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noreferrer"
      className="category-action-btn"
      onClick={() =>
        apiPost(`/api/track/${listing._id}`, { type: "whatsapp" })
      }
    >
      WhatsApp
    </a>
  )}

  <a
    href={`/listing/${listing._id}`}
    className="category-action-btn category-action-main"
  >
    View Details
  </a>
</div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  </>
);
}