import React from "react";
import { Helmet } from "react-helmet-async";
import { apiGet, apiPost } from "../api/http";
import { trackEvent } from "../utils/analytics.js";
import "./Listing.css";

console.log("Listing component loaded");

export default function Listing() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const id = pathParts[1];
  const isValidListingId = /^[a-f\d]{24}$/i.test(id);

  const [listing, setListing] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [reviews, setReviews] = React.useState([]);
  const [averageRating, setAverageRating] = React.useState(0);
  const [totalReviews, setTotalReviews] = React.useState(0);
  const [reviewMessage, setReviewMessage] = React.useState("");
  const [reviewError, setReviewError] = React.useState("");

  const [isSaved, setIsSaved] = React.useState(false);
  const [nearbyListings, setNearbyListings] = React.useState([]);
  const [relatedListings, setRelatedListings] = React.useState([]);

  const [reviewForm, setReviewForm] = React.useState({
    name: "",
    rating: "5",
    comment: "",
  });

  const [claimForm, setClaimForm] = React.useState({
    ownerName: "",
    email: "",
    phone: "",
    message: "",
  });

  const [claimMessage, setClaimMessage] = React.useState("");
  const [claimError, setClaimError] = React.useState("");

  React.useEffect(() => {
    if (!isValidListingId) {
      setError("Invalid listing page.");
      setLoading(false);
      return;
    }

    let alive = true;

    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(`/api/listings/${id}`);

        if (alive) setListing(data || null);
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
  }, [id, isValidListingId]);

  async function loadReviews() {
    try {
      const data = await apiGet(`/api/reviews/${id}`);
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setTotalReviews(data.totalReviews || 0);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  }

  React.useEffect(() => {
    if (!isValidListingId) return;
    loadReviews();
  }, [id, isValidListingId]);

  React.useEffect(() => {
    if (!isValidListingId) return;

    async function loadNearbyListings() {
      try {
        const data = await apiGet(`/api/listings/${id}/nearby`);
        setNearbyListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load nearby listings:", err);
        setNearbyListings([]);
      }
    }

    loadNearbyListings();
  }, [id, isValidListingId]);

  React.useEffect(() => {
    if (!isValidListingId) return;

    async function loadRelatedListings() {
      try {
        const data = await apiGet(`/api/listings/${id}/related`);

        const relatedArray = Array.isArray(data)
          ? data
          : data?.relatedListings ||
            data?.related ||
            data?.listings ||
            data?.data ||
            [];

        setRelatedListings(relatedArray);
      } catch (err) {
        console.error("Failed to load related listings:", err);
        setRelatedListings([]);
      }
    }

    loadRelatedListings();
  }, [id, isValidListingId]);

  React.useEffect(() => {
    if (!listing?._id) return;

    const viewed = JSON.parse(
      localStorage.getItem("hubethioRecentlyViewed") || "[]"
    );

    const filtered = viewed.filter((itemId) => itemId !== listing._id);
    const updated = [listing._id, ...filtered].slice(0, 12);

    localStorage.setItem("hubethioRecentlyViewed", JSON.stringify(updated));
  }, [listing]);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hubethioFavorites") || "[]");
      setIsSaved(saved.includes(id));
    } catch {
      setIsSaved(false);
    }
  }, [id]);

  function updateReviewForm(e) {
    setReviewForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function toggleFavorite() {
    try {
      const saved = JSON.parse(localStorage.getItem("hubethioFavorites") || "[]");

      let updated;

      if (saved.includes(id)) {
        updated = saved.filter((itemId) => itemId !== id);
        setIsSaved(false);
      } else {
        updated = [...saved, id];
        setIsSaved(true);
      }

      localStorage.setItem("hubethioFavorites", JSON.stringify(updated));
    } catch {
      localStorage.setItem("hubethioFavorites", JSON.stringify([id]));
      setIsSaved(true);
    }
  }

  async function shareBusiness() {
    if (!listing) return;

    const shareUrl = window.location.href;
    const shareText = `Check out ${listing.title} on HubEthio`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Business link copied!");
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  }

  async function submitReview(e) {
    e.preventDefault();

    setReviewMessage("");
    setReviewError("");

    try {
      await apiPost("/api/reviews", {
        listingId: id,
        name: reviewForm.name,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });

      setReviewMessage("✅ Review submitted successfully.");
      setReviewForm({
        name: "",
        rating: "5",
        comment: "",
      });

      await loadReviews();
    } catch (err) {
      setReviewError(err.message || "Failed to submit review");
    }
  }

  async function submitClaim(e) {
    e.preventDefault();

    if (!listing?._id) return;

    setClaimMessage("");
    setClaimError("");

    try {
      await apiPost("/api/claims", {
        listingId: listing._id,
        businessName: listing.title,
        ownerName: claimForm.ownerName,
        email: claimForm.email,
        phone: claimForm.phone,
        message: claimForm.message,
      });

      setClaimMessage("✅ Claim request submitted successfully.");

      setClaimForm({
        ownerName: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      setClaimError(err.message || "Failed to submit claim request.");
    }
  }

  function trackListingAction(type, eventName) {
    if (!listing?._id) return;

    apiPost(`/api/track/${listing._id}`, { type }).catch((err) =>
      console.error("Tracking failed:", err)
    );

    trackEvent(eventName, {
      listing_id: listing._id,
      listing_title: listing.title,
      category: listing.categoryId?.name_en || "Business",
      city: listing.city || "",
      state: listing.state || "",
    });
  }

  function renderBusinessCard(item) {
    return (
      <a key={item._id} href={`/listing/${item._id}`} className="listing-nearby-card">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title || "Business"} />
        ) : (
          <div className="listing-nearby-placeholder">
            {item.title?.charAt(0)?.toUpperCase() || "B"}
          </div>
        )}

        <div className="listing-nearby-content">
          <h3>{item.title}</h3>

          <div className="listing-mini-badges">
            {(item.paymentStatus === "active" || item.paymentStatus === "trial") &&
              item.isFeatured && (
                <span className="mini-featured-badge">⭐ Featured</span>
              )}

            {(item.paymentStatus === "active" || item.paymentStatus === "trial") &&
              item.isVerified && (
                <span className="mini-verified-badge">✅ Verified</span>
              )}
          </div>

          <p>{item.categoryId?.name_en || "Business"}</p>

          <p>
            {item.city}, {item.state}
          </p>
        </div>
      </a>
    );
  }

  if (loading) {
    return (
      <main className="listing-page">
        <section className="listing-card listing-skeleton-card">
          <div className="skeleton skeleton-banner"></div>

          <div className="listing-content">
            <div className="listing-header">
              <div className="skeleton skeleton-logo"></div>

              <div className="listing-title-wrap">
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-badges"></div>
              </div>
            </div>

            <div className="listing-info">
              <div className="skeleton skeleton-line"></div>
              <div className="skeleton skeleton-line"></div>
              <div className="skeleton skeleton-line short"></div>
            </div>

            <div className="listing-actions">
              <div className="skeleton skeleton-button"></div>
              <div className="skeleton skeleton-button"></div>
              <div className="skeleton skeleton-button"></div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="listing-page">
        <div className="listing-state-card">
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="listing-page">
        <div className="listing-state-card">
          <h2>Business not found</h2>
          <p>This listing may have been removed or is no longer available.</p>
          <a href="/">Back to Home</a>
        </div>
      </main>
    );
  }

  const phone = listing.phone || "";
  const whatsapp = String(listing.whatsapp || listing.phone || "").replace(/\D/g, "");

  const address = [listing.address, listing.city, listing.state, listing.zip]
    .filter(Boolean)
    .join(", ");

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

  const websiteUrl = listing.website
    ? listing.website.startsWith("http")
      ? listing.website
      : `https://${listing.website}`
    : "";

  const categoryName = listing.categoryId?.name_en || "Business";

  const seoTitle = `${listing.title} | Ethiopian ${categoryName} in ${listing.city}, ${listing.state}`;

  const seoDescription = listing.description_en
    ? listing.description_en.replace(/\s+/g, " ").slice(0, 155)
    : `Find ${listing.title} on HubEthio. Trusted Ethiopian business in ${listing.city}, ${listing.state}.`;

  const canonicalUrl = `https://www.hubethio.com/listing/${listing._id}`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.title,
    description: seoDescription,
    url: canonicalUrl,
    telephone: phone || undefined,
    image: listing.imageUrl || listing.logoUrl || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address || "",
      addressLocality: listing.city || "",
      addressRegion: listing.state || "",
      postalCode: listing.zip || "",
      addressCountry: "US",
    },
    aggregateRating:
      totalReviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: totalReviews,
          }
        : undefined,
  };

  console.log("SEO TITLE SHOULD BE:", seoTitle);
