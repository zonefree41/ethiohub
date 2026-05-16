import React from "react";
import { apiGet, apiPost } from "../api/http";
import "./Listing.css";

export default function Listing() {
  const id = window.location.pathname.split("/").pop();

  const [listing, setListing] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  const [reviews, setReviews] = React.useState([]);
  const [averageRating, setAverageRating] = React.useState(0);
  const [totalReviews, setTotalReviews] = React.useState(0);
  const [reviewMessage, setReviewMessage] = React.useState("");
  const [reviewError, setReviewError] = React.useState("");

  const [reviewForm, setReviewForm] = React.useState({
    name: "",
    rating: "5",
    comment: "",
  });

  React.useEffect(() => {
    let alive = true;

    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const data = await apiGet(`/api/listings/${id}`);

        if (alive) {
          setListing(data || null);
        }
      } catch (err) {
        if (alive) {
          setError(err.message || "Failed to load listing");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      alive = false;
    };
  }, [id]);

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
    loadReviews();
  }, [id]);

  React.useEffect(() => {
    if (listing?.title) {
      document.title = `${listing.title} | HubEthio`;
    } else {
      document.title = "Business | HubEthio";
    }
  }, [listing]);

  function updateReviewForm(e) {
    setReviewForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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

  if (loading) {
    return (
      <main className="listing-page">
        <div className="listing-state-card">
          <div className="spinner"></div>
          <h2>Loading business...</h2>
          <p>Please wait while we open this listing.</p>
        </div>
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
  const whatsapp = String(listing.whatsapp || listing.phone || "").replace(
    /\D/g,
    ""
  );

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
                    apiPost(`/api/track/${listing._id}`, {
                      type: "directions",
                    })
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

              {reviewMessage && (
                <div className="listing-review-success">{reviewMessage}</div>
              )}

              {reviewError && (
                <div className="listing-review-error">{reviewError}</div>
              )}

              <form onSubmit={submitReview} className="listing-review-form">
                <input
                  name="name"
                  placeholder="Your name"
                  value={reviewForm.name}
                  onChange={updateReviewForm}
                  required
                />

                <select
                  name="rating"
                  value={reviewForm.rating}
                  onChange={updateReviewForm}
                >
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
      </div>
    </main>
  );
}