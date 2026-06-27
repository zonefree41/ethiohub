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

export default function Category() {
  const slug = window.location.pathname.split("/").pop();
  const search = getParam("search");
  const city = getParam("city");
  const state = getParam("state");
  const subcategory = getParam("subcategory");

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
  }, [slug, search, city, state]);

  const selectedCategory =
  slug === "all" ? null : categories.find((c) => c.slug === slug);

const title =
  slug === "all"
    ? "Search Results"
    : selectedCategory?.name_en || "Category";

const availableSubcategories = Array.isArray(selectedCategory?.subcategories)
  ? selectedCategory.subcategories
  : [];

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

    {availableSubcategories.map((sub) => (
      <a
        key={sub}
        href={`/category/${slug}?subcategory=${encodeURIComponent(sub)}`}
        className={subcategory === sub ? "active" : ""}
      >
        {sub}
      </a>
    ))}
  </div>
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
      {listing.logoUrl ? (
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

        {listing.subcategory && (
  <p className="category-subcategory">
    📍 {listing.subcategory}
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

    <div className="category-badges">
{listing.availabilityStatus === "rented" ? (
    <span className="category-rented-badge">🔴 Rented</span>
  ) : (
    <span className="category-available-badge">🟢 Available</span>
  )}

      {listing.isFeatured && <span>⭐ Featured</span>}
      {listing.isVerified && <span>✅ Verified</span>}
    </div>
  </div>

                  <p className="category-description">
                    {listing.description_en || "No description available."}
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