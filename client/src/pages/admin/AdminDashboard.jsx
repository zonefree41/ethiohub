import React from "react";
import { apiGet, apiPatch, apiPost, apiDelete } from "../../api/http.js";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const token = localStorage.getItem("adminToken");

  const [status, setStatus] = React.useState("pending");
  const [items, setItems] = React.useState([]);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [adminSearch, setAdminSearch] = React.useState("");

  React.useEffect(() => {
    document.title = "Admin Dashboard | HubEthio";
  }, []);

  async function load(nextStatus = status) {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(
        `/api/admin/submissions?status=${nextStatus}`,
        token
      );

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    load(status);
  }, [status]);

  async function updateListing(id, patch) {
    try {
      setMessage("");
      setError("");

      await apiPatch(`/api/admin/listings/${id}`, patch, token);

      setMessage("✅ Listing updated successfully");
      await load();
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  async function rejectListing(id) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this listing?"
    );

    if (!confirmed) return;

    await updateListing(id, { status: "rejected" });
  }

  async function deleteListing(id, title) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${
        title || "this listing"
      }"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await apiDelete(`/api/admin/listings/${id}`, token);

      setMessage("✅ Listing deleted successfully");
      await load();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  }

  function payFeatured(id) {
  window.location.href = `/pricing?listingId=${id}`;
}

  function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  }

  const filteredItems = items.filter((item) => {
    const query = adminSearch.trim().toLowerCase();

    if (!query) return true;

    return (
      item.title?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query) ||
      item.state?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.categoryId?.name_en?.toLowerCase().includes(query)
    );
  });

  const approvedCount = items.filter((item) => item.status === "approved").length;
  const featuredCount = items.filter((item) => item.isFeatured).length;
  const verifiedCount = items.filter((item) => item.isVerified).length;

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <header className="admin-dashboard-hero">
          <div>
            <a href="/" className="admin-dashboard-back">
              ← Home
            </a>

            <p className="admin-dashboard-label">HubEthio Admin</p>
            <h1>Admin Dashboard</h1>
            <p>
              Review, approve, reject, verify, feature, and manage submitted
              businesses.
            </p>
          </div>

          <div className="admin-dashboard-actions-top">
            <button type="button" onClick={() => load()}>
              Refresh
            </button>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <section className="admin-dashboard-summary">
          <div>
            <strong>{items.length}</strong>
            <span>{status} listings</span>
          </div>

          <div>
            <strong>{approvedCount}</strong>
            <span>Approved</span>
          </div>

          <div>
            <strong>{featuredCount}</strong>
            <span>Featured</span>
          </div>

          <div>
            <strong>{verifiedCount}</strong>
            <span>Verified</span>
          </div>
        </section>

        <section className="admin-dashboard-tabs">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setMessage("");
                setAdminSearch("");
                setStatus(s);
              }}
              className={status === s ? "active" : ""}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </section>

        <section className="admin-dashboard-section-header">
          <div>
            <h2>{status.toUpperCase()} Listings</h2>
            <p>Manage all listings currently marked as {status}.</p>
          </div>
        </section>

        {message && <div className="admin-dashboard-success">{message}</div>}

        {error && <div className="admin-dashboard-error">Error: {error}</div>}

        {loading && (
          <div className="admin-dashboard-state">
            <div className="admin-dashboard-spinner"></div>
            <h2>Loading listings...</h2>
            <p>Please wait while listings are loaded.</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="admin-dashboard-state">
            <h2>No {status} listings</h2>
            <p>There are no listings in this status right now.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <section className="admin-dashboard-search">
            <input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Search listings by name, city, state, phone, or category..."
            />
          </section>
        )}

        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <div className="admin-dashboard-state">
            <h2>No matching listings found</h2>
            <p>Try a different search term.</p>
          </div>
        )}

        {!loading && filteredItems.length > 0 && (
          <section className="admin-dashboard-grid">
            {filteredItems.map((item) => {
              const address = [item.address, item.city, item.state, item.zip]
                .filter(Boolean)
                .join(", ");

              return (
                <article key={item._id} className="admin-listing-card">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="admin-listing-banner"
                    />
                  ) : (
                    <div className="admin-listing-no-banner">
                      No banner image
                    </div>
                  )}

                  <div className="admin-listing-body">
                    <div className="admin-listing-top">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={`${item.title} logo`}
                          className="admin-listing-logo"
                        />
                      ) : (
                        <div className="admin-listing-logo-placeholder">
                          {item.title?.charAt(0)?.toUpperCase() || "B"}
                        </div>
                      )}

                      <div>
                        <h3>{item.title}</h3>

                        <div className="admin-listing-badges">
                          <span>{item.status || "pending"}</span>

                          {item.isFeatured && <span>⭐ Featured</span>}

                          {item.isVerified && <span>✅ Verified</span>}
                        </div>
                      </div>
                    </div>

                    <div className="admin-listing-details">
                      <p>
                        <strong>Category:</strong>{" "}
                        {item.categoryId?.name_en || "N/A"}
                      </p>
                      <p>
                        <strong>Phone:</strong> {item.phone || "N/A"}
                      </p>
                      <p>
                        <strong>WhatsApp:</strong> {item.whatsapp || "N/A"}
                      </p>
                      <p>
                        <strong>Website:</strong> {item.website || "N/A"}
                      </p>
                      <p>
                        <strong>Location:</strong> {address || "N/A"}
                      </p>
                      <p>
                        <strong>Description:</strong>{" "}
                        {item.description_en
                          ? `${item.description_en.slice(0, 180)}${
                              item.description_en.length > 180 ? "..." : ""
                            }`
                          : "N/A"}
                      </p>
                      <p>
                        <strong>Submitted by:</strong>{" "}
                        {item.submittedBy?.name || "N/A"} —{" "}
                        {item.submittedBy?.contact || "N/A"}
                      </p>
                    </div>

                    <div className="admin-listing-clicks">
                      <strong>Clicks:</strong>
                      <span>📞 {item.clicks?.call || 0}</span>
                      <span>💬 {item.clicks?.whatsapp || 0}</span>
                      <span>🌐 {item.clicks?.website || 0}</span>
                      <span>📍 {item.clicks?.directions || 0}</span>
                    </div>

                    <div className="admin-listing-actions">
                      {item.status !== "approved" && (
                        <button
                          type="button"
                          className="admin-btn-approve"
                          onClick={() =>
                            updateListing(item._id, { status: "approved" })
                          }
                        >
                          Approve
                        </button>
                      )}

                      {item.status !== "rejected" && (
                        <button
                          type="button"
                          className="admin-btn-reject"
                          onClick={() => rejectListing(item._id)}
                        >
                          Reject
                        </button>
                      )}

                      {item.status !== "pending" && (
                        <button
                          type="button"
                          className="admin-btn-neutral"
                          onClick={() =>
                            updateListing(item._id, { status: "pending" })
                          }
                        >
                          Move to Pending
                        </button>
                      )}

                      <button
                        type="button"
                        className="admin-btn-neutral"
                        onClick={() =>
                          updateListing(item._id, {
                            isFeatured: !item.isFeatured,
                          })
                        }
                      >
                        {item.isFeatured
                          ? "Remove Featured"
                          : "Make Featured ⭐"}
                      </button>

                      <button
                        type="button"
                        className="admin-btn-neutral"
                        onClick={() =>
                          updateListing(item._id, {
                            isVerified: !item.isVerified,
                          })
                        }
                      >
                        {item.isVerified
                          ? "Remove Verified"
                          : "Make Verified ✅"}
                      </button>

                      <button
                        type="button"
                        className="admin-btn-delete"
                        onClick={() => deleteListing(item._id, item.title)}
                      >
                        Delete Listing
                      </button>

                      {item.status === "approved" && (
                        <a
                          href={`/listing/${item._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn-view"
                        >
                          View Public Page
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}