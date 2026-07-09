import React from "react";
import { Helmet } from "react-helmet-async";
import { apiGet, apiPost } from "../api/http";
import { trackEvent } from "../utils/analytics.js";
import "./Listing.css";
import { useEffect, useState } from "react";

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
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);

  const [lightboxImages, setLightboxImages] = React.useState([]);
const [lightboxIndex, setLightboxIndex] = React.useState(0);
const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

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

  useEffect(() => {
  if (!isLightboxOpen) return;

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeLightbox();
    }

    if (e.key === "ArrowRight") {
      nextLightboxPhoto();
    }

    if (e.key === "ArrowLeft") {
      prevLightboxPhoto();
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [isLightboxOpen, lightboxIndex, lightboxImages]);

  function openLightbox(images, index = 0) {
  setLightboxImages(images || []);
  setLightboxIndex(index);
  setIsLightboxOpen(true);
}

function closeLightbox() {
  setIsLightboxOpen(false);
}

function nextLightboxPhoto() {
  setLightboxIndex((prev) =>
    lightboxImages.length ? (prev + 1) % lightboxImages.length : 0
  );
}

function prevLightboxPhoto() {
  setLightboxIndex((prev) =>
    lightboxImages.length
      ? (prev - 1 + lightboxImages.length) % lightboxImages.length
      : 0
  );
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

  function nextPhoto() {
  if (!Array.isArray(listing?.propertyImages)) return;

  setActivePhotoIndex((prev) =>
    prev === listing.propertyImages.length - 1 ? 0 : prev + 1
  );
}

function prevPhoto() {
  if (!Array.isArray(listing?.propertyImages)) return;

  setActivePhotoIndex((prev) =>
    prev === 0 ? listing.propertyImages.length - 1 : prev - 1
  );
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

  function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "";

  const number = Number(value);

  if (Number.isNaN(number)) return "";

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function hasRentalDetails(item) {
  return Boolean(
    item?.monthlyRent ||
      item?.bedrooms ||
      item?.bathrooms ||
      item?.squareFeet ||
      item?.securityDeposit ||
      item?.leaseTerm ||
      item?.parking ||
      item?.petsAllowed ||
      item?.utilitiesIncluded ||
      item?.furnished
  );
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

          <p>
  {item.subcategory
    ? `${item.categoryId?.name_en || "Business"} • ${item.subcategory}`
    : item.categoryId?.name_en || "Business"}
</p>

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
    console.log("PUBLIC LISTING:", listing);
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

  const isTransportationListing =
  listing.categoryId?.name_en === "Transportation" ||
  listing.categoryId?.slug === "transportation" ||
  [
    "Airport Transportation",
    "Ethiopian Movers",
    "Furniture Delivery",
    "Package Delivery",
    "Cargo & Freight",
    "Charter & Group Transportation",
  ].includes(listing.subcategory);


  const isHousingListing =
  categoryName === "Housing & Rentals" ||
  [
    "Apartments",
    "Houses",
    "Basement Rentals",
    "Rooms",
    "Roommates",
  ].includes(listing.subcategory);

  const categoryDisplay = listing.subcategory
  ? `${categoryName} • ${listing.subcategory}`
  : categoryName;

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
                  {listing.availabilityStatus === "rented" ? (
  <span className="listing-rented-badge">🔴 Rented</span>
) : (
  <span className="listing-available-badge">🟢 Available</span>
)}
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
  <b>Category:</b> {categoryDisplay}
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

            {isHousingListing && hasRentalDetails(listing) && (
  <section className="listing-rental-details">
    <h3>🏠 Rental Details</h3>

    <div className="listing-rental-grid">
      {listing.monthlyRent && (
        <div className="listing-rental-item">
          <span>💲</span>
          <div>
            <strong>Rent</strong>
            <p>{formatMoney(listing.monthlyRent)}/month</p>
          </div>
        </div>
      )}

      {listing.bedrooms !== null && listing.bedrooms !== undefined && (
        <div className="listing-rental-item">
          <span>🛏️</span>
          <div>
            <strong>Bedrooms</strong>
            <p>{listing.bedrooms}</p>
          </div>
        </div>
      )}

      {listing.bathrooms !== null && listing.bathrooms !== undefined && (
        <div className="listing-rental-item">
          <span>🛁</span>
          <div>
            <strong>Bathrooms</strong>
            <p>{listing.bathrooms}</p>
          </div>
        </div>
      )}

      {listing.squareFeet && (
        <div className="listing-rental-item">
          <span>📐</span>
          <div>
            <strong>Size</strong>
            <p>{Number(listing.squareFeet).toLocaleString()} sq ft</p>
          </div>
        </div>
      )}

      <div className="listing-rental-item">
        <span>🚗</span>
        <div>
          <strong>Parking</strong>
          <p>{listing.parking ? "Available" : "Not listed"}</p>
        </div>
      </div>

      <div className="listing-rental-item">
        <span>🐶</span>
        <div>
          <strong>Pets</strong>
          <p>{listing.petsAllowed ? "Allowed" : "Not listed"}</p>
        </div>
      </div>

      <div className="listing-rental-item">
        <span>💡</span>
        <div>
          <strong>Utilities</strong>
          <p>{listing.utilitiesIncluded ? "Included" : "Not listed"}</p>
        </div>
      </div>

      <div className="listing-rental-item">
        <span>🛋️</span>
        <div>
          <strong>Furnished</strong>
          <p>{listing.furnished ? "Yes" : "No"}</p>
        </div>
      </div>

      {listing.leaseTerm && (
        <div className="listing-rental-item">
          <span>📅</span>
          <div>
            <strong>Lease</strong>
            <p>{listing.leaseTerm}</p>
          </div>
        </div>
      )}

      {listing.securityDeposit && (
        <div className="listing-rental-item">
          <span>💵</span>
          <div>
            <strong>Security Deposit</strong>
            <p>{formatMoney(listing.securityDeposit)}</p>
          </div>
        </div>
      )}
    </div>
  </section>
)}

{isTransportationListing && (
  <section className="listing-rental-card">
    <h2>🚚 Transportation Details</h2>

    <div className="listing-rental-grid">
      {listing.transportVehicleTypes?.length > 0 && (
        <div className="listing-rental-item">
          <span>🚚</span>
          <div>
            <strong>Vehicle Types</strong>
            <p>{listing.transportVehicleTypes.join(" • ")}</p>
          </div>
        </div>
      )}

      {listing.transportServiceArea && (
        <div className="listing-rental-item">
          <span>📍</span>
          <div>
            <strong>Service Area</strong>
            <p>{listing.transportServiceArea}</p>
          </div>
        </div>
      )}

      {listing.transportLocalLongDistance && (
        <div className="listing-rental-item">
          <span>🛣️</span>
          <div>
            <strong>Service Type</strong>
            <p>{listing.transportLocalLongDistance}</p>
          </div>
        </div>
      )}

      {listing.transportMaxLoad && (
        <div className="listing-rental-item">
          <span>📦</span>
          <div>
            <strong>Capacity</strong>
            <p>
  {listing.transportMaxLoad
    ? `${listing.transportMaxLoad} Capacity`
    : "Not specified"}
</p>
          </div>
        </div>
      )}

      <div className="listing-rental-item">
        <span>🕒</span>
        <div>
          <strong>24/7 Service</strong>
          <p className={listing.transportAvailable24_7 ? "service-yes" : "service-no"}>
  {listing.transportAvailable24_7 ? "🟢 Available" : "🔴 Not Available"}
</p>
        </div>
      </div>

      <div className="listing-rental-item">
        <span>✈️</span>
        <div>
          <strong>Airport Service</strong>
          <p className={listing.transportAirportService ? "service-yes" : "service-no"}>
  {listing.transportAirportService ? "🟢 Available" : "🔴 Not Available"}
</p>
        </div>
      </div>

      <div className="listing-rental-item">
        <span>⚡</span>
        <div>
          <strong>Same-Day Service</strong>
          <p className={listing.transportSameDayService ? "service-yes" : "service-no"}>
  {listing.transportSameDayService ? "🟢 Available" : "🔴 Not Available"}
</p>
        </div>
      </div>
    </div>
  </section>
)}

            {(isHousingListing || isTransportationListing) &&
  Array.isArray(listing.propertyImages) &&
  listing.propertyImages.length > 0 && (
    <section className="listing-property-gallery">
      <h3>{isHousingListing ? "Property Photos" : "Vehicle Photos"}</h3>

      <div className="listing-photo-slider">
        <button type="button" onClick={prevPhoto}>
          ←
        </button>

        <button
  type="button"
  className="listing-property-photo"
  onClick={() => openLightbox(listing.propertyImages, activePhotoIndex)}
>
  <img
    src={listing.propertyImages[activePhotoIndex]}
    alt={`${isHousingListing ? "Property" : "Vehicle"} photo ${
      activePhotoIndex + 1
    }`}
  />
</button>

        <button type="button" onClick={nextPhoto}>
          →
        </button>
      </div>

      <div className="listing-photo-thumbnails">
        {listing.propertyImages.map((url, index) => (
          <button
  type="button"
  key={`${url}-${index}`}
  onClick={() => {
    setActivePhotoIndex(index);
    openLightbox(listing.propertyImages, index);
  }}
  className={activePhotoIndex === index ? "active" : ""}
>
  <img src={url} alt={`Thumbnail ${index + 1}`} />
</button>
        ))}
      </div>
    </section>
  )}
{Array.isArray(listing.beautyPhotos) &&
  listing.beautyPhotos.length > 0 && (
    <section className="listing-property-gallery">
      <h3>Beauty Gallery</h3>

      <div className="listing-property-grid">
        {listing.beautyPhotos.map((url, index) => (
          <button
  type="button"
  key={`${url}-${index}`}
  className="listing-property-photo"
  onClick={() => openLightbox(listing.beautyPhotos, index)}
>
  <img src={url} alt={`Beauty photo ${index + 1}`} />
</button>
        ))}
      </div>
    </section>
  )}

  {Array.isArray(listing.beautyBeforeAfter) &&
  listing.beautyBeforeAfter.length > 0 && (
    <section className="listing-before-after">
      <h3>Before & After Results</h3>

      <div className="listing-before-after-grid">
        {listing.beautyBeforeAfter.map((item, index) => (
          <div className="listing-before-after-card" key={index}>
            {item.title && <h4>{item.title}</h4>}

            <div className="listing-before-after-images">
              {item.beforeUrl && (
                <div>
                  <span>Before</span>
                  <button
                    type="button"
                    onClick={() =>
                      openLightbox(
                        [item.beforeUrl, item.afterUrl].filter(Boolean),
                        0
                      )
                    }
                  >
                    <img src={item.beforeUrl} alt="Before result" />
                  </button>
                </div>
              )}

              {item.afterUrl && (
                <div>
                  <span>After</span>
                  <button
                    type="button"
                    onClick={() =>
                      openLightbox(
                        [item.beforeUrl, item.afterUrl].filter(Boolean),
                        item.beforeUrl ? 1 : 0
                      )
                    }
                  >
                    <img src={item.afterUrl} alt="After result" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
)}

{listing.propertyVideoUrl && (
  <section className="listing-property-video">
    <h3>Property Video</h3>

    <video
      src={listing.propertyVideoUrl}
      controls
      className="listing-property-video-player"
    />
  </section>
)}



{listing.beautyVideoUrl && (
  <section className="listing-property-video">
    <h3>Beauty Video</h3>

    <video
      src={listing.beautyVideoUrl}
      controls
      className="listing-property-video-player"
    />
  </section>
)}

{Array.isArray(listing.promotions) &&
  listing.promotions.filter((promo) => promo.isActive !== false).length > 0 && (
    <section className="listing-promotions">
      <h3>🎉 Current Offers</h3>

      <div className="listing-promotions-grid">
        {listing.promotions
          .filter((promo) => promo.isActive !== false)
          .map((promo, index) => (
            <div className="listing-promo-card" key={index}>
              <strong>{promo.title}</strong>

              {promo.description && <p>{promo.description}</p>}

              {promo.validUntil && (
                <small>
                  Valid until{" "}
                  {new Date(promo.validUntil).toLocaleDateString()}
                </small>
              )}
            </div>
          ))}
      </div>
    </section>
)}

{listing.beautyBookingUrl && (
  <section className="listing-beauty-booking">
    <a
      href={listing.beautyBookingUrl}
      target="_blank"
      rel="noreferrer"
      className="listing-book-appointment-btn"
    >
      📅 Book Appointment
    </a>
  </section>
)}

{(listing.beautyInstagram ||
  listing.beautyFacebook ||
  listing.beautyTikTok) && (
  <section className="listing-beauty-socials">
    <h3 className="listing-beauty-social-title">Follow Us</h3>

    <div className="listing-beauty-social-buttons">
      {listing.beautyInstagram && (
        <a href={listing.beautyInstagram} target="_blank" rel="noreferrer">
          📷 Instagram
        </a>
      )}

      {listing.beautyFacebook && (
        <a href={listing.beautyFacebook} target="_blank" rel="noreferrer">
          👍 Facebook
        </a>
      )}

      {listing.beautyTikTok && (
        <a href={listing.beautyTikTok} target="_blank" rel="noreferrer">
          🎵 TikTok
        </a>
      )}
    </div>
  </section>
)}


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
        {isLightboxOpen && lightboxImages.length > 0 && (
  <div className="listing-lightbox" onClick={closeLightbox}>
    <button
      type="button"
      className="listing-lightbox-close"
      onClick={closeLightbox}
    >
      ×
    </button>

    <button
      type="button"
      className="listing-lightbox-arrow left"
      onClick={(e) => {
        e.stopPropagation();
        prevLightboxPhoto();
      }}
    >
      ‹
    </button>

    <img
      src={lightboxImages[lightboxIndex]}
      alt={`Gallery photo ${lightboxIndex + 1}`}
      onClick={(e) => e.stopPropagation()}
       draggable="false"
    />

    <button
      type="button"
      className="listing-lightbox-arrow right"
      onClick={(e) => {
        e.stopPropagation();
        nextLightboxPhoto();
      }}
    >
      ›
    </button>

    <div className="listing-lightbox-count">
      {lightboxIndex + 1} / {lightboxImages.length}
    </div>
  </div>
)}
      </main>
    </>
  );
}