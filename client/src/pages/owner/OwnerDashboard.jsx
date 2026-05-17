import React from "react";
import { apiGet, apiPatch } from "../../api/http.js";

export default function OwnerDashboard() {
  const token = localStorage.getItem("ownerToken");

  const [listings, setListings] = React.useState([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  async function loadListings() {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet(
        "/api/owner/listings/my-listings",
        token
      );

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
      await apiPatch(
        `/api/owner/listings/claim/${id}`,
        {},
        token
      );

      await loadListings();
      alert("Listing claimed successfully");
    } catch (err) {
      alert(err.message || "Failed to claim listing");
    }
  }

  function logout() {
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("ownerUser");

    window.location.href = "/";
  }

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Business Owner Dashboard</h1>
          <p>Manage your HubEthio business listings.</p>
        </div>

        <button onClick={logout}>
          Logout
        </button>
      </div>

      {error && (
        <div
          style={{
            border: "1px solid red",
            padding: 12,
            marginBottom: 16,
          }}
        >
          Error: {error}
        </div>
      )}

      {loading && <p>Loading listings...</p>}

      {!loading && listings.length === 0 && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <p>You do not own any listings yet.</p>

          <p>
            You can submit a listing first, then later
            claim ownership.
          </p>

          <a href="/submit">
            Submit Business Listing
          </a>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        {listings.map((listing) => (
          <div
            key={listing._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 16,
              overflow: "hidden",
              background: "white",
            }}
          >
            {listing.imageUrl && (
              <img
                src={listing.imageUrl}
                alt={listing.title}
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                }}
              />
            )}

            <div style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {listing.logoUrl ? (
                  <img
                    src={listing.logoUrl}
                    alt={listing.title}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      background: "#eee",
                    }}
                  />
                )}

                <div>
                  <h2 style={{ margin: 0 }}>
                    {listing.title}
                  </h2>

                  <p style={{ margin: "6px 0" }}>
                    {listing.city}, {listing.state}
                  </p>

                  <div>
                    Status:{" "}
                    <strong>
                      {listing.status}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                {listing.status === "approved" ? (
  <a href={`/listing/${listing._id}`}>
    View Public Listing
  </a>
) : (
  <span style={{ color: "#666" }}>
    Public page available after admin approval
  </span>
)}

                <a href={`/owner/listings/edit/${listing._id}`}>
  Edit Listing
</a>

{listing.status === "approved" && !listing.isFeatured && (
  <a href={`/pricing?listingId=${listing._id}`}>
    Upgrade to Featured
  </a>
)}

{listing.isFeatured && (
  <span style={{ color: "green", fontWeight: 700 }}>
    ⭐ Featured Active
  </span>
)}

                <button
                  onClick={() => claimListing(listing._id)}
                >
                  Claim Listing
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}