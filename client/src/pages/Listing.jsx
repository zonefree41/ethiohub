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

const [
  immigrationConsultationForm,
  setImmigrationConsultationForm,
] = React.useState({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  caseType: "",
  preferredConsultationDate: "",
  preferredConsultationTime: "",
  preferredContactMethod: "Either",
  message: "",
});

const [
  submittingImmigrationConsultation,
  setSubmittingImmigrationConsultation,
] = React.useState(false);

const [
  immigrationConsultationMessage,
  setImmigrationConsultationMessage,
] = React.useState("");

const [
  immigrationConsultationError,
  setImmigrationConsultationError,
] = React.useState("");

const [
  insuranceConsultationForm,
  setInsuranceConsultationForm,
] = React.useState({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  serviceType: "",
  preferredConsultationDate: "",
  preferredConsultationTime: "",
  preferredContactMethod: "Either",
  message: "",
});

const [
  submittingInsuranceConsultation,
  setSubmittingInsuranceConsultation,
] = React.useState(false);

const [
  insuranceConsultationMessage,
  setInsuranceConsultationMessage,
] = React.useState("");

const [
  insuranceConsultationError,
  setInsuranceConsultationError,
] = React.useState("");

const [
  taxServiceRequestForm,
  setTaxServiceRequestForm,
] = React.useState({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  serviceType: "",
  preferredAppointmentDate: "",
  preferredAppointmentTime: "",
  preferredContactMethod: "Either",
  message: "",
});

const [
  submittingTaxServiceRequest,
  setSubmittingTaxServiceRequest,
] = React.useState(false);

const [
  taxServiceRequestMessage,
  setTaxServiceRequestMessage,
] = React.useState("");

const [
  taxServiceRequestError,
  setTaxServiceRequestError,
] = React.useState("");

const [housingInquiryForm, setHousingInquiryForm] =
  React.useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    desiredMoveInDate: "",
    occupants: 1,
    message: "",
  });

const [
  submittingHousingInquiry,
  setSubmittingHousingInquiry,
] = React.useState(false);

const [
  housingInquiryMessage,
  setHousingInquiryMessage,
] = React.useState("");

const [
  housingInquiryError,
  setHousingInquiryError,
] = React.useState("");

const [beautyAppointmentForm, setBeautyAppointmentForm] =
  React.useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    service: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });

const [
  submittingBeautyAppointment,
  setSubmittingBeautyAppointment,
] = React.useState(false);

const [
  beautyAppointmentMessage,
  setBeautyAppointmentMessage,
] = React.useState("");

const [
  beautyAppointmentError,
  setBeautyAppointmentError,
] = React.useState("");

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

  const [isQuoteModalOpen, setIsQuoteModalOpen] =
  React.useState(false);

const [quoteSubmitting, setQuoteSubmitting] =
  React.useState(false);

const [quoteMessage, setQuoteMessage] =
  React.useState("");

const [quoteError, setQuoteError] =
  React.useState("");

const [quoteForm, setQuoteForm] = React.useState({
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  pickupAddress: "",
  deliveryAddress: "",
  requestedDate: "",
  requestedTime: "",
  serviceType: "Other",
  cargoDetails: "",
  cargoPhotos: [],
});

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

  function updateQuoteForm(e) {
  const { name, value } = e.target;

  setQuoteForm((prev) => ({
    ...prev,
    [name]: value,
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

  async function submitImmigrationConsultation(e) {
  e.preventDefault();

  try {
    setSubmittingImmigrationConsultation(true);
    setImmigrationConsultationMessage("");
    setImmigrationConsultationError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/immigration-consultation-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing._id,
          ...immigrationConsultationForm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to submit consultation request."
      );
    }

    setImmigrationConsultationMessage(
      "Consultation request submitted successfully!"
    );

    setImmigrationConsultationForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      caseType: "",
      preferredConsultationDate: "",
      preferredConsultationTime: "",
      preferredContactMethod: "Either",
      message: "",
    });
  } catch (err) {
    setImmigrationConsultationError(
      err.message ||
        "Failed to submit consultation request."
    );
  } finally {
    setSubmittingImmigrationConsultation(false);
  }
}

