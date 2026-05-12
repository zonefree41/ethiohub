import React from "react";
import { apiGet, apiPost } from "../api/http";
import "./Listing.css";

export default function Listing() {
  const id = window.location.pathname.split("/").pop();

  const [listing, setListing] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;

    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(`/api/listings/${id}`);

        if (alive) setListing(data);
      } catch (err) {
        if (alive) setError(err.message || "Failed to load listing");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadListing();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div className="listing-page">Loading...</div>;
  if (error) return <div className="listing-page">Error: {error}</div>;
  if (!listing) return <div className="listing-page">Listing not found.</div>;

  const phone = listing.phone || "";
  const whatsapp = String(listing.whatsapp || listing.phone || "").replace(/\D/g, "");

  const address = [listing.address, listing.city, listing.state, listing.zip]
    .filter(Boolean)
    .join(", ");

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  const websiteUrl = listing.website?.startsWith("http")
    ? listing.website
    : `https://${listing.website}`;

  return (
    <main className="listing-page">
      <div className="listing-container">
        <a href="/" className="listing-back">
          ← Back Home
        </a>

        <section className="listing-card">
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="listing-banner"
            />
          ) : (
            <div className="listing-banner-placeholder">No banner image</div>
          )}

          <div className="listing-content">
            <div className="listing-header">
              {listing.logoUrl ? (
                <img
                  src={listing.logoUrl}
                  alt={`${listing.title} logo`}
                  className="listing-logo"
                />
              ) : (
                <div className="listing-logo-placeholder">
                  {listing.title?.charAt(0)?.toUpperCase() || "B"}
                </div>
              )}

              <div className="listing-title-wrap">
                <h1>{listing.title}</h1>

                <div className="listing-badges">
                  {listing.isFeatured && <span>⭐ Featured</span>}
                  {listing.isVerified && <span>✅ Verified</span>}
                </div>
              </div>
            </div>

            <div className="listing-info">
              <p>
                <b>Category:</b> {listing.categoryId?.name_en || "N/A"}
              </p>

              <p>
                <b>Location:</b> {address || "N/A"}
              </p>

              <p>
                <b>Phone:</b> {phone || "N/A"}
              </p>
            </div>

            <div className="listing-actions">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  onClick={() =>
                    apiPost(`/api/track/${listing._id}`, { type: "call" })
                  }
                >
                  Call
                </a>
              )}

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    apiPost(`/api/track/${listing._id}`, { type: "whatsapp" })
                  }
                >
                  WhatsApp
                </a>
              )}

              {address && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    apiPost(`/api/track/${listing._id}`, { type: "directions" })
                  }
                >
                  Directions
                </a>
              )}

              {listing.website && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    apiPost(`/api/track/${listing._id}`, { type: "website" })
                  }
                >
                  Website
                </a>
              )}
            </div>

            <div className="listing-description">
  <h3>Description</h3>

  <p>
    {listing.description_en || "No description provided."}
  </p>

  {listing.description_am && (
    <>
      <h3>Amharic Description</h3>

      <p>{listing.description_am}</p>
    </>
  )}

  {address && (
    <div className="listing-map-section">
      <h3>Location Map</h3>

      <iframe
        title="Google Map"
        src={`https://www.google.com/maps?q=${encodeURIComponent(
          address
        )}&output=embed`}
        className="listing-map"
        loading="lazy"
        allowFullScreen
      />
    </div>
  )}
</div>
          </div>
        </section>
      </div>
    </main>
  );
}