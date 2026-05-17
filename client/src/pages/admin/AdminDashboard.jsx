import React from "react";
import { apiGet, apiPatch, apiPost, apiDelete } from "../../api/http.js";

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

  async function payFeatured(id) {
    try {
      setError("");

      const res = await apiPost("/api/payments/create-checkout-session", {
        listingId: id,
      });

      window.location.assign(res.url);
    } catch (err) {
      setError(err.message || "Payment failed");
    }
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

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <a href="/" style={styles.backLink}>
            ← Home
          </a>

          <div style={{ flex: 1 }}>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <p style={styles.subtitle}>
              Review, approve, reject, verify, and feature submitted businesses.
            </p>
          </div>

          <button type="button" onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </header>

        <section style={styles.tabs}>
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setMessage("");
                setAdminSearch("");
                setStatus(s);
              }}
              style={{
                ...styles.tabBtn,
                ...(status === s ? styles.activeTab : {}),
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </section>

        <section style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>{status.toUpperCase()} Listings</h2>

          <button type="button" onClick={() => load()} style={styles.refreshBtn}>
            Refresh
          </button>
        </section>

        {message && <div style={styles.success}>{message}</div>}

        {error && <div style={styles.error}>Error: {error}</div>}

        {loading && <p style={styles.empty}>Loading listings...</p>}

        {!loading && items.length === 0 && (
          <p style={styles.empty}>No {status} listings.</p>
        )}

        {!loading && items.length > 0 && (
          <div style={styles.searchBox}>
            <input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Search listings by name, city, state, phone, or category..."
              style={styles.searchInput}
            />
          </div>
        )}

        {!loading && items.length > 0 && filteredItems.length === 0 && (
          <p style={styles.empty}>No matching listings found.</p>
        )}

        <div style={styles.grid}>
          {!loading &&
            filteredItems.map((item) => {
              const address = [item.address, item.city, item.state, item.zip]
                .filter(Boolean)
                .join(", ");

              return (
                <article key={item._id} style={styles.card}>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={styles.banner}
                    />
                  ) : (
                    <div style={styles.noBanner}>No banner image</div>
                  )}

                  <div style={styles.cardBody}>
                    <div style={styles.businessHeader}>
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={`${item.title} logo`}
                          style={styles.logo}
                        />
                      ) : (
                        <div style={styles.logoPlaceholder}>
                          {item.title?.charAt(0)?.toUpperCase() || "B"}
                        </div>
                      )}

                      <div>
                        <h3 style={styles.cardTitle}>{item.title}</h3>

                        <div style={styles.badges}>
                          <span style={styles.statusBadge}>
                            {item.status || "pending"}
                          </span>

                          {item.isFeatured && (
                            <span style={styles.featuredBadge}>
                              ⭐ Featured
                            </span>
                          )}

                          {item.isVerified && (
                            <span style={styles.verifiedBadge}>
                              ✅ Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={styles.details}>
                      <p>
                        <b>Category:</b> {item.categoryId?.name_en || "N/A"}
                      </p>
                      <p>
                        <b>Phone:</b> {item.phone || "N/A"}
                      </p>
                      <p>
                        <b>WhatsApp:</b> {item.whatsapp || "N/A"}
                      </p>
                      <p>
                        <b>Website:</b> {item.website || "N/A"}
                      </p>
                      <p>
                        <b>Location:</b> {address || "N/A"}
                      </p>
                      <p>
                        <b>Description:</b>{" "}
                        {item.description_en
                          ? `${item.description_en.slice(0, 180)}${
                              item.description_en.length > 180 ? "..." : ""
                            }`
                          : "N/A"}
                      </p>
                      <p>
                        <b>Submitted by:</b>{" "}
                        {item.submittedBy?.name || "N/A"} —{" "}
                        {item.submittedBy?.contact || "N/A"}
                      </p>
                    </div>

                    <div style={styles.clicks}>
                      <b>Clicks:</b>
                      <span>📞 {item.clicks?.call || 0}</span>
                      <span>💬 {item.clicks?.whatsapp || 0}</span>
                      <span>🌐 {item.clicks?.website || 0}</span>
                      <span>📍 {item.clicks?.directions || 0}</span>
                    </div>

                    <div style={styles.actions}>
                      {item.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateListing(item._id, { status: "approved" })
                          }
                          style={styles.approveBtn}
                        >
                          Approve
                        </button>
                      )}

                      {item.status !== "rejected" && (
                        <button
                          type="button"
                          onClick={() => rejectListing(item._id)}
                          style={styles.rejectBtn}
                        >
                          Reject
                        </button>
                      )}

                      {item.status !== "pending" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateListing(item._id, { status: "pending" })
                          }
                          style={styles.neutralBtn}
                        >
                          Move to Pending
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          updateListing(item._id, {
                            isFeatured: !item.isFeatured,
                          })
                        }
                        style={styles.neutralBtn}
                      >
                        {item.isFeatured
                          ? "Remove Featured"
                          : "Make Featured ⭐"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateListing(item._id, {
                            isVerified: !item.isVerified,
                          })
                        }
                        style={styles.neutralBtn}
                      >
                        {item.isVerified
                          ? "Remove Verified"
                          : "Make Verified ✅"}
                      </button>

                      <button
                        type="button"
                        onClick={() => payFeatured(item._id)}
                        style={styles.payBtn}
                      >
                        Pay to Feature ⭐
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteListing(item._id, item.title)}
                        style={styles.deleteBtn}
                      >
                        Delete Listing
                      </button>

                      {item.status === "approved" && (
                        <a
                          href={`/listing/${item._id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.viewLink}
                        >
                          View Public Page
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 16px 60px",
  },
  container: {
    maxWidth: 1120,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 22,
  },
  backLink: {
    color: "#111827",
    textDecoration: "none",
    fontWeight: 800,
  },
  title: {
    margin: 0,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  logoutBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 800,
  },
  tabs: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  tabBtn: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 14,
    minWidth: 120,
  },
  activeTab: {
    background: "#111827",
    color: "#ffffff",
    borderColor: "#111827",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
  },
  refreshBtn: {
    padding: "9px 13px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 800,
  },
  searchBox: {
    marginBottom: 16,
  },
  searchInput: {
    width: "100%",
    minHeight: 48,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "12px 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
  },
  success: {
    border: "1px solid #22c55e",
    background: "#f0fdf4",
    color: "#166534",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  error: {
    border: "1px solid #ef4444",
    background: "#fef2f2",
    color: "#991b1b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  empty: {
    background: "#ffffff",
    borderRadius: 14,
    padding: 16,
    color: "#6b7280",
    border: "1px solid #e5e7eb",
  },
  grid: {
    display: "grid",
    gap: 18,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
  },
  banner: {
    width: "100%",
    height: 210,
    objectFit: "cover",
    display: "block",
  },
  noBanner: {
    height: 210,
    display: "grid",
    placeItems: "center",
    background: "#e5e7eb",
    color: "#6b7280",
  },
  cardBody: {
    padding: 18,
  },
  businessHeader: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: "cover",
    borderRadius: "50%",
    border: "3px solid white",
    boxShadow: "0 8px 18px rgba(15,23,42,0.16)",
    background: "#ffffff",
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 900,
    fontSize: 28,
    border: "3px solid white",
    boxShadow: "0 8px 18px rgba(15,23,42,0.16)",
  },
  cardTitle: {
    margin: "0 0 8px",
    color: "#111827",
    fontSize: 22,
  },
  badges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  statusBadge: {
    background: "#e5e7eb",
    color: "#374151",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
  },
  featuredBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  verifiedBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  details: {
    color: "#374151",
    lineHeight: 1.5,
  },
  clicks: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    padding: 12,
    background: "#f9fafb",
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  actions: {
    display: "flex",
    gap: 9,
    flexWrap: "wrap",
  },
  approveBtn: {
    padding: "10px 13px",
    borderRadius: 10,
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  rejectBtn: {
    padding: "10px 13px",
    borderRadius: 10,
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    fontWeight: 900,
    cursor: "pointer",
  },
  neutralBtn: {
    padding: "10px 13px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
  },
  payBtn: {
    padding: "10px 13px",
    borderRadius: 10,
    border: "none",
    background: "#f59e0b",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "10px 13px",
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: 900,
    cursor: "pointer",
  },
  viewLink: {
    padding: "10px 13px",
    borderRadius: 10,
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 900,
  },
};