async function submitInsuranceConsultation(e) {
  e.preventDefault();

  try {
    setSubmittingInsuranceConsultation(true);
    setInsuranceConsultationMessage("");
    setInsuranceConsultationError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/insurance-consultation-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing._id,
          ...insuranceConsultationForm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to submit Insurance consultation request."
      );
    }

    setInsuranceConsultationMessage(
      "Insurance & Financial Services consultation request submitted successfully!"
    );

    setInsuranceConsultationForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      serviceType: "",
      preferredConsultationDate: "",
      preferredConsultationTime: "",
      preferredContactMethod: "Either",
      message: "",
    });
  } catch (err) {
    setInsuranceConsultationError(
      err.message ||
        "Failed to submit Insurance consultation request."
    );
  } finally {
    setSubmittingInsuranceConsultation(false);
  }
}

  async function submitHousingInquiry(e) {
  e.preventDefault();

  try {
    setSubmittingHousingInquiry(true);
    setHousingInquiryMessage("");
    setHousingInquiryError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/housing-inquiries`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing._id,
          ...housingInquiryForm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to submit Housing inquiry."
      );
    }

    setHousingInquiryMessage(
      "Housing inquiry submitted successfully!"
    );

    setHousingInquiryForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      desiredMoveInDate: "",
      occupants: 1,
      message: "",
    });
  } catch (err) {
    setHousingInquiryError(
      err.message ||
        "Failed to submit Housing inquiry."
    );
  } finally {
    setSubmittingHousingInquiry(false);
  }
}

async function submitTaxServiceRequest(e) {
  e.preventDefault();

  try {
    setSubmittingTaxServiceRequest(true);
    setTaxServiceRequestMessage("");
    setTaxServiceRequestError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/tax-service-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing._id,
          ...taxServiceRequestForm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to submit Tax service request."
      );
    }

    setTaxServiceRequestMessage(
      "Tax service request submitted successfully!"
    );

    setTaxServiceRequestForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      serviceType: "",
      preferredAppointmentDate: "",
      preferredAppointmentTime: "",
      preferredContactMethod: "Either",
      message: "",
    });
  } catch (err) {
    setTaxServiceRequestError(
      err.message ||
        "Failed to submit Tax service request."
    );
  } finally {
    setSubmittingTaxServiceRequest(false);
  }
}

  async function submitBeautyAppointment(e) {
  e.preventDefault();

  try {
    setSubmittingBeautyAppointment(true);
    setBeautyAppointmentMessage("");
    setBeautyAppointmentError("");

    const response = await fetch(
      `${
        import.meta.env.VITE_API_URL ||
        "http://localhost:5001"
      }/api/beauty-appointment-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId: listing._id,
          ...beautyAppointmentForm,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to submit appointment request."
      );
    }

    setBeautyAppointmentMessage(
      "Appointment request submitted successfully!"
    );

    setBeautyAppointmentForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      service: "",
      preferredDate: "",
      preferredTime: "",
      notes: "",
    });
  } catch (err) {
    setBeautyAppointmentError(
      err.message ||
        "Failed to submit appointment request."
    );
  } finally {
    setSubmittingBeautyAppointment(false);
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

  async function submitQuoteRequest(e) {
  e.preventDefault();

  setQuoteSubmitting(true);
  setQuoteMessage("");
  setQuoteError("");

  try {
    await apiPost("/api/transportation-requests", {
      listingId: listing._id,

      customerName: quoteForm.customerName,
      customerEmail: quoteForm.customerEmail,
      customerPhone: quoteForm.customerPhone,

      pickupAddress: quoteForm.pickupAddress,
      deliveryAddress: quoteForm.deliveryAddress,

      requestedDate: quoteForm.requestedDate,
      requestedTime: quoteForm.requestedTime,

      serviceType: quoteForm.serviceType,
      cargoDetails: quoteForm.cargoDetails,

      cargoPhotos: [],
    });

    setQuoteMessage(
      "✅ Your quote request has been sent successfully."
    );

    setQuoteForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      pickupAddress: "",
      deliveryAddress: "",
      requestedDate: "",
      requestedTime: "",
      serviceType: "Other",
      cargoDetails: "",
      cargoPhotos: [],
    });

    setTimeout(() => {
      setIsQuoteModalOpen(false);
    }, 1500);
  } catch (err) {
    setQuoteError(
      err.message || "Failed to submit quote request."
    );
  } finally {
    setQuoteSubmitting(false);
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
    item?.furnished ||

    item?.privateEntrance ||
    item?.bathroomType ||
    item?.kitchenAccess ||
    item?.laundryAccess ||
    item?.maximumOccupants ||
    item?.ownerLivesOnProperty ||
    item?.housingNotes ||

    (item?.livingEnvironment?.length ?? 0) > 0 ||
    (item?.idealFor?.length ?? 0) > 0
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
    "Cargo & Freight (Sprinter Van)",
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

  const isImmigrationListing =
  listing.categoryId?.slug ===
  "immigration-lawyer";

  const isInsuranceListing =
  listing.categoryId?.slug ===
  "insurance-agent";

  const isTaxListing =
listing.categoryId?.slug ===
"tax-preparer";

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

      {Array.isArray(listing.livingEnvironment) &&
  listing.livingEnvironment.length > 0 && (
    <div className="listing-housing-feature-section">
      <h3>🏡 Living Environment</h3>

      <div className="listing-housing-tags">
        {listing.livingEnvironment.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )}

{Array.isArray(listing.idealFor) &&
  listing.idealFor.length > 0 && (
    <div className="listing-housing-feature-section">
      <h3>👥 Ideal For</h3>

      <div className="listing-housing-tags">
        {listing.idealFor.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )}

{listing.housingNotes && (
  <div className="listing-housing-feature-section">
    <h3>📝 Additional Housing Information</h3>

    <p className="listing-housing-notes">
      {listing.housingNotes}
    </p>
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

      {listing.privateEntrance && (
  <div className="listing-rental-item">
    <span>🚪</span>
    <div>
      <strong>Private Entrance</strong>
      <p>Yes</p>
    </div>
  </div>
)}

{listing.kitchenAccess && (
  <div className="listing-rental-item">
    <span>🍳</span>
    <div>
      <strong>Kitchen</strong>
      <p>Available</p>
    </div>
  </div>
)}

{listing.laundryAccess && (
  <div className="listing-rental-item">
    <span>🧺</span>
    <div>
      <strong>Laundry</strong>
      <p>Available</p>
    </div>
  </div>
)}

{listing.bathroomType && (
  <div className="listing-rental-item">
    <span>🚿</span>
    <div>
      <strong>Bathroom</strong>
      <p>{listing.bathroomType}</p>
    </div>
  </div>
)}

{listing.maximumOccupants && (
  <div className="listing-rental-item">
    <span>👥</span>
    <div>
      <strong>Maximum Occupants</strong>
      <p>{listing.maximumOccupants}</p>
    </div>
  </div>
)}

{listing.ownerLivesOnProperty && (
  <div className="listing-rental-item">
    <span>🏡</span>
    <div>
      <strong>Owner Lives Here</strong>
      <p>Yes</p>
    </div>
  </div>
)}

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

{isHousingListing &&
  listing.availabilityStatus === "rented" && (
    <section className="listing-housing-inquiry">
      <div className="listing-housing-inquiry-header">
        <h3>🔴 Currently Rented</h3>
        <p>
          This property is currently marked as rented
          and is not accepting new housing inquiries.
        </p>
      </div>
    </section>
)}

{isHousingListing &&
  listing.ownerId &&
  listing.availabilityStatus !== "rented" && (
  <section className="listing-housing-inquiry">
    <div className="listing-housing-inquiry-header">
      <h3>🏠 Send Housing Inquiry</h3>

      <p>
        Interested in this property? Send your
        inquiry directly to {listing.title}.
      </p>
    </div>

    {housingInquiryMessage && (
      <div className="listing-housing-inquiry-success">
        {housingInquiryMessage}
      </div>
    )}

    {housingInquiryError && (
      <div className="listing-housing-inquiry-error">
        {housingInquiryError}
      </div>
    )}

    <form
      className="listing-housing-inquiry-form"
      onSubmit={submitHousingInquiry}
    >
      <div className="listing-housing-inquiry-grid">
        <label>
          Your Name
          <input
            type="text"
            required
            value={housingInquiryForm.customerName}
            onChange={(e) =>
              setHousingInquiryForm((current) => ({
                ...current,
                customerName: e.target.value,
              }))
            }
            placeholder="Full name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            required
            value={housingInquiryForm.customerEmail}
            onChange={(e) =>
              setHousingInquiryForm((current) => ({
                ...current,
                customerEmail: e.target.value,
              }))
            }
            placeholder="you@example.com"
          />
        </label>

        <label>
          Phone
          <input
            type="tel"
            required
            value={housingInquiryForm.customerPhone}
            onChange={(e) =>
              setHousingInquiryForm((current) => ({
                ...current,
                customerPhone: e.target.value,
              }))
            }
            placeholder="Phone number"
          />
        </label>

        <label>
          Desired Move-In Date
          <input
            type="date"
            required
            value={housingInquiryForm.desiredMoveInDate}
            onChange={(e) =>
              setHousingInquiryForm((current) => ({
                ...current,
                desiredMoveInDate: e.target.value,
              }))
            }
          />
        </label>

        <label>
          Occupants
          <input
            type="number"
            min="1"
            required
            value={housingInquiryForm.occupants}
            onChange={(e) =>
              setHousingInquiryForm((current) => ({
                ...current,
                occupants: e.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="listing-housing-inquiry-message">
        Message
        <textarea
          rows="4"
          value={housingInquiryForm.message}
          onChange={(e) =>
            setHousingInquiryForm((current) => ({
              ...current,
              message: e.target.value,
            }))
          }
          placeholder="Tell the property owner about your housing needs."
        />
      </label>

      <button
        type="submit"
        className="listing-housing-inquiry-submit"
        disabled={submittingHousingInquiry}
      >
        {submittingHousingInquiry
          ? "Sending Inquiry..."
          : "Send Housing Inquiry"}
      </button>

      <p className="listing-housing-inquiry-disclaimer">
        This is an inquiry only. The property owner
        will review your request and contact you
        regarding availability and next steps.
      </p>

          </form>
  </section>
)}

{isImmigrationListing && listing.ownerId && (
  <section className="listing-immigration-consultation">
    <div className="listing-immigration-consultation-header">
      <h3>⚖️ Request Immigration Consultation</h3>

      <p>
        Need help with an immigration matter? Send a
        consultation request directly to {listing.title}.
      </p>
    </div>

    {immigrationConsultationMessage && (
  <div className="listing-immigration-consultation-success">
    {immigrationConsultationMessage}
  </div>
)}

{immigrationConsultationError && (
  <div className="listing-immigration-consultation-error">
    {immigrationConsultationError}
  </div>
)}

    <form
      className="listing-immigration-consultation-form"
      onSubmit={submitImmigrationConsultation}
    >
      <label>
        Your Name
        <input
          type="text"
          required
          value={immigrationConsultationForm.customerName}
          onChange={(e) =>
            setImmigrationConsultationForm((current) => ({
              ...current,
              customerName: e.target.value,
            }))
          }
          placeholder="Full name"
        />
      </label>

      <label>
        Email
        <input
  type="email"
  inputMode="email"
  autoComplete="email"
  required
  value={immigrationConsultationForm.customerEmail}
          onChange={(e) =>
            setImmigrationConsultationForm((current) => ({
              ...current,
              customerEmail: e.target.value,
            }))
          }
          placeholder="you@example.com"
        />
      </label>

      <label>
        Phone
        <input
  type="tel"
  inputMode="tel"
  autoComplete="tel"
  required
  value={immigrationConsultationForm.customerPhone}
          onChange={(e) =>
            setImmigrationConsultationForm((current) => ({
              ...current,
              customerPhone: e.target.value,
            }))
          }
          placeholder="Phone number"
        />
      </label>

      <label>
  Case Type
  <select
  required
  value={immigrationConsultationForm.caseType}
  onChange={(e) =>
    setImmigrationConsultationForm((current) => ({
      ...current,
      caseType: e.target.value,
    }))
  }
>
  <option value="">Select case type</option>

  <option value="Family Immigration">
    Family Immigration
  </option>

  <option value="Marriage / Fiancé Visa">
    Marriage / Fiancé Visa
  </option>

  <option value="Green Card / Adjustment of Status">
    Green Card / Adjustment of Status
  </option>

  <option value="Citizenship / Naturalization">
    Citizenship / Naturalization
  </option>

  <option value="Asylum">
    Asylum
  </option>

  <option value="Work Visa / Employment Immigration">
    Work Visa / Employment Immigration
  </option>

  <option value="Student Visa">
    Student Visa
  </option>

  <option value="Removal / Deportation Defense">
    Removal / Deportation Defense
  </option>

  <option value="TPS">
    Temporary Protected Status (TPS)
  </option>

  <option value="DACA">
    DACA
  </option>

  <option value="Humanitarian Immigration">
    Humanitarian Immigration
  </option>

  <option value="Immigration Appeal">
    Immigration Appeal
  </option>

  <option value="Visa / Consular Processing">
    Visa / Consular Processing
  </option>

  <option value="Other Immigration Matter">
    Other Immigration Matter
  </option>
</select>
</label>

<label>
  Preferred Consultation Date
  <input
    type="date"
    min={new Date().toISOString().split("T")[0]}
    value={
      immigrationConsultationForm.preferredConsultationDate
    }
    onChange={(e) =>
      setImmigrationConsultationForm((current) => ({
        ...current,
        preferredConsultationDate: e.target.value,
      }))
    }
  />
</label>

<label>
  Preferred Consultation Time
  <input
    type="time"
    value={
      immigrationConsultationForm.preferredConsultationTime
    }
    onChange={(e) =>
      setImmigrationConsultationForm((current) => ({
        ...current,
        preferredConsultationTime: e.target.value,
      }))
    }
  />
</label>

<label>
  Preferred Contact Method
  <select
    value={
      immigrationConsultationForm.preferredContactMethod
    }
    onChange={(e) =>
      setImmigrationConsultationForm((current) => ({
        ...current,
        preferredContactMethod: e.target.value,
      }))
    }
  >
    <option value="Either">Either</option>
    <option value="Phone">Phone</option>
    <option value="Email">Email</option>
    <option value="WhatsApp">WhatsApp</option>
  </select>
</label>

<label>
  Message
  <textarea
    rows="4"
    value={immigrationConsultationForm.message}
    onChange={(e) =>
      setImmigrationConsultationForm((current) => ({
        ...current,
        message: e.target.value,
      }))
    }
    placeholder="Briefly describe what you would like to discuss with the immigration lawyer."
  />
</label>

<button
  type="submit"
  className="listing-immigration-consultation-submit"
  disabled={submittingImmigrationConsultation}
>
  {submittingImmigrationConsultation
    ? "Sending Request..."
    : "Request Consultation"}
</button>
    </form>
  </section>
)}

{isInsuranceListing && listing.ownerId && (
  <section className="listing-insurance-consultation">
    <div className="listing-insurance-consultation-header">
      <h3>
        🛡️ Request Insurance & Financial Consultation
      </h3>

      <p>
        Looking for insurance protection or financial
        planning guidance? Send a consultation request
        directly to {listing.title}.
      </p>
    </div>

    {insuranceConsultationMessage && (
      <div className="listing-insurance-consultation-success">
        {insuranceConsultationMessage}
      </div>
    )}

    {insuranceConsultationError && (
      <div className="listing-insurance-consultation-error">
        {insuranceConsultationError}
      </div>
    )}

    <form
      className="listing-insurance-consultation-form"
      onSubmit={submitInsuranceConsultation}
    >
      <label>
        Your Name
        <input
          type="text"
          required
          value={insuranceConsultationForm.customerName}
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              customerName: e.target.value,
            }))
          }
          placeholder="Full name"
        />
      </label>

      <label>
        Email
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={insuranceConsultationForm.customerEmail}
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              customerEmail: e.target.value,
            }))
          }
          placeholder="you@example.com"
        />
      </label>

      <label>
        Phone
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={insuranceConsultationForm.customerPhone}
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              customerPhone: e.target.value,
            }))
          }
          placeholder="Phone number"
        />
      </label>

      <label>
        Service Needed
        <select
          required
          value={insuranceConsultationForm.serviceType}
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              serviceType: e.target.value,
            }))
          }
        >
          <option value="">
            Select service
          </option>

          <option value="Life Insurance">
            Life Insurance
          </option>

          <option value="Disability Income Protection">
            Disability Income Protection
          </option>

          <option value="Family Protection">
            Family Protection
          </option>

          <option value="Business Owner Protection">
            Business Owner Protection
          </option>

          <option value="Financial Planning">
            Financial Planning
          </option>

          <option value="Retirement / Long-Term Planning">
            Retirement / Long-Term Planning
          </option>

          <option value="Other">
            Other
          </option>
        </select>
      </label>

      <label>
        Preferred Consultation Date
        <input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={
            insuranceConsultationForm
              .preferredConsultationDate
          }
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              preferredConsultationDate:
                e.target.value,
            }))
          }
        />
      </label>

      <label>
        Preferred Consultation Time
        <input
          type="time"
          value={
            insuranceConsultationForm
              .preferredConsultationTime
          }
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              preferredConsultationTime:
                e.target.value,
            }))
          }
        />
      </label>

      <label>
        Preferred Contact Method
        <select
          value={
            insuranceConsultationForm
              .preferredContactMethod
          }
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              preferredContactMethod:
                e.target.value,
            }))
          }
        >
          <option value="Either">
            Either
          </option>

          <option value="Phone">
            Phone
          </option>

          <option value="Email">
            Email
          </option>

          <option value="WhatsApp">
            WhatsApp
          </option>
        </select>
      </label>

      <label>
        Message
        <textarea
          rows="4"
          value={insuranceConsultationForm.message}
          onChange={(e) =>
            setInsuranceConsultationForm((current) => ({
              ...current,
              message: e.target.value,
            }))
          }
          placeholder="Briefly describe what you would like to discuss."
        />
      </label>

      <button
        type="submit"
        className="listing-insurance-consultation-submit"
        disabled={submittingInsuranceConsultation}
      >
        {submittingInsuranceConsultation
          ? "Sending Request..."
          : "Request Consultation"}
      </button>

      <p className="listing-insurance-consultation-disclaimer">
        HubEthio connects customers with independent
        insurance and financial service providers.
        Product availability, pricing, eligibility,
        coverage, and financial recommendations are
        provided by the business.
      </p>
    </form>
  </section>
)}

