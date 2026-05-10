import React from "react";
import { apiGet, apiPost } from "../api/http";

export default function Listing() {
  const id = window.location.pathname.split("/").pop();

  const [listing, setListing] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;

    (async () => {
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
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;
  if (!listing) return <div style={{ padding: 16 }}>Listing not found.</div>;

  const phone = listing.phone || "";
  const whatsapp = String(listing.whatsapp || listing.phone || "").replace(/\D/g, "");
  const address = [listing.address, listing.city, listing.state, listing.zip].filter(Boolean).join(", ");
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 16 }}>
      <a href="/">← Back Home</a>

      <div style={{ border: "1px solid #ddd", borderRadius: 14, padding: 18, marginTop: 14 }}>
        <h1>{listing.title}</h1>
        <div style={{ marginBottom: 10 }}>
  {listing.isFeatured && <span>⭐ Featured </span>}
  {listing.isVerified && <span>✅ Verified</span>}
</div>

        <p>
          <b>Category:</b> {listing.categoryId?.name_en || "N/A"}
        </p>

        <p>
          <b>Location:</b> {address || "N/A"}
        </p>

        <p>
          <b>Phone:</b> {phone || "N/A"}
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "16px 0" }}>
  
  {phone && (
    <a
      href={`tel:${phone}`}
      onClick={() => apiPost(`/api/track/${listing._id}`, { type: "call" })}
    >
      <button>Call</button>
    </a>
  )}

  {whatsapp && (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noreferrer"
      onClick={() => apiPost(`/api/track/${listing._id}`, { type: "whatsapp" })}
    >
      <button>WhatsApp</button>
    </a>
  )}

  {address && (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noreferrer"
      onClick={() => apiPost(`/api/track/${listing._id}`, { type: "directions" })}
    >
      <button>Directions</button>
    </a>
  )}

  {listing.website && (
    <a
      href={listing.website.startsWith("http") ? listing.website : `https://${listing.website}`}
      target="_blank"
      rel="noreferrer"
      onClick={() => apiPost(`/api/track/${listing._id}`, { type: "website" })}
    >
      <button>Website</button>
    </a>
  )}
</div>

        <h3>Description</h3>
        <p>{listing.description_en || "No description provided."}</p>

        {listing.description_am && (
          <>
            <h3>Amharic Description</h3>
            <p>{listing.description_am}</p>
          </>
        )}
      </div>
    </div>
  );
}