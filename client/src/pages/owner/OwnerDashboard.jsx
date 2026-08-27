import React from "react";
// import { apiGet, apiPatch, apiPost } from "../../api/http.js";
import "./OwnerDashboard.css";
import TravelWorkspaceSummary from "./workspaces/TravelWorkspaceSummary.jsx";
import TransportationWorkspaceSummary from "./workspaces/TransportationWorkspaceSummary.jsx";
import WorkspaceLauncher from "../../components/owner/WorkspaceLauncher.jsx";
import {
  apiGet,
  apiPatch,
  apiPost,
  apiDelete,
} from "../../api/http.js";

export default function OwnerDashboard() {
  const isIOSBuild = __IOS_BUILD__;
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [ownerSearch, setOwnerSearch] = React.useState("");

  const [transportationRequests, setTransportationRequests] = React.useState([]);
const [loadingRequests, setLoadingRequests] = React.useState(false);

const [showDeleteAccount, setShowDeleteAccount] =
  React.useState(false);

const [deletingAccount, setDeletingAccount] =
  React.useState(false);

const [deleteAccountError, setDeleteAccountError] =
  React.useState("");

const [travelRequests, setTravelRequests] =
  React.useState([]);

const [loadingTravelRequests, setLoadingTravelRequests] =
  React.useState(true);

  React.useEffect(() => {
    document.title = "Owner Dashboard | HubEthio";
  }, []);

  async function loadListings() {
  try {
    setLoading(true);
    setError("");

    const data = await apiGet(
      "/api/owner/listings/my-listings",
      token
    );

    const ownerListings = Array.isArray(data)
      ? data
      : [];

      ownerListings.forEach((listing) => {
  console.log(
    listing.title,
    listing.categoryId?.slug
  );
});

    setListings(ownerListings);

    const ownsTransportation =
      ownerListings.some(
        (listing) =>
          listing.categoryId?.slug ===
          "transportation"
      );

    const ownsTravel =
      ownerListings.some(
        (listing) =>
          listing.categoryId?.slug ===
          "travel-tours"
      );

    const workspaceRequests = [];

    if (ownsTransportation) {
      workspaceRequests.push(
        loadTransportationRequests()
      );
    } else {
      setTransportationRequests([]);
      setLoadingRequests(false);
    }

    if (ownsTravel) {
      workspaceRequests.push(
        loadTravelRequests()
      );
    } else {
      setTravelRequests([]);
      setLoadingTravelRequests(false);
    }

    await Promise.all(workspaceRequests);
  } catch (err) {
  const message =
    err.message ||
    "Failed to load listings";

  const unauthorized =
    message
      .toLowerCase()
      .includes("invalid or expired token") ||
    message
      .toLowerCase()
      .includes("unauthorized") ||
    message.includes("401");

  if (unauthorized) {
    localStorage.removeItem(
      "ownerToken"
    );

    localStorage.removeItem(
      "ownerUser"
    );

    window.location.href =
      "/owner/login?redirect=/owner/dashboard";

    return;
  }

  setError(message);
} finally {
    setLoading(false);
  }
}

async function loadTransportationRequests() {
  try {
    setLoadingRequests(true);

    const data = await apiGet(
      "/api/transportation-requests/owner",
      token
    );

    setTransportationRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    console.error(
      "Failed to load transportation requests:",
      err
    );

    setTransportationRequests([]);
  } finally {
    setLoadingRequests(false);
  }
}

async function loadTravelRequests() {
  try {
    setLoadingTravelRequests(true);

    const data = await apiGet(
      "/api/travel-requests/owner",
      token
    );

    setTravelRequests(
      Array.isArray(data) ? data : []
    );
  } catch (err) {
    console.error(
      "Failed to load travel requests:",
      err
    );

    setTravelRequests([]);
  } finally {
    setLoadingTravelRequests(false);
  }
}

  React.useEffect(() => {
  if (!token) {
    window.location.href =
      "/owner/login";
    return;
  }

  loadListings();
}, [token]);

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

async function deleteAccount() {
  try {
    setDeletingAccount(true);
    setDeleteAccountError("");

    await apiDelete(
      "/api/owner/auth/account",
      token
    );

    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerUser");

    window.location.href = "/";
  } catch (err) {
    setDeleteAccountError(
      err.message ||
        "Failed to delete account."
    );
  } finally {
    setDeletingAccount(false);
  }
}

  function formatDate(value) {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTrialDaysLeft(value) {
  if (!value) return null;

  const end = new Date(value);
  const now = new Date();

  const diffMs = end.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
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

const ownerWorkspaces = React.useMemo(
  () => ({
    travel: listings.some(
      (listing) =>
        listing.categoryId?.slug ===
        "travel-tours"
    ),

    transportation: listings.some(
      (listing) =>
        listing.categoryId?.slug ===
        "transportation"
    ),

    beauty: listings.some(
      (listing) =>
        listing.categoryId?.slug ===
        "beauty-wellness"
    ),
  }),
  [listings]
);

  return (
    <main className="owner-dashboard-page">
      <div className="owner-dashboard-container">
        <header className="owner-dashboard-header">
          <div>
            <a href="/" className="owner-dashboard-back">
              ‹ Back to HubEthio
            </a>

            <p className="owner-dashboard-label">Business Portal</p>
            <h1>Business Owner Dashboard</h1>
            <p>Manage your HubEthio business listings and subscriptions.</p>
          </div>

          <div className="owner-dashboard-header-actions">
  <a href="/submit">
    Submit New Listing
  </a>

  {ownerWorkspaces.transportation && (
  <a href="/owner/transportation">
    🚚 Transportation Requests
    {transportationRequests.length > 0 && (
      <span>
        {" "}
        ({transportationRequests.length})
      </span>
    )}
  </a>
)}

  {ownerWorkspaces.travel && (
  <a href="/owner/travel-requests">
    ✈️ Travel Requests
    {travelRequests.length > 0 && (
      <span> ({travelRequests.length})</span>
    )}
  </a>
)}

  <button
    type="button"
    onClick={logout}
  >
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
              {!isIOSBuild && <a href="/pricing">View Pricing</a>}
            </div>
          </div>
        )}

        <section className="owner-dashboard-quick-actions">
    {!isIOSBuild && (
  <a
    href="/sell-car"
    className="owner-dashboard-quick-action"
  >
    <span className="owner-dashboard-quick-action-icon">
      ➕
    </span>

    <div>
      <strong>Sell a Car</strong>
      <span>
        Create a new Cars Marketplace
        listing.
      </span>
    </div>
  </a>
)}

  <a
    href="/sell-car"
    className="owner-dashboard-quick-action"
  >
    <span className="owner-dashboard-quick-action-icon">
      ➕
    </span>

    <div>
      <strong>Sell a Car</strong>
      <span>
        Create a new Cars Marketplace
        listing.
      </span>
    </div>
  </a>
</section>

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

              {!isIOSBuild && (
  <div>
    <strong>{featuredCount}</strong>
    <span>Featured</span>
  </div>
)}
            </section>

            <WorkspaceLauncher
  listings={listings}
  requestCounts={{
    transportation:
      transportationRequests.length,

    travel:
      travelRequests.length,

    beauty: 0,
  }}
/>

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

                            {!isIOSBuild &&
  listing.paymentStatus === "active" &&
  listing.isFeatured && (
    <span className="owner-featured-badge">
      ⭐ Featured Active
    </span>
  )}

{!isIOSBuild &&
  listing.paymentStatus === "active" &&
  listing.isVerified && (
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

                        {listing.categoryId?.slug === "transportation" &&
  listing.transportVerification?.verificationStatus && (
  <div className="owner-transport-verification-card">

    <h3>🚚 Transportation Verification</h3>

    {listing.transportVerification.verificationStatus ===
      "Pending Review" && (
      <div className="owner-transport-status pending">
        <strong>🟡 Pending Review</strong>

        <p>
          Your Transportation Verification has been submitted and is
          currently under review by the HubEthio Admin Team.
        </p>
      </div>
    )}

    {listing.transportVerification.verificationStatus ===
      "Approved" && (
      <div className="owner-transport-status approved">
        <strong>🟢 Approved</strong>

        <p>
          Congratulations! Your Transportation Verification has been
          approved and your transportation business is verified.
        </p>
      </div>
    )}

    {listing.transportVerification.verificationStatus ===
  "Rejected" && (
  <div className="owner-transport-status rejected">
    <strong>🔴 Rejected</strong>

     <p>
      Your Transportation Verification was not approved.
    </p>

    {listing.transportVerification.rejectionReason ? (
      <>
        <p>
          <strong>Reason:</strong>
        </p>

        <p className="owner-transport-reason">
          {listing.transportVerification.rejectionReason}
        </p>
      </>
    ) : (
      <p>
        Please review your documents and submit again.
      </p>
    )}

    <p>
      After correcting the issue, update your documents and submit your
      Transportation Verification again.
    </p>
  </div>
    )}
  </div>
                        )}
                        {!isIOSBuild && (
                          <div className="owner-subscription-card">
                             {/* existing subscription card content */}
                            <h3>Subscription Status</h3>

                            <p>
                              <strong>Plan:</strong>{" "}
                              {listing.paymentStatus === "trial"
                                ? "Free Featured Trial"
                                : listing.paymentStatus === "active" && listing.isFeatured
                                ? "Featured Monthly Plan"
                                : "Free Basic Listing"}
                            </p>

                            <p>
                              <strong>Status:</strong>{" "}
                              {listing.paymentStatus === "trial"
                                ? "Trial Active"
                                : listing.paymentStatus === "active"
                                ? "Active"
                                : listing.paymentStatus || "Not Subscribed"}
                            </p>

                            {listing.paymentStatus === "trial" && (
                              <>
                                <p>
                                  <strong>Trial Ends:</strong>{" "}
                                  {formatDate(listing.trialEndsAt)}
                                </p>

                                <div className="owner-trial-banner">
                                  <div className="owner-trial-header">
                                    🎉 Premium Trial Active
                                  </div>

                                  <div className="owner-trial-days">
                                    {getTrialDaysLeft(listing.trialEndsAt)} Days Remaining
                                  </div>

                                  <p className="owner-trial-text">
                                    You're currently enjoying all Premium features at no cost.
                                  </p>

                                  <div className="owner-trial-benefits">
                                    <span>⭐ Featured Placement</span>
                                    <span>✅ Verified Business</span>
                                    <span>📈 Premium Analytics</span>
                                    <span>🚀 Higher Search Ranking</span>
                                  </div>

                                  {!isIOSBuild && (
                                    <a
                                      href={`/pricing?listingId=${listing._id}`}
                                      className="owner-trial-upgrade-btn"
                                    >
                                      Upgrade Before Trial Ends
                                    </a>
                                  )}
                                </div>
                              </>
                            )}

                            {listing.subscriptionCancelAt && (
                              <p>
                                <strong>Subscription Cancels:</strong>{" "}
                                {formatDate(listing.subscriptionCancelAt)}
                              </p>
                            )}

                            <p>
                              <strong>Featured:</strong> {listing.isFeatured ? "Yes" : "No"}
                            </p>

                            <p>
                              <strong>Verified:</strong> {listing.isVerified ? "Yes" : "No"}
                            </p>

                            {listing.status === "approved" &&
                              listing.paymentStatus !== "active" &&
                              listing.paymentStatus !== "trial" && (
                                <div className="owner-premium-card">
                                  <div className="owner-premium-card-header">
                                    <div className="owner-premium-icon">🚀</div>

                                    <div>
                                      <p className="owner-premium-label">HubEthio Premium</p>
                                      <h3>Grow Your Business Visibility</h3>
                                    </div>
                                  </div>

                                  <p className="owner-premium-description">
                                    Upgrade your listing to reach more customers and stand out across
                                    HubEthio.
                                  </p>

                                  <div className="owner-premium-benefits">
                                    <span>✓ Featured placement</span>
                                    <span>✓ Verified business badge</span>
                                    <span>✓ Higher search visibility</span>
                                    <span>✓ Premium performance analytics</span>
                                  </div>

                                  {!isIOSBuild && (
                                    <a
                                      href={`/pricing?listingId=${listing._id}`}
                                      className="owner-premium-upgrade-btn"
                                    >
                                      Upgrade Now
                                    </a>
                                  )}

                                  <p className="owner-premium-note">
                                    Your basic business listing will remain visible even without Premium.
                                  </p>
                                </div>
                              )}
                          </div>
                        )}
                      </div>


                      <div className="owner-performance-section">
  <h3>📊 Business Performance</h3>

  <div className="owner-performance-grid">

    <div className="owner-stat-card">
      <div className="owner-stat-icon">👁️</div>
      <div className="owner-stat-number">{listing.clicks?.views || 0}</div>
      <div className="owner-stat-label">Views</div>
    </div>

    <div className="owner-stat-card">
      <div className="owner-stat-icon">📞</div>
      <div className="owner-stat-number">{listing.clicks?.call || 0}</div>
      <div className="owner-stat-label">Calls</div>
    </div>

    <div className="owner-stat-card">
      <div className="owner-stat-icon">💬</div>
      <div className="owner-stat-number">{listing.clicks?.whatsapp || 0}</div>
      <div className="owner-stat-label">WhatsApp</div>
    </div>

    <div className="owner-stat-card">
      <div className="owner-stat-icon">🌐</div>
      <div className="owner-stat-number">{listing.clicks?.website || 0}</div>
      <div className="owner-stat-label">Website</div>
    </div>

    <div className="owner-stat-card">
      <div className="owner-stat-icon">📍</div>
      <div className="owner-stat-number">{listing.clicks?.directions || 0}</div>
      <div className="owner-stat-label">Directions</div>
    </div>

  </div>

  <div className="owner-total-actions">
    Total Customer Actions:
    <strong>
      {" "}
      {(listing.clicks?.call || 0) +
        (listing.clicks?.whatsapp || 0) +
        (listing.clicks?.website || 0) +
        (listing.clicks?.directions || 0)}
    </strong>
  </div>
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

                        {!isIOSBuild &&
  listing.isFeatured &&
  listing.stripeCustomerId && (
    <button
      type="button"
      onClick={() =>
        manageSubscription(listing.stripeCustomerId)
      }
    >
      Manage Subscription
    </button>
  )}
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            )}

            {ownerWorkspaces.transportation && (
  <TransportationWorkspaceSummary
    transportationRequests={
      transportationRequests
    }
    loadingRequests={loadingRequests}
    formatDate={formatDate}
  />
)}

{ownerWorkspaces.travel && (
  <TravelWorkspaceSummary
    travelRequests={travelRequests}
    loadingTravelRequests={
      loadingTravelRequests
    }
    formatDate={formatDate}
  />
)}
          </>
        )}
      </div>

      <section className="owner-account-settings">
  <div className="owner-account-settings-header">
    <p className="owner-account-settings-label">
      Account Settings
    </p>

    <h2>Manage Your Account</h2>

    <p>
      Manage your HubEthio owner account and personal
      account information.
    </p>
  </div>

  <div className="owner-delete-account-card">
    <div>
      <h3>Delete Account</h3>

      <p>
        Permanently delete your HubEthio owner account.
        Your public business listings will remain on
        HubEthio but will no longer be connected to your
        owner account.
      </p>
    </div>

    {!showDeleteAccount && (
      <button
        type="button"
        className="owner-delete-account-btn"
        onClick={() => {
          setDeleteAccountError("");
          setShowDeleteAccount(true);
        }}
      >
        Delete Account
      </button>
    )}

    {showDeleteAccount && (
      <div className="owner-delete-confirmation">
        <h4>
          Permanently delete your account?
        </h4>

        <p>
          This action cannot be undone. Your HubEthio
          owner account and login information will be
          permanently deleted.
        </p>

        {deleteAccountError && (
          <div className="owner-delete-account-error">
            {deleteAccountError}
          </div>
        )}

        <div className="owner-delete-confirmation-actions">
          <button
            type="button"
            className="owner-delete-cancel-btn"
            disabled={deletingAccount}
            onClick={() => {
              setShowDeleteAccount(false);
              setDeleteAccountError("");
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            className="owner-delete-confirm-btn"
            disabled={deletingAccount}
            onClick={deleteAccount}
          >
            {deletingAccount
              ? "Deleting Account..."
              : "Yes, Delete My Account"}
          </button>
        </div>
      </div>
    )}
  </div>
</section>
    </main>
  );
}