{isTaxListing && listing.ownerId && (
  <section className="listing-insurance-consultation">
    <div className="listing-insurance-consultation-header">
      <h3>
        🧾 Request Tax Service / Consultation
      </h3>

      <p>
        Need help with tax preparation, planning,
        bookkeeping, or another tax service? Send a
        request directly to {listing.title}.
      </p>
    </div>

    {taxServiceRequestMessage && (
      <div className="listing-insurance-consultation-success">
        {taxServiceRequestMessage}
      </div>
    )}

    {taxServiceRequestError && (
      <div className="listing-insurance-consultation-error">
        {taxServiceRequestError}
      </div>
    )}

    <form
      className="listing-insurance-consultation-form"
      onSubmit={submitTaxServiceRequest}
    >
      <label>
        Your Name
        <input
          type="text"
          required
          value={taxServiceRequestForm.customerName}
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              customerName: e.target.value,
            }))
          }
          placeholder="Full name"
        />
      </label>

      <label>
        Email
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={taxServiceRequestForm.customerEmail}
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              customerEmail: e.target.value,
            }))
          }
          placeholder="you@example.com"
        />
      </label>

      <label>
        Phone
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          value={taxServiceRequestForm.customerPhone}
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              customerPhone: e.target.value,
            }))
          }
          placeholder="Phone number"
        />
      </label>

      <label>
        Service Needed
        <select
          required
          value={taxServiceRequestForm.serviceType}
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              serviceType: e.target.value,
            }))
          }
        >
          <option value="">
            Select service
          </option>

          <option value="Individual Tax Return">
            Individual Tax Return
          </option>

          <option value="Business Tax Return">
            Business Tax Return
          </option>

          <option value="Tax Consultation">
            Tax Consultation
          </option>

          <option value="Bookkeeping / Accounting">
            Bookkeeping / Accounting
          </option>

          <option value="Tax Planning">
            Tax Planning
          </option>

          <option value="Prior-Year / Amended Return">
            Prior-Year / Amended Return
          </option>

          <option value="Other">
            Other
          </option>
        </select>
      </label>

      <label>
        Preferred Appointment Date
        <input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={
            taxServiceRequestForm.preferredAppointmentDate
          }
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              preferredAppointmentDate: e.target.value,
            }))
          }
        />
      </label>

      <label>
        Preferred Appointment Time
        <input
          type="time"
          value={
            taxServiceRequestForm.preferredAppointmentTime
          }
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              preferredAppointmentTime: e.target.value,
            }))
          }
        />
      </label>

      <label>
        Preferred Contact Method
        <select
          value={
            taxServiceRequestForm.preferredContactMethod
          }
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              preferredContactMethod: e.target.value,
            }))
          }
        >
          <option value="Either">Either</option>
          <option value="Phone">Phone</option>
          <option value="Email">Email</option>
          <option value="WhatsApp">WhatsApp</option>
        </select>
      </label>

      <label>
        Message
        <textarea
          rows="4"
          value={taxServiceRequestForm.message}
          onChange={(e) =>
            setTaxServiceRequestForm((current) => ({
              ...current,
              message: e.target.value,
            }))
          }
          placeholder="Briefly describe the tax service or assistance you need."
        />
      </label>

      <button
        type="submit"
        className="listing-insurance-consultation-submit"
        disabled={submittingTaxServiceRequest}
      >
        {submittingTaxServiceRequest
          ? "Sending Request..."
          : "Request Tax Service"}
      </button>

      <p className="listing-insurance-consultation-disclaimer">
        HubEthio connects customers with independent tax
        professionals. Tax preparation, filing, advice,
        pricing, and document requirements are provided
        directly by the business.
      </p>
    </form>
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

      {listing.transportCargoLength && (
  <div className="listing-rental-item">
    <span>📏</span>
    <div>
      <strong>Cargo Length</strong>
      <p>{listing.transportCargoLength} ft</p>
    </div>
  </div>
)}