document.title = seoTitle;

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="business.business" />
        <meta property="og:site_name" content="HubEthio" />

        {listing.imageUrl && <meta property="og:image" content={listing.imageUrl} />}

        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>

      <main className="listing-page">
        <div className="listing-top-links">
          <a href="/" className="hubethio-back-btn">
  ← Back Home
</a>

          <a href="/saved" className="listing-saved-btn">
  Saved ❤️
</a>
        </div>

        <section className="listing-card">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} className="listing-banner" />
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
                  {(listing.paymentStatus === "active" ||
                    listing.paymentStatus === "trial") &&
                    listing.isFeatured && <span>⭐ Featured</span>}

                  {(listing.paymentStatus === "active" ||
                    listing.paymentStatus === "trial") &&
                    listing.isVerified && <span>✅ Verified</span>}

                  {totalReviews > 0 && (
                    <span>
                      ⭐ {averageRating} ({totalReviews} review
                      {totalReviews !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="listing-info">
              <p>
                <b>Category:</b> {categoryName}
              </p>

              {listing.businessHours && (
                <p>
                  <b>Hours:</b> {listing.businessHours}
                </p>
              )}

              <p>
                <b>Location:</b> {address || "N/A"}
              </p>

              <p>
                <b>Phone:</b> {phone || "N/A"}
              </p>
            </div>

            <div className="listing-actions">
              <button type="button" className="listing-save-btn" onClick={toggleFavorite}>
                {isSaved ? "Saved ❤️" : "Save Business 🤍"}
              </button>

              <button type="button" className="listing-share-btn" onClick={shareBusiness}>
                Share 🔗
              </button>

              {phone && (
                <a
                  href={`tel:${phone}`}
                  onClick={() => trackListingAction("call", "call_click")}
                >
                  Call
                </a>
              )}

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackListingAction("whatsapp", "whatsapp_click")}
                >
                  WhatsApp
                </a>
              )}

              {address && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackListingAction("directions", "directions_click")}
                >
                  Directions
                </a>
              )}

              {listing.website && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackListingAction("website", "website_click")}
                >
                  Website
                </a>
              )}
            </div>

            <div className="listing-nearby">
              <h2>Nearby Businesses</h2>

              {nearbyListings.length === 0 ? (
                <p className="listing-empty-state">No nearby businesses found.</p>
              ) : (
                <div className="listing-nearby-grid">
                  {nearbyListings.map(renderBusinessCard)}
                </div>
              )}
            </div>

            <div className="listing-nearby">
              <h2>Related Businesses</h2>

              {relatedListings.length === 0 ? (
                <p className="listing-empty-state">No related businesses found.</p>
              ) : (
                <div className="listing-nearby-grid">
                  {relatedListings.map(renderBusinessCard)}
                </div>
              )}
            </div>

            <div className="listing-claim-section">
              <h2>Own this business?</h2>
              <p className="listing-claim-text">
                Claim this listing to manage and update your business information on HubEthio.
              </p>

              {claimMessage && <div className="listing-review-success">{claimMessage}</div>}
              {claimError && <div className="listing-review-error">{claimError}</div>}

              <form onSubmit={submitClaim} className="listing-review-form">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={claimForm.ownerName}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, ownerName: e.target.value })
                  }
                  required
                />

                <input
                  type="email"
                  placeholder="Business Email"
                  value={claimForm.email}
                  onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                  required
                />

                <input
                  type="text"
                  placeholder="Phone Number"
                  value={claimForm.phone}
                  onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                />

                <textarea
                  rows="4"
                  placeholder="Tell us why you own this business..."
                  value={claimForm.message}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, message: e.target.value })
                  }
                />

                <button type="submit">Claim Business</button>
              </form>
            </div>

            <div className="listing-description">
              <h3>Description</h3>

              <p>{listing.description_en || "No description provided."}</p>

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

            <div className="listing-reviews">
              <h2>⭐ Reviews</h2>

              <div className="listing-review-summary">
                <strong>{averageRating}</strong> / 5
                <span>
                  {" "}
                  ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
                </span>
              </div>

              {reviewMessage && <div className="listing-review-success">{reviewMessage}</div>}
              {reviewError && <div className="listing-review-error">{reviewError}</div>}

              <form onSubmit={submitReview} className="listing-review-form">
                <input
                  name="name"
                  placeholder="Your name"
                  value={reviewForm.name}
                  onChange={updateReviewForm}
                  required
                />

                <select name="rating" value={reviewForm.rating} onChange={updateReviewForm}>
                  <option value="5">⭐⭐⭐⭐⭐ 5</option>
                  <option value="4">⭐⭐⭐⭐ 4</option>
                  <option value="3">⭐⭐⭐ 3</option>
                  <option value="2">⭐⭐ 2</option>
                  <option value="1">⭐ 1</option>
                </select>

                <textarea
                  name="comment"
                  placeholder="Write your review..."
                  rows="4"
                  value={reviewForm.comment}
                  onChange={updateReviewForm}
                  required
                />

                <button type="submit">Submit Review</button>
              </form>

              <div className="listing-review-list">
                {reviews.length === 0 && <p>No reviews yet.</p>}

                {reviews.map((review) => (
                  <div key={review._id} className="listing-review-card">
                    <div className="listing-review-top">
                      <strong>{review.name}</strong>
                      <span>{"⭐".repeat(review.rating)}</span>
                    </div>

                    <p>{review.comment}</p>

                    <small>
                      {review.createdAt
                        ? new Date(review.createdAt).toLocaleDateString()
                        : ""}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}