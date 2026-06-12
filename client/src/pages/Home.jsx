import React from "react";
import { apiGet, apiPost } from "../api/http.js";
import "./Home.css";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [categories, setCategories] = React.useState([]);
  const [featuredListings, setFeaturedListings] = React.useState([]);
  const [search, setSearch] = React.useState("");
  const [categorySlug, setCategorySlug] = React.useState("all");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [recentListings, setRecentListings] = React.useState([]);

  const [businessRequestForm, setBusinessRequestForm] = React.useState({
    businessName: "",
    category: "",
    city: "",
    state: "",
    phone: "",
    website: "",
    suggestedByName: "",
    suggestedByContact: "",
    message: "",
  });

  const [businessRequestMessage, setBusinessRequestMessage] =
    React.useState("");
  const [businessRequestError, setBusinessRequestError] = React.useState("");

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
    document.title = "HubEthio | Ethiopian Business Directory";
  }, []);

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

        <>
  <Helmet>
    <title>HubEthio | Ethiopian Businesses & Community Services Near You</title>
    <meta
      name="description"
      content="Find trusted Ethiopian businesses, auto repair, restaurants, beauty salons, tax services, and community services near you on HubEthio."
    />
    <link rel="canonical" href="https://www.hubethio.com/" />

    <meta property="og:title" content="HubEthio | Ethiopian Businesses & Community Services Near You" />
    <meta
      property="og:description"
      content="Discover trusted Ethiopian businesses and community services near you."
    />
    <meta property="og:url" content="https://www.hubethio.com/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="HubEthio" />
  </Helmet>

  {/* existing Home page JSX */}
</>;

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
  async function loadRecentListings() {
    try {
      const recentIds = JSON.parse(
        localStorage.getItem("hubethioRecentlyViewed") || "[]"
      );

      if (recentIds.length === 0) {
        setRecentListings([]);
        return;
      }

      const results = await Promise.all(
        recentIds.map((listingId) =>
          apiGet(`/api/listings/${listingId}`).catch(() => null)
        )
      );

      setRecentListings(results.filter(Boolean));
    } catch (err) {
      console.error("Failed to load recent listings:", err);
    }
  }

  loadRecentListings();
}, []);