{listing.transportCargoWidth && (
  <div className="listing-rental-item">
    <span>↔️</span>
    <div>
      <strong>Cargo Width</strong>
      <p>{listing.transportCargoWidth} ft</p>
    </div>
  </div>
)}

{listing.transportCargoHeight && (
  <div className="listing-rental-item">
    <span>↕️</span>
    <div>
      <strong>Cargo Height</strong>
      <p>{listing.transportCargoHeight} ft</p>
    </div>
  </div>
)}

{listing.transportPalletCapacity && (
  <div className="listing-rental-item">
    <span>🧱</span>
    <div>
      <strong>Pallet Capacity</strong>
      <p>{listing.transportPalletCapacity}</p>
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

{listing.subcategory === "Cargo & Freight (Sprinter Van)" &&
  (
    listing.transportLiftgateAvailable ||
    listing.transportResidentialDelivery ||
    listing.transportCommercialDelivery ||
    listing.transportWarehousePickup ||
    listing.transportWarehouseDelivery ||
    listing.transportDockHighDelivery ||
    listing.transportInsideDelivery ||
    listing.transportWhiteGloveService ||
    listing.transportRefrigeratedTransport
  ) && (
  <section className="listing-rental-card">
    <h2>🚚 Delivery Services</h2>

    <div className="listing-rental-grid">
      {listing.transportLiftgateAvailable && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Liftgate Available</div>
        </div>
      )}

      {listing.transportResidentialDelivery && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Residential Delivery</div>
        </div>
      )}

      {listing.transportCommercialDelivery && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Commercial Delivery</div>
        </div>
      )}

      {listing.transportWarehousePickup && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Warehouse Pickup</div>
        </div>
      )}

      {listing.transportWarehouseDelivery && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Warehouse Delivery</div>
        </div>
      )}

      {listing.transportDockHighDelivery && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Dock High Delivery</div>
        </div>
      )}

      {listing.transportInsideDelivery && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Inside Delivery</div>
        </div>
      )}

      {listing.transportWhiteGloveService && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>White Glove Service</div>
        </div>
      )}

      {listing.transportRefrigeratedTransport && (
        <div className="listing-rental-item">
          <span>✅</span>
          <div>Refrigerated Transport</div>
        </div>
      )}
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

