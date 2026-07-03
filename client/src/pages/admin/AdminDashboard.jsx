import React from "react";
import { apiGet, apiPatch, apiDelete } from "../../api/http.js";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const token = localStorage.getItem("adminToken");

  const [status, setStatus] = React.useState("pending");
  const [items, setItems] = React.useState([]);
  const [claims, setClaims] = React.useState([]);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [claimsLoading, setClaimsLoading] = React.useState(false);
  const [adminSearch, setAdminSearch] = React.useState("");
  const [businessRequests, setBusinessRequests] = React.useState([]);
  const [pendingReviews, setPendingReviews] = React.useState([]);
const [reviewsLoading, setReviewsLoading] = React.useState(false);
const [editingListing, setEditingListing] = React.useState(null);


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

  async function loadClaims() {
    try {
      setClaimsLoading(true);
      const data = await apiGet("/api/claims/admin", token);
      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setClaimsLoading(false);
    }
  }

  async function loadBusinessRequests() {
  try {
    const data = await apiGet("/api/business-requests/admin", token);

    setBusinessRequests(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Failed to load business requests:", err);
  }
}

async function loadPendingReviews() {
  try {
    setReviewsLoading(true);
    const data = await apiGet("/api/reviews/admin/pending", token);
    setPendingReviews(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("Failed to load pending reviews:", err);
  } finally {
    setReviewsLoading(false);
  }
}

async function approveReview(id) {
  try {
    setMessage("");
    setError("");

    await apiPatch(`/api/reviews/admin/${id}/approve`, {}, token);

    setMessage("✅ Review approved successfully");
    await loadPendingReviews();
  } catch (err) {
    setError(err.message || "Failed to approve review");
  }
}

async function deleteReview(id) {
  const confirmed = window.confirm("Delete this review?");
  if (!confirmed) return;

  try {
    setMessage("");
    setError("");

    await apiDelete(`/api/reviews/admin/${id}`, token);

    setMessage("✅ Review deleted successfully");
    await loadPendingReviews();
  } catch (err) {
    setError(err.message || "Failed to delete review");
  }
}

  React.useEffect(() => {
    if (!token) {
      window.location.href = "/admin/login";
      return;
    }

    load(status);
    loadClaims();
    loadBusinessRequests();
loadPendingReviews();
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

  async function updateClaim(id, claimStatus) {
    try {
      setMessage("");
      setError("");

      await apiPatch(`/api/claims/admin/${id}`, { status: claimStatus }, token);

      setMessage(`✅ Claim ${claimStatus} successfully`);
      await loadClaims();
    } catch (err) {
      setError(err.message || "Failed to update claim");
    }
  }

  async function updateBusinessRequest(id, status) {
  try {
    await apiPatch(
      `/api/business-requests/admin/${id}`,
      { status },
      token
    );

    setMessage(`✅ Business request marked as ${status}`);

    await loadBusinessRequests();
  } catch (err) {
    setError(err.message || "Failed to update business request");
  }
}

async function deleteBusinessRequest(id, businessName) {
  const confirmed = window.confirm(
    `Are you sure you want to permanently delete "${
      businessName || "this business request"
    }"? This cannot be undone.`
  );

  if (!confirmed) return;

  try {
    setMessage("");
    setError("");

    await apiDelete(`/api/business-requests/admin/${id}`, token);

    setMessage("✅ Business request deleted successfully");
    await loadBusinessRequests();
  } catch (err) {
    setError(err.message || "Failed to delete business request");
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

  function logout() {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  }

  const uploadToCloudinary = async (file) => {
  console.log("Cloud name:", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
  console.log("Upload preset:", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  console.log("Selected file:", file);

  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  console.log("Cloudinary response:", data);

  if (!res.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
};

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
  const pendingClaimsCount = claims.filter((claim) => claim.status === "pending").length;

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
            <button type="button" onClick={() => { load(); loadClaims(); }}>
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

          <div>
            <strong>{pendingClaimsCount}</strong>
            <span>Pending Claims</span>
          </div>
        </section>

        {message && <div className="admin-dashboard-success">{message}</div>}
        {error && <div className="admin-dashboard-error">Error: {error}</div>}

        {editingListing && (
  <section className="admin-edit-panel">
    <h2>Edit Listing</h2>

    <input
      value={editingListing.title || ""}
      onChange={(e) =>
        setEditingListing({ ...editingListing, title: e.target.value })
      }
      placeholder="Business name"
    />

    <input
      value={editingListing.phone || ""}
      onChange={(e) =>
        setEditingListing({ ...editingListing, phone: e.target.value })
      }
      placeholder="Phone"
    />

    <label>Logo</label>

{editingListing.logoUrl && (
  <img
    src={editingListing.logoUrl}
    alt="Logo"
    style={{
      width: "80px",
      height: "80px",
      objectFit: "cover",
      borderRadius: "8px",
      marginBottom: "8px",
    }}
  />
)}

<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
  try {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage("Uploading logo...");
    setError("");

    const url = await uploadToCloudinary(file);

    console.log("Logo uploaded URL:", url);

    setEditingListing((prev) => ({
      ...prev,
      logoUrl: url,
    }));

    setMessage("✅ Logo uploaded. Now click Save Changes.");
  } catch (err) {
    console.error("Logo upload failed:", err);
    setError(err.message || "Logo upload failed");
  }
}}
/>

<label>Banner Image</label>

{editingListing.imageUrl && (
  <img
    src={editingListing.imageUrl}
    alt="Banner"
    className="admin-edit-preview-banner"
  />
)}

<input
  type="file"
  accept="image/*"
  onChange={async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setMessage("Uploading banner...");
      setError("");

      const url = await uploadToCloudinary(file);

      console.log("Banner uploaded URL:", url);

      setEditingListing((prev) => ({
        ...prev,
        imageUrl: url,
      }));

      setMessage("✅ Banner uploaded. Now click Save Changes.");
    } catch (err) {
      console.error("Banner upload failed:", err);
      setError(err.message || "Banner upload failed");
    }
  }}
/>

    <textarea
      value={editingListing.description_en || ""}
      onChange={(e) =>
        setEditingListing({
          ...editingListing,
          description_en: e.target.value,
        })
      }
      placeholder="Description"
      rows="4"
    />

    <div className="admin-edit-actions">
      <button
        type="button"
        className="admin-btn-approve"
        onClick={async () => {
          console.log("Saving listing payload:", {
  logoUrl: editingListing.logoUrl,
  imageUrl: editingListing.imageUrl,
});
          await updateListing(editingListing._id, {
            title: editingListing.title,
            phone: editingListing.phone,
            website: editingListing.website,
            logoUrl: editingListing.logoUrl,
            imageUrl: editingListing.imageUrl,
            description_en: editingListing.description_en,
          });

          setEditingListing(null);
        }}
      >
        Save Changes
      </button>

      <button
        type="button"
        className="admin-btn-neutral"
        onClick={() => setEditingListing(null)}
      >
        Cancel
      </button>
    </div>
  </section>
)}

        <section className="admin-claims-section">
  <div className="admin-dashboard-section-header">
    <div>
      <h2>Pending Reviews</h2>
      <p>Approve or delete customer reviews before they appear publicly.</p>
    </div>
  </div>

  {reviewsLoading && <p>Loading pending reviews...</p>}

  {!reviewsLoading && pendingReviews.length === 0 && (
    <div className="admin-dashboard-state">
      <h2>No pending reviews</h2>
      <p>All submitted reviews have been handled.</p>
    </div>
  )}

  {!reviewsLoading && pendingReviews.length > 0 && (
    <section className="admin-claims-grid">
      {pendingReviews.map((review) => (
        <article key={review._id} className="admin-claim-card">
          <h3>{review.listingId?.title || "Unknown Business"}</h3>

          <p>
            <strong>Reviewer:</strong> {review.name}
          </p>

          <p>
            <strong>Rating:</strong> {"⭐".repeat(review.rating)} ({review.rating}/5)
          </p>

          <p>
            <strong>Comment:</strong> {review.comment}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {[review.listingId?.city, review.listingId?.state]
              .filter(Boolean)
              .join(", ") || "N/A"}
          </p>

          <div className="admin-listing-actions">
            <button
              type="button"
              className="admin-btn-approve"
              onClick={() => approveReview(review._id)}
            >
              Approve Review
            </button>

            <button
              type="button"
              className="admin-btn-delete"
              onClick={() => deleteReview(review._id)}
            >
              Delete Review
            </button>
          </div>
        </article>
      ))}
    </section>
  )}
</section>

        <section className="admin-claims-section">
          <div className="admin-dashboard-section-header">
            <div>
              <h2>Business Claim Requests</h2>
              <p>Review ownership requests submitted by business owners.</p>
            </div>
          </div>

          {claimsLoading && <p>Loading claim requests...</p>}

          {!claimsLoading && claims.length === 0 && (
            <div className="admin-dashboard-state">
              <h2>No claim requests</h2>
              <p>No business owners have submitted claim requests yet.</p>
            </div>
          )}

          <section className="admin-claims-section">
  <div className="admin-dashboard-section-header">
    <div>
      <h2>Business Requests</h2>
      <p>Businesses suggested by the community.</p>
    </div>
  </div>

  {businessRequests.length === 0 ? (
    <div className="admin-dashboard-state">
      <h2>No business requests yet</h2>
    </div>
  ) : (
    <section className="admin-claims-grid">
      {businessRequests.map((request) => (
        <article key={request._id} className="admin-claim-card">
          <h3>{request.businessName}</h3>

          <p>
            <strong>Status:</strong> {request.status}
          </p>

          <p>
            <strong>Category:</strong> {request.category || "N/A"}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {[request.city, request.state]
              .filter(Boolean)
              .join(", ") || "N/A"}
          </p>

          <p>
            <strong>Phone:</strong> {request.phone || "N/A"}
          </p>

          <p>
            <strong>Website:</strong> {request.website || "N/A"}
          </p>

          <p>
            <strong>Suggested By:</strong>{" "}
            {request.suggestedByName || "Anonymous"}
          </p>

          <p>
            <strong>Contact:</strong>{" "}
            {request.suggestedByContact || "N/A"}
          </p>

          <p>
            <strong>Message:</strong> {request.message || "N/A"}
          </p>

          <div className="admin-listing-actions">
            {request.status !== "added" && (
              <button
                type="button"
                className="admin-btn-approve"
                onClick={() =>
                  updateBusinessRequest(request._id, "added")
                }
              >
                Mark Added
              </button>
            )}

            {request.status !== "rejected" && (
              <button
                type="button"
                className="admin-btn-reject"
                onClick={() =>
                  updateBusinessRequest(request._id, "rejected")
                }
              >
                Reject
              </button>
            )}

            <button
              type="button"
              className="admin-btn-delete"
              onClick={() => deleteBusinessRequest(request._id)}
            >
              Delete
            </button>

            {request.status !== "pending" && (
              <button
                type="button"
                className="admin-btn-neutral"
                onClick={() =>
                  updateBusinessRequest(request._id, "pending")
                }
              >
                Move to Pending
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  )}
</section>

          {!claimsLoading && claims.length > 0 && (
            <section className="admin-claims-grid">
              {claims.map((claim) => (
                <article key={claim._id} className="admin-claim-card">
                  <h3>{claim.businessName}</h3>

                  <p>
                    <strong>Status:</strong> {claim.status}
                  </p>

                  <p>
                    <strong>Owner Name:</strong> {claim.ownerName}
                  </p>

                  <p>
                    <strong>Email:</strong> {claim.email}
                  </p>

                  <p>
                    <strong>Phone:</strong> {claim.phone || "N/A"}
                  </p>

                  <p>
                    <strong>Message:</strong> {claim.message || "N/A"}
                  </p>

                  <p>
                    <strong>Listing:</strong>{" "}
                    {claim.listingId?._id ? (
                      <a
                        href={`/listing/${claim.listingId._id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Listing
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>

                  <div className="admin-listing-actions">
                    {claim.status !== "approved" && (
                      <button
                        type="button"
                        className="admin-btn-approve"
                        onClick={() => updateClaim(claim._id, "approved")}
                      >
                        Approve Claim
                      </button>
                    )}

                    {claim.status !== "rejected" && (
                      <button
                        type="button"
                        className="admin-btn-reject"
                        onClick={() => updateClaim(claim._id, "rejected")}
                      >
                        Reject Claim
                      </button>
                    )}

                    {claim.status !== "pending" && (
                      <button
                        type="button"
                        className="admin-btn-neutral"
                        onClick={() => updateClaim(claim._id, "pending")}
                      >
                        Move to Pending
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
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

        {!loading && filteredItems.length > 0 && (
          <section className="admin-dashboard-grid">
            {filteredItems.map((item) => {
              const address = [item.address, item.city, item.state, item.zip]
                .filter(Boolean)
                .join(", ");

              const totalClicks =
                (item.clicks?.call || 0) +
                (item.clicks?.whatsapp || 0) +
                (item.clicks?.website || 0) +
                (item.clicks?.directions || 0);

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
                      <p><strong>Category:</strong> {item.categoryId?.name_en || "N/A"}</p>
                      <p><strong>Phone:</strong> {item.phone || "N/A"}</p>
                      <p><strong>WhatsApp:</strong> {item.whatsapp || "N/A"}</p>
                      <p><strong>Website:</strong> {item.website || "N/A"}</p>
                      <p><strong>Location:</strong> {address || "N/A"}</p>
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
                      <strong>Total Clicks: {totalClicks}</strong>
                      <span>📞 Calls: {item.clicks?.call || 0}</span>
                      <span>💬 WhatsApp: {item.clicks?.whatsapp || 0}</span>
                      <span>🌐 Website: {item.clicks?.website || 0}</span>
                      <span>📍 Directions: {item.clicks?.directions || 0}</span>
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
                        {item.isFeatured ? "Remove Featured" : "Make Featured ⭐"}
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
                        {item.isVerified ? "Remove Verified" : "Make Verified ✅"}
                      </button>

                      <button
  type="button"
  className="admin-btn-neutral"
  onClick={() => {
    setEditingListing(item);

    setTimeout(() => {
      document
        .querySelector(".admin-edit-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }}
>
  Edit Listing
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