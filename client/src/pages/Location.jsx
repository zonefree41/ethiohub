import React from "react";
import { apiGet } from "../api/http.js";
import "./Location.css";

const LOCATIONS = {
  "silver-spring-md": {
    city: "Silver Spring",
    state: "MD",
    title: "Ethiopian Businesses in Silver Spring, MD",
    description:
      "Find Ethiopian restaurants, tax preparers, mechanics, legal services, salons, and community businesses in Silver Spring, Maryland.",
  },
  "alexandria-va": {
    city: "Alexandria",
    state: "VA",
    title: "Ethiopian Businesses in Alexandria, VA",
    description:
      "Discover Ethiopian businesses and trusted community services in Alexandria, Virginia.",
  },
  "washington-dc": {
    city: "Washington",
    state: "DC",
    title: "Ethiopian Businesses in Washington, DC",
    description:
      "Search Ethiopian services, restaurants, professionals, and community businesses in Washington, DC.",
  },
  "falls-church-va": {
    city: "Falls Church",
    state: "VA",
    title: "Ethiopian Businesses in Falls Church, VA",
    description:
      "Explore Ethiopian businesses, restaurants, auto services, and professionals near Falls Church, Virginia.",
  },
  "arlington-va": {
    city: "Arlington",
    state: "VA",
    title: "Ethiopian Businesses in Arlington, VA",
    description:
      "Find Ethiopian-owned businesses and community services in Arlington, Virginia.",
  },
};

export default function Location() {
  const slug = window.location.pathname.split("/").pop();
  const location = LOCATIONS[slug];

  const [listings, setListings] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    document.title = location
      ? `${location.title} | HubEthio`
      : "Location | HubEthio";
  }, [location]);

  React.useEffect(() => {
    let alive = true;

    async function loadLocation() {
      if (!location) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [categoryData, listingData] = await Promise.all([
          apiGet("/api/categories"),
          apiGet(
            `/api/listings?city=${encodeURIComponent(
              location.city
            )}&state=${encodeURIComponent(location.state)}`
          ),
        ]);

        if (!alive) return;

        setCategories(categoryData || []);
        setListings(Array.isArray(listingData) ? listingData : []);
      } catch (err) {
        if (alive) {
          setError(err.message || "Failed to load location listings");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadLocation();

    return () => {
      alive = false;
    };
  }, [location]);

  if (!location) {
    return (
      <main className="location-page">
        <div className="location-container">
          <a href="/" className="location-back">
            ← Back Home
          </a>

          <section className="location-state-card">
            <h1>Location not found</h1>
            <p>This location page is not available yet.</p>
            <a href="/" className="location-primary-link">
              Back to Home
            </a>
          </section>
        </div>
      </main>
    );
  }

  const filteredListings = listings.filter((listing) => {
    const matchesCategory =
      selectedCategory === "all" ||
      listing.categoryId?._id === selectedCategory ||
      listing.categoryId === selectedCategory;

    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      listing.title?.toLowerCase().includes(query) ||
      listing.description_en?.toLowerCase().includes(query) ||
      listing.categoryId?.name_en?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
  if (a.isFeatured && !b.isFeatured) return -1;
  if (!a.isFeatured && b.isFeatured) return 1;
  if (a.isVerified && !b.isVerified) return -1;
  if (!a.isVerified && b.isVerified) return 1;
  return a.title.localeCompare(b.title);
});

const featuredCount = listings.filter((listing) => listing.isFeatured).length;

  return (
    <main className="location-page">
      <div className="location-container">
        <a href="/" className="location-back">
          ← Back Home
        </a>

        <section className="location-hero">
          <p className="location-label">HubEthio Local Directory</p>
          <h1>{location.title}</h1>
          <p>{location.description}</p>

          <div className="location-hero-actions">
            <a
              href={`/category/all?city=${encodeURIComponent(
                location.city
              )}&state=${encodeURIComponent(location.state)}`}
            >
              Search all {location.city}
            </a>

            <a href="/submit">Add Your Business</a>
          </div>
        </section>

        <section className="location-filter-card">
          <div>
            <label>Search within {location.city}</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tax, restaurant, mechanic..."
            />
          </div>

          <div>
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.icon} {category.name_en}
                </option>
              ))}
              </select>
          </div>
        </section>
        <section className="location-seo-card">
  <h2>Find trusted Ethiopian services in {location.city}</h2>

  <p>
    HubEthio helps the Ethiopian community discover local restaurants,
    professionals, tax services, auto repair, churches, salons, and more in{" "}
    {location.city}, {location.state}.
  </p>
</section>

        {loading && (
          <section className="location-state-card">
            <div className="location-spinner"></div>
            <h2>Loading businesses...</h2>
            <p>Please wait while we load listings for {location.city}.</p>
          </section>
        )}

        {!loading && error && (
          <section className="location-state-card">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && filteredListings.length === 0 && (
          <section className="location-state-card">
            <h2>No businesses found yet</h2>
            <p>
              We are still adding Ethiopian businesses in {location.city},{" "}
              {location.state}. Be one of the first to join this city page.
            </p>
            <a href="/submit" className="location-primary-link">
              Add Your Business
            </a>
          </section>
        )}

        {!loading && !error && filteredListings.length > 0 && (
          <section className="location-results">
            <div className="location-results-header">
              <h2>
                {filteredListings.length} business
                {filteredListings.length !== 1 ? "es" : ""} in {location.city}
              </h2>
              <p>
  {featuredCount > 0
    ? `${featuredCount} featured business${featuredCount !== 1 ? "es" : ""} available in this area.`
    : `Browse trusted Ethiopian services in ${location.city}, ${location.state}.`}
</p>
            </div>

            <div className="location-grid">
              {sortedListings.map((listing) => {
                const phone = listing.phone || "";
                const whatsapp = String(
                  listing.whatsapp || listing.phone || ""
                ).replace(/\D/g, "");

                return (
                  <article key={listing._id} className="location-card">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="location-card-banner"
                      />
                    ) : (
                      <div className="location-no-image">No image</div>
                    )}

                    <div className="location-card-body">
                      <div className="location-card-top">
                        {listing.logoUrl ? (
                          <img
                            src={listing.logoUrl}
                            alt={`${listing.title} logo`}
                            className="location-logo"
                          />
                        ) : (
                          <div className="location-logo-placeholder">
                            {listing.title?.charAt(0)?.toUpperCase() || "B"}
                          </div>
                        )}

                        <div>
                          <h3>{listing.title}</h3>
                          <p>
                            {listing.categoryId?.name_en || "Business"} ·{" "}
                            {listing.city}, {listing.state}
                          </p>
                        </div>
                      </div>

                      <div className="location-badges">
                        {listing.isFeatured && <span>⭐ Featured</span>}
                        {listing.isVerified && <span>✅ Verified</span>}
                      </div>

                      <p className="location-description">
                        {listing.description_en || "No description available."}
                      </p>

                      <div className="location-actions">
                        {phone && <a href={`tel:${phone}`}>Call</a>}

                        {whatsapp && (
                          <a
                            href={`https://wa.me/${whatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </a>
                        )}

                        <a href={`/listing/${listing._id}`}>View Details</a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}