{listing.categoryId?.slug === "beauty-wellness" && (
  <section className="listing-beauty-request">
    <div className="listing-beauty-request-header">
      <h3>💄 Request an Appointment</h3>
      <p>
        Send an appointment request directly to{" "}
        {listing.title}.
      </p>
    </div>

    {beautyAppointmentMessage && (
      <div className="listing-beauty-request-success">
        {beautyAppointmentMessage}
      </div>
    )}

    {beautyAppointmentError && (
      <div className="listing-beauty-request-error">
        {beautyAppointmentError}
      </div>
    )}

    <form
      className="listing-beauty-request-form"
      onSubmit={submitBeautyAppointment}
    >
      <div className="listing-beauty-request-grid">
        <label>
          Your Name
          <input
            type="text"
            required
            value={beautyAppointmentForm.customerName}
            onChange={(e) =>
              setBeautyAppointmentForm((current) => ({
                ...current,
                customerName: e.target.value,
              }))
            }
            placeholder="Full name"
          />
        </label>

        <label>
          Email
          <input
            type="email"
            required
            value={beautyAppointmentForm.customerEmail}
            onChange={(e) =>
              setBeautyAppointmentForm((current) => ({
                ...current,
                customerEmail: e.target.value,
              }))
            }
            placeholder="you@example.com"
          />
        </label>

        <label>
          Phone
          <input
            type="tel"
            required
            value={beautyAppointmentForm.customerPhone}
            onChange={(e) =>
              setBeautyAppointmentForm((current) => ({
                ...current,
                customerPhone: e.target.value,
              }))
            }
            placeholder="Phone number"
          />
        </label>

        <label>
          Service
          {Array.isArray(listing.beautyServices) &&
          listing.beautyServices.length > 0 ? (
            <select
              required
              value={beautyAppointmentForm.service}
              onChange={(e) =>
                setBeautyAppointmentForm((current) => ({
                  ...current,
                  service: e.target.value,
                }))
              }
            >
              <option value="">
                Select a service
              </option>

              {listing.beautyServices.map(
                (service, index) => (
                  <option
                    key={`${service}-${index}`}
                    value={service}
                  >
                    {service}
                  </option>
                )
              )}
            </select>
          ) : (
            <input
              type="text"
              required
              value={beautyAppointmentForm.service}
              onChange={(e) =>
                setBeautyAppointmentForm((current) => ({
                  ...current,
                  service: e.target.value,
                }))
              }
              placeholder="Service requested"
            />
          )}
        </label>

        <label>
          Preferred Date
          <input
            type="date"
            required
            value={beautyAppointmentForm.preferredDate}
            onChange={(e) =>
              setBeautyAppointmentForm((current) => ({
                ...current,
                preferredDate: e.target.value,
              }))
            }
          />
        </label>

        <label>
          Preferred Time
          <input
            type="time"
            required
            value={beautyAppointmentForm.preferredTime}
            onChange={(e) =>
              setBeautyAppointmentForm((current) => ({
                ...current,
                preferredTime: e.target.value,
              }))
            }
          />
        </label>
      </div>

      <label className="listing-beauty-request-notes">
        Additional Notes
        <textarea
          rows="4"
          value={beautyAppointmentForm.notes}
          onChange={(e) =>
            setBeautyAppointmentForm((current) => ({
              ...current,
              notes: e.target.value,
            }))
          }
          placeholder="Anything the business should know?"
        />
      </label>

      <button
        type="submit"
        className="listing-beauty-request-submit"
        disabled={submittingBeautyAppointment}
      >
        {submittingBeautyAppointment
          ? "Sending Request..."
          : "Request Appointment"}
      </button>

      <p className="listing-beauty-request-disclaimer">
        This is an appointment request. The business
        must confirm your requested date and time.
      </p>
    </form>
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

  {isTransportationListing && listing.ownerId && (
    <button
      type="button"
      className="listing-quote-btn"
      onClick={() => {
  setQuoteMessage("");
  setQuoteError("");

  setQuoteForm((prev) => ({
    ...prev,
    serviceType: [
      "Furniture Delivery",
      "Package Delivery",
      "Moving Service",
      "Airport Transportation",
      "Freight Delivery",
    ].includes(listing.subcategory)
      ? listing.subcategory
      : "Other",
  }));

  setIsQuoteModalOpen(true);
}}
    >
      🚚 Request a Quote
    </button>
  )}

  {listing.categoryId?.slug === "travel-tours" &&
  listing.ownerId && (
    <a
      href={`/submit-travel-request?listing=${listing._id}`}
      className="listing-quote-btn"
    >
      ✈️ Request Travel Quote
    </a>
  )}
  <button
    type="button"
    className="listing-save-btn"
    onClick={toggleFavorite}
  >
    {isSaved ? "Saved ❤️" : "Save Business 🤍"}
  </button>

  <button
    type="button"
    className="listing-share-btn"
    onClick={shareBusiness}
  >
    Share 🔗
  </button>

  {phone && (
    <a href={`tel:${phone}`} className="listing-contact-btn">
      📞 Call
    </a>
  )}
  {whatsapp && (
    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="listing-contact-btn">
      💬 WhatsApp
    </a>
  )}
  {address && (
    <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="listing-contact-btn">
      📍 Location
    </a>
  )}
  {listing.website && (
    <a href={listing.website} target="_blank" rel="noreferrer" className="listing-contact-btn">
      🌐 Website
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

        {isQuoteModalOpen && (
          <div
            className="listing-quote-modal-overlay"
            onClick={() => setIsQuoteModalOpen(false)}
          >
            <div
              className="listing-quote-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="listing-quote-modal-close"
                onClick={() => setIsQuoteModalOpen(false)}
              >
                ×
              </button>

              <h2>🚚 Request a Transportation Quote</h2>

              <p className="listing-quote-modal-subtitle">
                Send your service request directly to {listing.title}.
              </p>

              {quoteMessage && (
                <div className="listing-review-success">
                  {quoteMessage}
                </div>
              )}

              {quoteError && (
                <div className="listing-review-error">
                  {quoteError}
                </div>
              )}

              <form className="listing-quote-form" onSubmit={submitQuoteRequest}>
                <div className="listing-quote-grid">
                  <label>
                    Your Name
                    <input
                      type="text"
                      name="customerName"
                      value={quoteForm.customerName}
                      onChange={updateQuoteForm}
                      required
                    />
                  </label>

                  <label>
                    Phone Number
                    <input
                      type="tel"
                      name="customerPhone"
                      value={quoteForm.customerPhone}
                      onChange={updateQuoteForm}
                      required
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      name="customerEmail"
                      value={quoteForm.customerEmail}
                      onChange={updateQuoteForm}
                    />
                  </label>

                  <label>
                    Service Type
                    <select
                      name="serviceType"
                      value={quoteForm.serviceType}
                      onChange={updateQuoteForm}
                    >
                      <option value="Furniture Delivery">
                        Furniture Delivery
                      </option>
                      <option value="Package Delivery">
                        Package Delivery
                      </option>
                      <option value="Moving Service">
                        Moving Service
                      </option>
                      <option value="Airport Transportation">
                        Airport Transportation
                      </option>
                      <option value="Freight Delivery">
                        Freight Delivery
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="listing-quote-full-width">
                    Pickup Address
                    <input
                      type="text"
                      name="pickupAddress"
                      value={quoteForm.pickupAddress}
                      onChange={updateQuoteForm}
                      required
                    />
                  </label>

                  <label className="listing-quote-full-width">
                    Delivery Address
                    <input
                      type="text"
                      name="deliveryAddress"
                      value={quoteForm.deliveryAddress}
                      onChange={updateQuoteForm}
                      required
                    />
                  </label>

                  <label>
                    Requested Date
                    <input
                      type="date"
                      name="requestedDate"
                      value={quoteForm.requestedDate}
                      onChange={updateQuoteForm}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </label>

                  <label>
                    Requested Time
                    <input
                      type="time"
                      name="requestedTime"
                      value={quoteForm.requestedTime}
                      onChange={updateQuoteForm}
                    />
                  </label>

                  <label className="listing-quote-full-width">
                    Cargo Details
                    <textarea
                      name="cargoDetails"
                      value={quoteForm.cargoDetails}
                      onChange={updateQuoteForm}
                      rows="5"
                      placeholder="Describe the cargo, quantity, size, weight, stairs, loading help, or any special instructions."
                      required
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="listing-quote-submit-btn"
                  disabled={quoteSubmitting}
                >
                  {quoteSubmitting
                    ? "Submitting..."
                    : "Submit Quote Request"}
                </button>
              </form>
            </div>
          </div>
        )}

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