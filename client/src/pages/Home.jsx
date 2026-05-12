import React from "react";
import { apiGet } from "../api/http.js";
import "./Home.css";

export default function Home() {
  const [categories, setCategories] = React.useState([]);
  const [featuredListings, setFeaturedListings] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [categorySlug, setCategorySlug] = React.useState("all");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const keywordSuggestions = [
    "tax",
    "tax preparer",
    "lawyer",
    "immigration",
    "mechanic",
    "auto repair",
    "restaurant",
    "translator",
    "notary",
    "tutor",
    "insurance",
    "real estate",
    "Silver Spring",
    "Alexandria",
    "Falls Church",
    "Washington DC",
    "Arlington",
  ];

  const suggestions = [
    ...categories.map((c) => c.name_en),
    ...categories.map((c) => c.name_am),
    ...keywordSuggestions,
  ]
    .filter(
      (item) =>
        item &&
        search.trim().length > 0 &&
        item.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  React.useEffect(() => {
    let alive = true;

    async function loadHomeData() {
      try {
        setLoading(true);
        setError("");

        const [categoryData, listingData] = await Promise.all([
          apiGet("/api/categories"),
          apiGet("/api/listings?featured=true"),
        ]);

        if (!alive) return;

        setCategories(categoryData || []);
        setFeaturedListings(Array.isArray(listingData) ? listingData : []);
      } catch (err) {
        if (alive) setError(err.message || "Failed to load homepage");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadHomeData();

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
  document.title = "HubEthio - Ethiopian Community Services";

  const meta = document.querySelector('meta[name="description"]');

  if (meta) {
    meta.setAttribute(
      "content",
      "Find Ethiopian businesses, restaurants, tax services, immigration help, mechanics, and community professionals near you."
    );
  }
}, []);

  function goSearch(e) {
    e.preventDefault();

    const url =
      `/category/${categorySlug || "all"}` +
      `?search=${encodeURIComponent(search)}` +
      `&city=${encodeURIComponent(city)}` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = url;
  }

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-badge">🇪🇹 Ethiopian Community Marketplace</span>

          <h1>Find trusted Ethiopian services near you</h1>

          <p className="home-subtitle">
            Search businesses, professionals, restaurants, tax preparers,
            mechanics, immigration help, and more.
          </p>

          <form onSubmit={goSearch} className="home-search-box">
            <div className="home-input-wrap">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search: tax, lawyer, mechanic..."
                className="home-input"
              />

              {suggestions.length > 0 && (
                <div className="home-suggestions">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSearch(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="home-input"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug}>
                  {c.icon} {c.name_en}
                </option>
              ))}
            </select>

            <div className="home-location-row">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="home-input"
              />

              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="home-state-input"
              />
            </div>

            <button type="submit" className="home-primary-btn">
              Search Services
            </button>
          </form>

          <a href="/submit" className="home-secondary-btn">
            Add Your Business
          </a>
        </div>
      </section>

      <div className="home-container">
        {loading && <p className="home-message">Loading HubEthio...</p>}

        {error && <div className="home-error">Error: {error}</div>}

        {!loading && !error && featuredListings.length > 0 && (
          <section className="home-section">
            <h2>⭐ Featured Businesses</h2>
            <p className="home-section-text">
              Promoted Ethiopian businesses and community services.
            </p>

            <div className="home-grid">
              {featuredListings.slice(0, 6).map((listing) => (
                <a
                  key={listing._id}
                  href={`/listing/${listing._id}`}
                  className="home-card-link"
                >
                  <article className="home-card">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="home-card-banner"
                      />
                    ) : (
                      <div className="home-no-image">No image</div>
                    )}

                    <div className="home-card-body">
                      {listing.logoUrl ? (
                        <img
                          src={listing.logoUrl}
                          alt={`${listing.title} logo`}
                          className="home-business-logo"
                        />
                      ) : (
                        <div className="home-business-logo-placeholder">
                          {listing.title?.charAt(0)?.toUpperCase() || "B"}
                        </div>
                      )}

                      <span className="home-featured-badge">⭐ Featured</span>

                      <h3>{listing.title}</h3>

                      <p>{listing.categoryId?.name_en || "Business"}</p>

                      <p>
                        {listing.city}
                        {listing.state ? `, ${listing.state}` : ""}
                      </p>

                      <p className="home-description">
                        {listing.description_en?.slice(0, 110)}
                        {listing.description_en?.length > 110 ? "..." : ""}
                      </p>
                    </div>
                  </article>
                </a>
              ))}
            </div>
          </section>
        )}

        {!loading && !error && (
          <section className="home-section">
            <h2>Browse Categories</h2>
            <p className="home-section-text">
              Quickly explore popular Ethiopian community services.
            </p>

            <div className="home-category-grid">
              {categories.map((category) => (
                <a
                  key={category._id}
                  href={`/category/${category.slug}`}
                  className="home-category-card"
                >
                  <div className="home-category-icon">{category.icon || "📌"}</div>
                  <div className="home-category-name">{category.name_en}</div>
                  <div className="home-category-am">{category.name_am}</div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}