function removeRecentListing(id) {
  const recentIds = JSON.parse(
    localStorage.getItem("hubethioRecentlyViewed") || "[]"
  );

  const updated = recentIds.filter((itemId) => itemId !== id);

  localStorage.setItem(
    "hubethioRecentlyViewed",
    JSON.stringify(updated)
  );

  setRecentListings((prev) =>
    prev.filter((item) => item._id !== id)
  );
}

  function goSearch(e) {
    e.preventDefault();
    setShowSuggestions(false);

    const url =
      `/category/${categorySlug || "all"}` +
      `?search=${encodeURIComponent(search)}` +
      `&city=${encodeURIComponent(city)}` +
      `&state=${encodeURIComponent(state)}`;

    window.location.href = url;
  }

  async function submitBusinessRequest(e) {
    e.preventDefault();

    setBusinessRequestMessage("");
    setBusinessRequestError("");

    try {
      await apiPost("/api/business-requests", businessRequestForm);

      setBusinessRequestMessage("✅ Business request submitted successfully.");

      setBusinessRequestForm({
        businessName: "",
        category: "",
        city: "",
        state: "",
        phone: "",
        website: "",
        suggestedByName: "",
        suggestedByContact: "",
        message: "",
      });
    } catch (err) {
      setBusinessRequestError(
        err.message || "Failed to submit business request."
      );
    }
  }

  return (
    <main className="home-page">
      <header className="home-topbar">
        <div className="home-topbar-inner">
          <a href="/" className="home-brand">
            <span className="home-brand-mark">ET</span>
            <span className="home-brand-text">
              Hub<span>Ethio</span>
            </span>
          </a>

          <button
            type="button"
            className="home-mobile-menu-btn"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>

          <nav
            className={`home-nav ${mobileNavOpen ? "home-nav-open" : ""}`}
            aria-label="Main navigation"
          >
            <a href="/" className="active">
              Home
            </a>
            <a href="/category/all">Categories</a>
            <a href="/location/silver-spring-md">Silver Spring</a>
            <a href="/pricing">Pricing</a>
            <a
  href="https://play.google.com/store/apps/details?id=com.hubethio.app"
  target="_blank"
  rel="noopener noreferrer"
>
  📱 Get App
</a>
            <a href="/saved">Saved ❤️</a>
            <a href="/submit">Submit Business</a>
            <a href="/contact">Contact</a>
            <a href="/owner/login" className="home-nav-login">
              Business Owner Login
            </a>
          </nav>
        </div>
      </header>

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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (search.trim()) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                placeholder="Search: tax, lawyer, mechanic..."
                className="home-input"
              />

              {showSuggestions && suggestions.length > 0 && (
                <div className="home-suggestions">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSearch(s);
                        setShowSuggestions(false);
                      }}
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

          <div className="home-hero-actions">
  <a href="/submit" className="home-list-free-btn">
    🚀 Own a Business? List It Free
  </a>

  <a href="/owner/login" className="home-owner-btn">
    Business Owner Login
  </a>
</div>
        </div>
      </section>

      <div className="home-container">
        {loading && <p className="home-message">Loading HubEthio...</p>}

        {error && <div className="home-error">Error: {error}</div>}

        {!loading && !error && (
          <section className="home-section">
            <h2>⭐ Featured Businesses</h2>
            <p className="home-section-text">
              Promoted Ethiopian businesses and community services.
            </p>

            {featuredListings.length === 0 ? (
              <div className="home-empty-state">
                <h3>No featured businesses yet</h3>
                <p>
                  Featured Ethiopian businesses will appear here after they are
                  approved and upgraded. Be one of the first businesses to join
                  HubEthio.
                </p>

                <div className="home-empty-actions">
                  <a href="/submit">Add Your Business</a>
                  <a href="/owner/register">Create Owner Account</a>
                </div>
              </div>
            ) : (
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

                        {listing.totalReviews > 0 && (
                          <p className="home-rating">
                            ⭐ {listing.averageRating} ({listing.totalReviews}{" "}
                            review{listing.totalReviews !== 1 ? "s" : ""})
                          </p>
                        )}

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
            )}
          </section>
        )}

        {recentListings.length > 0 && (
  <section className="home-section">
    <h2>🕒 Recently Viewed</h2>

    <p className="home-section-text">
      Businesses you recently viewed.
    </p>

    <div className="home-grid">
      {recentListings.map((listing) => (
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
              <h3>{listing.title}</h3>

              <p>
                {listing.categoryId?.name_en || "Business"}
              </p>

              <p>
                {[listing.city, listing.state]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              <button
  type="button"
  className="recent-remove-btn"
  onClick={(e) => {
    e.preventDefault();
    removeRecentListing(listing._id);
  }}
>
  Remove ✕
</button>
            </div>
          </article>
        </a>
      ))}
    </div>
  </section>
)}

        <section className="home-locations-section">
          <div className="home-section-heading">
            <div>
              <p className="home-section-kicker">Browse by city</p>
              <h2>Popular Ethiopian community locations</h2>
            </div>

            <a href="/category/all" className="home-section-link">
              View all services →
            </a>
          </div>

          <div className="home-location-grid">
            <a href="/location/silver-spring-md" className="home-location-card">
              <span>📍</span>
              <div>
                <h3>Silver Spring, MD</h3>
                <p>Restaurants, tax help, legal services, mechanics, and more.</p>
              </div>
            </a>

            <a href="/location/alexandria-va" className="home-location-card">
              <span>📍</span>
              <div>
                <h3>Alexandria, VA</h3>
                <p>Find Ethiopian businesses and trusted local professionals.</p>
              </div>
            </a>

            <a href="/location/washington-dc" className="home-location-card">
              <span>📍</span>
              <div>
                <h3>Washington, DC</h3>
                <p>Discover Ethiopian services and community businesses in DC.</p>
              </div>
            </a>

            <a href="/location/falls-church-va" className="home-location-card">
              <span>📍</span>
              <div>
                <h3>Falls Church, VA</h3>
                <p>Browse Ethiopian restaurants, auto services, salons, and more.</p>
              </div>
            </a>

            <a href="/location/arlington-va" className="home-location-card">
              <span>📍</span>
              <div>
                <h3>Arlington, VA</h3>
                <p>Find Ethiopian-owned businesses and community services nearby.</p>
              </div>
            </a>
          </div>
        </section>

        {!loading && !error && (
          <section className="home-section">
            <h2>Browse Categories</h2>
            <p className="home-section-text">
              Quickly explore popular Ethiopian community services.
            </p>

            {categories.length === 0 ? (
              <div className="home-empty-state">
                <h3>No categories available yet</h3>
                <p>
                  Categories are being prepared. Please check back soon or add a
                  business to help grow the HubEthio community.
                </p>
              </div>
            ) : (
              <div className="home-category-grid">
                {categories.map((category) => (
                  <a
                    key={category._id}
                    href={`/category/${category.slug}`}
                    className="home-category-card"
                  >
                    <div className="home-category-icon">
                      {category.icon || "📌"}
                    </div>
                    <div className="home-category-name">
                      {category.name_en}
                    </div>
                    <div className="home-category-am">{category.name_am}</div>
                  </a>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="request-business-section">
          <div className="request-business-card">
            <h2>Know an Ethiopian business we should add?</h2>
            <p>
              Help HubEthio grow by suggesting restaurants, tax services,
              lawyers, mechanics, grocery stores, churches, and more.
            </p>

            {businessRequestMessage && (
              <div className="request-business-success">
                {businessRequestMessage}
              </div>
            )}

            {businessRequestError && (
              <div className="request-business-error">
                {businessRequestError}
              </div>
            )}

            <form
              onSubmit={submitBusinessRequest}
              className="request-business-form"
            >
              <input
                placeholder="Business Name *"
                value={businessRequestForm.businessName}
                onChange={(e) =>
                  setBusinessRequestForm({
                    ...businessRequestForm,
                    businessName: e.target.value,
                  })
                }
                required
              />

              <input
                placeholder="Category"
                value={businessRequestForm.category}
                onChange={(e) =>
                  setBusinessRequestForm({
                    ...businessRequestForm,
                    category: e.target.value,
                  })
                }
              />

              <div className="request-business-row">
                <input
                  placeholder="City"
                  value={businessRequestForm.city}
                  onChange={(e) =>
                    setBusinessRequestForm({
                      ...businessRequestForm,
                      city: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="State"
                  value={businessRequestForm.state}
                  onChange={(e) =>
                    setBusinessRequestForm({
                      ...businessRequestForm,
                      state: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <input
                placeholder="Business Phone"
                value={businessRequestForm.phone}
                onChange={(e) =>
                  setBusinessRequestForm({
                    ...businessRequestForm,
                    phone: e.target.value,
                  })
                }
              />

              <input
                placeholder="Business Website"
                value={businessRequestForm.website}
                onChange={(e) =>
                  setBusinessRequestForm({
                    ...businessRequestForm,
                    website: e.target.value,
                  })
                }
              />

              <input
                placeholder="Your Name"
                value={businessRequestForm.suggestedByName}
                onChange={(e) =>
                  setBusinessRequestForm({
                    ...businessRequestForm,
                    suggestedByName: e.target.value,
                  })
                }
              />

              <input
                placeholder="Your Email or Phone"
                value={businessRequestForm.suggestedByContact}
                onChange={(e) =>
                  setBusinessRequestForm({
                    ...businessRequestForm,
                    suggestedByContact: e.target.value,
                  })
                }
              />

              <textarea
                rows="4"
                placeholder="Any extra details?"
                value={businessRequestForm.message}
                onChange={(e) =>
                  setBusinessRequestForm({
                    ...businessRequestForm,
                    message: e.target.value,
                  })
                }
              />

              <button type="submit">Request Business</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}