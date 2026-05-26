import React from "react";
import { apiGet, apiPatch, apiPost } from "../../api/http.js";
import "./OwnerDashboard.css";

export default function OwnerDashboard() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [ownerSearch, setOwnerSearch] = React.useState("");

  React.useEffect(() => {
    document.title = "Owner Dashboard | HubEthio";
  }, []);

  async function loadListings() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet("/api/owner/listings/my-listings", token);

      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/owner/login";
      return;
    }

    loadListings();
  }, []);

  async function claimListing(id) {
    try {
      await apiPatch(`/api/owner/listings/claim/${id}`, {}, token);

      await loadListings();
      alert("Listing claimed successfully");
    } catch (err) {
      alert(err.message || "Failed to claim listing");
    }
  }

  async function manageSubscription(stripeCustomerId) {
    try {
      const data = await apiPost("/api/stripe/create-portal-session", {
        stripeCustomerId,
      });

      if (!data.url) {
        throw new Error("Billing portal link was not created.");
      }

      window.location.href = data.url;
    } catch (err) {
      alert(err.message || "Failed to open billing portal");
    }
  }

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

  function getStatusClass(status) {
    if (status === "approved") return "owner-status-approved";
    if (status === "rejected") return "owner-status-rejected";
    return "owner-status-pending";
  }

  const approvedCount = listings.filter((l) => l.status === "approved").length;
  const pendingCount = listings.filter((l) => l.status === "pending").length;
  const featuredCount = listings.filter((l) => l.isFeatured).length;

  const filteredListings = listings.filter((listing) => {
    const query = ownerSearch.trim().toLowerCase();

    if (!query) return true;

    return (
      listing.title?.toLowerCase().includes(query) ||
      listing.city?.toLowerCase().includes(query) ||
      listing.state?.toLowerCase().includes(query) ||
      listing.categoryId?.name_en?.toLowerCase().includes(query) ||
      listing.status?.toLowerCase().includes(query)
    );
  });

  return (
    <main className="owner-dashboard-page">
      <div className="owner-dashboard-container">
        <header className="owner-dashboard-header">
          <div>
            <a href="/" className="owner-dashboard-back">
              ← Back Home
            </a>

            <p className="owner-dashboard-label">Business Portal</p>
            <h1>Business Owner Dashboard</h1>
            <p>Manage your HubEthio business listings and subscriptions.</p>
          </div>

          <div className="owner-dashboard-header-actions">
            <a href="/submit">Submit New Listing</a>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {error && <div className="owner-dashboard-error">Error: {error}</div>}

        {loading && (
          <div className="owner-dashboard-state">
            <div className="owner-dashboard-spinner"></div>
            <h2>Loading listings...</h2>
            <p>Please wait while we load your business listings.</p>
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="owner-dashboard-empty">
            <h2>You do not own any listings yet</h2>
            <p>
              Submit a business listing first. After admin approval, you can
              edit it and upgrade it to Featured.
            </p>

            <div className="owner-dashboard-empty-actions">
              <a href="/submit">Submit Business Listing</a>
              <a href="/pricing">View Pricing</a>
            </div>
          </div>
        )}

        {!loading && listings.length > 0 && (
          <>
            <section className="owner-dashboard-summary">
              <div>
                <strong>{listings.length}</strong>
                <span>Total Listings</span>
              </div>

              <div>
                <strong>{approvedCount}</strong>
                <span>Approved</span>
              </div>

              <div>
                <strong>{pendingCount}</strong>
                <span>Pending</span>
              </div>

              <div>
                <strong>{featuredCount}</strong>
                <span>Featured</span>
              </div>
            </section>

            <section className="owner-dashboard-search">
              <input
                value={ownerSearch}
                onChange={(e) => setOwnerSearch(e.target.value)}
                placeholder="Search your listings by name, city, category, or status..."
              />
            </section>

            {filteredListings.length === 0 && (
              <div className="owner-dashboard-empty">
                <h2>No matching listings found</h2>
                <p>Try a different search term.</p>
              </div>
            )}

            {filteredListings.length > 0 && (
              <section className="owner-dashboard-grid">
                {filteredListings.map((listing) => (
                  <article key={listing._id} className="owner-listing-card">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="owner-listing-banner"
                      />
                    ) : (
                      <div className="owner-listing-no-banner">
                        No banner image
                      </div>
                    )}

                    <div className="owner-listing-body">
                      <div className="owner-listing-top">
                        {listing.logoUrl ? (
                          <img
                            src={listing.logoUrl}
                            alt={listing.title}
                            className="owner-listing-logo"
                          />
                        ) : (
                          <div className="owner-listing-logo-placeholder">
                            {listing.title?.charAt(0)?.toUpperCase() || "B"}
                          </div>
                        )}

                        <div>
                          <h2>{listing.title}</h2>

                          <p>
                            {[listing.city, listing.state]
                              .filter(Boolean)
                              .join(", ") || "Location not available"}
                          </p>

                          <div className="owner-listing-badges">
                            <span className={getStatusClass(listing.status)}>
                              {listing.status || "pending"}
                            </span>

                            {listing.paymentStatus === "active" && listing.isFeatured && (
                              <span className="owner-featured-badge">
                                ⭐ Featured Active
                              </span>
                            )}

                            {listing.paymentStatus === "active" && listing.isVerified && (
                              <span className="owner-verified-badge">
                                ✅ Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="owner-listing-info">
                        <p>
                          <strong>Category:</strong>{" "}
                          {listing.categoryId?.name_en || "N/A"}
                        </p>

                        <p>
  <strong>Plan:</strong>{" "}
  {listing.paymentStatus === "trial"
    ? "Free Featured Trial Active"
    : listing.paymentStatus === "active" && listing.isFeatured
    ? "Featured Monthly Plan Active"
    : "Basic Free Listing"}
</p>

{listing.paymentStatus === "trial" && (
  <p className="owner-trial-end">
    <strong>Trial Ends:</strong> {formatDate(listing.trialEndsAt)}
  </p>
)}

{listing.paymentStatus !== "active" &&
 listing.paymentStatus !== "trial" && (
  <div className="owner-upgrade-notice">
    <h3>Upgrade to Featured</h3>
    <p>
      This listing is currently on the free/basic plan. Upgrade to Featured to
      get premium visibility, a Featured badge, and higher placement in search,
      nearby, and related businesses.
    </p>
  </div>
)}

                        <p>
                          <strong>Payment Status:</strong>{" "}
                          {listing.paymentStatus || "N/A"}
                        </p>
                      </div>

                      <div className="owner-listing-clicks">
  <strong>
    Total Clicks:{" "}
    {(listing.clicks?.call || 0) +
      (listing.clicks?.whatsapp || 0) +
      (listing.clicks?.website || 0) +
      (listing.clicks?.directions || 0)}
  </strong>

  <span>📞 Calls: {listing.clicks?.call || 0}</span>
  <span>💬 WhatsApp: {listing.clicks?.whatsapp || 0}</span>
  <span>🌐 Website: {listing.clicks?.website || 0}</span>
  <span>📍 Directions: {listing.clicks?.directions || 0}</span>
</div>

                      <div className="owner-listing-actions">
                        {listing.status === "approved" ? (
                          <a href={`/listing/${listing._id}`}>
                            View Public Listing
                          </a>
                        ) : (
                          <span className="owner-muted-note">
                            Public page available after admin approval
                          </span>
                        )}

                        <a href={`/owner/listings/edit/${listing._id}`}>
                          Edit Listing
                        </a>

                        {listing.status === "approved" &&
 listing.paymentStatus !== "active" &&
 listing.paymentStatus !== "trial" && (
  <a
    href={`/pricing?listingId=${listing._id}`}
    className="owner-upgrade-btn"
  >
    Upgrade to Featured
  </a>
)}

                        {listing.isFeatured && listing.stripeCustomerId && (
                          <button
                            type="button"
                            onClick={() =>
                              manageSubscription(listing.stripeCustomerId)
                            }
                          >
                            Manage Subscription
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => claimListing(listing._id)}
                        >
                          Claim Listing
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}